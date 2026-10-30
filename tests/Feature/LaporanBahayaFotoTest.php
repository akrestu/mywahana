<?php

use App\Models\LaporanBahaya;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    Storage::fake('public');
    Site::create(['value' => 'BAU', 'label' => 'PT. WBK Site BAU', 'locations' => ['Pit 1']]);
});

function laporanPayload(User $pic, array $overrides = []): array
{
    return array_merge([
        'site' => 'BAU',
        'tanggal' => today()->toDateString(),
        'waktu_pengamatan' => '07:15',
        'shift' => 'siang',
        'kategori' => 'KTA',
        'klasifikasi_bahaya' => 'Kondisi lingkungan yang berbahaya',
        'lokasi' => 'Pit 1',
        'deskripsi_bahaya' => 'Jalan berlubang',
        'tindakan_perbaikan' => 'Pasang rambu',
        'probabilitas' => 3,
        'frekuensi' => 4,
        'severity' => 2,
        'status_tindakan' => 'pending',
        'pic_user_id' => $pic->id,
    ], $overrides);
}

test('laporan bahaya menyimpan dua foto dan membuka layar terkirim', function () {
    $reporter = User::factory()->create(['site' => 'BAU']);
    $pic = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);

    $response = $this->actingAs($reporter)->post('/laporan-bahaya', laporanPayload($pic, [
        'foto' => UploadedFile::fake()->image('a.jpg'),
        'foto_2' => UploadedFile::fake()->image('b.jpg'),
    ]));

    $record = LaporanBahaya::sole();
    $response->assertRedirect(route('laporan-bahaya.show', [$record, 'terkirim' => 1]));
    expect($record->fotoPaths())->toHaveCount(2);
    Storage::disk('public')->assertExists($record->fotoPaths());

    $this->actingAs($reporter)
        ->get(route('laporan-bahaya.show', [$record, 'terkirim' => 1]))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('terkirim', true)
            ->has('fotoUrls', 2));
});

test('foto kedua saja tetap tersimpan di slot pertama', function () {
    $reporter = User::factory()->create(['site' => 'BAU']);
    $pic = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);

    $this->actingAs($reporter)->post('/laporan-bahaya', laporanPayload($pic, [
        'foto_2' => UploadedFile::fake()->image('b.jpg'),
    ]));

    $record = LaporanBahaya::sole();
    expect($record->foto_path)->not->toBeNull()
        ->and($record->foto_path_2)->toBeNull()
        ->and($record->shift)->toBe('siang');
});

test('laporan bahaya tanpa foto ditolak', function () {
    $reporter = User::factory()->create(['site' => 'BAU']);
    $pic = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);

    $this->actingAs($reporter)
        ->post('/laporan-bahaya', laporanPayload($pic))
        ->assertSessionHasErrors('foto');

    expect(LaporanBahaya::count())->toBe(0);
});

test('laporan bahaya wajib mencatat shift siang atau malam', function (?string $shift) {
    $reporter = User::factory()->create(['site' => 'BAU']);
    $pic = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);

    $this->actingAs($reporter)
        ->post('/laporan-bahaya', laporanPayload($pic, [
            'shift' => $shift,
            'foto' => UploadedFile::fake()->image('a.jpg'),
        ]))
        ->assertSessionHasErrors('shift');

    expect(LaporanBahaya::count())->toBe(0);
})->with([null, 'pagi']);

test('pic tidak melihat layar terkirim', function () {
    $reporter = User::factory()->create(['site' => 'BAU']);
    $pic = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);
    $this->actingAs($reporter)->post('/laporan-bahaya', laporanPayload($pic, [
        'foto' => UploadedFile::fake()->image('a.jpg'),
    ]));

    $this->actingAs($pic)
        ->get(route('laporan-bahaya.show', [LaporanBahaya::sole(), 'terkirim' => 1]))
        ->assertInertia(fn (AssertableInertia $page) => $page->where('terkirim', false));
});
