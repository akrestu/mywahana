<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Site hanya memakai dua shift; shift "Pagi" lama sama dengan Shift I (Siang).
        DB::table('bugar_selamat')->where('shift', 'Pagi')->update(['shift' => 'Siang']);

        Schema::table('bugar_selamat', function (Blueprint $table) {
            $table->enum('shift', ['Siang', 'Malam'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bugar_selamat', function (Blueprint $table) {
            $table->enum('shift', ['Pagi', 'Siang', 'Malam'])->change();
        });
    }
};
