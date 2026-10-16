<?php

use App\Models\User;

test('registration screen is not available', function () {
    $this->get('/register')->assertNotFound();
});

test('users cannot self-register', function () {
    $this->post('/register', [
        'name' => 'Test User',
        'nik' => '123456',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();

    $this->assertGuest();
    expect(User::where('email', 'test@example.com')->exists())->toBeFalse();
});
