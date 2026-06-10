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

<div class="form-title">INSPEKSI MESS</div>
<div class="form-number">WBK-HSE-FO-007</div>

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
        <td class="info-label">Lokasi</td>
        <td>: {{ $record->lokasi }}</td>
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
    ['label' => 'Sanitasi & Kebersihan Umum', 'items' => [
        ['sanitasi_1',  '1. Lingkungan mess bersih, bebas sampah berserakan'],
        ['sanitasi_2',  '2. Saluran air/drainase tidak tersumbat dan berfungsi baik'],
        ['sanitasi_3',  '3. Tersedia tempat sampah yang cukup dan terpilah'],
        ['sanitasi_4',  '4. Sampah diangkut/dibuang secara rutin'],
        ['sanitasi_5',  '5. Tidak ada genangan air yang berpotensi jadi sarang nyamuk'],
        ['sanitasi_6',  '6. Toilet/kamar mandi bersih, tidak berbau, dan berfungsi'],
        ['sanitasi_7',  '7. Air bersih tersedia 24 jam dan cukup untuk penghuni'],
        ['sanitasi_8',  '8. Sabun dan perlengkapan kebersihan tersedia di kamar mandi'],
        ['sanitasi_9',  '9. Area cuci pakaian bersih dan drainasenya baik'],
        ['sanitasi_10', '10. Hewan pengganggu (tikus, kecoa, nyamuk) dikendalikan'],
    ]],
    ['label' => 'Kamar Tidur & Fasilitas Pribadi', 'items' => [
        ['kamar_1', '11. Kamar tidur bersih, rapi, dan berventilasi baik'],
        ['kamar_2', '12. Kapasitas kamar tidak melebihi batas yang ditentukan'],
        ['kamar_3', '13. Tempat tidur dalam kondisi layak dan bersih'],
        ['kamar_4', '14. Lemari/loker penyimpanan tersedia dan memadai'],
        ['kamar_5', '15. Pencahayaan kamar mencukupi'],
        ['kamar_6', '16. AC/kipas angin berfungsi dengan baik'],
        ['kamar_7', '17. Tidak ada kerusakan pada pintu, jendela, atau kunci kamar'],
        ['kamar_8', '18. Area koridor/lorong bersih dan bebas hambatan'],
    ]],
    ['label' => 'Dapur & Area Makan', 'items' => [
        ['dapur_1', '19. Dapur bersih, peralatan masak dalam kondisi baik'],
        ['dapur_2', '20. Makanan tersimpan dengan benar (tertutup, suhu tepat)'],
        ['dapur_3', '21. Kulkas/freezer berfungsi baik dan bersih'],
        ['dapur_4', '22. Area makan bersih dan meja makan layak'],
        ['dapur_5', '23. Tidak ada kontaminasi silang antara makanan mentah dan matang'],
    ]],
    ['label' => 'Pengelolaan Sampah & Lingkungan', 'items' => [
        ['sampah_1', '24. TPS sampah mess tertutup dan tidak menimbulkan bau'],
        ['sampah_2', '25. Jadwal pengangkutan sampah ada dan dipatuhi'],
        ['sampah_3', '26. Tidak ada pembakaran sampah di area mess'],
        ['sampah_4', '27. Taman/area hijau di sekitar mess terawat'],
        ['sampah_5', '28. Fasilitas olahraga/rekreasi (jika ada) aman dan terawat'],
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
