<?php

namespace App\Http\Controllers;

use App\Models\AssessmentQuestion;
use App\Models\AssessmentSession;
use App\Models\AssessmentSessionQuestion;
use App\Models\InductionAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssessmentController extends Controller
{
    private const PASSING_PERCENTAGE = 80;
    private const STAFF_QUESTION_COUNT = 30;
    private const NS_QUESTION_COUNT = 25;

    public function index()
    {
        $user = Auth::user();

        $sessions = AssessmentSession::where('user_id', $user->id)
            ->latest()
            ->paginate(10);

        return Inertia::render('assessment/index', [
            'sessions' => $sessions,
            'user' => [
                'departemen' => $user->departemen,
                'tags' => $user->departemen ? $this->resolveTag($user) : null,
                'question_count' => $user->departemen ? $this->resolveQuestionCount($user) : null,
            ],
            'profile_incomplete' => ! $user->departemen,
        ]);
    }

    public function start(Request $request)
    {
        $user = Auth::user();

        abort_unless((bool) $user->departemen, 403, 'Departemen belum diisi.');

        $todaySession = AssessmentSession::where('user_id', $user->id)
            ->whereDate('started_at', today())
            ->first();

        if ($todaySession) {
            if ($todaySession->status === 'in_progress' && ! $todaySession->isExpired()) {
                return redirect()->route('assessment.quiz', $todaySession);
            }
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Kamu sudah mengikuti assessment hari ini.']);
            return redirect()->route('assessment.index');
        }

        $tags = $this->resolveTag($user);
        $needed = $this->resolveQuestionCount($user);

        // Pick questions: prioritize matching tags, supplement from opposite tag if short
        $questions = AssessmentQuestion::where('departemen', $user->departemen)
            ->where('tags', $tags)
            ->inRandomOrder()
            ->get();

        if ($questions->count() < $needed) {
            $otherTag = $tags === 'S' ? 'NS' : 'S';
            $shortfall = $needed - $questions->count();
            $extra = AssessmentQuestion::where('departemen', $user->departemen)
                ->where('tags', $otherTag)
                ->inRandomOrder()
                ->limit($shortfall)
                ->get();
            $questions = $questions->concat($extra)->shuffle();
        } else {
            $questions = $questions->take($needed);
        }

        abort_if($questions->isEmpty(), 422, 'Belum ada soal tersedia untuk departemen dan level Anda. Hubungi admin HSE.');

        $session = DB::transaction(function () use ($user, $tags, $needed, $questions) {
            $session = AssessmentSession::create([
                'user_id' => $user->id,
                'departemen' => $user->departemen,
                'tags' => $tags,
                'status' => 'in_progress',
                'total_questions' => $questions->count(),
                'started_at' => now(),
            ]);

            foreach ($questions->values() as $index => $question) {
                AssessmentSessionQuestion::create([
                    'assessment_session_id' => $session->id,
                    'assessment_question_id' => $question->id,
                    'urutan' => $index + 1,
                ]);
            }

            return $session;
        });

        return redirect()->route('assessment.quiz', $session);
    }

    public function quiz(AssessmentSession $session)
    {
        $user = Auth::user();
        abort_unless($session->user_id === $user->id, 403);

        if ($session->isExpired()) {
            $session->autoExpire();
        }

        if ($session->status === 'completed') {
            return redirect()->route('assessment.result', $session);
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

        return Inertia::render('assessment/quiz', [
            'session' => [
                'id' => $session->id,
                'departemen' => $session->departemen,
                'tags' => $session->tags,
                'total_questions' => $session->total_questions,
                'started_at' => $session->started_at->toIso8601String(),
            ],
            'questions' => $questions,
        ]);
    }

    public function submit(Request $request, AssessmentSession $session)
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
                    ['user_id' => $session->user_id, 'type' => 'safety'],
                    [
                        'assessment_session_id' => $session->id,
                        'assessment_session_type' => 'safety',
                        'attended_at' => now(),
                    ]
                );
            }
        });

        return redirect()->route('assessment.result', $session);
    }

    public function result(AssessmentSession $session)
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
            ->where('type', 'safety')
            ->first();

        return Inertia::render('assessment/result', [
            'session' => [
                'id' => $session->id,
                'departemen' => $session->departemen,
                'tags' => $session->tags,
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

    private function resolveTag($user): string
    {
        return in_array($user->participation_level, ['staff', 'srstaff']) ? 'S' : 'NS';
    }

    private function resolveQuestionCount($user): int
    {
        return in_array($user->participation_level, ['staff', 'srstaff'])
            ? self::STAFF_QUESTION_COUNT
            : self::NS_QUESTION_COUNT;
    }
}
