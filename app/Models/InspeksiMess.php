<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class InspeksiMess extends Model
{
    protected $table = 'inspeksi_mess';

    protected $fillable = [
        'user_id', 're_inspektor_id',
        'tanggal', 'project_site', 'lokasi',
        // Sanitasi
        'sanitasi_1','sanitasi_2','sanitasi_3','sanitasi_4','sanitasi_5',
        'sanitasi_6','sanitasi_7','sanitasi_8','sanitasi_9','sanitasi_10',
        // Kamar
        'kamar_1','kamar_2','kamar_3','kamar_4','kamar_5','kamar_6','kamar_7','kamar_8',
        // Dapur
        'dapur_1','dapur_2','dapur_3','dapur_4','dapur_5',
        // Sampah
        'sampah_1','sampah_2','sampah_3','sampah_4','sampah_5',
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
        'sanitasi_1','sanitasi_2','sanitasi_3','sanitasi_4','sanitasi_5',
        'sanitasi_6','sanitasi_7','sanitasi_8','sanitasi_9','sanitasi_10',
        'kamar_1','kamar_2','kamar_3','kamar_4','kamar_5','kamar_6','kamar_7','kamar_8',
        'dapur_1','dapur_2','dapur_3','dapur_4','dapur_5',
        'sampah_1','sampah_2','sampah_3','sampah_4','sampah_5',
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
        return $this->belongsToMany(User::class, 'inspeksi_mess_peserta');
    }
}
