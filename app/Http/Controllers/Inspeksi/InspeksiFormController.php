<?php

namespace App\Http\Controllers\Inspeksi;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\User;
use App\Rules\Signature;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Notifications\Notification;
use Inertia\Inertia;

/**
 * Alur form inspeksi yang sama untuk kantor, tambang, workshop, dan mess:
 * isi checklist, re-inspeksi oleh atasan, tolak, dan export PDF.
 * Subclass hanya menentukan model, field tambahan, dan notifikasinya.
 */
abstract class InspeksiFormController extends Controller
{
    /** @return class-string<Model> Model dengan static $scoreKeys. */
    abstract protected function model(): string;

    /** Slug jenis inspeksi, mis. 'kantor'. Dipakai untuk route, halaman, PDF, dan folder foto. */
    abstract protected function slug(): string;

    /** Notifikasi untuk re-inspektor dan peserta saat inspeksi dibuat. */
    abstract protected function notification(Model $record, string $role): Notification;

    /** Aturan validasi untuk field khusus jenis inspeksi (mis. departemen, lokasi). */
    abstract protected function extraRules(): array;

    /** Field profil pelapor yang ditampilkan di form. */
    protected function userFields(): array
    {
        return ['name', 'nik', 'jabatan', 'departemen', 'site'];
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $model = $this->model();

        $myRecords = $model::where('user_id', $user->id)
            ->orWhereHas('peserta', fn ($q) => $q->where('user_id', $user->id))
            ->with('reInspektor:id,name,jabatan')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'my_page');

        $pendingReInspeksi = $model::where('re_inspektor_id', $user->id)
            ->where('status', 'menunggu_re_inspeksi')
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_page');

        $selesaiAsRI = $model::where('re_inspektor_id', $user->id)
            ->whereIn('status', ['selesai', 'ditolak'])
            ->with('user:id,name,nik,jabatan,site')
            ->orderByDesc('tanggal')->orderByDesc('created_at')
            ->paginate(15, pageName: 'ri_done_page');

        return Inertia::render($this->page('index'), [
            'myRecords' => $myRecords,
            'pendingReInspeksi' => $pendingReInspeksi,
            'selesaiAsRI' => $selesaiAsRI,
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user()->load('sites:id,value');
        $siteValues = $user->assignedSiteValues();

        $staffUsers = User::whereIn('participation_level', ['staff', 'srstaff'])
            ->where('id', '!=', $user->id)
            ->with('sites:id,value')
            ->where(fn ($query) => $query->whereIn('site', $siteValues)
                ->orWhereHas('sites', fn ($sites) => $sites->whereIn('value', $siteValues)))
            ->orderBy('name')
            ->get(['id', 'name', 'nik', 'jabatan', 'site'])
            ->map(fn (User $staff) => [
                'id' => $staff->id, 'name' => $staff->name, 'nik' => $staff->nik,
                'jabatan' => $staff->jabatan, 'site' => $staff->site,
                'sites' => $staff->assignedSiteValues(),
            ]);

        return Inertia::render($this->page('create'), [
            'user' => $user->only($this->userFields()),
            'staffUsers' => $staffUsers,
            'sites' => Site::whereIn('value', $siteValues)->orderBy('label')->get(['value', 'label']),
        ]);
    }

    public function store(Request $request)
    {
        $model = $this->model();
        $scoreRule = ['nullable', 'integer', 'between:1,4'];

        $validated = $request->validate([
            're_inspektor_id' => ['nullable', 'exists:users,id'],
            'peserta_ids' => ['nullable', 'array'],
            'peserta_ids.*' => ['exists:users,id'],
            'tanggal' => ['required', 'date', 'before_or_equal:today'],
            'project_site' => ['required', 'string', 'max:255'],
            ...$this->extraRules(),
            ...array_fill_keys($model::$scoreKeys, $scoreRule),
            'tindakan_perbaikan' => ['nullable', 'array'],
            'tindakan_perbaikan.*.tindakan' => ['nullable', 'string', 'max:500'],
            'tindakan_perbaikan.*.pic' => ['nullable', 'string', 'max:255'],
            'tindakan_perbaikan.*.due_date' => ['nullable', 'string', 'max:50'],
            'tindakan_perbaikan.*.remark' => ['nullable', 'string', 'max:500'],
            'foto' => ['nullable', 'array'],
            'foto.*' => ['nullable', 'image', 'max:5120'],
            'ttd_inspektor' => ['nullable', new Signature],
        ]);

        // Site dan semua petugas yang ditunjuk harus berada di site pelapor.
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

        $pesertaIds = $validated['peserta_ids'] ?? [];
        unset($validated['peserta_ids'], $validated['foto']);

        $record = $model::create(array_merge($validated, $this->score($validated), [
            'user_id' => $actor->id,
            'status' => empty($validated['re_inspektor_id']) ? 'selesai' : 'menunggu_re_inspeksi',
        ]));

        if ($request->hasFile('foto')) {
            $fotoItems = [];
            foreach ($request->file('foto') as $key => $file) {
                $fotoItems[$key] = $file->store("inspeksi/{$this->slug()}/{$record->id}", 'public');
            }
            $record->update(['foto_items' => $fotoItems]);
        }

        if ($pesertaIds) {
            $record->peserta()->sync($pesertaIds);
        }

        $record->load('user');

        $record->reInspektor?->notify($this->notification($record, 're_inspektor'));
        User::whereIn('id', $pesertaIds)->get()->each->notify($this->notification($record, 'peserta'));

        return redirect()->route($this->routeName('show'), [$record, 'terkirim' => 1]);
    }

    public function show(Request $request, int $record)
    {
        $record = $this->findViewable($request, $record);
        $record->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,nik,jabatan,site');
        $user = $request->user();

        return Inertia::render($this->page('show'), [
            'record' => $record,
            'is_ri' => $user->id === $record->re_inspektor_id,
            'terkirim' => $request->boolean('terkirim') && $user->id === $record->user_id,
        ]);
    }

    public function reInspeksi(Request $request, int $record)
    {
        $record = $this->model()::findOrFail($record);
        abort_unless($request->user()->id === $record->re_inspektor_id, 403);

        if ($record->status !== 'menunggu_re_inspeksi') {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Form ini sudah diproses.']);

            return redirect()->route($this->routeName('show'), $record);
        }

        $record->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,jabatan');

        return Inertia::render($this->page('re-inspeksi'), ['record' => $record]);
    }

    public function storeReInspeksi(Request $request, int $record)
    {
        $record = $this->findPendingForReInspektor($request, $record);
        $validated = $request->validate(['ttd_re_inspektor' => ['required', new Signature]]);

        $record->update([
            'ttd_re_inspektor' => $validated['ttd_re_inspektor'],
            'status' => 'selesai',
            're_inspeksi_at' => now(),
        ]);

        $this->markReInspeksiNotificationsRead($request, $record);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Re-inspeksi berhasil dikonfirmasi.']);

        return redirect()->route($this->routeName('index'));
    }

    public function tolak(Request $request, int $record)
    {
        $record = $this->findPendingForReInspektor($request, $record);
        $validated = $request->validate(['alasan' => ['required', 'string', 'max:1000']]);

        $record->update(['status' => 'ditolak', 'tolak_alasan' => $validated['alasan']]);

        $this->markReInspeksiNotificationsRead($request, $record);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Form telah ditolak.']);

        return redirect()->route($this->routeName('index'));
    }

    public function exportPdf(Request $request, int $record)
    {
        $record = $this->findViewable($request, $record);
        $record->load('user:id,name,nik,jabatan,site', 'reInspektor:id,name,nik,jabatan,site', 'peserta:id,name,jabatan');

        return Pdf::loadView('pdf.inspeksi-'.$this->slug(), ['record' => $record])
            ->setPaper('a4', 'portrait')
            ->stream('inspeksi-'.$this->slug().'-'.$record->id.'.pdf');
    }

    /**
     * Total poin, persentase, dan level risiko dari checklist yang terisi.
     */
    private function score(array $validated): array
    {
        $keys = $this->model()::$scoreKeys;
        $scores = collect($keys)->map(fn ($k) => $validated[$k] ?? null)->filter(fn ($v) => $v !== null);

        $totalPoin = $scores->sum();
        $maxPoin = count($keys) * 4;
        $persentase = $scores->count() > 0 ? round(($totalPoin / $maxPoin) * 100, 1) : 0;

        return [
            'total_poin' => $totalPoin,
            'max_poin' => $maxPoin,
            'persentase' => $persentase,
            'risk_level' => match (true) {
                $persentase >= 85 => 'L',
                $persentase >= 70 => 'M',
                $persentase >= 50 => 'H',
                default => 'VH',
            },
        ];
    }

    /**
     * Inspeksi hanya boleh dilihat admin, pembuat, re-inspektor, atau peserta.
     */
    private function findViewable(Request $request, int $id): Model
    {
        $record = $this->model()::findOrFail($id);
        $user = $request->user();

        abort_unless(
            $user->is_admin
                || $user->id === $record->user_id
                || $user->id === $record->re_inspektor_id
                || $record->peserta()->where('user_id', $user->id)->exists(),
            403
        );

        return $record;
    }

    private function findPendingForReInspektor(Request $request, int $id): Model
    {
        $record = $this->model()::findOrFail($id);

        abort_unless($request->user()->id === $record->re_inspektor_id, 403);
        abort_if($record->status !== 'menunggu_re_inspeksi', 403, 'Form ini sudah diproses.');

        return $record;
    }

    private function markReInspeksiNotificationsRead(Request $request, Model $record): void
    {
        $request->user()->unreadNotifications()
            ->whereJsonContains('data->url', "/sap/inspeksi-{$this->slug()}/{$record->id}/re-inspeksi")
            ->update(['read_at' => now()]);
    }

    private function page(string $view): string
    {
        return "sap/inspeksi-{$this->slug()}/{$view}";
    }

    private function routeName(string $action): string
    {
        return "sap.inspeksi-{$this->slug()}.{$action}";
    }
}
