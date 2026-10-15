<?php

namespace App\Http\Controllers;

use App\Models\BugarSelamat;
use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\KomunikasiJsa;
use App\Models\LaporanBahaya;
use App\Models\ObservasiKeselamatan;
use App\Models\ParticipationTarget;
use App\Models\Site;
use App\Models\User;
use App\Models\UserBadge;
use App\Services\InboxService;
use App\Services\UserTargetService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
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
        $bugarQuery = BugarSelamat::where('user_id', $user->id);
        $laporanQuery = LaporanBahaya::where('user_id', $user->id);

        $now = Carbon::now();

        $recent_bugar_selamat = (clone $bugarQuery)
            ->latest('tanggal')
            ->limit(5)
            ->get(['id', 'tanggal', 'shift', 'status_kelayakan']);

        $recent_laporan_bahaya = (clone $laporanQuery)
            ->latest('tanggal')
            ->limit(5)
            ->get(['id', 'tanggal', 'lokasi', 'tingkat_risiko', 'status_tindakan']);

        $isStaff = in_array($user->participation_level, ['staff', 'srstaff']);

        $recent_observasi = $isStaff
            ? ObservasiKeselamatan::where('user_id', $user->id)
                ->latest('tanggal')
                ->limit(5)
                ->get(['id', 'tanggal', 'jenis_pekerjaan', 'lokasi_kerja', 'status'])
            : collect();

        $recent_inspeksi = $isStaff
            ? collect([
                ...InspeksiKantor::where('user_id', $user->id)->latest('tanggal')->limit(5)->get(['id', 'tanggal', 'status', 'risk_level'])->map(fn ($r) => array_merge($r->toArray(), ['jenis' => 'Kantor'])),
                ...InspeksiTambang::where('user_id', $user->id)->latest('tanggal')->limit(5)->get(['id', 'tanggal', 'status', 'risk_level'])->map(fn ($r) => array_merge($r->toArray(), ['jenis' => 'Tambang'])),
                ...InspeksiWorkshop::where('user_id', $user->id)->latest('tanggal')->limit(5)->get(['id', 'tanggal', 'status', 'risk_level'])->map(fn ($r) => array_merge($r->toArray(), ['jenis' => 'Workshop'])),
                ...InspeksiMess::where('user_id', $user->id)->latest('tanggal')->limit(5)->get(['id', 'tanggal', 'status', 'risk_level'])->map(fn ($r) => array_merge($r->toArray(), ['jenis' => 'Mess'])),
            ])->sortByDesc('tanggal')->take(5)->values()
            : collect();

        $recent_jsa = $isStaff
            ? KomunikasiJsa::where('user_id', $user->id)
                ->latest('tanggal')
                ->limit(5)
                ->get(['id', 'tanggal', 'lokasi', 'judul_dokumen', 'status'])
            : collect();

        // Streak
        $streak = $user->currentStreak();

        // Target partisipasi
        $target = app(UserTargetService::class)->build($user, $now);

        // Pending re-inspeksi per tipe (user sebagai re-inspektor/PJ)
        $pendingReInspeksi = [
            'kantor' => InspeksiKantor::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
            'tambang' => InspeksiTambang::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
            'workshop' => InspeksiWorkshop::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
            'mess' => InspeksiMess::where('re_inspektor_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
        ];

        // Pending form OK (Observasi Keselamatan) sebagai PJ
        $pendingFormOk = ObservasiKeselamatan::where('penanggung_jawab_id', $user->id)
            ->where('user_id', '!=', $user->id)
            ->where('status', 'menunggu_konfirmasi')
            ->count();

        // Pending JSA sebagai Team Leader (TL) yang harus sign
        $pendingJsaTl = $isStaff
            ? KomunikasiJsa::where('team_leader_id', $user->id)
                ->where('user_id', '!=', $user->id)
                ->where('status', 'menunggu_konfirmasi')
                ->count()
            : 0;

        // Laporan bahaya di mana user ditugaskan sebagai PIC dan belum close
        $pendingAsPic = LaporanBahaya::where('pic_user_id', $user->id)
            ->where('status_tindakan', '!=', 'close')
            ->count();

        // Laporan bahaya milik user sendiri yang sudah ada PIC tapi belum close
        $myOpenWithPic = LaporanBahaya::where('user_id', $user->id)
            ->whereNotNull('pic_user_id')
            ->where('status_tindakan', '!=', 'close')
            ->count();

        // Form milik user sendiri yang masih menunggu approval (sisi submitter)
        $myPendingObservasi = $isStaff
            ? ObservasiKeselamatan::where('user_id', $user->id)
                ->where('status', 'menunggu_konfirmasi')
                ->count()
            : 0;

        $myPendingJsa = $isStaff
            ? KomunikasiJsa::where('user_id', $user->id)
                ->where('status', 'menunggu_konfirmasi')
                ->count()
            : 0;

        // Per jenis agar dashboard bisa menautkan ke halaman inspeksi yang tepat.
        $myPendingInspeksi = $isStaff
            ? [
                'kantor' => InspeksiKantor::where('user_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
                'tambang' => InspeksiTambang::where('user_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
                'workshop' => InspeksiWorkshop::where('user_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
                'mess' => InspeksiMess::where('user_id', $user->id)->where('status', 'menunggu_re_inspeksi')->count(),
            ]
            : null;

        // Badge terbaru (yang diraih dalam 7 hari terakhir)
        $new_badges = $user->badges()
            ->where('earned_at', '>=', now()->subDays(7))
            ->orderByDesc('earned_at')
            ->get()
            ->map(fn ($b) => [
                'key' => $b->badge_key,
                'nama' => UserBadge::$definitions[$b->badge_key]['nama'] ?? $b->badge_key,
                'icon' => UserBadge::$definitions[$b->badge_key]['icon'] ?? '🏅',
                'earned_at' => $b->earned_at,
            ]);

        $perluTindakan = app(InboxService::class)->forMe($user);

        return Inertia::render('dashboard', [
            'perlu_tindakan' => $perluTindakan->take(3)->values(),
            'perlu_tindakan_total' => $perluTindakan->count(),
            'recent_bugar_selamat' => $recent_bugar_selamat,
            'recent_laporan_bahaya' => $recent_laporan_bahaya,
            'recent_observasi' => $recent_observasi,
            'recent_inspeksi' => $recent_inspeksi,
            'recent_jsa' => $recent_jsa,
            'streak' => $streak,
            'target' => $target,
            'new_badges' => $new_badges,
            'pending_re_inspeksi' => $pendingReInspeksi,
            'pending_form_ok' => $pendingFormOk,
            'pending_jsa_tl' => $pendingJsaTl,
            'my_pending_observasi' => $myPendingObservasi,
            'my_pending_jsa' => $myPendingJsa,
            'my_pending_inspeksi' => $myPendingInspeksi,
            'pending_as_pic' => $pendingAsPic,
            'my_open_with_pic' => $myOpenWithPic,
        ]);
    }

    private function adminDashboard(Request $request)
    {
        $now = Carbon::now();
        $admin = $request->user();

        // ── Filters ───────────────────────────────────────────────────────────
        $allSiteValues = Site::pluck('value')->toArray();
        $validLevels = ['nonstaff', 'staff', 'srstaff'];
        $validDepartemen = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA', 'Management'];

        $bulan = max(1, min(12, (int) $request->query('bulan', $now->month)));
        $tahun = max(2020, min($now->year + 1, (int) $request->query('tahun', $now->year)));

        $adminSite = $admin->site ?? null;
        $siteDefault = ($adminSite && in_array($adminSite, $allSiteValues)) ? $adminSite : 'all';
        $siteInput = $request->query('site', $siteDefault);
        $site = ($siteInput === 'all' || in_array($siteInput, $allSiteValues)) ? $siteInput : 'all';

        $deptInput = $request->query('departemen', 'all');
        $departemen = ($deptInput === 'all' || in_array($deptInput, $validDepartemen)) ? $deptInput : 'all';

        $levelInput = $request->query('level', 'all');
        $level = ($levelInput === 'all' || in_array($levelInput, $validLevels)) ? $levelInput : 'all';

        $jabatanInput = $request->query('jabatan', 'all');
        $jabatan = $jabatanInput; // free-text, validated loosely

        $filter = [
            'bulan' => $bulan,
            'tahun' => $tahun,
            'site' => $site,
            'departemen' => $departemen,
            'level' => $level,
            'jabatan' => $jabatan,
        ];

        // ── Alert banner data (always current, not filtered) ─────────────────
        $totalKaryawan = User::where('is_admin', false)->count();
        $todayStart = $now->copy()->startOfDay();
        $todayEnd = $now->copy()->endOfDay();

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
                'id' => $bs->user->id ?? null,
                'name' => $bs->user->name ?? '-',
                'jabatan' => $bs->user->jabatan ?? null,
                'site' => $bs->user->site ?? null,
                'avatar' => $bs->user->avatar ? asset('storage/'.$bs->user->avatar) : null,
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
            'compliance' => [
                'total_karyawan' => $totalKaryawan,
                'sudah_submit_bs' => $sudahSubmitBs,
                'dilarang_list' => $dilarangHariIni,
            ],
            'overview' => $this->buildOverview($bulan, $tahun, $site, $now),
            'sap_monitoring' => $this->buildSapMonitoring($bulan, $tahun, $site, $departemen, $level, $jabatan),
            'employee_recap' => $this->buildEmployeeRecap($bulan, $tahun, $site, $departemen, $level, $jabatan),
            'filter' => $filter,
            'sites' => Site::all(['value', 'label']),
            'jabatan_options' => $jabatanOptions,
            'admin_site' => $admin->site ?? null,
        ]);
    }

    private function buildSapMonitoring(int $bulan, int $tahun, string $siteFilter, string $departemen = 'all', string $level = 'all', string $jabatan = 'all'): array
    {
        $periodStart = Carbon::create($tahun, $bulan, 1)->startOfDay();
        $periodEnd = $periodStart->copy()->endOfMonth();
        $now = Carbon::now();
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
        if ($mid->copy()->addDay()->lte($effectiveEnd)) {
            $jsaPeriodsBerlalu++;
        }

        // Users
        $userQuery = User::where('is_admin', false);
        if ($siteFilter !== 'all') {
            $userQuery->where('site', $siteFilter);
        }
        if ($departemen !== 'all') {
            $userQuery->where('departemen', $departemen);
        }
        if ($level !== 'all') {
            $userQuery->where('participation_level', $level);
        }
        if ($jabatan !== 'all') {
            $userQuery->where('jabatan', $jabatan);
        }
        $users = $userQuery->get(['id', 'participation_level']);

        $allIds = $users->pluck('id')->toArray();
        $targets = ParticipationTarget::all()->keyBy('level');
        $levels = ['nonstaff', 'staff', 'srstaff'];

        $getTarget = fn (string $level, string $field): int => (int) ($targets->get($level)?->{$field} ?? 0);

        // Batch-load submission counts
        $fetchCounts = function (string $model) use ($allIds, $periodStart, $periodEnd): array {
            if (empty($allIds)) {
                return [];
            }

            return $model::whereIn('user_id', $allIds)
                ->whereBetween('tanggal', [$periodStart->toDateString(), $periodEnd->toDateString()])
                ->selectRaw('user_id, COUNT(*) as total')
                ->groupBy('user_id')
                ->pluck('total', 'user_id')
                ->toArray();
        };

        $inspCounts = [];
        if (! empty($allIds)) {
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

        $laporanCounts = $fetchCounts(LaporanBahaya::class);
        $observasiCounts = $fetchCounts(ObservasiKeselamatan::class);
        $jsaCounts = $fetchCounts(KomunikasiJsa::class);

        $buildBreakdown = function (array $counts, string $targetField, int $periodsElapsed) use ($users, $levels, $getTarget): array {
            $rows = [];
            foreach ($levels as $level) {
                $levelUsers = $users->where('participation_level', $level);
                $targetVal = $getTarget($level, $targetField);
                $total = $levelUsers->count();

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
                    if ($cnt >= $minRequired) {
                        $onTrack++;
                    }
                }

                $rows[] = [
                    'level' => $level,
                    'total_users' => $total,
                    'on_track' => $onTrack,
                    'persen' => (int) round($onTrack / $total * 100),
                    'total_submissions' => $totalSubs,
                ];
            }

            return $rows;
        };

        $overallPersen = function (array $breakdown): int {
            $tot = $on = 0;
            foreach ($breakdown as $r) {
                if ($r['on_track'] === null) {
                    continue;
                }
                $tot += $r['total_users'];
                $on += $r['on_track'];
            }

            return $tot > 0 ? (int) round($on / $tot * 100) : 0;
        };

        $lb = $buildBreakdown($laporanCounts, 'laporan_per_minggu', $minggguBerlalu);
        $ins = $buildBreakdown($inspCounts, 'inspeksi_per_minggu', $minggguBerlalu);
        $ok = $buildBreakdown($observasiCounts, 'observasi_per_minggu', $minggguBerlalu);
        $jsa = $buildBreakdown($jsaCounts, 'jsa_per_2minggu', $jsaPeriodsBerlalu);

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
        $periodStart = Carbon::create($tahun, $bulan, 1)->startOfDay();
        $periodEnd = $periodStart->copy()->endOfMonth();
        $now = Carbon::now();
        $effectiveEnd = $now->lt($periodEnd) ? $now->copy() : $periodEnd->copy();

        // Build weeks
        $weeks = [];
        $cursor = $periodStart->copy()->startOfWeek(Carbon::MONDAY);
        while ($cursor->lte($periodEnd)) {
            $wStart = $cursor->copy()->max($periodStart);
            $wEnd = $cursor->copy()->endOfWeek(Carbon::SUNDAY)->min($periodEnd);
            if ($wStart->lte($effectiveEnd)) {
                $weeks[] = [
                    'num' => count($weeks) + 1,
                    'start' => $wStart->toDateString(),
                    'end' => $wEnd->toDateString(),
                ];
            }
            $cursor->addWeek();
        }

        // JSA period mapping: which weeks fall in period 1 (day 1–15) vs period 2 (day 16–EOM)
        $mid = $periodStart->copy()->addDays(14); // day 15
        $jsaPeriodOf = function (array $week) use ($mid): int {
            return Carbon::parse($week['start'])->lte($mid) ? 1 : 2;
        };

        // Users
        $userQuery = User::where('is_admin', false);
        if ($siteFilter !== 'all') {
            $userQuery->where('site', $siteFilter);
        }
        if ($departemen !== 'all') {
            $userQuery->where('departemen', $departemen);
        }
        if ($level !== 'all') {
            $userQuery->where('participation_level', $level);
        }
        if ($jabatan !== 'all') {
            $userQuery->where('jabatan', $jabatan);
        }
        $users = $userQuery->get(['id', 'name', 'jabatan', 'departemen', 'participation_level', 'site', 'avatar']);

        if ($users->isEmpty() || empty($weeks)) {
            return ['weeks' => $weeks, 'employees' => []];
        }

        $allIds = $users->pluck('id')->toArray();
        $targets = ParticipationTarget::all()->keyBy('level');

        // Batch-load all submissions for the entire period, keyed by user_id, then split by date
        $fetchAll = function (string $model) use ($allIds, $periodStart, $periodEnd): Collection {
            return $model::whereIn('user_id', $allIds)
                ->whereBetween('tanggal', [$periodStart->toDateString(), $periodEnd->toDateString()])
                ->get(['user_id', 'tanggal']);
        };

        $laporanRows = $fetchAll(LaporanBahaya::class)->groupBy('user_id');
        $observasiRows = $fetchAll(ObservasiKeselamatan::class)->groupBy('user_id');
        $jsaRows = $fetchAll(KomunikasiJsa::class)->groupBy('user_id');

        // Inspeksi: merge 4 models
        $inspeksiRows = collect();
        foreach ([InspeksiKantor::class, InspeksiTambang::class, InspeksiWorkshop::class, InspeksiMess::class] as $m) {
            $inspeksiRows = $inspeksiRows->concat($m::whereIn('user_id', $allIds)
                ->whereBetween('tanggal', [$periodStart->toDateString(), $periodEnd->toDateString()])
                ->get(['user_id', 'tanggal']));
        }
        $inspeksiRows = $inspeksiRows->groupBy('user_id');

        $countInRange = function (?Collection $rows, string $start, string $end): int {
            if (! $rows) {
                return 0;
            }

            return $rows->filter(fn ($r) => $r->tanggal >= $start && $r->tanggal <= $end)->count();
        };

        // JSA: track per-period fulfillment (not per-week)
        $jsaPeriodsMap = [
            1 => ['start' => $periodStart->toDateString(), 'end' => $mid->toDateString()],
            2 => ['start' => $mid->copy()->addDay()->toDateString(), 'end' => $periodEnd->toDateString()],
        ];

        $employees = $users->map(function ($user) use ($weeks, $targets, $laporanRows, $inspeksiRows, $observasiRows, $jsaRows, $countInRange, $jsaPeriodOf, $jsaPeriodsMap) {
            $level = $user->participation_level ?? 'nonstaff';
            $target = $targets->get($level);

            $lbTarget = (int) ($target?->laporan_per_minggu ?? 0);
            $insTarget = (int) ($target?->inspeksi_per_minggu ?? 0);
            $okTarget = (int) ($target?->observasi_per_minggu ?? 0);
            $jsaTarget = (int) ($target?->jsa_per_2minggu ?? 0);

            $userLaporan = $laporanRows->get($user->id);
            $userInspeksi = $inspeksiRows->get($user->id);
            $userObservasi = $observasiRows->get($user->id);
            $userJsa = $jsaRows->get($user->id);

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
                $lbCount = $countInRange($userLaporan, $week['start'], $week['end']);
                $insCount = $countInRange($userInspeksi, $week['start'], $week['end']);
                $okCount = $countInRange($userObservasi, $week['start'], $week['end']);

                $period = $jsaPeriodOf($week);
                $jsaCount = $jsaPeriodCount[$period] ?? 0;

                return [
                    'laporan' => ['count' => $lbCount,  'target' => $lbTarget,  'met' => $lbTarget > 0 ? $lbCount >= $lbTarget : null],
                    'inspeksi' => ['count' => $insCount, 'target' => $insTarget, 'met' => $insTarget > 0 ? $insCount >= $insTarget : null],
                    'observasi' => ['count' => $okCount,  'target' => $okTarget,  'met' => $okTarget > 0 ? $okCount >= $okTarget : null],
                    'jsa' => ['count' => $jsaCount, 'target' => $jsaTarget, 'met' => $jsaTarget > 0 ? $jsaCount >= $jsaTarget : null],
                ];
            }, $weeks);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'jabatan' => $user->jabatan,
                'departemen' => $user->departemen,
                'level' => $level,
                'site' => $user->site,
                'avatar' => $user->avatar ? asset('storage/'.$user->avatar) : null,
                'weeks' => $weekData,
            ];
        })->sortBy('name')->values()->toArray();

        return ['weeks' => $weeks, 'employees' => $employees];
    }

    /**
     * Cross-module summary for the admin overview: daily Bugar compliance,
     * hazard reports by risk level, open high-risk reports and per-site totals.
     */
    private function buildOverview(int $bulan, int $tahun, string $site, Carbon $now): array
    {
        $start = Carbon::create($tahun, $bulan, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();
        $lastDay = $end->lt($now) ? $end->copy() : $now->copy()->startOfDay();
        $siteFilter = $site === 'all' ? null : $site;

        $employees = User::where('is_admin', false)
            ->when($siteFilter, fn ($q) => $q->assignedToSite($siteFilter))
            ->count();

        $perDay = BugarSelamat::whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
            ->when($siteFilter, fn ($q) => $q->atSite($siteFilter))
            ->selectRaw('DATE(tanggal) as hari, COUNT(DISTINCT user_id) as jumlah')
            ->groupBy('hari')
            ->pluck('jumlah', 'hari');

        $bugarDaily = [];
        for ($d = $start->copy(); $d->lte($lastDay); $d->addDay()) {
            $count = (int) ($perDay[$d->toDateString()] ?? 0);
            $bugarDaily[] = [
                'tanggal' => $d->toDateString(),
                'persen' => $employees > 0 ? round($count / $employees * 100, 1) : 0,
            ];
        }

        $laporanMonth = LaporanBahaya::whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
            ->when($siteFilter, fn ($q) => $q->atSite($siteFilter));

        $risk = (clone $laporanMonth)->selectRaw('tingkat_risiko, COUNT(*) as jumlah')->groupBy('tingkat_risiko')->pluck('jumlah', 'tingkat_risiko');

        $attention = LaporanBahaya::whereIn('tingkat_risiko', ['AA', 'A'])
            ->where('status_tindakan', '!=', 'close')
            ->when($siteFilter, fn ($q) => $q->atSite($siteFilter))
            ->latest('tanggal')
            ->limit(5)
            ->get(['id', 'tanggal', 'lokasi', 'site', 'tingkat_risiko', 'status_tindakan']);

        $daysElapsed = max(1, $start->diffInDays($lastDay) + 1);
        $sites = Site::when($siteFilter, fn ($q) => $q->where('value', $siteFilter))->orderBy('label')->get(['value', 'label']);
        $inRange = fn ($q) => $q->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()]);

        $siteSummary = $sites->map(function (Site $s) use ($inRange, $daysElapsed) {
            $users = User::where('is_admin', false)->assignedToSite($s->value)->count();
            $userDays = DB::query()
                ->fromSub(BugarSelamat::atSite($s->value)->tap($inRange)->select('user_id', 'tanggal')->distinct(), 'hari_isi')
                ->count();
            $byUser = fn ($q) => $q->whereHas('user', fn ($u) => $u->assignedToSite($s->value));

            return [
                'site' => $s->value,
                'label' => $s->label,
                'bugar' => $users > 0 ? round((int) $userDays / ($users * $daysElapsed) * 100, 1) : 0,
                'laporan' => LaporanBahaya::atSite($s->value)->tap($inRange)->count(),
                'inspeksi' => InspeksiKantor::tap($byUser)->tap($inRange)->count()
                    + InspeksiTambang::tap($byUser)->tap($inRange)->count()
                    + InspeksiWorkshop::tap($byUser)->tap($inRange)->count()
                    + InspeksiMess::tap($byUser)->tap($inRange)->count(),
                'observasi' => ObservasiKeselamatan::atSite($s->value)->tap($inRange)->count(),
                'jsa' => KomunikasiJsa::atSite($s->value)->tap($inRange)->count(),
            ];
        })->values();

        return [
            'employees' => $employees,
            'bugar_daily' => $bugarDaily,
            'risk_distribution' => [
                'C' => (int) ($risk['C'] ?? 0),
                'B' => (int) ($risk['B'] ?? 0),
                'A' => (int) ($risk['A'] ?? 0),
                'AA' => (int) ($risk['AA'] ?? 0),
            ],
            'attention' => $attention,
            'site_summary' => $siteSummary,
        ];
    }

    private function buildAdminMonthlyTrend(Carbon $now): array
    {
        $since = $now->copy()->subMonths(5)->startOfMonth();
        $months = collect(range(5, 0))->map(fn ($i) => $now->copy()->subMonths($i));

        $bugarData = BugarSelamat::where('tanggal', '>=', $since)
            ->selectRaw($this->monthSelect('tanggal').', status_kelayakan, COUNT(*) as total')
            ->groupBy('month', 'status_kelayakan')
            ->get();

        $laporanData = LaporanBahaya::where('tanggal', '>=', $since)
            ->selectRaw($this->monthSelect('tanggal').', COUNT(*) as total')
            ->groupBy('month')->get()->keyBy('month');

        $observasiData = ObservasiKeselamatan::where('tanggal', '>=', $since)
            ->selectRaw($this->monthSelect('tanggal').', COUNT(*) as total')
            ->groupBy('month')->get()->keyBy('month');

        $inspeksiData = collect();
        foreach ([InspeksiKantor::class, InspeksiTambang::class, InspeksiWorkshop::class, InspeksiMess::class] as $model) {
            $model::where('tanggal', '>=', $since)
                ->selectRaw($this->monthSelect('tanggal').', COUNT(*) as total')
                ->groupBy('month')->get()
                ->each(function ($row) use (&$inspeksiData) {
                    $existing = $inspeksiData->get($row->month, ['month' => $row->month, 'total' => 0]);
                    $existing['total'] += $row->total;
                    $inspeksiData->put($row->month, $existing);
                });
        }

        return $months->map(function (Carbon $month) use ($bugarData, $laporanData, $observasiData, $inspeksiData) {
            $key = $month->format('Y-m');
            $label = $month->locale('id')->isoFormat('MMM YY');
            $bugar = $bugarData->where('month', $key);

            return [
                'label' => $label,
                'bugar' => (int) $bugar->sum('total'),
                'laporan' => (int) ($laporanData[$key]->total ?? 0),
                'observasi' => (int) ($observasiData[$key]->total ?? 0),
                'inspeksi' => (int) ($inspeksiData->get($key, ['total' => 0])['total'] ?? 0),
            ];
        })->values()->toArray();
    }

    private function buildSiteBreakdown(): array
    {
        $sites = Site::pluck('value')->all();

        return collect($sites)->map(fn ($site) => [
            'site' => $site,
            'bugar' => BugarSelamat::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
            'laporan' => LaporanBahaya::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
            'observasi' => ObservasiKeselamatan::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
            'inspeksi' => InspeksiKantor::whereHas('user', fn ($q) => $q->where('site', $site))->count()
                + InspeksiTambang::whereHas('user', fn ($q) => $q->where('site', $site))->count()
                + InspeksiWorkshop::whereHas('user', fn ($q) => $q->where('site', $site))->count()
                + InspeksiMess::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
        ])->toArray();
    }

    private function monthSelect(string $column): string
    {
        return DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column}) as month"
            : "DATE_FORMAT({$column}, '%Y-%m') as month";
    }
}
