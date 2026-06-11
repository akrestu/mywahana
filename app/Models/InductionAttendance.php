<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InductionAttendance extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'assessment_session_id',
        'assessment_session_type',
        'attended_at',
    ];

    protected $casts = [
        'attended_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assessmentSession(): BelongsTo
    {
        return $this->belongsTo(AssessmentSession::class);
    }

    public function hrAssessmentSession(): BelongsTo
    {
        return $this->belongsTo(HrAssessmentSession::class);
    }
}
