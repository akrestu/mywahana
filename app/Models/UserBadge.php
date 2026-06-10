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
        'first_bugar'  => ['nama' => 'Langkah Pertama',    'icon' => '👟', 'desc' => 'Mengisi Bugar Selamat untuk pertama kalinya'],
        'streak_7'     => ['nama' => 'Seminggu Konsisten',  'icon' => '🔥', 'desc' => '7 hari berturut-turut mengisi Bugar Selamat'],
        'streak_30'    => ['nama' => 'Pejuang Selamat',     'icon' => '🏆', 'desc' => '30 hari berturut-turut mengisi Bugar Selamat'],
        'first_laporan'=> ['nama' => 'Mata Elang',          'icon' => '🦅', 'desc' => 'Melaporkan bahaya untuk pertama kalinya'],
        'laporan_10'   => ['nama' => 'Pengamat Aktif',      'icon' => '⭐', 'desc' => 'Telah mengirim 10 Laporan Bahaya'],
        'laporan_50'   => ['nama' => 'Pahlawan K3',         'icon' => '🛡️', 'desc' => 'Telah mengirim 50 Laporan Bahaya'],
    ];
}
