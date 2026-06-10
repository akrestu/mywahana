import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, ChevronRight, MapPin, Plus } from 'lucide-react';
import { RiskBadge } from '@/components/risk-badge';
import { TindakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Record = {
    id: number;
    tanggal: string;
    lokasi: string;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    nilai_risiko: number;
    status_tindakan: 'pending' | 'selesai';
};

type PaginatedRecords = {
    data: Record[];
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = { records: PaginatedRecords };

const riskStripe: Record<string, string> = {
    AA: 'bg-red-500',
    A:  'bg-orange-500',
    B:  'bg-yellow-500',
    C:  'bg-green-500',
};

const riskBg: Record<string, string> = {
    AA: 'bg-red-50 dark:bg-red-950/20',
    A:  'bg-orange-50 dark:bg-orange-950/20',
    B:  'bg-yellow-50 dark:bg-yellow-950/20',
    C:  'bg-green-50 dark:bg-green-950/20',
};

function groupByMonth(records: Record[]) {
    const groups: { [key: string]: Record[] } = {};
    for (const r of records) {
        const key = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        (groups[key] ??= []).push(r);
    }
    return Object.entries(groups);
}

export default function LaporanBahayaIndex({ records }: Props) {
    const grouped = groupByMonth(records.data);

    return (
        <>
            <Head title="Riwayat Laporan Bahaya" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Laporan Bahaya</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Riwayat hazard report Anda</p>
                    </div>
                    <Link href="/laporan-bahaya/create" className="shrink-0">
                        <Button className="h-12 px-5 gap-2 text-base font-bold">
                            <Plus size={18} />
                            Laporkan
                        </Button>
                    </Link>
                </div>

                {/* Empty state */}
                {records.data.length === 0 ? (
                    <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed py-16 text-center px-6">
                        <div className="flex size-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/30">
                            <AlertTriangle size={36} className="text-orange-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold">Belum ada laporan</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Jika Anda melihat kondisi berbahaya di tempat kerja,<br />
                                segera laporkan untuk keselamatan bersama.
                            </p>
                        </div>
                        <Link href="/laporan-bahaya/create">
                            <Button className="h-12 px-8 text-base font-bold gap-2">
                                <Plus size={18} /> Buat Laporan Sekarang
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {grouped.map(([month, items]) => (
                            <div key={month} className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={15} className="text-muted-foreground" />
                                    <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{month}</span>
                                </div>

                                <Card className="overflow-hidden p-0">
                                    {items.map((record, idx) => (
                                        <div key={record.id}>
                                            <Link href={`/laporan-bahaya/${record.id}`}>
                                                <div className={cn(
                                                    'flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-accent',
                                                    riskBg[record.tingkat_risiko],
                                                )}>
                                                    {/* Risk stripe */}
                                                    <div className={cn('h-14 w-1.5 shrink-0 rounded-full', riskStripe[record.tingkat_risiko])} />

                                                    {/* Content */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-base font-bold">
                                                            {new Date(record.tanggal).toLocaleDateString('id-ID', {
                                                                weekday: 'long', day: 'numeric', month: 'long',
                                                            })}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <MapPin size={13} className="text-muted-foreground shrink-0" />
                                                            <span className="text-sm text-muted-foreground truncate">{record.lokasi}</span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            <RiskBadge level={record.tingkat_risiko} />
                                                            <TindakanBadge status={record.status_tindakan} />
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

                        {/* Pagination */}
                        {(records.prev_page_url || records.next_page_url) && (
                            <div className="flex justify-between gap-3 pt-1">
                                {records.prev_page_url ? (
                                    <Link href={records.prev_page_url}>
                                        <Button variant="outline" className="h-12 px-6 text-base">← Sebelumnya</Button>
                                    </Link>
                                ) : <div />}
                                {records.next_page_url && (
                                    <Link href={records.next_page_url}>
                                        <Button variant="outline" className="h-12 px-6 text-base">Berikutnya →</Button>
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
