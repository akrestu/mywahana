<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AssessmentQuestion;
use PhpOffice\PhpSpreadsheet\IOFactory;

class AssessmentQuestionSeeder extends Seeder
{
    public function run(): void
    {
        \DB::statement('SET FOREIGN_KEY_CHECKS=0');
        AssessmentQuestion::truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $path = base_path('template/20261106_Bank_Soal_Safety_Assessment.xlsx');
        $spreadsheet = IOFactory::load($path);

        // Sheet 2 = "Master - Semua Soal" (index 1)
        $sheet = $spreadsheet->getSheet(1);
        $rows = $sheet->toArray(null, true, true, false);

        $validDepts = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA'];
        $inserted = 0;

        foreach ($rows as $i => $row) {
            if ($i === 0) continue; // skip header

            $departemen = trim((string) ($row[1] ?? ''));
            $tags       = strtoupper(trim((string) ($row[2] ?? '')));
            $question   = trim((string) ($row[3] ?? ''));
            $jawabanBenar = (int) ($row[4] ?? 0);
            $jawaban1   = trim((string) ($row[5] ?? ''));
            $jawaban2   = trim((string) ($row[6] ?? ''));
            $jawaban3   = trim((string) ($row[7] ?? ''));
            $jawaban4   = trim((string) ($row[8] ?? ''));
            $keterangan = trim((string) ($row[9] ?? '')) ?: null;

            if (! in_array($departemen, $validDepts)) continue;
            if (! in_array($tags, ['S', 'NS'])) continue;
            if (empty($question) || $jawabanBenar < 1 || $jawabanBenar > 4) continue;

            AssessmentQuestion::create([
                'departemen'   => $departemen,
                'tags'         => $tags,
                'question'     => $question,
                'jawaban_benar' => $jawabanBenar,
                'jawaban_1'    => $jawaban1,
                'jawaban_2'    => $jawaban2,
                'jawaban_3'    => $jawaban3,
                'jawaban_4'    => $jawaban4,
                'keterangan'   => $keterangan,
            ]);

            $inserted++;
        }

        $this->command->info("Imported {$inserted} assessment questions.");
    }
}
