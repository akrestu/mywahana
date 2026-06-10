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
    .narasi-label { font-weight: bold; background: #eee; width: 40%; }
    .narasi-val { padding: 4px 6px; }
    .sig-img { max-width: 200px; max-height: 80px; }
    .tagline { text-align: center; font-weight: bold; font-size: 11px; margin-top: 16px; letter-spacing: 1px; }
</style>
</head>
<body>

<div class="form-title">INSPEKSI AREA TAMBANG</div>
<div class="form-number">WBK-HSE-FO-005</div>

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
        ['situasi_1',  '1. House Keeping/kebersihan lingkungan memadai/bebas dari sampah dan bahan bekas lainnya'],
        ['situasi_2',  '2. Jalan angkut rata (tidak bergelombang) dan bebas dari batuan lepas'],
        ['situasi_3',  '3. Lebar jalan angkut sesuai dengan standar'],
        ['situasi_4',  '4. Semua jalan angkut dilengkapi dengan tanggul pengaman sesuai standar'],
        ['situasi_5',  '5. Dinding galian dalam keadaan stabil, tidak terdapat keretakan'],
        ['situasi_6',  '6. Tidak terdapat material longsor atau material yang menggantung di atas dinding galian'],
        ['situasi_7',  '7. Ketinggian dan kemiringan slope sesuai dengan standar dan bebas dari batuan lepas'],
        ['situasi_8',  '8. Tempat pembuangan/dumping rata, tidak ada batu besar dan lumpur'],
        ['situasi_9',  '9. Dumping area tidak terdapat keretakan; dilengkapi dengan tanggul pengaman yang memadai'],
        ['situasi_10', '10. Lampu penerangan mencukupi untuk semua area untuk shift malam'],
        ['situasi_11', '11. Semua lampu penerangan berada pada tempat yang aman dan dilindungi dengan tanggul pengaman yang memadai'],
        ['situasi_12', '12. Semua karyawan berada pada tempat yang aman'],
        ['situasi_13', '13. Semua kendaraan sarana diparkir pada tempat yang aman'],
    ]],
    ['label' => 'Individu', 'items' => [
        ['individu_1', '14. Semua Karyawan memakai APD yang sesuai'],
        ['individu_2', '15. Semua operator dan driver mempunyai SIMPER yang sesuai (random Sampling)'],
    ]],
    ['label' => 'Alat', 'items' => [
        ['alat_1', '16. Rambu-rambu lalu lintas dengan ukuran yang memadai dan terlihat jelas dengan jarak 50m'],
        ['alat_2', '17. Semua equipment dan kendaraan bersih, lampu-lampu peringatan berfungsi dengan baik'],
        ['alat_3', '18. Terdapat rambu penunjuk arah keluar dan masuk PIT; Terdapat rambu evakuasi ke arah titik pengungsian/Muster point'],
        ['alat_4', '19. Drainase atau saluran air berfungsi dengan baik'],
        ['alat_5', '20. Semua kendaraan sarana untuk pengawas dilengkapi dengan kotak P3K'],
        ['alat_6', '21. Tersedia APAR di semua unit dan tersedia 1 unit water truck yang dapat berfungsi sebagai unit pemadam kebakaran'],
    ]],
    ['label' => 'Prosedur', 'items' => [
        ['prosedur_1', '22. Pengendalian Debu: debu terkendali, terdapat jadwal penyiraman dan jumlah water truck mencukupi'],
        ['prosedur_2', '23. Bench dilengkapi dengan safety berm yang memadai'],
        ['prosedur_3', '24. Semua kendaraan sarana dengan ketinggian kurang dari 4 meter dilengkapi dengan buggy whip yang tingginya 4 meter dari tanah'],
        ['prosedur_4', '25. Semua operator dan driver melakukan pre-start Check / P2H (random sampling)'],
        ['prosedur_5', '26. Semua operator dan driver memakai seat belt (random sampling)'],
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
