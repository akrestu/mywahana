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
    lokasi: string;
    total_poin: number;
    max_poin: number;
    persentase: number | null;
    risk_level: 'L' | 'M' | 'H' | 'VH' | null;
    status: 'menunggu_re_inspeksi' | 'selesai' | 'ditolak';
    tindakan_perbaikan: TindakanRow[] | null;
    foto_items: { [key: string]: string } | null;
    ttd_inspektor: string | null;
    ttd_re_inspektor: string | null;
    tolak_alasan: string | null;
    [key: string]: unknown;
};

type Props = { record: Record; is_ri: boolean };

const RISK_CFG = {
    L:  { label: 'Baik',           cls: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-green-500' },
    M:  { label: 'Cukup',          cls: 'bg-yellow-100 text-yellow-800 border-yellow-300', bar: 'bg-yellow-500' },
    H:  { label: 'Perhatian',      cls: 'bg-orange-100 text-orange-800 border-orange-300', bar: 'bg-orange-500' },
    VH: { label: 'Perlu Tindakan', cls: 'bg-red-100 text-red-800 border-red-300', bar: 'bg-red-500' },
};

const SCORE_BG: Record<string, string> = { '1': 'bg-red-100 text-red-700', '2': 'bg-orange-100 text-orange-700', '3': 'bg-yellow-100 text-yellow-700', '4': 'bg-green-100 text-green-700' };
const SCORE_LABEL = ['', 'Sangat Kurang', 'Kurang', 'Baik', 'Sangat Baik'];

const CATEGORIES = [
    { key: 'sanitasi', label: 'Sanitasi & Kebersihan Umum', items: [
        { key: 'sanitasi_1', label: '1. Lingkungan mess bersih, bebas sampah berserakan' },
        { key: 'sanitasi_2', label: '2. Saluran air/drainase tidak tersumbat dan berfungsi baik' },
        { key: 'sanitasi_3', label: '3. Tersedia tempat sampah yang cukup dan terpilah' },
        { key: 'sanitasi_4', label: '4. Sampah diangkut/dibuang secara rutin' },
        { key: 'sanitasi_5', label: '5. Tidak ada genangan air yang berpotensi jadi sarang nyamuk' },
        { key: 'sanitasi_6', label: '6. Toilet/kamar mandi bersih, tidak berbau, dan berfungsi' },
        { key: 'sanitasi_7', label: '7. Air bersih tersedia 24 jam dan cukup untuk penghuni' },
        { key: 'sanitasi_8', label: '8. Sabun dan perlengkapan kebersihan tersedia di kamar mandi' },
        { key: 'sanitasi_9', label: '9. Area cuci pakaian bersih dan drainasenya baik' },
        { key: 'sanitasi_10', label: '10. Hewan pengganggu (tikus, kecoa, nyamuk) dikendalikan' },
    ]},
    { key: 'kamar', label: 'Kamar Tidur & Fasilitas Pribadi', items: [
        { key: 'kamar_1', label: '11. Kamar tidur bersih, rapi, dan berventilasi baik' },
        { key: 'kamar_2', label: '12. Kapasitas kamar tidak melebihi batas yang ditentukan' },
        { key: 'kamar_3', label: '13. Tempat tidur dalam kondisi layak dan bersih' },
        { key: 'kamar_4', label: '14. Lemari/loker penyimpanan tersedia dan memadai' },
        { key: 'kamar_5', label: '15. Pencahayaan kamar mencukupi' },
        { key: 'kamar_6', label: '16. AC/kipas angin berfungsi dengan baik' },
        { key: 'kamar_7', label: '17. Tidak ada kerusakan pada pintu, jendela, atau kunci kamar' },
        { key: 'kamar_8', label: '18. Area koridor/lorong bersih dan bebas hambatan' },
    ]},
    { key: 'dapur', label: 'Dapur & Area Makan', items: [
        { key: 'dapur_1', label: '19. Dapur bersih, peralatan masak dalam kondisi baik' },
        { key: 'dapur_2', label: '20. Makanan tersimpan dengan benar (tertutup, suhu tepat)' },
        { key: 'dapur_3', label: '21. Kulkas/freezer berfungsi baik dan bersih' },
        { key: 'dapur_4', label: '22. Area makan bersih dan meja makan layak' },
        { key: 'dapur_5', label: '23. Tidak ada kontaminasi silang antara makanan mentah dan matang' },
    ]},
    { key: 'sampah', label: 'Pengelolaan Sampah & Lingkungan', items: [
        { key: 'sampah_1', label: '24. TPS sampah mess tertutup dan tidak menimbulkan bau' },
        { key: 'sampah_2', label: '25. Jadwal pengangkutan sampah ada dan dipatuhi' },
        { key: 'sampah_3', label: '26. Tidak ada pembakaran sampah di area mess' },
        { key: 'sampah_4', label: '27. Taman/area hijau di sekitar mess terawat' },
        { key: 'sampah_5', label: '28. Fasilitas olahraga/rekreasi (jika ada) aman dan terawat' },
    ]},
] as const;

function StatusBadge({ s }: { s: string }) {
    if (s === 'selesai') return <Badge className="bg-green-100 text-green-700 border-green-300">Selesai</Badge>;
    if (s === 'ditolak') return <Badge className="bg-red-100 text-red-700 border-red-300">Ditolak</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Menunggu Re-Inspeksi</Badge>;
}

export default function InspeksiMessShow({ record, is_ri }: Props) {
    const tanggal = new Date(record.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const risk = record.risk_level ? RISK_CFG[record.risk_level] : null;

    return (
        <>
            <Head title="Detail Inspeksi Mess" />
            <div className="flex flex-col gap-6 max-w-2xl">
                <div className="flex items-start gap-3">
                    <Link href="/sap/inspeksi-mess"><button className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-accent transition-colors mt-0.5"><ArrowLeft size={18} /></button></Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">Inspeksi Area Mess</h2><StatusBadge s={record.status} /></div>
                        <p className="text-sm text-muted-foreground mt-0.5">{tanggal}</p>
                    </div>
                    <a href={`/sap/inspeksi-mess/${record.id}/pdf`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-1.5"><Download size={14} /> PDF</Button></a>
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
                        <div className="flex justify-between"><span className="text-muted-foreground">Lokasi Mess</span><span className="font-semibold">{record.lokasi}</span></div>
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
                        <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                            Menunggu re-inspeksi dari {record.re_inspektor.name}
                        </p>
                        {is_ri && (
                            <Link href={`/sap/inspeksi-mess/${record.id}/re-inspeksi`}>
                                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white shrink-0">Lakukan Re-Inspeksi</Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
