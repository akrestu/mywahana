<?php

namespace App\Http\Controllers;

use App\Exports\AssessmentQuestionBankExport;
use App\Exports\AssessmentQuestionImportTemplate;
use App\Imports\AssessmentQuestionImport;
use App\Models\AssessmentQuestion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AssessmentQuestionController extends Controller
{
    private const VALID_DEPARTEMEN = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA'];

    private const ANSWER_MAP = ['A' => 1, 'B' => 2, 'C' => 3, 'D' => 4];

    public function index(Request $request)
    {
        $query = AssessmentQuestion::query()->orderBy('departemen')->orderBy('tags')->orderBy('id');

        if ($request->filled('search')) {
            $query->where('question', 'like', "%{$request->search}%");
        }

        if ($request->filled('departemen')) {
            $query->where('departemen', $request->departemen);
        }

        if ($request->filled('tags')) {
            $query->where('tags', $request->tags);
        }

        return Inertia::render('admin/assessment-questions', [
            'questions' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only(['search', 'departemen', 'tags']),
            'departemenOptions' => self::VALID_DEPARTEMEN,
        ]);
    }

    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'departemen' => ['required', Rule::in(self::VALID_DEPARTEMEN)],
            'tags' => ['required', Rule::in(['S', 'NS'])],
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
        AssessmentQuestion::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil ditambahkan.']);

        return back();
    }

    public function update(Request $request, AssessmentQuestion $assessmentQuestion)
    {
        $assessmentQuestion->update($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil diperbarui.']);

        return back();
    }

    public function destroy(AssessmentQuestion $assessmentQuestion)
    {
        $assessmentQuestion->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Soal berhasil dihapus.']);

        return back();
    }

    public function batchDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer', 'distinct', 'exists:assessment_questions,id'],
        ]);

        $count = AssessmentQuestion::whereIn('id', $validated['ids'])->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$count} soal berhasil dihapus."]);

        return back();
    }

    public function export()
    {
        return Excel::download(
            new AssessmentQuestionBankExport,
            'bank-soal-assessment-safety-'.now()->format('Ymd').'.xlsx',
        );
    }

    public function importTemplate()
    {
        return Excel::download(new AssessmentQuestionImportTemplate, 'template-import-soal-safety.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:2048'],
        ]);

        $import = new AssessmentQuestionImport;
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
