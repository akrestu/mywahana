import { Head, Link } from '@inertiajs/react';
import { ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { useState } from 'react';
import type { InspeksiConfig } from '@/components/inspeksi/checklists';
import { EmptyState } from '@/components/patterns/empty-state';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { Pager, SegmentTabs } from '@/components/patterns/segment-tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string };
type Rec = {
    id: number;
    tanggal: string;
    project_site: string;
    lokasi?: string | null;
    departemen?: string | null;
    persentase: number | null;
    risk_level: 'L' | 'M' | 'H' | 'VH' | null;
    status: 'menunggu_re_inspeksi' | 'selesai' | 'ditolak';
    re_inspektor?: UserInfo | null;
    user?: UserInfo | null;
};
export type InspeksiPage = {
    data: Rec[];
    next_page_url: string | null;
    prev_page_url: string | null;
};

const STATUS = {
    selesai: {
        label: 'Selesai',
        cls: 'bg-success-soft text-success',
        bar: 'bg-success',
    },
    ditolak: {
        label: 'Ditolak',
        cls: 'bg-destructive-soft text-destructive',
        bar: 'bg-destructive',
    },
    menunggu_re_inspeksi: {
        label: 'Menunggu re-inspeksi',
        cls: 'bg-warning-soft text-warning',
        bar: 'bg-warning',
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
        const k = new Date(r.tanggal).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
        (groups[k] ??= []).push(r);
    }

    return Object.entries(groups);
}

function RecordList({
    config,
    page,
    asRi,
}: {
    config: InspeksiConfig;
    page: InspeksiPage;
    asRi?: boolean;
}) {
    if (!page.data.length) {
        return (
            <EmptyState
                icon={ClipboardList}
                title="Belum ada data"
                description="Inspeksi akan muncul di sini setelah dibuat."
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
                            const status =
                                STATUS[rec.status] ??
                                STATUS.menunggu_re_inspeksi;
                            const level = rec.risk_level
                                ? LEVEL[rec.risk_level]
                                : null;
                            const place = config.fields
                                .map((f) => rec[f.key])
                                .filter(Boolean)
                                .join(' · ');
                            const who = asRi
                                ? rec.user
                                    ? `oleh ${rec.user.name}`
                                    : null
                                : rec.re_inspektor
                                  ? `RI ${rec.re_inspektor.name}`
                                  : null;

                            return (
                                <li
                                    key={rec.id}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <Link
                                        href={`/sap/inspeksi-${config.kind}/${rec.id}`}
                                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
                                    >
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'h-12 w-1 shrink-0 rounded-full',
                                                status.bar,
                                            )}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold">
                                                {new Date(
                                                    rec.tanggal,
                                                ).toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {[rec.project_site, place, who]
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

/** List page for one inspection type: my inspections, pending re-inspections, re-inspection history. */
export function InspeksiList({
    config,
    myRecords,
    pendingReInspeksi,
    selesaiAsRI,
}: {
    config: InspeksiConfig;
    myRecords: InspeksiPage;
    pendingReInspeksi: InspeksiPage;
    selesaiAsRI: InspeksiPage;
}) {
    const [tab, setTab] = useState<'my' | 'pending' | 'done'>(
        pendingReInspeksi.data.length > 0 ? 'pending' : 'my',
    );

    return (
        <>
            <Head title={config.title} />
            <div className="flex flex-col gap-4 pt-2">
                <ModuleHeader
                    backHref="/sap/inspeksi"
                    eyebrow={config.formCode}
                    title={config.title}
                    actions={
                        <Button
                            asChild
                            size="sm"
                            className="hidden sm:inline-flex"
                        >
                            <Link href={`/sap/inspeksi-${config.kind}/create`}>
                                <Plus /> Buat
                            </Link>
                        </Button>
                    }
                />

                <SegmentTabs
                    label="Kategori inspeksi"
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { key: 'my', label: 'Inspeksi saya' },
                        {
                            key: 'pending',
                            label: 'Perlu re-inspeksi',
                            count: pendingReInspeksi.data.length,
                        },
                        { key: 'done', label: 'Riwayat RI' },
                    ]}
                />

                {tab === 'my' && (
                    <RecordList config={config} page={myRecords} />
                )}
                {tab === 'pending' && (
                    <RecordList config={config} page={pendingReInspeksi} asRi />
                )}
                {tab === 'done' && (
                    <RecordList config={config} page={selesaiAsRI} asRi />
                )}

                <Button asChild size="lg" className="sm:hidden">
                    <Link href={`/sap/inspeksi-${config.kind}/create`}>
                        <Plus /> Buat inspeksi
                    </Link>
                </Button>
            </div>
        </>
    );
}
