<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class InspeksiKantor extends Model
{
    protected $table = 'inspeksi_kantor';

    protected $fillable = [
        'user_id', 're_inspektor_id',
        'tanggal', 'project_site', 'departemen',
        // Situasi
        'situasi_1', 'situasi_2', 'situasi_3', 'situasi_4', 'situasi_5', 'situasi_6', 'situasi_7',
        // Individu
        'individu_1',
        // Alat
        'alat_1', 'alat_2', 'alat_3', 'alat_4', 'alat_5', 'alat_6', 'alat_7',
        // Prosedur
        'prosedur_1', 'prosedur_2', 'prosedur_3', 'prosedur_4', 'prosedur_5', 'prosedur_6', 'prosedur_7',
        // Kalkulasi
        'total_poin', 'max_poin', 'persentase', 'risk_level',
        // Lainnya
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
        'individu_1',
        'alat_1','alat_2','alat_3','alat_4','alat_5','alat_6','alat_7',
        'prosedur_1','prosedur_2','prosedur_3','prosedur_4','prosedur_5','prosedur_6','prosedur_7',
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
        return $this->belongsToMany(User::class, 'inspeksi_kantor_peserta');
    }
}
