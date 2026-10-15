<?php

use App\Models\ObservasiKeselamatan;
use App\Models\Site;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    Site::create(['value' => 'BAU', 'label' => 'PT. WBK Site BAU', 'locations' => ['Pit 1']]);
});

function observasiPayload(array $overrides = []): array
{
    return array_merge([
        'site' => 'BAU',
        'tanggal' => today()->toDateString(),
        'jenis_pekerjaan' => 'Pengisian bahan bakar',
        'lokasi_kerja' => 'Pit 1',
    ], $overrides);
}

test('observasi keselamatan opens the submitted screen after saving', function () {
    $observer = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);

    $response = $this->actingAs($observer)->post('/sap/observasi-keselamatan', observasiPayload());

    $record = ObservasiKeselamatan::sole();
    $response->assertRedirect(route('sap.observasi-keselamatan.show', [$record, 'terkirim' => 1]));

    $this->actingAs($observer)
        ->get(route('sap.observasi-keselamatan.show', [$record, 'terkirim' => 1]))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sap/observasi-keselamatan/show')
            ->where('terkirim', true));
});

test('submitted screen is only shown to the observer', function () {
    $observer = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);
    $admin = User::factory()->create(['is_admin' => true, 'participation_level' => 'staff']);
    $this->actingAs($observer)->post('/sap/observasi-keselamatan', observasiPayload());
    $record = ObservasiKeselamatan::sole();

    $this->actingAs($admin)
        ->get(route('sap.observasi-keselamatan.show', [$record, 'terkirim' => 1]))
        ->assertInertia(fn (AssertableInertia $page) => $page->where('terkirim', false));
});
