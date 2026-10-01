<?php

use App\Models\InspeksiKantor;
use App\Models\LaporanBahaya;
use App\Models\Site;
use App\Models\User;
use App\Rules\Signature;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

function laporanAt(string $site, array $attributes = []): LaporanBahaya
{
    return LaporanBahaya::create(array_merge([
        'user_id' => User::factory()->create(['site' => $site])->id,
        'site' => $site,
        'tanggal' => today()->toDateString(),
        'lokasi' => 'Pit 1',
        'deskripsi_bahaya' => 'Jalan licin',
        'tindakan_perbaikan' => 'Pasang rambu',
        'probabilitas' => 1,
        'frekuensi' => 1,
        'severity' => 1,
        'tingkat_risiko' => 'C',
    ], $attributes));
}

beforeEach(function () {
    Site::create(['value' => 'BAU', 'label' => 'PT. WBK Site BAU']);
    Site::create(['value' => 'MAS', 'label' => 'PT. WBK Site MAS']);
});

// ── Tanggal form tidak boleh di masa depan (backdate tetap boleh) ──────────

dataset('form tanggal', [
    'laporan bahaya' => ['/laporan-bahaya'],
    'observasi keselamatan' => ['/sap/observasi-keselamatan'],
    'komunikasi jsa' => ['/sap/komunikasi-jsa'],
    'inspeksi kantor' => ['/sap/inspeksi-kantor'],
    'inspeksi tambang' => ['/sap/inspeksi-tambang'],
    'inspeksi workshop' => ['/sap/inspeksi-workshop'],
    'inspeksi mess' => ['/sap/inspeksi-mess'],
]);

test('form menolak tanggal masa depan', function (string $url) {
    $user = User::factory()->create(['participation_level' => 'staff', 'site' => 'BAU']);

    $this->actingAs($user)
        ->post($url, ['tanggal' => today()->addDay()->toDateString()])
        ->assertSessionHasErrors(['tanggal' => 'Tanggal tidak boleh melebihi hari ini.']);
})->with('form tanggal');

test('form tetap menerima tanggal hari ini dan backdate', function (string $url) {
    $user = User::factory()->create(['participation_level' => 'staff', 'site' => 'BAU']);

    foreach ([today(), today()->subDays(30)] as $date) {
        $this->actingAs($user)
            ->post($url, ['tanggal' => $date->toDateString()])
            ->assertSessionDoesntHaveErrors('tanggal');
    }
})->with('form tanggal');

// ── Admin terikat site ─────────────────────────────────────────────────────

test('admin site tidak bisa menghapus data site lain', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);
    $own = laporanAt('BAU');
    $other = laporanAt('MAS');

    $this->actingAs($admin)->delete("/admin/laporan-bahaya/{$other->id}")->assertForbidden();
    $this->actingAs($admin)->delete("/admin/laporan-bahaya/{$own->id}")->assertRedirect();

    expect(LaporanBahaya::find($other->id))->not->toBeNull()
        ->and(LaporanBahaya::find($own->id))->toBeNull();
});

test('batch delete admin site hanya menghapus data site-nya', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);
    $own = laporanAt('BAU');
    $other = laporanAt('MAS');

    $this->actingAs($admin)
        ->delete('/admin/laporan-bahaya/batch', ['ids' => [$own->id, $other->id]])
        ->assertRedirect();

    expect(LaporanBahaya::pluck('id')->all())->toBe([$other->id]);
});

test('admin site tidak bisa mengubah status laporan site lain', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);
    $other = laporanAt('MAS');

    $this->actingAs($admin)
        ->patch("/admin/laporan-bahaya/{$other->id}/status", ['status_tindakan' => 'close'])
        ->assertForbidden();
});

test('ringkasan inspeksi hanya menghitung site admin', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);
    $make = fn (string $label) => InspeksiKantor::forceCreate([
        'user_id' => User::factory()->create()->id,
        'tanggal' => today(), 'project_site' => $label, 'departemen' => 'HSE', 'status' => 'selesai',
    ]);
    $make('PT. WBK Site BAU');
    $make('PT. WBK Site MAS');

    $this->actingAs($admin)
        ->get('/admin/inspeksi-kantor')
        ->assertInertia(fn ($page) => $page
            ->where('summary.total', 1)
            ->has('records.data', 1));
});

test('hapus per rentang memakai tanggal submit', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => null, 'password' => 'password']);
    $backdated = laporanAt('BAU', ['tanggal' => '2026-09-01']);
    $backdated->forceFill(['created_at' => Carbon::parse('2026-10-01 10:00')])->saveQuietly();
    $oldSubmit = laporanAt('BAU', ['tanggal' => '2026-10-01']);
    $oldSubmit->forceFill(['created_at' => Carbon::parse('2026-09-20 10:00')])->saveQuietly();

    $this->actingAs($admin)->post('/admin/laporan-bahaya/delete-range', [
        'date_from' => '2026-10-01', 'date_to' => '2026-10-01', 'password' => 'password',
    ])->assertRedirect();

    expect(LaporanBahaya::pluck('id')->all())->toBe([$oldSubmit->id]);
});

test('menghapus laporan ikut menghapus file fotonya', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['is_admin' => true, 'site' => null]);
    $path = UploadedFile::fake()->image('bahaya.jpg')->store('laporan-bahaya', 'public');
    $laporan = laporanAt('BAU', ['foto_path' => $path]);

    $this->actingAs($admin)->delete("/admin/laporan-bahaya/{$laporan->id}");

    Storage::disk('public')->assertMissing($path);
});

// ── Review laporan & tanda tangan ──────────────────────────────────────────

test('laporan yang sudah close tidak bisa direview ulang', function () {
    $pic = User::factory()->create(['participation_level' => 'staff']);
    $laporan = laporanAt('BAU', ['pic_user_id' => $pic->id, 'status_tindakan' => 'close']);

    $this->actingAs($pic)
        ->post("/laporan-bahaya/{$laporan->id}/review", ['status_tindakan' => 'progress'])
        ->assertForbidden();
});

test('tanda tangan harus data URL gambar dengan ukuran wajar', function (mixed $value, bool $valid) {
    $v = Validator::make(['ttd' => $value], ['ttd' => [new Signature]]);

    expect($v->passes())->toBe($valid);
})->with([
    'png valid' => ['data:image/png;base64,iVBORw0KGgo=', true],
    'bukan gambar' => ['<script>alert(1)</script>', false],
    'tipe lain' => ['data:text/html;base64,PGh0bWw+', false],
    'terlalu besar' => ['data:image/png;base64,'.str_repeat('A', Signature::MAX_LENGTH), false],
]);
