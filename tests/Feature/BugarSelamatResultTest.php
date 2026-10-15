<?php

use App\Models\BugarSelamat;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function bugarPayload(array $overrides = []): array
{
    return array_merge([
        'tanggal' => today()->toDateString(),
        'shift' => 'Siang',
        'hari_ke' => 3,
        'jam_tidur' => '>6',
        'kondisi_sakit' => '0',
        'minum_obat' => '0',
        'masalah_pribadi' => '0',
        'pengaruh_alkohol' => '0',
        'siap_bekerja' => '1',
        'catatan' => '',
    ], $overrides);
}

test('submitting bugar selamat opens the result screen', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/bugar-selamat', bugarPayload(['jam_tidur' => '5-6']));

    $record = BugarSelamat::where('user_id', $user->id)->sole();
    $response->assertRedirect(route('bugar-selamat.show', [$record, 'hasil' => 1]));
    expect($record->status_kelayakan)->toBe('catatan');

    $this->actingAs($user)
        ->get(route('bugar-selamat.show', [$record, 'hasil' => 1]))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('bugar-selamat/show')
            ->where('hasil', true));
});

test('result screen is only shown to the owner', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create(['is_admin' => true]);
    $this->actingAs($owner)->post('/bugar-selamat', bugarPayload());
    $record = BugarSelamat::where('user_id', $owner->id)->sole();

    $this->actingAs($admin)
        ->get(route('bugar-selamat.show', [$record, 'hasil' => 1]))
        ->assertInertia(fn (AssertableInertia $page) => $page->where('hasil', false));
});
