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
    .cl-aman     { background: #d4edda; color: #155724; text-align: center; font-weight: bold; }
    .cl-beresiko { background: #f8d7da; color: #721c24; text-align: center; font-weight: bold; }
    .cl-empty    { color: #aaa; text-align: center; }
    .narasi-label { font-weight: bold; background: #eee; }
    .narasi-val   { padding: 4px 6px; }
    .sig-img { max-width: 200px; max-height: 80px; }
    .tagline { text-align: center; font-weight: bold; font-size: 11px; margin-top: 16px; letter-spacing: 1px; }
</style>
</head>
<body>

<div class="form-title">OBSERVASI KESELAMATAN (OK)</div>
<div class="form-number">WBK-HSE-FO-037 | Tgl. 01/04/2020</div>

{{-- Info umum --}}
<table>
    <tr>
        <td class="info-label">Nama Observer</td>
        <td>: {{ $record->user->name }}</td>
        <td class="info-label">Tanggal</td>
        <td>: {{ $record->tanggal->format('d/m/Y') }}</td>
    </tr>
    <tr>
        <td class="info-label">NIK</td>
        <td>: {{ $record->user->nik ?? '-' }}</td>
        <td class="info-label">Lokasi Kerja</td>
        <td>: {{ $record->lokasi_kerja }}</td>
    </tr>
    <tr>
        <td class="info-label">Jabatan</td>
        <td>: {{ $record->user->jabatan ?? '-' }}</td>
        <td class="info-label">Jenis Pekerjaan</td>
        <td>: {{ $record->jenis_pekerjaan }}</td>
    </tr>
    <tr>
        <td class="info-label">Site</td>
        <td>: {{ $record->user->site ? ucfirst($record->user->site) : '-' }}</td>
        <td class="info-label">Peralatan</td>
        <td>: {{ $record->peralatan_digunakan ?? '-' }}</td>
    </tr>
    <tr>
        <td class="info-label">Penanggung Jawab</td>
        <td colspan="3">: {{ $record->penanggungJawab?->name ?? '-' }}{{ $record->penanggungJawab?->jabatan ? ' — '.$record->penanggungJawab->jabatan : '' }}</td>
    </tr>
</table>

{{-- Checklist --}}
@php
$categories = [
    ['label' => '1.0 Prosedur', 'items' => [
        ['cl_prosedur_mine_permit',     '1.1 Mine Permit / Ijin Masuk Lokasi Tambang'],
        ['cl_prosedur_komisioning',     '1.2 Komisioning / Inspeksi'],
        ['cl_prosedur_p2h',             '1.3 Pelaksanaan Pemeriksaan Harian (P2H)'],
        ['cl_prosedur_instruksi_kerja', '1.4 Instruksi Kerja / Tata Cara Kerja Aman'],
        ['cl_prosedur_loto',            '1.5 Sistem Penguncian & Pelabelan (LOTO)'],
        ['cl_prosedur_sop_jsa',         '1.6 SOP / JSA'],
    ]],
    ['label' => '2.0 Alat Pelindung Diri (APD)', 'items' => [
        ['cl_apd_kepala',              '2.1 Kepala'],
        ['cl_apd_mata_wajah',          '2.2 Mata dan Wajah'],
        ['cl_apd_pendengaran',         '2.3 Pendengaran'],
        ['cl_apd_pernapasan',          '2.4 Sistem Pernapasan'],
        ['cl_apd_pelindung_jatuh',     '2.5 Alat Pelindung Jatuh'],
        ['cl_apd_pelindung_tenggelam', '2.6 Alat Pelindung Tenggelam'],
        ['cl_apd_lengan_tangan',       '2.7 Lengan dan Tangan'],
        ['cl_apd_paha_kaki',           '2.8 Paha dan Kaki'],
    ]],
    ['label' => '3.0 Posisi Badan & Reaksi Orang', 'items' => [
        ['cl_posisi_mengangkat',         '3.1 Cara Mengangkat, Mendorong, Menarik'],
        ['cl_posisi_mengubah_posisi',    '3.2 Mengubah Posisi'],
        ['cl_posisi_mengatur_pekerjaan', '3.3 Mengatur Pekerjaan'],
        ['cl_posisi_dekat_listrik',      '3.4 Dekat dengan Arus Listrik Bertegangan'],
        ['cl_posisi_dekat_berbahaya',    '3.5 Dekat dengan Area atau Bahan Berbahaya'],
        ['cl_posisi_dekat_longsor',      '3.6 Dekat dengan Dinding/Galian Rawan Longsor'],
        ['cl_posisi_dekat_air',          '3.6b Dekat dengan Air'],
        ['cl_posisi_turun_naik',         '3.7 Turun / Naik'],
    ]],
    ['label' => '4.0 Berkendara & Mengoperasikan Unit', 'items' => [
        ['cl_kendaraan_sim_sio',    '4.1 SIM / SIO / SIMPER'],
        ['cl_kendaraan_sabuk',      '4.2 Sabuk Keselamatan'],
        ['cl_kendaraan_kecepatan',  '4.3 Batas Kecepatan'],
        ['cl_kendaraan_jarak',      '4.4 Jarak Kendaraan / Beriringan'],
        ['cl_kendaraan_haluan',     '4.5 Cara Mengambil Haluan'],
        ['cl_kendaraan_buggy_whip', '4.6 Bendera Tanda Kendaraan / Buggy Whip'],
        ['cl_kendaraan_radio',      '4.7 Radio Komunikasi'],
        ['cl_kendaraan_lampu',      '4.8 Lampu Rotary / Lampu Utama'],
    ]],
    ['label' => '5.0 Peralatan dan Perlindungan', 'items' => [
        ['cl_peralatan_pemilihan',    '5.1 Pemilihan & Penggunaan Peralatan'],
        ['cl_peralatan_safety_guard', '5.2 Pelindung Peralatan / Safety Guard'],
        ['cl_peralatan_pemakaian',    '5.3 Pemakaian Peralatan'],
        ['cl_peralatan_angkat',       '5.4 Peralatan Angkat'],
        ['cl_peralatan_elektrikal',   '5.5 Peralatan Elektrikal'],
        ['cl_peralatan_tangan',       '5.6 Peralatan Tangan'],
    ]],
    ['label' => '6.0 Daerah Kerja & Lingkungan', 'items' => [
        ['cl_lingkungan_kebersihan',  '6.1 Kebersihan & Kerapian Area Kerja'],
        ['cl_lingkungan_tumpahan',    '6.2 Pencegahan Tumpahan / Kebocoran'],
        ['cl_lingkungan_pencahayaan', '6.3 Pencahayaan / Penerangan'],
        ['cl_lingkungan_kebisingan',  '6.4 Kebisingan, Suhu, Getaran'],
        ['cl_lingkungan_barikade',    '6.5 Perlindungan / Barikade'],
        ['cl_lingkungan_rambu',       '6.6 Rambu-Rambu Peringatan & Delineator'],
        ['cl_lingkungan_limbah',      '6.7 Pengaturan Limbah & Sampah'],
    ]],
];
@endphp

<table>
    <tr>
        <th style="width: 40%">OK Audit Checklist</th>
        <th style="width: 15%">Aman</th>
        <th style="width: 15%">Beresiko</th>
    </tr>
    @foreach($categories as $cat)
    <tr>
        <td colspan="3" class="section-header">{{ $cat['label'] }}</td>
    </tr>
    @foreach($cat['items'] as [$field, $label])
    @php $val = $record->{$field}; @endphp
    <tr>
        <td>{{ $label }}</td>
        <td class="{{ $val === 'aman' ? 'cl-aman' : 'cl-empty' }}">{{ $val === 'aman' ? '✓' : '' }}</td>
        <td class="{{ $val === 'beresiko' ? 'cl-beresiko' : 'cl-empty' }}">{{ $val === 'beresiko' ? '✓' : '' }}</td>
    </tr>
    @endforeach
    @endforeach
    {{-- Lain-lain --}}
    <tr><td colspan="3" class="section-header">7.0 Lain-Lain</td></tr>
    @for($n = 1; $n <= 4; $n++)
    @php $val = $record->{'ll_'.$n.'_nilai'}; $lbl = $record->{'ll_'.$n.'_label'} ?: "Item $n"; @endphp
    <tr>
        <td>7.{{ $n }} {{ $lbl }}</td>
        <td class="{{ $val === 'aman' ? 'cl-aman' : 'cl-empty' }}">{{ $val === 'aman' ? '✓' : '' }}</td>
        <td class="{{ $val === 'beresiko' ? 'cl-beresiko' : 'cl-empty' }}">{{ $val === 'beresiko' ? '✓' : '' }}</td>
    </tr>
    @endfor
</table>

{{-- Narasi --}}
<table>
    @php
    $narasiFields = [
        'Tindakan / Kondisi Aman yang Diamati'           => $record->tindakan_kondisi_aman,
        'Tindakan untuk Meningkatkan Kerja Selamat'      => $record->tindakan_meningkatkan_selamat,
        'Tindakan / Kondisi Tidak Aman yang Diamati'     => $record->tindakan_kondisi_tidak_aman,
        'Tindakan yang Diambil Segera'                   => $record->tindakan_segera,
        'Tindakan untuk Mencegah Terulang Kembali'       => $record->tindakan_mencegah_terulang,
    ];
    @endphp
    @foreach($narasiFields as $label => $val)
    @if($val)
    <tr>
        <td class="narasi-label" style="width: 40%">{{ $label }}</td>
        <td class="narasi-val">{{ $val }}</td>
    </tr>
    @endif
    @endforeach
    @if($record->status_temuan && count($record->status_temuan))
    @php
    $statusLabels = [
        'sudah_selesai'    => 'Sudah Diperbaiki / Selesai',
        'perlu_penanganan' => 'Perlu Penanganan Khusus',
        'sedang_diperbaiki'=> 'Sedang Diperbaiki',
        'menunggu_material'=> 'Menunggu Material / Peralatan',
    ];
    @endphp
    <tr>
        <td class="narasi-label">Status Temuan</td>
        <td class="narasi-val">{{ implode('; ', array_map(fn($s) => $statusLabels[$s] ?? $s, $record->status_temuan)) }}</td>
    </tr>
    @endif
    @if($record->catatan)
    <tr>
        <td class="narasi-label">Catatan</td>
        <td class="narasi-val">{{ $record->catatan }}</td>
    </tr>
    @endif
</table>

{{-- Tanda tangan --}}
<table>
    <tr>
        <td style="width: 50%; text-align: center; padding: 10px;">
            <p><strong>Tanda Tangan Observer</strong></p>
            <p>{{ $record->user->name }}</p>
            <br><br>
            <p>____________________________</p>
        </td>
        <td style="width: 50%; text-align: center; padding: 10px;">
            <p><strong>Tanda Tangan Penanggung Jawab</strong></p>
            <p>{{ $record->penanggungJawab?->name ?? '-' }}</p>
            @if($record->pj_signature)
            <img src="{{ $record->pj_signature }}" class="sig-img" alt="TTD PJ" />
            @else
            <br><br>
            <p>____________________________</p>
            @endif
            @if($record->pj_dikonfirmasi_at)
            <p style="font-size: 9px; color: #555;">{{ $record->pj_dikonfirmasi_at->format('d/m/Y') }}</p>
            @endif
        </td>
    </tr>
</table>

<div class="tagline">SAYA PILIH SELAMAT</div>

</body>
</html>
