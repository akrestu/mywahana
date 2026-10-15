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
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Collects approval work across modules so the Inbox, the bottom-nav badge
 * and the module launcher all agree on what is waiting for a user.
 */
class InboxService
{
    /** @var array<string, array{model: class-string<Model>, route: string, label: string, ab: string}> */
    private const INSPEKSI = [
        'kantor' => ['model' => InspeksiKantor::class, 'route' => 'sap.inspeksi-kantor', 'label' => 'Inspeksi Kantor', 'ab' => 'IK'],
        'tambang' => ['model' => InspeksiTambang::class, 'route' => 'sap.inspeksi-tambang', 'label' => 'Inspeksi Tambang', 'ab' => 'IT'],
        'workshop' => ['model' => InspeksiWorkshop::class, 'route' => 'sap.inspeksi-workshop', 'label' => 'Inspeksi Workshop', 'ab' => 'IW'],
        'mess' => ['model' => InspeksiMess::class, 'route' => 'sap.inspeksi-mess', 'label' => 'Inspeksi Mess', 'ab' => 'IM'],
    ];

    private const LIMIT = 30;

    /** Items that need the given user to act. */
    public function forMe(User $user): Collection
    {
        $items = collect();

        foreach (self::INSPEKSI as $def) {
            $def['model']::with('user:id,name')
                ->where('re_inspektor_id', $user->id)
                ->where('status', 'menunggu_re_inspeksi')
                ->latest()->limit(self::LIMIT)->get()
                ->each(fn ($r) => $items->push($this->inspeksiItem($r, $def, true)));
        }

        ObservasiKeselamatan::with('user:id,name')
            ->where('penanggung_jawab_id', $user->id)
            ->where('user_id', '!=', $user->id)
            ->where('status', 'menunggu_konfirmasi')
            ->latest()->limit(self::LIMIT)->get()
            ->each(fn ($r) => $items->push($this->observasiItem($r, true)));

        KomunikasiJsa::with('user:id,name')
            ->where('team_leader_id', $user->id)
            ->where('user_id', '!=', $user->id)
            ->where('status', 'menunggu_konfirmasi')
            ->latest()->limit(self::LIMIT)->get()
            ->each(fn ($r) => $items->push($this->jsaItem($r, true)));

        LaporanBahaya::where('pic_user_id', $user->id)
            ->where('status_tindakan', '!=', 'close')
            ->latest()->limit(self::LIMIT)->get()
            ->each(fn ($r) => $items->push($this->laporanItem($r, 'Anda PIC · tindak lanjuti dan closing')));

        return $this->sorted($items);
    }

    /** The user's own submissions still waiting on someone else. */
    public function submitted(User $user): Collection
    {
        $items = collect();

        foreach (self::INSPEKSI as $def) {
            $def['model']::where('user_id', $user->id)
                ->where('status', 'menunggu_re_inspeksi')
                ->latest()->limit(self::LIMIT)->get()
                ->each(fn ($r) => $items->push($this->inspeksiItem($r, $def, false)));
        }

        ObservasiKeselamatan::where('user_id', $user->id)
            ->where('status', 'menunggu_konfirmasi')
            ->latest()->limit(self::LIMIT)->get()
            ->each(fn ($r) => $items->push($this->observasiItem($r, false)));

        KomunikasiJsa::where('user_id', $user->id)
            ->where('status', 'menunggu_konfirmasi')
            ->latest()->limit(self::LIMIT)->get()
            ->each(fn ($r) => $items->push($this->jsaItem($r, false)));

        LaporanBahaya::where('user_id', $user->id)
            ->whereNotNull('pic_user_id')
            ->where('status_tindakan', '!=', 'close')
            ->latest()->limit(self::LIMIT)->get()
            ->each(fn ($r) => $items->push($this->laporanItem($r, 'Menunggu tindak lanjut PIC')));

        return $this->sorted($items);
    }

    /** The user's own submissions that have been resolved, newest first. */
    public function done(User $user): Collection
    {
        $items = collect();

        foreach (self::INSPEKSI as $def) {
            $def['model']::where('user_id', $user->id)
                ->whereIn('status', ['selesai', 'ditolak'])
                ->latest('updated_at')->limit(10)->get()
                ->each(fn ($r) => $items->push($this->inspeksiItem($r, $def, false)));
        }

        ObservasiKeselamatan::where('user_id', $user->id)
            ->whereIn('status', ['dikonfirmasi', 'ditolak'])
            ->latest('updated_at')->limit(10)->get()
            ->each(fn ($r) => $items->push($this->observasiItem($r, false)));

        KomunikasiJsa::where('user_id', $user->id)
            ->whereIn('status', ['dikonfirmasi', 'ditolak'])
            ->latest('updated_at')->limit(10)->get()
            ->each(fn ($r) => $items->push($this->jsaItem($r, false)));

        LaporanBahaya::where('user_id', $user->id)
            ->where('status_tindakan', 'close')
            ->latest('updated_at')->limit(10)->get()
            ->each(fn ($r) => $items->push($this->laporanItem($r, 'Selesai ditindaklanjuti')));

        return $this->sorted($items)->take(self::LIMIT)->values();
    }

    /** Cheap count of forMe(), shared on every request for nav badges. */
    public function countForMe(User $user): int
    {
        $count = 0;

        foreach (self::INSPEKSI as $def) {
            $count += $def['model']::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count();
        }

        $count += ObservasiKeselamatan::where('penanggung_jawab_id', $user->id)
            ->where('user_id', '!=', $user->id)->where('status', 'menunggu_konfirmasi')->count();
        $count += KomunikasiJsa::where('team_leader_id', $user->id)
            ->where('user_id', '!=', $user->id)->where('status', 'menunggu_konfirmasi')->count();
        $count += LaporanBahaya::where('pic_user_id', $user->id)->where('status_tindakan', '!=', 'close')->count();

        return $count;
    }

    private function inspeksiItem(Model $r, array $def, bool $actionable): array
    {
        $place = $r->lokasi ?? $r->project_site ?? null;

        return $this->item([
            'key' => $def['route'].'-'.$r->id,
            'ab' => $def['ab'],
            'tone' => 'neutral',
            'program' => $def['label'],
            'title' => $place ? "{$def['label']} · {$place}" : $def['label'],
            'subtitle' => $this->subtitle($r, $actionable),
            'status' => $r->status,
            'date' => $r->created_at,
            'detail_url' => route($def['route'].'.show', $r->id),
            'action_url' => $actionable ? route($def['route'].'.re-inspeksi', $r->id) : null,
            'action_label' => 'Re-inspeksi',
            'reject_url' => $actionable ? route($def['route'].'.tolak', $r->id) : null,
        ]);
    }

    private function observasiItem(ObservasiKeselamatan $r, bool $actionable): array
    {
        return $this->item([
            'key' => 'observasi-'.$r->id,
            'ab' => 'OB',
            'tone' => 'info',
            'program' => 'Observasi Keselamatan',
            'title' => $r->jenis_pekerjaan ?: 'Observasi Keselamatan',
            'subtitle' => $this->subtitle($r, $actionable, $r->lokasi_kerja),
            'status' => $r->status,
            'date' => $r->created_at,
            'detail_url' => route('sap.observasi-keselamatan.show', $r->id),
            'action_url' => $actionable ? route('sap.observasi-keselamatan.konfirmasi', $r->id) : null,
            'action_label' => 'Konfirmasi',
            'reject_url' => $actionable ? route('sap.observasi-keselamatan.tolak', $r->id) : null,
        ]);
    }

    private function jsaItem(KomunikasiJsa $r, bool $actionable): array
    {
        return $this->item([
            'key' => 'jsa-'.$r->id,
            'ab' => 'JSA',
            'tone' => 'accent',
            'program' => 'Komunikasi JSA',
            'title' => $actionable ? 'Tanda tangan sebagai TL' : ($r->judul_dokumen ?: 'Komunikasi JSA'),
            'subtitle' => $actionable
                ? implode(' · ', array_filter([$r->judul_dokumen, $r->user->name ?? null]))
                : $this->subtitle($r, false, $r->lokasi),
            'status' => $r->status,
            'date' => $r->created_at,
            'detail_url' => route('sap.komunikasi-jsa.show', $r->id),
            'action_url' => $actionable ? route('sap.komunikasi-jsa.konfirmasi', $r->id) : null,
            'action_label' => 'Tanda tangan',
            'reject_url' => $actionable ? route('sap.komunikasi-jsa.tolak', $r->id) : null,
        ]);
    }

    private function laporanItem(LaporanBahaya $r, string $subtitle): array
    {
        $title = implode(' · ', array_filter([$r->lokasi, $r->tingkat_risiko ? "Risiko {$r->tingkat_risiko}" : null]));

        return $this->item([
            'key' => 'laporan-'.$r->id,
            'ab' => 'LB',
            'tone' => 'danger',
            'program' => 'Laporan Bahaya',
            'title' => $title ?: 'Laporan Bahaya',
            'subtitle' => $subtitle,
            'status' => $r->status_tindakan,
            'date' => $r->created_at,
            'detail_url' => route('laporan-bahaya.show', $r->id),
            'action_url' => null,
            'action_label' => null,
            'reject_url' => null,
        ]);
    }

    private function subtitle(Model $r, bool $withSubmitter, ?string $extra = null): string
    {
        $tanggal = $r->tanggal ? Carbon::parse($r->tanggal)->locale('id')->isoFormat('D MMM') : null;

        return implode(' · ', array_filter([
            $withSubmitter ? ($r->user->name ?? null) : null,
            $extra,
            $tanggal,
        ]));
    }

    private function item(array $data): array
    {
        $date = $data['date'];
        unset($data['date']);

        return ['module' => 'K3', ...$data, 'created_at' => $date?->toIso8601String()];
    }

    private function sorted(Collection $items): Collection
    {
        return $items->sortByDesc('created_at')->values();
    }
}
