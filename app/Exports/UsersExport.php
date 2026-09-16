<?php

namespace App\Exports;

use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class UsersExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping
{
    private int $no = 0;

    public function __construct(private readonly Builder $query) {}

    public function query()
    {
        return $this->query->with('sites:id,value');
    }

    public function headings(): array
    {
        return [
            'No', 'Nama', 'NIK', 'Email', 'Password (opsional untuk reset)', 'Jabatan', 'Departemen', 'Site Utama', 'Assignment Site', 'Level', 'Admin', 'Terdaftar',
        ];
    }

    public function map($row): array
    {
        $this->no++;

        return [
            $this->no,
            $row->name,
            $row->nik ?? '',
            $row->email ?? '',
            '',
            $row->jabatan ?? '',
            $row->departemen ?? '',
            $row->site ? ucfirst($row->site) : '',
            collect($row->assignedSiteValues())->map(fn ($site) => ucfirst($site))->join(', '),
            $row->participation_level ?? '',
            $row->is_admin ? 'Ya' : 'Tidak',
            $row->created_at?->format('d/m/Y') ?? '',
        ];
    }
}
