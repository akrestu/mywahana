<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KomunikasiJsa extends Model
{
    protected $table = 'komunikasi_jsa';

    protected $fillable = [
        'user_id',
        'team_leader_id',
        'tanggal',
        'lokasi',
        'shift',
        'durasi',
        'kegiatan',
        'judul_dokumen',
        'catatan',
        'peserta',
        'supervisor_signature',
        'status',
        'tl_signature',
        'tl_dikonfirmasi_at',
        'foto_kelompok',
        'foto_dokumen',
    ];

    protected $casts = [
        'peserta' => 'array',
        'tanggal' => 'date',
        'tl_dikonfirmasi_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'team_leader_id');
    }
}
