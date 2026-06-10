<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participation_targets', function (Blueprint $table) {
            $table->id();
            $table->string('level')->unique(); // nonstaff, staff, srstaff
            $table->unsignedTinyInteger('laporan_per_minggu')->default(1);
            $table->unsignedTinyInteger('bugar_per_hari')->default(1);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Seed default targets
        DB::table('participation_targets')->insert([
            ['level' => 'nonstaff', 'laporan_per_minggu' => 1, 'bugar_per_hari' => 1, 'updated_by' => null, 'created_at' => now(), 'updated_at' => now()],
            ['level' => 'staff',    'laporan_per_minggu' => 2, 'bugar_per_hari' => 1, 'updated_by' => null, 'created_at' => now(), 'updated_at' => now()],
            ['level' => 'srstaff',  'laporan_per_minggu' => 2, 'bugar_per_hari' => 1, 'updated_by' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('participation_targets');
    }
};
