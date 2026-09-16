<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class HrAssessmentQuestionImportTemplate implements FromArray, WithHeadings, ShouldAutoSize
{
    public function array(): array
    {
        return [
            [
                '', 'Contoh pertanyaan HR assessment?',
                'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'A', 'Penjelasan jawaban (opsional)',
            ],
        ];
    }

    public function headings(): array
    {
        return [
            'id (kosongkan untuk soal baru)',
            'pertanyaan*',
            'pilihan a*',
            'pilihan b*',
            'pilihan c*',
            'pilihan d*',
            'kunci jawaban (A/B/C/D)*',
            'keterangan',
        ];
    }
}
