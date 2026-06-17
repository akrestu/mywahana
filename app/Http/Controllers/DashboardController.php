<?php

namespace App\Http\Controllers;

use App\Models\BugarSelamat;
use App\Models\KomunikasiJsa;
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
            return $this->adminDashboard($request);
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

        // Pending re-inspeksi per tipe (user sebagai re-inspektor/PJ)
        $pendingReInspeksi = [
            'kantor'   => InspeksiKantor::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
            'tambang'  => InspeksiTambang::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
            'workshop' => InspeksiWorkshop::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
            'mess'     => InspeksiMess::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
        ];

        // Pending form OK (Observasi Keselamatan) sebagai PJ
        $pendingFormOk = ObservasiKeselamatan::where('penanggung_jawab_id', $user->id)
            ->where('user_id', '!=', $user->id)
            ->where('status', 'menunggu_konfirmasi')
            ->count();

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
            'pending_re_inspeksi'   => $pendingReInspeksi,
            'pending_form_ok'       => $pendingFormOk,
        ]);
    }

    private function adminDashboard(Request $request)
    {
        $now   = Carbon::now();
        $admin = $request->user();

        // ── Filters ───────────────────────────────────────────────────────────
        $allSiteValues  = Site::pluck('value')->toArray();
        $validLevels    = ['nonstaff', 'staff', 'srstaff'];
        $validDepartemen = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA', 'Management'];

        $bulan   = max(1, min(12, (int) $request->query('bulan', $now->month)));
        $tahun   = max(2020, min($now->year + 1, (int) $request->query('tahun', $now->year)));

        $adminSite    = $admin->site ?? null;
        $siteDefault  = ($adminSite && in_array($adminSite, $allSiteValues)) ? $adminSite : 'all';
        $siteInput    = $request->query('site', $siteDefault);
        $site         = ($siteInput === 'all' || in_array($siteInput, $allSiteValues)) ? $siteInput : 'all';

        $deptInput   = $request->query('departemen', 'all');
        $departemen  = ($deptInput === 'all' || in_array($deptInput, $validDepartemen)) ? $deptInput : 'all';

        $levelInput = $request->query('level', 'all');
        $level      = ($levelInput === 'all' || in_array($levelInput, $validLevels)) ? $levelInput : 'all';

        $jabatanInput = $request->query('jabatan', 'all');
        $jabatan      = $jabatanInput; // free-text, validated loosely

        $filter = [
            'bulan'      => $bulan,
            'tahun'      => $tahun,
            'site'       => $site,
            'departemen' => $departemen,
            'level'      => $level,
            'jabatan'    => $jabatan,
        ];

        // ── Alert banner data (always current, not filtered) ─────────────────
        $totalKaryawan = User::where('is_admin', false)->count();
        $todayStart    = $now->copy()->startOfDay();
        $todayEnd      = $now->copy()->endOfDay();

        $sudahSubmitBs = BugarSelamat::whereBetween('tanggal', [$todayStart->toDateString(), $todayEnd->toDateString()])
            ->distinct()->count('user_id');

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

        // ── Jabatan options untuk filter ──────────────────────────────────────
        $jabatanOptions = User::where('is_admin', false)
            ->whereNotNull('jabatan')
            ->distinct()
            ->orderBy('jabatan')
            ->pluck('jabatan')
            ->values()
            ->toArray();

        return Inertia::render('admin/index', [
            'compliance'      => [
                'total_karyawan'  => $totalKaryawan,
                'sudah_submit_bs' => $sudahSubmitBs,
                'dilarang_list'   => $dilarangHariIni,
            ],
            'sap_monitoring'  => $this->buildSapMonitoring($bulan, $tahun, $site, $departemen, $level, $jabatan),
            'employee_recap'  => $this->buildEmployeeRecap($bulan, $tahun, $site, $departemen, $level, $jabatan),
            'filter'          => $filter,
            'sites'           => Site::all(['value', 'label']),
            'jabatan_options' => $jabatanOptions,
            'admin_site'      => $admin->site ?? null,
        ]);
    }

    private function buildSapMonitoring(int $bulan, int $tahun, string $siteFilter, string $departemen = 'all', string $level = 'all', string $jabatan = 'all'): array
    {
        $periodStart  = Carbon::create($tahun, $bulan, 1)->startOfDay();
        $periodEnd    = $periodStart->copy()->endOfMonth();
        $now          = Carbon::now();
        $effectiveEnd = $now->lt($periodEnd) ? $now->copy() : $periodEnd->copy();

        // Weeks elapsed (Mondays that have started)
        $minggguBerlalu = 0;
        $cursor = $periodStart->copy()->startOfWeek(Carbon::MONDAY);
        while ($cursor->lte($periodEnd)) {
            $wStart = $cursor->copy()->max($periodStart);
            if ($wStart->lte($effectiveEnd)) {
                $minggguBerlalu++;
            }
            $cursor->addWeek();
        }
        $minggguBerlalu = max(1, $minggguBerlalu);

        // JSA 2-period logic
        $mid = $periodStart->copy()->addDays(14);
        $jsaPeriodsBerlalu = $periodStart->lte($effectiveEnd) ? 1 : 0;
        if ($mid->copy()->addDay()->lte($effectiveEnd)) $jsaPeriodsBerlalu++;

        // Users
        $userQuery = User::where('is_admin', false);
        if ($siteFilter !== 'all') $userQuery->where('site', $siteFilter);
        if ($departemen !== 'all') $userQuery->where('departemen', $departemen);
        if ($level !== 'all') $userQuery->where('participation_level', $level);
        if ($jabatan !== 'all') $userQuery->where('jabatan', $jabatan);
        $users = $userQuery->get(['id', 'participation_level']);

        $allIds  = $users->pluck('id')->toArray();
        $targets = ParticipationTarget::all()->keyBy('level');
        $levels  = ['nonstaff', 'staff', 'srstaff'];

        $getTarget = fn(string $level, string $field): int =>
            (int) ($targets->get($level)?->{$field} ?? 0);

        // Batch-load submission counts
        $fetchCounts = function (string $model) use ($allIds, $periodStart, $periodEnd): array {
            if (empty($allIds)) return [];
            return $model::whereIn('user_id', $allIds)
                ->whereBetween('tanggal', [$periodStart->toDateString(), $periodEnd->toDateString()])
                ->selectRaw('user_id, COUNT(*) as total')
                ->groupBy('user_id')
                ->pluck('total', 'user_id')
                ->toArray();
        };

        $inspCounts = [];
        if (!empty($allIds)) {
            foreach ([InspeksiKantor::class, InspeksiTambang::class, InspeksiWorkshop::class, InspeksiMess::class] as $m) {
                foreach ($m::whereIn('user_id', $allIds)
                    ->whereBetween('tanggal', [$periodStart->toDateString(), $periodEnd->toDateString()])
                    ->selectRaw('user_id, COUNT(*) as total')
                    ->groupBy('user_id')
                    ->pluck('total', 'user_id') as $uid => $cnt) {
                    $inspCounts[$uid] = ($inspCounts[$uid] ?? 0) + $cnt;
                }
            }
        }

        $laporanCounts   = $fetchCounts(LaporanBahaya::class);
        $observasiCounts = $fetchCounts(ObservasiKeselamatan::class);
        $jsaCounts       = $fetchCounts(KomunikasiJsa::class);

        $buildBreakdown = function (array $counts, string $targetField, int $periodsElapsed) use ($users, $levels, $getTarget): array {
            $rows = [];
            foreach ($levels as $level) {
                $levelUsers = $users->where('participation_level', $level);
                $targetVal  = $getTarget($level, $targetField);
                $total      = $levelUsers->count();

                if ($total === 0 || $targetVal === 0) {
                    $rows[] = ['level' => $level, 'total_users' => $total, 'on_track' => null, 'persen' => null, 'total_submissions' => 0];
                    continue;
                }

                $minRequired = $targetVal * $periodsElapsed;
                $onTrack = 0;
                $totalSubs = 0;
                foreach ($levelUsers as $u) {
                    $cnt = $counts[$u->id] ?? 0;
                    $totalSubs += $cnt;
                    if ($cnt >= $minRequired) $onTrack++;
                }

                $rows[] = [
                    'level'             => $level,
                    'total_users'       => $total,
                    'on_track'          => $onTrack,
                    'persen'            => (int) round($onTrack / $total * 100),
                    'total_submissions' => $totalSubs,
                ];
            }
            return $rows;
        };

        $overallPersen = function (array $breakdown): int {
            $tot = $on = 0;
            foreach ($breakdown as $r) {
                if ($r['on_track'] === null) continue;
                $tot += $r['total_users'];
                $on  += $r['on_track'];
            }
            return $tot > 0 ? (int) round($on / $tot * 100) : 0;
        };

        $lb  = $buildBreakdown($laporanCounts,   'laporan_per_minggu',   $minggguBerlalu);
        $ins = $buildBreakdown($inspCounts,       'inspeksi_per_minggu',  $minggguBerlalu);
        $ok  = $buildBreakdown($observasiCounts,  'observasi_per_minggu', $minggguBerlalu);
        $jsa = $buildBreakdown($jsaCounts,        'jsa_per_2minggu',      $jsaPeriodsBerlalu);

        return [
            'laporan_bahaya' => [
                'label' => 'Laporan Bahaya', 'total_submissions' => array_sum($laporanCounts),
                'persen_on_track' => $overallPersen($lb), 'minggu_berlalu' => $minggguBerlalu, 'breakdown' => $lb,
            ],
            'inspeksi' => [
                'label' => 'Inspeksi', 'total_submissions' => array_sum($inspCounts),
                'persen_on_track' => $overallPersen($ins), 'minggu_berlalu' => $minggguBerlalu, 'breakdown' => $ins,
            ],
            'observasi_keselamatan' => [
                'label' => 'Observasi Keselamatan', 'total_submissions' => array_sum($observasiCounts),
                'persen_on_track' => $overallPersen($ok), 'minggu_berlalu' => $minggguBerlalu, 'breakdown' => $ok,
            ],
            'komunikasi_jsa' => [
                'label' => 'Sosialisasi JSA', 'total_submissions' => array_sum($jsaCounts),
                'persen_on_track' => $overallPersen($jsa), 'periode_berlalu' => $jsaPeriodsBerlalu, 'breakdown' => $jsa,
            ],
        ];
    }

    private function buildEmployeeRecap(int $bulan, int $tahun, string $siteFilter, string $departemen = 'all', string $level = 'all', string $jabatan = 'all'): array
    {
        $periodStart  = Carbon::create($tahun, $bulan, 1)->startOfDay();
        $periodEnd    = $periodStart->copy()->endOfMonth();
        $now          = Carbon::now();
        $effectiveEnd = $now->lt($periodEnd) ? $now->copy() : $periodEnd->copy();

        // Build weeks
        $weeks  = [];
        $cursor = $periodStart->copy()->startOfWeek(Carbon::MONDAY);
        while ($cursor->lte($periodEnd)) {
            $wStart = $cursor->copy()->max($periodStart);
            $wEnd   = $cursor->copy()->endOfWeek(Carbon::SUNDAY)->min($periodEnd);
            if ($wStart->lte($effectiveEnd)) {
                $weeks[] = [
                    'num'   => count($weeks) + 1,
                    'start' => $wStart->toDateString(),
                    'end'   => $wEnd->toDateString(),
                ];
            }
            $cursor->addWeek();
        }

        // JSA period mapping: which weeks fall in period 1 (day 1–15) vs period 2 (day 16–EOM)
        $mid = $periodStart->copy()->addDays(14); // day 15
        $jsaPeriodOf = function (array $week) use ($periodStart, $mid): int {
            return Carbon::parse($week['start'])->lte($mid) ? 1 : 2;
        };

        // Users
        $userQuery = User::where('is_admin', false);
        if ($siteFilter !== 'all') $userQuery->where('site', $siteFilter);
        if ($departemen !== 'all') $userQuery->where('departemen', $departemen);
        if ($level !== 'all') $userQuery->where('participation_level', $level);
        if ($jabatan !== 'all') $userQuery->where('jabatan', $jabatan);
        $users = $userQuery->get(['id', 'name', 'jabatan', 'departemen', 'participation_level', 'site', 'avatar']);

        if ($users->isEmpty() || empty($weeks)) {
            return ['weeks' => $weeks, 'employees' => []];
        }

        $allIds  = $users->pluck('id')->toArray();
        $targets = ParticipationTarget::all()->keyBy('level');

        // Batch-load all submissions for the entire period, keyed by user_id, then split by date
        $fetchAll = function (string $model) use ($allIds, $periodStart, $periodEnd): \Illuminate\Support\Collection {
            return $model::whereIn('user_id', $allIds)
                ->whereBetween('tanggal', [$periodStart->toDateString(), $periodEnd->toDateString()])
                ->get(['user_id', 'tanggal']);
        };

        $laporanRows   = $fetchAll(LaporanBahaya::class)->groupBy('user_id');
        $observasiRows = $fetchAll(ObservasiKeselamatan::class)->groupBy('user_id');
        $jsaRows       = $fetchAll(KomunikasiJsa::class)->groupBy('user_id');

        // Inspeksi: merge 4 models
        $inspeksiRows = collect();
        foreach ([InspeksiKantor::class, InspeksiTambang::class, InspeksiWorkshop::class, InspeksiMess::class] as $m) {
            $inspeksiRows = $inspeksiRows->concat($m::whereIn('user_id', $allIds)
                ->whereBetween('tanggal', [$periodStart->toDateString(), $periodEnd->toDateString()])
                ->get(['user_id', 'tanggal']));
        }
        $inspeksiRows = $inspeksiRows->groupBy('user_id');

        $countInRange = function (\Illuminate\Support\Collection|null $rows, string $start, string $end): int {
            if (!$rows) return 0;
            return $rows->filter(fn ($r) => $r->tanggal >= $start && $r->tanggal <= $end)->count();
        };

        // JSA: track per-period fulfillment (not per-week)
        $jsaPeriodsMap = [
            1 => ['start' => $periodStart->toDateString(), 'end' => $mid->toDateString()],
            2 => ['start' => $mid->copy()->addDay()->toDateString(), 'end' => $periodEnd->toDateString()],
        ];

        $employees = $users->map(function ($user) use ($weeks, $targets, $laporanRows, $inspeksiRows, $observasiRows, $jsaRows, $countInRange, $jsaPeriodOf, $jsaPeriodsMap) {
            $level  = $user->participation_level ?? 'nonstaff';
            $target = $targets->get($level);

            $lbTarget  = (int) ($target?->laporan_per_minggu ?? 0);
            $insTarget = (int) ($target?->inspeksi_per_minggu ?? 0);
            $okTarget  = (int) ($target?->observasi_per_minggu ?? 0);
            $jsaTarget = (int) ($target?->jsa_per_2minggu ?? 0);

            $userLaporan   = $laporanRows->get($user->id);
            $userInspeksi  = $inspeksiRows->get($user->id);
            $userObservasi = $observasiRows->get($user->id);
            $userJsa       = $jsaRows->get($user->id);

            // Pre-count JSA per period for this user
            $jsaPeriodCount = [];
            foreach ($jsaPeriodsMap as $pNum => $p) {
                $jsaPeriodCount[$pNum] = $countInRange($userJsa, $p['start'], $p['end']);
            }

            $weekData = array_map(function ($week) use (
                $lbTarget, $insTarget, $okTarget, $jsaTarget,
                $userLaporan, $userInspeksi, $userObservasi,
                $countInRange, $jsaPeriodOf, $jsaPeriodCount
            ) {
                $lbCount  = $countInRange($userLaporan,   $week['start'], $week['end']);
                $insCount = $countInRange($userInspeksi,  $week['start'], $week['end']);
                $okCount  = $countInRange($userObservasi, $week['start'], $week['end']);

                $period     = $jsaPeriodOf($week);
                $jsaCount   = $jsaPeriodCount[$period] ?? 0;

                return [
                    'laporan'   => ['count' => $lbCount,  'target' => $lbTarget,  'met' => $lbTarget  > 0 ? $lbCount  >= $lbTarget  : null],
                    'inspeksi'  => ['count' => $insCount, 'target' => $insTarget, 'met' => $insTarget > 0 ? $insCount >= $insTarget : null],
                    'observasi' => ['count' => $okCount,  'target' => $okTarget,  'met' => $okTarget  > 0 ? $okCount  >= $okTarget  : null],
                    'jsa'       => ['count' => $jsaCount, 'target' => $jsaTarget, 'met' => $jsaTarget > 0 ? $jsaCount >= $jsaTarget : null],
                ];
            }, $weeks);

            return [
                'id'         => $user->id,
                'name'       => $user->name,
                'jabatan'    => $user->jabatan,
                'departemen' => $user->departemen,
                'level'      => $level,
                'site'       => $user->site,
                'avatar'  => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'weeks'   => $weekData,
            ];
        })->sortBy('name')->values()->toArray();

        return ['weeks' => $weeks, 'employees' => $employees];
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

        // --- JSA per 2 minggu (dua periode per bulan: 1–15 dan 16–akhir) ---
        $jsa = null;
        if ($target->jsa_per_2minggu > 0) {
            $mid        = $startOfMonth->copy()->addDays(14); // hari ke-15
            $endOfMonth = $now->copy()->endOfMonth();

            $periods = [
                ['start' => $startOfMonth->toDateString(), 'end' => $mid->copy()->min($endOfMonth)->toDateString()],
                ['start' => $mid->copy()->addDay()->toDateString(), 'end' => $endOfMonth->toDateString()],
            ];

            $jsaWeeks          = [];
            $periodeBerlalu    = 0;
            $periodeTerpenuhi  = 0;

            foreach ($periods as $p) {
                if (Carbon::parse($p['start'])->lte($now)) {
                    $count = KomunikasiJsa::where('user_id', $user->id)
                        ->whereBetween('tanggal', [$p['start'], $p['end']])
                        ->count();
                    $terpenuhi = $count >= $target->jsa_per_2minggu;
                    $jsaWeeks[] = [
                        'start'     => $p['start'],
                        'end'       => $p['end'],
                        'count'     => $count,
                        'terpenuhi' => $terpenuhi,
                    ];
                    $periodeBerlalu++;
                    if ($terpenuhi) $periodeTerpenuhi++;
                }
            }

            $jsa = [
                'target_per_periode' => $target->jsa_per_2minggu,
                'weeks'              => $jsaWeeks,
                'minggu_berlalu'     => $periodeBerlalu,
                'minggu_terpenuhi'   => $periodeTerpenuhi,
                'persen'             => $periodeBerlalu > 0 ? round($periodeTerpenuhi / $periodeBerlalu * 100) : 0,
            ];
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
            'jsa'      => $jsa,
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
