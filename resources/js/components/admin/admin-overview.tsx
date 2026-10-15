import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { RiskBadge } from '@/components/risk-badge';
import { TindakanBadge } from '@/components/status-badge';
import { riskLabels } from '@/lib/risk';
import type { RiskLevel } from '@/lib/risk';
import type { StatusTindakan } from '@/lib/status';
import { cn } from '@/lib/utils';

export type Overview = {
    employees: number;
    bugar_daily: { tanggal: string; persen: number }[];
    risk_distribution: Record<RiskLevel, number>;
    attention: {
        id: number;
        tanggal: string;
        lokasi: string;
        site: string | null;
        tingkat_risiko: RiskLevel;
        status_tindakan: StatusTindakan;
    }[];
    site_summary: {
        site: string;
        label: string;
        bugar: number;
        laporan: number;
        inspeksi: number;
        observasi: number;
        jsa: number;
    }[];
};

const BUGAR_TARGET = 95;
const RISK_BAR: Record<RiskLevel, string> = {
    C: 'bg-success',
    B: 'bg-warning',
    A: 'bg-destructive',
    AA: 'bg-risk-extreme',
};

function Panel({
    title,
    meta,
    children,
    className,
}: {
    title: string;
    meta?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'flex flex-col gap-3.5 rounded-lg border border-border bg-card p-5',
                className,
            )}
        >
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[15px] font-bold">{title}</h2>
                {meta && (
                    <span className="text-xs text-muted-foreground">
                        {meta}
                    </span>
                )}
            </div>
            {children}
        </section>
    );
}

/** Cross-module summary shown at the top of the admin dashboard (ADashboard design). */
export function AdminOverview({ overview }: { overview: Overview }) {
    const days = overview.bugar_daily;
    const latest = days.at(-1);
    const riskTotal = Object.values(overview.risk_distribution).reduce(
        (a, b) => a + b,
        0,
    );
    const riskMax = Math.max(1, ...Object.values(overview.risk_distribution));

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Panel
                    title="Kepatuhan Bugar Selamat harian"
                    meta={`target ${BUGAR_TARGET}%`}
                >
                    {days.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Belum ada data di bulan ini.
                        </p>
                    ) : (
                        <>
                            <div
                                className="relative h-48"
                                role="img"
                                aria-label={`Kepatuhan harian, terakhir ${latest?.persen ?? 0} persen`}
                            >
                                <div
                                    aria-hidden
                                    className="absolute inset-x-0 border-t border-dashed border-foreground/40"
                                    style={{ bottom: `${BUGAR_TARGET}%` }}
                                >
                                    <span className="absolute -top-4 right-0 text-[10px] font-semibold text-muted-foreground">
                                        {BUGAR_TARGET}%
                                    </span>
                                </div>
                                <div className="flex h-full items-end gap-1">
                                    {days.map((d, i) => {
                                        const last = i === days.length - 1;

                                        return (
                                            <div
                                                key={d.tanggal}
                                                title={`${new Date(d.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · ${d.persen}%`}
                                                className={cn(
                                                    'min-w-0 flex-1 rounded-t-[6px] transition-[height] duration-700',
                                                    last
                                                        ? 'bg-foreground'
                                                        : d.persen <
                                                            BUGAR_TARGET - 5
                                                          ? 'bg-accent'
                                                          : 'bg-border',
                                                )}
                                                style={{
                                                    height: `${Math.max(2, d.persen)}%`,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="tabular flex justify-between text-[11px] text-muted-foreground">
                                <span>
                                    {new Date(
                                        days[0].tanggal,
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                    })}
                                </span>
                                {latest && (
                                    <span className="font-bold text-foreground">
                                        {new Date(
                                            latest.tanggal,
                                        ).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}{' '}
                                        · {latest.persen}%
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Batang kuning: di bawah {BUGAR_TARGET - 5}% dari{' '}
                                {overview.employees.toLocaleString('id-ID')}{' '}
                                karyawan.
                            </p>
                        </>
                    )}
                </Panel>

                <div className="flex flex-col gap-4">
                    <Panel
                        title="Laporan bahaya per tingkat risiko"
                        meta={`${riskTotal} laporan`}
                    >
                        <div className="flex flex-col gap-2.5">
                            {(['C', 'B', 'A', 'AA'] as RiskLevel[]).map(
                                (lv) => (
                                    <div
                                        key={lv}
                                        className="grid grid-cols-[96px_1fr_32px] items-center gap-3 text-sm"
                                    >
                                        <span className="text-xs font-semibold">
                                            {riskLabels[lv]} · {lv}
                                        </span>
                                        <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                                            <span
                                                className={cn(
                                                    'block h-full rounded-full',
                                                    RISK_BAR[lv],
                                                )}
                                                style={{
                                                    width: `${(overview.risk_distribution[lv] / riskMax) * 100}%`,
                                                }}
                                            />
                                        </span>
                                        <span className="tabular text-right font-bold">
                                            {overview.risk_distribution[lv]}
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    </Panel>

                    <Panel
                        title="Perlu perhatian"
                        meta={
                            overview.attention.length
                                ? 'Ekstrem & tinggi, belum selesai'
                                : undefined
                        }
                    >
                        {overview.attention.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Tidak ada laporan berisiko tinggi yang terbuka.
                            </p>
                        ) : (
                            <ul className="-mx-2 flex flex-col">
                                {overview.attention.map((a) => (
                                    <li key={a.id}>
                                        <Link
                                            href={`/laporan-bahaya/${a.id}?ref=admin`}
                                            className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted"
                                        >
                                            <RiskBadge
                                                level={a.tingkat_risiko}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold">
                                                    {a.lokasi}
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {[
                                                        a.site?.toUpperCase(),
                                                        new Date(
                                                            a.tanggal,
                                                        ).toLocaleDateString(
                                                            'id-ID',
                                                            {
                                                                day: 'numeric',
                                                                month: 'short',
                                                            },
                                                        ),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </span>
                                            </span>
                                            <TindakanBadge
                                                status={a.status_tindakan}
                                            />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>
            </div>

            <Panel
                title="Capaian per site"
                meta={
                    <Link
                        href="/admin/laporan-bahaya"
                        className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
                    >
                        Lihat data detail <ChevronRight className="size-3.5" />
                    </Link>
                }
            >
                <div className="-mx-5 overflow-x-auto">
                    <table className="w-full min-w-[620px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                <th className="px-5 py-2.5">Site</th>
                                <th className="px-3 py-2.5 text-right">
                                    Bugar
                                </th>
                                <th className="px-3 py-2.5 text-right">
                                    Bahaya
                                </th>
                                <th className="px-3 py-2.5 text-right">
                                    Inspeksi
                                </th>
                                <th className="px-3 py-2.5 text-right">
                                    Observasi
                                </th>
                                <th className="px-5 py-2.5 text-right">JSA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overview.site_summary.map((s) => (
                                <tr
                                    key={s.site}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <td className="px-5 py-3 font-semibold">
                                        {s.label}
                                    </td>
                                    <td
                                        className={cn(
                                            'tabular px-3 py-3 text-right font-bold',
                                            s.bugar < BUGAR_TARGET - 5 &&
                                                'text-destructive',
                                        )}
                                    >
                                        {s.bugar}%
                                    </td>
                                    <td className="tabular px-3 py-3 text-right">
                                        {s.laporan}
                                    </td>
                                    <td className="tabular px-3 py-3 text-right">
                                        {s.inspeksi}
                                    </td>
                                    <td className="tabular px-3 py-3 text-right">
                                        {s.observasi}
                                    </td>
                                    <td className="tabular px-5 py-3 text-right">
                                        {s.jsa}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}
