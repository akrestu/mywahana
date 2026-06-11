<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrAssessmentSession extends Model
{
    protected $fillable = [
        'user_id', 'status',
        'total_questions', 'score', 'percentage', 'passed',
        'started_at', 'completed_at',
    ];

    protected $casts = [
        'passed' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessionQuestions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(HrAssessmentSessionQuestion::class)->orderBy('urutan');
    }

    public function scopeCompleted(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('status', 'completed');
    }
}
