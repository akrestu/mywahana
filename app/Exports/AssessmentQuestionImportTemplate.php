<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AssessmentQuestionImportTemplate implements FromArray, ShouldAutoSize, WithHeadings
{
    public function array(): array
    {
        return [
            [
                '', 'Production', 'S', 'Contoh pertanyaan assessment safety?',
                'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'A', 'Penjelasan jawaban (opsional)',
            ],
        ];
    }

    public function headings(): array
    {
        return [
            'id (kosongkan untuk soal baru)',
            'departemen (Production/Maintenance/Supply Chain/Engineering/HSE/HRGA)',
            'tags (S/NS)',
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
