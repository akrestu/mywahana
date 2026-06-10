<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBadge extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'badge_key', 'earned_at'];

    protected $casts = ['earned_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static array $definitions = [
        'first_bugar'  => ['nama' => 'Siap Bertugas',        'icon' => '🦺', 'desc' => 'Pertama kali lapor kondisi fisik sebelum bekerja'],
        'streak_7'     => ['nama' => 'Disiplin Sepekan',     'icon' => '📋', 'desc' => '7 hari berturut-turut lapor kondisi fisik'],
        'streak_30'    => ['nama' => 'Pejuang Zero Incident','icon' => '🏅', 'desc' => '30 hari berturut-turut lapor kondisi fisik'],
        'first_laporan'=> ['nama' => 'Mata Pengawas',        'icon' => '🔍', 'desc' => 'Pertama kali melaporkan potensi bahaya di lapangan'],
        'laporan_10'   => ['nama' => 'Agen K3',              'icon' => '⛑️', 'desc' => 'Telah melaporkan 10 potensi bahaya'],
        'laporan_50'   => ['nama' => 'Safety Champion',      'icon' => '🏆', 'desc' => 'Telah melaporkan 50 potensi bahaya'],
    ];
}
