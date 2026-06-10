<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->time('waktu_pengamatan')->nullable()->after('tanggal');
            $table->enum('kategori', ['KTA', 'TTA'])->nullable()->after('waktu_pengamatan');
        });
    }

    public function down(): void
    {
        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->dropColumn(['waktu_pengamatan', 'kategori']);
        });
    }
};
