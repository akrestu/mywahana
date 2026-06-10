<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspeksi_kantor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('re_inspektor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tanggal');
            $table->string('project_site');
            $table->string('departemen');

            // Situasi (7 item)
            $table->tinyInteger('situasi_1')->nullable(); // Atap, Dinding, pintu, jendela
            $table->tinyInteger('situasi_2')->nullable(); // Lantai
            $table->tinyInteger('situasi_3')->nullable(); // Penerangan
            $table->tinyInteger('situasi_4')->nullable(); // Ventilasi
            $table->tinyInteger('situasi_5')->nullable(); // House keeping
            $table->tinyInteger('situasi_6')->nullable(); // Parkir & rambu
            $table->tinyInteger('situasi_7')->nullable(); // Rambu tempat berkumpul

            // Individu (1 item)
            $table->tinyInteger('individu_1')->nullable(); // APD sesuai standar

            // Alat (7 item)
            $table->tinyInteger('alat_1')->nullable(); // Rambu K3
            $table->tinyInteger('alat_2')->nullable(); // Instalasi listrik
            $table->tinyInteger('alat_3')->nullable(); // Pipa, kran, katup
            $table->tinyInteger('alat_4')->nullable(); // Rambu dilarang masuk
            $table->tinyInteger('alat_5')->nullable(); // Alarm emergency & evakuasi
            $table->tinyInteger('alat_6')->nullable(); // Furniture
            $table->tinyInteger('alat_7')->nullable(); // APAR / hydran

            // Prosedur (7 item)
            $table->tinyInteger('prosedur_1')->nullable(); // Tempat sampah
            $table->tinyInteger('prosedur_2')->nullable(); // APAR rutin
            $table->tinyInteger('prosedur_3')->nullable(); // Sistem pentanahan
            $table->tinyInteger('prosedur_4')->nullable(); // Kotak P3K
            $table->tinyInteger('prosedur_5')->nullable(); // Tidak simpan cairan mudah terbakar
            $table->tinyInteger('prosedur_6')->nullable(); // Pengendalian B3
            $table->tinyInteger('prosedur_7')->nullable(); // Papan pengumuman K3

            // Kalkulasi
            $table->integer('total_poin')->nullable();
            $table->integer('max_poin')->default(88); // 22 item × 4
            $table->decimal('persentase', 5, 1)->nullable();
            $table->enum('risk_level', ['L', 'M', 'H', 'VH'])->nullable();

            // Tindakan perbaikan (JSON array: [{no, tindakan, pic, due_date, remark}])
            $table->json('tindakan_perbaikan')->nullable();

            // Foto dokumentasi (JSON: {item_key: path})
            $table->json('foto_items')->nullable();

            // Tanda tangan
            $table->text('ttd_inspektor')->nullable();
            $table->text('ttd_re_inspektor')->nullable();

            // Status & konfirmasi re-inspektor
            $table->enum('status', ['menunggu_re_inspeksi', 'selesai', 'ditolak'])->default('menunggu_re_inspeksi');
            $table->timestamp('re_inspeksi_at')->nullable();
            $table->string('tolak_alasan')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspeksi_kantor');
    }
};
