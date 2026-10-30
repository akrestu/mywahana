<?php

use App\Models\BugarSelamat;
use App\Models\LaporanBahaya;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to the login page', function () {
    $user = User::factory()->create();
    $response = $this->get(route('app.home'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $response = $this
        ->actingAs($user)
        ->get(route('app.home'));

    $response->assertOk();
});

test('dashboard user tidak lagi memuat papan peringkat dan statistik lama', function () {
    $user = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);

    $this->actingAs($user)
        ->get(route('app.home'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->missing('leaderboard')
            ->missing('stats')
            ->missing('trend')
            ->has('my_pending_inspeksi', 4)
            ->where('my_pending_inspeksi.kantor', 0));
});

test('target bugar menyertakan tanggal yang terisi untuk kalender', function () {
    $user = User::factory()->create(['participation_level' => 'nonstaff']);
    BugarSelamat::create([
        'user_id' => $user->id, 'tanggal' => today()->toDateString(), 'shift' => 'Siang', 'hari_ke' => 1,
        'jam_tidur' => '>6', 'status_kelayakan' => 'layak',
    ]);

    $this->actingAs($user)
        ->get(route('app.home'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('target.bugar.tanggal_terisi', [today()->toDateString()])
            ->where('target.bugar.hari_terpenuhi', 1));
});

test('beranda menampilkan maksimal tiga item perlu tindakan dari inbox', function () {
    $pic = User::factory()->create();
    $reporter = User::factory()->create();
    foreach (range(1, 4) as $i) {
        LaporanBahaya::create([
            'user_id' => $reporter->id, 'site' => 'BAU', 'tanggal' => today()->toDateString(), 'lokasi' => "Pit {$i}",
            'deskripsi_bahaya' => 'Jalan licin', 'tindakan_perbaikan' => 'Pasang rambu',
            'probabilitas' => 1, 'frekuensi' => 1, 'severity' => 1, 'pic_user_id' => $pic->id, 'status_tindakan' => 'pending',
        ]);
    }

    $this->actingAs($pic)
        ->get(route('app.home'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('perlu_tindakan', 3)
            ->where('perlu_tindakan_total', 4));
});

test('bugar selamat terbaru membawa waktu pengisian untuk beranda', function () {
    $user = User::factory()->create(['participation_level' => 'nonstaff']);
    $filledAt = now()->setTime(6, 45)->startOfMinute();
    $this->travelTo($filledAt);
    BugarSelamat::create([
        'user_id' => $user->id, 'tanggal' => today()->toDateString(), 'shift' => 'Siang', 'hari_ke' => 1,
        'jam_tidur' => '>6', 'kondisi_sakit' => false, 'minum_obat' => false,
        'masalah_pribadi' => false, 'pengaruh_alkohol' => false, 'siap_bekerja' => true,
    ]);

    $this->actingAs($user)
        ->get(route('app.home'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('recent_bugar_selamat.0.created_at', fn ($at) => Carbon\Carbon::parse($at)->equalTo($filledAt)));
});
