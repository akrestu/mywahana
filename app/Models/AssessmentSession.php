<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class AssessmentSession extends Model
{
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

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessionQuestions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AssessmentSessionQuestion::class)->orderBy('urutan');
    }

    public function scopeCompleted(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('status', 'completed');
    }

    public function isExpired(): bool
    {
        return $this->status === 'in_progress'
            && $this->started_at->addSeconds(self::DURATION_SECONDS)->isPast();
    }

    public function autoExpire(): void
    {
        if ($this->status !== 'in_progress') {
            return;
        }

        DB::transaction(function () {
            $this->loadMissing('sessionQuestions.question');

            $score = 0;
            foreach ($this->sessionQuestions as $sq) {
                $isCorrect = $sq->jawaban_user !== null
                    && (int) $sq->jawaban_user === (int) $sq->question->jawaban_benar;

                if ($sq->jawaban_user !== null) {
                    $sq->update(['is_correct' => $isCorrect]);
                }

                if ($isCorrect) {
                    $score++;
                }
            }

            $percentage = $this->total_questions > 0
                ? round(($score / $this->total_questions) * 100, 2)
                : 0;

            $this->update([
                'status' => 'completed',
                'score' => $score,
                'percentage' => $percentage,
                'passed' => $percentage >= self::PASSING_PERCENTAGE,
                'completed_at' => now(),
            ]);
        });
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
