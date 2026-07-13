<?php

namespace App\Http\Controllers;

use App\Models\InspeksiWorkshop;
use App\Models\Site;
use App\Models\User;
use App\Notifications\InspeksiWorkshopDibuat;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspeksiWorkshopController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $myRecords = InspeksiWorkshop::where('user_id', $user->id)
            ->orWhereHas('peserta', fn($q) => $q->where('user_id', $user->id))
            ->with('reInspektor:id,name,jabatan')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'my_page');

        $pendingReInspeksi = InspeksiWorkshop::where('re_inspektor_id', $user->id)
            ->where('status', 'menunggu_re_inspeksi')
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_page');

        $selesaiAsRI = InspeksiWorkshop::where('re_inspektor_id', $user->id)
            ->whereIn('status', ['selesai', 'ditolak'])
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_done_page');

        return Inertia::render('sap/inspeksi-workshop/index', [
            'myRecords'         => $myRecords,
            'pendingReInspeksi' => $pendingReInspeksi,
            'selesaiAsRI'       => $selesaiAsRI,
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user()->load('sites:id,value');
        $siteValues = $user->assignedSiteValues();
        $staffUsers = User::whereIn('participation_level', ['staff', 'srstaff'])
            ->where('id', '!=', $request->user()->id)
            ->with('sites:id,value')
            ->where(function ($query) use ($siteValues) {
                $query->whereIn('site', $siteValues)
                    ->orWhereHas('sites', fn ($sites) => $sites->whereIn('value', $siteValues));
            })
            ->orderBy('name')
            ->get(['id', 'name', 'nik', 'jabatan', 'site'])
            ->map(fn (User $staff) => [
                'id' => $staff->id, 'name' => $staff->name, 'nik' => $staff->nik,
                'jabatan' => $staff->jabatan, 'site' => $staff->site,
                'sites' => $staff->assignedSiteValues(),
            ]);

        return Inertia::render('sap/inspeksi-workshop/create', [
            'user'       => $user->only('name', 'nik', 'jabatan', 'departemen', 'site'),
            'staffUsers' => $staffUsers,
            'sites'      => Site::whereIn('value', $siteValues)->orderBy('label')->get(['value', 'label']),
        ]);
    }

    public function store(Request $request)
    {
        $scoreRule = ['nullable', 'integer', 'between:1,4'];

        $validated = $request->validate([
            're_inspektor_id' => ['nullable', 'exists:users,id'],
            'peserta_ids'     => ['nullable', 'array'],
            'peserta_ids.*'   => ['exists:users,id'],
            'tanggal'         => ['required', 'date'],
            'project_site'    => ['required', 'string', 'max:255'],
            'departemen'      => ['required', 'string', 'max:255'],
            // Bangunan (21)
            'bangunan_1'  => $scoreRule, 'bangunan_2'  => $scoreRule, 'bangunan_3'  => $scoreRule,
            'bangunan_4'  => $scoreRule, 'bangunan_5'  => $scoreRule, 'bangunan_6'  => $scoreRule,
            'bangunan_7'  => $scoreRule, 'bangunan_8'  => $scoreRule, 'bangunan_9'  => $scoreRule,
            'bangunan_10' => $scoreRule, 'bangunan_11' => $scoreRule, 'bangunan_12' => $scoreRule,
            'bangunan_13' => $scoreRule, 'bangunan_14' => $scoreRule, 'bangunan_15' => $scoreRule,
            'bangunan_16' => $scoreRule, 'bangunan_17' => $scoreRule, 'bangunan_18' => $scoreRule,
            'bangunan_19' => $scoreRule, 'bangunan_20' => $scoreRule, 'bangunan_21' => $scoreRule,
            // Kelistrikan (8)
            'kelistrikan_1' => $scoreRule, 'kelistrikan_2' => $scoreRule, 'kelistrikan_3' => $scoreRule,
            'kelistrikan_4' => $scoreRule, 'kelistrikan_5' => $scoreRule, 'kelistrikan_6' => $scoreRule,
            'kelistrikan_7' => $scoreRule, 'kelistrikan_8' => $scoreRule,
            // Welder (6)
            'welder_1' => $scoreRule, 'welder_2' => $scoreRule, 'welder_3' => $scoreRule,
            'welder_4' => $scoreRule, 'welder_5' => $scoreRule, 'welder_6' => $scoreRule,
            // Tabung (6)
            'tabung_1' => $scoreRule, 'tabung_2' => $scoreRule, 'tabung_3' => $scoreRule,
            'tabung_4' => $scoreRule, 'tabung_5' => $scoreRule, 'tabung_6' => $scoreRule,
            // Alat Angkat (5)
            'alat_angkat_1' => $scoreRule, 'alat_angkat_2' => $scoreRule, 'alat_angkat_3' => $scoreRule,
            'alat_angkat_4' => $scoreRule, 'alat_angkat_5' => $scoreRule,
            // TPS (12)
            'tps_1'  => $scoreRule, 'tps_2'  => $scoreRule, 'tps_3'  => $scoreRule,
            'tps_4'  => $scoreRule, 'tps_5'  => $scoreRule, 'tps_6'  => $scoreRule,
            'tps_7'  => $scoreRule, 'tps_8'  => $scoreRule, 'tps_9'  => $scoreRule,
            'tps_10' => $scoreRule, 'tps_11' => $scoreRule, 'tps_12' => $scoreRule,
            // Tyre (3)
            'tyre_1' => $scoreRule, 'tyre_2' => $scoreRule, 'tyre_3' => $scoreRule,
            'tindakan_perbaikan'            => ['nullable', 'array'],
            'tindakan_perbaikan.*.tindakan' => ['nullable', 'string', 'max:500'],
            'tindakan_perbaikan.*.pic'       => ['nullable', 'string', 'max:255'],
            'tindakan_perbaikan.*.due_date'  => ['nullable', 'string', 'max:50'],
            'tindakan_perbaikan.*.remark'    => ['nullable', 'string', 'max:500'],
            'foto'   => ['nullable', 'array'],
            'foto.*' => ['nullable', 'image', 'max:5120'],
            'ttd_inspektor' => ['nullable', 'string'],
        ]);

        $actor = $request->user()->load('sites:id,value');
        $site = Site::whereIn('value', $actor->assignedSiteValues())
            ->where('label', $validated['project_site'])->first();
        abort_unless($site, 403);

        $assigneeIds = array_filter(array_merge(
            [$validated['re_inspektor_id'] ?? null], $validated['peserta_ids'] ?? []
        ));
        $eligibleAssignees = User::whereIn('id', $assigneeIds)
            ->whereIn('participation_level', ['staff', 'srstaff'])
            ->assignedToSite($site->value)->count();
        abort_unless($eligibleAssignees === count(array_unique($assigneeIds)), 403);

        $scores = collect(InspeksiWorkshop::$scoreKeys)
            ->map(fn($k) => $validated[$k] ?? null)->filter(fn($v) => $v !== null);

        $totalPoin  = $scores->sum();
        $maxPoin    = count(InspeksiWorkshop::$scoreKeys) * 4;
        $persentase = $scores->count() > 0 ? round(($totalPoin / $maxPoin) * 100, 1) : 0;
        $riskLevel  = match (true) {
            $persentase >= 85 => 'L',
            $persentase >= 70 => 'M',
            $persentase >= 50 => 'H',
            default           => 'VH',
        };

        $pesertaIds = $validated['peserta_ids'] ?? [];
        unset($validated['peserta_ids'], $validated['foto']);

        $record = InspeksiWorkshop::create(array_merge($validated, [
            'user_id'    => $request->user()->id,
            'total_poin' => $totalPoin, 'max_poin' => $maxPoin,
            'persentase' => $persentase, 'risk_level' => $riskLevel,
            'status'     => $validated['re_inspektor_id'] ? 'menunggu_re_inspeksi' : 'selesai',
        ]));

        if ($request->hasFile('foto')) {
            $fotoItems = [];
            foreach ($request->file('foto') as $key => $file) {
                $fotoItems[$key] = $file->store("inspeksi/workshop/{$record->id}", 'public');
            }
            $record->update(['foto_items' => $fotoItems]);
        }

        if ($pesertaIds) {
            $record->peserta()->sync($pesertaIds);
        }

        $record->load('user');

        if ($record->reInspektor) {
            $record->reInspektor->notify(new InspeksiWorkshopDibuat($record, 're_inspektor'));
        }

        User::whereIn('id', $pesertaIds)->get()->each->notify(new InspeksiWorkshopDibuat($record, 'peserta'));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form Inspeksi Workshop berhasil disimpan.']);

        return redirect()->route('sap.inspeksi-workshop.index');
    }

    public function show(Request $request, InspeksiWorkshop $inspeksiWorkshop)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin
                || $user->id === $inspeksiWorkshop->user_id
                || $user->id === $inspeksiWorkshop->re_inspektor_id
                || $inspeksiWorkshop->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        $inspeksiWorkshop->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,nik,jabatan,site');

        return Inertia::render('sap/inspeksi-workshop/show', [
            'record' => $inspeksiWorkshop,
            'is_ri'  => $user->id === $inspeksiWorkshop->re_inspektor_id,
        ]);
    }

    public function reInspeksi(Request $request, InspeksiWorkshop $inspeksiWorkshop)
    {
        abort_unless($request->user()->id === $inspeksiWorkshop->re_inspektor_id, 403);
        if ($inspeksiWorkshop->status !== 'menunggu_re_inspeksi') {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Form ini sudah diproses.']);
            return redirect()->route('sap.inspeksi-workshop.show', $inspeksiWorkshop);
        }

        $inspeksiWorkshop->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,jabatan');

        return Inertia::render('sap/inspeksi-workshop/re-inspeksi', ['record' => $inspeksiWorkshop]);
    }

    public function storeReInspeksi(Request $request, InspeksiWorkshop $inspeksiWorkshop)
    {
        abort_unless($request->user()->id === $inspeksiWorkshop->re_inspektor_id, 403);
        abort_if($inspeksiWorkshop->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate(['ttd_re_inspektor' => ['required', 'string']]);

        $inspeksiWorkshop->update([
            'ttd_re_inspektor' => $validated['ttd_re_inspektor'],
            'status'           => 'selesai',
            're_inspeksi_at'   => now(),
        ]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-workshop/{$inspeksiWorkshop->id}/re-inspeksi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Re-inspeksi berhasil dikonfirmasi.']);

        return redirect()->route('sap.inspeksi-workshop.index');
    }

    public function tolak(Request $request, InspeksiWorkshop $inspeksiWorkshop)
    {
        abort_unless($request->user()->id === $inspeksiWorkshop->re_inspektor_id, 403);
        abort_if($inspeksiWorkshop->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate(['alasan' => ['required', 'string', 'max:1000']]);

        $inspeksiWorkshop->update(['status' => 'ditolak', 'tolak_alasan' => $validated['alasan']]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-workshop/{$inspeksiWorkshop->id}/re-inspeksi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form telah ditolak.']);

        return redirect()->route('sap.inspeksi-workshop.index');
    }

    public function exportPdf(Request $request, InspeksiWorkshop $inspeksiWorkshop)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin || $user->id === $inspeksiWorkshop->user_id
                || $user->id === $inspeksiWorkshop->re_inspektor_id
                || $inspeksiWorkshop->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        $inspeksiWorkshop->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,jabatan');

        $pdf = Pdf::loadView('pdf.inspeksi-workshop', ['record' => $inspeksiWorkshop])->setPaper('a4', 'portrait');

        return $pdf->stream('inspeksi-workshop-'.$inspeksiWorkshop->id.'.pdf');
    }
}
