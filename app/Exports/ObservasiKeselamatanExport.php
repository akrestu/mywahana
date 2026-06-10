<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ObservasiKeselamatanExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
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
            'No', 'Observer', 'NIK Observer', 'Site Observer',
            'Penanggung Jawab', 'Tanggal', 'Lokasi Kerja', 'Jenis Pekerjaan',
            'Status Konfirmasi', 'Tgl Dikonfirmasi', 'Status Temuan',
        ];
    }

    public function map($row): array
    {
        $this->no++;
        $statusTemuan = is_array($row->status_temuan) ? implode('; ', $row->status_temuan) : '';
        return [
            $this->no,
            $row->user->name ?? '',
            $row->user->nik ?? '',
            $row->user->site ? ucfirst($row->user->site) : '',
            $row->penanggungJawab->name ?? '',
            $row->tanggal?->format('d/m/Y') ?? '',
            $row->lokasi_kerja,
            $row->jenis_pekerjaan,
            $row->status === 'dikonfirmasi' ? 'Dikonfirmasi' : 'Menunggu Konfirmasi',
            $row->pj_dikonfirmasi_at?->format('d/m/Y') ?? '',
            $statusTemuan,
        ];
    }
}
