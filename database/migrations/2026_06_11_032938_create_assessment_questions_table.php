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
        Schema::create('assessment_questions', function (Blueprint $table) {
            $table->id();
            $table->enum('departemen', ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA']);
            $table->enum('tags', ['S', 'NS']);
            $table->text('question');
            $table->unsignedTinyInteger('jawaban_benar');
            $table->text('jawaban_1');
            $table->text('jawaban_2');
            $table->text('jawaban_3');
            $table->text('jawaban_4');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_questions');
    }
};
