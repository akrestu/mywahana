<?php

namespace App\Http\Controllers;

use App\Models\LaporanBahaya;
use App\Models\LaporanBahayaReview;
use App\Models\Site;
use App\Models\User;
use App\Notifications\LaporanBahayaPicDitugaskan;
use App\Notifications\LaporanBahayaStatusDiperbarui;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Services\BadgeService;
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
            'myRecords'       => $myRecords,
            'picRecords'      => $picRecords,
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
            'tanggal'             => ['required', 'date'],
            'site'                => ['required', 'string', Rule::exists('sites', 'value')],
            'waktu_pengamatan'    => ['required', 'date_format:H:i'],
            'kategori'            => ['required', 'in:KTA,TTA'],
            'klasifikasi_bahaya'  => ['required', 'string', 'max:255'],
            'lokasi'              => ['required', 'string', 'max:255'],
            'detail_lokasi'       => ['nullable', 'string', 'max:255'],
            'deskripsi_bahaya'    => ['required', 'string'],
            'tindakan_perbaikan'  => ['required', 'string'],
            'probabilitas'        => ['required', 'integer', 'between:1,5'],
            'frekuensi'           => ['required', 'integer', 'between:1,5'],
            'severity'            => ['required', 'integer', 'in:1,2,3,25,30'],
            'status_tindakan'     => ['required', 'in:pending,continue,progress,close'],
            'pic_user_id'         => ['required', 'exists:users,id'],
            'foto'                => ['nullable', 'image', 'max:5120'],
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

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $userId = $request->user()->id;
            $filename = Str::uuid().'.jpg';
            $relativePath = "laporan-bahaya/{$userId}/{$filename}";

            Storage::disk('public')->put($relativePath, file_get_contents($request->file('foto')->getRealPath()));

            $fotoPath = $relativePath;
        }

        $record = $reporter->laporanBahayas()->create([
            ...$validated,
            'foto_path' => $fotoPath,
        ]);

        app(BadgeService::class)->checkAndAward($request->user());

        if ($record->pic_user_id) {
            $record->load('user');
            $record->pic->notify(new LaporanBahayaPicDitugaskan($record));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Laporan Bahaya berhasil disimpan.']);

        return redirect()->route('laporan-bahaya.index');
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
            $attachmentUrls[$review->id] = array_map(fn($p) => Storage::url($p), $paths);
        }

        return Inertia::render('laporan-bahaya/show', [
            'record'          => $laporanBahaya,
            'fotoUrl'         => $laporanBahaya->foto_path
                ? Storage::url($laporanBahaya->foto_path)
                : null,
            'back_url'        => $backUrl,
            'is_pic'          => $user->id === $laporanBahaya->pic_user_id,
            'attachment_urls' => $attachmentUrls,
        ]);
    }

    public function submitReview(Request $request, LaporanBahaya $laporanBahaya)
    {
        abort_unless($request->user()->id === $laporanBahaya->pic_user_id, 403);

        $validated = $request->validate([
            'comment'        => ['nullable', 'string', 'max:2000'],
            'status_tindakan'=> ['required', 'in:pending,continue,progress,close'],
            'tanda_tangan'   => ['nullable', 'string'],
            'attachments'    => ['nullable', 'array', 'max:5'],
            'attachments.*'  => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx'],
        ]);

        $paths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $filename  = Str::uuid().'.'.$file->getClientOriginalExtension();
                $dir       = "laporan-bahaya/reviews/{$laporanBahaya->id}";
                $path      = Storage::disk('public')->putFileAs($dir, $file, $filename);
                $paths[]   = $path;
            }
        }

        $review = LaporanBahayaReview::create([
            'laporan_bahaya_id' => $laporanBahaya->id,
            'user_id'           => $request->user()->id,
            'comment'           => $validated['comment'] ?? null,
            'attachment_paths'  => $paths ?: null,
            'status_tindakan'   => $validated['status_tindakan'],
            'tanda_tangan'      => $validated['tanda_tangan'] ?? null,
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
