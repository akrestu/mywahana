<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class InspeksiTambang extends Model
{
    protected $table = 'inspeksi_tambang';

    protected $fillable = [
        'user_id', 're_inspektor_id',
        'tanggal', 'project_site', 'departemen', 'lokasi',
        // Situasi
        'situasi_1','situasi_2','situasi_3','situasi_4','situasi_5','situasi_6','situasi_7',
        'situasi_8','situasi_9','situasi_10','situasi_11','situasi_12','situasi_13',
        // Individu
        'individu_1','individu_2',
        // Alat
        'alat_1','alat_2','alat_3','alat_4','alat_5','alat_6',
        // Prosedur
        'prosedur_1','prosedur_2','prosedur_3','prosedur_4','prosedur_5',
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
        'situasi_1','situasi_2','situasi_3','situasi_4','situasi_5','situasi_6','situasi_7',
        'situasi_8','situasi_9','situasi_10','situasi_11','situasi_12','situasi_13',
        'individu_1','individu_2',
        'alat_1','alat_2','alat_3','alat_4','alat_5','alat_6',
        'prosedur_1','prosedur_2','prosedur_3','prosedur_4','prosedur_5',
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
        return $this->belongsToMany(User::class, 'inspeksi_tambang_peserta');
    }
}
