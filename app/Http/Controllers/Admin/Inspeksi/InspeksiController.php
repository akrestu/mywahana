<?php

namespace App\Http\Controllers\Admin\Inspeksi;

use App\Http\Controllers\Admin\SiteRecordController;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Halaman admin yang sama untuk keempat jenis inspeksi (kantor, tambang,
 * workshop, mess). Subclass hanya menentukan model, halaman, dan export.
 */
abstract class InspeksiController extends SiteRecordController
{
    /** Slug jenis inspeksi, mis. 'kantor'. Dipakai untuk halaman dan nama file. */
    abstract protected function slug(): string;

    /** @return class-string */
    abstract protected function exportClass(): string;

    public function index(Request $request)
    {
        $site = $this->adminSite($request);
        $query = $this->model()::with(['user', 'reInspektor'])->latest('created_at');
        $this->applyFilters($query, $request);

        $summaryQuery = $this->model()::query()->when($site, fn ($q) => $q->atSite($site));

        return Inertia::render('admin/inspeksi-'.$this->slug(), [
            'records' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('site', 'status', 'search', 'periode', 'date_from', 'date_to'),
            'summary' => [
                'total' => (clone $summaryQuery)->count(),
                'menunggu_re_inspeksi' => (clone $summaryQuery)->where('status', 'menunggu_re_inspeksi')->count(),
                'selesai' => (clone $summaryQuery)->where('status', 'selesai')->count(),
                'ditolak' => (clone $summaryQuery)->where('status', 'ditolak')->count(),
            ],
            'sites' => $this->siteOptions($request),
            'admin_site' => $request->user()->site,
        ]);
    }

    public function export(Request $request)
    {
        $this->prepareLargeExport();

        $query = $this->model()::with(['user', 'reInspektor', 'peserta'])->oldest('created_at');
        $this->applyFilters($query, $request);
        $export = $this->exportClass();

        return Excel::download(new $export($query), 'inspeksi-'.$this->slug().'-'.now()->format('Ymd').'.xlsx');
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($site = $this->adminSite($request)) {
            $query->atSite($site);
        }

        $this->applyUserSearch($query, $request);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $this->applyDateFilter($query, $request, 'created_at');
    }
}
