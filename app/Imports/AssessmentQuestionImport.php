<?php

namespace App\Imports;

use App\Models\AssessmentQuestion;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class AssessmentQuestionImport implements ToModel, WithHeadingRow, WithChunkReading, SkipsOnError
{
    use SkipsErrors;

    private const VALID_DEPARTEMEN = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA'];
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

    public function model(array $row): ?AssessmentQuestion
    {
        $id         = $this->byPrefix($row, 'id');
        $departemen = $this->byPrefix($row, 'departemen');
        $tags       = strtoupper((string) $this->byPrefix($row, 'tags'));
        $question   = $this->byPrefix($row, 'pertanyaan') ?? $this->byPrefix($row, 'question');
        $jawaban1   = $this->byPrefix($row, 'pilihan_a');
        $jawaban2   = $this->byPrefix($row, 'pilihan_b');
        $jawaban3   = $this->byPrefix($row, 'pilihan_c');
        $jawaban4   = $this->byPrefix($row, 'pilihan_d');
        $kunciRaw   = strtoupper((string) $this->byPrefix($row, 'kunci'));
        $keterangan = $this->byPrefix($row, 'keterangan') ?: null;

        if (
            ! in_array($departemen, self::VALID_DEPARTEMEN, true)
            || ! in_array($tags, ['S', 'NS'], true)
            || empty($question)
            || empty($jawaban1) || empty($jawaban2) || empty($jawaban3) || empty($jawaban4)
            || ! isset(self::ANSWER_MAP[$kunciRaw])
        ) {
            $this->skipped++;

            return null;
        }

        $attributes = [
            'departemen'    => $departemen,
            'tags'          => $tags,
            'question'      => $question,
            'jawaban_benar' => self::ANSWER_MAP[$kunciRaw],
            'jawaban_1'     => $jawaban1,
            'jawaban_2'     => $jawaban2,
            'jawaban_3'     => $jawaban3,
            'jawaban_4'     => $jawaban4,
            'keterangan'    => $keterangan,
        ];

        if (! empty($id)) {
            $existing = AssessmentQuestion::find((int) $id);

            if (! $existing) {
                $this->skipped++;

                return null;
            }

            $existing->update($attributes);
            $this->updated++;

            return null;
        }

        AssessmentQuestion::create($attributes);
        $this->created++;

        return null;
    }
}
