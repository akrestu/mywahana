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
        Schema::create('hr_assessment_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['in_progress', 'completed'])->default('in_progress');
            $table->unsignedSmallInteger('total_questions');
            $table->unsignedSmallInteger('score')->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->boolean('passed')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hr_assessment_sessions');
    }
};
