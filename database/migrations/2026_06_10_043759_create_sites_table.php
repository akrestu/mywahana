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
        Schema::create('sites', function (Blueprint $table) {
            $table->id();
            $table->string('value')->unique();
            $table->string('label');
            $table->timestamps();
        });

        DB::table('sites')->insert([
            ['value' => 'baratama', 'label' => 'WBK Site MAS', 'created_at' => now(), 'updated_at' => now()],
            ['value' => 'bandhawa', 'label' => 'WBK Site BAU', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
