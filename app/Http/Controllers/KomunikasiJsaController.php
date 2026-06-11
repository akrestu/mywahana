<?php

namespace App\Http\Controllers;

use App\Models\KomunikasiJsa;
use App\Models\User;
use App\Notifications\KomunikasiJsaKonfirmasi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KomunikasiJsaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $myRecords = KomunikasiJsa::where('user_id', $user->id)
            ->with('teamLeader:id,name,jabatan')
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: 'my_page');

        $pendingKonfirmasi = KomunikasiJsa::where('team_leader_id', $user->id)
            ->where('user_id', '!=', $user->id)
            ->where('status', 'menunggu_konfirmasi')
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: 'tl_page');

        $confirmedAsTL = KomunikasiJsa::where('team_leader_id', $user->id)
            ->where('user_id', '!=', $user->id)
            ->whereIn('status', ['dikonfirmasi', 'ditolak'])
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: 'tl_confirmed_page');

        return Inertia::render('sap/komunikasi-jsa/index', [
            'myRecords'        => $myRecords,
            'pendingKonfirmasi' => $pendingKonfirmasi,
            'confirmedAsTL'    => $confirmedAsTL,
        ]);
    }

    public function create(Request $request)
    {
        $staffUsers = User::whereIn('participation_level', ['staff', 'srstaff'])
            ->orderBy('name')
            ->get(['id', 'name', 'nik', 'jabatan', 'site']);

        return Inertia::render('sap/komunikasi-jsa/create', [
            'user'       => $request->user()->only('name', 'nik', 'jabatan', 'site'),
            'staffUsers' => $staffUsers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'team_leader_id'          => ['nullable', 'exists:users,id'],
            'tanggal'                 => ['required', 'date'],
            'lokasi'                  => ['required', 'string', 'max:255'],
            'shift'                   => ['required', 'in:siang,malam'],
            'durasi'                  => ['required', 'integer', 'min:1', 'max:65535'],
            'kegiatan'                => ['required', 'string'],
            'judul_dokumen'           => ['required', 'string', 'max:255'],
            'catatan'                 => ['nullable', 'string'],
            'peserta'                 => ['required', 'array', 'min:1', 'max:10'],
            'peserta.*.nama'          => ['required', 'string', 'max:255'],
            'peserta.*.jabatan'       => ['nullable', 'string', 'max:255'],
            'peserta.*.nik'           => ['nullable', 'string', 'max:50'],
            'peserta.*.tanda_tangan'  => ['required', 'string'],
            'supervisor_signature'    => ['nullable', 'string'],
            'foto_kelompok'           => ['required', 'image', 'max:5120'],
            'foto_dokumen'            => ['required', 'image', 'max:5120'],
        ]);

        $user = $request->user();
        $teamLeaderId = $validated['team_leader_id'] ?? null;

        $needsKonfirmasi = $teamLeaderId !== null && (int) $teamLeaderId !== $user->id;
        $status = $needsKonfirmasi ? 'menunggu_konfirmasi' : 'selesai';

        $fotoKelompok = $request->file('foto_kelompok')->store('komunikasi-jsa', 'public');
        $fotoDokumen  = $request->file('foto_dokumen')->store('komunikasi-jsa', 'public');

        $form = KomunikasiJsa::create([
            'user_id'              => $user->id,
            'team_leader_id'       => $teamLeaderId,
            'tanggal'              => $validated['tanggal'],
            'lokasi'               => $validated['lokasi'],
            'shift'                => $validated['shift'],
            'durasi'               => $validated['durasi'],
            'kegiatan'             => $validated['kegiatan'],
            'judul_dokumen'        => $validated['judul_dokumen'],
            'catatan'              => $validated['catatan'] ?? null,
            'peserta'              => $validated['peserta'],
            'supervisor_signature' => $validated['supervisor_signature'] ?? null,
            'status'               => $status,
            'foto_kelompok'        => $fotoKelompok,
            'foto_dokumen'         => $fotoDokumen,
        ]);

        if ($needsKonfirmasi) {
            $teamLeader = User::find($teamLeaderId);
            $form->load('user');
            $teamLeader->notify(new KomunikasiJsaKonfirmasi($form));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lembar Komunikasi JSA berhasil disimpan.']);

        return redirect()->route('sap.komunikasi-jsa.index');
    }

    public function show(Request $request, KomunikasiJsa $komunikasiJsa)
    {
        abort_unless(
            $request->user()->is_admin
                || $request->user()->id === $komunikasiJsa->user_id
                || $request->user()->id === $komunikasiJsa->team_leader_id,
            403
        );

        $komunikasiJsa->load('user:id,name,nik,jabatan,site', 'teamLeader:id,name,nik,jabatan,site');

        return Inertia::render('sap/komunikasi-jsa/show', [
            'record'       => $komunikasiJsa,
            'isTeamLeader' => $request->user()->id === $komunikasiJsa->team_leader_id,
        ]);
    }

    public function konfirmasi(Request $request, KomunikasiJsa $komunikasiJsa)
    {
        abort_unless($request->user()->id === $komunikasiJsa->team_leader_id, 403);
        abort_if($komunikasiJsa->status !== 'menunggu_konfirmasi', 403, 'Form ini sudah diproses.');

        $komunikasiJsa->load('user:id,name,nik,jabatan,site', 'teamLeader:id,name,jabatan');

        return Inertia::render('sap/komunikasi-jsa/konfirmasi', [
            'record' => $komunikasiJsa,
        ]);
    }

    public function storeKonfirmasi(Request $request, KomunikasiJsa $komunikasiJsa)
    {
        abort_unless($request->user()->id === $komunikasiJsa->team_leader_id, 403);
        abort_if($komunikasiJsa->status !== 'menunggu_konfirmasi', 403, 'Form ini sudah diproses.');

        $validated = $request->validate([
            'tl_signature' => ['required', 'string'],
        ]);

        $komunikasiJsa->update([
            'tl_signature'       => $validated['tl_signature'],
            'status'             => 'dikonfirmasi',
            'tl_dikonfirmasi_at' => now(),
        ]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/komunikasi-jsa/{$komunikasiJsa->id}/konfirmasi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Konfirmasi berhasil disimpan.']);

        return redirect()->route('sap.komunikasi-jsa.index');
    }

    public function tolakKonfirmasi(Request $request, KomunikasiJsa $komunikasiJsa)
    {
        abort_unless($request->user()->id === $komunikasiJsa->team_leader_id, 403);
        abort_if($komunikasiJsa->status !== 'menunggu_konfirmasi', 403, 'Form ini sudah diproses.');

        $komunikasiJsa->update([
            'status' => 'ditolak',
        ]);

        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/komunikasi-jsa/{$komunikasiJsa->id}/konfirmasi")
            ->update(['read_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form telah ditolak.']);

        return redirect()->route('sap.komunikasi-jsa.index');
    }
}
