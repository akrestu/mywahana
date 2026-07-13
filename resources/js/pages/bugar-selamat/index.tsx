import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronRight, ClipboardList, Clock, Moon, Plus, ShieldAlert, ShieldCheck, Sun } from 'lucide-react';
import type React from 'react';
import { KelayakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type BugarRecord = {
    id: number;
    tanggal: string;
    shift: string;
    hari_ke: number;
    status_kelayakan: 'layak' | 'catatan' | 'dilarang';
    created_at: string;
};

type PaginatedRecords = {
    data: BugarRecord[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = { records: PaginatedRecords };

const statusStripe: Record<BugarRecord['status_kelayakan'], string> = {
    layak:    'bg-green-500',
    catatan:  'bg-yellow-500',
    dilarang: 'bg-red-500',
};

const statusBg: Record<BugarRecord['status_kelayakan'], string> = {
    layak:    'bg-green-50 dark:bg-green-950/20',
    catatan:  'bg-yellow-50 dark:bg-yellow-950/20',
    dilarang: 'bg-red-50 dark:bg-red-950/20',
};

const statusIcon: Record<BugarRecord['status_kelayakan'], React.FC<{ className?: string }>> = {
    layak:    ({ className }) => <ShieldCheck className={className} />,
    catatan:  ({ className }) => <ShieldAlert className={className} />,
    dilarang: ({ className }) => <ShieldAlert className={className} />,
};

const statusIconColor: Record<BugarRecord['status_kelayakan'], string> = {
    layak:    'text-green-500',
    catatan:  'text-yellow-500',
    dilarang: 'text-red-500',
};

function groupByMonth(records: BugarRecord[]) {
    const groups: Record<string, BugarRecord[]> = {};

    for (const r of records) {
        const key = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        (groups[key] ??= []).push(r);
    }

    return Object.entries(groups);
}

export default function BugarSelamatIndex({ records }: Props) {
    const grouped = groupByMonth(records.data);

    return (
        <>
            <Head title="Riwayat Bugar Selamat" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Bugar Selamat</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Riwayat checklist kesiapan kerja Anda</p>
                    </div>
                    <Link href="/bugar-selamat/create" className="shrink-0">
                        <Button className="h-12 px-5 gap-2 text-base font-bold">
                            <Plus size={18} />
                            Isi Checklist
                        </Button>
                    </Link>
                </div>

                {/* Empty state */}
                {records.data.length === 0 ? (
                    <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed py-16 text-center px-6">
                        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                            <ClipboardList size={36} className="text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold">Belum ada checklist</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Isi checklist harian sebelum mulai bekerja setiap hari.
                            </p>
                        </div>
                        <Link href="/bugar-selamat/create">
                            <Button className="h-12 px-8 text-base font-bold gap-2">
                                <Plus size={18} /> Isi Sekarang
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {grouped.map(([month, items]) => (
                            <div key={month} className="flex flex-col gap-3">
                                {/* Month label */}
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={15} className="text-muted-foreground" />
                                    <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{month}</span>
                                </div>

                                <Card className="overflow-hidden p-0">
                                    {items.map((record, idx) => {
                                        const IconComp = statusIcon[record.status_kelayakan];
                                        const tanggal = new Date(record.tanggal);

                                        return (
                                            <div key={record.id}>
                                                <Link href={`/bugar-selamat/${record.id}`}>
                                                    <div className={cn(
                                                        'flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-accent',
                                                        statusBg[record.status_kelayakan],
                                                    )}>
                                                        {/* Status stripe */}
                                                        <div className={cn('h-14 w-1.5 shrink-0 rounded-full', statusStripe[record.status_kelayakan])} />

                                                        {/* Status icon */}
                                                        <div className={cn(
                                                            'flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-background',
                                                        )}>
                                                            <IconComp className={cn('size-6', statusIconColor[record.status_kelayakan])} />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-base font-bold capitalize">
                                                                {tanggal.toLocaleDateString('id-ID', {
                                                                    weekday: 'long', day: 'numeric', month: 'long',
                                                                })}
                                                            </p>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                {record.shift === 'Siang'
                                                                    ? <Sun size={13} className="text-amber-500" />
                                                                    : <Moon size={13} className="text-indigo-500" />}
                                                                <span className="text-sm text-muted-foreground">
                                                                    Shift {record.shift === 'Siang' ? 'I' : 'II'} · Hari ke-{record.hari_ke}
                                                                </span>
                                                            </div>
                                                            <div className="mt-0.5 flex items-center gap-1.5">
                                                                <Clock size={12} className="text-muted-foreground/60" />
                                                                <span className="text-xs text-muted-foreground/70">
                                                                    Diisi {new Date(record.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                                </span>
                                                            </div>
                                                            <div className="mt-2">
                                                                <KelayakanBadge status={record.status_kelayakan} />
                                                            </div>
                                                        </div>

                                                        <ChevronRight size={20} className="shrink-0 text-muted-foreground" />
                                                    </div>
                                                </Link>
                                                {idx < items.length - 1 && <Separator />}
                                            </div>
                                        );
                                    })}
                                </Card>
                            </div>
                        ))}

                        {/* Pagination */}
                        {(records.prev_page_url || records.next_page_url) && (
                            <div className="flex justify-between gap-3 pt-1">
                                {records.prev_page_url ? (
                                    <Link href={records.prev_page_url}>
                                        <Button variant="outline" className="h-12 px-6 text-base gap-2">
                                            ← Sebelumnya
                                        </Button>
                                    </Link>
                                ) : <div />}
                                {records.next_page_url && (
                                    <Link href={records.next_page_url}>
                                        <Button variant="outline" className="h-12 px-6 text-base gap-2">
                                            Berikutnya →
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
