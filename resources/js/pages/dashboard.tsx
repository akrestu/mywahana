import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, BookOpen, BriefcaseBusiness, Check, ChevronDown, ChevronRight, ClipboardCheck, Eye, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { InspeksiMenu } from '@/components/dashboard/inspeksi-menu';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import type { RecentBugar, RecentInspeksi, RecentJsa, RecentLaporan, RecentObservasi } from '@/components/dashboard/recent-activity';
import { TargetCard } from '@/components/dashboard/target-card';
import type { TargetInfo } from '@/components/dashboard/target-card';
import { KelayakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

type NewBadge = { key: string; nama: string; icon: string; earned_at: string };
type PerJenis = { kantor: number; tambang: number; workshop: number; mess: number };

type Props = {
    auth: Auth;
    recent_bugar_selamat: RecentBugar[];
    recent_laporan_bahaya: RecentLaporan[];
    recent_observasi?: RecentObservasi[];
    recent_inspeksi?: RecentInspeksi[];
    recent_jsa?: RecentJsa[];
    streak?: number;
    target?: TargetInfo;
    new_badges?: NewBadge[];
    pending_re_inspeksi?: PerJenis;
    pending_form_ok?: number;
    pending_jsa_tl?: number;
    my_pending_observasi?: number;
    my_pending_jsa?: number;
    my_pending_inspeksi?: PerJenis | null;
    pending_as_pic?: number;
    my_open_with_pic?: number;
};

const GREETINGS_BY_TIME: Record<'pagi' | 'siang' | 'sore' | 'malam', string[]> = {
    pagi: [
        'Selamat Pagi!', 'Good Morning!', 'Bonjour!', 'Buenos Días!',
        'Guten Morgen!', 'Buongiorno!', 'おはようございます！', '早上好！',
    ],
    siang: [
        'Selamat Siang!', 'Good Afternoon!', 'Bon Après-midi!', 'Buenas Tardes!',
        'Guten Tag!', 'Buon Pomeriggio!', 'こんにちは！', '下午好！',
    ],
    sore: [
        'Selamat Sore!', 'Good Afternoon!', 'Bonne Soirée!', 'Buenas Tardes!',
        'Guten Abend!', 'Buona Sera!', 'こんばんは！', '傍晚好！',
    ],
    malam: [
        'Selamat Malam!', 'Good Evening!', 'Bonsoir!', 'Buenas Noches!',
        'Gute Nacht!', 'Buona Notte!', 'こんばんは！', '晚上好！',
    ],
};

function useTypingText(words: string[]) {
    const [displayed, setDisplayed] = useState('');
    const [wordIndex, setWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        const current = words[wordIndex % words.length];
        const tick = () => {
            if (!isDeleting) {
                const next = current.slice(0, displayed.length + 1);
                setDisplayed(next);

                if (next === current) {
                    timeoutRef.current = setTimeout(() => setIsDeleting(true), 2000);
                } else {
                    timeoutRef.current = setTimeout(tick, 65);
                }
            } else {
                const next = current.slice(0, displayed.length - 1);
                setDisplayed(next);

                if (next === '') {
                    setIsDeleting(false);
                    setWordIndex(i => i + 1);
                    timeoutRef.current = setTimeout(() => {}, 300);
                } else {
                    timeoutRef.current = setTimeout(tick, 35);
                }
            }
        };
        timeoutRef.current = setTimeout(tick, isDeleting ? 35 : 65);

        return () => {
 if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
} 
};
    }, [displayed, isDeleting, wordIndex, words]);

    return displayed;
}

type TimeOfDay = { greeting: string; emoji: string; gradientStyle: string; shimmer: string; clockColor: string; period: 'pagi' | 'siang' | 'sore' | 'malam' };

function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 4 && hour < 11) {
return { greeting: 'Selamat Pagi', emoji: '🌅', gradientStyle: 'linear-gradient(135deg, rgba(255,183,77,0.45) 0%, rgba(255,213,120,0.30) 35%, rgba(100,195,230,0.30) 70%, rgba(56,189,248,0.20) 100%)', shimmer: 'bg-[#FFB74D]/25', clockColor: 'text-[#92400E] dark:text-[#FDE68A]', period: 'pagi' };
}

    if (hour >= 11 && hour < 15) {
return { greeting: 'Selamat Siang', emoji: '☀️', gradientStyle: 'linear-gradient(135deg, rgba(30,136,229,0.35) 0%, rgba(79,195,247,0.28) 45%, rgba(224,247,254,0.25) 100%)', shimmer: 'bg-[#29B6F6]/20', clockColor: 'text-[#075985] dark:text-[#7DD3FC]', period: 'siang' };
}

    if (hour >= 15 && hour < 19) {
return { greeting: 'Selamat Sore', emoji: '🌇', gradientStyle: 'linear-gradient(135deg, rgba(255,111,0,0.45) 0%, rgba(255,160,0,0.35) 35%, rgba(255,213,79,0.25) 65%, rgba(251,140,0,0.15) 100%)', shimmer: 'bg-[#FF6F00]/25', clockColor: 'text-[#9A3412] dark:text-[#FED7AA]', period: 'sore' };
}

    return { greeting: 'Selamat Malam', emoji: '🌙', gradientStyle: 'linear-gradient(135deg, rgba(10,14,50,0.60) 0%, rgba(26,35,126,0.45) 45%, rgba(49,27,146,0.35) 75%, rgba(13,20,80,0.40) 100%)', shimmer: 'bg-[#3949AB]/20', clockColor: 'text-[#1E3A8A] dark:text-[#BAE6FD]', period: 'malam' };
}

function useTimeOfDay() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const tick = () => setNow(new Date());
        const delay = 1000 - new Date().getMilliseconds();
        let interval: ReturnType<typeof setInterval> | undefined;
        const t1 = setTimeout(() => {
            tick();
            interval = setInterval(tick, 1000);
        }, delay);

        return () => {
            clearTimeout(t1);

            if (interval) {
clearInterval(interval);
}
        };
    }, []);
    const hour = now.getHours();
    const tod = useMemo(() => getTimeOfDay(hour), [hour]);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return { ...tod, timeStr, dateStr };
}

function isToday(dateStr: string): boolean {
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

const INSPEKSI_JENIS = [
    { key: 'kantor', label: 'Kantor' },
    { key: 'tambang', label: 'Tambang' },
    { key: 'workshop', label: 'Workshop' },
    { key: 'mess', label: 'Mess' },
] as const;

type TaskItem = { label: string; href: string; count: number };

const actionButtonCls = 'flex min-h-12 items-center gap-2.5 rounded-lg border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-muted';

export default function Dashboard({
    recent_bugar_selamat = [],
    recent_laporan_bahaya = [],
    recent_observasi = [],
    recent_inspeksi = [],
    recent_jsa = [],
    target,
    new_badges = [],
    streak = 0,
    pending_re_inspeksi,
    pending_form_ok = 0,
    pending_jsa_tl = 0,
    my_pending_observasi = 0,
    my_pending_jsa = 0,
    my_pending_inspeksi = null,
    pending_as_pic = 0,
    my_open_with_pic = 0,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const tod = useTimeOfDay();
    const firstName = user.name?.split(' ')[0] ?? user.name;
    const typedGreeting = useTypingText(GREETINGS_BY_TIME[tod.period]);
    const [waitingOpen, setWaitingOpen] = useState(false);

    const bugarHariIni = recent_bugar_selamat.length > 0 && isToday(recent_bugar_selamat[0].tanggal) ? recent_bugar_selamat[0] : null;
    const isSAPUser = user.participation_level === 'staff' || user.participation_level === 'srstaff';

    // Pencapaian baru cukup diumumkan sekali lewat toast, bukan kartu yang menetap.
    const badgeKeys = new_badges.map((b) => b.key).join(',');
    useEffect(() => {
        let dismissed: string[] = [];

        try {
            dismissed = JSON.parse(localStorage.getItem('dismissed_badges') ?? '[]') as string[];
        } catch {
            // Penyimpanan diblokir: tetap tampilkan toast.
        }

        const fresh = new_badges.filter((b) => !dismissed.includes(b.key));

        if (fresh.length === 0) {
            return;
        }

        toast.success(`Pencapaian baru: ${fresh.map((b) => `${b.icon} ${b.nama}`).join(', ')}`);

        try {
            localStorage.setItem('dismissed_badges', JSON.stringify([...dismissed, ...fresh.map((b) => b.key)]));
        } catch {
            // Abaikan.
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [badgeKeys]);

    const actionItems: TaskItem[] = [
        ...(pending_re_inspeksi
            ? INSPEKSI_JENIS.map(({ key, label }) => ({ label: `Approval Inspeksi ${label}`, href: `/sap/inspeksi-${key}`, count: pending_re_inspeksi[key] }))
            : []),
        { label: 'Konfirmasi Form Observasi', href: '/sap/observasi-keselamatan', count: pending_form_ok },
        { label: 'Tanda tangan JSA sebagai TL', href: '/sap/komunikasi-jsa', count: pending_jsa_tl },
        { label: 'Laporan Bahaya — Anda PIC', href: '/laporan-bahaya?tab=pic', count: pending_as_pic },
    ].filter((item) => item.count > 0);

    const waitingItems: TaskItem[] = [
        { label: 'Observasi Anda — menunggu approval', href: '/sap/observasi-keselamatan', count: my_pending_observasi },
        ...(my_pending_inspeksi
            ? INSPEKSI_JENIS.map(({ key, label }) => ({ label: `Inspeksi ${label} Anda — menunggu approval`, href: `/sap/inspeksi-${key}`, count: my_pending_inspeksi[key] }))
            : []),
        { label: 'JSA Anda — menunggu approval', href: '/sap/komunikasi-jsa', count: my_pending_jsa },
        { label: 'Laporan Anda — PIC belum closing', href: '/laporan-bahaya', count: my_open_with_pic },
    ].filter((item) => item.count > 0);

    const totalAction = actionItems.reduce((sum, item) => sum + item.count, 0);
    const totalWaiting = waitingItems.reduce((sum, item) => sum + item.count, 0);

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-5 pb-8">
                {/* ① HERO — compact, tidak diubah */}
                <div className="relative overflow-hidden rounded-2xl border" style={{ background: tod.gradientStyle }}>
                    <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${tod.shimmer} animate-pulse`} />
                    <div className="relative p-4 space-y-2">
                        {/* Baris atas: avatar + sapa + jam */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <Link href="/settings/profile" className="shrink-0">
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name}
                                            className="h-14 w-14 rounded-full object-cover ring-2 ring-white/40 shadow-md"
                                        />
                                    ) : (
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40 shadow-md text-lg font-bold backdrop-blur-sm">
                                            {user.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                                <div className="min-w-0">
                                    <p className="flex items-center gap-1 text-xs text-foreground/60 font-medium min-h-[1.25rem]">
                                        <span>{tod.emoji}</span>
                                        <span>{typedGreeting}</span>
                                        <span className="inline-block w-[2px] h-3 bg-foreground/40 animate-pulse rounded-sm" />
                                    </p>
                                    <h1 className="text-xl font-bold">{firstName}!</h1>
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                                <p className={`font-mono text-3xl font-bold tabular-nums ${tod.clockColor}`}>{tod.timeStr}</p>
                                <p className="text-[11px] text-muted-foreground capitalize">{tod.dateStr}</p>
                            </div>
                        </div>

                        {/* Baris bawah: jabatan + site */}
                        {(user.jabatan || user.site) && (
                            <div className="flex flex-wrap gap-1.5">
                                {user.jabatan && (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%)',
                                            backdropFilter: 'blur(12px) saturate(1.8)',
                                            WebkitBackdropFilter: 'blur(12px) saturate(1.8)',
                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.12)',
                                            border: '1px solid rgba(255,255,255,0.5)',
                                            color: 'rgba(0,0,0,0.65)',
                                        }}>
                                        <BriefcaseBusiness className="h-3 w-3 shrink-0 opacity-70" />
                                        {user.jabatan}
                                    </span>
                                )}
                                {user.site && (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.20) 100%)',
                                            backdropFilter: 'blur(12px) saturate(1.8)',
                                            WebkitBackdropFilter: 'blur(12px) saturate(1.8)',
                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.10)',
                                            border: '1px solid rgba(255,255,255,0.6)',
                                            color: 'rgba(0,0,0,0.70)',
                                        }}>
                                        <MapPin className="h-3 w-3 shrink-0 opacity-70" />
                                        Site {user.site.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {bugarHariIni ? (
                    <BugarDone status={bugarHariIni.status_kelayakan} shift={bugarHariIni.shift} />
                ) : (
                    <section aria-labelledby="bugar-title" className="space-y-3.5 rounded-xl border border-amber-400 bg-card p-4 shadow-xs dark:border-amber-700">
                        <div className="flex items-start gap-3">
                            <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <h2 id="bugar-title" className="text-base font-semibold">
                                    Bugar Selamat belum diisi
                                </h2>
                                <p className="text-sm text-muted-foreground">Wajib sebelum mulai kerja.</p>
                            </div>
                        </div>
                        <Button asChild className="h-11 w-full">
                            <Link href="/bugar-selamat/create">Isi sekarang</Link>
                        </Button>
                    </section>
                )}

                {(actionItems.length > 0 || waitingItems.length > 0) && (
                    <section aria-labelledby="tugas-title" className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 id="tugas-title" className="text-[15px] font-semibold">
                                Perlu tindakan
                            </h2>
                            {totalAction > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-destructive px-1.5 text-xs font-semibold text-white tabular-nums">
                                    {totalAction}
                                </span>
                            )}
                        </div>
                        <div className="divide-y overflow-hidden rounded-xl border bg-card">
                            {actionItems.length === 0 && (
                                <p className="flex min-h-12 items-center gap-3 px-3.5 text-sm text-muted-foreground">
                                    <span aria-hidden className="size-1.5 rounded-full bg-green-500" />
                                    Tidak ada yang menunggu Anda.
                                </p>
                            )}
                            {actionItems.map((item) => (
                                <Link key={item.label} href={item.href} className="flex min-h-[50px] items-center gap-3 px-3.5 transition-colors hover:bg-muted">
                                    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-destructive" />
                                    <span className="flex-1 text-sm">{item.label}</span>
                                    <span className="text-sm font-semibold tabular-nums">{item.count}</span>
                                    <ChevronRight aria-hidden className="size-4 text-muted-foreground/60" />
                                </Link>
                            ))}
                            {waitingItems.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setWaitingOpen((open) => !open)}
                                    aria-expanded={waitingOpen}
                                    className="flex min-h-[46px] w-full items-center gap-3 px-3.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
                                >
                                    <span aria-hidden className="size-1.5 shrink-0 rounded-full border-[1.5px] border-amber-500" />
                                    <span className="flex-1">Menunggu pihak lain ({totalWaiting})</span>
                                    <ChevronDown aria-hidden className={cn('size-4 text-muted-foreground/60 transition-transform', waitingOpen && 'rotate-180')} />
                                </button>
                            )}
                            {waitingOpen &&
                                waitingItems.map((item) => (
                                    <Link key={item.label} href={item.href} className="flex min-h-11 items-center gap-3 pr-3.5 pl-8 text-sm text-foreground/80 transition-colors hover:bg-muted">
                                        <span className="flex-1">{item.label}</span>
                                        <span className="font-semibold tabular-nums">{item.count}</span>
                                    </Link>
                                ))}
                        </div>
                    </section>
                )}

                <section aria-label="Buat laporan" className={cn('grid gap-2', isSAPUser ? 'grid-cols-2' : 'grid-cols-1')}>
                    <ActionLink href="/laporan-bahaya/create" icon={<AlertTriangle className="size-[18px] text-red-600 dark:text-red-400" />} label="Lapor Bahaya" />
                    {isSAPUser && (
                        <>
                            <InspeksiMenu>
                                <button type="button" className={actionButtonCls}>
                                    <ClipboardCheck aria-hidden className="size-[18px] text-teal-600 dark:text-teal-400" />
                                    <span className="flex-1 text-left">Inspeksi</span>
                                    <ChevronDown aria-hidden className="size-3.5 text-muted-foreground/60" />
                                </button>
                            </InspeksiMenu>
                            <ActionLink href="/sap/observasi-keselamatan/create" icon={<Eye className="size-[18px] text-violet-600 dark:text-violet-400" />} label="Observasi" />
                            <ActionLink href="/sap/komunikasi-jsa/create" icon={<BookOpen className="size-[18px] text-amber-600 dark:text-amber-400" />} label="JSA" />
                        </>
                    )}
                </section>

                {target && <TargetCard target={target} streak={streak} />}

                <RecentActivity bugar={recent_bugar_selamat} laporan={recent_laporan_bahaya} observasi={recent_observasi} inspeksi={recent_inspeksi} jsa={recent_jsa} />

                <p className="pt-1 text-center text-xs text-muted-foreground/60">
                    <a href="https://github.com/akrestu" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-muted-foreground">
                        Create with love ❤ by ak.restu
                    </a>
                </p>
            </div>
        </>
    );
}

function ActionLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
    return (
        <Link href={href} className={actionButtonCls}>
            <span aria-hidden>{icon}</span>
            {label}
        </Link>
    );
}

function BugarDone({ status, shift }: { status: RecentBugar['status_kelayakan']; shift: string }) {
    // Status "dilarang" adalah kondisi keselamatan: tetap menonjol, bukan baris tenang.
    if (status === 'dilarang') {
        return (
            <section aria-label="Bugar Selamat hari ini" className="flex items-start gap-3 rounded-xl border border-red-300 bg-card p-4 dark:border-red-800">
                <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                    <p className="text-base font-semibold">Tidak layak bekerja hari ini</p>
                    <p className="text-sm text-muted-foreground">Hasil Bugar Selamat shift {shift}. Segera lapor ke pengawas Anda.</p>
                </div>
                <KelayakanBadge status={status} />
            </section>
        );
    }

    return (
        <section aria-label="Bugar Selamat hari ini" className="flex min-h-12 items-center gap-2.5 rounded-xl border bg-card px-3.5">
            <Check aria-hidden className="size-[18px] text-green-600 dark:text-green-400" />
            <span className="flex-1 text-sm font-medium">
                Bugar Selamat <span className="text-muted-foreground">· Shift {shift}</span>
            </span>
            <KelayakanBadge status={status} />
        </section>
    );
}
