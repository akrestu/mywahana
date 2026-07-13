import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronRight, Mountain, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type Rec = { id: number; tanggal: string; project_site: string; departemen: string; persentase: number | null; risk_level: 'L'|'M'|'H'|'VH'|null; status: 'menunggu_re_inspeksi'|'selesai'|'ditolak'; re_inspektor?: UserInfo|null; user?: UserInfo|null };
type Paginated = { data: Rec[]; next_page_url: string|null; prev_page_url: string|null };
type Props = { myRecords: Paginated; pendingReInspeksi: Paginated; selesaiAsRI: Paginated };

function groupByMonth(records: Rec[]) {
    const g: { [k: string]: Rec[] } = {};

    for (const r of records) {
 const k = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); (g[k] ??= []).push(r); 
}

    return Object.entries(g);
}

function RiskBadge({ level, pct }: { level: Rec['risk_level']; pct: number|null }) {
    if (!level || pct === null) {
return null;
}

    const cfg = { L: { l: 'Baik', c: 'bg-green-100 text-green-700 border-green-300' }, M: { l: 'Cukup', c: 'bg-yellow-100 text-yellow-700 border-yellow-300' }, H: { l: 'Perhatian', c: 'bg-orange-100 text-orange-700 border-orange-300' }, VH: { l: 'Perlu Tindakan', c: 'bg-red-100 text-red-700 border-red-300' } };

    return <Badge className={cn('hover:opacity-100', cfg[level].c)}>{pct}% — {cfg[level].l}</Badge>;
}
function StatusBadge({ s }: { s: Rec['status'] }) {
    if (s === 'selesai') {
return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">Selesai</Badge>;
}

    if (s === 'ditolak') {
return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">Ditolak</Badge>;
}

    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100">Menunggu Re-Inspeksi</Badge>;
}

function RecordList({ records, asRI = false, base }: { records: Paginated; asRI?: boolean; base: string }) {
    const grouped = groupByMonth(records.data);

    if (!records.data.length) {
return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed py-12 text-center px-6">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted"><Mountain size={28} className="text-muted-foreground" /></div>
            <p className="text-muted-foreground text-sm">Belum ada data</p>
        </div>
    );
}

    return (
        <div className="flex flex-col gap-5">
            {grouped.map(([month, items]) => (
                <div key={month} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2"><CalendarDays size={15} className="text-muted-foreground" /><span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{month}</span></div>
                    <Card className="overflow-hidden p-0">
                        {items.map((rec, idx) => (
                            <div key={rec.id}>
                                <Link href={`${base}/${rec.id}`}>
                                    <div className="flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-accent">
                                        <div className={cn('h-14 w-1.5 shrink-0 rounded-full', rec.status === 'selesai' ? 'bg-green-500' : rec.status === 'ditolak' ? 'bg-red-500' : 'bg-yellow-500')} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-bold">{new Date(rec.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                            <p className="text-sm text-muted-foreground truncate mt-0.5">{rec.project_site}</p>
                                            <p className="text-sm text-muted-foreground truncate">{rec.departemen}</p>
                                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                                                <StatusBadge s={rec.status} />
                                                <RiskBadge level={rec.risk_level} pct={rec.persentase} />
                                                {asRI && rec.user && <span className="text-xs text-muted-foreground">oleh {rec.user.name}</span>}
                                                {!asRI && rec.re_inspektor && <span className="text-xs text-muted-foreground">RI: {rec.re_inspektor.name}</span>}
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="shrink-0 text-muted-foreground" />
                                    </div>
                                </Link>
                                {idx < items.length - 1 && <Separator />}
                            </div>
                        ))}
                    </Card>
                </div>
            ))}
            {(records.prev_page_url || records.next_page_url) && (
                <div className="flex justify-between gap-3">
                    {records.prev_page_url ? <Link href={records.prev_page_url}><Button variant="outline" className="h-12 px-6 text-base">← Sebelumnya</Button></Link> : <div />}
                    {records.next_page_url && <Link href={records.next_page_url}><Button variant="outline" className="h-12 px-6 text-base">Berikutnya →</Button></Link>}
                </div>
            )}
        </div>
    );
}

export default function InspeksiTambangIndex({ myRecords, pendingReInspeksi, selesaiAsRI }: Props) {
    const [tab, setTab] = useState<'my' | 'pending' | 'confirmed'>('my');
    const pendingCount = pendingReInspeksi.data.length;

    return (
        <>
            <Head title="Inspeksi Tambang" />
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-3">
                    <div><h2 className="text-xl font-bold">Inspeksi Area Tambang</h2><p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-005</p></div>
                    <Link href="/sap/inspeksi-tambang/create" className="shrink-0"><Button className="h-12 px-5 gap-2 text-base font-bold"><Plus size={18} /> Buat Inspeksi</Button></Link>
                </div>
                <div className="flex gap-1 rounded-xl bg-muted p-1">
                    {([
                        { key: 'my',        label: 'Inspeksi Saya' },
                        { key: 'pending',   label: 'Perlu Re-Inspeksi', count: pendingCount },
                        { key: 'confirmed', label: 'Riwayat Re-Inspeksi' },
                    ] as const).map(t => (
                        <button key={t.key} type="button" onClick={() => setTab(t.key)}
                            className={cn('flex-1 rounded-lg py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                                tab === t.key ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                            {t.label}
                            {'count' in t && t.count > 0 && (
                                <span className="flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>
                {tab === 'my'        && <RecordList records={myRecords} base="/sap/inspeksi-tambang" />}
                {tab === 'pending'   && <RecordList records={pendingReInspeksi} asRI base="/sap/inspeksi-tambang" />}
                {tab === 'confirmed' && <RecordList records={selesaiAsRI} asRI base="/sap/inspeksi-tambang" />}
            </div>
        </>
    );
}
