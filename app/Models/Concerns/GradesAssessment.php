<?php

namespace App\Models\Concerns;

use App\Models\InductionAttendance;
use Illuminate\Support\Facades\DB;

/**
 * Penilaian sesi assessment (Safety & HR) di satu tempat. Sesi dikunci baris
 * selama penilaian agar submit ganda / submit bersamaan dengan auto-expire
 * tidak menilai sesi dua kali.
 */
trait GradesAssessment
{
    abstract protected function attendanceType(): string;

    public function isExpired(): bool
    {
        return $this->status === 'in_progress'
            && $this->started_at->addSeconds(self::DURATION_SECONDS)->isPast();
    }

    public function autoExpire(): void
    {
        $this->grade();
    }

    /**
     * Nilai sesi. Jika $answers null, jawaban yang sudah tersimpan yang dipakai.
     *
     * @param  array<int, int|null>|null  $answers  map session_question_id => jawaban
     */
    public function grade(?array $answers = null): void
    {
        DB::transaction(function () use ($answers) {
            $locked = static::whereKey($this->getKey())->lockForUpdate()->first();

            if (! $locked || $locked->status !== 'in_progress') {
                return;
            }

            $score = 0;
            foreach ($locked->sessionQuestions()->with('question')->get() as $sq) {
                $jawabanUser = $answers !== null ? ($answers[$sq->id] ?? null) : $sq->jawaban_user;
                $isCorrect = $jawabanUser !== null && (int) $jawabanUser === $sq->correctAnswer();

                $sq->update([
                    'jawaban_user' => $jawabanUser,
                    'is_correct' => $isCorrect,
                ]);

                if ($isCorrect) {
                    $score++;
                }
            }

            $percentage = $locked->total_questions > 0
                ? round(($score / $locked->total_questions) * 100, 2)
                : 0;
            $passed = $percentage >= self::PASSING_PERCENTAGE;

            $locked->update([
                'status' => 'completed',
                'score' => $score,
                'percentage' => $percentage,
                'passed' => $passed,
                'completed_at' => now(),
            ]);

            if ($passed) {
                InductionAttendance::firstOrCreate(
                    ['user_id' => $locked->user_id, 'type' => $this->attendanceType()],
                    [
                        'assessment_session_id' => $locked->id,
                        'assessment_session_type' => $this->attendanceType(),
                        'attended_at' => now(),
                    ]
                );
            }
        });

        $this->refresh();
    }
}
