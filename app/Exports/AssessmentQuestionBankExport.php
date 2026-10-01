<?php

namespace App\Exports;

use App\Models\AssessmentQuestion;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AssessmentQuestionBankExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping
{
    private const ANSWER_LETTER = [1 => 'A', 2 => 'B', 3 => 'C', 4 => 'D'];

    public function collection(): Collection
    {
        return AssessmentQuestion::orderBy('departemen')->orderBy('tags')->orderBy('id')->get();
    }

    public function headings(): array
    {
        return ['ID', 'Departemen', 'Tags', 'Pertanyaan', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Kunci Jawaban', 'Keterangan'];
    }

    public function map($question): array
    {
        return [
            $question->id,
            $question->departemen,
            $question->tags,
            $question->question,
            $question->jawaban_1,
            $question->jawaban_2,
            $question->jawaban_3,
            $question->jawaban_4,
            self::ANSWER_LETTER[$question->jawaban_benar] ?? '',
            $question->keterangan,
        ];
    }
}
