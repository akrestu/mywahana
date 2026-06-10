<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParticipationTarget extends Model
{
    protected $fillable = ['level', 'laporan_per_minggu', 'bugar_per_hari', 'updated_by'];

    public static function forLevel(string $level): self
    {
        return static::firstOrCreate(
            ['level' => $level],
            ['laporan_per_minggu' => 1, 'bugar_per_hari' => 1]
        );
    }

    public function targetBulanIni(): int
    {
        $weeks = (int) ceil(now()->daysInMonth / 7);
        return $this->laporan_per_minggu * $weeks;
    }
}
