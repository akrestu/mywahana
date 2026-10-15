import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, CheckCircle2, ChevronRight, OctagonX } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import type {
    RecentBugar,
    RecentInspeksi,
    RecentJsa,
    RecentLaporan,
    RecentObservasi,
} from '@/components/dashboard/recent-activity';
import type {
    MetricWeekly,
    TargetInfo,
} from '@/components/dashboard/target-card';
import { NotificationBell } from '@/components/notification-bell';
import { KelayakanBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import type { InboxItem } from '@/pages/inbox/index';
import type { Auth } from '@/types';

type NewBadge = { key: string; nama: string; icon: string; earned_at: string };

type Props = {
    recent_bugar_selamat: RecentBugar[];
    recent_laporan_bahaya: RecentLaporan[];
    recent_observasi?: RecentObservasi[];
    recent_inspeksi?: RecentInspeksi[];
    recent_jsa?: RecentJsa[];
    target?: TargetInfo;
    new_badges?: NewBadge[];
    perlu_tindakan?: InboxItem[];
    perlu_tindakan_total?: number;
};

const toneClass: Record<InboxItem['tone'], string> = {
    neutral: 'bg-muted text-foreground',
    info: 'bg-info-soft text-info',
    accent: 'bg-accent-soft text-foreground',
    danger: 'bg-destructive-soft text-destructive',
};

function greetingFor(hour: number): string {
    if (hour >= 4 && hour < 11) {
        return 'Selamat pagi';
    }

    if (hour >= 11 && hour < 15) {
        return 'Selamat siang';
    }

    if (hour >= 15 && hour < 19) {
        return 'Selamat sore';
    }

    return 'Selamat malam';
}

function isToday(dateStr: string): boolean {
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

/** When a Bugar Selamat was filled in, e.g. "Kam, 15 Okt · 07.12" (device time). */
function filledAt(record: RecentBugar): string {
    const at = new Date(record.created_at ?? record.tanggal);
    const date = at.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        ...(at.getFullYear() !== new Date().getFullYear() && {
            year: 'numeric',
        }),
    });

    if (!record.created_at) {
        return date;
    }

    const time = at.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${date} · ${time}`;
}

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

/** Count and target for the current week (or JSA period). */
function thisPeriod(w: MetricWeekly | null) {
    return {
        count: w?.weeks.at(-1)?.count ?? 0,
        total: w?.target_per_minggu ?? w?.target_per_periode ?? 0,
    };
}

export default function Dashboard({
    recent_bugar_selamat = [],
    recent_laporan_bahaya = [],
    recent_observasi = [],
    recent_inspeksi = [],
    recent_jsa = [],
    target,
    new_badges = [],
    perlu_tindakan = [],
    perlu_tindakan_total = 0,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const now = new Date();
    const firstName = user.name?.split(' ')[0] ?? user.name;
    const dateLabel = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
    });
    const bugarHariIni =
        recent_bugar_selamat.length > 0 &&
        isToday(recent_bugar_selamat[0].tanggal)
            ? recent_bugar_selamat[0]
            : null;

    // Pencapaian baru cukup diumumkan sekali lewat toast, bukan kartu yang menetap.
    const badgeKeys = new_badges.map((b) => b.key).join(',');
    useEffect(() => {
        let dismissed: string[] = [];

        try {
            dismissed = JSON.parse(
                localStorage.getItem('dismissed_badges') ?? '[]',
            ) as string[];
        } catch {
            // Penyimpanan diblokir: tetap tampilkan toast.
        }

        const fresh = new_badges.filter((b) => !dismissed.includes(b.key));

        if (fresh.length === 0) {
            return;
        }

        toast.success(
            `Pencapaian baru: ${fresh.map((b) => `${b.icon} ${b.nama}`).join(', ')}`,
        );

        try {
            localStorage.setItem(
                'dismissed_badges',
                JSON.stringify([...dismissed, ...fresh.map((b) => b.key)]),
            );
        } catch {
            // Abaikan.
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [badgeKeys]);

    const daysLeft =
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() -
        now.getDate();
    const targetCols = target
        ? [
              {
                  label: 'Bugar',
                  count: target.bugar.hari_terpenuhi,
                  total: target.bugar.hari_berlalu,
              },
              { label: 'Bahaya', ...thisPeriod(target.laporan) },
              ...(target.inspeksi
                  ? [{ label: 'Inspeksi', ...thisPeriod(target.inspeksi) }]
                  : []),
              ...(target.observasi
                  ? [{ label: 'Observasi', ...thisPeriod(target.observasi) }]
                  : []),
              ...(target.jsa
                  ? [{ label: 'JSA', ...thisPeriod(target.jsa) }]
                  : []),
          ]
        : [];

    return (
        <>
            <Head title="Beranda" />

            <div className="flex flex-col gap-5 pb-4">
                {/* Hero: Merapi Barat */}
                <section className="relative isolate -mx-4 -mt-4 overflow-hidden px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[76px] text-white lg:mx-0 lg:mt-0 lg:rounded-[22px] lg:pt-6">
                    <img
                        src="/images/mountain.jpg"
                        alt=""
                        className="absolute inset-0 -z-20 size-full object-cover object-[60%_70%]"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/20 to-black/5"
                    />
                    <div className="flex items-center justify-between gap-3">
                        <Link
                            href="/settings/profile"
                            className="flex min-w-0 items-center gap-3"
                        >
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt=""
                                    className="size-[42px] shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-ink">
                                    {initials(user.name ?? '')}
                                </span>
                            )}
                            <span className="min-w-0">
                                <span className="block truncate text-xs text-white/85 capitalize">
                                    {dateLabel}
                                    {user.site
                                        ? ` · Site ${user.site.toUpperCase()}`
                                        : ''}
                                </span>
                                <span className="block truncate text-lg font-bold">
                                    {greetingFor(now.getHours())}, {firstName}
                                </span>
                            </span>
                        </Link>
                        <NotificationBell className="size-11 shrink-0 rounded-full bg-white/95 text-ink hover:bg-white lg:hidden" />
                    </div>
                    <h1 className="mt-5 text-[26px] leading-[1.15] font-extrabold tracking-tight">
                        Siap kerja aman
                        <br />
                        hari ini?
                    </h1>
                </section>

                {/* Bugar Selamat: wajib sebelum kerja */}
                <div className="relative z-10 -mt-[68px]">
                    {bugarHariIni ? (
                        <BugarDone
                            status={bugarHariIni.status_kelayakan}
                            shift={bugarHariIni.shift}
                            filledAt={filledAt(bugarHariIni)}
                        />
                    ) : (
                        <Link
                            href="/bugar-selamat/create"
                            className="flex items-center gap-3.5 rounded-[22px] bg-card p-4 shadow-[0_8px_24px_oklch(0.191_0_0/0.07)] transition-transform active:scale-[0.99]"
                        >
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                                <Activity
                                    className="size-[22px]"
                                    strokeWidth={1.8}
                                />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[11px] font-bold tracking-[0.1em] text-warning uppercase">
                                    Wajib sebelum kerja
                                </span>
                                <span className="block text-[15px] font-bold">
                                    Isi Bugar Selamat
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {recent_bugar_selamat[0]
                                        ? `Terakhir diisi ${filledAt(recent_bugar_selamat[0])}`
                                        : 'Kurang dari 30 detik'}
                                </span>
                            </span>
                            <span className="flex h-11 items-center rounded-full bg-primary px-[18px] text-[13px] font-semibold text-primary-foreground">
                                Isi
                            </span>
                        </Link>
                    )}
                </div>

                {/* Perlu tindakan */}
                {perlu_tindakan.length > 0 && (
                    <section
                        aria-labelledby="tindakan-title"
                        className="flex flex-col gap-3"
                    >
                        <div className="flex items-baseline justify-between">
                            <h2
                                id="tindakan-title"
                                className="flex items-center gap-2 text-base font-bold"
                            >
                                Perlu tindakan
                                <span className="tabular flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-extrabold text-accent-foreground">
                                    {perlu_tindakan_total}
                                </span>
                            </h2>
                            <Link
                                href="/inbox"
                                className="text-[13px] font-semibold hover:underline"
                            >
                                Inbox
                            </Link>
                        </div>
                        <ul className="overflow-hidden rounded-lg bg-card">
                            {perlu_tindakan.map((item) => (
                                <li
                                    key={item.key}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <Link
                                        href={
                                            item.action_url ?? item.detail_url
                                        }
                                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
                                    >
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-[14px] text-xs font-extrabold',
                                                toneClass[item.tone],
                                            )}
                                        >
                                            {item.ab}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold">
                                                {item.title}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.subtitle}
                                            </span>
                                        </span>
                                        <span className="shrink-0 rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-bold text-warning">
                                            {item.action_label ??
                                                'Tindak lanjut'}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Target bulan ini */}
                {targetCols.length > 0 && (
                    <Link
                        href="/k3"
                        className="flex flex-col gap-3 rounded-lg bg-card p-4 transition-shadow hover:shadow-[0_8px_24px_oklch(0.191_0_0/0.08)]"
                    >
                        <span className="flex items-baseline justify-between">
                            <span className="text-sm font-bold capitalize">
                                Target{' '}
                                {now.toLocaleDateString('id-ID', {
                                    month: 'long',
                                })}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                tersisa {daysLeft} hari
                                <ChevronRight className="size-3.5" />
                            </span>
                        </span>
                        <span
                            className="grid gap-2 text-center"
                            style={{
                                gridTemplateColumns: `repeat(${targetCols.length}, minmax(0, 1fr))`,
                            }}
                        >
                            {targetCols.map((c) => {
                                const pct =
                                    c.total > 0
                                        ? Math.min(
                                              100,
                                              Math.round(
                                                  (c.count / c.total) * 100,
                                              ),
                                          )
                                        : 0;
                                const met = c.total > 0 && c.count >= c.total;

                                return (
                                    <span
                                        key={c.label}
                                        className="flex flex-col items-center gap-1.5"
                                    >
                                        <span className="tabular text-[15px] font-extrabold">
                                            {c.count}
                                            <span className="text-[11px] font-semibold text-muted-foreground">
                                                /{c.total}
                                            </span>
                                        </span>
                                        <span
                                            className="h-[5px] w-full overflow-hidden rounded-full bg-muted"
                                            role="progressbar"
                                            aria-label={c.label}
                                            aria-valuenow={pct}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        >
                                            <span
                                                className={cn(
                                                    'block h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.2,0,0,1)]',
                                                    met
                                                        ? 'bg-accent'
                                                        : 'bg-foreground',
                                                )}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {c.label}
                                        </span>
                                    </span>
                                );
                            })}
                        </span>
                    </Link>
                )}

                <RecentActivity
                    bugar={recent_bugar_selamat}
                    laporan={recent_laporan_bahaya}
                    observasi={recent_observasi}
                    inspeksi={recent_inspeksi}
                    jsa={recent_jsa}
                />

                <p className="pt-1 text-center text-xs text-muted-foreground/60">
                    <a
                        href="https://github.com/akrestu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-muted-foreground"
                    >
                        Create with love ❤ by ak.restu
                    </a>
                </p>
            </div>
        </>
    );
}

function BugarDone({
    status,
    shift,
    filledAt,
}: {
    status: RecentBugar['status_kelayakan'];
    shift: string;
    filledAt: string;
}) {
    // Status "dilarang" adalah kondisi keselamatan: tetap menonjol, bukan baris tenang.
    if (status === 'dilarang') {
        return (
            <section
                aria-label="Bugar Selamat hari ini"
                className="flex items-start gap-3 rounded-[22px] border-2 border-destructive bg-card p-4 shadow-[0_8px_24px_oklch(0.191_0_0/0.07)]"
            >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-destructive-soft text-destructive">
                    <OctagonX className="size-[22px]" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold">
                        Tidak layak bekerja hari ini
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Hasil Bugar Selamat shift {shift}. Segera lapor ke
                        pengawas Anda.
                    </p>
                    <p className="tabular mt-1 text-xs text-muted-foreground">
                        Diisi {filledAt}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section
            aria-label="Bugar Selamat hari ini"
            className="flex items-center gap-3.5 rounded-[22px] bg-card p-4 shadow-[0_8px_24px_oklch(0.191_0_0/0.07)]"
        >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 className="size-[22px]" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                    Bugar Selamat · Shift {shift}
                </span>
                <span className="block text-[15px] font-bold">
                    Sudah diisi hari ini
                </span>
                <span className="tabular block text-xs text-muted-foreground">
                    Diisi {filledAt}
                </span>
            </span>
            <KelayakanBadge status={status} />
        </section>
    );
}
