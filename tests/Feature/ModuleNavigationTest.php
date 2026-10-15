<?php

use App\Models\InspeksiMess;
use App\Models\LaporanBahaya;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function laporanWithPic(User $reporter, User $pic, string $status = 'pending'): LaporanBahaya
{
    return LaporanBahaya::create([
        'user_id' => $reporter->id,
        'site' => 'BAU',
        'tanggal' => today()->toDateString(),
        'lokasi' => 'Pit 1',
        'deskripsi_bahaya' => 'Jalan licin',
        'tindakan_perbaikan' => 'Pasang rambu',
        'probabilitas' => 1,
        'frekuensi' => 1,
        'severity' => 1,
        'pic_user_id' => $pic->id,
        'status_tindakan' => $status,
    ]);
}

test('guests cannot open the module, inbox or k3 pages', function (string $route) {
    $this->get(route($route))->assertRedirect(route('login'));
})->with(['modules.index', 'inbox.index', 'k3.index']);

test('module launcher shows the k3 approval count', function () {
    $pic = User::factory()->create(['participation_level' => 'nonstaff']);
    laporanWithPic(User::factory()->create(), $pic);

    $this->actingAs($pic)
        ->get(route('modules.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('modules/index')
            ->where('counts.k3', 1)
            ->where('inbox_count', 1));
});

test('inbox lists items for the approver and the submitter', function () {
    $submitter = User::factory()->create(['participation_level' => 'staff']);
    $reInspektor = User::factory()->create(['participation_level' => 'staff']);
    $inspeksi = InspeksiMess::forceCreate([
        'user_id' => $submitter->id, 'tanggal' => today()->toDateString(), 'project_site' => 'BAU',
        'lokasi' => 'Mess A', 'status' => 'menunggu_re_inspeksi', 're_inspektor_id' => $reInspektor->id,
    ]);

    $this->actingAs($reInspektor)
        ->get(route('inbox.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('inbox/index')
            ->has('for_me', 1)
            ->where('for_me.0.title', 'Inspeksi Mess · Mess A')
            ->where('for_me.0.action_url', route('sap.inspeksi-mess.re-inspeksi', $inspeksi->id))
            ->where('for_me.0.reject_url', route('sap.inspeksi-mess.tolak', $inspeksi->id))
            ->has('submitted', 0));

    $this->actingAs($submitter)
        ->get(route('inbox.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('for_me', 0)
            ->has('submitted', 1)
            ->where('submitted.0.action_url', null));
});

test('closed hazard reports leave the inbox and move to done', function () {
    $reporter = User::factory()->create();
    $pic = User::factory()->create();
    laporanWithPic($reporter, $pic, 'close');

    $this->actingAs($pic)
        ->get(route('inbox.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page->has('for_me', 0));

    $this->actingAs($reporter)
        ->get(route('inbox.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('submitted', 0)
            ->loadDeferredProps(fn (AssertableInertia $reload) => $reload->has('done', 1)));
});

test('k3 hub reports bugar status and staff-only sections', function () {
    $nonstaff = User::factory()->create(['participation_level' => 'nonstaff']);
    $staff = User::factory()->create(['participation_level' => 'staff']);

    $this->actingAs($nonstaff)
        ->get(route('k3.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('k3/index')
            ->where('is_staff', false)
            ->where('bugar_hari_ini', false)
            ->where('inspeksi', null)
            ->has('target.bugar'));

    $this->actingAs($staff)
        ->get(route('k3.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('is_staff', true)
            ->has('inspeksi', 4));
});
