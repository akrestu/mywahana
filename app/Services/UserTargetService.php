<?php

namespace App\Services;

use App\Models\BugarSelamat;
use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\KomunikasiJsa;
use App\Models\LaporanBahaya;
use App\Models\ObservasiKeselamatan;
use App\Models\ParticipationTarget;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Monthly participation progress for one user, shared by the home page and
 * the K3 module hub.
 */
class UserTargetService
{
    public function build(User $user, Carbon $now): array
    {
        $target = ParticipationTarget::forLevel($user->participation_level ?? 'nonstaff');
        $startOfMonth = $now->copy()->startOfMonth();

        // --- Bugar selamat: hitung per hari ---
        $hariSudahLewat = $startOfMonth->diffInDays($now->copy()->startOfDay()) + 1;
        $bugarPerHari = $target->bugar_per_hari;

        // Ambil tanggal-tanggal unik bugar selamat bulan ini
        $tanggalTerisi = BugarSelamat::where('user_id', $user->id)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->pluck('tanggal')
            ->map(fn ($t) => Carbon::parse($t)->toDateString())
            ->unique()
            ->sort()
            ->values();
        $tanggalBugar = $tanggalTerisi->count();

        $hariBugarTerpenuhi = $bugarPerHari > 0 ? min($tanggalBugar, $hariSudahLewat) : 0;
        $bugarPersen = $hariSudahLewat > 0 ? round($hariBugarTerpenuhi / $hariSudahLewat * 100) : 0;

        // --- Helper: hitung metrik mingguan ---
        $buildWeekly = function (int $targetPerMinggu, callable $counter) use ($startOfMonth, $now): array {
            $weeks = [];
            $cursor = $startOfMonth->copy()->startOfWeek(Carbon::MONDAY);

            while ($cursor->copy()->startOfWeek(Carbon::MONDAY)->lte($now->copy()->endOfMonth())) {
                $weekStart = $cursor->copy()->max($startOfMonth);
                $weekEnd = $cursor->copy()->endOfWeek(Carbon::SUNDAY)->min($now->copy()->endOfMonth());

                if ($weekStart->lte($now)) {
                    $count = $counter($weekStart->toDateString(), $weekEnd->toDateString());
                    $weeks[] = [
                        'start' => $weekStart->toDateString(),
                        'end' => $weekEnd->toDateString(),
                        'count' => $count,
                        'terpenuhi' => $count >= $targetPerMinggu,
                    ];
                }

                $cursor->addWeek();
            }

            $mingguBerlalu = count($weeks);
            $mingguTerpenuhi = collect($weeks)->where('terpenuhi', true)->count();

            return [
                'target_per_minggu' => $targetPerMinggu,
                'weeks' => $weeks,
                'minggu_berlalu' => $mingguBerlalu,
                'minggu_terpenuhi' => $mingguTerpenuhi,
                'persen' => $mingguBerlalu > 0 ? round($mingguTerpenuhi / $mingguBerlalu * 100) : 0,
            ];
        };

        // --- Laporan bahaya per minggu ---
        $laporan = $buildWeekly(
            $target->laporan_per_minggu,
            fn ($s, $e) => LaporanBahaya::where('user_id', $user->id)->whereBetween('tanggal', [$s, $e])->count()
        );

        // --- Inspeksi per minggu (gabungan 4 tabel) ---
        $inspeksi = null;
        if ($target->inspeksi_per_minggu > 0) {
            $inspeksi = $buildWeekly(
                $target->inspeksi_per_minggu,
                function ($s, $e) use ($user) {
                    return InspeksiKantor::where('user_id', $user->id)->whereBetween('tanggal', [$s, $e])->count()
                        + InspeksiTambang::where('user_id', $user->id)->whereBetween('tanggal', [$s, $e])->count()
                        + InspeksiWorkshop::where('user_id', $user->id)->whereBetween('tanggal', [$s, $e])->count()
                        + InspeksiMess::where('user_id', $user->id)->whereBetween('tanggal', [$s, $e])->count();
                }
            );
        }

        // --- Observasi keselamatan per minggu ---
        $observasi = null;
        if ($target->observasi_per_minggu > 0) {
            $observasi = $buildWeekly(
                $target->observasi_per_minggu,
                fn ($s, $e) => ObservasiKeselamatan::where('user_id', $user->id)->whereBetween('tanggal', [$s, $e])->count()
            );
        }

        // --- JSA per 2 minggu (dua periode per bulan: 1–15 dan 16–akhir) ---
        $jsa = null;
        if ($target->jsa_per_2minggu > 0) {
            $mid = $startOfMonth->copy()->addDays(14); // hari ke-15
            $endOfMonth = $now->copy()->endOfMonth();

            $periods = [
                ['start' => $startOfMonth->toDateString(), 'end' => $mid->copy()->min($endOfMonth)->toDateString()],
                ['start' => $mid->copy()->addDay()->toDateString(), 'end' => $endOfMonth->toDateString()],
            ];

            $jsaWeeks = [];
            $periodeBerlalu = 0;
            $periodeTerpenuhi = 0;

            foreach ($periods as $p) {
                if (Carbon::parse($p['start'])->lte($now)) {
                    $count = KomunikasiJsa::where('user_id', $user->id)
                        ->whereBetween('tanggal', [$p['start'], $p['end']])
                        ->count();
                    $terpenuhi = $count >= $target->jsa_per_2minggu;
                    $jsaWeeks[] = [
                        'start' => $p['start'],
                        'end' => $p['end'],
                        'count' => $count,
                        'terpenuhi' => $terpenuhi,
                    ];
                    $periodeBerlalu++;
                    if ($terpenuhi) {
                        $periodeTerpenuhi++;
                    }
                }
            }

            $jsa = [
                'target_per_periode' => $target->jsa_per_2minggu,
                'weeks' => $jsaWeeks,
                'minggu_berlalu' => $periodeBerlalu,
                'minggu_terpenuhi' => $periodeTerpenuhi,
                'persen' => $periodeBerlalu > 0 ? round($periodeTerpenuhi / $periodeBerlalu * 100) : 0,
            ];
        }

        return [
            'level' => $user->participation_level ?? 'nonstaff',
            'bugar' => [
                'target_per_hari' => $bugarPerHari,
                'hari_berlalu' => $hariSudahLewat,
                'hari_terpenuhi' => $hariBugarTerpenuhi,
                'persen' => $bugarPersen,
                // Untuk kalender harian di kartu target.
                'tanggal_terisi' => $tanggalTerisi->all(),
            ],
            'laporan' => $laporan,
            'inspeksi' => $inspeksi,
            'observasi' => $observasi,
            'jsa' => $jsa,
        ];
    }
}
