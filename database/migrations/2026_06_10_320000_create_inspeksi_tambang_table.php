<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspeksi_tambang', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('re_inspektor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tanggal');
            $table->string('project_site');
            $table->string('departemen');

            // Situasi (13 item)
            $table->tinyInteger('situasi_1')->nullable();  // House keeping
            $table->tinyInteger('situasi_2')->nullable();  // Jalan angkut rata
            $table->tinyInteger('situasi_3')->nullable();  // Lebar jalan angkut
            $table->tinyInteger('situasi_4')->nullable();  // Tanggul pengaman jalan
            $table->tinyInteger('situasi_5')->nullable();  // Dinding galian stabil
            $table->tinyInteger('situasi_6')->nullable();  // Tidak ada material longsor
            $table->tinyInteger('situasi_7')->nullable();  // Ketinggian & kemiringan slope
            $table->tinyInteger('situasi_8')->nullable();  // Tempat dumping
            $table->tinyInteger('situasi_9')->nullable();  // Dumping area & tanggul
            $table->tinyInteger('situasi_10')->nullable(); // Lampu penerangan
            $table->tinyInteger('situasi_11')->nullable(); // Lampu di tempat aman
            $table->tinyInteger('situasi_12')->nullable(); // Karyawan di tempat aman
            $table->tinyInteger('situasi_13')->nullable(); // Kendaraan parkir aman

            // Individu (2 item)
            $table->tinyInteger('individu_1')->nullable(); // APD sesuai
            $table->tinyInteger('individu_2')->nullable(); // SIMPER sesuai

            // Alat (6 item)
            $table->tinyInteger('alat_1')->nullable(); // Rambu lalu lintas
            $table->tinyInteger('alat_2')->nullable(); // Equipment & lampu peringatan
            $table->tinyInteger('alat_3')->nullable(); // Rambu arah keluar/masuk & evakuasi
            $table->tinyInteger('alat_4')->nullable(); // Drainase
            $table->tinyInteger('alat_5')->nullable(); // Kotak P3K kendaraan
            $table->tinyInteger('alat_6')->nullable(); // APAR & water truck

            // Prosedur (5 item)
            $table->tinyInteger('prosedur_1')->nullable(); // Pengendalian debu
            $table->tinyInteger('prosedur_2')->nullable(); // Safety berm
            $table->tinyInteger('prosedur_3')->nullable(); // Buggy whip
            $table->tinyInteger('prosedur_4')->nullable(); // Pre-start check / P2H
            $table->tinyInteger('prosedur_5')->nullable(); // Seat belt

            // Kalkulasi
            $table->integer('total_poin')->nullable();
            $table->integer('max_poin')->default(104); // 26 item × 4
            $table->decimal('persentase', 5, 1)->nullable();
            $table->enum('risk_level', ['L', 'M', 'H', 'VH'])->nullable();

            $table->json('tindakan_perbaikan')->nullable();
            $table->json('foto_items')->nullable();

            $table->text('ttd_inspektor')->nullable();
            $table->text('ttd_re_inspektor')->nullable();

            $table->enum('status', ['menunggu_re_inspeksi', 'selesai', 'ditolak'])->default('menunggu_re_inspeksi');
            $table->timestamp('re_inspeksi_at')->nullable();
            $table->string('tolak_alasan')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspeksi_tambang');
    }
};
