<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentSessionQuestion extends Model
{
    protected $fillable = [
        'assessment_session_id', 'assessment_question_id',
        'urutan', 'jawaban_user', 'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function session(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(AssessmentSession::class, 'assessment_session_id');
    }

    public function question(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(AssessmentQuestion::class, 'assessment_question_id');
    }
}
