<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 20px; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .header-table td { padding: 4px 8px; }
    .form-title { font-size: 14px; font-weight: bold; text-align: center; text-transform: uppercase; }
    .form-number { font-size: 10px; text-align: center; color: #555; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #000; padding: 5px 8px; }
    th { background: #d9d9d9; text-align: center; font-weight: bold; }
    .info-label { font-weight: bold; width: 120px; }
    .answer-badge { font-weight: bold; padding: 2px 8px; border-radius: 3px; }
    .layak    { background: #d4edda; color: #155724; }
    .catatan  { background: #fff3cd; color: #856404; }
    .dilarang { background: #f8d7da; color: #721c24; }
    .declaration { font-style: italic; font-size: 10px; border: 1px solid #ccc; padding: 8px; margin-top: 10px; background: #f9f9f9; }
    .status-box { text-align: center; font-size: 13px; font-weight: bold; padding: 8px; border: 2px solid #000; margin: 10px 0; }
    .footer-sig { width: 100%; margin-top: 20px; }
    .footer-sig td { text-align: center; padding: 5px; vertical-align: top; }
</style>
</head>
<body>

<div class="form-title">CHECKLIST BUGAR SELAMAT</div>
<div class="form-number">WBK-HSE-FO-021 | Rev. 0 | Tgl. 01-01-2020</div>

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
        <td class="info-label">Shift</td>
        <td>: {{ $record->shift }}</td>
    </tr>
    <tr>
        <td class="info-label">Jabatan</td>
        <td>: {{ $record->user->jabatan ?? '-' }}</td>
        <td class="info-label">Hari ke</td>
        <td>: {{ $record->hari_ke }}</td>
    </tr>
    <tr>
        <td class="info-label">Site</td>
        <td colspan="3">: {{ $record->user->site ? ucfirst($record->user->site) : '-' }}</td>
    </tr>
</table>

<table>
    <thead>
        <tr>
            <th style="width:40px">No</th>
            <th>Pertanyaan</th>
            <th style="width:150px">Jawaban</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="text-align:center">1</td>
            <td>Berapa jam anda tidur?</td>
            <td style="text-align:center">{{ $record->jam_tidur }} jam</td>
        </tr>
        <tr>
            <td style="text-align:center">2</td>
            <td>Apakah anda sedang sakit/lelah?</td>
            <td style="text-align:center">{{ $record->kondisi_sakit ? 'Ya' : 'Tidak' }}</td>
        </tr>
        <tr>
            <td style="text-align:center">3</td>
            <td>Apakah anda habis minum/makan obat kurang dari 6 jam?</td>
            <td style="text-align:center">{{ $record->minum_obat ? 'Ya' : 'Tidak' }}</td>
        </tr>
        <tr>
            <td style="text-align:center">4</td>
            <td>Apakah anda sedang ada permasalahan pribadi yang sangat mengganggu pikiran?</td>
            <td style="text-align:center">{{ $record->masalah_pribadi ? 'Ya' : 'Tidak' }}</td>
        </tr>
        <tr>
            <td style="text-align:center">5</td>
            <td>Apakah anda masih dalam pengaruh alkohol?</td>
            <td style="text-align:center">{{ $record->pengaruh_alkohol ? 'Ya' : 'Tidak' }}</td>
        </tr>
        <tr>
            <td style="text-align:center">6</td>
            <td>Apakah anda SIAP BEKERJA?</td>
            <td style="text-align:center">{{ $record->siap_bekerja ? 'Ya' : 'Tidak' }}</td>
        </tr>
    </tbody>
</table>

@php
    $statusLabel = match($record->status_kelayakan) {
        'layak'   => 'LAYAK BEKERJA',
        'catatan' => 'BEKERJA DENGAN CATATAN',
        'dilarang'=> 'DILARANG BEKERJA',
    };
@endphp

<div class="status-box {{ $record->status_kelayakan }}">
    STATUS: {{ $statusLabel }}
</div>

@if($record->catatan)
<p><strong>Catatan:</strong> {{ $record->catatan }}</p>
@endif

<div class="declaration">
    Dengan ini saya menyatakan dengan sebenar-benarnya mengisi formulir ini dan sesuai KEYAKINAN yang saya yakini;
    Apabila di kemudian waktu saya terbukti berbohong dalam mengisi formulir ini, saya sanggup MENERIMA SANKSI
    sesuai dengan peraturan yang berlaku.
</div>

<table class="footer-sig" style="border:none; margin-top:30px;">
    <tr>
        <td style="border:none; width:50%; text-align:center">
            <div>Karyawan</div>
            <br><br><br>
            <div style="border-top:1px solid #000; width:80%; margin:auto">{{ $record->user->name }}</div>
        </td>
        <td style="border:none; width:50%; text-align:center">
            <div>Diketahui oleh Atasan</div>
            <br><br><br>
            <div style="border-top:1px solid #000; width:80%; margin:auto">( ...................... )</div>
        </td>
    </tr>
</table>

</body>
</html>
