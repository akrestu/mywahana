<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\HasTeams;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'nik', 'email', 'password', 'current_team_id', 'jabatan', 'site', 'is_admin', 'participation_level'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasTeams, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_admin' => 'boolean',
        ];
    }

    public function bugarSelamats()
    {
        return $this->hasMany(BugarSelamat::class);
    }

    public function laporanBahayas()
    {
        return $this->hasMany(LaporanBahaya::class);
    }

    public function badges()
    {
        return $this->hasMany(UserBadge::class);
    }

    public function currentStreak(): int
    {
        $dates = $this->bugarSelamats()
            ->selectRaw('DATE(tanggal) as tgl')
            ->distinct()
            ->orderByDesc('tgl')
            ->pluck('tgl')
            ->map(fn ($d) => \Carbon\Carbon::parse($d)->startOfDay());

        if ($dates->isEmpty()) {
            return 0;
        }

        // Streak hanya valid jika entry terakhir adalah hari ini atau kemarin
        $today = now()->startOfDay();
        if ($dates->first()->lt($today->copy()->subDay())) {
            return 0;
        }

        $streak = 0;
        $cursor = $dates->first()->copy();

        foreach ($dates as $date) {
            if ($date->isSameDay($cursor)) {
                $streak++;
                $cursor->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }
}
