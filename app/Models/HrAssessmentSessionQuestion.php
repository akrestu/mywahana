<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrAssessmentSessionQuestion extends Model
{
    protected $fillable = [
        'hr_assessment_session_id', 'hr_assessment_question_id',
        'urutan', 'jawaban_user', 'is_correct',
        'question_snapshot', 'jawaban_1_snapshot', 'jawaban_2_snapshot',
        'jawaban_3_snapshot', 'jawaban_4_snapshot', 'jawaban_benar_snapshot',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'jawaban_benar_snapshot' => 'integer',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(HrAssessmentSession::class, 'hr_assessment_session_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(HrAssessmentQuestion::class, 'hr_assessment_question_id');
    }

    public function questionText(): ?string
    {
        return $this->question_snapshot ?? $this->question?->question;
    }

    public function answerOption(int $number): ?string
    {
        return $this->{"jawaban_{$number}_snapshot"} ?? $this->question?->{"jawaban_{$number}"};
    }

    public function correctAnswer(): ?int
    {
        return $this->jawaban_benar_snapshot ?? $this->question?->jawaban_benar;
    }
}
