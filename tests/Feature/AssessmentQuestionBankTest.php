<?php

use App\Exports\AssessmentQuestionBankExport;
use App\Exports\AssessmentQuestionImportTemplate;
use App\Exports\HrAssessmentQuestionBankExport;
use App\Exports\HrAssessmentQuestionImportTemplate;
use App\Imports\AssessmentQuestionImport;
use App\Imports\HrAssessmentQuestionImport;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSession;
use App\Models\AssessmentSessionQuestion;
use App\Models\HrAssessmentQuestion;
use App\Models\InductionAttendance;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

function safetyQuestion(string $question): AssessmentQuestion
{
    return AssessmentQuestion::create([
        'departemen' => 'Production', 'tags' => 'S', 'question' => $question,
        'jawaban_1' => 'A', 'jawaban_2' => 'B', 'jawaban_3' => 'C', 'jawaban_4' => 'D',
        'jawaban_benar' => 1,
    ]);
}

function hrQuestion(string $question): HrAssessmentQuestion
{
    return HrAssessmentQuestion::create([
        'question' => $question, 'jawaban_1' => 'A', 'jawaban_2' => 'B',
        'jawaban_3' => 'C', 'jawaban_4' => 'D', 'jawaban_benar' => 1,
    ]);
}

function editedWorkbook(object $export, string $cell, string $question, ?int $id = null): string
{
    $path = tempnam(sys_get_temp_dir(), 'assessment-import-').'.xlsx';
    file_put_contents($path, Excel::raw($export, ExcelFormat::XLSX));
    $workbook = IOFactory::load($path);
    if ($id !== null) {
        $workbook->getActiveSheet()->setCellValue('A2', $id);
    }
    $workbook->getActiveSheet()->setCellValue($cell, $question);
    IOFactory::createWriter($workbook, 'Xlsx')->save($path);
    $workbook->disconnectWorksheets();

    return $path;
}

test('safety export and template can update an existing question by ID', function () {
    $question = safetyQuestion('Pertanyaan lama');

    foreach ([
        [new AssessmentQuestionBankExport, 'D2', 'Diedit melalui export', null],
        [new AssessmentQuestionImportTemplate, 'D2', 'Diedit melalui template', $question->id],
    ] as [$export, $cell, $value, $id]) {
        $path = editedWorkbook($export, $cell, $value, $id);
        try {
            $import = new AssessmentQuestionImport;
            Excel::import($import, $path, null, ExcelFormat::XLSX);
            expect($import->updated)->toBe(1);
            expect($import->created)->toBe(0);
            expect($question->fresh()->question)->toBe($value);
        } finally {
            unlink($path);
        }
    }
});

test('HR export and template can update an existing question by ID', function () {
    $question = hrQuestion('Pertanyaan lama');

    foreach ([
        [new HrAssessmentQuestionBankExport, 'B2', 'Diedit melalui export', null],
        [new HrAssessmentQuestionImportTemplate, 'B2', 'Diedit melalui template', $question->id],
    ] as [$export, $cell, $value, $id]) {
        $path = editedWorkbook($export, $cell, $value, $id);
        try {
            $import = new HrAssessmentQuestionImport;
            Excel::import($import, $path, null, ExcelFormat::XLSX);
            expect($import->updated)->toBe(1);
            expect($import->created)->toBe(0);
            expect($question->fresh()->question)->toBe($value);
        } finally {
            unlink($path);
        }
    }
});

test('batch delete only removes selected safety and HR questions', function () {
    $admin = new User(['name' => 'Admin', 'is_admin' => true]);
    $admin->id = 1;
    $safetySelected = safetyQuestion('Safety terpilih');
    $safetyKept = safetyQuestion('Safety disimpan');
    $hrSelected = hrQuestion('HR terpilih');
    $hrKept = hrQuestion('HR disimpan');

    $this->actingAs($admin)
        ->delete(route('admin.assessment.questions.batch-destroy'), ['ids' => [$safetySelected->id]])
        ->assertRedirect();
    $this->actingAs($admin)
        ->delete(route('admin.hr-assessment.questions.batch-destroy'), ['ids' => [$hrSelected->id]])
        ->assertRedirect();

    expect($safetySelected->fresh())->toBeNull();
    expect($hrSelected->fresh())->toBeNull();
    expect($safetyKept->fresh())->not->toBeNull();
    expect($hrKept->fresh())->not->toBeNull();
});

test('batch delete rejects unknown IDs without removing valid questions', function () {
    $admin = new User(['name' => 'Admin', 'is_admin' => true]);
    $admin->id = 1;
    $safety = safetyQuestion('Tetap ada');
    $hr = hrQuestion('Tetap ada');

    $this->actingAs($admin)
        ->delete(route('admin.assessment.questions.batch-destroy'), ['ids' => [$safety->id, 99999]])
        ->assertSessionHasErrors('ids.1');
    $this->actingAs($admin)
        ->delete(route('admin.hr-assessment.questions.batch-destroy'), ['ids' => [$hr->id, 99999]])
        ->assertSessionHasErrors('ids.1');

    expect($safety->fresh())->not->toBeNull();
    expect($hr->fresh())->not->toBeNull();
});

test('assessment session keeps its question snapshot after the bank question changes or is deleted', function () {
    $employee = User::factory()->create();
    $question = safetyQuestion('Pertanyaan asli');
    $session = AssessmentSession::create([
        'user_id' => $employee->id, 'departemen' => 'Production', 'tags' => 'S',
        'status' => 'in_progress', 'total_questions' => 1, 'started_at' => now(),
    ]);
    $sessionQuestion = AssessmentSessionQuestion::create([
        'assessment_session_id' => $session->id,
        'assessment_question_id' => $question->id,
        'urutan' => 1,
        'question_snapshot' => $question->question,
        'jawaban_1_snapshot' => $question->jawaban_1,
        'jawaban_2_snapshot' => $question->jawaban_2,
        'jawaban_3_snapshot' => $question->jawaban_3,
        'jawaban_4_snapshot' => $question->jawaban_4,
        'jawaban_benar_snapshot' => $question->jawaban_benar,
    ]);

    $question->update(['question' => 'Pertanyaan baru', 'jawaban_benar' => 2]);
    expect($sessionQuestion->fresh()->questionText())->toBe('Pertanyaan asli');
    expect($sessionQuestion->fresh()->correctAnswer())->toBe(1);

    $question->delete();
    expect($sessionQuestion->fresh())->not->toBeNull();
    expect($sessionQuestion->fresh()->assessment_question_id)->toBeNull();
    expect($sessionQuestion->fresh()->questionText())->toBe('Pertanyaan asli');
});

test('expired assessment submissions are auto-completed without accepting late answers', function () {
    $employee = User::factory()->create(['is_admin' => false]);
    $question = safetyQuestion('Pertanyaan');
    $session = AssessmentSession::create([
        'user_id' => $employee->id, 'departemen' => 'Production', 'tags' => 'S',
        'status' => 'in_progress', 'total_questions' => 1,
        'started_at' => now()->subSeconds(AssessmentSession::DURATION_SECONDS + 30),
    ]);
    $sessionQuestion = AssessmentSessionQuestion::create([
        'assessment_session_id' => $session->id, 'assessment_question_id' => $question->id,
        'urutan' => 1, 'question_snapshot' => $question->question,
        'jawaban_1_snapshot' => 'A', 'jawaban_2_snapshot' => 'B',
        'jawaban_3_snapshot' => 'C', 'jawaban_4_snapshot' => 'D', 'jawaban_benar_snapshot' => 1,
    ]);

    $this->actingAs($employee)
        ->post(route('assessment.submit', $session), ['answers' => [$sessionQuestion->id => 1]])
        ->assertRedirect(route('assessment.result', $session));

    expect($session->fresh()->status)->toBe('completed');
    expect($session->fresh()->score)->toBe(0);
    expect($sessionQuestion->fresh()->jawaban_user)->toBeNull();
});

test('deleting the first passing session moves induction attendance to another passing session', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $employee = User::factory()->create(['is_admin' => false]);
    $first = AssessmentSession::create([
        'user_id' => $employee->id, 'departemen' => 'Production', 'tags' => 'S', 'status' => 'completed',
        'total_questions' => 1, 'score' => 1, 'percentage' => 100, 'passed' => true,
        'started_at' => now()->subDays(2), 'completed_at' => now()->subDays(2),
    ]);
    $replacement = AssessmentSession::create([
        'user_id' => $employee->id, 'departemen' => 'Production', 'tags' => 'S', 'status' => 'completed',
        'total_questions' => 1, 'score' => 1, 'percentage' => 100, 'passed' => true,
        'started_at' => now()->subDay(), 'completed_at' => now()->subDay(),
    ]);
    InductionAttendance::create([
        'user_id' => $employee->id, 'type' => 'safety', 'assessment_session_id' => $first->id,
        'assessment_session_type' => 'safety', 'attended_at' => $first->completed_at,
    ]);

    $this->actingAs($admin)->delete(route('admin.assessment.destroy', $first))->assertRedirect();

    expect($first->fresh())->toBeNull();
    expect(InductionAttendance::where('user_id', $employee->id)->where('type', 'safety')->value('assessment_session_id'))
        ->toBe($replacement->id);
});

test('snapshot migration can be rolled back and applied again on SQLite', function () {
    if (config('database.default') !== 'sqlite') {
        $this->markTestSkipped('This assertion covers the SQLite migration path.');
    }

    $migrationPath = database_path('migrations/2026_09_16_000000_snapshot_assessment_session_questions.php');
    $migration = require $migrationPath;

    $migration->down();

    expect(Schema::hasColumn('assessment_session_questions', 'question_snapshot'))->toBeFalse();
    expect(Schema::hasColumn('hr_assessment_session_questions', 'question_snapshot'))->toBeFalse();

    $migration->up();

    expect(Schema::hasColumn('assessment_session_questions', 'question_snapshot'))->toBeTrue();
    expect(Schema::hasColumn('hr_assessment_session_questions', 'question_snapshot'))->toBeTrue();
});
