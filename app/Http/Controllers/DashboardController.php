<?php

namespace App\Http\Controllers;

use App\Models\BugarSelamat;
use App\Models\LaporanBahaya;
use App\Models\ParticipationTarget;
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
        $now = Carbon::now();

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
            'users' => [
                'total'    => User::where('is_admin', false)->count(),
                'baratama' => User::where('is_admin', false)->where('site', 'baratama')->count(),
                'bandhawa' => User::where('is_admin', false)->where('site', 'bandhawa')->count(),
            ],
        ];

        $leaderboard = $this->buildLeaderboard($now);
        $participation_targets = ParticipationTarget::all(['level', 'laporan_per_minggu', 'bugar_per_hari']);

        return Inertia::render('admin/index', [
            'stats'                  => $stats,
            'trend'                  => $this->buildAdminMonthlyTrend($now),
            'site_breakdown'         => $this->buildSiteBreakdown(),
            'leaderboard'            => $leaderboard,
            'participation_targets'  => $participation_targets,
        ]);
    }

    private function buildLeaderboard(Carbon $now): array
    {
        $sites = ['baratama', 'bandhawa'];
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
        $targetPerMinggu = $target->laporan_per_minggu;

        // Iterasi setiap minggu bulan ini yang sudah dimulai
        $startOfMonth = $now->copy()->startOfMonth();
        $weeks = [];
        $cursor = $startOfMonth->copy()->startOfWeek(Carbon::MONDAY);

        while ($cursor->copy()->startOfWeek(Carbon::MONDAY)->lte($now->copy()->endOfMonth())) {
            $weekStart = $cursor->copy()->max($startOfMonth);
            $weekEnd   = $cursor->copy()->endOfWeek(Carbon::SUNDAY)->min($now->copy()->endOfMonth());

            // Hanya hitung minggu yang sudah dimulai (weekStart <= hari ini)
            if ($weekStart->lte($now)) {
                $count = LaporanBahaya::where('user_id', $user->id)
                    ->whereBetween('tanggal', [$weekStart->toDateString(), $weekEnd->toDateString()])
                    ->count();

                $weeks[] = [
                    'start'   => $weekStart->toDateString(),
                    'end'     => $weekEnd->toDateString(),
                    'count'   => $count,
                    'terpenuhi' => $count >= $targetPerMinggu,
                ];
            }

            $cursor->addWeek();
        }

        $mingguBerlalu   = count($weeks);
        $mingguTerpenuhi = collect($weeks)->where('terpenuhi', true)->count();
        $persen = $mingguBerlalu > 0 ? round($mingguTerpenuhi / $mingguBerlalu * 100) : 0;

        return [
            'level'              => $user->participation_level ?? 'nonstaff',
            'laporan_per_minggu' => $targetPerMinggu,
            'minggu_berlalu'     => $mingguBerlalu,
            'minggu_terpenuhi'   => $mingguTerpenuhi,
            'persen'             => $persen,
            'weeks'              => $weeks,
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
        $months = collect(range(5, 0))->map(fn ($i) => $now->copy()->subMonths($i));

        $bugarData = BugarSelamat::where('tanggal', '>=', $now->copy()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, status_kelayakan, COUNT(*) as total")
            ->groupBy('month', 'status_kelayakan')
            ->get();

        $laporanData = LaporanBahaya::where('tanggal', '>=', $now->copy()->subMonths(5)->startOfMonth())
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

    private function buildSiteBreakdown(): array
    {
        $sites = ['baratama', 'bandhawa'];

        return collect($sites)->map(fn ($site) => [
            'site'    => $site,
            'bugar'   => BugarSelamat::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
            'laporan' => LaporanBahaya::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
        ])->toArray();
    }
}
