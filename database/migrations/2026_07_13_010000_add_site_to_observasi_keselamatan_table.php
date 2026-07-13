<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('observasi_keselamatan', function (Blueprint $table) {
            $table->string('site')->nullable()->after('user_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('observasi_keselamatan', function (Blueprint $table) {
            $table->dropIndex(['site']);
            $table->dropColumn('site');
        });
    }
};
