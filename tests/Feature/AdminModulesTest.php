<?php

use App\Models\AssessmentSession;
use App\Models\BugarSelamat;
use App\Models\HrAssessmentSession;
use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\InspeksiTambang;
use App\Models\InspeksiWorkshop;
use App\Models\KomunikasiJsa;
use App\Models\LaporanBahaya;
use App\Models\ObservasiKeselamatan;
use App\Models\ParticipationTarget;
use App\Models\Site;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    Site::create(['value' => 'BAU', 'label' => 'PT. WBK Site BAU']);
    Site::create(['value' => 'MAS', 'label' => 'PT. WBK Site MAS']);
});

function adminFor(?string $site = null): User
{
    return User::factory()->create(['is_admin' => true, 'site' => $site]);
}

/**
 * Buat satu record modul admin di site tertentu.
 */
function adminRecord(string $module, string $site): Model
{
    $user = User::factory()->create(['site' => $site]);
    $label = Site::where('value', $site)->value('label');
    $base = ['user_id' => $user->id, 'tanggal' => today()->toDateString()];
    $inspeksi = $base + ['project_site' => $label, 'status' => 'menunggu_re_inspeksi'];

    return match ($module) {
        'bugar-selamat' => BugarSelamat::forceCreate($base + [
            'shift' => 'Siang', 'hari_ke' => 1, 'jam_tidur' => '>6', 'kondisi_sakit' => false,
            'minum_obat' => false, 'masalah_pribadi' => false, 'pengaruh_alkohol' => false, 'siap_bekerja' => true,
        ]),
        'laporan-bahaya' => LaporanBahaya::forceCreate($base + [
            'site' => $site, 'lokasi' => 'Pit 1', 'deskripsi_bahaya' => 'Jalan licin', 'tindakan_perbaikan' => 'Rambu',
            'probabilitas' => 1, 'frekuensi' => 1, 'severity' => 1, 'tingkat_risiko' => 'C', 'status_tindakan' => 'pending',
        ]),
        'observasi-keselamatan' => ObservasiKeselamatan::forceCreate($base + [
            'site' => $site, 'jenis_pekerjaan' => 'Hauling', 'lokasi_kerja' => 'Pit 1', 'status' => 'menunggu_konfirmasi',
        ]),
        'komunikasi-jsa' => KomunikasiJsa::forceCreate($base + [
            'site' => $site, 'lokasi' => 'Pit 1', 'shift' => 'siang', 'durasi' => 10, 'kegiatan' => 'Briefing',
            'judul_dokumen' => 'JSA Hauling', 'peserta' => [], 'foto_kelompok' => 'x.jpg', 'foto_dokumen' => 'y.jpg',
            'status' => 'menunggu_konfirmasi',
        ]),
        'inspeksi-kantor' => InspeksiKantor::forceCreate($inspeksi + ['departemen' => 'HSE']),
        'inspeksi-tambang' => InspeksiTambang::forceCreate($inspeksi + ['departemen' => 'HSE']),
        'inspeksi-workshop' => InspeksiWorkshop::forceCreate($inspeksi + ['departemen' => 'HSE']),
        'inspeksi-mess' => InspeksiMess::forceCreate($inspeksi + ['lokasi' => 'Mess A']),
    };
}

dataset('admin modules', [
    'bugar selamat' => ['bugar-selamat', 'admin/bugar-selamat'],
    'laporan bahaya' => ['laporan-bahaya', 'admin/laporan-bahaya'],
    'observasi keselamatan' => ['observasi-keselamatan', 'admin/observasi-keselamatan'],
    'komunikasi jsa' => ['komunikasi-jsa', 'admin/komunikasi-jsa'],
    'inspeksi kantor' => ['inspeksi-kantor', 'admin/inspeksi-kantor'],
    'inspeksi tambang' => ['inspeksi-tambang', 'admin/inspeksi-tambang'],
    'inspeksi workshop' => ['inspeksi-workshop', 'admin/inspeksi-workshop'],
    'inspeksi mess' => ['inspeksi-mess', 'admin/inspeksi-mess'],
]);

test('admin site hanya melihat ringkasan site-nya', function (string $module, string $component) {
    adminRecord($module, 'BAU');
    adminRecord($module, 'MAS');
    $query = $module === 'bugar-selamat' ? '?view=daftar' : '';

    $this->actingAs(adminFor('BAU'))
        ->get("/admin/{$module}{$query}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component($component)
            ->where('admin_site', 'BAU')
            ->where('summary.total', 1)
            ->has('records.data', 1));

    $this->actingAs(adminFor())
        ->get("/admin/{$module}{$query}")
        ->assertInertia(fn (AssertableInertia $page) => $page->where('summary.total', 2));
})->with('admin modules');

test('admin dapat mengekspor data modul', function (string $module) {
    adminRecord($module, 'BAU');

    $this->actingAs(adminFor())
        ->get("/admin/{$module}/export")
        ->assertOk()
        ->assertDownload();
})->with('admin modules');

test('admin site tidak dapat menghapus data site lain', function (string $module) {
    $own = adminRecord($module, 'BAU');
    $other = adminRecord($module, 'MAS');
    $admin = adminFor('BAU');

    $this->actingAs($admin)->delete("/admin/{$module}/{$other->id}")->assertForbidden();
    $this->actingAs($admin)->delete("/admin/{$module}/{$own->id}")->assertRedirect();

    expect($own::find($own->id))->toBeNull()
        ->and($other::find($other->id))->not->toBeNull();
})->with('admin modules');

test('hapus batch hanya mengenai data site admin', function (string $module) {
    $own = adminRecord($module, 'BAU');
    $other = adminRecord($module, 'MAS');

    $this->actingAs(adminFor('BAU'))
        ->delete("/admin/{$module}/batch", ['ids' => [$own->id, $other->id]])
        ->assertRedirect();

    expect($own::find($own->id))->toBeNull()
        ->and($other::find($other->id))->not->toBeNull();
})->with('admin modules');

test('hapus per rentang tanggal butuh password dan menghormati site', function (string $module) {
    $own = adminRecord($module, 'BAU');
    $other = adminRecord($module, 'MAS');
    $admin = adminFor('BAU');
    $range = ['date_from' => today()->subDay()->toDateString(), 'date_to' => today()->toDateString()];

    $this->actingAs($admin)
        ->post("/admin/{$module}/delete-range", $range + ['password' => 'salah'])
        ->assertSessionHasErrors('password');
    expect($own::find($own->id))->not->toBeNull();

    $this->actingAs($admin)
        ->post("/admin/{$module}/delete-range", $range + ['password' => 'password'])
        ->assertSessionHasNoErrors();

    expect($own::find($own->id))->toBeNull()
        ->and($other::find($other->id))->not->toBeNull();
})->with('admin modules');

test('bugar selamat harian dan kalender dapat dibuka', function (string $view) {
    adminRecord('bugar-selamat', 'BAU');

    $this->actingAs(adminFor())
        ->get("/admin/bugar-selamat?view={$view}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/bugar-selamat')
            ->where('view', $view)
            ->has('users', 1));
})->with(['harian', 'kalender']);

test('admin dapat memperbarui status dan PIC laporan bahaya', function () {
    $laporan = adminRecord('laporan-bahaya', 'BAU');
    $pic = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);
    $outsider = User::factory()->create(['site' => 'MAS', 'participation_level' => 'staff']);
    $admin = adminFor('BAU');

    $this->actingAs($admin)
        ->patch("/admin/laporan-bahaya/{$laporan->id}/status", ['status_tindakan' => 'progress', 'pic_user_id' => $outsider->id])
        ->assertSessionHasErrors('pic_user_id');

    $this->actingAs($admin)
        ->patch("/admin/laporan-bahaya/{$laporan->id}/status", ['status_tindakan' => 'progress', 'pic_user_id' => $pic->id])
        ->assertSessionHasNoErrors();

    expect($laporan->fresh())
        ->status_tindakan->toBe('progress')
        ->pic_user_id->toBe($pic->id);

    $this->actingAs(adminFor('MAS'))
        ->patch("/admin/laporan-bahaya/{$laporan->id}/status", ['status_tindakan' => 'close'])
        ->assertForbidden();
});

test('admin dapat melihat dan mengubah target partisipasi', function () {
    $admin = adminFor();

    $this->actingAs($admin)
        ->get('/admin/targets')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('admin/targets')->has('targets'));

    $this->actingAs($admin)
        ->patch('/admin/targets/staff', [
            'laporan_per_minggu' => 3, 'inspeksi_per_minggu' => 2, 'observasi_per_minggu' => 1, 'bugar_per_hari' => 1,
        ])
        ->assertRedirect();

    expect(ParticipationTarget::where('level', 'staff')->first())
        ->laporan_per_minggu->toBe(3)
        ->updated_by->toBe($admin->id);
});

test('halaman dan export assessment dapat dibuka admin', function (string $path, string $component, string $sessionClass) {
    $user = User::factory()->create(['site' => 'BAU', 'departemen' => 'Production']);
    $sessionClass::forceCreate(array_merge([
        'user_id' => $user->id, 'status' => 'completed', 'total_questions' => 10, 'score' => 9,
        'percentage' => 90, 'passed' => true, 'started_at' => now()->subMinutes(10), 'completed_at' => now(),
    ], $sessionClass === AssessmentSession::class ? ['departemen' => 'Production', 'tags' => 'S'] : []));
    $admin = adminFor();

    $this->actingAs($admin)
        ->get("/admin/{$path}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component($component)
            ->where('summary.total', 1)
            ->has('records.data', 1)
            ->has('attendance_summary'));

    $this->actingAs($admin)->get("/admin/{$path}/export")->assertOk()->assertDownload();
    $this->actingAs($admin)->get("/admin/{$path}/export-soal")->assertOk()->assertDownload();
})->with([
    'safety' => ['assessment', 'admin/assessment', AssessmentSession::class],
    'hr' => ['hr-assessment', 'admin/hr-assessment', HrAssessmentSession::class],
]);

test('admin hanya dapat menghapus sesi HR assessment di site-nya', function () {
    $session = fn (string $site) => HrAssessmentSession::forceCreate([
        'user_id' => User::factory()->create(['site' => $site])->id, 'status' => 'completed',
        'total_questions' => 10, 'started_at' => now(), 'completed_at' => now(), 'passed' => true,
    ]);
    $own = $session('BAU');
    $other = $session('MAS');
    $admin = adminFor('BAU');

    $this->actingAs($admin)->delete("/admin/hr-assessment/{$other->id}")->assertForbidden();
    $this->actingAs($admin)->delete('/admin/hr-assessment/batch', ['ids' => [$own->id, $other->id]])->assertRedirect();

    expect(HrAssessmentSession::find($own->id))->toBeNull()
        ->and(HrAssessmentSession::find($other->id))->not->toBeNull();
});

test('export absensi induksi hanya menerima tipe yang dikenal', function () {
    $admin = adminFor();

    $this->actingAs($admin)->get('/admin/induction-attendance/export/safety')->assertOk()->assertDownload();
    $this->actingAs($admin)->get('/admin/induction-attendance/export/hr')->assertOk()->assertDownload();
    $this->actingAs($admin)->get('/admin/induction-attendance/export/lain')->assertNotFound();
});

test('halaman admin tertutup untuk non-admin', function () {
    $this->actingAs(User::factory()->create(['site' => 'BAU']))
        ->get('/admin/laporan-bahaya')
        ->assertRedirect();
});

test('index admin mengarah ke beranda', function () {
    $this->actingAs(adminFor())->get('/admin')->assertRedirect(route('app.home'));
});
