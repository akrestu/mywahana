<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Filter site admin kini memakai kolom site milik form. Isi site yang
 * masih kosong pada data lama dari site karyawan pembuatnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['observasi_keselamatan', 'komunikasi_jsa'] as $table) {
            DB::table($table)
                ->whereNull('site')
                ->orderBy('id')
                ->each(function (object $row) use ($table): void {
                    $site = DB::table('users')->where('id', $row->user_id)->value('site');

                    if ($site) {
                        DB::table($table)->where('id', $row->id)->update(['site' => $site]);
                    }
                });
        }
    }

    public function down(): void
    {
        // Data backfill; tidak dikembalikan.
    }
};
