<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class BugarSelamatExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    private int $no = 0;

    public function __construct(private readonly \Illuminate\Database\Eloquent\Builder $query) {}

    public function query()
    {
        return $this->query;
    }

    public function headings(): array
    {
        return [
            'No', 'Nama', 'NIK', 'Jabatan', 'Departemen', 'Site', 'Tanggal', 'Shift', 'Hari Ke',
            'Jam Tidur', 'Kondisi Sakit', 'Minum Obat', 'Masalah Pribadi',
            'Pengaruh Alkohol', 'Siap Bekerja', 'Status Kelayakan', 'Catatan',
        ];
    }

    public function map($row): array
    {
        $this->no++;
        return [
            $this->no,
            $row->user->name ?? '',
            $row->user->nik ?? '',
            $row->user->jabatan ?? '',
            $row->user->departemen ?? '',
            $row->user->site ? ucfirst($row->user->site) : '',
            $row->tanggal?->format('d/m/Y') ?? '',
            $row->shift,
            $row->hari_ke,
            $row->jam_tidur,
            $row->kondisi_sakit ? 'Ya' : 'Tidak',
            $row->minum_obat ? 'Ya' : 'Tidak',
            $row->masalah_pribadi ? 'Ya' : 'Tidak',
            $row->pengaruh_alkohol ? 'Ya' : 'Tidak',
            $row->siap_bekerja ? 'Ya' : 'Tidak',
            ucfirst($row->status_kelayakan),
            $row->catatan ?? '',
        ];
    }
}
