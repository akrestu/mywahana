<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Alter enum to add 'ditolak'
        DB::statement("ALTER TABLE observasi_keselamatan MODIFY COLUMN status ENUM('menunggu_konfirmasi','dikonfirmasi','ditolak') NOT NULL DEFAULT 'menunggu_konfirmasi'");

        Schema::table('observasi_keselamatan', function (Blueprint $table) {
            $table->text('pj_tolak_alasan')->nullable()->after('pj_dikonfirmasi_at');
            $table->timestamp('pj_ditolak_at')->nullable()->after('pj_tolak_alasan');
        });
    }

    public function down(): void
    {
        Schema::table('observasi_keselamatan', function (Blueprint $table) {
            $table->dropColumn(['pj_tolak_alasan', 'pj_ditolak_at']);
        });

        DB::statement("ALTER TABLE observasi_keselamatan MODIFY COLUMN status ENUM('menunggu_konfirmasi','dikonfirmasi') NOT NULL DEFAULT 'menunggu_konfirmasi'");
    }
};
