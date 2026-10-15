import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { InspeksiMenu } from '@/components/dashboard/inspeksi-menu';
import { cn } from '@/lib/utils';

export type WeekInfo = {
    start: string;
    end: string;
    count: number;
    terpenuhi: boolean;
};
export type MetricWeekly = {
    target_per_minggu?: number;
    target_per_periode?: number;
    weeks: WeekInfo[];
    minggu_berlalu: number;
    minggu_terpenuhi: number;
    persen: number;
};
export type TargetInfo = {
    level: string;
    bugar: {
        target_per_hari: number;
        hari_berlalu: number;
        hari_terpenuhi: number;
        persen: number;
        tanggal_terisi?: string[];
    };
    laporan: MetricWeekly;
    inspeksi: MetricWeekly | null;
    observasi: MetricWeekly | null;
    jsa: MetricWeekly | null;
};

type Level = 'ok' | 'warn' | 'bad';

// Ambang sama dengan tampilan target sebelumnya: >=80% tercapai, >=50% kurang.
function levelOf(persen: number): Level {
    return persen >= 80 ? 'ok' : persen >= 50 ? 'warn' : 'bad';
}

const LEVEL: Record<Level, { label: string; dot: string; badge: string }> = {
    ok: {
        label: 'Tercapai',
        dot: 'bg-success',
        badge: 'border-success/30 bg-success-soft text-success',
    },
    warn: {
        label: 'Kurang',
        dot: 'bg-warning',
        badge: 'border-warning/30 bg-warning-soft text-warning',
    },
    bad: {
        label: 'Tertinggal',
        dot: 'bg-destructive',
        badge: 'border-destructive/30 bg-destructive-soft text-destructive',
    },
};

type TabKey = 'bugar' | 'laporan' | 'inspeksi' | 'observasi' | 'jsa';

const WEEKLY_META: Record<
    Exclude<TabKey, 'bugar'>,
    {
        short: string;
        full: string;
        per: 'minggu' | 'periode';
        cta: string;
        href?: string;
    }
> = {
    laporan: {
        short: 'Bahaya',
        full: 'Laporan Bahaya',
        per: 'minggu',
        cta: 'Lapor',
        href: '/laporan-bahaya/create',
    },
    inspeksi: {
        short: 'Inspeksi',
        full: 'Inspeksi',
        per: 'minggu',
        cta: 'Buat',
    },
    observasi: {
        short: 'Observasi',
        full: 'Observasi',
        per: 'minggu',
        cta: 'Buat',
        href: '/sap/observasi-keselamatan/create',
    },
    jsa: {
        short: 'JSA',
        full: 'Komunikasi JSA',
        per: 'periode',
        cta: 'Buat',
        href: '/sap/komunikasi-jsa/create',
    },
};

function toDateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TargetCard({
    target,
    streak,
}: {
    target: TargetInfo;
    streak: number;
}) {
    const [tab, setTab] = useState<TabKey>('bugar');

    const tabs: { key: TabKey; short: string; full: string; level: Level }[] = [
        {
            key: 'bugar',
            short: 'Bugar',
            full: 'Bugar Selamat',
            level: levelOf(target.bugar.persen),
        },
        ...(['laporan', 'inspeksi', 'observasi', 'jsa'] as const)
            .filter((k) => target[k] !== null)
            .map((k) => ({
                key: k,
                short: WEEKLY_META[k].short,
                full: WEEKLY_META[k].full,
                level: levelOf((target[k] as MetricWeekly).persen),
            })),
    ];
    const active = tabs.find((t) => t.key === tab) ?? tabs[0];
    const level = LEVEL[active.level];
    const monthName = new Date().toLocaleDateString('id-ID', { month: 'long' });

    return (
        <section aria-labelledby="target-title" className="space-y-2">
            <div className="flex items-baseline justify-between">
                <h2 id="target-title" className="text-[15px] font-semibold">
                    Target {monthName}
                </h2>
                {streak > 0 && (
                    <span className="text-[13px] text-muted-foreground">
                        Streak {streak} hari
                    </span>
                )}
            </div>
            <div className="rounded-lg bg-card">
                <div className="p-2.5 pb-0">
                    <div
                        role="tablist"
                        aria-label="Kategori target"
                        className="grid gap-0.5 rounded-lg bg-muted p-[3px]"
                        style={{
                            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={t.key === active.key}
                                aria-label={`${t.full}, ${LEVEL[t.level].label}`}
                                onClick={() => setTab(t.key)}
                                className={cn(
                                    'flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-1 rounded-md px-0.5 text-xs font-medium transition-colors',
                                    t.key === active.key
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        'size-1.5 rounded-full',
                                        LEVEL[t.level].dot,
                                    )}
                                />
                                <span className="max-w-full truncate">
                                    {t.short}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    className="space-y-3 p-3.5"
                    role="tabpanel"
                    aria-label={active.full}
                >
                    {active.key === 'bugar' ? (
                        <BugarPanel bugar={target.bugar} level={level} />
                    ) : (
                        <WeeklyPanel
                            kind={active.key}
                            metric={target[active.key] as MetricWeekly}
                            level={level}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

function Summary({
    big,
    unit,
    caption,
    level,
}: {
    big: number;
    unit: string;
    caption: string;
    level: (typeof LEVEL)[Level];
}) {
    return (
        <div className="flex items-end justify-between gap-2">
            <div>
                <p className="text-[28px] leading-none font-semibold tabular-nums">
                    {big}
                    <span className="text-sm font-medium text-muted-foreground">
                        {' '}
                        {unit}
                    </span>
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                    {caption}
                </p>
            </div>
            <span
                className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold',
                    level.badge,
                )}
            >
                <span
                    aria-hidden
                    className={cn('size-1.5 rounded-full', level.dot)}
                />
                {level.label}
            </span>
        </div>
    );
}

function BugarPanel({
    bugar,
    level,
}: {
    bugar: TargetInfo['bugar'];
    level: (typeof LEVEL)[Level];
}) {
    const filled = new Set(bugar.tanggal_terisi ?? []);
    const now = new Date();
    const days = Array.from({ length: bugar.hari_berlalu }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
        const key = toDateString(date);
        const isToday = i + 1 === bugar.hari_berlalu;

        return { day: i + 1, isFilled: filled.has(key), isToday };
    });

    return (
        <>
            <Summary
                big={bugar.hari_terpenuhi}
                unit={`/ ${bugar.hari_berlalu} hari`}
                caption="Hari terisi bulan ini."
                level={level}
            />
            <div
                role="img"
                aria-label={`Bugar Selamat: ${bugar.hari_terpenuhi} dari ${bugar.hari_berlalu} hari terisi`}
                className="grid grid-cols-7 gap-1"
            >
                {days.map((d) => (
                    <span
                        key={d.day}
                        title={`${d.day} ${now.toLocaleDateString('id-ID', { month: 'short' })}: ${d.isFilled ? 'terisi' : d.isToday ? 'hari ini, belum diisi' : 'tidak terisi'}`}
                        className="flex flex-col items-center gap-1"
                    >
                        <span
                            className={cn(
                                'aspect-square w-full rounded',
                                d.isFilled
                                    ? 'bg-foreground/85'
                                    : d.isToday
                                      ? 'border-[1.5px] border-dashed border-muted-foreground/60'
                                      : 'bg-muted',
                            )}
                        />
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                            {d.day}
                        </span>
                    </span>
                ))}
            </div>
            <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
                <Legend className="bg-foreground/85" label="Terisi" />
                <Legend className="bg-muted" label="Tidak terisi" />
                <Legend
                    className="border-[1.5px] border-dashed border-muted-foreground/60"
                    label="Hari ini"
                />
            </div>
        </>
    );
}

function Legend({ className, label }: { className: string; label: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-[3px]', className)} />
            {label}
        </span>
    );
}

function WeeklyPanel({
    kind,
    metric,
    level,
}: {
    kind: Exclude<TabKey, 'bugar'>;
    metric: MetricWeekly;
    level: (typeof LEVEL)[Level];
}) {
    const meta = WEEKLY_META[kind];
    const target = metric.target_per_minggu ?? metric.target_per_periode ?? 1;
    const counts = metric.weeks.map((w) => w.count);
    const max = Math.max(target + 1, ...counts);
    const prefix = meta.per === 'periode' ? 'P' : 'Mg';
    const current = metric.weeks[metric.weeks.length - 1];
    const shortfall = current ? Math.max(0, target - current.count) : 0;
    const perLabel = meta.per === 'periode' ? 'periode (2 minggu)' : 'minggu';

    return (
        <>
            <Summary
                big={metric.minggu_terpenuhi}
                unit={`/ ${metric.minggu_berlalu} ${meta.per} tercapai`}
                caption={`Target ${target}× per ${perLabel}.`}
                level={level}
            />
            <div
                role="img"
                aria-label={`${meta.full}: ${counts.join(', ')} per ${meta.per}, target ${target}`}
            >
                <div className="relative flex h-[120px] items-end gap-3 border-b px-1">
                    <div
                        aria-hidden
                        className="absolute inset-x-0 border-t-[1.5px] border-dashed border-muted-foreground/50"
                        style={{ bottom: `${(target / max) * 100}%` }}
                    >
                        <span className="absolute -top-[18px] right-0 bg-card pl-1 text-[11px] text-muted-foreground">
                            target {target}
                        </span>
                    </div>
                    {metric.weeks.map((w, i) => {
                        const isCurrent = i === metric.weeks.length - 1;

                        return (
                            <div
                                key={w.start}
                                title={`${meta.per === 'periode' ? 'Periode' : 'Minggu'} ${i + 1}: ${w.count}× (target ${target})`}
                                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                            >
                                <span className="text-xs font-semibold text-foreground/80 tabular-nums">
                                    {w.count}
                                </span>
                                <div
                                    className={cn(
                                        'min-h-0.5 w-full max-w-11 rounded-t',
                                        isCurrent
                                            ? 'bg-muted-foreground/35'
                                            : w.terpenuhi
                                              ? 'bg-foreground/85'
                                              : 'bg-muted-foreground/70',
                                    )}
                                    style={{
                                        height: `${(w.count / max) * 100}%`,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-3 px-1 pt-1.5">
                    {metric.weeks.map((w, i) => (
                        <span
                            key={w.start}
                            className="flex-1 text-center text-[11px] text-muted-foreground"
                        >
                            {prefix}
                            {i + 1}
                            {i === metric.weeks.length - 1 ? ' · kini' : ''}
                        </span>
                    ))}
                </div>
            </div>
            {shortfall > 0 && (
                <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                    {meta.per === 'periode' ? 'Periode' : 'Minggu'} ini kurang{' '}
                    {shortfall}.
                    {kind === 'inspeksi' ? (
                        <InspeksiMenu align="start">
                            <button
                                type="button"
                                className="inline-flex min-h-8 items-center gap-0.5 rounded-md px-1.5 font-semibold text-foreground underline underline-offset-2 hover:bg-muted"
                            >
                                {meta.cta}
                                <ChevronDown className="size-3" />
                            </button>
                        </InspeksiMenu>
                    ) : (
                        <Link
                            href={meta.href!}
                            className="inline-flex min-h-8 items-center rounded-md px-1.5 font-semibold text-foreground underline underline-offset-2 hover:bg-muted"
                        >
                            {meta.cta}
                        </Link>
                    )}
                </div>
            )}
        </>
    );
}
