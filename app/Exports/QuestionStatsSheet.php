<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class QuestionStatsSheet implements FromArray, WithHeadings, WithTitle, ShouldAutoSize, WithColumnWidths
{
    /**
     * @param array<int, array<int, mixed>> $rows
     */
    public function __construct(
        private readonly string $title,
        private readonly array $rows,
        private readonly bool $withTags = false,
    ) {}

    public function title(): string
    {
        // Excel: judul sheet maksimal 31 karakter dan tanpa karakter khusus
        $clean = preg_replace('/[\\\\\/\?\*\[\]:]/', '-', $this->title);

        return mb_substr($clean !== '' ? $clean : 'Sheet', 0, 31);
    }

    public function headings(): array
    {
        return array_values(array_filter([
            'No',
            'Pertanyaan',
            $this->withTags ? 'Tags' : null,
            'Ditampilkan',
            'Dijawab',
            'Benar',
            'Salah',
            '% Benar',
            'Tingkat Kesulitan',
        ]));
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function columnWidths(): array
    {
        // Kolom pertanyaan dibatasi agar sheet tetap terbaca
        return ['B' => 80];
    }
}
