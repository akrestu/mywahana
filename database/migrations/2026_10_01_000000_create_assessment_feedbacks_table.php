<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_session_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trainer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('trainer_name')->index();
            $table->json('trainer_scores');
            $table->json('effectiveness_scores');
            $table->decimal('trainer_avg', 3, 2);
            $table->decimal('effectiveness_avg', 3, 2);
            $table->text('komentar')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_feedbacks');
    }
};
