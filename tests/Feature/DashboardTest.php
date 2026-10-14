<?php

use App\Models\User;

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
        ->assertInertia(fn (Inertia\Testing\AssertableInertia $page) => $page
            ->component('dashboard')
            ->missing('leaderboard')
            ->missing('stats')
            ->missing('trend')
            ->has('my_pending_inspeksi', 4)
            ->where('my_pending_inspeksi.kantor', 0));
});

test('target bugar menyertakan tanggal yang terisi untuk kalender', function () {
    $user = User::factory()->create(['participation_level' => 'nonstaff']);
    App\Models\BugarSelamat::create([
        'user_id' => $user->id, 'tanggal' => today()->toDateString(), 'shift' => 'Pagi', 'hari_ke' => 1,
        'jam_tidur' => '>6', 'status_kelayakan' => 'layak',
    ]);

    $this->actingAs($user)
        ->get(route('app.home'))
        ->assertInertia(fn (Inertia\Testing\AssertableInertia $page) => $page
            ->where('target.bugar.tanggal_terisi', [today()->toDateString()])
            ->where('target.bugar.hari_terpenuhi', 1));
});
