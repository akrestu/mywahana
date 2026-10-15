<?php

namespace App\Services;

use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\KomunikasiJsa;
use App\Models\LaporanBahaya;
use App\Models\ObservasiKeselamatan;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Items across K3 modules still waiting on someone, for the admin
 * "Inbox approval" page and its sidebar badge. Site-scoped admins only
 * see their own site, matching the monitoring pages.
 */
class AdminInboxService
{
    private const INSPEKSI = [
        'kantor' => InspeksiKantor::class,
        'tambang' => InspeksiTambang::class,
        'workshop' => InspeksiWorkshop::class,
        'mess' => InspeksiMess::class,
    ];

    public function count(User $admin): int
    {
        return collect($this->queries($admin))->sum(fn (array $q) => $q['query']->count());
    }

    /** @return array<int, array<string, mixed>> */
    public function items(User $admin, int $perModule = 25): array
    {
        $rows = [];

        foreach ($this->queries($admin) as $q) {
            $total = (clone $q['query'])->count();

            if ($total === 0) {
                continue;
            }

            $rows[] = [
                'module' => $q['module'],
                'label' => $q['label'],
                'status' => $q['status'],
                'href' => $q['href'],
                'total' => $total,
                'records' => $q['query']->with('user:id,name,site')
                    ->latest('tanggal')->limit($perModule)->get()
                    ->map(fn ($r) => [
                        'id' => $r->id,
                        'tanggal' => Carbon::parse($r->tanggal)->toDateString(),
                        'title' => $q['title']($r),
                        'by' => $r->user?->name,
                        'site' => $r->user?->site,
                        'url' => $q['url']($r),
                    ])->all(),
            ];
        }

        return $rows;
    }

    /** @return array<int, array<string, mixed>> */
    private function queries(User $admin): array
    {
        $site = $admin->site;
        $scope = fn (Builder $q) => $site
            ? $q->whereHas('user', fn ($u) => $u->assignedToSite($site))
            : $q;

        $list = [
            [
                'module' => 'laporan-bahaya',
                'label' => 'Laporan Bahaya',
                'status' => 'Menunggu tindakan',
                'href' => '/admin/laporan-bahaya?status_tindakan=pending',
                'query' => $site
                    ? LaporanBahaya::query()->atSite($site)->where('status_tindakan', 'pending')
                    : LaporanBahaya::query()->where('status_tindakan', 'pending'),
                'title' => fn ($r) => $r->lokasi,
                'url' => fn ($r) => "/laporan-bahaya/{$r->id}?ref=admin",
            ],
            [
                'module' => 'observasi',
                'label' => 'Observasi Keselamatan',
                'status' => 'Menunggu konfirmasi',
                'href' => '/admin/observasi-keselamatan?status=menunggu_konfirmasi',
                'query' => $scope(ObservasiKeselamatan::query()->where('status', 'menunggu_konfirmasi')),
                'title' => fn ($r) => $r->jenis_pekerjaan,
                'url' => fn () => '/admin/observasi-keselamatan?status=menunggu_konfirmasi',
            ],
            [
                'module' => 'jsa',
                'label' => 'Komunikasi JSA',
                'status' => 'Menunggu konfirmasi',
                'href' => '/admin/komunikasi-jsa?status=menunggu_konfirmasi',
                'query' => $site
                    ? KomunikasiJsa::query()->atSite($site)->where('status', 'menunggu_konfirmasi')
                    : KomunikasiJsa::query()->where('status', 'menunggu_konfirmasi'),
                'title' => fn ($r) => $r->judul_dokumen,
                'url' => fn ($r) => "/sap/komunikasi-jsa/{$r->id}",
            ],
        ];

        foreach (self::INSPEKSI as $slug => $model) {
            $list[] = [
                'module' => "inspeksi-{$slug}",
                'label' => 'Inspeksi '.ucfirst($slug),
                'status' => 'Menunggu re-inspeksi',
                'href' => "/admin/inspeksi-{$slug}?status=menunggu_re_inspeksi",
                'query' => $scope($model::query()->where('status', 'menunggu_re_inspeksi')),
                'title' => fn ($r) => $r->project_site,
                'url' => fn () => "/admin/inspeksi-{$slug}?status=menunggu_re_inspeksi",
            ];
        }

        return $list;
    }
}
