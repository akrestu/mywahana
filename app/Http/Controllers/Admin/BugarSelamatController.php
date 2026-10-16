<?php

namespace App\Http\Controllers\Admin;

use App\Exports\BugarSelamatExport;
use App\Models\BugarSelamat;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class BugarSelamatController extends SiteRecordController
{
    protected function model(): string
    {
        return BugarSelamat::class;
    }

    public function index(Request $request)
    {
        return match ($request->get('view', 'harian')) {
            'harian' => $this->harian($request),
            'kalender' => $this->kalender($request),
            default => $this->daftar($request),
        };
    }

    public function export(Request $request)
    {
        $this->prepareLargeExport();

        $query = BugarSelamat::with('user')->oldest('created_at');
        $this->applyFilters($query, $request);

        if ($request->filled('status')) {
            $query->where('status_kelayakan', $request->status);
        }

        return Excel::download(new BugarSelamatExport($query), 'bugar-selamat-'.now()->format('Y-m-d').'.xlsx');
    }

    /**
     * Semua karyawan beserta status pengisian pada satu tanggal.
     */
    private function harian(Request $request)
    {
        $tanggal = $request->filled('tanggal') ? $request->tanggal : today()->toDateString();
        $users = $this->employees($request);

        $entries = BugarSelamat::whereDate('tanggal', $tanggal)
            ->whereIn('user_id', $users->pluck('id'))
            ->get(['id', 'user_id', 'status_kelayakan', 'shift', 'siap_bekerja', 'hari_ke'])
            ->keyBy('user_id')
            ->map(fn ($r) => [
                'id' => $r->id,
                'status' => $r->status_kelayakan,
                'shift' => $r->shift,
                'siap_bekerja' => (bool) $r->siap_bekerja,
                'hari_ke' => $r->hari_ke,
            ]);

        $filled = $entries->count();
        $total = $users->count();

        return Inertia::render('admin/bugar-selamat', [
            'view' => 'harian',
            'tanggal' => $tanggal,
            'users' => $users,
            'entries' => $entries,
            'sites' => $this->siteOptions($request),
            'admin_site' => $request->user()->site,
            'summary' => [
                'filled' => $filled,
                'not_filled' => $total - $filled,
                'layak' => $entries->where('status', 'layak')->count(),
                'catatan' => $entries->where('status', 'catatan')->count(),
                'dilarang' => $entries->where('status', 'dilarang')->count(),
                'total' => $total,
            ],
            'filters' => $request->only('site', 'search', 'tanggal', 'view'),
        ]);
    }

    /**
     * Matriks karyawan x tanggal dalam satu bulan.
     */
    private function kalender(Request $request)
    {
        $tanggal = $request->filled('tanggal') ? $request->tanggal : today()->toDateString();
        $carbon = Carbon::parse($tanggal);
        $startDate = $carbon->copy()->startOfMonth();
        $endDate = $carbon->copy()->endOfMonth()->min(today());
        $users = $this->employees($request);

        $entries = BugarSelamat::whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('user_id', $users->pluck('id'))
            ->get(['id', 'user_id', 'tanggal', 'status_kelayakan', 'shift', 'siap_bekerja'])
            ->keyBy(fn ($r) => $r->user_id.'_'.Carbon::parse($r->tanggal)->toDateString())
            ->map(fn ($r) => [
                'id' => $r->id,
                'status' => $r->status_kelayakan,
                'shift' => $r->shift,
                'siap_bekerja' => (bool) $r->siap_bekerja,
            ]);

        $dates = [];
        for ($current = $startDate->copy(); $current->lte($endDate); $current->addDay()) {
            $dates[] = $current->toDateString();
        }

        return Inertia::render('admin/bugar-selamat', [
            'view' => 'kalender',
            'tanggal' => $tanggal,
            'users' => $users,
            'dates' => $dates,
            'entries' => $entries,
            'sites' => $this->siteOptions($request),
            'admin_site' => $request->user()->site,
            'summary' => [
                'total' => $users->count(),
                'bulan' => $carbon->locale('id')->isoFormat('MMMM YYYY'),
            ],
            'filters' => $request->only('site', 'search', 'tanggal', 'view'),
        ]);
    }

    /**
     * Riwayat pengisian dalam daftar berhalaman.
     */
    private function daftar(Request $request)
    {
        $query = BugarSelamat::with('user')->latest('created_at');
        $this->applyFilters($query, $request);

        $summaryData = (clone $query)->selectRaw('status_kelayakan, count(*) as total')
            ->reorder()
            ->groupBy('status_kelayakan')
            ->pluck('total', 'status_kelayakan');

        if ($request->filled('status')) {
            $query->where('status_kelayakan', $request->status);
        }

        return Inertia::render('admin/bugar-selamat', [
            'view' => 'daftar',
            'records' => $query->paginate(20)->withQueryString(),
            'sites' => $this->siteOptions($request),
            'admin_site' => $request->user()->site,
            'filters' => $request->only('site', 'status', 'search', 'periode', 'view', 'date_from', 'date_to'),
            'summary' => [
                'layak' => (int) ($summaryData['layak'] ?? 0),
                'catatan' => (int) ($summaryData['catatan'] ?? 0),
                'dilarang' => (int) ($summaryData['dilarang'] ?? 0),
                'total' => (int) $summaryData->sum(),
            ],
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($site = $this->adminSite($request)) {
            $query->atSite($site);
        }

        $this->applyUserSearch($query, $request);
        $this->applyDateFilter($query, $request, 'created_at');
    }

    /**
     * Karyawan non-admin di site terpilih, sesuai pencarian.
     */
    private function employees(Request $request)
    {
        $site = $this->adminSite($request);
        $search = $request->filled('search') ? $request->search : null;

        return User::where('is_admin', false)
            ->when($site, fn ($q) => $q->assignedToSite($site))
            ->when($search, fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%$search%")
                ->orWhere('nik', 'like', "%$search%")))
            ->orderBy('site')->orderBy('name')
            ->get(['id', 'name', 'nik', 'site']);
    }
}
