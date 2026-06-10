import { Head, Link } from '@inertiajs/react';
import { Building2, CalendarDays, ChevronRight, Plus, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };

type Record = {
    id: number;
    tanggal: string;
    project_site: string;
    departemen: string;
    persentase: number | null;
    risk_level: 'L' | 'M' | 'H' | 'VH' | null;
    status: 'menunggu_re_inspeksi' | 'selesai' | 'ditolak';
    re_inspektor?: UserInfo | null;
    user?: UserInfo | null;
};

type Paginated = { data: Record[]; next_page_url: string | null; prev_page_url: string | null };

type Props = { myRecords: Paginated; pendingReInspeksi: Paginated; selesaiAsRI: Paginated };

function groupByMonth(records: Record[]) {
    const groups: { [k: string]: Record[] } = {};
    for (const r of records) {
        const key = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        (groups[key] ??= []).push(r);
    }
    return Object.entries(groups);
}

function RiskBadge({ level, pct }: { level: Record['risk_level']; pct: number | null }) {
    if (!level || pct === null) return null;
    const cfg = {
        L:  { label: 'Baik',         cls: 'bg-green-100 text-green-700 border-green-300' },
        M:  { label: 'Cukup',        cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
        H:  { label: 'Perhatian',    cls: 'bg-orange-100 text-orange-700 border-orange-300' },
        VH: { label: 'Perlu Tindakan', cls: 'bg-red-100 text-red-700 border-red-300' },
    };
    const { label, cls } = cfg[level];
    return (
        <Badge className={cn('hover:opacity-100', cls)}>
            {pct}% — {label}
        </Badge>
    );
}

function StatusBadge({ status }: { status: Record['status'] }) {
    if (status === 'selesai') return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">Selesai</Badge>;
    if (status === 'ditolak') return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">Ditolak</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100">Menunggu Re-Inspeksi</Badge>;
}

function barColor(status: Record['status']) {
    if (status === 'selesai') return 'bg-green-500';
    if (status === 'ditolak') return 'bg-red-500';
    return 'bg-yellow-500';
}

function RecordList({ records, asRI = false }: { records: Paginated; asRI?: boolean }) {
    const grouped = groupByMonth(records.data);
    if (records.data.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed py-12 text-center px-6">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <Building2 size={28} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Belum ada data</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-5">
            {grouped.map(([month, items]) => (
                <div key={month} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-muted-foreground" />
                        <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{month}</span>
                    </div>
                    <Card className="overflow-hidden p-0">
                        {items.map((rec, idx) => (
                            <div key={rec.id}>
                                <Link href={`/sap/inspeksi-kantor/${rec.id}`}>
                                    <div className="flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-accent">
                                        <div className={cn('h-14 w-1.5 shrink-0 rounded-full', barColor(rec.status))} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-bold">
                                                {new Date(rec.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate mt-0.5">{rec.project_site}</p>
                                            <p className="text-sm text-muted-foreground truncate">{rec.departemen}</p>
                                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                                                <StatusBadge status={rec.status} />
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
                    {records.prev_page_url
                        ? <Link href={records.prev_page_url}><Button variant="outline" className="h-12 px-6 text-base">← Sebelumnya</Button></Link>
                        : <div />}
                    {records.next_page_url && (
                        <Link href={records.next_page_url}><Button variant="outline" className="h-12 px-6 text-base">Berikutnya →</Button></Link>
                    )}
                </div>
            )}
        </div>
    );
}

export default function InspeksiKantorIndex({ myRecords, pendingReInspeksi, selesaiAsRI }: Props) {
    return (
        <>
            <Head title="Inspeksi Kantor" />
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Inspeksi Area Kantor</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-004</p>
                    </div>
                    <Link href="/sap/inspeksi-kantor/create" className="shrink-0">
                        <Button className="h-12 px-5 gap-2 text-base font-bold">
                            <Plus size={18} /> Buat Inspeksi
                        </Button>
                    </Link>
                </div>

                {pendingReInspeksi.data.length > 0 && (
                    <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10 p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={18} className="text-yellow-600" />
                            <p className="font-bold text-yellow-800 dark:text-yellow-300">
                                Perlu Re-Inspeksi Anda ({pendingReInspeksi.data.length})
                            </p>
                        </div>
                        <RecordList records={pendingReInspeksi} asRI />
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Inspeksi Saya</p>
                    <RecordList records={myRecords} />
                </div>

                {selesaiAsRI.data.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Riwayat Re-Inspeksi Saya
                        </p>
                        <RecordList records={selesaiAsRI} asRI />
                    </div>
                )}
            </div>
        </>
    );
}
