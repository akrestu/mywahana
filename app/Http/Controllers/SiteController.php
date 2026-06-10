<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SiteController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/sites', [
            'sites' => Site::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'value' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:sites,value'],
            'label' => ['required', 'string', 'max:255'],
        ]);

        Site::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Site berhasil ditambahkan.']);

        return redirect()->route('admin.sites.index');
    }

    public function update(Request $request, Site $site)
    {
        $validated = $request->validate([
            'value' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('sites', 'value')->ignore($site->id)],
            'label' => ['required', 'string', 'max:255'],
        ]);

        $oldValue = $site->value;

        $site->update($validated);

        if ($oldValue !== $validated['value']) {
            User::where('site', $oldValue)->update(['site' => $validated['value']]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Site berhasil diperbarui.']);

        return redirect()->route('admin.sites.index');
    }

    public function destroy(Site $site)
    {
        $site->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Site berhasil dihapus.']);

        return redirect()->route('admin.sites.index');
    }
}
