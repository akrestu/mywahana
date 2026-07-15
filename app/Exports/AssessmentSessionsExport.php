<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AssessmentSessionsExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    private int $no = 0;

    public function __construct(
        private readonly \Illuminate\Database\Eloquent\Builder $query,
        private readonly bool $isHr = false,
    ) {}

    public function query()
    {
        return $this->query;
    }

    public function headings(): array
    {
        return array_values(array_filter([
            'No', 'Nama', 'NIK', 'Jabatan',
            $this->isHr ? null : 'Departemen',
            'Site',
            $this->isHr ? null : 'Departemen Soal',
            $this->isHr ? null : 'Tags',
            'Tanggal Mulai', 'Tanggal Selesai', 'Durasi (menit)',
            'Jumlah Soal', 'Jawaban Benar', 'Persentase (%)', 'Status Kelulusan',
        ]));
    }

    public function map($row): array
    {
        $this->no++;

        $durasi = $row->started_at && $row->completed_at
            ? round($row->started_at->diffInSeconds($row->completed_at) / 60, 1)
            : '';

        return array_values(array_filter([
            'no'          => $this->no,
            'nama'        => $row->user->name ?? '',
            'nik'         => $row->user->nik ?? '',
            'jabatan'     => $row->user->jabatan ?? '',
            'departemen'  => $this->isHr ? null : ($row->user->departemen ?? ''),
            'site'        => $row->user->site ? ucfirst($row->user->site) : '',
            'dept_soal'   => $this->isHr ? null : ($row->departemen ?? ''),
            'tags'        => $this->isHr ? null : ($row->tags ?? ''),
            'mulai'       => $row->started_at?->format('d/m/Y H:i') ?? '',
            'selesai'     => $row->completed_at?->format('d/m/Y H:i') ?? '',
            'durasi'      => $durasi,
            'total_soal'  => $row->total_questions,
            'benar'       => $row->score,
            'persentase'  => $row->percentage,
            'status'      => $row->passed ? 'Lulus' : 'Tidak Lulus',
        ], fn ($v) => $v !== null));
    }
}
