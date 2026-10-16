<?php

namespace App\Http\Controllers\Admin;

use App\Exports\LaporanBahayaExport;
use App\Models\LaporanBahaya;
use App\Models\User;
use App\Notifications\LaporanBahayaPicDitugaskan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class LaporanBahayaController extends SiteRecordController
{
    protected function model(): string
    {
        return LaporanBahaya::class;
    }

    public function index(Request $request)
    {
        $adminSite = $request->user()->site;
        $query = LaporanBahaya::with(['user', 'pic'])->latest('created_at');
        $this->applyFilters($query, $request);

        // Summary dihitung sebelum filter risiko/status agar tetap menyeluruh
        $riskCounts = (clone $query)->selectRaw('tingkat_risiko, count(*) as total')
            ->reorder()
            ->groupBy('tingkat_risiko')
            ->pluck('total', 'tingkat_risiko');

        $summary = [
            'pending' => (clone $query)->where('status_tindakan', 'pending')->count(),
            'aa' => (int) ($riskCounts['AA'] ?? 0),
            'a' => (int) ($riskCounts['A'] ?? 0),
            'b' => (int) ($riskCounts['B'] ?? 0),
            'c' => (int) ($riskCounts['C'] ?? 0),
            'total' => (int) $riskCounts->sum(),
        ];

        $this->applyRiskAndStatusFilters($query, $request);

        $pics = User::whereIn('participation_level', ['staff', 'srstaff'])
            ->when($adminSite, fn ($q) => $q->assignedToSite($adminSite))
            ->orderBy('name');

        return Inertia::render('admin/laporan-bahaya', [
            'records' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('site', 'tingkat_risiko', 'status_tindakan', 'search', 'periode', 'date_from', 'date_to'),
            'summary' => $summary,
            'sites' => $this->siteOptions($request),
            'admin_site' => $adminSite,
            'pics' => $pics->get(['id', 'name', 'jabatan', 'site']),
        ]);
    }

    public function export(Request $request)
    {
        $this->prepareLargeExport();

        $query = LaporanBahaya::with(['user', 'pic'])->oldest('created_at');
        $this->applyFilters($query, $request);
        $this->applyRiskAndStatusFilters($query, $request);

        return Excel::download(new LaporanBahayaExport($query), 'laporan-bahaya-'.now()->format('Y-m-d').'.xlsx');
    }

    public function updateStatus(Request $request, LaporanBahaya $laporanBahaya)
    {
        $this->ensureSameSite($request, $laporanBahaya);

        $request->validate([
            'status_tindakan' => ['required', 'in:pending,continue,progress,close'],
            'pic_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $oldPicId = $laporanBahaya->pic_user_id;

        if ($request->filled('pic_user_id')) {
            $site = $laporanBahaya->site ?? $laporanBahaya->user?->site;
            $picIsEligible = $site && User::whereKey($request->pic_user_id)
                ->whereIn('participation_level', ['staff', 'srstaff'])
                ->assignedToSite($site)
                ->exists();

            if (! $picIsEligible) {
                return back()->withErrors([
                    'pic_user_id' => 'PIC harus ditugaskan pada site pelaporan.',
                ]);
            }
        }

        $laporanBahaya->update(array_filter([
            'status_tindakan' => $request->status_tindakan,
            'pic_user_id' => $request->has('pic_user_id') ? $request->pic_user_id : $laporanBahaya->pic_user_id,
        ], fn ($v) => $v !== null || $request->has('pic_user_id')));

        // Kirim notif ke PIC baru jika PIC berubah
        $newPicId = $laporanBahaya->fresh()->pic_user_id;
        if ($newPicId && $newPicId !== $oldPicId) {
            $laporanBahaya->load('user', 'pic');
            $laporanBahaya->pic->notify(new LaporanBahayaPicDitugaskan($laporanBahaya));
        }

        $this->flashSuccess('Status tindakan berhasil diperbarui.');

        return back();
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($site = $this->adminSite($request)) {
            $query->atSite($site);
        }

        $this->applyUserSearch($query, $request);
        $this->applyDateFilter($query, $request, 'created_at');
    }

    private function applyRiskAndStatusFilters(Builder $query, Request $request): void
    {
        if ($request->filled('tingkat_risiko')) {
            $query->where('tingkat_risiko', $request->tingkat_risiko);
        }

        if ($request->filled('status_tindakan')) {
            $query->where('status_tindakan', $request->status_tindakan);
        }
    }
}
