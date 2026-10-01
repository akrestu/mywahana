<?php

namespace App\Http\Controllers;

use App\Exports\HrAssessmentQuestionBankExport;
use App\Exports\HrAssessmentQuestionImportTemplate;
use App\Imports\HrAssessmentQuestionImport;
use App\Models\HrAssessmentQuestion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class HrAssessmentQuestionController extends Controller
{
    private const ANSWER_MAP = ['A' => 1, 'B' => 2, 'C' => 3, 'D' => 4];

    public function index(Request $request)
    {
        $query = HrAssessmentQuestion::query()->orderBy('id');

        if ($request->filled('search')) {
            $query->where('question', 'like', "%{$request->search}%");
        }

        return Inertia::render('admin/hr-assessment-questions', [
            'questions' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only(['search']),
        ]);
    }

    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'question' => ['required', 'string'],
            'jawaban_1' => ['required', 'string'],
            'jawaban_2' => ['required', 'string'],
            'jawaban_3' => ['required', 'string'],
            'jawaban_4' => ['required', 'string'],
            'kunci_jawaban' => ['required', Rule::in(['A', 'B', 'C', 'D'])],
            'keterangan' => ['nullable', 'string'],
        ]);

        $validated['jawaban_benar'] = self::ANSWER_MAP[$validated['kunci_jawaban']];
        unset($validated['kunci_jawaban']);

        return $validated;
    }

    public function store(Request $request)
    {
        HrAssessmentQuestion::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil ditambahkan.']);

        return back();
    }

    public function update(Request $request, HrAssessmentQuestion $hrAssessmentQuestion)
    {
        $hrAssessmentQuestion->update($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil diperbarui.']);

        return back();
    }

    public function destroy(HrAssessmentQuestion $hrAssessmentQuestion)
    {
        $hrAssessmentQuestion->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil dihapus.']);

        return back();
    }

    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer', 'distinct', 'exists:hr_assessment_questions,id'],
        ]);

        $count = HrAssessmentQuestion::whereIn('id', $validated['ids'])->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$count} soal berhasil dihapus."]);

        return back();
    }

    public function export()
    {
        return Excel::download(
            new HrAssessmentQuestionBankExport,
            'bank-soal-assessment-hr-'.now()->format('Ymd').'.xlsx',
        );
    }

    public function importTemplate()
    {
        return Excel::download(new HrAssessmentQuestionImportTemplate, 'template-import-soal-hr.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:2048'],
        ]);

        $import = new HrAssessmentQuestionImport;
        Excel::import($import, $request->file('file'));

        $msg = "Import selesai. {$import->created} soal ditambahkan, {$import->updated} soal diperbarui";
        if ($import->skipped > 0) {
            $msg .= ", {$import->skipped} baris dilewati (data tidak valid)";
        }
        $msg .= '.';
        Inertia::flash('toast', ['type' => 'success', 'message' => $msg]);

        return back();
    }
}
