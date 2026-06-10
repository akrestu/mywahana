<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspeksi_mess', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('re_inspektor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tanggal');
            $table->string('project_site');
            $table->string('lokasi');

            // Sanitasi & Kondisi Umum (10 item)
            $table->tinyInteger('sanitasi_1')->nullable();  // Drainase bersih & didisinfeksi
            $table->tinyInteger('sanitasi_2')->nullable();  // Lantai bersih & didisinfeksi
            $table->tinyInteger('sanitasi_3')->nullable();  // Tidak ada lantai / sambungan pecah
            $table->tinyInteger('sanitasi_4')->nullable();  // Dinding & atap bersih
            $table->tinyInteger('sanitasi_5')->nullable();  // Penerangan memadai
            $table->tinyInteger('sanitasi_6')->nullable();  // Ventilasi / ekstraksi memadai
            $table->tinyInteger('sanitasi_7')->nullable();  // Kebersihan & housekeeping
            $table->tinyInteger('sanitasi_8')->nullable();  // Cermin bersih & tidak pecah
            $table->tinyInteger('sanitasi_9')->nullable();  // Sabun & disinfektan
            $table->tinyInteger('sanitasi_10')->nullable(); // Bak cuci (wastafel) bersih

            // Kamar & Fasilitas (8 item)
            $table->tinyInteger('kamar_1')->nullable(); // Toilet bersih & didisinfeksi
            $table->tinyInteger('kamar_2')->nullable(); // Lembar pemantauan up-to-date
            $table->tinyInteger('kamar_3')->nullable(); // Tempat tidur / kamar bersih
            $table->tinyInteger('kamar_4')->nullable(); // Fans / bagian bergerak diamankan
            $table->tinyInteger('kamar_5')->nullable(); // Kulkas / kompor / peralatan bersih
            $table->tinyInteger('kamar_6')->nullable(); // Kotak listrik / saklar
            $table->tinyInteger('kamar_7')->nullable(); // Pentanahan
            $table->tinyInteger('kamar_8')->nullable(); // Instalasi gas terkompresi aman

            // Dapur & Penyiapan Makanan (5 item)
            $table->tinyInteger('dapur_1')->nullable(); // Tempat penyiapan makanan mencukupi
            $table->tinyInteger('dapur_2')->nullable(); // Area penyiapan bersih & bebas serangga
            $table->tinyInteger('dapur_3')->nullable(); // Penyimpanan makanan bersih
            $table->tinyInteger('dapur_4')->nullable(); // APD staf dapur & pembersih
            $table->tinyInteger('dapur_5')->nullable(); // Pencegahan & perlindungan kebakaran

            // Sampah & Lingkungan (5 item)
            $table->tinyInteger('sampah_1')->nullable(); // Tempat pembuangan sisa makanan tertutup
            $table->tinyInteger('sampah_2')->nullable(); // Tempat sampah umum
            $table->tinyInteger('sampah_3')->nullable(); // Pembuangan air hujan lancar
            $table->tinyInteger('sampah_4')->nullable(); // Sampah diangkut rutin
            $table->tinyInteger('sampah_5')->nullable(); // Pembuangan air limbah tidak menimbulkan serangga

            // Kalkulasi
            $table->integer('total_poin')->nullable();
            $table->integer('max_poin')->default(112); // 28 item × 4
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
        Schema::dropIfExists('inspeksi_mess');
    }
};
