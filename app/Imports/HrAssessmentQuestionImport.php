<?php

namespace App\Imports;

use App\Models\HrAssessmentQuestion;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class HrAssessmentQuestionImport implements ToModel, WithHeadingRow, WithChunkReading, SkipsOnError
{
    use SkipsErrors;

    private const ANSWER_MAP = ['A' => 1, 'B' => 2, 'C' => 3, 'D' => 4];

    public int $created = 0;
    public int $updated = 0;
    public int $skipped = 0;

    public function chunkSize(): int
    {
        return 50;
    }

    /** Find the value of the first column whose heading slug starts with $prefix. */
    private function byPrefix(array $row, string $prefix): ?string
    {
        $key = collect(array_keys($row))->first(fn ($k) => str_starts_with($k, $prefix));

        if ($key === null || $row[$key] === null) {
            return null;
        }

        return trim((string) $row[$key]);
    }

    public function model(array $row): ?HrAssessmentQuestion
    {
        $id         = $this->byPrefix($row, 'id');
        $question   = $this->byPrefix($row, 'pertanyaan') ?? $this->byPrefix($row, 'question');
        $jawaban1   = $this->byPrefix($row, 'pilihan_a');
        $jawaban2   = $this->byPrefix($row, 'pilihan_b');
        $jawaban3   = $this->byPrefix($row, 'pilihan_c');
        $jawaban4   = $this->byPrefix($row, 'pilihan_d');
        $kunciRaw   = strtoupper((string) $this->byPrefix($row, 'kunci'));
        $keterangan = $this->byPrefix($row, 'keterangan') ?: null;

        if (
            empty($question)
            || empty($jawaban1) || empty($jawaban2) || empty($jawaban3) || empty($jawaban4)
            || ! isset(self::ANSWER_MAP[$kunciRaw])
        ) {
            $this->skipped++;

            return null;
        }

        $attributes = [
            'question'      => $question,
            'jawaban_benar' => self::ANSWER_MAP[$kunciRaw],
            'jawaban_1'     => $jawaban1,
            'jawaban_2'     => $jawaban2,
            'jawaban_3'     => $jawaban3,
            'jawaban_4'     => $jawaban4,
            'keterangan'    => $keterangan,
        ];

        if (! empty($id)) {
            $existing = HrAssessmentQuestion::find((int) $id);

            if (! $existing) {
                $this->skipped++;

                return null;
            }

            $existing->update($attributes);
            $this->updated++;

            return null;
        }

        HrAssessmentQuestion::create($attributes);
        $this->created++;

        return null;
    }
}
