<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->string('klasifikasi_bahaya')->nullable()->after('kategori');
            $table->string('detail_lokasi')->nullable()->after('lokasi');
            $table->foreignId('pic_user_id')->nullable()->constrained('users')->nullOnDelete()->after('status_tindakan');
        });
    }

    public function down(): void
    {
        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->dropForeign(['pic_user_id']);
            $table->dropColumn(['klasifikasi_bahaya', 'detail_lokasi', 'pic_user_id']);
        });
    }
};
