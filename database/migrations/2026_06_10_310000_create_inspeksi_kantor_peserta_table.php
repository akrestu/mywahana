<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspeksi_kantor_peserta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspeksi_kantor_id')->constrained('inspeksi_kantor')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['inspeksi_kantor_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspeksi_kantor_peserta');
    }
};
