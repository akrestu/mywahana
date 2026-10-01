<?php

namespace App\Models;

use App\Models\Concerns\DeletesStoredFiles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class LaporanBahaya extends Model
{
    use DeletesStoredFiles;

    protected $table = 'laporan_bahaya';

    protected $fillable = [
        'user_id', 'site', 'tanggal', 'waktu_pengamatan', 'kategori', 'klasifikasi_bahaya', 'lokasi', 'detail_lokasi',
        'deskripsi_bahaya', 'tindakan_perbaikan',
        'probabilitas', 'frekuensi', 'severity',
        'nilai_risiko', 'tingkat_risiko',
        'status_tindakan', 'pic_user_id', 'foto_path',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'probabilitas' => 'integer',
        'frekuensi' => 'integer',
        'severity' => 'integer',
        'nilai_risiko' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $model) {
            $model->nilai_risiko = $model->probabilitas * $model->frekuensi * $model->severity;
            $model->tingkat_risiko = self::computeRiskLevel($model->nilai_risiko);
        });
    }

    public static function computeRiskLevel(int $nilai): string
    {
        return match (true) {
            $nilai >= 125 => 'AA',
            $nilai >= 25 => 'A',
            $nilai >= 10 => 'B',
            default => 'C',
        };
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pic()
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }

    public function reviews()
    {
        return $this->hasMany(LaporanBahayaReview::class);
    }

    public function latestReview()
    {
        return $this->hasOne(LaporanBahayaReview::class)->latestOfMany();
    }

    public function scopeAtSite(Builder $query, string $site): Builder
    {
        return $query->where('site', $site);
    }

    /**
     * Foto laporan beserta lampiran semua review-nya
     * (review ikut terhapus lewat cascade di database).
     */
    public function storedFilePaths(): array
    {
        $reviewPaths = $this->reviews()->get(['attachment_paths'])->pluck('attachment_paths')->flatten()->all();

        return [$this->foto_path, ...$reviewPaths];
    }
}
