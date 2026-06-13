<?php

namespace App\Http\Controllers;

use App\Models\LaporanBahaya;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\BadgeService;
use Inertia\Inertia;

class LaporanBahayaController extends Controller
{
    public function index(Request $request)
    {
        $records = $request->user()
            ->laporanBahayas()
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('laporan-bahaya/index', [
            'records' => $records,
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('laporan-bahaya/create', [
            'user' => $request->user()->only('name', 'nik', 'jabatan', 'site'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal'             => ['required', 'date'],
            'waktu_pengamatan'    => ['required', 'date_format:H:i'],
            'kategori'            => ['required', 'in:KTA,TTA'],
            'lokasi'              => ['required', 'string', 'max:255'],
            'deskripsi_bahaya'    => ['required', 'string'],
            'tindakan_perbaikan'  => ['required', 'string'],
            'probabilitas'        => ['required', 'integer', 'between:1,5'],
            'frekuensi'           => ['required', 'integer', 'between:1,5'],
            'severity'            => ['required', 'integer', 'in:1,2,3,25,30'],
            'status_tindakan'     => ['required', 'in:pending,selesai'],
            'foto'                => ['nullable', 'image', 'max:5120'],
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $userId = $request->user()->id;
            $filename = Str::uuid().'.jpg';
            $relativePath = "laporan-bahaya/{$userId}/{$filename}";

            Storage::disk('public')->put($relativePath, file_get_contents($request->file('foto')->getRealPath()));

            $fotoPath = $relativePath;
        }

        $record = $request->user()->laporanBahayas()->create([
            ...$validated,
            'foto_path' => $fotoPath,
        ]);

        app(BadgeService::class)->checkAndAward($request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Laporan Bahaya berhasil disimpan.']);

        return redirect()->route('laporan-bahaya.index');
    }

    public function show(Request $request, LaporanBahaya $laporanBahaya)
    {
        abort_unless(
            $request->user()->is_admin || $request->user()->id === $laporanBahaya->user_id,
            403
        );

        $laporanBahaya->load('user');

        return Inertia::render('laporan-bahaya/show', [
            'record' => $laporanBahaya,
            'fotoUrl' => $laporanBahaya->foto_path
                ? Storage::url($laporanBahaya->foto_path)
                : null,
        ]);
    }

    public function exportPdf(Request $request, LaporanBahaya $laporanBahaya)
    {
        abort_unless(
            $request->user()->is_admin || $request->user()->id === $laporanBahaya->user_id,
            403
        );

        $laporanBahaya->load('user');

        $fotoAbsPath = $laporanBahaya->foto_path
            ? Storage::path($laporanBahaya->foto_path)
            : null;

        $pdf = Pdf::loadView('pdf.laporan-bahaya', [
            'record'       => $laporanBahaya,
            'fotoAbsPath'  => $fotoAbsPath,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('laporan-bahaya-'.$laporanBahaya->id.'.pdf');
    }
}
