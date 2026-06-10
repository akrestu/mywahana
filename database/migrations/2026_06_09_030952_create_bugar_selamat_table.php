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
        Schema::create('bugar_selamat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->enum('shift', ['Pagi', 'Siang', 'Malam']);
            $table->unsignedTinyInteger('hari_ke');
            $table->enum('jam_tidur', ['<5', '5-6', '>6']);
            $table->boolean('kondisi_sakit')->default(false);
            $table->boolean('minum_obat')->default(false);
            $table->boolean('masalah_pribadi')->default(false);
            $table->boolean('pengaruh_alkohol')->default(false);
            $table->boolean('siap_bekerja')->default(true);
            $table->enum('status_kelayakan', ['layak', 'catatan', 'dilarang']);
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bugar_selamat');
    }
};
