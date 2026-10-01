<?php

namespace App\Exports;

use App\Models\AssessmentFeedback;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AssessmentFeedbackExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    private int $no = 0;

    public function __construct(private readonly Builder $query) {}

    public function query()
    {
        return $this->query;
    }

    public function headings(): array
    {
        $trainer = array_map(
            fn ($label, $i) => 'P'.($i + 1).'. '.$label,
            AssessmentFeedback::TRAINER_ASPECTS,
            array_keys(AssessmentFeedback::TRAINER_ASPECTS),
        );
        $effectiveness = array_map(
            fn ($label, $i) => 'E'.($i + 1).'. '.$label,
            AssessmentFeedback::EFFECTIVENESS_STATEMENTS,
            array_keys(AssessmentFeedback::EFFECTIVENESS_STATEMENTS),
        );

        return [
            'No', 'Tanggal', 'Nama', 'NIK', 'Jabatan', 'Departemen', 'Site',
            'Nilai Assessment (%)', 'Status Kelulusan', 'Pemateri',
            ...$trainer,
            'Rata-rata Pemateri',
            ...$effectiveness,
            'Rata-rata Efektivitas',
            'Komentar / Saran',
        ];
    }

    public function map($row): array
    {
        $this->no++;

        return [
            $this->no,
            $row->created_at?->format('d/m/Y H:i') ?? '',
            $row->user->name ?? '',
            $row->user->nik ?? '',
            $row->user->jabatan ?? '',
            $row->user->departemen ?? '',
            $row->user?->site ? ucfirst($row->user->site) : '',
            $row->session->percentage ?? '',
            $row->session ? ($row->session->passed ? 'Lulus' : 'Tidak Lulus') : '',
            $row->trainer_name,
            ...array_pad($row->trainer_scores ?? [], count(AssessmentFeedback::TRAINER_ASPECTS), ''),
            $row->trainer_avg,
            ...array_pad($row->effectiveness_scores ?? [], count(AssessmentFeedback::EFFECTIVENESS_STATEMENTS), ''),
            $row->effectiveness_avg,
            $row->komentar ?? '',
        ];
    }
}
