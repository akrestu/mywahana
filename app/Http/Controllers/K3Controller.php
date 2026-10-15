<?php

namespace App\Http\Controllers;

use App\Models\BugarSelamat;
use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\KomunikasiJsa;
use App\Models\LaporanBahaya;
use App\Models\ObservasiKeselamatan;
use App\Services\UserTargetService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

/** Hub page for the K3 / Safety module. */
class K3Controller extends Controller
{
    private const INSPEKSI = [
        'kantor' => InspeksiKantor::class,
        'tambang' => InspeksiTambang::class,
        'workshop' => InspeksiWorkshop::class,
        'mess' => InspeksiMess::class,
    ];

    public function index(Request $request, UserTargetService $targets)
    {
        $user = $request->user();
        $now = Carbon::now();
        $isStaff = in_array($user->participation_level, ['staff', 'srstaff']);

        $inspeksi = null;
        if ($isStaff) {
            $inspeksi = collect(self::INSPEKSI)->map(fn ($model) => [
                'bulan_ini' => $model::where('user_id', $user->id)
                    ->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->count(),
                'menunggu_re_inspeksi' => $model::where('re_inspektor_id', $user->id)
                    ->where('status', 'menunggu_re_inspeksi')->count(),
            ]);
        }

        return Inertia::render('k3/index', [
            'is_staff' => $isStaff,
            'target' => $targets->build($user, $now),
            'bugar_hari_ini' => BugarSelamat::where('user_id', $user->id)
                ->whereDate('tanggal', $now->toDateString())->exists(),
            'pic_terbuka' => LaporanBahaya::where('pic_user_id', $user->id)
                ->where('status_tindakan', '!=', 'close')->count(),
            'jsa_perlu_ttd' => $isStaff
                ? KomunikasiJsa::where('team_leader_id', $user->id)->where('user_id', '!=', $user->id)
                    ->where('status', 'menunggu_konfirmasi')->count()
                : 0,
            'observasi_perlu_konfirmasi' => ObservasiKeselamatan::where('penanggung_jawab_id', $user->id)
                ->where('user_id', '!=', $user->id)->where('status', 'menunggu_konfirmasi')->count(),
            'inspeksi' => $inspeksi,
            'riwayat' => LaporanBahaya::where('user_id', $user->id)
                ->latest('tanggal')->limit(5)
                ->get(['id', 'tanggal', 'lokasi', 'tingkat_risiko', 'status_tindakan']),
        ]);
    }
}
