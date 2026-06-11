<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class InductionAttendanceExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    private int $no = 0;

    public function __construct(private readonly \Illuminate\Database\Eloquent\Builder $query) {}

    public function query()
    {
        return $this->query;
    }

    public function headings(): array
    {
        return ['No', 'NIK', 'Nama', 'Departemen', 'Site', 'Tanggal Absensi Induksi'];
    }

    public function map($row): array
    {
        $this->no++;
        return [
            $this->no,
            $row->user->nik ?? '',
            $row->user->name ?? '',
            $row->user->departemen ?? '',
            $row->user->site ? ucfirst($row->user->site) : '',
            $row->attended_at?->format('d/m/Y H:i') ?? '',
        ];
    }
}
