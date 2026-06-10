<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BugarSelamat extends Model
{
    protected $table = 'bugar_selamat';

    protected $fillable = [
        'user_id', 'tanggal', 'shift', 'hari_ke',
        'jam_tidur', 'kondisi_sakit', 'minum_obat',
        'masalah_pribadi', 'pengaruh_alkohol', 'siap_bekerja',
        'status_kelayakan', 'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'kondisi_sakit' => 'boolean',
        'minum_obat' => 'boolean',
        'masalah_pribadi' => 'boolean',
        'pengaruh_alkohol' => 'boolean',
        'siap_bekerja' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $model) {
            $model->status_kelayakan = self::computeStatus($model);
        });
    }

    public static function computeStatus(self $model): string
    {
        if ($model->jam_tidur === '<5' || $model->kondisi_sakit || $model->minum_obat
            || $model->masalah_pribadi || $model->pengaruh_alkohol || ! $model->siap_bekerja) {
            return 'dilarang';
        }

        if ($model->jam_tidur === '5-6') {
            return 'catatan';
        }

        return 'layak';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
