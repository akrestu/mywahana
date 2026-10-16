<?php

namespace App\Http\Controllers\Admin\Assessment;

use App\Models\HrAssessmentSession;
use App\Models\HrAssessmentSessionQuestion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HrAssessmentController extends AssessmentResultController
{
    protected function sessionModel(): string
    {
        return HrAssessmentSession::class;
    }

    protected function sessionQuestionModel(): string
    {
        return HrAssessmentSessionQuestion::class;
    }

    protected function sessionForeignKey(): string
    {
        return 'hr_assessment_session_id';
    }

    protected function inductionType(): string
    {
        return 'hr';
    }

    protected function label(): string
    {
        return 'HR assessment';
    }

    protected function userColumns(): string
    {
        return 'id,name,nik,jabatan,site';
    }

    protected function exportFilename(): string
    {
        return 'assessment-hr';
    }

    public function index(Request $request)
    {
        $userColumns = ['id', 'name', 'nik', 'jabatan', 'site'];

        return Inertia::render('admin/hr-assessment', [
            'records' => $this->listQuery($request)->paginate(20)->withQueryString(),
            'filters' => $request->only('search', 'passed', 'date_from', 'date_to'),
            'summary' => $this->summary(),
            'monthly_trend' => $this->monthlyTrend(),
            'weak_questions' => $this->weakQuestions('hr_assessment_question_id', 'id,question', fn () => []),
            'uncovered_users' => $this->uncoveredUsers($userColumns, ['name']),
            'attendance_summary' => $this->attendanceSummary($userColumns, ['name']),
        ]);
    }
}
