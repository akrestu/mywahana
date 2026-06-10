<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class UsersImportTemplate implements FromArray, WithHeadings, ShouldAutoSize
{
    public function array(): array
    {
        return [
            ['Contoh Nama', '123456', 'email@contoh.com', 'password123', 'Jabatan', 'baratama', 'staff', '0'],
        ];
    }

    public function headings(): array
    {
        return [
            'nama*', 'nik*', 'email', 'password*', 'jabatan', 'site (baratama/bandhawa)', 'level (nonstaff/staff/srstaff)', 'is_admin (0/1)',
        ];
    }
}
