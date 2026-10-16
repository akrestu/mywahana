<?php

namespace App\Http\Controllers\Admin;

use App\Models\KomunikasiJsa;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class KomunikasiJsaController extends SiteRecordController
{
    protected function model(): string
    {
        return KomunikasiJsa::class;
    }

    public function index(Request $request)
    {
        $site = $this->adminSite($request);
        $query = KomunikasiJsa::with(['user:id,name,nik,jabatan,site', 'teamLeader:id,name,jabatan'])
            ->latest('created_at');
        $this->applyFilters($query, $request);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('judul_dokumen', 'like', "%{$request->search}%")
                    ->orWhere('lokasi', 'like', "%{$request->search}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$request->search}%")
                        ->orWhere('nik', 'like', "%{$request->search}%"));
            });
        }

        $summaryQuery = KomunikasiJsa::query()->when($site, fn ($q) => $q->atSite($site));

        return Inertia::render('admin/komunikasi-jsa', [
            'records' => $query->paginate(20)->withQueryString(),
            'filters' => (object) $request->only('site', 'status', 'shift', 'search', 'periode', 'date_from', 'date_to'),
            'summary' => [
                'total' => (clone $summaryQuery)->count(),
                'selesai' => (clone $summaryQuery)->where('status', 'selesai')->count(),
                'dikonfirmasi' => (clone $summaryQuery)->where('status', 'dikonfirmasi')->count(),
                'menunggu_konfirmasi' => (clone $summaryQuery)->where('status', 'menunggu_konfirmasi')->count(),
                'ditolak' => (clone $summaryQuery)->where('status', 'ditolak')->count(),
            ],
            'sites' => $this->siteOptions($request),
            'admin_site' => $request->user()->site,
        ]);
    }

    public function export(Request $request)
    {
        $this->prepareLargeExport();

        $query = KomunikasiJsa::with(['user:id,name,nik,jabatan,departemen,site', 'teamLeader:id,name,jabatan'])
            ->oldest('created_at');
        $this->applyFilters($query, $request);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('judul_dokumen', 'like', "%{$request->search}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$request->search}%"));
            });
        }

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([[
            'No', 'Tanggal', 'Waktu Submit', 'Nama', 'NIK', 'Jabatan', 'Departemen', 'Site', 'Lokasi', 'Shift',
            'Durasi (mnt)', 'Kegiatan', 'Judul JSA/SOP/IK', 'Jml Peserta', 'Peserta', 'Team Leader', 'Status', 'Catatan',
        ]], null, 'A1');

        foreach ($query->get() as $i => $r) {
            $sheet->fromArray([[
                $i + 1,
                $r->tanggal?->format('d/m/Y') ?? '',
                $r->created_at?->format('d/m/Y H:i') ?? '',
                $r->user?->name ?? '-',
                $r->user?->nik ?? '-',
                $r->user?->jabatan ?? '-',
                $r->user?->departemen ?? '-',
                $r->user?->site ?? '-',
                $r->lokasi,
                $r->shift,
                $r->durasi,
                $r->kegiatan,
                $r->judul_dokumen,
                count($r->peserta ?? []),
                collect($r->peserta ?? [])->pluck('nama')->filter()->join(', '),
                $r->teamLeader?->name ?? '-',
                $r->status,
                $r->catatan ?? '-',
            ]], null, 'A'.($i + 2));
        }

        foreach (range('A', 'R') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $tmpPath = tempnam(sys_get_temp_dir(), 'jsa_export_').'.xlsx';
        (new Xlsx($spreadsheet))->save($tmpPath);

        return response()->download($tmpPath, 'komunikasi-jsa-'.now()->format('Ymd').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($site = $this->adminSite($request)) {
            $query->atSite($site);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('shift')) {
            $query->where('shift', $request->shift);
        }

        $this->applyDateFilter($query, $request, 'created_at');
    }
}
