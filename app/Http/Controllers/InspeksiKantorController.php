<?php

namespace App\Http\Controllers;

use App\Models\InspeksiKantor;
use App\Models\Site;
use App\Models\User;
use App\Notifications\InspeksiKantorDibuat;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspeksiKantorController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $myRecords = InspeksiKantor::where('user_id', $user->id)
            ->orWhereHas('peserta', fn($q) => $q->where('user_id', $user->id))
            ->with('reInspektor:id,name,jabatan')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'my_page');

        $pendingReInspeksi = InspeksiKantor::where('re_inspektor_id', $user->id)
            ->where('status', 'menunggu_re_inspeksi')
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_page');

        $selesaiAsRI = InspeksiKantor::where('re_inspektor_id', $user->id)
            ->whereIn('status', ['selesai', 'ditolak'])
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_done_page');

        return Inertia::render('sap/inspeksi-kantor/index', [
            'myRecords'        => $myRecords,
            'pendingReInspeksi' => $pendingReInspeksi,
            'selesaiAsRI'      => $selesaiAsRI,
        ]);
    }

    public function create(Request $request)
    {
        $staffUsers = User::whereIn('participation_level', ['staff', 'srstaff'])
            ->where('id', '!=', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name', 'nik', 'jabatan', 'site']);

        return Inertia::render('sap/inspeksi-kantor/create', [
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
            // Situasi
            'situasi_1' => $scoreRule, 'situasi_2' => $scoreRule, 'situasi_3' => $scoreRule,
            'situasi_4' => $scoreRule, 'situasi_5' => $scoreRule, 'situasi_6' => $scoreRule,
            'situasi_7' => $scoreRule,
            // Individu
            'individu_1' => $scoreRule,
            // Alat
            'alat_1' => $scoreRule, 'alat_2' => $scoreRule, 'alat_3' => $scoreRule,
            'alat_4' => $scoreRule, 'alat_5' => $scoreRule, 'alat_6' => $scoreRule,
            'alat_7' => $scoreRule,
            // Prosedur
            'prosedur_1' => $scoreRule, 'prosedur_2' => $scoreRule, 'prosedur_3' => $scoreRule,
            'prosedur_4' => $scoreRule, 'prosedur_5' => $scoreRule, 'prosedur_6' => $scoreRule,
            'prosedur_7' => $scoreRule,
            // Tindakan perbaikan
            'tindakan_perbaikan'             => ['nullable', 'array'],
            'tindakan_perbaikan.*.tindakan'  => ['nullable', 'string', 'max:500'],
            'tindakan_perbaikan.*.pic'        => ['nullable', 'string', 'max:255'],
            'tindakan_perbaikan.*.due_date'   => ['nullable', 'string', 'max:50'],
            'tindakan_perbaikan.*.remark'     => ['nullable', 'string', 'max:500'],
            // Foto
            'foto'   => ['nullable', 'array'],
            'foto.*' => ['nullable', 'image', 'max:5120'],
            // TTD
            'ttd_inspektor' => ['nullable', 'string'],
        ]);

        // Kalkulasi skor
        $scores = collect(InspeksiKantor::$scoreKeys)
            ->map(fn($k) => $validated[$k] ?? null)
            ->filter(fn($v) => $v !== null);

        $totalPoin  = $scores->sum();
        $maxPoin    = count(InspeksiKantor::$scoreKeys) * 4;
        $persentase = $scores->count() > 0 ? round(($totalPoin / $maxPoin) * 100, 1) : 0;
        $riskLevel  = match (true) {
            $persentase >= 85 => 'L',
            $persentase >= 70 => 'M',
            $persentase >= 50 => 'H',
            default           => 'VH',
        };

        $pesertaIds = $validated['peserta_ids'] ?? [];
        unset($validated['peserta_ids'], $validated['foto']);

        $status = empty($validated['re_inspektor_id']) ? 'selesai' : 'menunggu_re_inspeksi';

        $record = InspeksiKantor::create(array_merge($validated, [
            'user_id'    => $request->user()->id,
            'total_poin' => $totalPoin,
            'max_poin'   => $maxPoin,
            'persentase' => $persentase,
            'risk_level' => $riskLevel,
            'status'     => $status,
        ]));

        // Upload foto
        if ($request->hasFile('foto')) {
            $fotoItems = [];
            foreach ($request->file('foto') as $key => $file) {
                $fotoItems[$key] = $file->store("inspeksi/kantor/{$record->id}", 'public');
            }
            $record->update(['foto_items' => $fotoItems]);
        }

        // Sync peserta
        if ($pesertaIds) {
            $record->peserta()->sync($pesertaIds);
        }

        $record->load('user');

        // Kirim notifikasi ke re-inspektor
        if ($record->reInspektor) {
            $record->reInspektor->notify(new InspeksiKantorDibuat($record, 're_inspektor'));
        }

        // Kirim notifikasi ke peserta
        User::whereIn('id', $pesertaIds)->get()->each->notify(new InspeksiKantorDibuat($record, 'peserta'));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form Inspeksi Kantor berhasil disimpan.']);

        return redirect()->route('sap.inspeksi-kantor.index');
    }

    public function show(Request $request, InspeksiKantor $inspeksiKantor)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin
                || $user->id === $inspeksiKantor->user_id
                || $user->id === $inspeksiKantor->re_inspektor_id
                || $inspeksiKantor->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        $inspeksiKantor->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,nik,jabatan,site');

        return Inertia::render('sap/inspeksi-kantor/show', [
            'record' => $inspeksiKantor,
            'is_ri'  => $user->id === $inspeksiKantor->re_inspektor_id,
        ]);
    }

    public function reInspeksi(Request $request, InspeksiKantor $inspeksiKantor)
    {
        abort_unless($request->user()->id === $inspeksiKantor->re_inspektor_id, 403);
        if ($inspeksiKantor->status !== 'menunggu_re_inspeksi') {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Form ini sudah diproses.']);
            return redirect()->route('sap.inspeksi-kantor.show', $inspeksiKantor);
        }

        $inspeksiKantor->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,jabatan');

        return Inertia::render('sap/inspeksi-kantor/re-inspeksi', [
            'record' => $inspeksiKantor,
        ]);
    }

    public function storeReInspeksi(Request $request, InspeksiKantor $inspeksiKantor)
    {
        abort_unless($request->user()->id === $inspeksiKantor->re_inspektor_id, 403);
        abort_if($inspeksiKantor->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate([
            'ttd_re_inspektor' => ['required', 'string'],
        ]);

        $inspeksiKantor->update([
            'ttd_re_inspektor' => $validated['ttd_re_inspektor'],
            'status'           => 'selesai',
            're_inspeksi_at'   => now(),
        ]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-kantor/{$inspeksiKantor->id}/re-inspeksi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Re-inspeksi berhasil dikonfirmasi.']);

        return redirect()->route('sap.inspeksi-kantor.index');
    }

    public function tolak(Request $request, InspeksiKantor $inspeksiKantor)
    {
        abort_unless($request->user()->id === $inspeksiKantor->re_inspektor_id, 403);
        abort_if($inspeksiKantor->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate([
            'alasan' => ['required', 'string', 'max:1000'],
        ]);

        $inspeksiKantor->update([
            'status'       => 'ditolak',
            'tolak_alasan' => $validated['alasan'],
        ]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-kantor/{$inspeksiKantor->id}/re-inspeksi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form telah ditolak.']);

        return redirect()->route('sap.inspeksi-kantor.index');
    }

    public function exportPdf(Request $request, InspeksiKantor $inspeksiKantor)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin
                || $user->id === $inspeksiKantor->user_id
                || $user->id === $inspeksiKantor->re_inspektor_id
                || $inspeksiKantor->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        $inspeksiKantor->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,jabatan');

        $pdf = Pdf::loadView('pdf.inspeksi-kantor', ['record' => $inspeksiKantor])->setPaper('a4', 'portrait');

        return $pdf->stream('inspeksi-kantor-'.$inspeksiKantor->id.'.pdf');
    }
}
