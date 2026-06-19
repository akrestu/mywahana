<?php

namespace App\Http\Controllers;

use App\Models\InspeksiTambang;
use App\Models\Site;
use App\Models\User;
use App\Notifications\InspeksiTambangDibuat;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspeksiTambangController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $myRecords = InspeksiTambang::where('user_id', $user->id)
            ->orWhereHas('peserta', fn($q) => $q->where('user_id', $user->id))
            ->with('reInspektor:id,name,jabatan')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'my_page');

        $pendingReInspeksi = InspeksiTambang::where('re_inspektor_id', $user->id)
            ->where('status', 'menunggu_re_inspeksi')
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_page');

        $selesaiAsRI = InspeksiTambang::where('re_inspektor_id', $user->id)
            ->whereIn('status', ['selesai', 'ditolak'])
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_done_page');

        return Inertia::render('sap/inspeksi-tambang/index', [
            'myRecords'         => $myRecords,
            'pendingReInspeksi' => $pendingReInspeksi,
            'selesaiAsRI'       => $selesaiAsRI,
        ]);
    }

    public function create(Request $request)
    {
        $staffUsers = User::whereIn('participation_level', ['staff', 'srstaff'])
            ->where('id', '!=', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name', 'nik', 'jabatan', 'site']);

        return Inertia::render('sap/inspeksi-tambang/create', [
            'user'       => $request->user()->only('name', 'nik', 'jabatan', 'departemen', 'site'),
            'staffUsers' => $staffUsers,
            'sites'      => Site::orderBy('label')->get(['value', 'label']),
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
            'lokasi'          => ['nullable', 'string', 'max:255'],
            'situasi_1' => $scoreRule, 'situasi_2' => $scoreRule, 'situasi_3' => $scoreRule,
            'situasi_4' => $scoreRule, 'situasi_5' => $scoreRule, 'situasi_6' => $scoreRule,
            'situasi_7' => $scoreRule, 'situasi_8' => $scoreRule, 'situasi_9' => $scoreRule,
            'situasi_10' => $scoreRule, 'situasi_11' => $scoreRule, 'situasi_12' => $scoreRule,
            'situasi_13' => $scoreRule,
            'individu_1' => $scoreRule, 'individu_2' => $scoreRule,
            'alat_1' => $scoreRule, 'alat_2' => $scoreRule, 'alat_3' => $scoreRule,
            'alat_4' => $scoreRule, 'alat_5' => $scoreRule, 'alat_6' => $scoreRule,
            'prosedur_1' => $scoreRule, 'prosedur_2' => $scoreRule, 'prosedur_3' => $scoreRule,
            'prosedur_4' => $scoreRule, 'prosedur_5' => $scoreRule,
            'tindakan_perbaikan'            => ['nullable', 'array'],
            'tindakan_perbaikan.*.tindakan' => ['nullable', 'string', 'max:500'],
            'tindakan_perbaikan.*.pic'       => ['nullable', 'string', 'max:255'],
            'tindakan_perbaikan.*.due_date'  => ['nullable', 'string', 'max:50'],
            'tindakan_perbaikan.*.remark'    => ['nullable', 'string', 'max:500'],
            'foto'   => ['nullable', 'array'],
            'foto.*' => ['nullable', 'image', 'max:5120'],
            'ttd_inspektor' => ['nullable', 'string'],
        ]);

        $scores = collect(InspeksiTambang::$scoreKeys)
            ->map(fn($k) => $validated[$k] ?? null)->filter(fn($v) => $v !== null);

        $totalPoin  = $scores->sum();
        $maxPoin    = count(InspeksiTambang::$scoreKeys) * 4;
        $persentase = $scores->count() > 0 ? round(($totalPoin / $maxPoin) * 100, 1) : 0;
        $riskLevel  = match (true) {
            $persentase >= 85 => 'L',
            $persentase >= 70 => 'M',
            $persentase >= 50 => 'H',
            default           => 'VH',
        };

        $pesertaIds = $validated['peserta_ids'] ?? [];
        unset($validated['peserta_ids'], $validated['foto']);

        $record = InspeksiTambang::create(array_merge($validated, [
            'user_id'    => $request->user()->id,
            'total_poin' => $totalPoin, 'max_poin' => $maxPoin,
            'persentase' => $persentase, 'risk_level' => $riskLevel,
            'status'     => $validated['re_inspektor_id'] ? 'menunggu_re_inspeksi' : 'selesai',
        ]));

        if ($request->hasFile('foto')) {
            $fotoItems = [];
            foreach ($request->file('foto') as $key => $file) {
                $fotoItems[$key] = $file->store("inspeksi/tambang/{$record->id}", 'public');
            }
            $record->update(['foto_items' => $fotoItems]);
        }

        if ($pesertaIds) {
            $record->peserta()->sync($pesertaIds);
        }

        $record->load('user');

        if ($record->reInspektor) {
            $record->reInspektor->notify(new InspeksiTambangDibuat($record, 're_inspektor'));
        }

        User::whereIn('id', $pesertaIds)->get()->each->notify(new InspeksiTambangDibuat($record, 'peserta'));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form Inspeksi Tambang berhasil disimpan.']);

        return redirect()->route('sap.inspeksi-tambang.index');
    }

    public function show(Request $request, InspeksiTambang $inspeksiTambang)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin
                || $user->id === $inspeksiTambang->user_id
                || $user->id === $inspeksiTambang->re_inspektor_id
                || $inspeksiTambang->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        $inspeksiTambang->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,nik,jabatan,site');

        return Inertia::render('sap/inspeksi-tambang/show', [
            'record' => $inspeksiTambang,
            'is_ri'  => $user->id === $inspeksiTambang->re_inspektor_id,
        ]);
    }

    public function reInspeksi(Request $request, InspeksiTambang $inspeksiTambang)
    {
        abort_unless($request->user()->id === $inspeksiTambang->re_inspektor_id, 403);
        if ($inspeksiTambang->status !== 'menunggu_re_inspeksi') {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Form ini sudah diproses.']);
            return redirect()->route('sap.inspeksi-tambang.show', $inspeksiTambang);
        }

        $inspeksiTambang->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,jabatan');

        return Inertia::render('sap/inspeksi-tambang/re-inspeksi', ['record' => $inspeksiTambang]);
    }

    public function storeReInspeksi(Request $request, InspeksiTambang $inspeksiTambang)
    {
        abort_unless($request->user()->id === $inspeksiTambang->re_inspektor_id, 403);
        abort_if($inspeksiTambang->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate(['ttd_re_inspektor' => ['required', 'string']]);

        $inspeksiTambang->update([
            'ttd_re_inspektor' => $validated['ttd_re_inspektor'],
            'status'           => 'selesai',
            're_inspeksi_at'   => now(),
        ]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-tambang/{$inspeksiTambang->id}/re-inspeksi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Re-inspeksi berhasil dikonfirmasi.']);

        return redirect()->route('sap.inspeksi-tambang.index');
    }

    public function tolak(Request $request, InspeksiTambang $inspeksiTambang)
    {
        abort_unless($request->user()->id === $inspeksiTambang->re_inspektor_id, 403);
        abort_if($inspeksiTambang->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate(['alasan' => ['required', 'string', 'max:1000']]);

        $inspeksiTambang->update(['status' => 'ditolak', 'tolak_alasan' => $validated['alasan']]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-tambang/{$inspeksiTambang->id}/re-inspeksi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form telah ditolak.']);

        return redirect()->route('sap.inspeksi-tambang.index');
    }

    public function exportPdf(Request $request, InspeksiTambang $inspeksiTambang)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin || $user->id === $inspeksiTambang->user_id
                || $user->id === $inspeksiTambang->re_inspektor_id
                || $inspeksiTambang->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        $inspeksiTambang->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,jabatan');

        $pdf = Pdf::loadView('pdf.inspeksi-tambang', ['record' => $inspeksiTambang])->setPaper('a4', 'portrait');

        return $pdf->stream('inspeksi-tambang-'.$inspeksiTambang->id.'.pdf');
    }
}
