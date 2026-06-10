import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type TindakanRow = { tindakan: string; pic: string; due_date: string; remark: string };

type Record = {
    id: number;
    user: UserInfo;
    re_inspektor: UserInfo | null;
    peserta: UserInfo[];
    tanggal: string;
    project_site: string;
    departemen: string;
    total_poin: number;
    max_poin: number;
    persentase: number | null;
    risk_level: 'L' | 'M' | 'H' | 'VH' | null;
    status: 'menunggu_re_inspeksi' | 'selesai' | 'ditolak';
    tindakan_perbaikan: TindakanRow[] | null;
    foto_items: { [key: string]: string } | null;
    ttd_inspektor: string | null;
    ttd_re_inspektor: string | null;
    re_inspeksi_at: string | null;
    tolak_alasan: string | null;
    [key: string]: unknown;
};

type Props = { record: Record };

const RISK_CFG = {
    L:  { label: 'Baik',           cls: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-green-500' },
    M:  { label: 'Cukup',          cls: 'bg-yellow-100 text-yellow-800 border-yellow-300', bar: 'bg-yellow-500' },
    H:  { label: 'Perhatian',      cls: 'bg-orange-100 text-orange-800 border-orange-300', bar: 'bg-orange-500' },
    VH: { label: 'Perlu Tindakan', cls: 'bg-red-100 text-red-800 border-red-300', bar: 'bg-red-500' },
};

const SCORE_BG: Record<string, string> = { '1': 'bg-red-100 text-red-700', '2': 'bg-orange-100 text-orange-700', '3': 'bg-yellow-100 text-yellow-700', '4': 'bg-green-100 text-green-700' };
const SCORE_LABEL = ['', 'Sangat Kurang', 'Kurang', 'Baik', 'Sangat Baik'];

const CATEGORIES = [
    { key: 'situasi', label: 'Situasi', items: [
        { key: 'situasi_1', label: '1. House Keeping/kebersihan lingkungan memadai/bebas dari sampah dan bahan bekas lainnya' },
        { key: 'situasi_2', label: '2. Jalan angkut rata (tidak bergelombang) dan bebas dari batuan lepas' },
        { key: 'situasi_3', label: '3. Lebar jalan angkut sesuai dengan standar (2x lebar kendaraan terbesar untuk jalan satu arah atau 3.5x untuk jalan 2 arah)' },
        { key: 'situasi_4', label: '4. Semua jalan angkut dilengkapi dengan tanggul pengaman sesuai standar; Tanggul dilengkapi dengan post guide dan terdapat parit/drainage' },
        { key: 'situasi_5', label: '5. Dinding galian dalam keadaan stabil, tidak terdapat keretakan' },
        { key: 'situasi_6', label: '6. Tidak terdapat material longsor atau material yang menggantung di atas dinding galian' },
        { key: 'situasi_7', label: '7. Ketinggian dan kemiringan slope sesuai dengan standar dan bebas dari batuan lepas' },
        { key: 'situasi_8', label: '8. Tempat pembuangan/dumping rata, tidak ada batu besar dan lumpur' },
        { key: 'situasi_9', label: '9. Dumping area tidak terdapat keretakan; dilengkapi dengan tanggul pengaman yang memadai' },
        { key: 'situasi_10', label: '10. Lampu penerangan mencukupi untuk semua area untuk shift malam' },
        { key: 'situasi_11', label: '11. Semua lampu penerangan berada pada tempat yang aman dan dilindungi dengan tanggul pengaman yang memadai' },
        { key: 'situasi_12', label: '12. Semua karyawan berada pada tempat yang aman' },
        { key: 'situasi_13', label: '13. Semua kendaraan sarana diparkir pada tempat yang aman' },
    ]},
    { key: 'individu', label: 'Individu', items: [
        { key: 'individu_1', label: '14. Semua Karyawan memakai APD yang sesuai' },
        { key: 'individu_2', label: '15. Semua operator dan driver mempunyai SIMPER yang sesuai (random Sampling)' },
    ]},
    { key: 'alat', label: 'Alat', items: [
        { key: 'alat_1', label: '16. Rambu-rambu lalu lintas dengan ukuran yang memadai dan terlihat jelas dengan jarak 50m' },
        { key: 'alat_2', label: '17. Semua equipment dan kendaraan bersih, lampu-lampu peringatan berfungsi dengan baik' },
        { key: 'alat_3', label: '18. Terdapat rambu penunjuk arah keluar dan masuk PIT; Terdapat rambu evakuasi ke arah titik pengungsian/Muster point' },
        { key: 'alat_4', label: '19. Drainase atau saluran air berfungsi dengan baik' },
        { key: 'alat_5', label: '20. Semua kendaraan sarana untuk pengawas dilengkapi dengan kotak P3K' },
        { key: 'alat_6', label: '21. Tersedia APAR di semua unit dan tersedia 1 unit water truck yang dapat berfungsi sebagai unit pemadam kebakaran' },
    ]},
    { key: 'prosedur', label: 'Prosedur', items: [
        { key: 'prosedur_1', label: '22. Pengendalian Debu: debu terkendali, terdapat jadwal penyiraman dan jumlah water truck mencukupi' },
        { key: 'prosedur_2', label: '23. Bench dilengkapi dengan safety berm yang memadai' },
        { key: 'prosedur_3', label: '24. Semua kendaraan sarana dengan ketinggian kurang dari 4 meter dilengkapi dengan buggy whip yang tingginya 4 meter dari tanah' },
        { key: 'prosedur_4', label: '25. Semua operator dan driver melakukan pre-start Check / P2H (random sampling)' },
        { key: 'prosedur_5', label: '26. Semua operator dan driver memakai seat belt (random sampling)' },
    ]},
] as const;

function StatusBadge({ s }: { s: string }) {
    if (s === 'selesai') return <Badge className="bg-green-100 text-green-700 border-green-300">Selesai</Badge>;
    if (s === 'ditolak') return <Badge className="bg-red-100 text-red-700 border-red-300">Ditolak</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Menunggu Re-Inspeksi</Badge>;
}

export default function InspeksiTambangShow({ record }: Props) {
    const tanggal = new Date(record.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const risk = record.risk_level ? RISK_CFG[record.risk_level] : null;

    return (
        <>
            <Head title="Detail Inspeksi Tambang" />
            <div className="flex flex-col gap-6 max-w-2xl">
                <div className="flex items-start gap-3">
                    <Link href="/sap/inspeksi-tambang"><button className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-accent transition-colors mt-0.5"><ArrowLeft size={18} /></button></Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">Inspeksi Area Tambang</h2><StatusBadge s={record.status} /></div>
                        <p className="text-sm text-muted-foreground mt-0.5">{tanggal}</p>
                    </div>
                    <a href={`/sap/inspeksi-tambang/${record.id}/pdf`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-1.5"><Download size={14} /> PDF</Button></a>
                </div>

                {risk && record.persentase !== null && (
                    <div className={cn('rounded-2xl border-2 px-4 py-4', risk.cls)}>
                        <div className="flex items-center justify-between">
                            <div><p className="font-bold text-3xl">{record.persentase}%</p><p className="text-sm mt-0.5">{record.total_poin} / {record.max_poin} poin</p></div>
                            <span className="font-bold text-base px-4 py-2 rounded-xl bg-white/50">{risk.label}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-black/10 overflow-hidden">
                            <div className={cn('h-full rounded-full', risk.bar)} style={{ width: `${record.persentase}%` }} />
                        </div>
                    </div>
                )}

                {record.status === 'ditolak' && record.tolak_alasan && (
                    <div className="rounded-2xl border-2 border-red-300 bg-red-50/50 dark:bg-red-950/10 px-4 py-4">
                        <p className="font-bold text-red-700 dark:text-red-400 text-sm mb-1">Alasan Penolakan</p>
                        <p className="text-sm text-red-800 dark:text-red-300">{record.tolak_alasan}</p>
                    </div>
                )}

                <Card className="p-0 overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Informasi Inspeksi</div>
                    <CardContent className="py-4 flex flex-col gap-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Inspektor</span><span className="font-semibold">{record.user.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Project / Site</span><span className="font-semibold">{record.project_site}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Departemen</span><span className="font-semibold">{record.departemen}</span></div>
                        {record.re_inspektor && <><Separator /><div className="flex justify-between"><span className="text-muted-foreground">Re-Inspektor</span><span className="font-semibold">{record.re_inspektor.name}</span></div></>}
                        {record.peserta && record.peserta.length > 0 && <><Separator /><div className="flex justify-between gap-2"><span className="text-muted-foreground">Peserta</span><div className="flex flex-col items-end gap-1">{record.peserta.map(p => <span key={p.id} className="font-semibold">{p.name}</span>)}</div></div></>}
                    </CardContent>
                </Card>

                {CATEGORIES.map(cat => (
                    <Card key={cat.key} className="p-0 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">{cat.label}</div>
                        <CardContent className="p-0">
                            {cat.items.map((item, idx) => {
                                const score = String(record[item.key] ?? '');
                                const foto = record.foto_items?.[item.key];
                                return (
                                    <div key={item.key}>
                                        <div className="px-4 py-3 flex flex-col gap-2">
                                            <p className="text-sm leading-relaxed">{item.label}</p>
                                            <div className="flex items-center justify-between gap-3">
                                                {score ? <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', SCORE_BG[score])}>{score} — {SCORE_LABEL[Number(score)]}</span> : <span className="text-xs text-muted-foreground italic">Tidak dinilai</span>}
                                                {foto && <a href={`/storage/${foto}`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"><FileText size={12} /> Foto</Button></a>}
                                            </div>
                                        </div>
                                        {idx < cat.items.length - 1 && <Separator />}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}

                {record.tindakan_perbaikan && record.tindakan_perbaikan.length > 0 && (
                    <Card className="p-0 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Rekomendasi Tindakan Perbaikan</div>
                        <CardContent className="p-4 flex flex-col gap-3">
                            {record.tindakan_perbaikan.map((row, i) => (
                                <div key={i} className="rounded-xl border p-3 flex flex-col gap-1.5 text-sm">
                                    <p className="font-semibold">{i + 1}. {row.tindakan}</p>
                                    <div className="flex gap-4 text-muted-foreground"><span>PIC: <span className="text-foreground">{row.pic}</span></span><span>Due: <span className="text-foreground">{row.due_date}</span></span></div>
                                    {row.remark && <p className="text-muted-foreground text-xs">{row.remark}</p>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card className="p-0 overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Tanda Tangan</div>
                    <CardContent className="py-4 flex flex-col gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Inspektor — {record.user.name}</p>
                            {record.ttd_inspektor ? <img src={record.ttd_inspektor} alt="TTD Inspektor" className="rounded-xl border bg-white dark:bg-muted/20 max-w-xs w-full" /> : <p className="text-sm text-muted-foreground italic">Belum ada tanda tangan</p>}
                        </div>
                        {record.re_inspektor && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Re-Inspektor — {record.re_inspektor.name}</p>
                                {record.ttd_re_inspektor ? <img src={record.ttd_re_inspektor} alt="TTD Re-Inspektor" className="rounded-xl border bg-white dark:bg-muted/20 max-w-xs w-full" /> : <p className="text-sm text-muted-foreground italic">Belum ditandatangani</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {record.status === 'menunggu_re_inspeksi' && record.re_inspektor && (
                    <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10 px-4 py-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">Menunggu konfirmasi re-inspektor</p>
                    </div>
                )}
            </div>
        </>
    );
}
