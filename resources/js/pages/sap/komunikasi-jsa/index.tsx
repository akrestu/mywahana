import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, CalendarDays, ChevronRight, Clock, MapPin, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { create as createRoute, show as showRoute } from '@/routes/sap/komunikasi-jsa';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };

type JsaRecord = {
    id: number;
    tanggal: string;
    lokasi: string;
    shift: 'siang' | 'malam';
    kegiatan: string;
    judul_dokumen: string;
    status: 'selesai' | 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak';
    team_leader?: UserInfo | null;
    user?: UserInfo | null;
    peserta: { nama: string }[];
};

type Paginated = { data: JsaRecord[]; next_page_url: string | null; prev_page_url: string | null };

type Props = { myRecords: Paginated; pendingKonfirmasi: Paginated; confirmedAsTL: Paginated };

function groupByMonth(records: JsaRecord[]) {
    const groups: Record<string, JsaRecord[]> = {};

    for (const r of records) {
        const key = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        (groups[key] ??= []).push(r);
    }

    return Object.entries(groups);
}

function StatusBadge({ status }: { status: JsaRecord['status'] }) {
    if (status === 'selesai') {
return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400">Selesai</Badge>;
}

    if (status === 'dikonfirmasi') {
return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400">Dikonfirmasi</Badge>;
}

    if (status === 'ditolak') {
return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">Ditolak</Badge>;
}

    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400">Menunggu Konfirmasi</Badge>;
}

function barColor(status: JsaRecord['status']) {
    if (status === 'selesai' || status === 'dikonfirmasi') {
return 'bg-green-500';
}

    if (status === 'ditolak') {
return 'bg-red-500';
}

    return 'bg-yellow-500';
}

function bgColor(status: JsaRecord['status']) {
    if (status === 'selesai' || status === 'dikonfirmasi') {
return 'bg-green-50/30 dark:bg-green-950/10';
}

    if (status === 'ditolak') {
return 'bg-red-50/30 dark:bg-red-950/10';
}

    return 'bg-yellow-50/30 dark:bg-yellow-950/10';
}

function RecordList({ records, asTL = false }: { records: Paginated; asTL?: boolean }) {
    const grouped = groupByMonth(records.data);

    if (records.data.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed py-12 text-center px-6">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <BookOpen size={28} className="text-muted-foreground" />
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
                                <Link href={showRoute(record.id).url} className="block">
                                    <div className={cn('flex gap-0 hover:opacity-80 transition-opacity', bgColor(record.status))}>
                                        <div className={cn('w-1 shrink-0', barColor(record.status))} />
                                        <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <StatusBadge status={record.status} />
                                                    <Badge variant="outline" className="text-xs capitalize">{record.shift}</Badge>
                                                </div>
                                                <p className="font-semibold text-sm leading-snug line-clamp-1">{record.judul_dokumen}</p>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                    <span className="flex items-center gap-1"><MapPin size={11} />{record.lokasi}</span>
                                                    <span className="flex items-center gap-1"><Users size={11} />{record.peserta.length} peserta</span>
                                                </div>
                                                {asTL && record.user && (
                                                    <p className="text-xs text-muted-foreground">Dibuat oleh: {record.user.name}</p>
                                                )}
                                                {!asTL && record.team_leader && (
                                                    <p className="text-xs text-muted-foreground">TL: {record.team_leader.name}</p>
                                                )}
                                            </div>
                                            <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                                        </div>
                                    </div>
                                </Link>
                                {idx < items.length - 1 && <div className="h-px bg-border mx-4" />}
                            </div>
                        ))}
                    </Card>
                </div>
            ))}
        </div>
    );
}

export default function KomunikasiJsaIndex({ myRecords, pendingKonfirmasi, confirmedAsTL }: Props) {
    const [tab, setTab] = useState<'my' | 'pending' | 'confirmed'>('my');
    const pendingCount = pendingKonfirmasi.data.length;

    return (
        <>
            <Head title="Komunikasi JSA/SOP/IK" />
            <div className="flex flex-col gap-5 max-w-2xl">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Komunikasi JSA/SOP/IK</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-026</p>
                    </div>
                    <Link href={createRoute.url()}>
                        <Button size="sm" className="gap-1.5">
                            <Plus size={15} /> Buat Baru
                        </Button>
                    </Link>
                </div>

                {/* Tabs */}
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

                {tab === 'my' && <RecordList records={myRecords} />}
                {tab === 'pending' && <RecordList records={pendingKonfirmasi} asTL />}
                {tab === 'confirmed' && <RecordList records={confirmedAsTL} asTL />}
            </div>
        </>
    );
}
