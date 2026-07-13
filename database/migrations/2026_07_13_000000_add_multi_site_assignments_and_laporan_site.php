<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_user', function (Blueprint $table) {
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['site_id', 'user_id']);
        });

        DB::table('users')
            ->whereNotNull('site')
            ->orderBy('id')
            ->each(function (object $user): void {
                $siteId = DB::table('sites')->where('value', $user->site)->value('id');

                if ($siteId) {
                    DB::table('site_user')->insertOrIgnore([
                        'site_id' => $siteId,
                        'user_id' => $user->id,
                    ]);
                }
            });

        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->string('site')->nullable()->after('user_id')->index();
        });

        DB::table('laporan_bahaya')
            ->join('users', 'users.id', '=', 'laporan_bahaya.user_id')
            ->whereNull('laporan_bahaya.site')
            ->update(['laporan_bahaya.site' => DB::raw('users.site')]);
    }

    public function down(): void
    {
        Schema::table('laporan_bahaya', function (Blueprint $table) {
            $table->dropIndex(['site']);
            $table->dropColumn('site');
        });

        Schema::dropIfExists('site_user');
    }
};
