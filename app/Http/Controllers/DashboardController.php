<?php

namespace App\Http\Controllers;

use App\Models\BugarSelamat;
use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\LaporanBahaya;
use App\Models\ObservasiKeselamatan;
use App\Models\ParticipationTarget;
use App\Models\Site;
use App\Models\User;
use App\Models\UserBadge;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->is_admin) {
            return $this->adminDashboard();
        }

        return $this->userDashboard($user);
    }

    private function userDashboard($user)
    {
        $bugarQuery   = BugarSelamat::where('user_id', $user->id);
        $laporanQuery = LaporanBahaya::where('user_id', $user->id);

        $now = Carbon::now();

        $stats = [
            'bugar_selamat' => [
                'total'     => (clone $bugarQuery)->count(),
                'bulan_ini' => (clone $bugarQuery)->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'layak'     => (clone $bugarQuery)->where('status_kelayakan', 'layak')->count(),
                'catatan'   => (clone $bugarQuery)->where('status_kelayakan', 'catatan')->count(),
                'dilarang'  => (clone $bugarQuery)->where('status_kelayakan', 'dilarang')->count(),
            ],
            'laporan_bahaya' => [
                'total'     => (clone $laporanQuery)->count(),
                'bulan_ini' => (clone $laporanQuery)->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'pending'   => (clone $laporanQuery)->where('status_tindakan', 'pending')->count(),
                'selesai'   => (clone $laporanQuery)->where('status_tindakan', 'selesai')->count(),
            ],
        ];

        $recent_bugar_selamat = (clone $bugarQuery)
            ->latest('tanggal')
            ->limit(5)
            ->get(['id', 'tanggal', 'shift', 'status_kelayakan']);

        $recent_laporan_bahaya = (clone $laporanQuery)
            ->latest('tanggal')
            ->limit(5)
            ->get(['id', 'tanggal', 'lokasi', 'tingkat_risiko', 'status_tindakan']);

        $trend = $this->buildUserMonthlyTrend($user->id, $now);

        // Streak
        $streak = $user->currentStreak();

        // Leaderboard site user
        $leaderboard = $this->buildLeaderboard($now);

        // Target partisipasi
        $target = $this->buildUserTarget($user, $now);

        // Badge terbaru (yang diraih dalam 7 hari terakhir)
        $new_badges = $user->badges()
            ->where('earned_at', '>=', now()->subDays(7))
            ->orderByDesc('earned_at')
            ->get()
            ->map(fn ($b) => [
                'key'      => $b->badge_key,
                'nama'     => UserBadge::$definitions[$b->badge_key]['nama'] ?? $b->badge_key,
                'icon'     => UserBadge::$definitions[$b->badge_key]['icon'] ?? '🏅',
                'earned_at'=> $b->earned_at,
            ]);

        return Inertia::render('dashboard', [
            'stats'                 => $stats,
            'recent_bugar_selamat'  => $recent_bugar_selamat,
            'recent_laporan_bahaya' => $recent_laporan_bahaya,
            'trend'                 => $trend,
            'streak'                => $streak,
            'leaderboard'           => $leaderboard,
            'target'                => $target,
            'new_badges'            => $new_badges,
        ]);
    }

    private function adminDashboard()
    {
        $now   = Carbon::now();
        $today = $now->toDateString();

        $inspeksiTotal   = InspeksiKantor::count() + InspeksiTambang::count() + InspeksiWorkshop::count() + InspeksiMess::count();
        $inspeksiBulanIni = InspeksiKantor::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count()
            + InspeksiTambang::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count()
            + InspeksiWorkshop::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count()
            + InspeksiMess::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count();

        $totalKaryawan   = User::where('is_admin', false)->count();
        $todayStart      = $now->copy()->startOfDay();
        $todayEnd        = $now->copy()->endOfDay();

        $sudahSubmitBs = BugarSelamat::whereBetween('tanggal', [$todayStart->toDateString(), $todayEnd->toDateString()])
            ->distinct()->count('user_id');

        // Ambil submission terakhir per user hari ini, filter yang statusnya dilarang
        $dilarangHariIni = BugarSelamat::whereBetween('tanggal', [$todayStart->toDateString(), $todayEnd->toDateString()])
            ->whereIn('id', function ($q) use ($todayStart, $todayEnd) {
                $q->selectRaw('MAX(id)')
                    ->from('bugar_selamat')
                    ->whereBetween('tanggal', [$todayStart->toDateString(), $todayEnd->toDateString()])
                    ->groupBy('user_id');
            })
            ->where('status_kelayakan', 'dilarang')
            ->with('user:id,name,jabatan,site,avatar')
            ->get()
            ->map(fn ($bs) => [
                'id'      => $bs->user->id ?? null,
                'name'    => $bs->user->name ?? '-',
                'jabatan' => $bs->user->jabatan ?? null,
                'site'    => $bs->user->site ?? null,
                'avatar'  => $bs->user->avatar ? asset('storage/' . $bs->user->avatar) : null,
            ])
            ->values();

        $stats = [
            'bugar_selamat' => [
                'total'     => BugarSelamat::count(),
                'bulan_ini' => BugarSelamat::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'layak'     => BugarSelamat::where('status_kelayakan', 'layak')->count(),
                'catatan'   => BugarSelamat::where('status_kelayakan', 'catatan')->count(),
                'dilarang'  => BugarSelamat::where('status_kelayakan', 'dilarang')->count(),
            ],
            'laporan_bahaya' => [
                'total'     => LaporanBahaya::count(),
                'bulan_ini' => LaporanBahaya::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'AA'        => LaporanBahaya::where('tingkat_risiko', 'AA')->count(),
                'A'         => LaporanBahaya::where('tingkat_risiko', 'A')->count(),
                'B'         => LaporanBahaya::where('tingkat_risiko', 'B')->count(),
                'C'         => LaporanBahaya::where('tingkat_risiko', 'C')->count(),
                'pending'   => LaporanBahaya::where('status_tindakan', 'pending')->count(),
                'selesai'   => LaporanBahaya::where('status_tindakan', 'selesai')->count(),
            ],
            'observasi_keselamatan' => [
                'total'               => ObservasiKeselamatan::count(),
                'bulan_ini'           => ObservasiKeselamatan::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'menunggu_konfirmasi' => ObservasiKeselamatan::where('status', 'menunggu_konfirmasi')->count(),
            ],
            'inspeksi' => [
                'total'    => $inspeksiTotal,
                'bulan_ini'=> $inspeksiBulanIni,
                'kantor'   => InspeksiKantor::count(),
                'tambang'  => InspeksiTambang::count(),
                'workshop' => InspeksiWorkshop::count(),
                'mess'     => InspeksiMess::count(),
            ],
            'users' => [
                'total'    => $totalKaryawan,
                'baratama' => User::where('is_admin', false)->where('site', 'baratama')->count(),
                'bandhawa' => User::where('is_admin', false)->where('site', 'bandhawa')->count(),
            ],
        ];

        $leaderboard = $this->buildLeaderboard($now);
        $participation_targets = ParticipationTarget::all(['level', 'laporan_per_minggu', 'inspeksi_per_minggu', 'observasi_per_minggu', 'bugar_per_hari']);

        return Inertia::render('admin/index', [
            'stats'                  => $stats,
            'trend'                  => $this->buildAdminMonthlyTrend($now),
            'site_breakdown'         => $this->buildSiteBreakdown(),
            'leaderboard'            => $leaderboard,
            'participation_targets'  => $participation_targets,
            'compliance'             => [
                'total_karyawan'  => $totalKaryawan,
                'sudah_submit_bs' => $sudahSubmitBs,
                'dilarang_list'   => $dilarangHariIni,
            ],
        ]);
    }

    private function buildLeaderboard(Carbon $now): array
    {
        $sites = Site::pluck('value')->all();
        $result = [];

        foreach ($sites as $site) {
            $users = User::where('is_admin', false)
                ->where('site', $site)
                ->withCount([
                    'bugarSelamats as bs_count' => fn ($q) => $q->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year),
                    'laporanBahayas as lb_count' => fn ($q) => $q->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year),
                ])
                ->get(['id', 'name', 'jabatan', 'avatar'])
                ->map(fn ($u) => [
                    'id'      => $u->id,
                    'name'    => $u->name,
                    'jabatan' => $u->jabatan,
                    'avatar'  => $u->avatar ? asset('storage/' . $u->avatar) : null,
                    'bs'      => $u->bs_count,
                    'lb'      => $u->lb_count,
                    'skor'    => $u->bs_count + ($u->lb_count * 2),
                ])
                ->filter(fn ($u) => $u['skor'] > 0)
                ->sortByDesc('skor')
                ->values()
                ->take(5);

            $result[$site] = $users;
        }

        return $result;
    }

    private function buildUserTarget(User $user, Carbon $now): array
    {
        $target = ParticipationTarget::forLevel($user->participation_level ?? 'nonstaff');
        $startOfMonth = $now->copy()->startOfMonth();

        // --- Bugar selamat: hitung per hari ---
        $hariSudahLewat = $startOfMonth->diffInDays($now->copy()->startOfDay()) + 1;
        $bugarPerHari   = $target->bugar_per_hari;

        // Ambil tanggal-tanggal unik bugar selamat bulan ini
        $tanggalBugar = BugarSelamat::where('user_id', $user->id)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->pluck('tanggal')
            ->map(fn ($t) => (string) $t)
            ->unique()
            ->count();

        $hariBugarTerpenuhi = $bugarPerHari > 0 ? min($tanggalBugar, $hariSudahLewat) : 0;
        $bugarPersen = $hariSudahLewat > 0 ? round($hariBugarTerpenuhi / $hariSudahLewat * 100) : 0;

        // --- Helper: hitung metrik mingguan ---
        $buildWeekly = function (int $targetPerMinggu, callable $counter) use ($startOfMonth, $now): array {
            $weeks  = [];
            $cursor = $startOfMonth->copy()->startOfWeek(Carbon::MONDAY);

            while ($cursor->copy()->startOfWeek(Carbon::MONDAY)->lte($now->copy()->endOfMonth())) {
                $weekStart = $cursor->copy()->max($startOfMonth);
                $weekEnd   = $cursor->copy()->endOfWeek(Carbon::SUNDAY)->min($now->copy()->endOfMonth());

                if ($weekStart->lte($now)) {
                    $count = $counter($weekStart->toDateString(), $weekEnd->toDateString());
                    $weeks[] = [
                        'start'     => $weekStart->toDateString(),
                        'end'       => $weekEnd->toDateString(),
                        'count'     => $count,
                        'terpenuhi' => $count >= $targetPerMinggu,
                    ];
                }

                $cursor->addWeek();
            }

            $mingguBerlalu   = count($weeks);
            $mingguTerpenuhi = collect($weeks)->where('terpenuhi', true)->count();

            return [
                'target_per_minggu' => $targetPerMinggu,
                'weeks'             => $weeks,
                'minggu_berlalu'    => $mingguBerlalu,
                'minggu_terpenuhi'  => $mingguTerpenuhi,
                'persen'            => $mingguBerlalu > 0 ? round($mingguTerpenuhi / $mingguBerlalu * 100) : 0,
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

        return [
            'level'    => $user->participation_level ?? 'nonstaff',
            'bugar'    => [
                'target_per_hari'  => $bugarPerHari,
                'hari_berlalu'     => $hariSudahLewat,
                'hari_terpenuhi'   => $hariBugarTerpenuhi,
                'persen'           => $bugarPersen,
            ],
            'laporan'  => $laporan,
            'inspeksi' => $inspeksi,
            'observasi'=> $observasi,
        ];
    }

    private function buildUserMonthlyTrend(int $userId, Carbon $now): array
    {
        $months = collect(range(5, 0))->map(fn ($i) => $now->copy()->subMonths($i));

        $bugarData = BugarSelamat::where('user_id', $userId)
            ->where('tanggal', '>=', $now->copy()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, status_kelayakan, COUNT(*) as total")
            ->groupBy('month', 'status_kelayakan')
            ->get();

        $laporanData = LaporanBahaya::where('user_id', $userId)
            ->where('tanggal', '>=', $now->copy()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, COUNT(*) as total")
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        return $months->map(function (Carbon $month) use ($bugarData, $laporanData) {
            $key   = $month->format('Y-m');
            $label = $month->locale('id')->isoFormat('MMM YY');
            $bugar = $bugarData->where('month', $key);

            return [
                'label'    => $label,
                'layak'    => $bugar->where('status_kelayakan', 'layak')->sum('total'),
                'catatan'  => $bugar->where('status_kelayakan', 'catatan')->sum('total'),
                'dilarang' => $bugar->where('status_kelayakan', 'dilarang')->sum('total'),
                'laporan'  => (int) ($laporanData[$key]->total ?? 0),
            ];
        })->values()->toArray();
    }

    private function buildAdminMonthlyTrend(Carbon $now): array
    {
        $since  = $now->copy()->subMonths(5)->startOfMonth();
        $months = collect(range(5, 0))->map(fn ($i) => $now->copy()->subMonths($i));

        $bugarData = BugarSelamat::where('tanggal', '>=', $since)
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, status_kelayakan, COUNT(*) as total")
            ->groupBy('month', 'status_kelayakan')
            ->get();

        $laporanData = LaporanBahaya::where('tanggal', '>=', $since)
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, COUNT(*) as total")
            ->groupBy('month')->get()->keyBy('month');

        $observasiData = ObservasiKeselamatan::where('tanggal', '>=', $since)
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, COUNT(*) as total")
            ->groupBy('month')->get()->keyBy('month');

        $inspeksiData = collect();
        foreach ([InspeksiKantor::class, InspeksiTambang::class, InspeksiWorkshop::class, InspeksiMess::class] as $model) {
            $model::where('tanggal', '>=', $since)
                ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, COUNT(*) as total")
                ->groupBy('month')->get()
                ->each(function ($row) use (&$inspeksiData) {
                    $existing = $inspeksiData->get($row->month, ['month' => $row->month, 'total' => 0]);
                    $existing['total'] += $row->total;
                    $inspeksiData->put($row->month, $existing);
                });
        }

        return $months->map(function (Carbon $month) use ($bugarData, $laporanData, $observasiData, $inspeksiData) {
            $key   = $month->format('Y-m');
            $label = $month->locale('id')->isoFormat('MMM YY');
            $bugar = $bugarData->where('month', $key);

            return [
                'label'     => $label,
                'bugar'     => (int) $bugar->sum('total'),
                'laporan'   => (int) ($laporanData[$key]->total ?? 0),
                'observasi' => (int) ($observasiData[$key]->total ?? 0),
                'inspeksi'  => (int) ($inspeksiData->get($key, ['total' => 0])['total'] ?? 0),
            ];
        })->values()->toArray();
    }

    private function buildSiteBreakdown(): array
    {
        $sites = Site::pluck('value')->all();

        return collect($sites)->map(fn ($site) => [
            'site'      => $site,
            'bugar'     => BugarSelamat::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
            'laporan'   => LaporanBahaya::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
            'observasi' => ObservasiKeselamatan::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
            'inspeksi'  => InspeksiKantor::whereHas('user', fn ($q) => $q->where('site', $site))->count()
                + InspeksiTambang::whereHas('user', fn ($q) => $q->where('site', $site))->count()
                + InspeksiWorkshop::whereHas('user', fn ($q) => $q->where('site', $site))->count()
                + InspeksiMess::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
        ])->toArray();
    }
}
