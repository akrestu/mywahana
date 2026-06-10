import { Head, Link } from '@inertiajs/react';
import { Building2, CalendarDays, FileText, Users } from 'lucide-react';
import { Fragment } from 'react';
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
    total_poin: number | null;
    max_poin: number;
    persentase: number | null;
    risk_level: 'L' | 'M' | 'H' | 'VH' | null;
    tindakan_perbaikan: TindakanRow[] | null;
    foto_items: { [k: string]: string } | null;
    ttd_inspektor: string | null;
    ttd_re_inspektor: string | null;
    status: 'menunggu_re_inspeksi' | 'selesai' | 'ditolak';
    re_inspeksi_at: string | null;
    tolak_alasan: string | null;
    [key: string]: unknown;
};

type Props = { record: Record };

const CATEGORIES = [
    { key: 'situasi', label: 'Situasi', items: [
        { key: 'situasi_1', label: 'Atap, Dinding, pintu, jendela dalam kondisi bersih dan baik' },
        { key: 'situasi_2', label: 'Lantai dalam kondisi bersih dan tidak rusak' },
        { key: 'situasi_3', label: 'Penerangan di semua area/ruangan memadai/standar' },
        { key: 'situasi_4', label: 'Ventilasi di semua area/ruangan memadai (tidak pengap)' },
        { key: 'situasi_5', label: 'House keeping/kebersihan secara umum baik' },
        { key: 'situasi_6', label: 'Tersedia halaman parkir sarana memadai; Tersedia rambu parkir & sarana parkir mundur' },
        { key: 'situasi_7', label: 'Terdapat rambu tempat berkumpul darurat' },
    ]},
    { key: 'individu', label: 'Individu', items: [
        { key: 'individu_1', label: 'Semua karyawan memakai APD sesuai standar' },
    ]},
    { key: 'alat', label: 'Alat', items: [
        { key: 'alat_1', label: 'Rambu K3 (safety sign) lengkap dan memadai' },
        { key: 'alat_2', label: 'Instalasi listrik, saklar, kabel dalam kondisi baik dan aman' },
        { key: 'alat_3', label: 'Semua pipa, kran dan katup dalam kondisi baik' },
        { key: 'alat_4', label: 'Pada pintu ruangan khusus terdapat rambu "Dilarang Masuk selain Petugas"' },
        { key: 'alat_5', label: 'Bangunan dilengkapi alarm emergency & Rambu Evakuasi' },
        { key: 'alat_6', label: 'Semua furniture (lemari, meja kerja, kursi dll) dalam kondisi baik, bersih dan ergonomis' },
        { key: 'alat_7', label: 'Terdapat APAR atau instalasi hydran dalam kondisi baik' },
    ]},
    { key: 'prosedur', label: 'Prosedur', items: [
        { key: 'prosedur_1', label: 'Tempat sampah mencukupi, dan dikosongkan setiap hari' },
        { key: 'prosedur_2', label: 'APAR tersedia memadai dan diinspeksi secara rutin' },
        { key: 'prosedur_3', label: 'Bangunan dilengkapi dengan sistem pentanahan dan dilakukan inspeksi/pengukuran secara rutin' },
        { key: 'prosedur_4', label: 'Kotak P3K lengkap dengan peralatannya' },
        { key: 'prosedur_5', label: 'Tidak menyimpan Cairan Mudah Terbakar/menyala di dalam ruang kerja' },
        { key: 'prosedur_6', label: 'Penyimpanan & Pengendalian Bahan Kimia Berbahaya' },
        { key: 'prosedur_7', label: 'Terdapat Papan Pengumuman K3 & LH' },
    ]},
];

const SCORE_LABELS = ['', 'Sangat Kurang', 'Kurang', 'Baik', 'Sangat Baik'];
const SCORE_COLORS = ['', 'text-red-600', 'text-orange-500', 'text-yellow-600', 'text-green-600'];
const SCORE_BG = ['', 'bg-red-50 dark:bg-red-950/20', 'bg-orange-50 dark:bg-orange-950/20', 'bg-yellow-50 dark:bg-yellow-950/10', 'bg-green-50 dark:bg-green-950/10'];

const RISK_CFG = {
    L:  { label: 'Baik',           cls: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400' },
    M:  { label: 'Cukup',          cls: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400' },
    H:  { label: 'Perhatian',      cls: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400' },
    VH: { label: 'Perlu Tindakan', cls: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400' },
};

export default function InspeksiKantorShow({ record }: Props) {
    const tanggal = new Date(record.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const risk = record.risk_level ? RISK_CFG[record.risk_level] : null;

    return (
        <>
            <Head title="Detail Inspeksi Kantor" />
            <div className="flex flex-col gap-6 max-w-2xl">

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Inspeksi Area Kantor</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-004 · {tanggal}</p>
                    </div>
                    <a href={`/sap/inspeksi-kantor/${record.id}/pdf`} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="gap-2 h-10"><FileText size={16} /> PDF</Button>
                    </a>
                </div>

                {/* Status & Skor */}
                {risk && record.persentase !== null && (
                    <div className={cn('rounded-2xl border-2 px-4 py-4 flex flex-col gap-1', risk.cls)}>
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-2xl">{record.persentase}%</p>
                            <Badge className={cn(risk.cls, 'text-sm font-bold')}>{risk.label}</Badge>
                        </div>
                        <p className="text-sm">Total {record.total_poin} / {record.max_poin} poin</p>
                    </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-3">
                    {record.status === 'selesai' && <Badge className="bg-green-100 text-green-700 border-green-300">Selesai</Badge>}
                    {record.status === 'ditolak' && <Badge className="bg-red-100 text-red-700 border-red-300">Ditolak</Badge>}
                    {record.status === 'menunggu_re_inspeksi' && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Menunggu Re-Inspeksi</Badge>}
                    {record.tolak_alasan && <span className="text-sm text-muted-foreground">Alasan: {record.tolak_alasan}</span>}
                </div>

                {/* Info */}
                <Card className="p-0 overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Informasi Inspeksi</div>
                    <CardContent className="py-0">
                        {[
                            { icon: CalendarDays, label: 'Tanggal', value: tanggal },
                            { icon: Building2, label: 'Project/Site', value: record.project_site },
                            { icon: Building2, label: 'Departemen', value: record.departemen },
                            { icon: Users, label: 'Inspektor', value: `${record.user.name}${record.user.jabatan ? ` — ${record.user.jabatan}` : ''}` },
                            { icon: Users, label: 'Re-Inspektor', value: record.re_inspektor ? `${record.re_inspektor.name}${record.re_inspektor.jabatan ? ` — ${record.re_inspektor.jabatan}` : ''}` : '—' },
                        ].map(({ icon: Icon, label, value }, idx, arr) => (
                            <Fragment key={label}>
                                <div className="flex items-start gap-3 py-3.5 text-sm">
                                    <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                                    <dt className="text-muted-foreground w-32 shrink-0">{label}</dt>
                                    <dd className="font-semibold">{value}</dd>
                                </div>
                                {idx < arr.length - 1 && <Separator />}
                            </Fragment>
                        ))}
                    </CardContent>
                </Card>

                {/* Peserta */}
                {record.peserta.length > 0 && (
                    <Card className="p-0 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Peserta Inspeksi</div>
                        <CardContent className="py-3 flex flex-wrap gap-2">
                            {record.peserta.map(p => (
                                <div key={p.id} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{p.name}</div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Checklist */}
                {CATEGORIES.map(cat => {
                    const filled = cat.items.filter(i => record[i.key] !== null && record[i.key] !== undefined);
                    if (filled.length === 0) return null;
                    return (
                        <Card key={cat.key} className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">{cat.label}</div>
                            <CardContent className="p-0">
                                {cat.items.map((item, idx) => {
                                    const score = record[item.key] as number | null;
                                    if (score === null || score === undefined) return null;
                                    const foto = record.foto_items?.[item.key];
                                    return (
                                        <Fragment key={item.key}>
                                            <div className={cn('px-4 py-3', SCORE_BG[score])}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-sm flex-1 leading-relaxed">{item.label}</p>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={cn('text-2xl font-black', SCORE_COLORS[score])}>{score}</span>
                                                        <span className={cn('text-xs font-semibold', SCORE_COLORS[score])}>{SCORE_LABELS[score]}</span>
                                                    </div>
                                                </div>
                                                {foto && (
                                                    <a href={`/storage/${foto}`} target="_blank" rel="noreferrer" className="mt-2 block">
                                                        <img src={`/storage/${foto}`} alt="Foto" className="w-full max-h-48 object-cover rounded-xl border" />
                                                    </a>
                                                )}
                                            </div>
                                            {idx < cat.items.length - 1 && <Separator />}
                                        </Fragment>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Tindakan Perbaikan */}
                {record.tindakan_perbaikan && record.tindakan_perbaikan.length > 0 && (
                    <Card className="p-0 overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Rekomendasi Tindakan Perbaikan</div>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-8">No</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Tindakan Perbaikan</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">PIC</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Due Date</th>
                                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {record.tindakan_perbaikan.map((row, i) => (
                                            <tr key={i} className={cn('border-b', i % 2 === 1 && 'bg-muted/10')}>
                                                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                                <td className="px-3 py-2">{row.tindakan}</td>
                                                <td className="px-3 py-2">{row.pic}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{row.due_date}</td>
                                                <td className="px-3 py-2">{row.remark}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* TTD */}
                <div className="grid grid-cols-2 gap-4">
                    {record.ttd_inspektor && (
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">TTD Inspektor</div>
                            <CardContent className="p-3">
                                <img src={record.ttd_inspektor} alt="TTD Inspektor" className="w-full rounded-xl border bg-white" />
                                <p className="text-sm mt-2 font-semibold text-center">{record.user.name}</p>
                            </CardContent>
                        </Card>
                    )}
                    {record.ttd_re_inspektor && record.re_inspektor && (
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">TTD Re-Inspektor</div>
                            <CardContent className="p-3">
                                <img src={record.ttd_re_inspektor} alt="TTD Re-Inspektor" className="w-full rounded-xl border bg-white" />
                                <p className="text-sm mt-2 font-semibold text-center">{record.re_inspektor.name}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Re-inspeksi action */}
                {record.status === 'menunggu_re_inspeksi' && record.re_inspektor && (
                    <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10 p-4 text-center">
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                            Menunggu re-inspeksi dari {record.re_inspektor.name}
                        </p>
                        <Link href={`/sap/inspeksi-kantor/${record.id}/re-inspeksi`}>
                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">Lakukan Re-Inspeksi</Button>
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
