<?php

namespace App\Models;

use App\Models\Concerns\GradesAssessment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AssessmentSession extends Model
{
    use GradesAssessment;

    public const DURATION_SECONDS = 45 * 60;

    public const PASSING_PERCENTAGE = 80;

    protected $fillable = [
        'user_id', 'departemen', 'tags', 'status',
        'total_questions', 'score', 'percentage', 'passed',
        'started_at', 'completed_at',
    ];

    protected $casts = [
        'passed' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessionQuestions(): HasMany
    {
        return $this->hasMany(AssessmentSessionQuestion::class)->orderBy('urutan');
    }

    public function feedback(): HasOne
    {
        return $this->hasOne(AssessmentFeedback::class);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    protected function attendanceType(): string
    {
        return 'safety';
    }

    public static function expireAllOverdue(): int
    {
        $overdue = self::where('status', 'in_progress')
            ->where('started_at', '<=', now()->subSeconds(self::DURATION_SECONDS))
            ->get();

        foreach ($overdue as $session) {
            $session->autoExpire();
        }

        return $overdue->count();
    }
}
