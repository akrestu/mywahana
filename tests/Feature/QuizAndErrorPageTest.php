<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('quiz mengirim sisa waktu yang dihitung server', function () {
    $user = User::factory()->create(['departemen' => 'Production']);
    $session = inProgressSession($user, [1, 2]);
    $session->update(['started_at' => now()->subMinutes(10)]);

    $this->actingAs($user)
        ->get(route('assessment.quiz', $session))
        ->assertInertia(fn (Assert $page) => $page
            ->component('assessment/quiz')
            ->where('session.remaining_seconds', fn ($s) => $s > 34 * 60 && $s <= 35 * 60));
});

test('submit untuk sesi yang sudah dinilai diarahkan ke hasil, bukan 403', function () {
    $user = User::factory()->create(['departemen' => 'Production']);
    $session = completedSafetySession($user);

    $this->actingAs($user)
        ->post(route('assessment.submit', $session), ['answers' => []])
        ->assertRedirect(route('assessment.result', $session));
});

test('halaman error menampilkan pesan dari abort', function () {
    $user = User::factory()->create(['departemen' => null]);

    $this->actingAs($user)
        ->post(route('assessment.start'))
        ->assertForbidden()
        ->assertInertia(fn (Assert $page) => $page
            ->component('error')
            ->where('status', 403)
            ->where('message', 'Departemen belum diisi.'));
});

test('status 422 dari abort tampil sebagai halaman error', function () {
    $user = User::factory()->create(['departemen' => 'Production']);

    $this->actingAs($user)
        ->post(route('assessment.start'))
        ->assertStatus(422)
        ->assertInertia(fn (Assert $page) => $page
            ->component('error')
            ->where('status', 422)
            ->where('message', fn ($m) => str_contains($m, 'Belum ada soal')));
});
