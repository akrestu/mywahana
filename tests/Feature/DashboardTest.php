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
