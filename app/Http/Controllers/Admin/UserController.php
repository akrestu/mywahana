<?php

namespace App\Http\Controllers\Admin;

use App\Exports\UsersExport;
use App\Exports\UsersImportTemplate;
use App\Http\Controllers\Controller;
use App\Imports\UsersImport;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Manajemen pengguna oleh admin. Admin yang terikat site hanya boleh
 * mengelola user di site-nya sendiri.
 */
class UserController extends Controller
{
    public function updateUserLevel(Request $request, User $user)
    {
        $this->ensureManagesUser($request, $user);

        $request->validate([
            'participation_level' => ['required', 'in:nonstaff,staff,srstaff'],
        ]);

        $user->update(['participation_level' => $request->participation_level]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Level partisipasi karyawan berhasil diperbarui.']);

        return back();
    }

    public function users(Request $request)
    {
        $query = User::query()->latest();
        $adminSite = $request->user()->site;
        $site = $this->adminSite($request);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }
        if ($site) {
            $query->assignedToSite($site);
        }
        // Tab counts follow site and search, but not the level/admin tab itself.
        $countBase = (clone $query)->reorder();
        $levelCounts = [
            'all' => (clone $countBase)->count(),
            'nonstaff' => (clone $countBase)->where(fn ($q) => $q->where('participation_level', 'nonstaff')->orWhereNull('participation_level'))->count(),
            'staff' => (clone $countBase)->where('participation_level', 'staff')->count(),
            'srstaff' => (clone $countBase)->where('participation_level', 'srstaff')->count(),
            'admin' => (clone $countBase)->where('is_admin', true)->count(),
        ];

        if ($request->filled('is_admin')) {
            $query->where('is_admin', $request->is_admin === '1');
        }
        if ($request->filled('participation_level')) {
            $query->where('participation_level', $request->participation_level);
        }

        return Inertia::render('admin/users', [
            'users' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('search', 'site', 'is_admin', 'participation_level'),
            'sites' => $adminSite
                ? Site::where('value', $adminSite)->get(['value', 'label'])
                : Site::orderBy('label')->get(['value', 'label']),
            'admin_site' => $adminSite,
            'level_counts' => $levelCounts,
        ]);
    }

    public function createUser(Request $request)
    {
        return Inertia::render('admin/user-form', [
            'mode' => 'create',
            'sites' => $this->manageableSites($request),
        ]);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nik' => ['required', 'string', 'max:50', 'unique:users,nik'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'departemen' => ['nullable', 'in:Production,Maintenance,Supply Chain,Engineering,HSE,HRGA,Management'],
            'site' => ['nullable', 'string', Rule::exists('sites', 'value')],
            'site_ids' => ['nullable', 'array'],
            'site_ids.*' => ['string', Rule::exists('sites', 'value')],
            'is_admin' => ['boolean'],
            'participation_level' => ['required', 'in:nonstaff,staff,srstaff'],
        ]);

        $adminSite = $request->user()->site;

        $user = User::create([
            'name' => $request->name,
            'nik' => $request->nik,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'jabatan' => $request->jabatan,
            'departemen' => $request->departemen,
            // Admin site hanya boleh membuat user non-admin di site-nya sendiri.
            'site' => $adminSite ?: $request->site,
            'is_admin' => $adminSite ? false : $request->boolean('is_admin'),
            'participation_level' => $request->participation_level,
        ]);

        $this->syncUserSites($user, $adminSite ? [] : $request->input('site_ids', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengguna berhasil ditambahkan.']);

        return redirect()->route('admin.users');
    }

    public function editUser(Request $request, User $user)
    {
        $this->ensureManagesUser($request, $user);

        return Inertia::render('admin/user-form', [
            'mode' => 'edit',
            'user' => [
                ...$user->only('id', 'name', 'nik', 'email', 'jabatan', 'departemen', 'site', 'is_admin', 'participation_level'),
                'site_ids' => $user->sites()->pluck('sites.value')->all(),
            ],
            'sites' => $this->manageableSites($request),
        ]);
    }

    public function updateUser(Request $request, User $user)
    {
        $this->ensureManagesUser($request, $user);

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nik' => ['required', 'string', 'max:50', 'unique:users,nik,'.$user->id],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'departemen' => ['nullable', 'in:Production,Maintenance,Supply Chain,Engineering,HSE,HRGA,Management'],
            'site' => ['nullable', 'string', Rule::exists('sites', 'value')],
            'site_ids' => ['nullable', 'array'],
            'site_ids.*' => ['string', Rule::exists('sites', 'value')],
            'is_admin' => ['boolean'],
            'participation_level' => ['required', 'in:nonstaff,staff,srstaff'],
        ]);

        $data = [
            'name' => $request->name,
            'nik' => $request->nik,
            'email' => $request->email,
            'jabatan' => $request->jabatan,
            'departemen' => $request->departemen,
            'site' => $request->site,
            'is_admin' => $request->boolean('is_admin'),
            'participation_level' => $request->participation_level,
        ];

        $adminSite = $request->user()->site;
        if ($adminSite) {
            // Admin site tidak boleh memindahkan user keluar site-nya, mengosongkan
            // site (menjadi admin global), atau mengubah status admin.
            $data['site'] = $adminSite;
            $data['is_admin'] = $user->is_admin;
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $siteIds = $adminSite
            ? $user->sites()->pluck('sites.value')->all()
            : $request->input('site_ids', []);

        $user->update($data);
        $this->syncUserSites($user, $siteIds);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data pengguna berhasil diperbarui.']);

        return redirect()->route('admin.users');
    }

    public function destroyUser(Request $request, User $user)
    {
        $this->ensureManagesUser($request, $user);
        abort_if($user->id === auth()->id(), 403, 'Tidak dapat menghapus akun sendiri.');

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengguna berhasil dihapus.']);

        return back();
    }

    private function syncUserSites(User $user, array $siteIds): void
    {
        $validatedSiteIds = Site::whereIn('value', $siteIds)->pluck('id')->all();

        if ($user->site) {
            $primarySiteId = Site::where('value', $user->site)->value('id');
            if ($primarySiteId) {
                $validatedSiteIds[] = $primarySiteId;
            }
        }

        $user->sites()->sync(array_unique($validatedSiteIds));
    }

    public function exportUsers(Request $request)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $query = User::query()->latest();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('nik', 'like', "%{$request->search}%");
            });
        }
        if ($site = $this->adminSite($request)) {
            $query->assignedToSite($site);
        }
        if ($request->filled('is_admin')) {
            $query->where('is_admin', $request->is_admin === '1');
        }
        if ($request->filled('participation_level')) {
            $query->where('participation_level', $request->participation_level);
        }

        $filename = 'users-'.now()->format('Y-m-d').'.xlsx';

        return Excel::download(new UsersExport($query), $filename);
    }

    public function importTemplate()
    {
        return Excel::download(new UsersImportTemplate, 'template-import-users.xlsx');
    }

    public function importUsers(Request $request)
    {
        // Import bisa mengubah status admin, site, dan password user mana pun,
        // jadi hanya admin global yang boleh memakainya.
        abort_if((bool) $request->user()->site, 403, 'Import pengguna hanya untuk admin pusat.');

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:2048'],
        ]);

        $import = new UsersImport;
        Excel::import($import, $request->file('file'));

        $msg = "Import selesai. {$import->imported} pengguna diproses";
        if ($import->skipped > 0) {
            $msg .= ", {$import->skipped} dilewati (tidak ada perubahan)";
        }
        $msg .= '.';
        Inertia::flash('toast', ['type' => 'success', 'message' => $msg]);

        return back();
    }

    /**
     * Admin site hanya boleh mengelola user di site-nya dan tidak boleh
     * menyentuh admin global.
     */
    private function ensureManagesUser(Request $request, User $user): void
    {
        $adminSite = $request->user()->site;

        if (! $adminSite) {
            return;
        }

        abort_if($user->is_admin && ! $user->site, 403);
        abort_unless(User::whereKey($user->id)->assignedToSite($adminSite)->exists(), 403);
    }

    private function manageableSites(Request $request)
    {
        $adminSite = $request->user()->site;

        return Site::when($adminSite, fn ($q) => $q->where('value', $adminSite))
            ->orderBy('label')
            ->get(['value', 'label']);
    }

    private function adminSite(Request $request): ?string
    {
        $adminSite = $request->user()->site;

        return $adminSite ?: ($request->filled('site') ? $request->site : null);
    }
}
