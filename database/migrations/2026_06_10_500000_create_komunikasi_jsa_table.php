<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('komunikasi_jsa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_leader_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tanggal');
            $table->string('lokasi');
            $table->enum('shift', ['siang', 'malam']);
            $table->unsignedSmallInteger('durasi');
            $table->text('kegiatan');
            $table->string('judul_dokumen');
            $table->text('catatan')->nullable();
            $table->json('peserta');
            $table->text('supervisor_signature')->nullable();
            $table->enum('status', ['selesai', 'menunggu_konfirmasi', 'dikonfirmasi', 'ditolak'])->default('menunggu_konfirmasi');
            $table->text('tl_signature')->nullable();
            $table->timestamp('tl_dikonfirmasi_at')->nullable();
            $table->string('foto_kelompok');
            $table->string('foto_dokumen');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('komunikasi_jsa');
    }
};
