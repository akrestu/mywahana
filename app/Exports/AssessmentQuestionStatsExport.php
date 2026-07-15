<?php

namespace App\Exports;

use App\Models\AssessmentQuestion;
use App\Models\AssessmentSessionQuestion;
use App\Models\HrAssessmentQuestion;
use App\Models\HrAssessmentSessionQuestion;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AssessmentQuestionStatsExport implements WithMultipleSheets
{
    public function __construct(private readonly bool $isHr = false) {}

    public function sheets(): array
    {
        return $this->isHr ? $this->hrSheets() : $this->safetySheets();
    }

    /** Satu sheet per departemen soal. */
    private function safetySheets(): array
    {
        $stats = AssessmentSessionQuestion::query()
            ->selectRaw('assessment_question_id, COUNT(*) as ditampilkan, SUM(CASE WHEN jawaban_user IS NOT NULL THEN 1 ELSE 0 END) as dijawab, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as benar')
            ->groupBy('assessment_question_id')
            ->get()
            ->keyBy('assessment_question_id');

        return AssessmentQuestion::orderBy('departemen')->orderBy('id')->get()
            ->groupBy(fn ($q) => $q->departemen ?: 'Tanpa Departemen')
            ->map(fn (Collection $questions, string $departemen) => new QuestionStatsSheet(
                $departemen,
                $this->buildRows($questions, $stats, withTags: true),
                withTags: true,
            ))
            ->values()
            ->all();
    }

    /** Soal HR tidak ber-departemen — satu sheet saja. */
    private function hrSheets(): array
    {
        $stats = HrAssessmentSessionQuestion::query()
            ->selectRaw('hr_assessment_question_id, COUNT(*) as ditampilkan, SUM(CASE WHEN jawaban_user IS NOT NULL THEN 1 ELSE 0 END) as dijawab, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as benar')
            ->groupBy('hr_assessment_question_id')
            ->get()
            ->keyBy('hr_assessment_question_id');

        $questions = HrAssessmentQuestion::orderBy('id')->get();

        return [new QuestionStatsSheet('Semua Soal', $this->buildRows($questions, $stats))];
    }

    private function buildRows(Collection $questions, Collection $stats, bool $withTags = false): array
    {
        $no = 0;

        return $questions->map(function ($question) use ($stats, $withTags, &$no) {
            $no++;
            $stat = $stats->get($question->id);
            $ditampilkan = (int) ($stat->ditampilkan ?? 0);
            $dijawab = (int) ($stat->dijawab ?? 0);
            $benar = (int) ($stat->benar ?? 0);
            $pct = $ditampilkan > 0 ? round($benar / $ditampilkan * 100, 1) : null;

            return array_values(array_filter([
                'no'          => $no,
                'pertanyaan'  => $question->question,
                'tags'        => $withTags ? ($question->tags ?? '') : null,
                'ditampilkan' => $ditampilkan,
                'dijawab'     => $dijawab,
                'benar'       => $benar,
                'salah'       => $ditampilkan - $benar,
                'pct'         => $pct ?? '-',
                'kesulitan'   => $this->difficulty($pct),
            ], fn ($v) => $v !== null));
        })->all();
    }

    private function difficulty(?float $pct): string
    {
        if ($pct === null) {
            return 'Belum diujikan';
        }

        return match (true) {
            $pct >= 80 => 'Mudah',
            $pct >= 50 => 'Sedang',
            default    => 'Sulit',
        };
    }
}
