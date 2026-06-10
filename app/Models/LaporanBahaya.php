<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanBahaya extends Model
{
    protected $table = 'laporan_bahaya';

    protected $fillable = [
        'user_id', 'tanggal', 'waktu_pengamatan', 'kategori', 'lokasi',
        'deskripsi_bahaya', 'tindakan_perbaikan',
        'probabilitas', 'frekuensi', 'severity',
        'nilai_risiko', 'tingkat_risiko',
        'status_tindakan', 'foto_path',
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
            $nilai >= 25  => 'A',
            $nilai >= 10  => 'B',
            default       => 'C',
        };
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
