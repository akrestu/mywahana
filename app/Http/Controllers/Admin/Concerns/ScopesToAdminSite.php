<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\Site;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Helper bersama untuk halaman admin: pembatasan site, filter tanggal,
 * pencarian, dan aksi hapus yang dilindungi password.
 */
trait ScopesToAdminSite
{
    /**
     * Site efektif untuk admin yang login. Admin yang terikat site selalu
     * dibatasi ke site-nya; admin tanpa site memakai filter 'site' dari request.
     */
    protected function adminSite(Request $request): ?string
    {
        $adminSite = $request->user()->site;

        return $adminSite ?: ($request->filled('site') ? $request->site : null);
    }

    /**
     * Pilihan site untuk filter: hanya site admin sendiri, atau semua site.
     */
    protected function siteOptions(Request $request): Collection
    {
        $adminSite = $request->user()->site;

        return $adminSite
            ? Site::where('value', $adminSite)->get(['value', 'label'])
            : Site::orderBy('label')->get(['value', 'label']);
    }

    /**
     * Terapkan rentang date_from/date_to jika ada, jika tidak pakai preset
     * periode (hari_ini/minggu_ini/bulan_ini).
     */
    protected function applyDateFilter(Builder $query, Request $request, string $column = 'tanggal'): void
    {
        if ($request->filled('date_from') || $request->filled('date_to')) {
            if ($request->filled('date_from')) {
                $query->where($column, '>=', Carbon::parse($request->date_from)->startOfDay());
            }
            if ($request->filled('date_to')) {
                $query->where($column, '<=', Carbon::parse($request->date_to)->endOfDay());
            }

            return;
        }

        if ($request->filled('periode')) {
            match ($request->periode) {
                'hari_ini' => $query->whereDate($column, today()),
                'minggu_ini' => $query->whereBetween($column, [now()->startOfWeek(), now()->endOfWeek()]),
                'bulan_ini' => $query->whereMonth($column, now()->month)->whereYear($column, now()->year),
                default => null,
            };
        }
    }

    /**
     * Cari berdasarkan nama atau NIK pelapor.
     */
    protected function applyUserSearch(Builder $query, Request $request): void
    {
        if ($request->filled('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('nik', 'like', "%{$request->search}%"));
        }
    }

    /**
     * Dataset export bisa mencapai ribuan baris; naikkan batas memori/waktu
     * bawaan hosting (sering 128M/30s) agar export tidak gagal di tengah jalan.
     */
    protected function prepareLargeExport(): void
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);
    }

    /**
     * Admin yang terikat site hanya boleh mengelola data site-nya sendiri.
     */
    protected function ensureSameSite(Request $request, Model $record): void
    {
        $adminSite = $request->user()->site;

        if ($adminSite) {
            abort_unless($record->newQuery()->whereKey($record->getKey())->atSite($adminSite)->exists(), 403);
        }
    }

    /**
     * Hapus record satu per satu agar event model (hapus file upload) ikut berjalan.
     */
    protected function deleteEach(Builder $query): int
    {
        $deleted = 0;
        $query->lazyById()->each(function (Model $record) use (&$deleted) {
            $record->delete();
            $deleted++;
        });

        return $deleted;
    }

    /**
     * Handler bersama untuk aksi "hapus per rentang tanggal" yang dilindungi
     * password. $delete menerima (Carbon $from, Carbon $to) dan mengembalikan
     * jumlah baris yang dihapus.
     */
    protected function deleteRange(Request $request, \Closure $delete)
    {
        $request->validate([
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'password' => ['required', 'string', 'current_password'],
        ]);

        $from = Carbon::parse($request->date_from)->startOfDay();
        $to = Carbon::parse($request->date_to)->endOfDay();

        $deleted = $delete($from, $to);

        $this->flashSuccess("{$deleted} data berhasil dihapus (periode {$from->toDateString()} s/d {$to->toDateString()}).");

        return back();
    }

    protected function validatedIds(Request $request): array
    {
        return $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
    }

    protected function flashSuccess(string $message): void
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);
    }

    protected function monthSelect(string $column): string
    {
        return DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column}) as month"
            : "DATE_FORMAT({$column}, '%Y-%m') as month";
    }
}
