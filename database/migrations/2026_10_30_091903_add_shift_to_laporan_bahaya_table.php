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
            // Nullable: laporan lama belum mencatat shift.
            $table->string('shift', 10)->nullable()->after('waktu_pengamatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->dropColumn('shift');
        });
    }
};
