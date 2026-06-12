<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class InspeksiWorkshopExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
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
            'No', 'Inspektor', 'NIK', 'Site',
            'Re-Inspektor', 'Tanggal', 'Project Site', 'Departemen',
            'Persentase', 'Risk Level', 'Status', 'Peserta Inspeksi', 'Tindakan Perbaikan',
        ];
    }

    public function map($row): array
    {
        $this->no++;
        $riskLabel = match($row->risk_level) {
            'L'  => 'Baik',
            'M'  => 'Cukup',
            'H'  => 'Perhatian',
            'VH' => 'Perlu Tindakan',
            default => '',
        };
        $statusLabel = match($row->status) {
            'selesai'             => 'Selesai',
            'ditolak'             => 'Ditolak',
            'menunggu_re_inspeksi' => 'Menunggu Re-Inspeksi',
            default => $row->status,
        };
        return [
            $this->no,
            $row->user->name ?? '',
            $row->user->nik ?? '',
            $row->user->site ? ucfirst($row->user->site) : '',
            $row->reInspektor->name ?? '',
            $row->tanggal?->format('d/m/Y') ?? '',
            $row->project_site,
            $row->departemen,
            $row->persentase !== null ? $row->persentase . '%' : '',
            $riskLabel,
            $statusLabel,
            $row->peserta->pluck('name')->join(', '),
            collect($row->tindakan_perbaikan ?? [])->map(fn($t) => $t['tindakan'] ?? '')->filter()->join('; '),
        ];
    }
}