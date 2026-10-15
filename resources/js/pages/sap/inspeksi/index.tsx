import { Head, Link } from '@inertiajs/react';
import {
    BedDouble,
    Building2,
    ChevronRight,
    ClipboardList,
    Mountain,
    Plus,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/patterns/empty-state';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { Pager, SegmentTabs } from '@/components/patterns/segment-tabs';
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
type Paginated = {
    data: Rec[];
    next_page_url: string | null;
    prev_page_url: string | null;
    total: number;
};
type Props = {
    myRecords: Paginated;
    pendingReInspeksi: Paginated;
    selesaiAsRI: Paginated;
};

const JENIS: Record<Jenis, { label: string; icon: LucideIcon; tint: string }> =
    {
        kantor: {
            label: 'Kantor',
            icon: Building2,
            tint: 'bg-info-soft text-info',
        },
        tambang: {
            label: 'Tambang',
            icon: Mountain,
            tint: 'bg-accent-soft text-foreground',
        },
        workshop: {
            label: 'Workshop',
            icon: Wrench,
            tint: 'bg-muted text-foreground',
        },
        mess: {
            label: 'Mess',
            icon: BedDouble,
            tint: 'bg-success-soft text-success',
        },
    };

const STATUS = {
    selesai: { label: 'Selesai', cls: 'bg-success-soft text-success' },
    ditolak: { label: 'Ditolak', cls: 'bg-destructive-soft text-destructive' },
    menunggu_re_inspeksi: {
        label: 'Menunggu re-inspeksi',
        cls: 'bg-warning-soft text-warning',
    },
};

const LEVEL = {
    L: { label: 'Baik', cls: 'bg-success-soft text-success' },
    M: { label: 'Cukup', cls: 'bg-accent-soft text-foreground' },
    H: { label: 'Perhatian', cls: 'bg-warning-soft text-warning' },
    VH: {
        label: 'Perlu tindakan',
        cls: 'bg-destructive-soft text-destructive',
    },
};

function groupByMonth(records: Rec[]) {
    const groups: Record<string, Rec[]> = {};

    for (const r of records) {
        const key = new Date(r.tanggal).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
        (groups[key] ??= []).push(r);
    }

    return Object.entries(groups);
}

function RecordList({ page, asRi }: { page: Paginated; asRi?: boolean }) {
    if (!page.data.length) {
        return (
            <EmptyState
                icon={ClipboardList}
                title="Belum ada inspeksi"
                description="Pilih jenis inspeksi di atas untuk memulai."
            />
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {groupByMonth(page.data).map(([month, items]) => (
                <section key={month} className="flex flex-col gap-2">
                    <SectionLabel>{month}</SectionLabel>
                    <ul className="overflow-hidden rounded-lg bg-card">
                        {items.map((rec) => {
                            const jenis = JENIS[rec.jenis];
                            const Icon = jenis.icon;
                            const status =
                                STATUS[rec.status] ??
                                STATUS.menunggu_re_inspeksi;
                            const level = rec.risk_level
                                ? LEVEL[rec.risk_level]
                                : null;
                            const who = asRi
                                ? rec.user
                                    ? `oleh ${rec.user.name}`
                                    : null
                                : rec.re_inspektor
                                  ? `RI ${rec.re_inspektor.name}`
                                  : null;

                            return (
                                <li
                                    key={`${rec.jenis}-${rec.id}`}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <Link
                                        href={`/sap/inspeksi-${rec.jenis}/${rec.id}`}
                                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
                                    >
                                        <span
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-[14px]',
                                                jenis.tint,
                                            )}
                                        >
                                            <Icon
                                                className="size-5"
                                                strokeWidth={1.8}
                                            />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold">
                                                {jenis.label} ·{' '}
                                                {new Date(
                                                    rec.tanggal,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {[
                                                    rec.project_site,
                                                    rec.keterangan,
                                                    who,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </span>
                                            <span className="mt-1.5 flex flex-wrap gap-1.5">
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                                                        status.cls,
                                                    )}
                                                >
                                                    {status.label}
                                                </span>
                                                {level &&
                                                    rec.persentase !== null && (
                                                        <span
                                                            className={cn(
                                                                'tabular rounded-full px-2 py-0.5 text-[11px] font-bold',
                                                                level.cls,
                                                            )}
                                                        >
                                                            {rec.persentase}% ·{' '}
                                                            {level.label}
                                                        </span>
                                                    )}
                                            </span>
                                        </span>
                                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
            <Pager prev={page.prev_page_url} next={page.next_page_url} />
        </div>
    );
}

export default function InspeksiIndex({
    myRecords,
    pendingReInspeksi,
    selesaiAsRI,
}: Props) {
    const pending = pendingReInspeksi.total ?? pendingReInspeksi.data.length;
    const [tab, setTab] = useState<'my' | 'pending' | 'done'>(
        pending > 0 ? 'pending' : 'my',
    );

    return (
        <>
            <Head title="Inspeksi" />
            <div className="flex flex-col gap-4 pt-2">
                <ModuleHeader
                    backHref="/k3"
                    eyebrow="K3 / Safety"
                    title="Inspeksi"
                />

                <SectionLabel>Buat inspeksi</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {(Object.keys(JENIS) as Jenis[]).map((k) => {
                        const { label, icon: Icon, tint } = JENIS[k];

                        return (
                            <Link
                                key={k}
                                href={`/sap/inspeksi-${k}/create`}
                                className="flex items-center gap-3 rounded-lg bg-card p-3.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.191_0_0/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                                <span
                                    className={cn(
                                        'flex size-10 shrink-0 items-center justify-center rounded-[14px]',
                                        tint,
                                    )}
                                >
                                    <Icon
                                        className="size-5"
                                        strokeWidth={1.8}
                                    />
                                </span>
                                <span className="min-w-0 flex-1 text-sm font-bold">
                                    {label}
                                </span>
                                <Plus className="size-4 text-muted-foreground" />
                            </Link>
                        );
                    })}
                </div>

                <SegmentTabs
                    label="Kategori inspeksi"
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { key: 'my', label: 'Inspeksi saya' },
                        {
                            key: 'pending',
                            label: 'Re-inspeksi',
                            count: pending,
                        },
                        { key: 'done', label: 'Sudah dicek' },
                    ]}
                />

                {tab === 'my' && <RecordList page={myRecords} />}
                {tab === 'pending' && (
                    <RecordList page={pendingReInspeksi} asRi />
                )}
                {tab === 'done' && <RecordList page={selesaiAsRI} asRi />}
            </div>
        </>
    );
}
