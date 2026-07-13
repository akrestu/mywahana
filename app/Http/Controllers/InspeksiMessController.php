<?php

namespace App\Http\Controllers;

use App\Models\InspeksiMess;
use App\Models\Site;
use App\Models\User;
use App\Notifications\InspeksiMessDibuat;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspeksiMessController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $myRecords = InspeksiMess::where('user_id', $user->id)
            ->orWhereHas('peserta', fn($q) => $q->where('user_id', $user->id))
            ->with('reInspektor:id,name,jabatan')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'my_page');

        $pendingReInspeksi = InspeksiMess::where('re_inspektor_id', $user->id)
            ->where('status', 'menunggu_re_inspeksi')
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_page');

        $selesaiAsRI = InspeksiMess::where('re_inspektor_id', $user->id)
            ->whereIn('status', ['selesai', 'ditolak'])
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_done_page');

        return Inertia::render('sap/inspeksi-mess/index', [
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

        return Inertia::render('sap/inspeksi-mess/create', [
            'user'       => $user->only('name', 'nik', 'jabatan', 'site'),
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
            'lokasi'          => ['required', 'string', 'max:255'],
            // Sanitasi (10)
            'sanitasi_1' => $scoreRule, 'sanitasi_2' => $scoreRule, 'sanitasi_3' => $scoreRule,
            'sanitasi_4' => $scoreRule, 'sanitasi_5' => $scoreRule, 'sanitasi_6' => $scoreRule,
            'sanitasi_7' => $scoreRule, 'sanitasi_8' => $scoreRule, 'sanitasi_9' => $scoreRule,
            'sanitasi_10' => $scoreRule,
            // Kamar (8)
            'kamar_1' => $scoreRule, 'kamar_2' => $scoreRule, 'kamar_3' => $scoreRule,
            'kamar_4' => $scoreRule, 'kamar_5' => $scoreRule, 'kamar_6' => $scoreRule,
            'kamar_7' => $scoreRule, 'kamar_8' => $scoreRule,
            // Dapur (5)
            'dapur_1' => $scoreRule, 'dapur_2' => $scoreRule, 'dapur_3' => $scoreRule,
            'dapur_4' => $scoreRule, 'dapur_5' => $scoreRule,
            // Sampah (5)
            'sampah_1' => $scoreRule, 'sampah_2' => $scoreRule, 'sampah_3' => $scoreRule,
            'sampah_4' => $scoreRule, 'sampah_5' => $scoreRule,
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

        $scores = collect(InspeksiMess::$scoreKeys)
            ->map(fn($k) => $validated[$k] ?? null)->filter(fn($v) => $v !== null);

        $totalPoin  = $scores->sum();
        $maxPoin    = count(InspeksiMess::$scoreKeys) * 4;
        $persentase = $scores->count() > 0 ? round(($totalPoin / $maxPoin) * 100, 1) : 0;
        $riskLevel  = match (true) {
            $persentase >= 85 => 'L',
            $persentase >= 70 => 'M',
            $persentase >= 50 => 'H',
            default           => 'VH',
        };

        $pesertaIds = $validated['peserta_ids'] ?? [];
        unset($validated['peserta_ids'], $validated['foto']);

        $record = InspeksiMess::create(array_merge($validated, [
            'user_id'    => $request->user()->id,
            'total_poin' => $totalPoin, 'max_poin' => $maxPoin,
            'persentase' => $persentase, 'risk_level' => $riskLevel,
            'status'     => $validated['re_inspektor_id'] ? 'menunggu_re_inspeksi' : 'selesai',
        ]));

        if ($request->hasFile('foto')) {
            $fotoItems = [];
            foreach ($request->file('foto') as $key => $file) {
                $fotoItems[$key] = $file->store("inspeksi/mess/{$record->id}", 'public');
            }
            $record->update(['foto_items' => $fotoItems]);
        }

        if ($pesertaIds) {
            $record->peserta()->sync($pesertaIds);
        }

        $record->load('user');

        if ($record->reInspektor) {
            $record->reInspektor->notify(new InspeksiMessDibuat($record, 're_inspektor'));
        }

        User::whereIn('id', $pesertaIds)->get()->each->notify(new InspeksiMessDibuat($record, 'peserta'));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form Inspeksi Mess berhasil disimpan.']);

        return redirect()->route('sap.inspeksi-mess.index');
    }

    public function show(Request $request, InspeksiMess $inspeksiMess)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin
                || $user->id === $inspeksiMess->user_id
                || $user->id === $inspeksiMess->re_inspektor_id
                || $inspeksiMess->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        $inspeksiMess->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,nik,jabatan,site');

        return Inertia::render('sap/inspeksi-mess/show', [
            'record' => $inspeksiMess,
            'is_ri'  => $user->id === $inspeksiMess->re_inspektor_id,
        ]);
    }

    public function reInspeksi(Request $request, InspeksiMess $inspeksiMess)
    {
        abort_unless($request->user()->id === $inspeksiMess->re_inspektor_id, 403);
        if ($inspeksiMess->status !== 'menunggu_re_inspeksi') {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Form ini sudah diproses.']);
            return redirect()->route('sap.inspeksi-mess.show', $inspeksiMess);
        }

        $inspeksiMess->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,jabatan');

        return Inertia::render('sap/inspeksi-mess/re-inspeksi', ['record' => $inspeksiMess]);
    }

    public function storeReInspeksi(Request $request, InspeksiMess $inspeksiMess)
    {
        abort_unless($request->user()->id === $inspeksiMess->re_inspektor_id, 403);
        abort_if($inspeksiMess->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate(['ttd_re_inspektor' => ['required', 'string']]);

        $inspeksiMess->update([
            'ttd_re_inspektor' => $validated['ttd_re_inspektor'],
            'status'           => 'selesai',
            're_inspeksi_at'   => now(),
        ]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-mess/{$inspeksiMess->id}/re-inspeksi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Re-inspeksi berhasil dikonfirmasi.']);

        return redirect()->route('sap.inspeksi-mess.index');
    }

    public function tolak(Request $request, InspeksiMess $inspeksiMess)
    {
        abort_unless($request->user()->id === $inspeksiMess->re_inspektor_id, 403);
        abort_if($inspeksiMess->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate(['alasan' => ['required', 'string', 'max:1000']]);

        $inspeksiMess->update(['status' => 'ditolak', 'tolak_alasan' => $validated['alasan']]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-mess/{$inspeksiMess->id}/re-inspeksi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form telah ditolak.']);

        return redirect()->route('sap.inspeksi-mess.index');
    }

    public function exportPdf(Request $request, InspeksiMess $inspeksiMess)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin || $user->id === $inspeksiMess->user_id
                || $user->id === $inspeksiMess->re_inspektor_id
                || $inspeksiMess->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        $inspeksiMess->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,jabatan');

        $pdf = Pdf::loadView('pdf.inspeksi-mess', ['record' => $inspeksiMess])->setPaper('a4', 'portrait');

        return $pdf->stream('inspeksi-mess-'.$inspeksiMess->id.'.pdf');
    }
}
