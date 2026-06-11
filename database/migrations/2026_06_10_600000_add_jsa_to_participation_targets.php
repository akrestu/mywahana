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
            $table->unsignedTinyInteger('jsa_per_2minggu')->default(0)->after('observasi_per_minggu');
        });

        DB::table('participation_targets')
            ->whereIn('level', ['staff', 'srstaff'])
            ->update(['jsa_per_2minggu' => 1]);
    }

    public function down(): void
    {
        Schema::table('participation_targets', function (Blueprint $table) {
            $table->dropColumn('jsa_per_2minggu');
        });
    }
};
