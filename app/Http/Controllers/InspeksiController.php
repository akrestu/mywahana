<?php

namespace App\Http\Controllers;

use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Daftar gabungan keempat jenis inspeksi (kantor, tambang, workshop, mess).
 */
class InspeksiController extends Controller
{
    /** jenis => [model, kolom keterangan] */
    private const TYPES = [
        'kantor' => [InspeksiKantor::class, 'departemen'],
        'tambang' => [InspeksiTambang::class, 'departemen'],
        'workshop' => [InspeksiWorkshop::class, 'departemen'],
        'mess' => [InspeksiMess::class, 'lokasi'],
    ];

    public function index(Request $request)
    {
        $userId = $request->user()->id;

        return Inertia::render('sap/inspeksi/index', [
            'myRecords' => $this->paginate(
                fn (Builder $q) => $q->where(fn ($q) => $q->where('user_id', $userId)
                    ->orWhereHas('peserta', fn ($p) => $p->where('user_id', $userId))),
                'my_page',
            ),
            'pendingReInspeksi' => $this->paginate(
                fn (Builder $q) => $q->where('re_inspektor_id', $userId)->where('status', 'menunggu_re_inspeksi'),
                'ri_page',
            ),
            'selesaiAsRI' => $this->paginate(
                fn (Builder $q) => $q->where('re_inspektor_id', $userId)->whereIn('status', ['selesai', 'ditolak']),
                'ri_done_page',
            ),
        ]);
    }

    private function paginate(Closure $scope, string $pageName): LengthAwarePaginator
    {
        $union = null;

        foreach (self::TYPES as $jenis => [$model, $keterangan]) {
            $query = $scope($model::query())
                ->toBase()
                ->select([
                    'id', 'tanggal', 'created_at', 'status', 'risk_level', 'persentase',
                    'project_site', 'user_id', 're_inspektor_id',
                    DB::raw("{$keterangan} as keterangan"),
                    DB::raw("'{$jenis}' as jenis"),
                ]);

            $union = $union ? $union->unionAll($query) : $query;
        }

        $page = DB::query()
            ->fromSub($union, 'inspeksi')
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at')
            ->paginate(15, pageName: $pageName)
            ->withQueryString();

        $users = User::whereIn('id', collect($page->items())->flatMap(fn ($r) => [$r->user_id, $r->re_inspektor_id])->filter()->unique())
            ->get(['id', 'name'])
            ->keyBy('id');

        return $page->through(fn ($r) => [
            'id' => $r->id,
            'jenis' => $r->jenis,
            'tanggal' => $r->tanggal,
            'status' => $r->status,
            'risk_level' => $r->risk_level,
            'persentase' => $r->persentase !== null ? (float) $r->persentase : null,
            'project_site' => $r->project_site,
            'keterangan' => $r->keterangan,
            'user' => $users->get($r->user_id)?->only('id', 'name'),
            're_inspektor' => $users->get($r->re_inspektor_id)?->only('id', 'name'),
        ]);
    }
}
