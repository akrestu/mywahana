import { Head, Link } from '@inertiajs/react';
import { Building2, CalendarDays, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type UserInfo = {
    id: number;
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
};

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

type Paginated = {
    data: Record[];
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = {
    myRecords: Paginated;
    pendingReInspeksi: Paginated;
    selesaiAsRI: Paginated;
};

function groupByMonth(records: Record[]) {
    const groups: { [k: string]: Record[] } = {};

    for (const r of records) {
        const key = new Date(r.tanggal).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
        (groups[key] ??= []).push(r);
    }

    return Object.entries(groups);
}

function RiskBadge({
    level,
    pct,
}: {
    level: Record['risk_level'];
    pct: number | null;
}) {
    if (!level || pct === null) {
        return null;
    }

    const cfg = {
        L: {
            label: 'Baik',
            cls: 'bg-success-soft text-success border-success/60',
        },
        M: {
            label: 'Cukup',
            cls: 'bg-warning-soft text-warning border-warning/60',
        },
        H: {
            label: 'Perhatian',
            cls: 'bg-warning-soft text-warning border-warning/60',
        },
        VH: {
            label: 'Perlu Tindakan',
            cls: 'bg-destructive-soft text-destructive border-destructive/60',
        },
    };
    const { label, cls } = cfg[level];

    return (
        <Badge className={cn('hover:opacity-100', cls)}>
            {pct}% — {label}
        </Badge>
    );
}

function StatusBadge({ status }: { status: Record['status'] }) {
    if (status === 'selesai') {
        return (
            <Badge className="border-success/60 bg-success-soft text-success hover:bg-success-soft">
                Selesai
            </Badge>
        );
    }

    if (status === 'ditolak') {
        return (
            <Badge className="border-destructive/60 bg-destructive-soft text-destructive hover:bg-destructive-soft">
                Ditolak
            </Badge>
        );
    }

    return (
        <Badge className="border-warning/60 bg-warning-soft text-warning hover:bg-warning-soft">
            Menunggu Re-Inspeksi
        </Badge>
    );
}

function barColor(status: Record['status']) {
    if (status === 'selesai') {
        return 'bg-success';
    }

    if (status === 'ditolak') {
        return 'bg-destructive';
    }

    return 'bg-warning';
}

function RecordList({
    records,
    asRI = false,
}: {
    records: Paginated;
    asRI?: boolean;
}) {
    const grouped = groupByMonth(records.data);

    if (records.data.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <Building2 size={28} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada data</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {grouped.map(([month, items]) => (
                <div key={month} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays
                            size={15}
                            className="text-muted-foreground"
                        />
                        <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                            {month}
                        </span>
                    </div>
                    <Card className="overflow-hidden p-0">
                        {items.map((rec, idx) => (
                            <div key={rec.id}>
                                <Link href={`/sap/inspeksi-kantor/${rec.id}`}>
                                    <div className="flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-muted">
                                        <div
                                            className={cn(
                                                'h-14 w-1.5 shrink-0 rounded-full',
                                                barColor(rec.status),
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-bold">
                                                {new Date(
                                                    rec.tanggal,
                                                ).toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                })}
                                            </p>
                                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                                {rec.project_site}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {rec.departemen}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                <StatusBadge
                                                    status={rec.status}
                                                />
                                                <RiskBadge
                                                    level={rec.risk_level}
                                                    pct={rec.persentase}
                                                />
                                                {asRI && rec.user && (
                                                    <span className="text-xs text-muted-foreground">
                                                        oleh {rec.user.name}
                                                    </span>
                                                )}
                                                {!asRI && rec.re_inspektor && (
                                                    <span className="text-xs text-muted-foreground">
                                                        RI:{' '}
                                                        {rec.re_inspektor.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight
                                            size={20}
                                            className="shrink-0 text-muted-foreground"
                                        />
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
                            <Button
                                variant="outline"
                                className="h-12 px-6 text-base"
                            >
                                ← Sebelumnya
                            </Button>
                        </Link>
                    ) : (
                        <div />
                    )}
                    {records.next_page_url && (
                        <Link href={records.next_page_url}>
                            <Button
                                variant="outline"
                                className="h-12 px-6 text-base"
                            >
                                Berikutnya →
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

export default function InspeksiKantorIndex({
    myRecords,
    pendingReInspeksi,
    selesaiAsRI,
}: Props) {
    const [tab, setTab] = useState<'my' | 'pending' | 'confirmed'>('my');
    const pendingCount = pendingReInspeksi.data.length;

    return (
        <>
            <Head title="Inspeksi Kantor" />
            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">
                            Inspeksi Area Kantor
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            WBK-HSE-FO-004
                        </p>
                    </div>
                    <Link
                        href="/sap/inspeksi-kantor/create"
                        className="shrink-0"
                    >
                        <Button className="h-12 gap-2 px-5 text-base font-bold">
                            <Plus size={18} /> Buat Inspeksi
                        </Button>
                    </Link>
                </div>

                <div className="flex gap-1 rounded-xl bg-muted p-1">
                    {(
                        [
                            { key: 'my', label: 'Inspeksi Saya' },
                            {
                                key: 'pending',
                                label: 'Perlu Re-Inspeksi',
                                count: pendingCount,
                            },
                            { key: 'confirmed', label: 'Riwayat Re-Inspeksi' },
                        ] as const
                    ).map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                                tab === t.key
                                    ? 'bg-background text-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground',
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
                {tab === 'pending' && (
                    <RecordList records={pendingReInspeksi} asRI />
                )}
                {tab === 'confirmed' && (
                    <RecordList records={selesaiAsRI} asRI />
                )}
            </div>
        </>
    );
}
