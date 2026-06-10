<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('laporan_bahaya', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('lokasi');
            $table->text('deskripsi_bahaya');
            $table->text('tindakan_perbaikan');
            $table->unsignedTinyInteger('probabilitas');
            $table->unsignedTinyInteger('frekuensi');
            $table->unsignedSmallInteger('severity');
            $table->unsignedSmallInteger('nilai_risiko');
            $table->enum('tingkat_risiko', ['AA', 'A', 'B', 'C']);
            $table->enum('status_tindakan', ['pending', 'selesai'])->default('pending');
            $table->string('foto_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_bahaya');
    }
};
