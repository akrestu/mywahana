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

test('dashboard user hanya memuat papan peringkat site-nya', function () {
    App\Models\Site::create(['value' => 'BAU', 'label' => 'BAU']);
    App\Models\Site::create(['value' => 'MAS', 'label' => 'MAS']);
    $user = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);

    $this->actingAs($user)
        ->get(route('app.home'))
        ->assertInertia(fn (Inertia\Testing\AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('leaderboard', 1)
            ->has('leaderboard.BAU')
            ->missing('trend')
            ->has('my_pending_inspeksi', 4)
            ->where('my_pending_inspeksi.kantor', 0));
});

test('dashboard user tanpa site tidak memuat papan peringkat', function () {
    $user = User::factory()->create(['site' => null]);

    $this->actingAs($user)
        ->get(route('app.home'))
        ->assertInertia(fn (Inertia\Testing\AssertableInertia $page) => $page->where('leaderboard', []));
});
