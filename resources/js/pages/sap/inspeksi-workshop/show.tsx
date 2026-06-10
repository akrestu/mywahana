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
    { key: 'bangunan', label: 'Bangunan / Fasilitas', items: [
        { key: 'bangunan_1', label: '1. Atap/dinding tidak bocor/rusak/tidak aman' },
        { key: 'bangunan_2', label: '2. Lantai kering, bersih, dan tidak licin' },
        { key: 'bangunan_3', label: '3. Jalan keluar masuk bebas hambatan' },
        { key: 'bangunan_4', label: '4. Pintu darurat berfungsi dan tidak terhalang' },
        { key: 'bangunan_5', label: '5. Ventilasi dan pencahayaan mencukupi' },
        { key: 'bangunan_6', label: '6. Tangga/platform dalam kondisi aman' },
        { key: 'bangunan_7', label: '7. Rambu keselamatan terpasang dan terlihat jelas' },
        { key: 'bangunan_8', label: '8. Kebersihan area kerja terjaga' },
        { key: 'bangunan_9', label: '9. Area penyimpanan bahan kimia aman dan berlabel' },
        { key: 'bangunan_10', label: '10. Tempat sampah tersedia dan terpisah sesuai jenis' },
        { key: 'bangunan_11', label: '11. Fasilitas P3K tersedia dan lengkap' },
        { key: 'bangunan_12', label: '12. Jalur evakuasi ditandai dengan jelas' },
        { key: 'bangunan_13', label: '13. Titik kumpul evakuasi jelas' },
        { key: 'bangunan_14', label: '14. Peralatan kerja disimpan dengan tertata rapi' },
        { key: 'bangunan_15', label: '15. Bahan mudah terbakar tersimpan di tempat aman' },
        { key: 'bangunan_16', label: '16. Material tidak berserakan di area kerja' },
        { key: 'bangunan_17', label: '17. MSDS/SDS tersedia untuk semua bahan kimia' },
        { key: 'bangunan_18', label: '18. Tanda larangan merokok terpasang di tempat yang tepat' },
        { key: 'bangunan_19', label: '19. Area non-smoking dipatuhi' },
        { key: 'bangunan_20', label: '20. Toilet/kamar mandi bersih dan berfungsi' },
        { key: 'bangunan_21', label: '21. Air bersih tersedia untuk cuci tangan' },
    ]},
    { key: 'kelistrikan', label: 'Instalasi Kelistrikan', items: [
        { key: 'kelistrikan_1', label: '22. Panel listrik dalam kondisi tertutup dan berlabel' },
        { key: 'kelistrikan_2', label: '23. Kabel tidak berserakan atau terkelupas' },
        { key: 'kelistrikan_3', label: '24. Stop kontak/saklar tidak rusak' },
        { key: 'kelistrikan_4', label: '25. Grounding/earthing peralatan listrik berfungsi' },
        { key: 'kelistrikan_5', label: '26. Tidak ada overloading pada instalasi listrik' },
        { key: 'kelistrikan_6', label: '27. Lampu penerangan berfungsi dengan baik' },
        { key: 'kelistrikan_7', label: '28. Genset/UPS dalam kondisi baik jika ada' },
        { key: 'kelistrikan_8', label: '29. Peralatan listrik portabel dalam kondisi aman' },
    ]},
    { key: 'welder', label: 'Area Pengelasan (Welder)', items: [
        { key: 'welder_1', label: '30. APD las (helm, sarung tangan, apron) tersedia dan layak' },
        { key: 'welder_2', label: '31. Tirai/welding curtain terpasang' },
        { key: 'welder_3', label: '32. Ventilasi memadai di area pengelasan' },
        { key: 'welder_4', label: '33. Peralatan las dalam kondisi baik dan aman' },
        { key: 'welder_5', label: '34. Tidak ada bahan mudah terbakar di sekitar area las' },
        { key: 'welder_6', label: '35. Izin kerja las (hot work permit) tersedia jika diperlukan' },
    ]},
    { key: 'tabung', label: 'Tabung Gas', items: [
        { key: 'tabung_1', label: '36. Tabung gas berdiri tegak dan terikat/terpasang aman' },
        { key: 'tabung_2', label: '37. Tutup/cap tabung gas terpasang saat tidak digunakan' },
        { key: 'tabung_3', label: '38. Regulator dan selang gas dalam kondisi baik' },
        { key: 'tabung_4', label: '39. Tabung gas tidak bocor (dilakukan pengecekan)' },
        { key: 'tabung_5', label: '40. Tabung gas penuh dan kosong dipisahkan' },
        { key: 'tabung_6', label: '41. Label tabung gas (isi, kosong, rusak) jelas' },
    ]},
    { key: 'alat_angkat', label: 'Alat Angkat / Rigging', items: [
        { key: 'alat_angkat_1', label: '42. Sling/rantai angkat dalam kondisi baik, tidak rusak' },
        { key: 'alat_angkat_2', label: '43. Kapasitas angkat alat tertera dengan jelas' },
        { key: 'alat_angkat_3', label: '44. Hoist/crane diperiksa secara berkala (ada stiker inspeksi)' },
        { key: 'alat_angkat_4', label: '45. Operator alat angkat berkompetensi/bersertifikat' },
        { key: 'alat_angkat_5', label: '46. Area pengangkatan dibebaskan dari personel yang tidak berkepentingan' },
    ]},
    { key: 'tps', label: 'Tempat Penyimpanan (TPS)', items: [
        { key: 'tps_1', label: '47. Rak/shelving kokoh dan tidak overload' },
        { key: 'tps_2', label: '48. Barang berat di bawah, ringan di atas' },
        { key: 'tps_3', label: '49. Material bertumpuk tidak melebihi batas aman' },
        { key: 'tps_4', label: '50. Label/identifikasi material terpasang jelas' },
        { key: 'tps_5', label: '51. Jalur akses penyimpanan bebas hambatan' },
        { key: 'tps_6', label: '52. Limbah B3 tersimpan di TPS khusus dan berlabel' },
        { key: 'tps_7', label: '53. Manifest limbah B3 tersedia dan updated' },
        { key: 'tps_8', label: '54. Oli bekas tersimpan di drum tertutup' },
        { key: 'tps_9', label: '55. Spill kit tersedia di dekat area TPS' },
        { key: 'tps_10', label: '56. Bunding/secondary containment untuk bahan kimia tersedia' },
        { key: 'tps_11', label: '57. APAR tersedia dan mudah dijangkau di area TPS' },
        { key: 'tps_12', label: '58. Inspeksi APAR dilakukan secara rutin (kartu inspeksi ada)' },
    ]},
    { key: 'tyre', label: 'Area Tyre / Ban', items: [
        { key: 'tyre_1', label: '59. Ban tersimpan dengan aman (tidak berpotensi menggelinding)' },
        { key: 'tyre_2', label: '60. Peralatan pengisian angin (kompresor, selang) aman' },
        { key: 'tyre_3', label: '61. APD tersedia untuk pekerjaan tyre (sarung tangan, pelindung wajah)' },
    ]},
] as const;

function StatusBadge({ s }: { s: string }) {
    if (s === 'selesai') return <Badge className="bg-green-100 text-green-700 border-green-300">Selesai</Badge>;
    if (s === 'ditolak') return <Badge className="bg-red-100 text-red-700 border-red-300">Ditolak</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Menunggu Re-Inspeksi</Badge>;
}

export default function InspeksiWorkshopShow({ record }: Props) {
    const tanggal = new Date(record.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const risk = record.risk_level ? RISK_CFG[record.risk_level] : null;

    return (
        <>
            <Head title="Detail Inspeksi Workshop" />
            <div className="flex flex-col gap-6 max-w-2xl">
                <div className="flex items-start gap-3">
                    <Link href="/sap/inspeksi-workshop"><button className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-accent transition-colors mt-0.5"><ArrowLeft size={18} /></button></Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">Inspeksi Area Workshop</h2><StatusBadge s={record.status} /></div>
                        <p className="text-sm text-muted-foreground mt-0.5">{tanggal}</p>
                    </div>
                    <a href={`/sap/inspeksi-workshop/${record.id}/pdf`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-1.5"><Download size={14} /> PDF</Button></a>
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
            </div>
        </>
    );
}
