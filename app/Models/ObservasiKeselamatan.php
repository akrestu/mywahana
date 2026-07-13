<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ObservasiKeselamatan extends Model
{
    protected $table = 'observasi_keselamatan';

    protected $fillable = [
        'user_id',
        'site',
        'penanggung_jawab_id',
        'tanggal',
        'jenis_pekerjaan',
        'lokasi_kerja',
        'peralatan_digunakan',
        // 1.0 Prosedur
        'cl_prosedur_mine_permit',
        'cl_prosedur_komisioning',
        'cl_prosedur_p2h',
        'cl_prosedur_instruksi_kerja',
        'cl_prosedur_loto',
        'cl_prosedur_sop_jsa',
        // 2.0 APD
        'cl_apd_kepala',
        'cl_apd_mata_wajah',
        'cl_apd_pendengaran',
        'cl_apd_pernapasan',
        'cl_apd_pelindung_jatuh',
        'cl_apd_pelindung_tenggelam',
        'cl_apd_lengan_tangan',
        'cl_apd_paha_kaki',
        // 3.0 Posisi Badan
        'cl_posisi_mengangkat',
        'cl_posisi_mengubah_posisi',
        'cl_posisi_mengatur_pekerjaan',
        'cl_posisi_dekat_listrik',
        'cl_posisi_dekat_berbahaya',
        'cl_posisi_dekat_longsor',
        'cl_posisi_dekat_air',
        'cl_posisi_turun_naik',
        // 4.0 Kendaraan
        'cl_kendaraan_sim_sio',
        'cl_kendaraan_sabuk',
        'cl_kendaraan_kecepatan',
        'cl_kendaraan_jarak',
        'cl_kendaraan_haluan',
        'cl_kendaraan_buggy_whip',
        'cl_kendaraan_radio',
        'cl_kendaraan_lampu',
        // 5.0 Peralatan
        'cl_peralatan_pemilihan',
        'cl_peralatan_safety_guard',
        'cl_peralatan_pemakaian',
        'cl_peralatan_angkat',
        'cl_peralatan_elektrikal',
        'cl_peralatan_tangan',
        // 6.0 Lingkungan
        'cl_lingkungan_kebersihan',
        'cl_lingkungan_tumpahan',
        'cl_lingkungan_pencahayaan',
        'cl_lingkungan_kebisingan',
        'cl_lingkungan_barikade',
        'cl_lingkungan_rambu',
        'cl_lingkungan_limbah',
        // 7.0 Lain-lain
        'll_1_label', 'll_1_nilai',
        'll_2_label', 'll_2_nilai',
        'll_3_label', 'll_3_nilai',
        'll_4_label', 'll_4_nilai',
        // Narasi
        'tindakan_kondisi_aman',
        'tindakan_meningkatkan_selamat',
        'tindakan_kondisi_tidak_aman',
        'tindakan_segera',
        'tindakan_mencegah_terulang',
        'status_temuan',
        'catatan',
        // Status PJ
        'status',
        'pj_signature',
        'pj_dikonfirmasi_at',
        'pj_tolak_alasan',
        'pj_ditolak_at',
    ];

    protected $casts = [
        'tanggal'           => 'date',
        'status_temuan'     => 'array',
        'pj_dikonfirmasi_at'=> 'datetime',
        'pj_ditolak_at'     => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function penanggungJawab(): BelongsTo
    {
        return $this->belongsTo(User::class, 'penanggung_jawab_id');
    }

    public function hasBeresiko(): bool
    {
        $checklistKeys = array_filter($this->fillable, fn($k) => str_starts_with($k, 'cl_') || str_starts_with($k, 'll_') && str_ends_with($k, '_nilai'));
        foreach ($checklistKeys as $key) {
            if ($this->$key === 'beresiko') return true;
        }
        return false;
    }
}
