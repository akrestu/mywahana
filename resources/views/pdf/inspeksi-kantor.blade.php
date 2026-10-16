<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; margin: 0; padding: 16px; }
    .form-title { font-size: 13px; font-weight: bold; text-align: center; text-transform: uppercase; }
    .form-number { font-size: 9px; text-align: center; color: #555; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #000; padding: 4px 6px; }
    th { background: #d9d9d9; text-align: center; font-weight: bold; }
    .info-label { font-weight: bold; width: 120px; }
    .section-header { background: #333; color: #fff; font-weight: bold; padding: 4px 6px; }
    .score-cell { text-align: center; font-weight: bold; }
    .score-1 { background: #f8d7da; }
    .score-2 { background: #ffe8cc; }
    .score-3 { background: #fff3cd; }
    .score-4 { background: #d4edda; }
    .score-empty { color: #aaa; text-align: center; }
    .risk-L  { background: #d4edda; color: #155724; font-weight: bold; text-align: center; }
    .risk-M  { background: #fff3cd; color: #856404; font-weight: bold; text-align: center; }
    .risk-H  { background: #ffe8cc; color: #7c4700; font-weight: bold; text-align: center; }
    .risk-VH { background: #f8d7da; color: #721c24; font-weight: bold; text-align: center; }
    .sig-img { max-width: 200px; max-height: 80px; }
    .tagline { text-align: center; font-weight: bold; font-size: 11px; margin-top: 16px; letter-spacing: 1px; }
</style>
</head>
<body>

<div class="form-title">INSPEKSI AREA KANTOR</div>
<div class="form-number">WBK-HSE-FO-004</div>

@php
$riskLabels = ['L' => 'Baik', 'M' => 'Cukup', 'H' => 'Perhatian', 'VH' => 'Perlu Tindakan'];
$scoreLabels = [1 => 'Sangat Kurang', 2 => 'Kurang', 3 => 'Baik', 4 => 'Sangat Baik'];
@endphp

{{-- Info umum --}}
<table>
    <tr>
        <td class="info-label">Inspektor</td>
        <td>: {{ $record->user->name }}</td>
        <td class="info-label">Tanggal</td>
        <td>: {{ $record->tanggal->format('d/m/Y') }}</td>
    </tr>
    <tr>
        <td class="info-label">NIK</td>
        <td>: {{ $record->user->nik ?? '-' }}</td>
        <td class="info-label">Project / Site</td>
        <td>: {{ $record->project_site }}</td>
    </tr>
    <tr>
        <td class="info-label">Jabatan</td>
        <td>: {{ $record->user->jabatan ?? '-' }}</td>
        <td class="info-label">Departemen</td>
        <td>: {{ $record->departemen }}</td>
    </tr>
    <tr>
        <td class="info-label">Re-Inspektor</td>
        <td colspan="3">: {{ $record->reInspektor?->name ?? '-' }}{{ $record->reInspektor?->jabatan ? ' — '.$record->reInspektor->jabatan : '' }}</td>
    </tr>
    @if($record->peserta->count())
    <tr>
        <td class="info-label">Peserta</td>
        <td colspan="3">: {{ $record->peserta->pluck('name')->join(', ') }}</td>
    </tr>
    @endif
</table>

{{-- Hasil --}}
<table>
    <tr>
        <td class="info-label">Total Poin</td>
        <td>: {{ $record->total_poin }} / {{ $record->max_poin }}</td>
        <td class="info-label">Persentase</td>
        <td>: {{ number_format($record->persentase, 1) }}%</td>
    </tr>
    <tr>
        <td class="info-label">Risk Level</td>
        <td colspan="3" class="risk-{{ $record->risk_level }}">: {{ $riskLabels[$record->risk_level] ?? $record->risk_level }}</td>
    </tr>
</table>

{{-- Checklist --}}
@php
$categories = [
    ['label' => 'Situasi', 'items' => [
        ['situasi_1', '1. Atap, Dinding, pintu, jendela dalam kondisi bersih dan baik'],
        ['situasi_2', '2. Lantai dalam kondisi bersih dan tidak rusak'],
        ['situasi_3', '3. Penerangan di semua area/ruangan memadai/standar'],
        ['situasi_4', '4. Ventilasi di semua area/ruangan memadai (tidak pengap)'],
        ['situasi_5', '5. House keeping/kebersihan secara umum baik'],
        ['situasi_6', '6. Tersedia halaman parkir sarana memadai; Tersedia rambu parkir & sarana parkir mundur'],
        ['situasi_7', '7. Terdapat rambu tempat berkumpul darurat'],
    ]],
    ['label' => 'Individu', 'items' => [
        ['individu_1', '8. Semua karyawan memakai APD sesuai standar'],
    ]],
    ['label' => 'Alat', 'items' => [
        ['alat_1', '9. Rambu K3 (safety sign) lengkap dan memadai'],
        ['alat_2', '10. Instalasi listrik, saklar, kabel dalam kondisi baik dan aman'],
        ['alat_3', '11. Semua pipa, kran dan katup dalam kondisi baik'],
        ['alat_4', '12. Pada pintu ruangan khusus terdapat rambu "Dilarang Masuk selain Petugas"'],
        ['alat_5', '13. Bangunan dilengkapi alarm emergency & Rambu Evakuasi'],
        ['alat_6', '14. Semua furniture (lemari, meja kerja, kursi dll) dalam kondisi baik, bersih dan ergonomis'],
        ['alat_7', '15. Terdapat APAR atau instalasi hydran dalam kondisi baik'],
    ]],
    ['label' => 'Prosedur', 'items' => [
        ['prosedur_1', '16. Tempat sampah mencukupi, dan dikosongkan setiap hari'],
        ['prosedur_2', '17. APAR tersedia memadai dan diinspeksi secara rutin'],
        ['prosedur_3', '18. Bangunan dilengkapi dengan sistem pentanahan dan dilakukan inspeksi/pengukuran secara rutin'],
        ['prosedur_4', '19. Kotak P3K lengkap dengan peralatannya'],
        ['prosedur_5', '20. Tidak menyimpan Cairan Mudah Terbakar/menyala di dalam ruang kerja'],
        ['prosedur_6', '21. Penyimpanan & Pengendalian Bahan Kimia Berbahaya'],
        ['prosedur_7', '22. Terdapat Papan Pengumuman K3 & LH'],
    ]],
];
@endphp

<table>
    <tr>
        <th style="width: 55%">Item Inspeksi</th>
        <th style="width: 10%">Skor</th>
        <th style="width: 35%">Keterangan</th>
    </tr>
    @foreach($categories as $cat)
    <tr>
        <td colspan="3" class="section-header">{{ $cat['label'] }}</td>
    </tr>
    @foreach($cat['items'] as [$field, $label])
    @php $val = $record->{$field}; @endphp
    <tr>
        <td>{{ $label }}</td>
        <td class="{{ $val ? 'score-'.$val.' score-cell' : 'score-empty' }}">
            {{ $val ? $val.' - '.($scoreLabels[$val] ?? '') : '-' }}
        </td>
        <td></td>
    </tr>
    @endforeach
    @endforeach
</table>

{{-- Tindakan Perbaikan --}}
@if($record->tindakan_perbaikan && count($record->tindakan_perbaikan))
<table>
    <tr>
        <th colspan="4">Rekomendasi Tindakan Perbaikan</th>
    </tr>
    <tr>
        <th style="width: 40%">Tindakan</th>
        <th style="width: 20%">PIC</th>
        <th style="width: 20%">Due Date</th>
        <th style="width: 20%">Keterangan</th>
    </tr>
    @foreach($record->tindakan_perbaikan as $tp)
    <tr>
        <td>{{ $tp['tindakan'] ?? '-' }}</td>
        <td>{{ $tp['pic'] ?? '-' }}</td>
        <td>{{ $tp['due_date'] ?? '-' }}</td>
        <td>{{ $tp['remark'] ?? '-' }}</td>
    </tr>
    @endforeach
</table>
@endif

{{-- Status --}}
@php
$statusLabels = ['selesai' => 'Selesai', 'ditolak' => 'Ditolak', 'menunggu_re_inspeksi' => 'Menunggu Re-Inspeksi'];
@endphp
<table>
    <tr>
        <td class="info-label">Status</td>
        <td>{{ $statusLabels[$record->status] ?? $record->status }}</td>
        @if($record->tolak_alasan)
        <td class="info-label">Alasan Tolak</td>
        <td>{{ $record->tolak_alasan }}</td>
        @endif
    </tr>
</table>

{{-- Tanda tangan --}}
<table>
    <tr>
        <td style="width: 50%; text-align: center; padding: 10px;">
            <p><strong>Tanda Tangan Inspektor</strong></p>
            <p>{{ $record->user->name }}</p>
            @if($record->ttd_inspektor)
            <img src="{{ $record->ttd_inspektor }}" class="sig-img" alt="TTD Inspektor" />
            @else
            <br><br>
            <p>____________________________</p>
            @endif
        </td>
        <td style="width: 50%; text-align: center; padding: 10px;">
            <p><strong>Tanda Tangan Re-Inspektor</strong></p>
            <p>{{ $record->reInspektor?->name ?? '-' }}</p>
            @if($record->ttd_re_inspektor)
            <img src="{{ $record->ttd_re_inspektor }}" class="sig-img" alt="TTD Re-Inspektor" />
            @else
            <br><br>
            <p>____________________________</p>
            @endif
        </td>
    </tr>
</table>

<div class="tagline">SAYA PILIH SELAMAT</div>

</body>
</html>
