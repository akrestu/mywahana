<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspeksi_tambang_peserta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspeksi_tambang_id')->constrained('inspeksi_tambang')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['inspeksi_tambang_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspeksi_tambang_peserta');
    }
};
