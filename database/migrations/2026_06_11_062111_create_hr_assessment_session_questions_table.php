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
        Schema::create('hr_assessment_session_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hr_assessment_session_id');
            $table->unsignedBigInteger('hr_assessment_question_id');
            $table->foreign('hr_assessment_session_id', 'hr_asq_session_fk')
                  ->references('id')->on('hr_assessment_sessions')->onDelete('cascade');
            $table->foreign('hr_assessment_question_id', 'hr_asq_question_fk')
                  ->references('id')->on('hr_assessment_questions')->onDelete('cascade');
            $table->unsignedSmallInteger('urutan');
            $table->unsignedTinyInteger('jawaban_user')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hr_assessment_session_questions');
    }
};
