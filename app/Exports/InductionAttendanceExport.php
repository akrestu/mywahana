<?php

namespace App\Exports;

use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class InductionAttendanceExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping
{
    private int $no = 0;

    public function __construct(private readonly Builder $query) {}

    public function query()
    {
        return $this->query;
    }

    public function headings(): array
    {
        return ['No', 'NIK', 'Nama', 'Jabatan', 'Departemen', 'Site', 'Tanggal Absensi Induksi'];
    }

    public function map($row): array
    {
        $this->no++;

        return [
            $this->no,
            $row->user->nik ?? '',
            $row->user->name ?? '',
            $row->user->jabatan ?? '',
            $row->user->departemen ?? '',
            $row->user->site ? ucfirst($row->user->site) : '',
            $row->attended_at?->format('d/m/Y H:i') ?? '',
        ];
    }
}
