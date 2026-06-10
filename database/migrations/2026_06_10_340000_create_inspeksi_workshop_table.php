<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspeksi_workshop', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('re_inspektor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tanggal');
            $table->string('project_site');
            $table->string('departemen');

            // Bangunan & Fasilitas Umum (21 item)
            $table->tinyInteger('bangunan_1')->nullable();  // Bangunan baik & parkir luas
            $table->tinyInteger('bangunan_2')->nullable();  // Parkir + rambu RFU/BD
            $table->tinyInteger('bangunan_3')->nullable();  // Area bersih, tidak ada ceceran B3
            $table->tinyInteger('bangunan_4')->nullable();  // APD sesuai standar
            $table->tinyInteger('bangunan_5')->nullable();  // Fasilitas air, toilet, ruang istirahat
            $table->tinyInteger('bangunan_6')->nullable();  // Sarana emergensi & muster point
            $table->tinyInteger('bangunan_7')->nullable();  // Papan K3 & housekeeping
            $table->tinyInteger('bangunan_8')->nullable();  // Papan penanggung jawab
            $table->tinyInteger('bangunan_9')->nullable();  // Kode warna demarkasi
            $table->tinyInteger('bangunan_10')->nullable(); // Tangga & pagar
            $table->tinyInteger('bangunan_11')->nullable(); // Oil trap
            $table->tinyInteger('bangunan_12')->nullable(); // Parit saluran air
            $table->tinyInteger('bangunan_13')->nullable(); // Tools standar
            $table->tinyInteger('bangunan_14')->nullable(); // Lock out & danger tag
            $table->tinyInteger('bangunan_15')->nullable(); // Service tag
            $table->tinyInteger('bangunan_16')->nullable(); // Guard komponen berputar
            $table->tinyInteger('bangunan_17')->nullable(); // APAR standar
            $table->tinyInteger('bangunan_18')->nullable(); // Kotak P3K
            $table->tinyInteger('bangunan_19')->nullable(); // Gudang hidrokarbon
            $table->tinyInteger('bangunan_20')->nullable(); // Tempat sampah B3/Non-B3
            $table->tinyInteger('bangunan_21')->nullable(); // Sampah dikosongkan & piket

            // Kelistrikan & Peralatan Listrik Portable (8 item)
            $table->tinyInteger('kelistrikan_1')->nullable(); // Ruang genset terpisah
            $table->tinyInteger('kelistrikan_2')->nullable(); // Suara genset & ear muff
            $table->tinyInteger('kelistrikan_3')->nullable(); // Tanda simbol listrik
            $table->tinyInteger('kelistrikan_4')->nullable(); // Gambar single line
            $table->tinyInteger('kelistrikan_5')->nullable(); // Kabel dalam kondisi baik
            $table->tinyInteger('kelistrikan_6')->nullable(); // Kotak listrik, saklar, kabel roll
            $table->tinyInteger('kelistrikan_7')->nullable(); // Alat listrik portable & gerinda + tabir
            $table->tinyInteger('kelistrikan_8')->nullable(); // RPM gerinda sesuai batu gerinda

            // Welder (6 item)
            $table->tinyInteger('welder_1')->nullable(); // Area las terpisah & tabir
            $table->tinyInteger('welder_2')->nullable(); // Pemantik khusus
            $table->tinyInteger('welder_3')->nullable(); // Perkakas tangan standar
            $table->tinyInteger('welder_4')->nullable(); // Mesin las diinspeksi & KIP
            $table->tinyInteger('welder_5')->nullable(); // APD welder
            $table->tinyInteger('welder_6')->nullable(); // APAR di area welder

            // Tabung Gas Bertekanan (6 item)
            $table->tinyInteger('tabung_1')->nullable(); // Tabung isi & kosong dipisah
            $table->tinyInteger('tabung_2')->nullable(); // Identifikasi label
            $table->tinyInteger('tabung_3')->nullable(); // Posisi berdiri & diikat
            $table->tinyInteger('tabung_4')->nullable(); // Flash back arrestor
            $table->tinyInteger('tabung_5')->nullable(); // Pemeriksaan rutin
            $table->tinyInteger('tabung_6')->nullable(); // Hose gas kondisi baik & warna

            // Alat Angkat (5 item)
            $table->tinyInteger('alat_angkat_1')->nullable(); // Chain block terpelihara
            $table->tinyInteger('alat_angkat_2')->nullable(); // Tempat penyimpanan khusus
            $table->tinyInteger('alat_angkat_3')->nullable(); // Hook + kunci pengaman
            $table->tinyInteger('alat_angkat_4')->nullable(); // Overhead crane / slings
            $table->tinyInteger('alat_angkat_5')->nullable(); // Pemeriksaan rutin

            // TPS Limbah B3 (12 item)
            $table->tinyInteger('tps_1')->nullable();  // Label B3 jelas
            $table->tinyInteger('tps_2')->nullable();  // Emergency spill kit
            $table->tinyInteger('tps_3')->nullable();  // MSDS
            $table->tinyInteger('tps_4')->nullable();  // APAR sesuai
            $table->tinyInteger('tps_5')->nullable();  // Accu dipisah
            $table->tinyInteger('tps_6')->nullable();  // Bak/tanggul kapasitas
            $table->tinyInteger('tps_7')->nullable();  // Tempat penirisan filter
            $table->tinyInteger('tps_8')->nullable();  // Papan neraca & logbook
            $table->tinyInteger('tps_9')->nullable();  // Eyewash
            $table->tinyInteger('tps_10')->nullable(); // APD emergency
            $table->tinyInteger('tps_11')->nullable(); // Kotak P3K & pemeriksaan
            $table->tinyInteger('tps_12')->nullable(); // Prosedur emergency

            // Tyre (3 item)
            $table->tinyInteger('tyre_1')->nullable(); // Area kerja khusus
            $table->tinyInteger('tyre_2')->nullable(); // Pengaman saat pemompaan
            $table->tinyInteger('tyre_3')->nullable(); // Penampungan ban baru & bekas

            // Kalkulasi
            $table->integer('total_poin')->nullable();
            $table->integer('max_poin')->default(244); // 61 item × 4
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
        Schema::dropIfExists('inspeksi_workshop');
    }
};
