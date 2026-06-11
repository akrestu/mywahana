import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronRight, ClipboardCheck, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };

type OKRecord = {
    id: number;
    tanggal: string;
    jenis_pekerjaan: string;
    lokasi_kerja: string;
    status: 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak';
    penanggung_jawab?: UserInfo | null;
    user?: UserInfo | null;
};

type Paginated = { data: OKRecord[]; next_page_url: string | null; prev_page_url: string | null };

type Props = { myRecords: Paginated; pendingKonfirmasi: Paginated; confirmedAsPJ: Paginated };

function groupByMonth(records: OKRecord[]) {
    const groups: Record<string, OKRecord[]> = {};
    for (const r of records) {
        const key = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        (groups[key] ??= []).push(r);
    }
    return Object.entries(groups);
}

function StatusBadge({ status }: { status: OKRecord['status'] }) {
    if (status === 'dikonfirmasi') {
        return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400">Dikonfirmasi</Badge>;
    }
    if (status === 'ditolak') {
        return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">Ditolak</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400">Menunggu Konfirmasi</Badge>;
}

function recordBarColor(status: OKRecord['status']) {
    if (status === 'dikonfirmasi') return 'bg-green-500';
    if (status === 'ditolak') return 'bg-red-500';
    return 'bg-yellow-500';
}

function recordBgColor(status: OKRecord['status']) {
    if (status === 'dikonfirmasi') return 'bg-green-50/30 dark:bg-green-950/10';
    if (status === 'ditolak') return 'bg-red-50/30 dark:bg-red-950/10';
    return 'bg-yellow-50/30 dark:bg-yellow-950/10';
}

function RecordList({ records, asPJ = false }: { records: Paginated; asPJ?: boolean }) {
    const grouped = groupByMonth(records.data);

    if (records.data.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed py-12 text-center px-6">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <ClipboardCheck size={28} className="text-muted-foreground" />
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
                        {items.map((record, idx) => (
                            <div key={record.id}>
                                <Link href={`/sap/observasi-keselamatan/${record.id}`}>
                                    <div className={cn(
                                        'flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-accent',
                                        recordBgColor(record.status),
                                    )}>
                                        <div className={cn('h-14 w-1.5 shrink-0 rounded-full', recordBarColor(record.status))} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-bold">
                                                {new Date(record.tanggal).toLocaleDateString('id-ID', {
                                                    weekday: 'long', day: 'numeric', month: 'long',
                                                })}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate mt-0.5">{record.lokasi_kerja}</p>
                                            <p className="text-sm text-muted-foreground truncate">{record.jenis_pekerjaan}</p>
                                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                                                <StatusBadge status={record.status} />
                                                {asPJ && record.user && (
                                                    <span className="text-xs text-muted-foreground">oleh {record.user.name}</span>
                                                )}
                                                {!asPJ && record.penanggung_jawab && (
                                                    <span className="text-xs text-muted-foreground">PJ: {record.penanggung_jawab.name}</span>
                                                )}
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

function PendingKonfirmasiList({ records }: { records: Paginated }) {
    const grouped = groupByMonth(records.data);

    return (
        <div className="flex flex-col gap-5">
            {grouped.map(([month, items]) => (
                <div key={month} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-yellow-600" />
                        <span className="text-sm font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">{month}</span>
                    </div>
                    <Card className="overflow-hidden p-0">
                        {items.map((record, idx) => (
                            <div key={record.id}>
                                <Link href={`/sap/observasi-keselamatan/${record.id}/konfirmasi`}>
                                    <div className="flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-accent bg-yellow-50/30 dark:bg-yellow-950/10">
                                        <div className="h-14 w-1.5 shrink-0 rounded-full bg-yellow-500" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-bold">
                                                {new Date(record.tanggal).toLocaleDateString('id-ID', {
                                                    weekday: 'long', day: 'numeric', month: 'long',
                                                })}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate mt-0.5">{record.lokasi_kerja}</p>
                                            <p className="text-sm text-muted-foreground truncate">{record.jenis_pekerjaan}</p>
                                            {record.user && (
                                                <p className="text-xs text-muted-foreground mt-1">oleh {record.user.name}</p>
                                            )}
                                        </div>
                                        <ChevronRight size={20} className="shrink-0 text-yellow-600" />
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

export default function ObservasiKeselamatanIndex({ myRecords, pendingKonfirmasi, confirmedAsPJ }: Props) {
    const [tab, setTab] = useState<'my' | 'pending' | 'confirmed'>('my');
    const pendingCount = pendingKonfirmasi.data.length;

    return (
        <>
            <Head title="Observasi Keselamatan" />
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Observasi Keselamatan</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Form OK – WBK-HSE-FO-037</p>
                    </div>
                    <Link href="/sap/observasi-keselamatan/create" className="shrink-0">
                        <Button className="h-12 px-5 gap-2 text-base font-bold">
                            <Plus size={18} />
                            Buat OK
                        </Button>
                    </Link>
                </div>

                <div className="flex gap-1 rounded-xl bg-muted p-1">
                    {([
                        { key: 'my',        label: 'Form Saya' },
                        { key: 'pending',   label: 'Perlu Konfirmasi', count: pendingCount },
                        { key: 'confirmed', label: 'Riwayat Konfirmasi' },
                    ] as const).map(t => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'flex-1 rounded-lg py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                                tab === t.key
                                    ? 'bg-background shadow text-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {t.label}
                            {'count' in t && t.count > 0 && (
                                <span className="flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {tab === 'my'        && <RecordList records={myRecords} />}
                {tab === 'pending'   && <PendingKonfirmasiList records={pendingKonfirmasi} />}
                {tab === 'confirmed' && <RecordList records={confirmedAsPJ} asPJ />}
            </div>
        </>
    );
}
