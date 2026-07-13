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
            'No', 'Nama', 'NIK', 'Jabatan', 'Departemen', 'Site', 'Tanggal', 'Waktu Pengamatan',
            'Kategori', 'Klasifikasi Bahaya', 'Lokasi', 'Detail Lokasi',
            'Deskripsi Bahaya', 'Tindakan Perbaikan',
            'Probabilitas', 'Frekuensi', 'Severity', 'Nilai Risiko',
            'Tingkat Risiko', 'Status Tindakan', 'PIC',
        ];
    }

    public function map($row): array
    {
        $this->no++;
        $status = match ($row->status_tindakan) {
            'pending'  => 'Pending',
            'continue' => 'Continue',
            'progress' => 'Progress',
            'close'    => 'Close',
            default    => $row->status_tindakan ?? '',
        };
        return [
            $this->no,
            $row->user->name ?? '',
            $row->user->nik ?? '',
            $row->user->jabatan ?? '',
            $row->user->departemen ?? '',
            $row->site ? ucfirst($row->site) : ($row->user->site ? ucfirst($row->user->site) : ''),
            $row->tanggal?->format('d/m/Y') ?? '',
            $row->waktu_pengamatan ?? '',
            $row->kategori ?? '',
            $row->klasifikasi_bahaya ?? '',
            $row->lokasi,
            $row->detail_lokasi ?? '',
            $row->deskripsi_bahaya,
            $row->tindakan_perbaikan,
            $row->probabilitas,
            $row->frekuensi,
            $row->severity,
            $row->nilai_risiko,
            $row->tingkat_risiko,
            $status,
            $row->pic?->name ?? '',
        ];
    }
}
