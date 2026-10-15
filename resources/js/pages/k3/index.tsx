import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BookOpen,
    ClipboardCheck,
    FileWarning,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/patterns/empty-state';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { TindakanBadge } from '@/components/status-badge';
import type { StatusTindakan } from '@/lib/status';
import { cn } from '@/lib/utils';

type Weekly = {
    target_per_minggu?: number;
    target_per_periode?: number;
    weeks: { count: number }[];
    minggu_berlalu: number;
    minggu_terpenuhi: number;
};

type Target = {
    bugar: { hari_berlalu: number; hari_terpenuhi: number };
    laporan: Weekly;
    inspeksi: Weekly | null;
    observasi: Weekly | null;
    jsa: Weekly | null;
};

type InspeksiStat = { bulan_ini: number; menunggu_re_inspeksi: number };

type Props = {
    is_staff: boolean;
    target: Target;
    bugar_hari_ini: boolean;
    pic_terbuka: number;
    jsa_perlu_ttd: number;
    observasi_perlu_konfirmasi: number;
    inspeksi: Record<
        'kantor' | 'tambang' | 'workshop' | 'mess',
        InspeksiStat
    > | null;
    riwayat: {
        id: number;
        tanggal: string;
        lokasi: string | null;
        tingkat_risiko: string | null;
        status_tindakan: StatusTindakan;
    }[];
};

const INSPEKSI_LABEL = {
    kantor: 'Kantor',
    tambang: 'Tambang',
    workshop: 'Workshop',
    mess: 'Mess',
} as const;
const METRIC_LABEL = {
    observasi: 'Observasi',
    laporan: 'Laporan bahaya',
    inspeksi: 'Inspeksi',
    jsa: 'JSA',
} as const;

/** Count and target for the current week (or JSA period). */
function thisPeriod(w: Weekly) {
    return {
        count: w.weeks.at(-1)?.count ?? 0,
        target: w.target_per_minggu ?? w.target_per_periode ?? 0,
    };
}

function summarize(target: Target) {
    const parts = [
        { done: target.bugar.hari_terpenuhi, total: target.bugar.hari_berlalu },
        ...(['laporan', 'inspeksi', 'observasi', 'jsa'] as const).flatMap(
            (k) => {
                const w = target[k];

                return w
                    ? [{ done: w.minggu_terpenuhi, total: w.minggu_berlalu }]
                    : [];
            },
        ),
    ];
    const done = parts.reduce((s, p) => s + p.done, 0);
    const total = parts.reduce((s, p) => s + p.total, 0);

    return {
        done,
        total,
        persen: total > 0 ? Math.round((done / total) * 100) : 0,
    };
}

function ProgramTile({
    href,
    icon: Icon,
    tint,
    iconClass,
    title,
    note,
    alert,
    emphasis,
}: {
    href: string;
    icon: LucideIcon;
    tint: string;
    iconClass: string;
    title: string;
    note: string;
    alert?: boolean;
    emphasis?: boolean;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'flex flex-col gap-3.5 rounded-lg bg-card p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.191_0_0/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                emphasis && 'ring-2 ring-foreground ring-inset',
            )}
        >
            <span
                className={cn(
                    'flex size-10 items-center justify-center rounded-[14px]',
                    tint,
                )}
            >
                <Icon className={cn('size-5', iconClass)} strokeWidth={1.8} />
            </span>
            <span>
                <span className="block text-sm font-bold">{title}</span>
                <span
                    className={cn(
                        'block text-xs',
                        alert
                            ? 'font-semibold text-warning'
                            : 'text-muted-foreground',
                    )}
                >
                    {note}
                </span>
            </span>
        </Link>
    );
}

export default function K3Index({
    is_staff,
    target,
    bugar_hari_ini,
    pic_terbuka,
    jsa_perlu_ttd,
    observasi_perlu_konfirmasi,
    inspeksi,
    riwayat,
}: Props) {
    const summary = summarize(target);
    const month = new Date().toLocaleDateString('id-ID', { month: 'long' });
    const laporan = thisPeriod(target.laporan);

    const lagging = (
        ['observasi', 'laporan', 'inspeksi', 'jsa'] as const
    ).flatMap((k) => {
        const w = target[k];

        if (!w) {
            return [];
        }

        const p = thisPeriod(w);

        return p.count < p.target ? [{ label: METRIC_LABEL[k], ...p }] : [];
    })[0];

    return (
        <>
            <Head title="K3 / Safety" />
            <div className="flex flex-col gap-3.5 pt-2">
                <ModuleHeader
                    backHref="/modules"
                    eyebrow="Modul"
                    title="K3 / Safety"
                />

                <section
                    aria-label="Kinerja K3 bulan ini"
                    className="flex items-center gap-4 rounded-[22px] bg-[oklch(0.191_0_0)] p-[18px] text-white dark:border dark:border-border dark:bg-card"
                >
                    <div
                        className="flex size-16 shrink-0 items-center justify-center rounded-full"
                        style={{
                            background: `conic-gradient(var(--accent) 0 ${summary.persen}%, oklch(0.32 0.006 85) ${summary.persen}% 100%)`,
                        }}
                        role="img"
                        aria-label={`${summary.persen} persen target terpenuhi`}
                    >
                        <span className="tabular flex size-[50px] items-center justify-center rounded-full bg-[oklch(0.191_0_0)] text-[15px] font-extrabold dark:bg-card">
                            {summary.persen}%
                        </span>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs text-white/70">
                            Kinerja K3 Anda · {month}
                        </div>
                        <div className="mt-0.5 text-base font-bold">
                            {summary.done} dari {summary.total} target terpenuhi
                        </div>
                        {lagging && (
                            <div className="mt-1 text-xs font-semibold text-accent">
                                {lagging.label} minggu ini {lagging.count}/
                                {lagging.target}
                            </div>
                        )}
                    </div>
                </section>

                <SectionLabel>Program</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    <ProgramTile
                        href="/bugar-selamat"
                        icon={Activity}
                        tint="bg-success-soft"
                        iconClass="text-success"
                        title="Bugar Selamat"
                        note={
                            bugar_hari_ini
                                ? 'Sudah diisi hari ini'
                                : 'Belum diisi hari ini'
                        }
                        alert={!bugar_hari_ini}
                        emphasis={!bugar_hari_ini}
                    />
                    <ProgramTile
                        href="/laporan-bahaya"
                        icon={AlertTriangle}
                        tint="bg-destructive-soft"
                        iconClass="text-destructive"
                        title="Laporan Bahaya"
                        note={`${laporan.count}/${laporan.target} minggu ini${pic_terbuka > 0 ? ` · ${pic_terbuka} Anda PIC` : ''}`}
                        alert={pic_terbuka > 0}
                    />
                    {is_staff && (
                        <ProgramTile
                            href="/sap/observasi-keselamatan"
                            icon={ClipboardCheck}
                            tint="bg-info-soft"
                            iconClass="text-info"
                            title="Observasi"
                            note={
                                observasi_perlu_konfirmasi > 0
                                    ? `${observasi_perlu_konfirmasi} perlu konfirmasi`
                                    : target.observasi
                                      ? `${thisPeriod(target.observasi).count}/${thisPeriod(target.observasi).target} minggu ini`
                                      : 'Lihat riwayat'
                            }
                            alert={observasi_perlu_konfirmasi > 0}
                        />
                    )}
                    {is_staff && (
                        <ProgramTile
                            href="/sap/komunikasi-jsa"
                            icon={BookOpen}
                            tint="bg-accent-soft"
                            iconClass="text-foreground"
                            title="Komunikasi JSA"
                            note={
                                jsa_perlu_ttd > 0
                                    ? `${jsa_perlu_ttd} perlu TTD`
                                    : target.jsa
                                      ? `${thisPeriod(target.jsa).count}/${thisPeriod(target.jsa).target} periode ini`
                                      : 'Lihat riwayat'
                            }
                            alert={jsa_perlu_ttd > 0}
                        />
                    )}
                </div>

                {is_staff && inspeksi && (
                    <Link
                        href="/sap/inspeksi"
                        className="flex flex-col gap-3 rounded-lg bg-card p-4 transition-shadow hover:shadow-[0_8px_24px_oklch(0.191_0_0/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <span className="flex items-center justify-between">
                            <span className="text-sm font-bold">Inspeksi</span>
                            {target.inspeksi && (
                                <span className="tabular text-xs text-muted-foreground">
                                    {thisPeriod(target.inspeksi).count}/
                                    {thisPeriod(target.inspeksi).target} minggu
                                    ini
                                </span>
                            )}
                        </span>
                        <span className="grid grid-cols-4 gap-2">
                            {(
                                Object.keys(
                                    INSPEKSI_LABEL,
                                ) as (keyof typeof INSPEKSI_LABEL)[]
                            ).map((k) => {
                                const s = inspeksi[k];

                                return (
                                    <span
                                        key={k}
                                        className="flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-[14px] bg-background text-[11px] font-semibold"
                                    >
                                        {INSPEKSI_LABEL[k]}
                                        {s.menunggu_re_inspeksi > 0 ? (
                                            <span className="text-[10px] text-warning">
                                                {s.menunggu_re_inspeksi}{' '}
                                                re-insp.
                                            </span>
                                        ) : (
                                            <span
                                                className={cn(
                                                    'tabular text-[10px]',
                                                    s.bulan_ini > 0
                                                        ? 'text-success'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {s.bulan_ini > 0
                                                    ? `✓ ${s.bulan_ini}`
                                                    : '—'}
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </span>
                    </Link>
                )}

                <SectionLabel
                    action={
                        <Link
                            href="/laporan-bahaya"
                            className="text-[13px] font-semibold hover:underline"
                        >
                            Semua
                        </Link>
                    }
                >
                    Laporan bahaya terbaru
                </SectionLabel>
                {riwayat.length > 0 ? (
                    <ul className="overflow-hidden rounded-lg bg-card">
                        {riwayat.map((r) => (
                            <li
                                key={r.id}
                                className="border-b border-border/60 last:border-0"
                            >
                                <Link
                                    href={`/laporan-bahaya/${r.id}`}
                                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">
                                            Laporan Bahaya · {r.lokasi ?? '-'}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {new Date(
                                                r.tanggal,
                                            ).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </span>
                                    </span>
                                    <TindakanBadge status={r.status_tindakan} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={FileWarning}
                        title="Belum ada laporan"
                        description="Laporan bahaya yang Anda buat akan tampil di sini."
                    />
                )}
            </div>
        </>
    );
}
