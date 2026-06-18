<?php

namespace App\Http\Controllers;

use App\Models\BugarSelamat;
use App\Services\BadgeService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BugarSelamatController extends Controller
{
    public function index(Request $request)
    {
        $records = $request->user()
            ->bugarSelamats()
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('bugar-selamat/index', [
            'records' => $records,
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('bugar-selamat/create', [
            'user' => $request->user()->only('name', 'nik', 'jabatan', 'site'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal'         => ['required', 'date', 'date_equals:today'],
            'shift'           => ['required', 'in:Pagi,Siang,Malam'],
            'hari_ke'         => ['required', 'integer', 'min:1'],
            'jam_tidur'       => ['required', 'in:<5,5-6,>6'],
            'kondisi_sakit'   => ['required', 'boolean'],
            'minum_obat'      => ['required', 'boolean'],
            'masalah_pribadi' => ['required', 'boolean'],
            'pengaruh_alkohol'=> ['required', 'boolean'],
            'siap_bekerja'    => ['required', 'boolean'],
            'catatan'         => ['nullable', 'string', 'max:1000'],
        ]);

        $exists = $request->user()->bugarSelamats()
            ->whereDate('tanggal', $validated['tanggal'])
            ->exists();
        if ($exists) {
            throw ValidationException::withMessages([
                'tanggal' => 'Kamu sudah mengisi Bugar Selamat hari ini.',
            ]);
        }

        $record = $request->user()->bugarSelamats()->create($validated);

        app(BadgeService::class)->checkAndAward($request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Checklist Bugar Selamat berhasil disimpan.']);

        return redirect()->route('bugar-selamat.index');
    }

    public function show(Request $request, BugarSelamat $bugarSelamat)
    {
        abort_unless(
            $request->user()->is_admin || $request->user()->id === $bugarSelamat->user_id,
            403
        );

        $bugarSelamat->load('user');

        $backUrl = '/bugar-selamat';
        if ($request->user()->is_admin) {
            if ($request->query('ref') === 'kalender') {
                $backUrl = '/admin/bugar-selamat?view=kalender';
            } elseif ($request->query('ref') === 'monitoring') {
                $backUrl = '/admin/bugar-selamat';
            } elseif ($request->query('ref') === 'daftar') {
                $backUrl = '/admin/bugar-selamat?view=daftar';
            }
        }

        return Inertia::render('bugar-selamat/show', [
            'record'   => $bugarSelamat,
            'back_url' => $backUrl,
        ]);
    }

    public function exportPdf(Request $request, BugarSelamat $bugarSelamat)
    {
        abort_unless(
            $request->user()->is_admin || $request->user()->id === $bugarSelamat->user_id,
            403
        );

        $bugarSelamat->load('user');

        $pdf = Pdf::loadView('pdf.bugar-selamat', ['record' => $bugarSelamat])
            ->setPaper('a4', 'portrait');

        return $pdf->stream('bugar-selamat-'.$bugarSelamat->id.'.pdf');
    }
}
