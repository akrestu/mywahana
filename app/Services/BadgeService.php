<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserBadge;

class BadgeService
{
    public function checkAndAward(User $user): array
    {
        $awarded = [];

        $totalBugar   = $user->bugarSelamats()->count();
        $totalLaporan = $user->laporanBahayas()->count();
        $streak       = $user->currentStreak();

        $checks = [
            'first_bugar'   => $totalBugar >= 1,
            'streak_7'      => $streak >= 7,
            'streak_30'     => $streak >= 30,
            'first_laporan' => $totalLaporan >= 1,
            'laporan_10'    => $totalLaporan >= 10,
            'laporan_50'    => $totalLaporan >= 50,
        ];

        $existing = $user->badges()->pluck('badge_key')->flip();

        foreach ($checks as $key => $earned) {
            if ($earned && ! $existing->has($key)) {
                UserBadge::create([
                    'user_id'   => $user->id,
                    'badge_key' => $key,
                    'earned_at' => now(),
                ]);
                $awarded[] = $key;
            }
        }

        return $awarded;
    }
}
