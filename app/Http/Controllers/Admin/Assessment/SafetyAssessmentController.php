<?php

namespace App\Http\Controllers\Admin\Assessment;

use App\Models\AssessmentSession;
use App\Models\AssessmentSessionQuestion;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SafetyAssessmentController extends AssessmentResultController
{
    protected function sessionModel(): string
    {
        return AssessmentSession::class;
    }

    protected function sessionQuestionModel(): string
    {
        return AssessmentSessionQuestion::class;
    }

    protected function sessionForeignKey(): string
    {
        return 'assessment_session_id';
    }

    protected function inductionType(): string
    {
        return 'safety';
    }

    protected function label(): string
    {
        return 'assessment';
    }

    protected function userColumns(): string
    {
        return 'id,name,nik,jabatan,departemen,site';
    }

    protected function exportFilename(): string
    {
        return 'assessment-safety';
    }

    public function index(Request $request)
    {
        $deptStats = AssessmentSession::completed()
            ->selectRaw('departemen, COUNT(*) as total, SUM(passed) as lulus')
            ->groupBy('departemen')
            ->orderBy('departemen')
            ->get()
            ->map(fn ($r) => [
                'departemen' => $r->departemen,
                'total' => (int) $r->total,
                'lulus' => (int) $r->lulus,
                'pass_rate' => $r->total > 0 ? round($r->lulus / $r->total * 100) : 0,
            ]);

        $userColumns = ['id', 'name', 'nik', 'departemen', 'site'];

        return Inertia::render('admin/assessment', [
            'records' => $this->listQuery($request)->paginate(20)->withQueryString(),
            'filters' => $request->only('search', 'departemen', 'passed', 'date_from', 'date_to'),
            'summary' => $this->summary(),
            'dept_stats' => $deptStats,
            'monthly_trend' => $this->monthlyTrend(),
            'weak_questions' => $this->weakQuestions(
                'assessment_question_id',
                'id,question,departemen,tags',
                fn ($r) => ['departemen' => $r->question?->departemen, 'tags' => $r->question?->tags],
            ),
            'uncovered_users' => $this->uncoveredUsers($userColumns, ['departemen', 'name']),
            'attendance_summary' => $this->attendanceSummary($userColumns, ['departemen', 'name']),
        ]);
    }

    protected function listQuery(Request $request): Builder
    {
        $query = parent::listQuery($request);

        if ($request->filled('departemen')) {
            $query->where('departemen', $request->departemen);
        }

        return $query;
    }
}
