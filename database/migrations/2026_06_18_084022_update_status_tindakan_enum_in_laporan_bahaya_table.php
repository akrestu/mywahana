<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: expand enum to include both old and new values
        DB::statement("ALTER TABLE laporan_bahaya MODIFY status_tindakan ENUM('pending','selesai','continue','progress','close') DEFAULT 'pending'");

        // Step 2: migrate existing data
        DB::table('laporan_bahaya')->where('status_tindakan', 'selesai')->update(['status_tindakan' => 'close']);

        // Step 3: remove old value from enum
        DB::statement("ALTER TABLE laporan_bahaya MODIFY status_tindakan ENUM('pending','continue','progress','close') DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE laporan_bahaya MODIFY status_tindakan ENUM('pending','close','continue','progress','selesai') DEFAULT 'pending'");

        DB::table('laporan_bahaya')->where('status_tindakan', 'close')->update(['status_tindakan' => 'selesai']);
        DB::table('laporan_bahaya')->whereIn('status_tindakan', ['continue', 'progress'])->update(['status_tindakan' => 'pending']);

        DB::statement("ALTER TABLE laporan_bahaya MODIFY status_tindakan ENUM('pending','selesai') DEFAULT 'pending'");
    }
};
