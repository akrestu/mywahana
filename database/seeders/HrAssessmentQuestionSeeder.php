<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HrAssessmentQuestion;
use PhpOffice\PhpSpreadsheet\IOFactory;

class HrAssessmentQuestionSeeder extends Seeder
{
    private const ANSWER_MAP = ['A' => 1, 'B' => 2, 'C' => 3, 'D' => 4];

    public function run(): void
    {
        \DB::statement('SET FOREIGN_KEY_CHECKS=0');
        HrAssessmentQuestion::truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $path = base_path('template/20261106_Bank_Soal_HR_Assessment.xlsx');
        $spreadsheet = IOFactory::load($path);

        // Sheet 0 = "Bank Soal HR Assessment WBK"
        // Columns: A=No, B=Pertanyaan, C=Pilihan A, D=Pilihan B, E=Pilihan C, F=Pilihan D, G=Kunci Jawaban
        $sheet = $spreadsheet->getSheet(0);
        $rows = $sheet->toArray(null, true, true, false);

        $inserted = 0;

        foreach ($rows as $i => $row) {
            if ($i === 0) continue; // skip header

            $question   = trim((string) ($row[1] ?? ''));
            $jawaban1   = trim((string) ($row[2] ?? ''));
            $jawaban2   = trim((string) ($row[3] ?? ''));
            $jawaban3   = trim((string) ($row[4] ?? ''));
            $jawaban4   = trim((string) ($row[5] ?? ''));
            $kunciRaw   = strtoupper(trim((string) ($row[6] ?? '')));
            $keterangan = trim((string) ($row[7] ?? '')) ?: null;

            if (empty($question)) continue;
            if (! isset(self::ANSWER_MAP[$kunciRaw])) continue;

            $jawabanBenar = self::ANSWER_MAP[$kunciRaw];

            HrAssessmentQuestion::create([
                'question'      => $question,
                'jawaban_benar' => $jawabanBenar,
                'jawaban_1'     => $jawaban1,
                'jawaban_2'     => $jawaban2,
                'jawaban_3'     => $jawaban3,
                'jawaban_4'     => $jawaban4,
                'keterangan'    => $keterangan,
            ]);

            $inserted++;
        }

        $this->command->info("Imported {$inserted} HR assessment questions.");
    }
}
