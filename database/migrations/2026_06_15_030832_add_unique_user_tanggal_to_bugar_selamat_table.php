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
        Schema::table('bugar_selamat', function (Blueprint $table) {
            $table->unique(['user_id', 'tanggal'], 'bugar_selamat_user_tanggal_unique');
        });
    }

    public function down(): void
    {
        Schema::table('bugar_selamat', function (Blueprint $table) {
            $table->dropUnique('bugar_selamat_user_tanggal_unique');
        });
    }
};
