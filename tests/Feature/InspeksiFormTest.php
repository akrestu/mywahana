<?php

use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\Site;
use App\Models\User;
use App\Notifications\InspeksiKantorDibuat;
use App\Notifications\InspeksiMessDibuat;
use App\Notifications\InspeksiTambangDibuat;
use App\Notifications\InspeksiWorkshopDibuat;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

const TTD = 'data:image/png;base64,iVBORw0KGgo=';

beforeEach(function () {
    Site::create(['value' => 'BAU', 'label' => 'PT. WBK Site BAU']);
    Site::create(['value' => 'MAS', 'label' => 'PT. WBK Site MAS']);
});

dataset('jenis inspeksi', [
    'kantor' => ['kantor', InspeksiKantor::class, InspeksiKantorDibuat::class, ['departemen' => 'HSE']],
    'tambang' => ['tambang', InspeksiTambang::class, InspeksiTambangDibuat::class, ['departemen' => 'HSE', 'lokasi' => 'Pit 2']],
    'workshop' => ['workshop', InspeksiWorkshop::class, InspeksiWorkshopDibuat::class, ['departemen' => 'Plant']],
    'mess' => ['mess', InspeksiMess::class, InspeksiMessDibuat::class, ['lokasi' => 'Mess A']],
]);

function inspeksiStaff(string $site = 'BAU'): User
{
    return User::factory()->create(['participation_level' => 'staff', 'site' => $site]);
}

function inspeksiPayload(string $model, array $extra, array $overrides = []): array
{
    $keys = $model::$scoreKeys;

    return array_merge([
        'tanggal' => today()->toDateString(),
        'project_site' => 'PT. WBK Site BAU',
        $keys[0] => 4,
        $keys[1] => 2,
    ], $extra, $overrides);
}

test('form inspeksi dapat dibuka staff', function (string $slug) {
    inspeksiStaff();

    $this->actingAs(inspeksiStaff())
        ->get("/sap/inspeksi-{$slug}/create")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component("sap/inspeksi-{$slug}/create")
            ->has('staffUsers', 1)
            ->has('sites', 1)
            ->has('user'));
})->with('jenis inspeksi');

test('inspeksi tersimpan dengan skor, foto, peserta, dan notifikasi', function (string $slug, string $model, string $notification, array $extra) {
    Storage::fake('public');
    Notification::fake();
    $inspektor = inspeksiStaff();
    $reInspektor = inspeksiStaff();
    $peserta = inspeksiStaff();

    $response = $this->actingAs($inspektor)->post("/sap/inspeksi-{$slug}", inspeksiPayload($model, $extra, [
        're_inspektor_id' => $reInspektor->id,
        'peserta_ids' => [$peserta->id],
        'foto' => ['temuan_1' => UploadedFile::fake()->image('temuan.jpg')],
        'ttd_inspektor' => TTD,
    ]));

    $record = $model::sole();
    $response->assertRedirect(route("sap.inspeksi-{$slug}.show", [$record, 'terkirim' => 1]));

    $max = count($model::$scoreKeys) * 4;
    expect($record)
        ->user_id->toBe($inspektor->id)
        ->status->toBe('menunggu_re_inspeksi')
        ->total_poin->toEqual(6)
        ->max_poin->toEqual($max)
        ->persentase->toEqual(round(6 / $max * 100, 1))
        ->risk_level->toBe('VH')
        ->and($record->peserta->pluck('id')->all())->toBe([$peserta->id])
        ->and($record->foto_items)->toHaveKey('temuan_1');

    expect($record->foto_items['temuan_1'])->toStartWith("inspeksi/{$slug}/{$record->id}/");
    Storage::disk('public')->assertExists($record->foto_items['temuan_1']);

    Notification::assertSentTo($reInspektor, $notification);
    Notification::assertSentTo($peserta, $notification);
})->with('jenis inspeksi');

test('inspeksi tanpa re-inspektor langsung selesai', function (string $slug, string $model, string $notification, array $extra) {
    $this->actingAs(inspeksiStaff())
        ->post("/sap/inspeksi-{$slug}", inspeksiPayload($model, $extra))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($model::sole()->status)->toBe('selesai');
})->with('jenis inspeksi');

test('inspeksi menolak site dan petugas di luar site pelapor', function (string $slug, string $model, string $notification, array $extra) {
    $inspektor = inspeksiStaff();

    $this->actingAs($inspektor)
        ->post("/sap/inspeksi-{$slug}", inspeksiPayload($model, $extra, ['project_site' => 'PT. WBK Site MAS']))
        ->assertForbidden();

    $this->actingAs($inspektor)
        ->post("/sap/inspeksi-{$slug}", inspeksiPayload($model, $extra, ['re_inspektor_id' => inspeksiStaff('MAS')->id]))
        ->assertForbidden();

    expect($model::count())->toBe(0);
})->with('jenis inspeksi');

test('detail dan PDF inspeksi hanya untuk pihak terkait', function (string $slug, string $model, string $notification, array $extra) {
    Notification::fake();
    $inspektor = inspeksiStaff();
    $peserta = inspeksiStaff();
    $this->actingAs($inspektor)->post("/sap/inspeksi-{$slug}", inspeksiPayload($model, $extra, ['peserta_ids' => [$peserta->id]]));
    $record = $model::sole();

    $this->actingAs(inspeksiStaff())->get("/sap/inspeksi-{$slug}/{$record->id}")->assertForbidden();
    $this->actingAs(inspeksiStaff())->get("/sap/inspeksi-{$slug}/{$record->id}/pdf")->assertForbidden();

    $this->actingAs($peserta)
        ->get("/sap/inspeksi-{$slug}/{$record->id}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component("sap/inspeksi-{$slug}/show")
            ->where('record.id', $record->id)
            ->where('is_ri', false)
            ->where('terkirim', false));

    $this->actingAs($inspektor)
        ->get("/sap/inspeksi-{$slug}/{$record->id}?terkirim=1")
        ->assertInertia(fn (AssertableInertia $page) => $page->where('terkirim', true));

    $this->actingAs($inspektor)
        ->get("/sap/inspeksi-{$slug}/{$record->id}/pdf")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
})->with('jenis inspeksi');

test('re-inspektor dapat mengonfirmasi inspeksi', function (string $slug, string $model, string $notification, array $extra) {
    Notification::fake();
    $reInspektor = inspeksiStaff();
    $this->actingAs(inspeksiStaff())->post("/sap/inspeksi-{$slug}", inspeksiPayload($model, $extra, ['re_inspektor_id' => $reInspektor->id]));
    $record = $model::sole();

    $this->actingAs(inspeksiStaff())->get("/sap/inspeksi-{$slug}/{$record->id}/re-inspeksi")->assertForbidden();

    $this->actingAs($reInspektor)
        ->get("/sap/inspeksi-{$slug}/{$record->id}/re-inspeksi")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component("sap/inspeksi-{$slug}/re-inspeksi"));

    $this->actingAs($reInspektor)
        ->get("/sap/inspeksi-{$slug}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component("sap/inspeksi-{$slug}/index")
            ->has('pendingReInspeksi.data', 1));

    $this->actingAs($reInspektor)
        ->post("/sap/inspeksi-{$slug}/{$record->id}/re-inspeksi", ['ttd_re_inspektor' => TTD])
        ->assertRedirect(route("sap.inspeksi-{$slug}.index"));

    expect($record->fresh())
        ->status->toBe('selesai')
        ->re_inspeksi_at->not->toBeNull();

    $this->actingAs($reInspektor)
        ->post("/sap/inspeksi-{$slug}/{$record->id}/re-inspeksi", ['ttd_re_inspektor' => TTD])
        ->assertForbidden();

    $this->actingAs($reInspektor)
        ->get("/sap/inspeksi-{$slug}/{$record->id}/re-inspeksi")
        ->assertRedirect(route("sap.inspeksi-{$slug}.show", $record));
})->with('jenis inspeksi');

test('re-inspektor dapat menolak inspeksi dengan alasan', function (string $slug, string $model, string $notification, array $extra) {
    Notification::fake();
    $reInspektor = inspeksiStaff();
    $this->actingAs(inspeksiStaff())->post("/sap/inspeksi-{$slug}", inspeksiPayload($model, $extra, ['re_inspektor_id' => $reInspektor->id]));
    $record = $model::sole();

    $this->actingAs($reInspektor)
        ->post("/sap/inspeksi-{$slug}/{$record->id}/tolak", [])
        ->assertSessionHasErrors('alasan');

    $this->actingAs($reInspektor)
        ->post("/sap/inspeksi-{$slug}/{$record->id}/tolak", ['alasan' => 'Data tidak sesuai'])
        ->assertRedirect(route("sap.inspeksi-{$slug}.index"));

    expect($record->fresh())
        ->status->toBe('ditolak')
        ->tolak_alasan->toBe('Data tidak sesuai');
})->with('jenis inspeksi');
