<?php

namespace App\Exports;

use App\Models\Site;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class UsersImportTemplate implements FromArray, ShouldAutoSize, WithHeadings
{
    public function array(): array
    {
        $siteValues = Site::pluck('value')->join('/');

        return [
            ['Contoh Nama', '123456', 'email@contoh.com', 'password123', 'Jabatan', 'Nama Departemen', $siteValues ? explode('/', $siteValues)[0] : '', 'staff', '0'],
        ];
    }

    public function headings(): array
    {
        $siteValues = Site::pluck('value')->join('/');
        $siteHint = $siteValues ?: 'sesuai site';

        return [
            'nama*', 'nik*', 'email', 'password*', 'jabatan', 'departemen',
            "site ($siteHint)",
            'level (nonstaff/staff/srstaff)',
            'is_admin (0/1)',
        ];
    }
}
