<?php

namespace App\Models;

use App\Models\Concerns\DeletesStoredFiles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KomunikasiJsa extends Model
{
    use DeletesStoredFiles;

    protected $table = 'komunikasi_jsa';

    protected $fillable = [
        'user_id',
        'site',
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

    public function scopeAtSite(Builder $query, string $site): Builder
    {
        return $query->where('site', $site);
    }

    public function storedFilePaths(): array
    {
        return [$this->foto_kelompok, $this->foto_dokumen];
    }
}
