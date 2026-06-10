<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('participation_targets', function (Blueprint $table) {
            $table->unsignedInteger('inspeksi_per_minggu')->default(0)->after('laporan_per_minggu');
            $table->unsignedInteger('observasi_per_minggu')->default(0)->after('inspeksi_per_minggu');
        });

        DB::table('participation_targets')
            ->whereIn('level', ['staff', 'srstaff'])
            ->update(['inspeksi_per_minggu' => 1, 'observasi_per_minggu' => 1]);
    }

    public function down(): void
    {
        Schema::table('participation_targets', function (Blueprint $table) {
            $table->dropColumn(['inspeksi_per_minggu', 'observasi_per_minggu']);
        });
    }
};
