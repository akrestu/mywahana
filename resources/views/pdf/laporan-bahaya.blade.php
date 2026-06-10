<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 20px; }
    .form-title { font-size: 14px; font-weight: bold; text-align: center; text-transform: uppercase; }
    .form-number { font-size: 10px; text-align: center; color: #555; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #000; padding: 5px 8px; }
    th { background: #d9d9d9; text-align: center; font-weight: bold; }
    .info-label { font-weight: bold; width: 130px; }
    .risk-AA { background: #f8d7da; color: #721c24; font-weight: bold; }
    .risk-A  { background: #fde8c8; color: #7d4a00; font-weight: bold; }
    .risk-B  { background: #fff3cd; color: #856404; font-weight: bold; }
    .risk-C  { background: #d4edda; color: #155724; font-weight: bold; }
    .risk-box { text-align: center; padding: 10px; font-size: 14px; font-weight: bold; border: 2px solid #000; margin: 8px 0; }
    .section-header { background: #333; color: #fff; font-weight: bold; text-align: center; padding: 5px; }
    .foto-img { max-width: 100%; max-height: 200px; margin-top: 8px; }
    .tagline { text-align: center; font-style: italic; margin-top: 20px; font-size: 10px; color: #555; }
</style>
</head>
<body>

<div class="form-title">LAPORAN BAHAYA (HAZARD REPORT)</div>
<div class="form-number">WBK-HSE-FO-010 | Tgl. 23-03-2018</div>

<table>
    <tr>
        <td class="info-label">Nama</td>
        <td>: {{ $record->user->name }}</td>
        <td class="info-label">Tanggal</td>
        <td>: {{ $record->tanggal->format('d/m/Y') }}</td>
    </tr>
    <tr>
        <td class="info-label">NIK / NRPP</td>
        <td>: {{ $record->user->nik ?? '-' }}</td>
        <td class="info-label">Waktu Pengamatan</td>
        <td>: {{ $record->waktu_pengamatan ? \Carbon\Carbon::parse($record->waktu_pengamatan)->format('H:i') . ' WIB' : '-' }}</td>
    </tr>
    <tr>
        <td class="info-label">Jabatan</td>
        <td>: {{ $record->user->jabatan ?? '-' }}</td>
        <td class="info-label">Lokasi</td>
        <td>: {{ $record->lokasi }}</td>
    </tr>
    <tr>
        <td class="info-label">Site</td>
        <td>: {{ $record->user->site ? ucfirst($record->user->site) : '-' }}</td>
        <td class="info-label">Kategori</td>
        <td>: @if($record->kategori)
                <strong>{{ $record->kategori }}</strong> — {{ $record->kategori === 'KTA' ? 'Kondisi Tidak Aman' : 'Tindakan Tidak Aman' }}
            @else
                -
            @endif
        </td>
    </tr>
</table>

<div class="section-header">RINCIAN BAHAYA YANG DIAMATI</div>
<table>
    <tr>
        <td style="min-height:60px">{{ $record->deskripsi_bahaya }}</td>
    </tr>
</table>

@if($fotoAbsPath && file_exists($fotoAbsPath))
<div style="margin-bottom:10px;">
    <strong>Foto Bahaya:</strong><br>
    <img src="{{ $fotoAbsPath }}" class="foto-img" alt="Foto Bahaya">
</div>
@endif

<div class="section-header">TINDAKAN PERBAIKAN</div>
<table>
    <tr>
        <td style="min-height:60px">{{ $record->tindakan_perbaikan }}</td>
    </tr>
</table>

<table>
    <thead>
        <tr>
            <th>Probabilitas (P)</th>
            <th>Frekuensi (F)</th>
            <th>Severity (S)</th>
            <th>Nilai Risiko (P×F×S)</th>
            <th>Tingkat Risiko</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="text-align:center">{{ $record->probabilitas }}</td>
            <td style="text-align:center">{{ $record->frekuensi }}</td>
            <td style="text-align:center">{{ $record->severity }}</td>
            <td style="text-align:center">{{ $record->nilai_risiko }}</td>
            <td class="risk-{{ $record->tingkat_risiko }}" style="text-align:center">
                {{ $record->tingkat_risiko }}
                @php
                    $label = match($record->tingkat_risiko) {
                        'AA' => 'Very High', 'A' => 'High', 'B' => 'Medium', 'C' => 'Low'
                    };
                @endphp
                ({{ $label }})
            </td>
        </tr>
    </tbody>
</table>

<table>
    <tr>
        <td class="info-label" style="width:40%">Status Tindakan</td>
        <td>: {{ $record->status_tindakan === 'selesai' ? 'Selesai' : 'Ditunda / Pending' }}</td>
    </tr>
</table>

<table style="border:none; margin-top:30px;">
    <tr>
        <td style="border:none; width:50%; text-align:center">
            <div>Pelapor</div>
            <br><br><br>
            <div style="border-top:1px solid #000; width:80%; margin:auto">{{ $record->user->name }}</div>
            <div>NIK: {{ $record->user->nik ?? '...' }}</div>
        </td>
        <td style="border:none; width:50%; text-align:center">
            <div>Diketahui oleh Atasan / HSE</div>
            <br><br><br>
            <div style="border-top:1px solid #000; width:80%; margin:auto">( ...................... )</div>
        </td>
    </tr>
</table>

<div class="tagline">Datang sehat….kerja aman…pulang selamat — Keluarga menunggu di rumah</div>

</body>
</html>
