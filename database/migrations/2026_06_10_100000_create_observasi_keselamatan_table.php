<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('observasi_keselamatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('penanggung_jawab_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tanggal');
            $table->string('jenis_pekerjaan');
            $table->string('lokasi_kerja');
            $table->string('peralatan_digunakan')->nullable();

            // 1.0 Prosedur
            $table->enum('cl_prosedur_mine_permit',    ['aman', 'beresiko'])->nullable();
            $table->enum('cl_prosedur_komisioning',    ['aman', 'beresiko'])->nullable();
            $table->enum('cl_prosedur_p2h',            ['aman', 'beresiko'])->nullable();
            $table->enum('cl_prosedur_instruksi_kerja',['aman', 'beresiko'])->nullable();
            $table->enum('cl_prosedur_loto',           ['aman', 'beresiko'])->nullable();
            $table->enum('cl_prosedur_sop_jsa',        ['aman', 'beresiko'])->nullable();

            // 2.0 APD
            $table->enum('cl_apd_kepala',         ['aman', 'beresiko'])->nullable();
            $table->enum('cl_apd_mata_wajah',     ['aman', 'beresiko'])->nullable();
            $table->enum('cl_apd_pendengaran',    ['aman', 'beresiko'])->nullable();
            $table->enum('cl_apd_pernapasan',     ['aman', 'beresiko'])->nullable();
            $table->enum('cl_apd_pelindung_jatuh',['aman', 'beresiko'])->nullable();
            $table->enum('cl_apd_pelindung_tenggelam', ['aman', 'beresiko'])->nullable();
            $table->enum('cl_apd_lengan_tangan',  ['aman', 'beresiko'])->nullable();
            $table->enum('cl_apd_paha_kaki',      ['aman', 'beresiko'])->nullable();

            // 3.0 Posisi Badan & Reaksi Orang
            $table->enum('cl_posisi_mengangkat',      ['aman', 'beresiko'])->nullable();
            $table->enum('cl_posisi_mengubah_posisi', ['aman', 'beresiko'])->nullable();
            $table->enum('cl_posisi_mengatur_pekerjaan', ['aman', 'beresiko'])->nullable();
            $table->enum('cl_posisi_dekat_listrik',   ['aman', 'beresiko'])->nullable();
            $table->enum('cl_posisi_dekat_berbahaya', ['aman', 'beresiko'])->nullable();
            $table->enum('cl_posisi_dekat_longsor',   ['aman', 'beresiko'])->nullable();
            $table->enum('cl_posisi_dekat_air',       ['aman', 'beresiko'])->nullable();
            $table->enum('cl_posisi_turun_naik',      ['aman', 'beresiko'])->nullable();

            // 4.0 Berkendara & Mengoperasikan Unit
            $table->enum('cl_kendaraan_sim_sio',      ['aman', 'beresiko'])->nullable();
            $table->enum('cl_kendaraan_sabuk',        ['aman', 'beresiko'])->nullable();
            $table->enum('cl_kendaraan_kecepatan',    ['aman', 'beresiko'])->nullable();
            $table->enum('cl_kendaraan_jarak',        ['aman', 'beresiko'])->nullable();
            $table->enum('cl_kendaraan_haluan',       ['aman', 'beresiko'])->nullable();
            $table->enum('cl_kendaraan_buggy_whip',   ['aman', 'beresiko'])->nullable();
            $table->enum('cl_kendaraan_radio',        ['aman', 'beresiko'])->nullable();
            $table->enum('cl_kendaraan_lampu',        ['aman', 'beresiko'])->nullable();

            // 5.0 Peralatan dan Perlindungan
            $table->enum('cl_peralatan_pemilihan',    ['aman', 'beresiko'])->nullable();
            $table->enum('cl_peralatan_safety_guard', ['aman', 'beresiko'])->nullable();
            $table->enum('cl_peralatan_pemakaian',    ['aman', 'beresiko'])->nullable();
            $table->enum('cl_peralatan_angkat',       ['aman', 'beresiko'])->nullable();
            $table->enum('cl_peralatan_elektrikal',   ['aman', 'beresiko'])->nullable();
            $table->enum('cl_peralatan_tangan',       ['aman', 'beresiko'])->nullable();

            // 6.0 Daerah Kerja & Lingkungan
            $table->enum('cl_lingkungan_kebersihan',  ['aman', 'beresiko'])->nullable();
            $table->enum('cl_lingkungan_tumpahan',    ['aman', 'beresiko'])->nullable();
            $table->enum('cl_lingkungan_pencahayaan', ['aman', 'beresiko'])->nullable();
            $table->enum('cl_lingkungan_kebisingan',  ['aman', 'beresiko'])->nullable();
            $table->enum('cl_lingkungan_barikade',    ['aman', 'beresiko'])->nullable();
            $table->enum('cl_lingkungan_rambu',       ['aman', 'beresiko'])->nullable();
            $table->enum('cl_lingkungan_limbah',      ['aman', 'beresiko'])->nullable();

            // 7.0 Lain-Lain (4 item bebas)
            $table->string('ll_1_label')->nullable();
            $table->enum('ll_1_nilai', ['aman', 'beresiko'])->nullable();
            $table->string('ll_2_label')->nullable();
            $table->enum('ll_2_nilai', ['aman', 'beresiko'])->nullable();
            $table->string('ll_3_label')->nullable();
            $table->enum('ll_3_nilai', ['aman', 'beresiko'])->nullable();
            $table->string('ll_4_label')->nullable();
            $table->enum('ll_4_nilai', ['aman', 'beresiko'])->nullable();

            // Narasi
            $table->text('tindakan_kondisi_aman')->nullable();
            $table->text('tindakan_meningkatkan_selamat')->nullable();
            $table->text('tindakan_kondisi_tidak_aman')->nullable();
            $table->text('tindakan_segera')->nullable();
            $table->text('tindakan_mencegah_terulang')->nullable();
            $table->json('status_temuan')->nullable();
            $table->text('catatan')->nullable();

            // Status & Konfirmasi PJ
            $table->enum('status', ['menunggu_konfirmasi', 'dikonfirmasi'])->default('menunggu_konfirmasi');
            $table->text('pj_signature')->nullable();
            $table->timestamp('pj_dikonfirmasi_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observasi_keselamatan');
    }
};
