<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ParticipationTarget;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TargetController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('is_admin', false)->orderBy('name');

        if ($request->filled('search')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('nik', 'like', "%{$request->search}%"));
        }
        if ($request->filled('site')) {
            $query->where('site', $request->site);
        }
        if ($request->filled('participation_level')) {
            $query->where('participation_level', $request->participation_level);
        }

        return Inertia::render('admin/targets', [
            'targets' => ParticipationTarget::all(['level', 'laporan_per_minggu', 'inspeksi_per_minggu', 'observasi_per_minggu', 'bugar_per_hari']),
            'users' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only('search', 'site', 'participation_level'),
            'sites' => Site::orderBy('label')->get(['value', 'label']),
        ]);
    }

    public function update(Request $request, string $level)
    {
        $validated = $request->validate([
            'laporan_per_minggu' => ['required', 'integer', 'min:0', 'max:20'],
            'inspeksi_per_minggu' => ['required', 'integer', 'min:0', 'max:20'],
            'observasi_per_minggu' => ['required', 'integer', 'min:0', 'max:20'],
            'bugar_per_hari' => ['required', 'integer', 'min:0', 'max:3'],
        ]);

        ParticipationTarget::updateOrCreate(
            ['level' => $level],
            $validated + ['updated_by' => $request->user()->id],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Target berhasil diperbarui.']);

        return back();
    }
}
