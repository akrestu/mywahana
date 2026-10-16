<?php

use App\Models\BugarSelamat;
use App\Models\User;
use App\Models\UserBadge;
use Inertia\Testing\AssertableInertia;

function bugarOn(User $user, string $date): void
{
    BugarSelamat::forceCreate([
        'user_id' => $user->id, 'tanggal' => $date, 'shift' => 'Siang', 'hari_ke' => 1,
        'jam_tidur' => '>6', 'kondisi_sakit' => false, 'minum_obat' => false, 'masalah_pribadi' => false,
        'pengaruh_alkohol' => false, 'siap_bekerja' => true,
    ]);
}

test('kartu profil menampilkan streak dan badge pengguna', function () {
    $user = User::factory()->create();
    bugarOn($user, today()->subDay()->toDateString());
    bugarOn($user, today()->toDateString());
    UserBadge::create(['user_id' => $user->id, 'badge_key' => 'first_bugar', 'earned_at' => now()->subDay()]);
    UserBadge::create(['user_id' => $user->id, 'badge_key' => 'first_laporan', 'earned_at' => now()]);

    $this->actingAs($user)
        ->get('/settings/profile')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('profile_stats.streak', 2)
            ->where('profile_stats.badges', [
                ['key' => 'first_bugar', 'nama' => 'Siap Bertugas', 'icon' => '🦺'],
                ['key' => 'first_laporan', 'nama' => 'Mata Pengawas', 'icon' => '🔍'],
            ]));
});

test('statistik profil tidak dikirim untuk admin atau di luar settings', function () {
    $this->actingAs(User::factory()->create(['is_admin' => true]))
        ->get('/settings/profile')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('profile_stats', null));

    $this->actingAs(User::factory()->create())
        ->get('/inbox')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('profile_stats', null));
});
