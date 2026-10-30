<?php

namespace App\Http\Controllers;

use App\Models\LaporanBahaya;
use App\Models\LaporanBahayaReview;
use App\Models\Site;
use App\Models\User;
use App\Notifications\LaporanBahayaPicDitugaskan;
use App\Notifications\LaporanBahayaStatusDiperbarui;
use App\Rules\Signature;
use App\Services\BadgeService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LaporanBahayaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $myRecords = $user->laporanBahayas()
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: 'my_page');

        $picRecords = LaporanBahaya::where('pic_user_id', $user->id)
            ->with('user')
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: 'pic_page');

        $pendingPicCount = LaporanBahaya::where('pic_user_id', $user->id)
            ->whereIn('status_tindakan', ['pending', 'continue'])
            ->count();

        return Inertia::render('laporan-bahaya/index', [
            'myRecords' => $myRecords,
            'picRecords' => $picRecords,
            'pendingPicCount' => $pendingPicCount,
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user()->load('sites:id,value');
        $siteValues = $user->assignedSiteValues();

        return Inertia::render('laporan-bahaya/create', [
            'user' => $user->only('name', 'nik', 'jabatan', 'site'),
            'sites' => Site::whereIn('value', $siteValues)->orderBy('label')->get(['value', 'label', 'locations']),
            'pics' => User::with('sites:id,value')
                ->whereIn('participation_level', ['staff', 'srstaff'])
                ->where(function ($query) use ($siteValues) {
                    $query->whereIn('site', $siteValues)
                        ->orWhereHas('sites', fn ($sites) => $sites->whereIn('value', $siteValues));
                })
                ->orderBy('name')
                ->get(['id', 'name', 'jabatan', 'site'])
                ->map(fn (User $pic) => [
                    'id' => $pic->id,
                    'name' => $pic->name,
                    'jabatan' => $pic->jabatan,
                    'sites' => $pic->assignedSiteValues(),
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => ['required', 'date', 'before_or_equal:today'],
            'site' => ['required', 'string', Rule::exists('sites', 'value')],
            'waktu_pengamatan' => ['required', 'date_format:H:i'],
            'shift' => ['required', 'in:siang,malam'],
            'kategori' => ['required', 'in:KTA,TTA'],
            'klasifikasi_bahaya' => ['required', 'string', 'max:255'],
            'lokasi' => ['required', 'string', 'max:255'],
            'detail_lokasi' => ['nullable', 'string', 'max:255'],
            'deskripsi_bahaya' => ['required', 'string'],
            'tindakan_perbaikan' => ['required', 'string'],
            'probabilitas' => ['required', 'integer', 'between:1,5'],
            'frekuensi' => ['required', 'integer', 'between:1,5'],
            'severity' => ['required', 'integer', 'in:1,2,3,25,30'],
            'status_tindakan' => ['required', 'in:pending,continue,progress,close'],
            'pic_user_id' => ['required', 'exists:users,id'],
            // Minimal satu foto temuan wajib, di slot mana pun.
            'foto' => ['required_without:foto_2', 'nullable', 'image', 'max:5120'],
            'foto_2' => ['nullable', 'image', 'max:5120'],
        ], [
            'foto.required_without' => 'Foto temuan wajib diunggah, minimal satu foto.',
        ]);

        $reporter = $request->user()->load('sites:id,value');
        abort_unless(in_array($validated['site'], $reporter->assignedSiteValues(), true), 403);

        $picIsEligible = User::whereKey($validated['pic_user_id'])
            ->whereIn('participation_level', ['staff', 'srstaff'])
            ->assignedToSite($validated['site'])
            ->exists();

        if (! $picIsEligible) {
            return back()->withErrors([
                'pic_user_id' => 'PIC harus ditugaskan pada site pelaporan yang dipilih.',
            ]);
        }

        // Dua slot foto; foto kedua naik ke slot pertama bila hanya itu yang diisi.
        $fotoPaths = collect(['foto', 'foto_2'])
            ->filter(fn ($field) => $request->hasFile($field))
            ->map(fn ($field) => $request->file($field)->store("laporan-bahaya/{$request->user()->id}", 'public'))
            ->values();

        unset($validated['foto'], $validated['foto_2']);

        $record = $reporter->laporanBahayas()->create([
            ...$validated,
            'foto_path' => $fotoPaths->get(0),
            'foto_path_2' => $fotoPaths->get(1),
        ]);

        app(BadgeService::class)->checkAndAward($request->user());

        if ($record->pic_user_id) {
            $record->load('user');
            $record->pic->notify(new LaporanBahayaPicDitugaskan($record));
        }

        return redirect()->route('laporan-bahaya.show', [$record, 'terkirim' => 1]);
    }

    public function show(Request $request, LaporanBahaya $laporanBahaya)
    {
        $user = $request->user();
        abort_unless(
            $user->is_admin
                || $user->id === $laporanBahaya->user_id
                || $user->id === $laporanBahaya->pic_user_id,
            403
        );

        $laporanBahaya->load('user', 'pic', 'reviews.user');

        $backUrl = '/laporan-bahaya';
        if ($user->is_admin && $request->query('ref') === 'admin') {
            $backUrl = '/admin/laporan-bahaya';
        }

        $attachmentUrls = [];
        foreach ($laporanBahaya->reviews as $review) {
            $paths = $review->attachment_paths ?? [];
            $attachmentUrls[$review->id] = array_map(fn ($p) => Storage::url($p), $paths);
        }

        return Inertia::render('laporan-bahaya/show', [
            'record' => $laporanBahaya,
            'fotoUrl' => $laporanBahaya->foto_path
                ? Storage::url($laporanBahaya->foto_path)
                : null,
            'fotoUrls' => array_map(fn ($p) => Storage::url($p), $laporanBahaya->fotoPaths()),
            'terkirim' => $request->boolean('terkirim') && $user->id === $laporanBahaya->user_id,
            'back_url' => $backUrl,
            'is_pic' => $user->id === $laporanBahaya->pic_user_id,
            'attachment_urls' => $attachmentUrls,
        ]);
    }

    public function submitReview(Request $request, LaporanBahaya $laporanBahaya)
    {
        abort_unless($request->user()->id === $laporanBahaya->pic_user_id, 403);
        abort_if($laporanBahaya->status_tindakan === 'close', 403, 'Laporan sudah ditutup.');

        $validated = $request->validate([
            'comment' => ['nullable', 'string', 'max:2000'],
            'status_tindakan' => ['required', 'in:pending,continue,progress,close'],
            'tanda_tangan' => ['nullable', new Signature],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx'],
        ]);

        $paths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                // Ekstensi diambil dari isi file (bukan nama dari klien) agar file
                // seperti "x.php" berisi JPEG tidak tersimpan sebagai skrip.
                $paths[] = $file->store("laporan-bahaya/reviews/{$laporanBahaya->id}", 'public');
            }
        }

        $review = LaporanBahayaReview::create([
            'laporan_bahaya_id' => $laporanBahaya->id,
            'user_id' => $request->user()->id,
            'comment' => $validated['comment'] ?? null,
            'attachment_paths' => $paths ?: null,
            'status_tindakan' => $validated['status_tindakan'],
            'tanda_tangan' => $validated['tanda_tangan'] ?? null,
        ]);

        $laporanBahaya->update(['status_tindakan' => $validated['status_tindakan']]);

        $review->load('laporanBahaya', 'user');
        $laporanBahaya->load('user');
        $laporanBahaya->user->notify(new LaporanBahayaStatusDiperbarui($review));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Review berhasil disimpan.']);

        return redirect()->route('laporan-bahaya.show', $laporanBahaya);
    }

    public function exportPdf(Request $request, LaporanBahaya $laporanBahaya)
    {
        abort_unless(
            $request->user()->is_admin
                || $request->user()->id === $laporanBahaya->user_id
                || $request->user()->id === $laporanBahaya->pic_user_id,
            403
        );

        $laporanBahaya->load('user');

        $fotoAbsPaths = array_map(
            fn ($p) => Storage::disk('public')->path($p),
            $laporanBahaya->fotoPaths(),
        );

        $pdf = Pdf::loadView('pdf.laporan-bahaya', [
            'record' => $laporanBahaya,
            'fotoAbsPaths' => $fotoAbsPaths,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('laporan-bahaya-'.$laporanBahaya->id.'.pdf');
    }
}
