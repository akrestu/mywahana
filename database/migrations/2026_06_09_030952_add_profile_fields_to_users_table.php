<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nik')->nullable()->after('name');
            $table->string('jabatan')->nullable()->after('nik');
            $table->enum('site', ['baratama', 'bandhawa'])->nullable()->after('jabatan');
            $table->boolean('is_admin')->default(false)->after('site');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nik', 'jabatan', 'site', 'is_admin']);
        });
    }
};
