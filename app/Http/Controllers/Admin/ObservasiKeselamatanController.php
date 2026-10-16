<?php

namespace App\Http\Controllers\Admin;

use App\Exports\ObservasiKeselamatanExport;
use App\Models\ObservasiKeselamatan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ObservasiKeselamatanController extends SiteRecordController
{
    protected function model(): string
    {
        return ObservasiKeselamatan::class;
    }

    public function index(Request $request)
    {
        $site = $this->adminSite($request);
        $query = ObservasiKeselamatan::with(['user', 'penanggungJawab'])->latest('created_at');
        $this->applyFilters($query, $request);

        $summaryQuery = ObservasiKeselamatan::query()->when($site, fn ($q) => $q->atSite($site));

        return Inertia::render('admin/observasi-keselamatan', [
            'records' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('site', 'status', 'search', 'periode', 'date_from', 'date_to'),
            'summary' => [
                'total' => (clone $summaryQuery)->count(),
                'menunggu_konfirmasi' => (clone $summaryQuery)->where('status', 'menunggu_konfirmasi')->count(),
                'dikonfirmasi' => (clone $summaryQuery)->where('status', 'dikonfirmasi')->count(),
            ],
            'sites' => $this->siteOptions($request),
            'admin_site' => $request->user()->site,
        ]);
    }

    public function export(Request $request)
    {
        $this->prepareLargeExport();

        $query = ObservasiKeselamatan::with(['user', 'penanggungJawab'])->oldest('created_at');
        $this->applyFilters($query, $request);

        return Excel::download(
            new ObservasiKeselamatanExport($query),
            'observasi-keselamatan-'.now()->format('Ymd').'.xlsx'
        );
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
