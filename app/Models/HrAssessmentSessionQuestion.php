<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrAssessmentSessionQuestion extends Model
{
    protected $fillable = [
        'hr_assessment_session_id', 'hr_assessment_question_id',
        'urutan', 'jawaban_user', 'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function session(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(HrAssessmentSession::class, 'hr_assessment_session_id');
    }

    public function question(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(HrAssessmentQuestion::class, 'hr_assessment_question_id');
    }
}
