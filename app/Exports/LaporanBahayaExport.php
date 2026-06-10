<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class LaporanBahayaExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
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
            'No', 'Nama', 'NIK', 'Site', 'Tanggal', 'Waktu Pengamatan',
            'Kategori', 'Lokasi', 'Deskripsi Bahaya', 'Tindakan Perbaikan',
            'Probabilitas', 'Frekuensi', 'Severity', 'Nilai Risiko',
            'Tingkat Risiko', 'Status Tindakan',
        ];
    }

    public function map($row): array
    {
        $this->no++;
        return [
            $this->no,
            $row->user->name ?? '',
            $row->user->nik ?? '',
            $row->user->site ? ucfirst($row->user->site) : '',
            $row->tanggal?->format('d/m/Y') ?? '',
            $row->waktu_pengamatan ?? '',
            $row->kategori ?? '',
            $row->lokasi,
            $row->deskripsi_bahaya,
            $row->tindakan_perbaikan,
            $row->probabilitas,
            $row->frekuensi,
            $row->severity,
            $row->nilai_risiko,
            $row->tingkat_risiko,
            $row->status_tindakan === 'selesai' ? 'Selesai' : 'Pending',
        ];
    }
}
