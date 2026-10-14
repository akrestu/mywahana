<?php

use App\Models\InspeksiKantor;
use App\Models\InspeksiMess;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('halaman gabungan menampilkan inspeksi semua jenis milik user', function () {
    $user = User::factory()->create(['participation_level' => 'staff']);
    $ri = User::factory()->create(['participation_level' => 'staff']);
    $other = User::factory()->create(['participation_level' => 'staff']);

    InspeksiKantor::forceCreate([
        'user_id' => $user->id, 'tanggal' => '2026-10-01', 'project_site' => 'BAU',
        'departemen' => 'HSE', 'status' => 'selesai', 're_inspektor_id' => $ri->id,
    ]);
    InspeksiMess::forceCreate([
        'user_id' => $user->id, 'tanggal' => '2026-10-05', 'project_site' => 'BAU',
        'lokasi' => 'Mess A', 'status' => 'menunggu_re_inspeksi', 're_inspektor_id' => $ri->id,
    ]);
    InspeksiKantor::forceCreate([
        'user_id' => $other->id, 'tanggal' => '2026-10-03', 'project_site' => 'BAU',
        'departemen' => 'HSE', 'status' => 'selesai', 're_inspektor_id' => $ri->id,
    ]);

    $this->actingAs($user)
        ->get('/sap/inspeksi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('sap/inspeksi/index')
            ->has('myRecords.data', 2)
            ->where('myRecords.data.0.jenis', 'mess')
            ->where('myRecords.data.0.keterangan', 'Mess A')
            ->where('myRecords.data.0.re_inspektor.name', $ri->name)
            ->where('myRecords.data.1.jenis', 'kantor')
            ->has('pendingReInspeksi.data', 0));

    $this->actingAs($ri)
        ->get('/sap/inspeksi')
        ->assertInertia(fn (Assert $page) => $page
            ->has('pendingReInspeksi.data', 1)
            ->where('pendingReInspeksi.data.0.user.name', $user->name)
            ->has('selesaiAsRI.data', 2));
});

test('halaman gabungan hanya untuk staff', function () {
    $this->actingAs(User::factory()->create(['participation_level' => 'nonstaff']))
        ->get('/sap/inspeksi')
        ->assertRedirect();
});
