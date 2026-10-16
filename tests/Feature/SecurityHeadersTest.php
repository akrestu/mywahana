<?php

use App\Models\User;

test('setiap respons membawa header keamanan', function () {
    $this->get('/login')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()')
        ->assertHeaderMissing('Strict-Transport-Security');
});

test('HSTS hanya dikirim lewat HTTPS', function () {
    $this->get('https://localhost/login')
        ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

test('pesan validasi dan login tampil dalam bahasa Indonesia', function () {
    $this->actingAs(User::factory()->create(['participation_level' => 'staff']))
        ->post('/laporan-bahaya', [])
        ->assertSessionHasErrors(['lokasi' => 'Lokasi wajib diisi.']);

    auth()->logout();

    $this->post('/login', ['nik' => 'tidak-ada', 'password' => 'salah'])
        ->assertSessionHasErrors(['nik' => 'NIK atau password salah.']);
});
