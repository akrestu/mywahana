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
        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->string('foto_path_2')->nullable()->after('foto_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->dropColumn('foto_path_2');
        });
    }
};
