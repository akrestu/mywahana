<?php

namespace App\Http\Controllers;

use App\Models\ObservasiKeselamatan;
use App\Models\User;
use App\Notifications\ObservasiKeselamatanKonfirmasi;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ObservasiKeselamatanController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $myRecords = ObservasiKeselamatan::where('user_id', $user->id)
            ->with('penanggungJawab:id,name,jabatan')
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: 'my_page');

        $pendingKonfirmasi = ObservasiKeselamatan::where('penanggung_jawab_id', $user->id)
            ->where('user_id', '!=', $user->id)
            ->where('status', 'menunggu_konfirmasi')
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: 'pj_page');

        $confirmedAsPJ = ObservasiKeselamatan::where('penanggung_jawab_id', $user->id)
            ->where('user_id', '!=', $user->id)
            ->whereIn('status', ['dikonfirmasi', 'ditolak'])
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: 'pj_confirmed_page');

        return Inertia::render('sap/observasi-keselamatan/index', [
            'myRecords'        => $myRecords,
            'pendingKonfirmasi' => $pendingKonfirmasi,
            'confirmedAsPJ'    => $confirmedAsPJ,
        ]);
    }

    public function create(Request $request)
    {
        $staffUsers = User::whereIn('participation_level', ['staff', 'srstaff'])
            ->orderBy('name')
            ->get(['id', 'name', 'nik', 'jabatan', 'site']);

        return Inertia::render('sap/observasi-keselamatan/create', [
            'user'       => $request->user()->only('name', 'nik', 'jabatan', 'site'),
            'staffUsers' => $staffUsers,
        ]);
    }

    public function store(Request $request)
    {
        $checklistRule = ['nullable', 'in:aman,beresiko'];

        $validated = $request->validate([
            'penanggung_jawab_id'   => ['nullable', 'exists:users,id'],
            'tanggal'               => ['required', 'date'],
            'jenis_pekerjaan'       => ['required', 'string', 'max:255'],
            'lokasi_kerja'          => ['required', 'string', 'max:255'],
            'peralatan_digunakan'   => ['nullable', 'string', 'max:255'],
            // Prosedur
            'cl_prosedur_mine_permit'    => $checklistRule,
            'cl_prosedur_komisioning'    => $checklistRule,
            'cl_prosedur_p2h'            => $checklistRule,
            'cl_prosedur_instruksi_kerja'=> $checklistRule,
            'cl_prosedur_loto'           => $checklistRule,
            'cl_prosedur_sop_jsa'        => $checklistRule,
            // APD
            'cl_apd_kepala'              => $checklistRule,
            'cl_apd_mata_wajah'          => $checklistRule,
            'cl_apd_pendengaran'         => $checklistRule,
            'cl_apd_pernapasan'          => $checklistRule,
            'cl_apd_pelindung_jatuh'     => $checklistRule,
            'cl_apd_pelindung_tenggelam' => $checklistRule,
            'cl_apd_lengan_tangan'       => $checklistRule,
            'cl_apd_paha_kaki'           => $checklistRule,
            // Posisi
            'cl_posisi_mengangkat'       => $checklistRule,
            'cl_posisi_mengubah_posisi'  => $checklistRule,
            'cl_posisi_mengatur_pekerjaan'=> $checklistRule,
            'cl_posisi_dekat_listrik'    => $checklistRule,
            'cl_posisi_dekat_berbahaya'  => $checklistRule,
            'cl_posisi_dekat_longsor'    => $checklistRule,
            'cl_posisi_dekat_air'        => $checklistRule,
            'cl_posisi_turun_naik'       => $checklistRule,
            // Kendaraan
            'cl_kendaraan_sim_sio'       => $checklistRule,
            'cl_kendaraan_sabuk'         => $checklistRule,
            'cl_kendaraan_kecepatan'     => $checklistRule,
            'cl_kendaraan_jarak'         => $checklistRule,
            'cl_kendaraan_haluan'        => $checklistRule,
            'cl_kendaraan_buggy_whip'    => $checklistRule,
            'cl_kendaraan_radio'         => $checklistRule,
            'cl_kendaraan_lampu'         => $checklistRule,
            // Peralatan
            'cl_peralatan_pemilihan'     => $checklistRule,
            'cl_peralatan_safety_guard'  => $checklistRule,
            'cl_peralatan_pemakaian'     => $checklistRule,
            'cl_peralatan_angkat'        => $checklistRule,
            'cl_peralatan_elektrikal'    => $checklistRule,
            'cl_peralatan_tangan'        => $checklistRule,
            // Lingkungan
            'cl_lingkungan_kebersihan'   => $checklistRule,
            'cl_lingkungan_tumpahan'     => $checklistRule,
            'cl_lingkungan_pencahayaan'  => $checklistRule,
            'cl_lingkungan_kebisingan'   => $checklistRule,
            'cl_lingkungan_barikade'     => $checklistRule,
            'cl_lingkungan_rambu'        => $checklistRule,
            'cl_lingkungan_limbah'       => $checklistRule,
            // Lain-lain
            'll_1_label' => ['nullable', 'string', 'max:100'],
            'll_1_nilai'  => $checklistRule,
            'll_2_label' => ['nullable', 'string', 'max:100'],
            'll_2_nilai'  => $checklistRule,
            'll_3_label' => ['nullable', 'string', 'max:100'],
            'll_3_nilai'  => $checklistRule,
            'll_4_label' => ['nullable', 'string', 'max:100'],
            'll_4_nilai'  => $checklistRule,
            // Narasi
            'tindakan_kondisi_aman'          => ['nullable', 'string'],
            'tindakan_meningkatkan_selamat'  => ['nullable', 'string'],
            'tindakan_kondisi_tidak_aman'    => ['nullable', 'string'],
            'tindakan_segera'                => ['nullable', 'string'],
            'tindakan_mencegah_terulang'     => ['nullable', 'string'],
            'status_temuan'                  => ['nullable', 'array'],
            'status_temuan.*'                => ['string', 'in:sudah_selesai,perlu_penanganan,sedang_diperbaiki,menunggu_material'],
            'catatan'                        => ['nullable', 'string'],
        ]);

        if (empty($validated['penanggung_jawab_id'])) {
            $validated['penanggung_jawab_id'] = $request->user()->id;
        }

        $ok = $request->user()->observasiKeselamatans()->create($validated);

        if ($ok->penanggungJawab) {
            $ok->load('user');
            $ok->penanggungJawab->notify(new ObservasiKeselamatanKonfirmasi($ok));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form Observasi Keselamatan berhasil disimpan.']);

        return redirect()->route('sap.observasi-keselamatan.index');
    }

    public function show(Request $request, ObservasiKeselamatan $observasiKeselamatan)
    {
        abort_unless(
            $request->user()->is_admin
                || $request->user()->id === $observasiKeselamatan->user_id
                || $request->user()->id === $observasiKeselamatan->penanggung_jawab_id,
            403
        );

        $observasiKeselamatan->load('user:id,name,nik,jabatan,site', 'penanggungJawab:id,name,nik,jabatan,site');

        return Inertia::render('sap/observasi-keselamatan/show', [
            'record' => $observasiKeselamatan,
            'is_pj'  => $request->user()->id === $observasiKeselamatan->penanggung_jawab_id,
        ]);
    }

    public function konfirmasi(Request $request, ObservasiKeselamatan $observasiKeselamatan)
    {
        abort_unless(
            $request->user()->id === $observasiKeselamatan->penanggung_jawab_id,
            403
        );

        abort_if($observasiKeselamatan->status !== 'menunggu_konfirmasi', 403, 'Form ini sudah diproses.');

        $observasiKeselamatan->load('user:id,name,nik,jabatan,site', 'penanggungJawab:id,name,jabatan');

        return Inertia::render('sap/observasi-keselamatan/konfirmasi', [
            'record' => $observasiKeselamatan,
        ]);
    }

    public function storeKonfirmasi(Request $request, ObservasiKeselamatan $observasiKeselamatan)
    {
        abort_unless(
            $request->user()->id === $observasiKeselamatan->penanggung_jawab_id,
            403
        );

        abort_if($observasiKeselamatan->status !== 'menunggu_konfirmasi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate([
            'pj_signature' => ['required', 'string'],
        ]);

        $observasiKeselamatan->update([
            'pj_signature'       => $validated['pj_signature'],
            'status'             => 'dikonfirmasi',
            'pj_dikonfirmasi_at' => now(),
        ]);

        // Mark notification as read
        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/observasi-keselamatan/{$observasiKeselamatan->id}/konfirmasi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Konfirmasi berhasil disimpan.']);

        return redirect()->route('sap.observasi-keselamatan.index');
    }

    public function tolakKonfirmasi(Request $request, ObservasiKeselamatan $observasiKeselamatan)
    {
        abort_unless(
            $request->user()->id === $observasiKeselamatan->penanggung_jawab_id,
            403
        );

        abort_if($observasiKeselamatan->status !== 'menunggu_konfirmasi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate([
            'alasan' => ['required', 'string', 'max:1000'],
        ]);

        $observasiKeselamatan->update([
            'status'          => 'ditolak',
            'pj_tolak_alasan' => $validated['alasan'],
            'pj_ditolak_at'   => now(),
        ]);

        // Mark notification as read
        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/observasi-keselamatan/{$observasiKeselamatan->id}/konfirmasi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Penolakan berhasil disimpan.']);

        return redirect()->route('sap.observasi-keselamatan.index');
    }

    public function exportPdf(Request $request, ObservasiKeselamatan $observasiKeselamatan)
    {
        abort_unless(
            $request->user()->is_admin
                || $request->user()->id === $observasiKeselamatan->user_id
                || $request->user()->id === $observasiKeselamatan->penanggung_jawab_id,
            403
        );

        $observasiKeselamatan->load('user:id,name,nik,jabatan,site', 'penanggungJawab:id,name,nik,jabatan,site');

        $pdf = Pdf::loadView('pdf.observasi-keselamatan', [
            'record' => $observasiKeselamatan,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('observasi-keselamatan-'.$observasiKeselamatan->id.'.pdf');
    }
}
