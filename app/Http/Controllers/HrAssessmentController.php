<?php

namespace App\Http\Controllers;

use App\Models\HrAssessmentQuestion;
use App\Models\HrAssessmentSession;
use App\Models\HrAssessmentSessionQuestion;
use App\Models\InductionAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HrAssessmentController extends Controller
{
    private const PASSING_PERCENTAGE = 80;
    private const QUESTION_COUNT = 30;

    public function index()
    {
        $user = Auth::user();

        HrAssessmentSession::where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->where('started_at', '<=', now()->subSeconds(HrAssessmentSession::DURATION_SECONDS))
            ->get()
            ->each->autoExpire();

        $sessions = HrAssessmentSession::where('user_id', $user->id)
            ->latest()
            ->paginate(10);

        return Inertia::render('hr-assessment/index', [
            'sessions' => $sessions,
            'question_count' => self::QUESTION_COUNT,
        ]);
    }

    public function start()
    {
        $user = Auth::user();

        $questions = HrAssessmentQuestion::inRandomOrder()
            ->limit(self::QUESTION_COUNT)
            ->get();

        $session = DB::transaction(function () use ($user, $questions) {
            $session = HrAssessmentSession::create([
                'user_id' => $user->id,
                'status' => 'in_progress',
                'total_questions' => $questions->count(),
                'started_at' => now(),
            ]);

            foreach ($questions->values() as $index => $question) {
                HrAssessmentSessionQuestion::create([
                    'hr_assessment_session_id' => $session->id,
                    'hr_assessment_question_id' => $question->id,
                    'urutan' => $index + 1,
                ]);
            }

            return $session;
        });

        return redirect()->route('hr-assessment.quiz', $session);
    }

    public function quiz(HrAssessmentSession $session)
    {
        $user = Auth::user();
        abort_unless($session->user_id === $user->id, 403);

        if ($session->isExpired()) {
            $session->autoExpire();
        }

        if ($session->status === 'completed') {
            return redirect()->route('hr-assessment.result', $session);
        }

        $session->load(['sessionQuestions.question']);

        $questions = $session->sessionQuestions->map(fn($sq) => [
            'session_question_id' => $sq->id,
            'urutan' => $sq->urutan,
            'question' => $sq->question->question,
            'jawaban_1' => $sq->question->jawaban_1,
            'jawaban_2' => $sq->question->jawaban_2,
            'jawaban_3' => $sq->question->jawaban_3,
            'jawaban_4' => $sq->question->jawaban_4,
            'jawaban_user' => $sq->jawaban_user,
        ]);

        return Inertia::render('hr-assessment/quiz', [
            'session' => [
                'id' => $session->id,
                'total_questions' => $session->total_questions,
                'started_at' => $session->started_at->toIso8601String(),
            ],
            'questions' => $questions,
        ]);
    }

    public function submit(Request $request, HrAssessmentSession $session)
    {
        $user = Auth::user();
        abort_unless($session->user_id === $user->id, 403);
        abort_if($session->status === 'completed', 403);

        $answers = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['nullable', 'integer', 'min:1', 'max:4'],
        ])['answers'];

        DB::transaction(function () use ($session, $answers) {
            $score = 0;

            foreach ($session->sessionQuestions as $sq) {
                $jawabanUser = $answers[$sq->id] ?? null;
                $isCorrect = $jawabanUser !== null
                    && (int) $jawabanUser === (int) $sq->question->jawaban_benar;

                $sq->update([
                    'jawaban_user' => $jawabanUser,
                    'is_correct' => $isCorrect,
                ]);

                if ($isCorrect) $score++;
            }

            $percentage = $session->total_questions > 0
                ? round(($score / $session->total_questions) * 100, 2)
                : 0;

            $session->update([
                'status' => 'completed',
                'score' => $score,
                'percentage' => $percentage,
                'passed' => $percentage >= self::PASSING_PERCENTAGE,
                'completed_at' => now(),
            ]);

            if ($percentage >= self::PASSING_PERCENTAGE) {
                InductionAttendance::firstOrCreate(
                    ['user_id' => $session->user_id, 'type' => 'hr'],
                    [
                        'assessment_session_id' => $session->id,
                        'assessment_session_type' => 'hr',
                        'attended_at' => now(),
                    ]
                );
            }
        });

        return redirect()->route('hr-assessment.result', $session);
    }

    public function result(HrAssessmentSession $session)
    {
        $user = Auth::user();
        abort_unless($session->user_id === $user->id, 403);
        abort_unless($session->status === 'completed', 403);

        $session->load(['sessionQuestions.question']);

        $review = $session->sessionQuestions->map(fn($sq) => [
            'urutan' => $sq->urutan,
            'question' => $sq->question->question,
            'jawaban_1' => $sq->question->jawaban_1,
            'jawaban_2' => $sq->question->jawaban_2,
            'jawaban_3' => $sq->question->jawaban_3,
            'jawaban_4' => $sq->question->jawaban_4,
            'jawaban_benar' => $sq->question->jawaban_benar,
            'jawaban_user' => $sq->jawaban_user,
            'is_correct' => $sq->is_correct,
        ]);

        $attendance = InductionAttendance::where('user_id', $user->id)
            ->where('type', 'hr')
            ->first();

        return Inertia::render('hr-assessment/result', [
            'session' => [
                'id' => $session->id,
                'score' => $session->score,
                'total_questions' => $session->total_questions,
                'percentage' => $session->percentage,
                'passed' => $session->passed,
                'completed_at' => $session->completed_at,
            ],
            'review' => $review,
            'attendance' => $attendance ? [
                'recorded' => true,
                'attended_at' => $attendance->attended_at->toIso8601String(),
                'is_new' => $attendance->assessment_session_id === $session->id,
            ] : null,
        ]);
    }
}
