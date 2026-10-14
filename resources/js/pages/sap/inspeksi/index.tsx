import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, ChevronRight, ClipboardCheck, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Jenis = 'kantor' | 'tambang' | 'workshop' | 'mess';
type Rec = {
    id: number;
    jenis: Jenis;
    tanggal: string;
    status: 'menunggu_re_inspeksi' | 'selesai' | 'ditolak';
    risk_level: 'L' | 'M' | 'H' | 'VH' | null;
    persentase: number | null;
    project_site: string;
    keterangan: string | null;
    user: { id: number; name: string } | null;
    re_inspektor: { id: number; name: string } | null;
};
type Paginated = { data: Rec[]; next_page_url: string | null; prev_page_url: string | null; total: number };
type Props = { myRecords: Paginated; pendingReInspeksi: Paginated; selesaiAsRI: Paginated };

const JENIS: Record<Jenis, { label: string; emoji: string; badge: string }> = {
    kantor: { label: 'Kantor', emoji: '🏢', badge: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800' },
    tambang: { label: 'Tambang', emoji: '⛏️', badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800' },
    workshop: { label: 'Workshop', emoji: '🔧', badge: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700' },
    mess: { label: 'Mess', emoji: '🏠', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800' },
};

const RISK = {
    L: { l: 'Baik', c: 'bg-green-100 text-green-700 border-green-300' },
    M: { l: 'Cukup', c: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    H: { l: 'Perhatian', c: 'bg-orange-100 text-orange-700 border-orange-300' },
    VH: { l: 'Perlu Tindakan', c: 'bg-red-100 text-red-700 border-red-300' },
};

function groupByMonth(records: Rec[]) {
    const groups: Record<string, Rec[]> = {};

    for (const r of records) {
        const key = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        (groups[key] ??= []).push(r);
    }

    return Object.entries(groups);
}

function StatusBadge({ s }: { s: Rec['status'] }) {
    if (s === 'selesai') {
        return <Badge className="border-green-300 bg-green-100 text-green-700 hover:bg-green-100">Selesai</Badge>;
    }

    if (s === 'ditolak') {
        return <Badge className="border-red-300 bg-red-100 text-red-700 hover:bg-red-100">Ditolak</Badge>;
    }

    return <Badge className="border-yellow-300 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Menunggu Re-Inspeksi</Badge>;
}

function RecordList({ records, asRI = false }: { records: Paginated; asRI?: boolean }) {
    if (!records.data.length) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <ClipboardCheck size={28} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada data</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {groupByMonth(records.data).map(([month, items]) => (
                <div key={month} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-muted-foreground" />
                        <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">{month}</span>
                    </div>
                    <Card className="overflow-hidden p-0">
                        {items.map((rec, idx) => (
                            <div key={`${rec.jenis}-${rec.id}`}>
                                <Link href={`/sap/inspeksi-${rec.jenis}/${rec.id}`}>
                                    <div className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-accent">
                                        <div
                                            className={cn(
                                                'h-14 w-1.5 shrink-0 rounded-full',
                                                rec.status === 'selesai' ? 'bg-green-500' : rec.status === 'ditolak' ? 'bg-red-500' : 'bg-yellow-500',
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn('shrink-0', JENIS[rec.jenis].badge)}>
                                                    {JENIS[rec.jenis].emoji} {JENIS[rec.jenis].label}
                                                </Badge>
                                            </div>
                                            <p className="mt-1.5 text-base font-bold">
                                                {new Date(rec.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                                {rec.project_site}
                                                {rec.keterangan ? ` · ${rec.keterangan}` : ''}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                <StatusBadge s={rec.status} />
                                                {rec.risk_level && rec.persentase !== null && (
                                                    <Badge className={cn('hover:opacity-100', RISK[rec.risk_level].c)}>
                                                        {rec.persentase}% — {RISK[rec.risk_level].l}
                                                    </Badge>
                                                )}
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
                    {records.prev_page_url ? (
                        <Link href={records.prev_page_url}>
                            <Button variant="outline" className="h-12 px-6 text-base">← Sebelumnya</Button>
                        </Link>
                    ) : (
                        <div />
                    )}
                    {records.next_page_url && (
                        <Link href={records.next_page_url}>
                            <Button variant="outline" className="h-12 px-6 text-base">Berikutnya →</Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

export default function InspeksiIndex({ myRecords, pendingReInspeksi, selesaiAsRI }: Props) {
    const [tab, setTab] = useState<'my' | 'pending' | 'confirmed'>(pendingReInspeksi.total > 0 ? 'pending' : 'my');

    return (
        <>
            <Head title="Semua Inspeksi" />
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Semua Inspeksi</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">Kantor, Tambang, Workshop & Mess</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-12 shrink-0 gap-2 px-5 text-base font-bold">
                                <Plus size={18} /> Buat
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            {(Object.keys(JENIS) as Jenis[]).map((j) => (
                                <DropdownMenuItem key={j} onClick={() => router.visit(`/sap/inspeksi-${j}/create`)}>
                                    {JENIS[j].emoji} Inspeksi {JENIS[j].label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex gap-1 rounded-xl bg-muted p-1">
                    {(
                        [
                            { key: 'my', label: 'Inspeksi Saya' },
                            { key: 'pending', label: 'Perlu Re-Inspeksi', count: pendingReInspeksi.total },
                            { key: 'confirmed', label: 'Riwayat Re-Inspeksi' },
                        ] as const
                    ).map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                                tab === t.key ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {t.label}
                            {'count' in t && t.count > 0 && (
                                <span className="flex size-4 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white">
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                {tab === 'my' && <RecordList records={myRecords} />}
                {tab === 'pending' && <RecordList records={pendingReInspeksi} asRI />}
                {tab === 'confirmed' && <RecordList records={selesaiAsRI} asRI />}
            </div>
        </>
    );
}
