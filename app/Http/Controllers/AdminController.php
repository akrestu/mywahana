<?php

namespace App\Http\Controllers;

use App\Exports\BugarSelamatExport;
use App\Exports\InductionAttendanceExport;
use App\Exports\InspeksiKantorExport;
use App\Exports\InspeksiMessExport;
use App\Exports\InspeksiTambangExport;
use App\Exports\InspeksiWorkshopExport;
use App\Exports\LaporanBahayaExport;
use App\Exports\ObservasiKeselamatanExport;
use App\Exports\UsersExport;
use App\Exports\UsersImportTemplate;
use App\Imports\UsersImport;
use App\Models\BugarSelamat;
use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\AssessmentSession;
use App\Models\AssessmentSessionQuestion;
use App\Models\HrAssessmentSession;
use App\Models\HrAssessmentSessionQuestion;
use App\Models\InductionAttendance;
use App\Models\KomunikasiJsa;
use App\Models\LaporanBahaya;
use App\Models\ObservasiKeselamatan;
use App\Notifications\LaporanBahayaPicDitugaskan;
use App\Models\ParticipationTarget;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AdminController extends Controller
{
    public function index()
    {
        return redirect()->route('app.home');

        $now        = Carbon::now();
        $todayDate  = $now->toDateString();

        $inspeksiTotal    = InspeksiKantor::count() + InspeksiTambang::count() + InspeksiWorkshop::count() + InspeksiMess::count();
        $inspeksiBulanIni = InspeksiKantor::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count()
            + InspeksiTambang::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count()
            + InspeksiWorkshop::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count()
            + InspeksiMess::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count();

        $totalKaryawan = User::where('is_admin', false)->count();
        $sudahSubmitBs = BugarSelamat::whereDate('tanggal', $todayDate)->distinct()->count('user_id');

        $dilarangHariIni = BugarSelamat::whereDate('tanggal', $todayDate)
            ->whereIn('id', function ($q) use ($todayDate) {
                $q->selectRaw('MAX(id)')
                    ->from('bugar_selamat')
                    ->whereDate('tanggal', $todayDate)
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
                'total'    => BugarSelamat::count(),
                'bulan_ini'=> BugarSelamat::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'layak'    => BugarSelamat::where('status_kelayakan', 'layak')->count(),
                'catatan'  => BugarSelamat::where('status_kelayakan', 'catatan')->count(),
                'dilarang' => BugarSelamat::where('status_kelayakan', 'dilarang')->count(),
            ],
            'laporan_bahaya' => [
                'total'    => LaporanBahaya::count(),
                'bulan_ini'=> LaporanBahaya::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'AA'       => LaporanBahaya::where('tingkat_risiko', 'AA')->count(),
                'A'        => LaporanBahaya::where('tingkat_risiko', 'A')->count(),
                'B'        => LaporanBahaya::where('tingkat_risiko', 'B')->count(),
                'C'        => LaporanBahaya::where('tingkat_risiko', 'C')->count(),
                'pending'  => LaporanBahaya::where('status_tindakan', 'pending')->count(),
                'selesai'  => LaporanBahaya::where('status_tindakan', 'selesai')->count(),
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
            'komunikasi_jsa' => [
                'total'               => KomunikasiJsa::count(),
                'bulan_ini'           => KomunikasiJsa::whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'menunggu_konfirmasi' => KomunikasiJsa::where('status', 'menunggu_konfirmasi')->count(),
            ],
        ];

        $leaderboard           = $this->buildLeaderboard($now);
        $participation_targets = ParticipationTarget::all(['level', 'laporan_per_minggu', 'inspeksi_per_minggu', 'observasi_per_minggu', 'bugar_per_hari']);

        return Inertia::render('admin/index', [
            'stats'                 => $stats,
            'trend'                 => $this->buildMonthlyTrend($now),
            'site_breakdown'        => $this->buildSiteBreakdown(),
            'leaderboard'           => $leaderboard,
            'participation_targets' => $participation_targets,
            'compliance'            => [
                'total_karyawan'  => $totalKaryawan,
                'sudah_submit_bs' => $sudahSubmitBs,
                'dilarang_list'   => $dilarangHariIni,
            ],
        ]);
    }

    public function bugarSelamat(Request $request)
    {
        $viewMode  = $request->get('view', 'harian');
        $site      = $this->adminSite($request);
        $adminSite = $request->user()->site;
        $search    = $request->filled('search') ? $request->search : null;
        $sites     = $adminSite
            ? Site::where('value', $adminSite)->get(['value', 'label'])
            : Site::orderBy('label')->get(['value', 'label']);

        // ── Harian view: semua karyawan + status hari tertentu ───────────────
        if ($viewMode === 'harian') {
            $tanggal = $request->filled('tanggal') ? $request->tanggal : today()->toDateString();

            $users = User::where('is_admin', false)
                ->when($site,   fn ($q) => $q->where('site', $site))
                ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                      ->orWhere('nik',  'like', "%$search%");
                }))
                ->orderBy('site')->orderBy('name')
                ->get(['id', 'name', 'nik', 'site']);

            $userIds = $users->pluck('id');

            $entries = BugarSelamat::whereDate('tanggal', $tanggal)
                ->whereIn('user_id', $userIds)
                ->get(['id', 'user_id', 'status_kelayakan', 'shift', 'siap_bekerja', 'hari_ke'])
                ->keyBy('user_id')
                ->map(fn ($r) => [
                    'id'           => $r->id,
                    'status'       => $r->status_kelayakan,
                    'shift'        => $r->shift,
                    'siap_bekerja' => (bool) $r->siap_bekerja,
                    'hari_ke'      => $r->hari_ke,
                ]);

            $filled   = $entries->count();
            $total    = $users->count();

            return Inertia::render('admin/bugar-selamat', [
                'view'       => 'harian',
                'tanggal'    => $tanggal,
                'users'      => $users,
                'entries'    => $entries,
                'sites'      => $sites,
                'admin_site' => $adminSite,
                'summary'    => [
                    'filled'     => $filled,
                    'not_filled' => $total - $filled,
                    'layak'      => $entries->where('status', 'layak')->count(),
                    'catatan'    => $entries->where('status', 'catatan')->count(),
                    'dilarang'   => $entries->where('status', 'dilarang')->count(),
                    'total'      => $total,
                ],
                'filters'    => $request->only('site', 'search', 'tanggal', 'view'),
            ]);
        }

        // ── Kalender view: matriks karyawan × tanggal dalam satu bulan ───────
        if ($viewMode === 'kalender') {
            $tanggal   = $request->filled('tanggal') ? $request->tanggal : today()->toDateString();
            $carbon    = Carbon::parse($tanggal);
            $startDate = $carbon->copy()->startOfMonth();
            $endDate   = $carbon->copy()->endOfMonth()->min(today());

            $users = User::where('is_admin', false)
                ->when($site,   fn ($q) => $q->where('site', $site))
                ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                      ->orWhere('nik',  'like', "%$search%");
                }))
                ->orderBy('site')->orderBy('name')
                ->get(['id', 'name', 'nik', 'site']);

            $userIds = $users->pluck('id');

            $entries = BugarSelamat::whereBetween('tanggal', [$startDate, $endDate])
                ->whereIn('user_id', $userIds)
                ->get(['id', 'user_id', 'tanggal', 'status_kelayakan', 'shift', 'siap_bekerja'])
                ->keyBy(fn ($r) => $r->user_id . '_' . Carbon::parse($r->tanggal)->toDateString())
                ->map(fn ($r) => [
                    'id'           => $r->id,
                    'status'       => $r->status_kelayakan,
                    'shift'        => $r->shift,
                    'siap_bekerja' => (bool) $r->siap_bekerja,
                ]);

            $dates   = [];
            $current = $startDate->copy();
            while ($current->lte($endDate)) {
                $dates[] = $current->toDateString();
                $current->addDay();
            }

            return Inertia::render('admin/bugar-selamat', [
                'view'       => 'kalender',
                'tanggal'    => $tanggal,
                'users'      => $users,
                'dates'      => $dates,
                'entries'    => $entries,
                'sites'      => $sites,
                'admin_site' => $adminSite,
                'summary'    => [
                    'total' => $users->count(),
                    'bulan' => $carbon->locale('id')->isoFormat('MMMM YYYY'),
                ],
                'filters'    => $request->only('site', 'search', 'tanggal', 'view'),
            ]);
        }

        // ── Riwayat/Daftar view: paginated list (existing behaviour) ─────────
        $query = BugarSelamat::with('user')->latest('tanggal');

        if ($site) {
            $query->whereHas('user', fn ($q) => $q->where('site', $site));
        }

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('nik', 'like', "%$search%");
            });
        }

        if ($request->filled('periode')) {
            match ($request->periode) {
                'hari_ini'   => $query->whereDate('tanggal', today()),
                'minggu_ini' => $query->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]),
                'bulan_ini'  => $query->whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year),
                default      => null,
            };
        }

        $summaryQuery = clone $query;
        $summaryData  = $summaryQuery->selectRaw('status_kelayakan, count(*) as total')
            ->reorder()
            ->groupBy('status_kelayakan')
            ->pluck('total', 'status_kelayakan');

        $summary = [
            'layak'    => (int) ($summaryData['layak']    ?? 0),
            'catatan'  => (int) ($summaryData['catatan']  ?? 0),
            'dilarang' => (int) ($summaryData['dilarang'] ?? 0),
            'total'    => (int) $summaryData->sum(),
        ];

        if ($request->filled('status')) {
            $query->where('status_kelayakan', $request->status);
        }

        return Inertia::render('admin/bugar-selamat', [
            'view'       => 'daftar',
            'records'    => $query->paginate(20)->withQueryString(),
            'sites'      => $sites,
            'admin_site' => $adminSite,
            'filters'    => $request->only('site', 'status', 'search', 'periode', 'view'),
            'summary'    => $summary,
        ]);
    }

    public function laporanBahaya(Request $request)
    {
        $query     = LaporanBahaya::with(['user', 'pic'])->latest('tanggal');
        $adminSite = $request->user()->site;
        $site      = $this->adminSite($request);

        if ($site) {
            $query->whereHas('user', fn ($q) => $q->where('site', $site));
        }

        if ($request->filled('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('periode')) {
            match ($request->periode) {
                'hari_ini'   => $query->whereDate('tanggal', today()),
                'minggu_ini' => $query->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]),
                'bulan_ini'  => $query->whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year),
                default      => null,
            };
        }

        // Summary dihitung sebelum filter risiko/status agar tetap menyeluruh
        $summaryQuery = clone $query;
        $riskCounts   = $summaryQuery->selectRaw('tingkat_risiko, count(*) as total')
            ->reorder()
            ->groupBy('tingkat_risiko')
            ->pluck('total', 'tingkat_risiko');

        $pendingCount = (clone $query)->where('status_tindakan', 'pending')->count();

        $summary = [
            'pending' => $pendingCount,
            'aa'      => (int) ($riskCounts['AA'] ?? 0),
            'a'       => (int) ($riskCounts['A'] ?? 0),
            'b'       => (int) ($riskCounts['B'] ?? 0),
            'c'       => (int) ($riskCounts['C'] ?? 0),
            'total'   => (int) $riskCounts->sum(),
        ];

        if ($request->filled('tingkat_risiko')) {
            $query->where('tingkat_risiko', $request->tingkat_risiko);
        }

        if ($request->filled('status_tindakan')) {
            $query->where('status_tindakan', $request->status_tindakan);
        }

        $picsQuery = \App\Models\User::whereIn('participation_level', ['staff', 'srstaff'])->orderBy('name');
        if ($adminSite) {
            $picsQuery->where('site', $adminSite);
        }

        return Inertia::render('admin/laporan-bahaya', [
            'records'    => $query->paginate(20)->withQueryString(),
            'filters'    => $request->only('site', 'tingkat_risiko', 'status_tindakan', 'search', 'periode'),
            'summary'    => $summary,
            'sites'      => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
            'pics'       => $picsQuery->get(['id', 'name', 'jabatan', 'site']),
        ]);
    }

    public function destroyBugarSelamat(BugarSelamat $bugarSelamat)
    {
        $bugarSelamat->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data berhasil dihapus.']);

        return back();
    }

    public function destroyLaporanBahaya(LaporanBahaya $laporanBahaya)
    {
        $laporanBahaya->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data berhasil dihapus.']);

        return back();
    }

    public function observasiKeselamatan(Request $request)
    {
        $query     = ObservasiKeselamatan::with(['user', 'penanggungJawab'])->latest('tanggal');
        $adminSite = $request->user()->site;
        $site      = $this->adminSite($request);

        if ($site) {
            $query->whereHas('user', fn ($q) => $q->where('site', $site));
        }

        if ($request->filled('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('periode')) {
            match ($request->periode) {
                'hari_ini'   => $query->whereDate('tanggal', today()),
                'minggu_ini' => $query->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]),
                'bulan_ini'  => $query->whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year),
                default      => null,
            };
        }

        $summary = [
            'total'              => ObservasiKeselamatan::count(),
            'menunggu_konfirmasi'=> ObservasiKeselamatan::where('status', 'menunggu_konfirmasi')->count(),
            'dikonfirmasi'       => ObservasiKeselamatan::where('status', 'dikonfirmasi')->count(),
        ];

        return Inertia::render('admin/observasi-keselamatan', [
            'records'    => $query->paginate(20)->withQueryString(),
            'filters'    => $request->only('site', 'status', 'search', 'periode'),
            'summary'    => $summary,
            'sites'      => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
        ]);
    }

    public function destroyObservasiKeselamatan(ObservasiKeselamatan $observasiKeselamatan)
    {
        $observasiKeselamatan->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data berhasil dihapus.']);

        return back();
    }

    public function inspeksiKantor(Request $request)
    {
        $query     = InspeksiKantor::with(['user', 'reInspektor'])->latest('tanggal');
        $adminSite = $request->user()->site;
        $this->applyInspeksiFilters($query, $request);

        $summary = $this->inspeksiSummary(InspeksiKantor::class);

        return Inertia::render('admin/inspeksi-kantor', [
            'records'    => $query->paginate(20)->withQueryString(),
            'filters'    => $request->only('site', 'status', 'search', 'periode'),
            'summary'    => $summary,
            'sites'      => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
        ]);
    }

    public function destroyInspeksiKantor(InspeksiKantor $inspeksiKantor)
    {
        $inspeksiKantor->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data berhasil dihapus.']);
        return back();
    }

    public function inspeksiTambang(Request $request)
    {
        $query     = InspeksiTambang::with(['user', 'reInspektor'])->latest('tanggal');
        $adminSite = $request->user()->site;
        $this->applyInspeksiFilters($query, $request);

        $summary = $this->inspeksiSummary(InspeksiTambang::class);

        return Inertia::render('admin/inspeksi-tambang', [
            'records'    => $query->paginate(20)->withQueryString(),
            'filters'    => $request->only('site', 'status', 'search', 'periode'),
            'summary'    => $summary,
            'sites'      => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
        ]);
    }

    public function destroyInspeksiTambang(InspeksiTambang $inspeksiTambang)
    {
        $inspeksiTambang->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data berhasil dihapus.']);
        return back();
    }

    public function inspeksiWorkshop(Request $request)
    {
        $query     = InspeksiWorkshop::with(['user', 'reInspektor'])->latest('tanggal');
        $adminSite = $request->user()->site;
        $this->applyInspeksiFilters($query, $request);

        $summary = $this->inspeksiSummary(InspeksiWorkshop::class);

        return Inertia::render('admin/inspeksi-workshop', [
            'records'    => $query->paginate(20)->withQueryString(),
            'filters'    => $request->only('site', 'status', 'search', 'periode'),
            'summary'    => $summary,
            'sites'      => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
        ]);
    }

    public function destroyInspeksiWorkshop(InspeksiWorkshop $inspeksiWorkshop)
    {
        $inspeksiWorkshop->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data berhasil dihapus.']);
        return back();
    }

    public function inspeksiMess(Request $request)
    {
        $query     = InspeksiMess::with(['user', 'reInspektor'])->latest('tanggal');
        $adminSite = $request->user()->site;
        $this->applyInspeksiFilters($query, $request);

        $summary = $this->inspeksiSummary(InspeksiMess::class);

        return Inertia::render('admin/inspeksi-mess', [
            'records'    => $query->paginate(20)->withQueryString(),
            'filters'    => $request->only('site', 'status', 'search', 'periode'),
            'summary'    => $summary,
            'sites'      => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
        ]);
    }

    public function destroyInspeksiMess(InspeksiMess $inspeksiMess)
    {
        $inspeksiMess->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data berhasil dihapus.']);
        return back();
    }

    public function komunikasiJsa(Request $request)
    {
        $query     = KomunikasiJsa::with(['user:id,name,nik,jabatan,site', 'teamLeader:id,name,jabatan'])
            ->latest('tanggal')
            ->latest('created_at');
        $adminSite = $request->user()->site;
        $site      = $this->adminSite($request);

        if ($site) {
            $query->whereHas('user', fn ($q) => $q->where('site', $site));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('shift')) {
            $query->where('shift', $request->shift);
        }

        if ($request->filled('periode')) {
            match ($request->periode) {
                'hari_ini'   => $query->whereDate('tanggal', today()),
                'minggu_ini' => $query->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]),
                'bulan_ini'  => $query->whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year),
                default      => null,
            };
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('judul_dokumen', 'like', "%{$request->search}%")
                    ->orWhere('lokasi', 'like', "%{$request->search}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$request->search}%")
                        ->orWhere('nik', 'like', "%{$request->search}%"));
            });
        }

        $summaryQuery = KomunikasiJsa::query();
        if ($site) {
            $summaryQuery->whereHas('user', fn ($q) => $q->where('site', $site));
        }

        $summary = [
            'total'               => $summaryQuery->count(),
            'selesai'             => (clone $summaryQuery)->where('status', 'selesai')->count(),
            'dikonfirmasi'        => (clone $summaryQuery)->where('status', 'dikonfirmasi')->count(),
            'menunggu_konfirmasi' => (clone $summaryQuery)->where('status', 'menunggu_konfirmasi')->count(),
            'ditolak'             => (clone $summaryQuery)->where('status', 'ditolak')->count(),
        ];

        return Inertia::render('admin/komunikasi-jsa', [
            'records'    => $query->paginate(20)->withQueryString(),
            'filters'    => (object) $request->only('site', 'status', 'shift', 'search', 'periode'),
            'summary'    => $summary,
            'sites'      => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
        ]);
    }

    public function destroyKomunikasiJsa(KomunikasiJsa $komunikasiJsa)
    {
        $komunikasiJsa->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data berhasil dihapus.']);
        return back();
    }

    public function assessment(Request $request)
    {
        $query = AssessmentSession::with('user:id,name,nik,jabatan,departemen,site')
            ->where('status', 'completed')
            ->latest('completed_at');

        if ($request->filled('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('nik', 'like', "%{$request->search}%"));
        }

        if ($request->filled('departemen')) {
            $query->where('departemen', $request->departemen);
        }

        if ($request->filled('passed')) {
            $query->where('passed', $request->passed === '1');
        }

        $totalCompleted = AssessmentSession::completed()->count();
        $lulusCount     = AssessmentSession::completed()->where('passed', true)->count();

        $summary = [
            'total'       => $totalCompleted,
            'lulus'       => $lulusCount,
            'tidak_lulus' => AssessmentSession::completed()->where('passed', false)->count(),
            'avg_score'   => $totalCompleted > 0
                ? round(AssessmentSession::completed()->avg('percentage'), 1)
                : 0,
            'coverage_pct' => ($totalNonAdmin = User::where('is_admin', false)->count()) > 0
                ? round(InductionAttendance::where('type', 'safety')->distinct('user_id')->count('user_id') / $totalNonAdmin * 100)
                : 0,
        ];

        $deptStats = AssessmentSession::completed()
            ->selectRaw('departemen, COUNT(*) as total, SUM(passed) as lulus')
            ->groupBy('departemen')
            ->orderBy('departemen')
            ->get()
            ->map(fn ($r) => [
                'departemen'  => $r->departemen,
                'total'       => (int) $r->total,
                'lulus'       => (int) $r->lulus,
                'pass_rate'   => $r->total > 0 ? round($r->lulus / $r->total * 100) : 0,
            ]);

        $monthlyTrend = AssessmentSession::completed()
            ->selectRaw("DATE_FORMAT(completed_at,'%Y-%m') as month, COUNT(*) as total, SUM(passed) as lulus")
            ->where('completed_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => [
                'month'     => $r->month,
                'pass_rate' => $r->total > 0 ? round($r->lulus / $r->total * 100) : 0,
                'total'     => (int) $r->total,
            ]);

        $weakQuestions = AssessmentSessionQuestion::with('question:id,question,departemen,tags')
            ->selectRaw('assessment_question_id, COUNT(*) as total_attempt, SUM(CASE WHEN is_correct=0 THEN 1 ELSE 0 END) as total_salah')
            ->groupBy('assessment_question_id')
            ->orderByDesc('total_salah')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'question_id'  => $r->assessment_question_id,
                'question'     => $r->question?->question,
                'departemen'   => $r->question?->departemen,
                'tags'         => $r->question?->tags,
                'total_attempt'=> (int) $r->total_attempt,
                'total_salah'  => (int) $r->total_salah,
                'pct_salah'    => $r->total_attempt > 0
                    ? round($r->total_salah / $r->total_attempt * 100)
                    : 0,
            ]);

        $uncoveredUsers = User::where('is_admin', false)
            ->whereNotIn('id', AssessmentSession::select('user_id')->distinct())
            ->select('id', 'name', 'nik', 'departemen', 'site')
            ->orderBy('departemen')
            ->orderBy('name')
            ->get();

        $totalNonAdminUsers = User::where('is_admin', false)->count();
        $safetyAttendanceRecords = InductionAttendance::where('type', 'safety')
            ->with('user:id,name,nik,departemen,site')
            ->latest('attended_at')
            ->limit(50)
            ->get()
            ->map(fn ($a) => [
                'user'       => $a->user,
                'attended_at'=> $a->attended_at->toIso8601String(),
                'session_id' => $a->assessment_session_id,
            ]);

        $attendanceSummary = [
            'total_tercatat' => InductionAttendance::where('type', 'safety')->count(),
            'belum_tercatat' => $totalNonAdminUsers - InductionAttendance::where('type', 'safety')->count(),
            'records'        => $safetyAttendanceRecords,
            'belum_users'    => User::where('is_admin', false)
                ->whereNotIn('id', InductionAttendance::where('type', 'safety')->select('user_id'))
                ->select('id', 'name', 'nik', 'departemen', 'site')
                ->orderBy('departemen')
                ->orderBy('name')
                ->get(),
        ];

        return Inertia::render('admin/assessment', [
            'records'           => $query->paginate(20)->withQueryString(),
            'filters'           => $request->only('search', 'departemen', 'passed'),
            'summary'           => $summary,
            'dept_stats'        => $deptStats,
            'monthly_trend'     => $monthlyTrend,
            'weak_questions'    => $weakQuestions,
            'uncovered_users'   => $uncoveredUsers,
            'attendance_summary'=> $attendanceSummary,
        ]);
    }

    public function hrAssessment(Request $request)
    {
        $query = HrAssessmentSession::with('user:id,name,nik,jabatan,site')
            ->where('status', 'completed')
            ->latest('completed_at');

        if ($request->filled('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('nik', 'like', "%{$request->search}%"));
        }

        if ($request->filled('passed')) {
            $query->where('passed', $request->passed === '1');
        }

        $totalCompleted = HrAssessmentSession::where('status', 'completed')->count();
        $lulusCount     = HrAssessmentSession::where('status', 'completed')->where('passed', true)->count();

        $summary = [
            'total'       => $totalCompleted,
            'lulus'       => $lulusCount,
            'tidak_lulus' => HrAssessmentSession::where('status', 'completed')->where('passed', false)->count(),
            'avg_score'   => $totalCompleted > 0
                ? round(HrAssessmentSession::where('status', 'completed')->avg('percentage'), 1)
                : 0,
            'coverage_pct' => ($totalNonAdmin = User::where('is_admin', false)->count()) > 0
                ? round(HrAssessmentSession::where('status', 'completed')->distinct('user_id')->count('user_id') / $totalNonAdmin * 100)
                : 0,
        ];

        $monthlyTrend = HrAssessmentSession::where('status', 'completed')
            ->selectRaw("DATE_FORMAT(completed_at,'%Y-%m') as month, COUNT(*) as total, SUM(passed) as lulus")
            ->where('completed_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => [
                'month'     => $r->month,
                'pass_rate' => $r->total > 0 ? round($r->lulus / $r->total * 100) : 0,
                'total'     => (int) $r->total,
            ]);

        $weakQuestions = HrAssessmentSessionQuestion::with('question:id,question')
            ->selectRaw('hr_assessment_question_id, COUNT(*) as total_attempt, SUM(CASE WHEN is_correct=0 THEN 1 ELSE 0 END) as total_salah')
            ->groupBy('hr_assessment_question_id')
            ->orderByDesc('total_salah')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'question_id'   => $r->hr_assessment_question_id,
                'question'      => $r->question?->question,
                'total_attempt' => (int) $r->total_attempt,
                'total_salah'   => (int) $r->total_salah,
                'pct_salah'     => $r->total_attempt > 0
                    ? round($r->total_salah / $r->total_attempt * 100)
                    : 0,
            ]);

        $uncoveredUsers = User::where('is_admin', false)
            ->whereNotIn('id', HrAssessmentSession::where('status', 'completed')->select('user_id')->distinct())
            ->select('id', 'name', 'nik', 'jabatan', 'site')
            ->orderBy('name')
            ->get();

        $totalNonAdminUsersHr = User::where('is_admin', false)->count();
        $hrAttendanceRecords = InductionAttendance::where('type', 'hr')
            ->with('user:id,name,nik,jabatan,site')
            ->latest('attended_at')
            ->limit(50)
            ->get()
            ->map(fn ($a) => [
                'user'       => $a->user,
                'attended_at'=> $a->attended_at->toIso8601String(),
                'session_id' => $a->assessment_session_id,
            ]);

        $hrAttendanceSummary = [
            'total_tercatat' => InductionAttendance::where('type', 'hr')->count(),
            'belum_tercatat' => $totalNonAdminUsersHr - InductionAttendance::where('type', 'hr')->count(),
            'records'        => $hrAttendanceRecords,
            'belum_users'    => User::where('is_admin', false)
                ->whereNotIn('id', InductionAttendance::where('type', 'hr')->select('user_id'))
                ->select('id', 'name', 'nik', 'jabatan', 'site')
                ->orderBy('name')
                ->get(),
        ];

        return Inertia::render('admin/hr-assessment', [
            'records'           => $query->paginate(20)->withQueryString(),
            'filters'           => $request->only('search', 'passed'),
            'summary'           => $summary,
            'monthly_trend'     => $monthlyTrend,
            'weak_questions'    => $weakQuestions,
            'uncovered_users'   => $uncoveredUsers,
            'attendance_summary'=> $hrAttendanceSummary,
        ]);
    }

    public function exportKomunikasiJsa(Request $request)
    {
        $query = KomunikasiJsa::with(['user:id,name,nik,jabatan,site', 'teamLeader:id,name,jabatan'])
            ->latest('tanggal');

        if ($request->filled('site')) {
            $query->whereHas('user', fn ($q) => $q->where('site', $request->site));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('shift')) {
            $query->where('shift', $request->shift);
        }
        if ($request->filled('periode')) {
            match ($request->periode) {
                'hari_ini'   => $query->whereDate('tanggal', today()),
                'minggu_ini' => $query->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]),
                'bulan_ini'  => $query->whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year),
                default      => null,
            };
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('judul_dokumen', 'like', "%{$request->search}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$request->search}%"));
            });
        }

        $records = $query->get();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = ['No', 'Tanggal', 'Nama', 'NIK', 'Jabatan', 'Site', 'Lokasi', 'Shift', 'Durasi (mnt)', 'Kegiatan', 'Judul JSA/SOP/IK', 'Jml Peserta', 'Peserta', 'Team Leader', 'Status', 'Catatan'];
        $sheet->fromArray([$headers], null, 'A1');

        $rowIndex = 2;
        $no = 0;
        foreach ($records as $r) {
            $no++;
            $sheet->fromArray([[
                $no,
                $r->tanggal?->format('d/m/Y') ?? '',
                $r->user?->name ?? '-',
                $r->user?->nik ?? '-',
                $r->user?->jabatan ?? '-',
                $r->user?->site ?? '-',
                $r->lokasi,
                $r->shift,
                $r->durasi,
                $r->kegiatan,
                $r->judul_dokumen,
                count($r->peserta ?? []),
                collect($r->peserta ?? [])->pluck('nama')->filter()->join(', '),
                $r->teamLeader?->name ?? '-',
                $r->status,
                $r->catatan ?? '-',
            ]], null, 'A' . $rowIndex);
            $rowIndex++;
        }

        foreach (range('A', 'P') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'komunikasi-jsa-' . now()->format('Ymd') . '.xlsx';
        $tmpPath = tempnam(sys_get_temp_dir(), 'jsa_export_') . '.xlsx';
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $writer->save($tmpPath);

        return response()->download($tmpPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function exportInductionAttendance(string $type)
    {
        abort_unless(in_array($type, ['safety', 'hr']), 404);

        $query = InductionAttendance::where('type', $type)
            ->with('user:id,name,nik,departemen,site')
            ->latest('attended_at');

        $label    = $type === 'safety' ? 'safety' : 'hr';
        $filename = "absensi-induksi-{$label}-" . now()->format('Ymd') . '.xlsx';

        return \Maatwebsite\Excel\Facades\Excel::download(
            new InductionAttendanceExport($query),
            $filename
        );
    }

    public function exportInspeksiKantor(Request $request)
    {
        $query = InspeksiKantor::with(['user', 'reInspektor', 'peserta'])->latest('tanggal');
        $this->applyInspeksiFilters($query, $request);
        return Excel::download(new InspeksiKantorExport($query), 'inspeksi-kantor-' . now()->format('Ymd') . '.xlsx');
    }

    public function exportInspeksiTambang(Request $request)
    {
        $query = InspeksiTambang::with(['user', 'reInspektor', 'peserta'])->latest('tanggal');
        $this->applyInspeksiFilters($query, $request);
        return Excel::download(new InspeksiTambangExport($query), 'inspeksi-tambang-' . now()->format('Ymd') . '.xlsx');
    }

    public function exportInspeksiWorkshop(Request $request)
    {
        $query = InspeksiWorkshop::with(['user', 'reInspektor', 'peserta'])->latest('tanggal');
        $this->applyInspeksiFilters($query, $request);
        return Excel::download(new InspeksiWorkshopExport($query), 'inspeksi-workshop-' . now()->format('Ymd') . '.xlsx');
    }

    public function exportInspeksiMess(Request $request)
    {
        $query = InspeksiMess::with(['user', 'reInspektor', 'peserta'])->latest('tanggal');
        $this->applyInspeksiFilters($query, $request);
        return Excel::download(new InspeksiMessExport($query), 'inspeksi-mess-' . now()->format('Ymd') . '.xlsx');
    }

    /**
     * Returns the effective site scope for the authenticated admin.
     * If the admin has a site assigned, it is always enforced regardless of request filters.
     * If not, the request's 'site' filter is used (or null for all sites).
     */
    private function adminSite(Request $request): ?string
    {
        $adminSite = $request->user()->site;
        return $adminSite ?: ($request->filled('site') ? $request->site : null);
    }

    private function applyInspeksiFilters($query, Request $request): void
    {
        $site = $this->adminSite($request);
        if ($site) {
            $query->whereHas('user', fn ($q) => $q->where('site', $site));
        }
        if ($request->filled('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('nik', 'like', "%{$request->search}%"));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('periode')) {
            match ($request->periode) {
                'hari_ini'   => $query->whereDate('tanggal', today()),
                'minggu_ini' => $query->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]),
                'bulan_ini'  => $query->whereMonth('tanggal', now()->month)->whereYear('tanggal', now()->year),
                default      => null,
            };
        }
    }

    private function inspeksiSummary(string $model): array
    {
        return [
            'total'                  => $model::count(),
            'menunggu_re_inspeksi'   => $model::where('status', 'menunggu_re_inspeksi')->count(),
            'selesai'                => $model::where('status', 'selesai')->count(),
            'ditolak'                => $model::where('status', 'ditolak')->count(),
        ];
    }

    public function exportObservasiKeselamatan(Request $request)
    {
        $query = ObservasiKeselamatan::with(['user', 'penanggungJawab'])->latest('tanggal');

        if ($request->filled('site')) {
            $query->whereHas('user', fn ($q) => $q->where('site', $request->site));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Excel::download(
            new ObservasiKeselamatanExport($query),
            'observasi-keselamatan-' . now()->format('Ymd') . '.xlsx'
        );
    }

    public function updateStatus(Request $request, LaporanBahaya $laporanBahaya)
    {
        $request->validate([
            'status_tindakan' => ['required', 'in:pending,continue,progress,close'],
            'pic_user_id'     => ['nullable', 'exists:users,id'],
        ]);

        $oldPicId = $laporanBahaya->pic_user_id;

        $laporanBahaya->update(array_filter([
            'status_tindakan' => $request->status_tindakan,
            'pic_user_id'     => $request->has('pic_user_id') ? $request->pic_user_id : $laporanBahaya->pic_user_id,
        ], fn($v) => $v !== null || $request->has('pic_user_id')));

        // Kirim notif ke PIC baru jika PIC berubah
        $newPicId = $laporanBahaya->fresh()->pic_user_id;
        if ($newPicId && $newPicId !== $oldPicId) {
            $laporanBahaya->load('user', 'pic');
            $laporanBahaya->pic->notify(new LaporanBahayaPicDitugaskan($laporanBahaya));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status tindakan berhasil diperbarui.']);

        return back();
    }

    public function targets(Request $request)
    {
        $targets = ParticipationTarget::all(['level', 'laporan_per_minggu', 'inspeksi_per_minggu', 'observasi_per_minggu', 'bugar_per_hari']);

        $query = User::where('is_admin', false)->orderBy('name');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('site')) {
            $query->where('site', $request->site);
        }
        if ($request->filled('participation_level')) {
            $query->where('participation_level', $request->participation_level);
        }

        return Inertia::render('admin/targets', [
            'targets' => $targets,
            'users'   => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('search', 'site', 'participation_level'),
            'sites'   => Site::orderBy('label')->get(['value', 'label']),
        ]);
    }

    public function updateTarget(Request $request, string $level)
    {
        $request->validate([
            'laporan_per_minggu'  => ['required', 'integer', 'min:0', 'max:20'],
            'inspeksi_per_minggu' => ['required', 'integer', 'min:0', 'max:20'],
            'observasi_per_minggu'=> ['required', 'integer', 'min:0', 'max:20'],
            'bugar_per_hari'      => ['required', 'integer', 'min:0', 'max:3'],
        ]);

        ParticipationTarget::updateOrCreate(
            ['level' => $level],
            [
                'laporan_per_minggu'  => $request->laporan_per_minggu,
                'inspeksi_per_minggu' => $request->inspeksi_per_minggu,
                'observasi_per_minggu'=> $request->observasi_per_minggu,
                'bugar_per_hari'      => $request->bugar_per_hari,
                'updated_by'          => auth()->id(),
            ]
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Target berhasil diperbarui.']);

        return back();
    }

    public function updateUserLevel(Request $request, User $user)
    {
        $request->validate([
            'participation_level' => ['required', 'in:nonstaff,staff,srstaff'],
        ]);

        $user->update(['participation_level' => $request->participation_level]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Level partisipasi karyawan berhasil diperbarui.']);

        return back();
    }

    public function exportBugarSelamat(Request $request)
    {
        $query = BugarSelamat::with('user')->orderBy('tanggal')->orderBy('created_at');

        if ($request->filled('site')) {
            $query->whereHas('user', fn ($q) => $q->where('site', $request->site));
        }
        if ($request->filled('status')) {
            $query->where('status_kelayakan', $request->status);
        }
        if ($request->filled('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }

        $filename = 'bugar-selamat-' . now()->format('Y-m-d') . '.xlsx';

        return Excel::download(new BugarSelamatExport($query), $filename);
    }

    public function exportLaporanBahaya(Request $request)
    {
        $query = LaporanBahaya::with(['user', 'pic'])->orderBy('created_at');

        if ($request->filled('site')) {
            $query->whereHas('user', fn ($q) => $q->where('site', $request->site));
        }
        if ($request->filled('tingkat_risiko')) {
            $query->where('tingkat_risiko', $request->tingkat_risiko);
        }
        if ($request->filled('status_tindakan')) {
            $query->where('status_tindakan', $request->status_tindakan);
        }
        if ($request->filled('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }

        $filename = 'laporan-bahaya-' . now()->format('Y-m-d') . '.xlsx';

        return Excel::download(new LaporanBahayaExport($query), $filename);
    }

    public function users(Request $request)
    {
        $query     = User::query()->latest();
        $adminSite = $request->user()->site;
        $site      = $this->adminSite($request);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }
        if ($site) {
            $query->where('site', $site);
        }
        if ($request->filled('is_admin')) {
            $query->where('is_admin', $request->is_admin === '1');
        }
        if ($request->filled('participation_level')) {
            $query->where('participation_level', $request->participation_level);
        }

        return Inertia::render('admin/users', [
            'users'      => $query->paginate(20)->withQueryString(),
            'filters'    => $request->only('search', 'site', 'is_admin', 'participation_level'),
            'sites'      => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
        ]);
    }

    public function createUser()
    {
        return Inertia::render('admin/user-form', [
            'mode'  => 'create',
            'sites' => Site::orderBy('label')->get(['value', 'label']),
        ]);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'name'                => ['required', 'string', 'max:255'],
            'nik'                 => ['required', 'string', 'max:50', 'unique:users,nik'],
            'email'               => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password'            => ['required', 'string', 'min:8', 'confirmed'],
            'jabatan'             => ['nullable', 'string', 'max:255'],
            'departemen'          => ['nullable', 'in:Production,Maintenance,Supply Chain,Engineering,HSE,HRGA,Management'],
            'site'                => ['nullable', 'string', Rule::exists('sites', 'value')],
            'is_admin'            => ['boolean'],
            'participation_level' => ['required', 'in:nonstaff,staff,srstaff'],
        ]);

        User::create([
            'name'                => $request->name,
            'nik'                 => $request->nik,
            'email'               => $request->email,
            'password'            => Hash::make($request->password),
            'jabatan'             => $request->jabatan,
            'departemen'          => $request->departemen,
            'site'                => $request->site,
            'is_admin'            => $request->boolean('is_admin'),
            'participation_level' => $request->participation_level,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengguna berhasil ditambahkan.']);

        return redirect()->route('admin.users');
    }

    public function editUser(User $user)
    {
        return Inertia::render('admin/user-form', [
            'mode'  => 'edit',
            'user'  => $user->only('id', 'name', 'nik', 'email', 'jabatan', 'departemen', 'site', 'is_admin', 'participation_level'),
            'sites' => Site::orderBy('label')->get(['value', 'label']),
        ]);
    }

    public function updateUser(Request $request, User $user)
    {
        $request->validate([
            'name'                => ['required', 'string', 'max:255'],
            'nik'                 => ['required', 'string', 'max:50', 'unique:users,nik,' . $user->id],
            'email'               => ['nullable', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password'            => ['nullable', 'string', 'min:8', 'confirmed'],
            'jabatan'             => ['nullable', 'string', 'max:255'],
            'departemen'          => ['nullable', 'in:Production,Maintenance,Supply Chain,Engineering,HSE,HRGA,Management'],
            'site'                => ['nullable', 'string', Rule::exists('sites', 'value')],
            'is_admin'            => ['boolean'],
            'participation_level' => ['required', 'in:nonstaff,staff,srstaff'],
        ]);

        $data = [
            'name'                => $request->name,
            'nik'                 => $request->nik,
            'email'               => $request->email,
            'jabatan'             => $request->jabatan,
            'departemen'          => $request->departemen,
            'site'                => $request->site,
            'is_admin'            => $request->boolean('is_admin'),
            'participation_level' => $request->participation_level,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data pengguna berhasil diperbarui.']);

        return redirect()->route('admin.users');
    }

    public function destroyUser(User $user)
    {
        abort_if($user->id === auth()->id(), 403, 'Tidak dapat menghapus akun sendiri.');

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengguna berhasil dihapus.']);

        return back();
    }

    public function exportUsers(Request $request)
    {
        $query = User::query()->latest();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('site')) {
            $query->where('site', $request->site);
        }
        if ($request->filled('is_admin')) {
            $query->where('is_admin', $request->is_admin === '1');
        }
        if ($request->filled('participation_level')) {
            $query->where('participation_level', $request->participation_level);
        }

        $filename = 'users-' . now()->format('Y-m-d') . '.xlsx';

        return Excel::download(new UsersExport($query), $filename);
    }

    public function importTemplate()
    {
        return Excel::download(new UsersImportTemplate(), 'template-import-users.xlsx');
    }

    public function importUsers(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:2048'],
        ]);

        $import = new UsersImport();
        Excel::import($import, $request->file('file'));

        $msg = "Import selesai. {$import->imported} pengguna diproses";
        if ($import->skipped > 0) {
            $msg .= ", {$import->skipped} dilewati (tidak ada perubahan)";
        }
        $msg .= '.';
        Inertia::flash('toast', ['type' => 'success', 'message' => $msg]);

        return back();
    }

    public function batchDestroyBugarSelamat(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        BugarSelamat::whereIn('id', $ids)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data berhasil dihapus.']);
        return back();
    }

    public function batchDestroyLaporanBahaya(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        LaporanBahaya::whereIn('id', $ids)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data berhasil dihapus.']);
        return back();
    }

    public function batchDestroyObservasiKeselamatan(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        ObservasiKeselamatan::whereIn('id', $ids)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data berhasil dihapus.']);
        return back();
    }

    public function batchDestroyKomunikasiJsa(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        KomunikasiJsa::whereIn('id', $ids)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data berhasil dihapus.']);
        return back();
    }

    public function batchDestroyInspeksiKantor(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        InspeksiKantor::whereIn('id', $ids)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data berhasil dihapus.']);
        return back();
    }

    public function batchDestroyInspeksiTambang(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        InspeksiTambang::whereIn('id', $ids)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data berhasil dihapus.']);
        return back();
    }

    public function batchDestroyInspeksiWorkshop(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        InspeksiWorkshop::whereIn('id', $ids)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data berhasil dihapus.']);
        return back();
    }

    public function batchDestroyInspeksiMess(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        InspeksiMess::whereIn('id', $ids)->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data berhasil dihapus.']);
        return back();
    }

    public function destroyAssessmentSession(AssessmentSession $session)
    {
        \DB::transaction(function () use ($session) {
            AssessmentSessionQuestion::where('assessment_session_id', $session->id)->delete();
            InductionAttendance::where('type', 'safety')->where('assessment_session_id', $session->id)->delete();
            $session->delete();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data assessment berhasil dihapus.']);
        return back();
    }

    public function destroyHrAssessmentSession(HrAssessmentSession $session)
    {
        \DB::transaction(function () use ($session) {
            HrAssessmentSessionQuestion::where('hr_assessment_session_id', $session->id)->delete();
            InductionAttendance::where('type', 'hr')->where('assessment_session_id', $session->id)->delete();
            $session->delete();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data HR assessment berhasil dihapus.']);
        return back();
    }

    public function batchDestroyAssessmentSession(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        \DB::transaction(function () use ($ids) {
            AssessmentSessionQuestion::whereIn('assessment_session_id', $ids)->delete();
            InductionAttendance::where('type', 'safety')->whereIn('assessment_session_id', $ids)->delete();
            AssessmentSession::whereIn('id', $ids)->delete();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data assessment berhasil dihapus.']);
        return back();
    }

    public function batchDestroyHrAssessmentSession(Request $request)
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];
        \DB::transaction(function () use ($ids) {
            HrAssessmentSessionQuestion::whereIn('hr_assessment_session_id', $ids)->delete();
            InductionAttendance::where('type', 'hr')->whereIn('assessment_session_id', $ids)->delete();
            HrAssessmentSession::whereIn('id', $ids)->delete();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => count($ids) . ' data HR assessment berhasil dihapus.']);
        return back();
    }

    private function buildLeaderboard(Carbon $now): array
    {
        $sites  = Site::pluck('value')->all();
        $result = [];

        foreach ($sites as $site) {
            $users = User::where('is_admin', false)
                ->where('site', $site)
                ->withCount([
                    'bugarSelamats as bs_count'   => fn ($q) => $q->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year),
                    'laporanBahayas as lb_count'  => fn ($q) => $q->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year),
                ])
                ->get(['id', 'name', 'jabatan', 'avatar'])
                ->map(fn ($u) => [
                    'id'      => $u->id,
                    'name'    => $u->name,
                    'jabatan' => $u->jabatan,
                    'avatar'  => $u->avatar && \Illuminate\Support\Facades\Storage::disk('public')->exists($u->avatar) ? asset('storage/' . $u->avatar) : null,
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

    private function buildMonthlyTrend(Carbon $now): array
    {
        $since  = $now->copy()->subMonths(5)->startOfMonth();
        $months = collect(range(5, 0))->map(fn ($i) => $now->copy()->subMonths($i));

        $bugarData = BugarSelamat::where('tanggal', '>=', $since)
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, COUNT(*) as total")
            ->groupBy('month')->get()->keyBy('month');

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

            return [
                'label'     => $label,
                'bugar'     => (int) ($bugarData[$key]->total ?? 0),
                'laporan'   => (int) ($laporanData[$key]->total ?? 0),
                'observasi' => (int) ($observasiData[$key]->total ?? 0),
                'inspeksi'  => (int) ($inspeksiData->get($key, ['total' => 0])['total'] ?? 0),
            ];
        })->values()->toArray();
    }

    private function buildSiteBreakdown(): array
    {
        $sites = Site::pluck('value')->all();

        $aggregate = fn (string $table) => \DB::table($table)
            ->join('users', 'users.id', '=', $table . '.user_id')
            ->selectRaw('users.site, COUNT(*) as total')
            ->groupBy('users.site')
            ->pluck('total', 'users.site');

        $bugar     = $aggregate('bugar_selamat');
        $laporan   = $aggregate('laporan_bahaya');
        $observasi = $aggregate('observasi_keselamatan');

        $inspeksiTables = ['inspeksi_kantor', 'inspeksi_tambang', 'inspeksi_workshop', 'inspeksi_mess'];
        $inspeksi = collect($inspeksiTables)
            ->reduce(function ($carry, $table) use ($aggregate) {
                return $carry->mergeRecursive($aggregate($table)->toArray());
            }, collect())
            ->map(fn ($v) => is_array($v) ? array_sum($v) : $v);

        return collect($sites)->map(fn ($site) => [
            'site'      => $site,
            'bugar'     => (int) ($bugar[$site] ?? 0),
            'laporan'   => (int) ($laporan[$site] ?? 0),
            'observasi' => (int) ($observasi[$site] ?? 0),
            'inspeksi'  => (int) ($inspeksi[$site] ?? 0),
        ])->toArray();
    }
}
