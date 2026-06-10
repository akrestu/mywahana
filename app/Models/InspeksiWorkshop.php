<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class InspeksiWorkshop extends Model
{
    protected $table = 'inspeksi_workshop';

    protected $fillable = [
        'user_id', 're_inspektor_id',
        'tanggal', 'project_site', 'departemen',
        // Bangunan
        'bangunan_1','bangunan_2','bangunan_3','bangunan_4','bangunan_5','bangunan_6','bangunan_7',
        'bangunan_8','bangunan_9','bangunan_10','bangunan_11','bangunan_12','bangunan_13','bangunan_14',
        'bangunan_15','bangunan_16','bangunan_17','bangunan_18','bangunan_19','bangunan_20','bangunan_21',
        // Kelistrikan
        'kelistrikan_1','kelistrikan_2','kelistrikan_3','kelistrikan_4',
        'kelistrikan_5','kelistrikan_6','kelistrikan_7','kelistrikan_8',
        // Welder
        'welder_1','welder_2','welder_3','welder_4','welder_5','welder_6',
        // Tabung
        'tabung_1','tabung_2','tabung_3','tabung_4','tabung_5','tabung_6',
        // Alat Angkat
        'alat_angkat_1','alat_angkat_2','alat_angkat_3','alat_angkat_4','alat_angkat_5',
        // TPS
        'tps_1','tps_2','tps_3','tps_4','tps_5','tps_6',
        'tps_7','tps_8','tps_9','tps_10','tps_11','tps_12',
        // Tyre
        'tyre_1','tyre_2','tyre_3',
        // Kalkulasi
        'total_poin', 'max_poin', 'persentase', 'risk_level',
        'tindakan_perbaikan', 'foto_items',
        'ttd_inspektor', 'ttd_re_inspektor',
        'status', 're_inspeksi_at', 'tolak_alasan',
    ];

    protected $casts = [
        'tanggal'            => 'date',
        'tindakan_perbaikan' => 'array',
        'foto_items'         => 'array',
        're_inspeksi_at'     => 'datetime',
        'persentase'         => 'float',
    ];

    public static array $scoreKeys = [
        'bangunan_1','bangunan_2','bangunan_3','bangunan_4','bangunan_5','bangunan_6','bangunan_7',
        'bangunan_8','bangunan_9','bangunan_10','bangunan_11','bangunan_12','bangunan_13','bangunan_14',
        'bangunan_15','bangunan_16','bangunan_17','bangunan_18','bangunan_19','bangunan_20','bangunan_21',
        'kelistrikan_1','kelistrikan_2','kelistrikan_3','kelistrikan_4',
        'kelistrikan_5','kelistrikan_6','kelistrikan_7','kelistrikan_8',
        'welder_1','welder_2','welder_3','welder_4','welder_5','welder_6',
        'tabung_1','tabung_2','tabung_3','tabung_4','tabung_5','tabung_6',
        'alat_angkat_1','alat_angkat_2','alat_angkat_3','alat_angkat_4','alat_angkat_5',
        'tps_1','tps_2','tps_3','tps_4','tps_5','tps_6',
        'tps_7','tps_8','tps_9','tps_10','tps_11','tps_12',
        'tyre_1','tyre_2','tyre_3',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reInspektor(): BelongsTo
    {
        return $this->belongsTo(User::class, 're_inspektor_id');
    }

    public function peserta(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'inspeksi_workshop_peserta');
    }
}
