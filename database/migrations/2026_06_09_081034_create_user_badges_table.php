<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('badge_key');
            $table->timestamp('earned_at');
            $table->unique(['user_id', 'badge_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
    }
};
