<?php

namespace App\Http\Controllers;

use App\Exports\BugarSelamatExport;
use App\Exports\LaporanBahayaExport;
use App\Exports\UsersExport;
use App\Exports\UsersImportTemplate;
use App\Imports\UsersImport;
use App\Models\BugarSelamat;
use App\Models\LaporanBahaya;
use App\Models\ParticipationTarget;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AdminController extends Controller
{
    public function index()
    {
        $now = Carbon::now();

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
            'users' => [
                'total'    => User::where('is_admin', false)->count(),
                'baratama' => User::where('is_admin', false)->where('site', 'baratama')->count(),
                'bandhawa' => User::where('is_admin', false)->where('site', 'bandhawa')->count(),
            ],
        ];

        return Inertia::render('admin/index', [
            'stats'          => $stats,
            'trend'          => $this->buildMonthlyTrend($now),
            'site_breakdown' => $this->buildSiteBreakdown(),
        ]);
    }

    public function bugarSelamat(Request $request)
    {
        $query = BugarSelamat::with('user')->latest('tanggal');

        if ($request->filled('site')) {
            $query->whereHas('user', fn ($q) => $q->where('site', $request->site));
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

        // Summary dihitung sebelum filter status agar selalu mencerminkan gambaran menyeluruh
        $summaryQuery = clone $query;
        $summaryData  = $summaryQuery->selectRaw('status_kelayakan, count(*) as total')
            ->groupBy('status_kelayakan')
            ->pluck('total', 'status_kelayakan');

        $summary = [
            'layak'    => (int) ($summaryData['layak'] ?? 0),
            'catatan'  => (int) ($summaryData['catatan'] ?? 0),
            'dilarang' => (int) ($summaryData['dilarang'] ?? 0),
            'total'    => (int) $summaryData->sum(),
        ];

        if ($request->filled('status')) {
            $query->where('status_kelayakan', $request->status);
        }

        return Inertia::render('admin/bugar-selamat', [
            'records' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('site', 'status', 'search', 'periode'),
            'summary' => $summary,
        ]);
    }

    public function laporanBahaya(Request $request)
    {
        $query = LaporanBahaya::with('user')->latest('tanggal');

        if ($request->filled('site')) {
            $query->whereHas('user', fn ($q) => $q->where('site', $request->site));
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

        return Inertia::render('admin/laporan-bahaya', [
            'records' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('site', 'tingkat_risiko', 'status_tindakan', 'search', 'periode'),
            'summary' => $summary,
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

    public function updateStatus(Request $request, LaporanBahaya $laporanBahaya)
    {
        $request->validate([
            'status_tindakan' => ['required', 'in:pending,selesai'],
        ]);

        $laporanBahaya->update(['status_tindakan' => $request->status_tindakan]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status tindakan berhasil diperbarui.']);

        return back();
    }

    public function targets()
    {
        $targets = ParticipationTarget::all(['level', 'laporan_per_minggu', 'bugar_per_hari']);

        $users = User::where('is_admin', false)
            ->get(['id', 'name', 'nik', 'jabatan', 'site', 'participation_level']);

        return Inertia::render('admin/targets', [
            'targets' => $targets,
            'users'   => $users,
        ]);
    }

    public function updateTarget(Request $request, string $level)
    {
        $request->validate([
            'laporan_per_minggu' => ['required', 'integer', 'min:0', 'max:20'],
            'bugar_per_hari'     => ['required', 'integer', 'min:0', 'max:3'],
        ]);

        ParticipationTarget::updateOrCreate(
            ['level' => $level],
            [
                'laporan_per_minggu' => $request->laporan_per_minggu,
                'bugar_per_hari'     => $request->bugar_per_hari,
                'updated_by'         => auth()->id(),
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
        $query = BugarSelamat::with('user')->latest('tanggal');

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
        $query = LaporanBahaya::with('user')->latest('tanggal');

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

        return Inertia::render('admin/users', [
            'users'   => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('search', 'site', 'is_admin', 'participation_level'),
        ]);
    }

    public function createUser()
    {
        return Inertia::render('admin/user-form', ['mode' => 'create']);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'name'                => ['required', 'string', 'max:255'],
            'nik'                 => ['required', 'string', 'max:50', 'unique:users,nik'],
            'email'               => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password'            => ['required', 'string', 'min:8', 'confirmed'],
            'jabatan'             => ['nullable', 'string', 'max:255'],
            'site'                => ['nullable', 'in:baratama,bandhawa'],
            'is_admin'            => ['boolean'],
            'participation_level' => ['required', 'in:nonstaff,staff,srstaff'],
        ]);

        User::create([
            'name'                => $request->name,
            'nik'                 => $request->nik,
            'email'               => $request->email,
            'password'            => Hash::make($request->password),
            'jabatan'             => $request->jabatan,
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
            'mode' => 'edit',
            'user' => $user->only('id', 'name', 'nik', 'email', 'jabatan', 'site', 'is_admin', 'participation_level'),
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
            'site'                => ['nullable', 'in:baratama,bandhawa'],
            'is_admin'            => ['boolean'],
            'participation_level' => ['required', 'in:nonstaff,staff,srstaff'],
        ]);

        $data = [
            'name'                => $request->name,
            'nik'                 => $request->nik,
            'email'               => $request->email,
            'jabatan'             => $request->jabatan,
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

        Inertia::flash('toast', ['type' => 'success', 'message' => "Import selesai. {$import->imported} pengguna diproses."]);

        return back();
    }

    private function buildMonthlyTrend(Carbon $now): array
    {
        $months = collect(range(5, 0))->map(fn ($i) => $now->copy()->subMonths($i));

        $bugarData = BugarSelamat::where('tanggal', '>=', $now->copy()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, status_kelayakan, COUNT(*) as total")
            ->groupBy('month', 'status_kelayakan')
            ->get();

        $laporanData = LaporanBahaya::where('tanggal', '>=', $now->copy()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(tanggal, '%Y-%m') as month, tingkat_risiko, COUNT(*) as total")
            ->groupBy('month', 'tingkat_risiko')
            ->get();

        return $months->map(function (Carbon $month) use ($bugarData, $laporanData) {
            $key   = $month->format('Y-m');
            $label = $month->locale('id')->isoFormat('MMM YY');

            $bugar   = $bugarData->where('month', $key);
            $laporan = $laporanData->where('month', $key);

            return [
                'label'    => $label,
                'layak'    => (int) $bugar->where('status_kelayakan', 'layak')->sum('total'),
                'catatan'  => (int) $bugar->where('status_kelayakan', 'catatan')->sum('total'),
                'dilarang' => (int) $bugar->where('status_kelayakan', 'dilarang')->sum('total'),
                'AA'       => (int) $laporan->where('tingkat_risiko', 'AA')->sum('total'),
                'A'        => (int) $laporan->where('tingkat_risiko', 'A')->sum('total'),
                'B'        => (int) $laporan->where('tingkat_risiko', 'B')->sum('total'),
                'C'        => (int) $laporan->where('tingkat_risiko', 'C')->sum('total'),
            ];
        })->values()->toArray();
    }

    private function buildSiteBreakdown(): array
    {
        return collect(['baratama', 'bandhawa'])->map(fn ($site) => [
            'site'    => ucfirst($site),
            'bugar'   => BugarSelamat::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
            'laporan' => LaporanBahaya::whereHas('user', fn ($q) => $q->where('site', $site))->count(),
        ])->toArray();
    }
}
