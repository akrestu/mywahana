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
    .sig-img { max-width: 200px; max-height: 80px; }
    .tagline { text-align: center; font-weight: bold; font-size: 11px; margin-top: 16px; letter-spacing: 1px; }
</style>
</head>
<body>

<div class="form-title">INSPEKSI WORKSHOP</div>
<div class="form-number">WBK-HSE-FO-006</div>

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
    ['label' => 'Bangunan / Fasilitas', 'items' => [
        ['bangunan_1',  '1. Atap/dinding tidak bocor/rusak/tidak aman'],
        ['bangunan_2',  '2. Lantai kering, bersih, dan tidak licin'],
        ['bangunan_3',  '3. Jalan keluar masuk bebas hambatan'],
        ['bangunan_4',  '4. Pintu darurat berfungsi dan tidak terhalang'],
        ['bangunan_5',  '5. Ventilasi dan pencahayaan mencukupi'],
        ['bangunan_6',  '6. Tangga/platform dalam kondisi aman'],
        ['bangunan_7',  '7. Rambu keselamatan terpasang dan terlihat jelas'],
        ['bangunan_8',  '8. Kebersihan area kerja terjaga'],
        ['bangunan_9',  '9. Area penyimpanan bahan kimia aman dan berlabel'],
        ['bangunan_10', '10. Tempat sampah tersedia dan terpisah sesuai jenis'],
        ['bangunan_11', '11. Fasilitas P3K tersedia dan lengkap'],
        ['bangunan_12', '12. Jalur evakuasi ditandai dengan jelas'],
        ['bangunan_13', '13. Titik kumpul evakuasi jelas'],
        ['bangunan_14', '14. Peralatan kerja disimpan dengan tertata rapi'],
        ['bangunan_15', '15. Bahan mudah terbakar tersimpan di tempat aman'],
        ['bangunan_16', '16. Material tidak berserakan di area kerja'],
        ['bangunan_17', '17. MSDS/SDS tersedia untuk semua bahan kimia'],
        ['bangunan_18', '18. Tanda larangan merokok terpasang di tempat yang tepat'],
        ['bangunan_19', '19. Area non-smoking dipatuhi'],
        ['bangunan_20', '20. Toilet/kamar mandi bersih dan berfungsi'],
        ['bangunan_21', '21. Air bersih tersedia untuk cuci tangan'],
    ]],
    ['label' => 'Instalasi Kelistrikan', 'items' => [
        ['kelistrikan_1', '22. Panel listrik dalam kondisi tertutup dan berlabel'],
        ['kelistrikan_2', '23. Kabel tidak berserakan atau terkelupas'],
        ['kelistrikan_3', '24. Stop kontak/saklar tidak rusak'],
        ['kelistrikan_4', '25. Grounding/earthing peralatan listrik berfungsi'],
        ['kelistrikan_5', '26. Tidak ada overloading pada instalasi listrik'],
        ['kelistrikan_6', '27. Lampu penerangan berfungsi dengan baik'],
        ['kelistrikan_7', '28. Genset/UPS dalam kondisi baik jika ada'],
        ['kelistrikan_8', '29. Peralatan listrik portabel dalam kondisi aman'],
    ]],
    ['label' => 'Area Pengelasan (Welder)', 'items' => [
        ['welder_1', '30. APD las (helm, sarung tangan, apron) tersedia dan layak'],
        ['welder_2', '31. Tirai/welding curtain terpasang'],
        ['welder_3', '32. Ventilasi memadai di area pengelasan'],
        ['welder_4', '33. Peralatan las dalam kondisi baik dan aman'],
        ['welder_5', '34. Tidak ada bahan mudah terbakar di sekitar area las'],
        ['welder_6', '35. Izin kerja las (hot work permit) tersedia jika diperlukan'],
    ]],
    ['label' => 'Tabung Gas', 'items' => [
        ['tabung_1', '36. Tabung gas berdiri tegak dan terikat/terpasang aman'],
        ['tabung_2', '37. Tutup/cap tabung gas terpasang saat tidak digunakan'],
        ['tabung_3', '38. Regulator dan selang gas dalam kondisi baik'],
        ['tabung_4', '39. Tabung gas tidak bocor (dilakukan pengecekan)'],
        ['tabung_5', '40. Tabung gas penuh dan kosong dipisahkan'],
        ['tabung_6', '41. Label tabung gas (isi, kosong, rusak) jelas'],
    ]],
    ['label' => 'Alat Angkat / Rigging', 'items' => [
        ['alat_angkat_1', '42. Sling/rantai angkat dalam kondisi baik, tidak rusak'],
        ['alat_angkat_2', '43. Kapasitas angkat alat tertera dengan jelas'],
        ['alat_angkat_3', '44. Hoist/crane diperiksa secara berkala (ada stiker inspeksi)'],
        ['alat_angkat_4', '45. Operator alat angkat berkompetensi/bersertifikat'],
        ['alat_angkat_5', '46. Area pengangkatan dibebaskan dari personel yang tidak berkepentingan'],
    ]],
    ['label' => 'Tempat Penyimpanan (TPS)', 'items' => [
        ['tps_1',  '47. Rak/shelving kokoh dan tidak overload'],
        ['tps_2',  '48. Barang berat di bawah, ringan di atas'],
        ['tps_3',  '49. Material bertumpuk tidak melebihi batas aman'],
        ['tps_4',  '50. Label/identifikasi material terpasang jelas'],
        ['tps_5',  '51. Jalur akses penyimpanan bebas hambatan'],
        ['tps_6',  '52. Limbah B3 tersimpan di TPS khusus dan berlabel'],
        ['tps_7',  '53. Manifest limbah B3 tersedia dan updated'],
        ['tps_8',  '54. Oli bekas tersimpan di drum tertutup'],
        ['tps_9',  '55. Spill kit tersedia di dekat area TPS'],
        ['tps_10', '56. Bunding/secondary containment untuk bahan kimia tersedia'],
        ['tps_11', '57. APAR tersedia dan mudah dijangkau di area TPS'],
        ['tps_12', '58. Inspeksi APAR dilakukan secara rutin (kartu inspeksi ada)'],
    ]],
    ['label' => 'Area Tyre / Ban', 'items' => [
        ['tyre_1', '59. Ban tersimpan dengan aman (tidak berpotensi menggelinding)'],
        ['tyre_2', '60. Peralatan pengisian angin (kompresor, selang) aman'],
        ['tyre_3', '61. APD tersedia untuk pekerjaan tyre (sarung tangan, pelindung wajah)'],
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
