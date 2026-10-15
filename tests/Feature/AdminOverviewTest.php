<?php

use App\Models\BugarSelamat;
use App\Models\LaporanBahaya;
use App\Models\Site;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('admin overview summarises bugar, risk and sites for the month', function () {
    Site::create(['value' => 'BAU', 'label' => 'Site BAU']);
    $admin = User::factory()->create(['is_admin' => true, 'site' => null]);
    $worker = User::factory()->create(['site' => 'BAU']);

    BugarSelamat::create([
        'user_id' => $worker->id, 'tanggal' => today()->toDateString(), 'shift' => 'Siang', 'hari_ke' => 1,
        'jam_tidur' => '>6', 'kondisi_sakit' => false, 'minum_obat' => false, 'masalah_pribadi' => false,
        'pengaruh_alkohol' => false, 'siap_bekerja' => true,
    ]);
    LaporanBahaya::create([
        'user_id' => $worker->id, 'site' => 'BAU', 'tanggal' => today()->toDateString(), 'lokasi' => 'Pit 2',
        'deskripsi_bahaya' => 'Dinding retak', 'tindakan_perbaikan' => 'Barikade',
        'probabilitas' => 5, 'frekuensi' => 5, 'severity' => 25, 'status_tindakan' => 'pending',
    ]);

    $this->actingAs($admin)
        ->get(route('app.home'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/index')
            ->where('overview.risk_distribution.AA', 1)
            ->has('overview.attention', 1)
            ->where('overview.site_summary.0.site', 'BAU')
            ->where('overview.site_summary.0.laporan', 1)
            ->where('overview.bugar_daily.'.(today()->day - 1).'.persen', 100));
});
