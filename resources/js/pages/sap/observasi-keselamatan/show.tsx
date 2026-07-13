import { Head, Link } from '@inertiajs/react';
import { Check, CheckCircle2, Clock, FileText, MapPin, User, Wrench, X, XCircle } from 'lucide-react';
import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type ChecklistVal = 'aman' | 'beresiko' | null;

type OKRecord = {
    id: number;
    user: UserInfo;
    penanggung_jawab: UserInfo | null;
    tanggal: string;
    jenis_pekerjaan: string;
    lokasi_kerja: string;
    peralatan_digunakan: string | null;
    status: 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak';
    pj_signature: string | null;
    pj_dikonfirmasi_at: string | null;
    pj_tolak_alasan: string | null;
    pj_ditolak_at: string | null;
    // narasi
    tindakan_kondisi_aman: string | null;
    tindakan_meningkatkan_selamat: string | null;
    tindakan_kondisi_tidak_aman: string | null;
    tindakan_segera: string | null;
    tindakan_mencegah_terulang: string | null;
    status_temuan: string[] | null;
    catatan: string | null;
    // checklist (sampel — backend mengirim semua field)
    [key: string]: unknown;
};

type Props = { record: OKRecord; is_pj: boolean };

const CHECKLIST_CATEGORIES = [
    {
        label: '1.0 Prosedur',
        items: [
            { key: 'cl_prosedur_mine_permit',     label: '1.1 Mine Permit / Ijin Masuk Lokasi Tambang' },
            { key: 'cl_prosedur_komisioning',     label: '1.2 Komisioning / Inspeksi' },
            { key: 'cl_prosedur_p2h',             label: '1.3 Pelaksanaan Pemeriksaan Harian (P2H)' },
            { key: 'cl_prosedur_instruksi_kerja', label: '1.4 Instruksi Kerja / Tata Cara Kerja Aman' },
            { key: 'cl_prosedur_loto',            label: '1.5 Sistem Penguncian & Pelabelan (LOTO)' },
            { key: 'cl_prosedur_sop_jsa',         label: '1.6 SOP / JSA' },
        ],
    },
    {
        label: '2.0 Alat Pelindung Diri (APD)',
        items: [
            { key: 'cl_apd_kepala',              label: '2.1 Kepala' },
            { key: 'cl_apd_mata_wajah',          label: '2.2 Mata dan Wajah' },
            { key: 'cl_apd_pendengaran',         label: '2.3 Pendengaran' },
            { key: 'cl_apd_pernapasan',          label: '2.4 Sistem Pernapasan' },
            { key: 'cl_apd_pelindung_jatuh',     label: '2.5 Alat Pelindung Jatuh' },
            { key: 'cl_apd_pelindung_tenggelam', label: '2.6 Alat Pelindung Tenggelam' },
            { key: 'cl_apd_lengan_tangan',       label: '2.7 Lengan dan Tangan' },
            { key: 'cl_apd_paha_kaki',           label: '2.8 Paha dan Kaki' },
        ],
    },
    {
        label: '3.0 Posisi Badan & Reaksi Orang',
        items: [
            { key: 'cl_posisi_mengangkat',         label: '3.1 Cara Mengangkat, Mendorong, Menarik' },
            { key: 'cl_posisi_mengubah_posisi',    label: '3.2 Mengubah Posisi' },
            { key: 'cl_posisi_mengatur_pekerjaan', label: '3.3 Mengatur Pekerjaan' },
            { key: 'cl_posisi_dekat_listrik',      label: '3.4 Dekat dengan Arus Listrik Bertegangan' },
            { key: 'cl_posisi_dekat_berbahaya',    label: '3.5 Dekat dengan Area atau Bahan Berbahaya' },
            { key: 'cl_posisi_dekat_longsor',      label: '3.6 Dekat dengan Dinding/Galian Rawan Longsor' },
            { key: 'cl_posisi_dekat_air',          label: '3.6b Dekat dengan Air' },
            { key: 'cl_posisi_turun_naik',         label: '3.7 Turun / Naik' },
        ],
    },
    {
        label: '4.0 Berkendara & Mengoperasikan Unit',
        items: [
            { key: 'cl_kendaraan_sim_sio',    label: '4.1 SIM / SIO / SIMPER' },
            { key: 'cl_kendaraan_sabuk',      label: '4.2 Sabuk Keselamatan' },
            { key: 'cl_kendaraan_kecepatan',  label: '4.3 Batas Kecepatan' },
            { key: 'cl_kendaraan_jarak',      label: '4.4 Jarak Kendaraan / Beriringan' },
            { key: 'cl_kendaraan_haluan',     label: '4.5 Cara Mengambil Haluan' },
            { key: 'cl_kendaraan_buggy_whip', label: '4.6 Bendera Tanda Kendaraan / Buggy Whip' },
            { key: 'cl_kendaraan_radio',      label: '4.7 Radio Komunikasi' },
            { key: 'cl_kendaraan_lampu',      label: '4.8 Lampu Rotary / Lampu Utama' },
        ],
    },
    {
        label: '5.0 Peralatan dan Perlindungan',
        items: [
            { key: 'cl_peralatan_pemilihan',    label: '5.1 Pemilihan & Penggunaan Peralatan' },
            { key: 'cl_peralatan_safety_guard', label: '5.2 Pelindung Peralatan / Safety Guard' },
            { key: 'cl_peralatan_pemakaian',    label: '5.3 Pemakaian Peralatan' },
            { key: 'cl_peralatan_angkat',       label: '5.4 Peralatan Angkat' },
            { key: 'cl_peralatan_elektrikal',   label: '5.5 Peralatan Elektrikal' },
            { key: 'cl_peralatan_tangan',       label: '5.6 Peralatan Tangan' },
        ],
    },
    {
        label: '6.0 Daerah Kerja & Lingkungan',
        items: [
            { key: 'cl_lingkungan_kebersihan',  label: '6.1 Kebersihan & Kerapian Area Kerja' },
            { key: 'cl_lingkungan_tumpahan',    label: '6.2 Pencegahan Tumpahan / Kebocoran' },
            { key: 'cl_lingkungan_pencahayaan', label: '6.3 Pencahayaan / Penerangan' },
            { key: 'cl_lingkungan_kebisingan',  label: '6.4 Kebisingan, Suhu, Getaran' },
            { key: 'cl_lingkungan_barikade',    label: '6.5 Perlindungan / Barikade' },
            { key: 'cl_lingkungan_rambu',       label: '6.6 Rambu-Rambu Peringatan & Delineator' },
            { key: 'cl_lingkungan_limbah',      label: '6.7 Pengaturan Limbah & Sampah' },
        ],
    },
];

const STATUS_TEMUAN_LABELS: Record<string, string> = {
    sudah_selesai:    'Sudah Diperbaiki / Selesai',
    perlu_penanganan: 'Perlu Penanganan Khusus',
    sedang_diperbaiki:'Sedang Diperbaiki',
    menunggu_material:'Menunggu Material / Peralatan',
};

function ClItem({ value, label }: { value: ChecklistVal; label: string }) {
    if (!value) {
return null;
}

    return (
        <div className={cn(
            'flex items-center justify-between gap-3 px-4 py-3',
            value === 'beresiko' && 'bg-red-50/50 dark:bg-red-950/10',
            value === 'aman' && 'bg-green-50/50 dark:bg-green-950/10',
        )}>
            <span className="text-sm flex-1">{label}</span>
            <Badge variant="outline" className={cn(
                'text-xs font-bold',
                value === 'aman' ? 'border-green-400 text-green-700 bg-green-50' : 'border-red-400 text-red-700 bg-red-50',
            )}>
                {value === 'aman' ? <><Check size={12} className="mr-1" />Aman</> : <><X size={12} className="mr-1" />Beresiko</>}
            </Badge>
        </div>
    );
}

export default function ObservasiKeselamatanShow({ record, is_pj }: Props) {
    const tanggalFormatted = new Date(record.tanggal).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <>
            <Head title={`OK – ${tanggalFormatted}`} />
            <div className="flex flex-col gap-6 max-w-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Observasi Keselamatan</h2>
                        <p className="text-sm text-muted-foreground">{tanggalFormatted}</p>
                    </div>
                    <a href={`/sap/observasi-keselamatan/${record.id}/pdf`} target="_blank">
                        <Button variant="outline" className="h-10 gap-2">
                            <FileText size={16} /> PDF
                        </Button>
                    </a>
                </div>

                {/* Status */}
                <div className={cn(
                    'flex items-center gap-3 rounded-2xl border-2 px-4 py-4',
                    record.status === 'dikonfirmasi' ? 'border-green-300 bg-green-50 dark:bg-green-950/20' :
                    record.status === 'ditolak' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' :
                    'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20',
                )}>
                    {record.status === 'dikonfirmasi'
                        ? <CheckCircle2 size={22} className="text-green-600 shrink-0" />
                        : record.status === 'ditolak'
                            ? <XCircle size={22} className="text-red-600 shrink-0" />
                            : <Clock size={22} className="text-yellow-600 shrink-0" />}
                    <div>
                        <p className="font-bold">
                            {record.status === 'dikonfirmasi' ? 'Dikonfirmasi' :
                             record.status === 'ditolak' ? 'Ditolak oleh PJ' :
                             'Menunggu Konfirmasi PJ'}
                        </p>
                        {record.pj_dikonfirmasi_at && (
                            <p className="text-sm text-muted-foreground">
                                {new Date(record.pj_dikonfirmasi_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        )}
                        {record.pj_ditolak_at && (
                            <p className="text-sm text-muted-foreground">
                                {new Date(record.pj_ditolak_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                    {record.status === 'menunggu_konfirmasi' && is_pj && (
                        <Link href={`/sap/observasi-keselamatan/${record.id}/konfirmasi`} className="ml-auto">
                            <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700">Konfirmasi Sekarang</Button>
                        </Link>
                    )}
                </div>

                {/* Alasan tolak */}
                {record.status === 'ditolak' && record.pj_tolak_alasan && (
                    <Card className="p-0 overflow-hidden border-red-200 dark:border-red-800">
                        <div className="bg-red-50/50 dark:bg-red-950/20 px-4 py-3 border-b border-red-200 dark:border-red-800 font-bold text-sm text-red-700 dark:text-red-400">
                            Alasan Penolakan
                        </div>
                        <CardContent className="px-4 py-4 text-sm leading-relaxed">{record.pj_tolak_alasan}</CardContent>
                    </Card>
                )}

                {/* Info umum */}
                <Card className="p-0 overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Informasi Umum</div>
                    <CardContent className="py-0">
                        {[
                            { icon: User, label: 'Observer', value: `${record.user.name}${record.user.jabatan ? ` — ${record.user.jabatan}` : ''}` },
                            { icon: User, label: 'Penanggung Jawab', value: record.penanggung_jawab ? `${record.penanggung_jawab.name}${record.penanggung_jawab.jabatan ? ` — ${record.penanggung_jawab.jabatan}` : ''}` : '—' },
                            { icon: MapPin, label: 'Lokasi Kerja', value: record.lokasi_kerja },
                            { icon: Wrench, label: 'Jenis Pekerjaan', value: record.jenis_pekerjaan },
                            { icon: Wrench, label: 'Peralatan', value: record.peralatan_digunakan ?? '—' },
                        ].map(({ icon: Icon, label, value }, idx, arr) => (
                            <Fragment key={label}>
                                <div className="flex items-start gap-3 py-3.5 text-sm">
                                    <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                                    <dt className="text-muted-foreground w-40 shrink-0">{label}</dt>
                                    <dd className="font-semibold">{value}</dd>
                                </div>
                                {idx < arr.length - 1 && <Separator />}
                            </Fragment>
                        ))}
                    </CardContent>
                </Card>

                {/* Checklist */}
                {CHECKLIST_CATEGORIES.map(cat => {
                    const filled = cat.items.filter(i => record[i.key] != null && record[i.key] !== '');

                    if (filled.length === 0) {
return null;
}

                    return (
                        <Card key={cat.label} className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">{cat.label}</div>
                            <CardContent className="p-0">
                                {cat.items.map((item, idx) => {
                                    const val = record[item.key] as ChecklistVal;

                                    if (!val) {
return null;
}

                                    return (
                                        <Fragment key={item.key}>
                                            <ClItem value={val} label={item.label} />
                                            {idx < cat.items.length - 1 && <Separator />}
                                        </Fragment>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Lain-lain */}
                {[1, 2, 3, 4].some(n => record[`ll_${n}_nilai`]) && (
                    <Card className="p-0 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">7.0 Lain-Lain</div>
                        <CardContent className="p-0">
                            {[1, 2, 3, 4].map((n, idx) => {
                                const val = record[`ll_${n}_nilai`] as ChecklistVal;
                                const label = (record[`ll_${n}_label`] as string) || `Item ${n}`;

                                if (!val) {
return null;
}

                                return (
                                    <Fragment key={n}>
                                        <ClItem value={val} label={`7.${n} ${label}`} />
                                        {idx < 3 && <Separator />}
                                    </Fragment>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Narasi */}
                {[
                    { key: 'tindakan_kondisi_aman',         label: 'Tindakan / Kondisi Aman yang Diamati' },
                    { key: 'tindakan_meningkatkan_selamat', label: 'Tindakan untuk Meningkatkan Kerja Selamat' },
                    { key: 'tindakan_kondisi_tidak_aman',   label: 'Tindakan / Kondisi Tidak Aman yang Diamati' },
                    { key: 'tindakan_segera',               label: 'Tindakan yang Diambil Segera' },
                    { key: 'tindakan_mencegah_terulang',    label: 'Tindakan untuk Mencegah Terulang Kembali' },
                ].filter(({ key }) => record[key]).map(({ key, label }) => (
                    <Card key={key} className="p-0 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">{label}</div>
                        <CardContent className="px-4 py-4 text-sm leading-relaxed">
                            {record[key] as string}
                        </CardContent>
                    </Card>
                ))}

                {/* Status Temuan */}
                {record.status_temuan && record.status_temuan.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <p className="font-bold text-sm">Status Temuan</p>
                        <div className="flex flex-wrap gap-2">
                            {record.status_temuan.map(s => (
                                <Badge key={s} variant="outline" className="text-xs">{STATUS_TEMUAN_LABELS[s] ?? s}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Catatan */}
                {record.catatan && (
                    <Card className="p-0 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Catatan</div>
                        <CardContent className="px-4 py-4 text-sm leading-relaxed">{record.catatan}</CardContent>
                    </Card>
                )}

                {/* Tanda tangan PJ */}
                {record.pj_signature && (
                    <Card className="p-0 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">
                            Tanda Tangan Penanggung Jawab
                            {record.penanggung_jawab && <span className="ml-2 font-normal text-muted-foreground">({record.penanggung_jawab.name})</span>}
                        </div>
                        <CardContent className="p-4">
                            <img src={record.pj_signature} alt="Tanda tangan PJ" className="max-h-40 w-full object-contain rounded-xl border bg-white" />
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
