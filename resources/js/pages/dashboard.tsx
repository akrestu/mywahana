import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Eye,
    Flame,
    HardHat,
    Plus,
    ShieldCheck,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KelayakanBadge } from '@/components/status-badge';
import { RiskBadge } from '@/components/risk-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Auth } from '@/types';

type RecentBugarSelamat = {
    id: number;
    tanggal: string;
    shift: string;
    status_kelayakan: 'layak' | 'catatan' | 'dilarang';
};

type RecentLaporanBahaya = {
    id: number;
    tanggal: string;
    lokasi: string;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    status_tindakan: 'pending' | 'selesai';
};

type Stats = {
    bugar_selamat: { total: number; bulan_ini: number; layak: number; catatan: number; dilarang: number };
    laporan_bahaya: { total: number; bulan_ini: number; pending: number; selesai: number };
};

type LeaderboardEntry = {
    id: number;
    name: string;
    jabatan: string | null;
    avatar: string | null;
    bs: number;
    lb: number;
    skor: number;
};

type WeekInfo = { start: string; end: string; count: number; terpenuhi: boolean };
type MetricWeekly = {
    target_per_minggu: number;
    weeks: WeekInfo[];
    minggu_berlalu: number;
    minggu_terpenuhi: number;
    persen: number;
};
type TargetInfo = {
    level: string;
    bugar: { target_per_hari: number; hari_berlalu: number; hari_terpenuhi: number; persen: number };
    laporan: MetricWeekly;
    inspeksi: MetricWeekly | null;
    observasi: MetricWeekly | null;
    jsa: MetricWeekly | null;
};

type NewBadge = { key: string; nama: string; icon: string; earned_at: string };

type Props = {
    auth: Auth;
    stats: Stats;
    recent_bugar_selamat: RecentBugarSelamat[];
    recent_laporan_bahaya: RecentLaporanBahaya[];
    trend: unknown[];
    streak?: number;
    leaderboard?: Record<string, LeaderboardEntry[]>;
    target?: TargetInfo;
    new_badges?: NewBadge[];
    pending_re_inspeksi?: { kantor: number; tambang: number; workshop: number; mess: number };
    pending_form_ok?: number;
};

const defaultStats: Stats = {
    bugar_selamat: { total: 0, bulan_ini: 0, layak: 0, catatan: 0, dilarang: 0 },
    laporan_bahaya: { total: 0, bulan_ini: 0, pending: 0, selesai: 0 },
};

const motivasiList = [
    'Datang sehat — kerja aman — pulang selamat.',
    'Keselamatan bukan pilihan, tapi tanggung jawab kita bersama.',
    'Satu detik kewaspadaan mencegah satu seumur hidup penyesalan.',
    'Tidak ada pekerjaan yang begitu penting hingga tidak ada waktu untuk melakukannya dengan aman.',
    'Keselamatan dimulai dari diri sendiri. Jadilah contoh untuk rekan kerja.',
    'Laporkan bahaya sebelum bahaya melapor ke rumah sakit.',
    'Zero accident bukan kebetulan — itu hasil dari kedisiplinan setiap hari.',
    'Alat pelindung diri bukan hambatan, tapi perisai hidupmu.',
    'Hari ini selamat, besok lebih berhati-hati.',
    'K3 bukan biaya — K3 adalah investasi terbaik.',
    'Ingat keluarga di rumah. Mereka menunggu kamu pulang dengan selamat.',
    'Bahaya yang dilaporkan adalah bahaya yang bisa dicegah.',
];

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
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, [displayed, isDeleting, wordIndex, words]);

    return displayed;
}

type TimeOfDay = { greeting: string; emoji: string; gradientStyle: string; shimmer: string; clockColor: string; period: 'pagi' | 'siang' | 'sore' | 'malam' };

function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 4 && hour < 11)
        return { greeting: 'Selamat Pagi', emoji: '🌅', gradientStyle: 'linear-gradient(135deg, rgba(255,183,77,0.45) 0%, rgba(255,213,120,0.30) 35%, rgba(100,195,230,0.30) 70%, rgba(56,189,248,0.20) 100%)', shimmer: 'bg-[#FFB74D]/25', clockColor: 'text-[#92400E] dark:text-[#FDE68A]', period: 'pagi' };
    if (hour >= 11 && hour < 15)
        return { greeting: 'Selamat Siang', emoji: '☀️', gradientStyle: 'linear-gradient(135deg, rgba(30,136,229,0.35) 0%, rgba(79,195,247,0.28) 45%, rgba(224,247,254,0.25) 100%)', shimmer: 'bg-[#29B6F6]/20', clockColor: 'text-[#075985] dark:text-[#7DD3FC]', period: 'siang' };
    if (hour >= 15 && hour < 19)
        return { greeting: 'Selamat Sore', emoji: '🌇', gradientStyle: 'linear-gradient(135deg, rgba(255,111,0,0.45) 0%, rgba(255,160,0,0.35) 35%, rgba(255,213,79,0.25) 65%, rgba(251,140,0,0.15) 100%)', shimmer: 'bg-[#FF6F00]/25', clockColor: 'text-[#9A3412] dark:text-[#FED7AA]', period: 'sore' };
    return { greeting: 'Selamat Malam', emoji: '🌙', gradientStyle: 'linear-gradient(135deg, rgba(10,14,50,0.60) 0%, rgba(26,35,126,0.45) 45%, rgba(49,27,146,0.35) 75%, rgba(13,20,80,0.40) 100%)', shimmer: 'bg-[#3949AB]/20', clockColor: 'text-[#1E3A8A] dark:text-[#BAE6FD]', period: 'malam' };
}

function useTimeOfDay() {
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => {
        setNow(new Date());
        const tick = () => setNow(new Date());
        const delay = 1000 - new Date().getMilliseconds();
        const t1 = setTimeout(() => {
            tick();
            const interval = setInterval(tick, 1000);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(t1);
    }, []);
    const hour = now?.getHours() ?? 8;
    const tod = useMemo(() => getTimeOfDay(hour), [hour]);
    const timeStr = now?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) ?? '--:--';
    const dateStr = now?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) ?? '';
    return { ...tod, timeStr, dateStr };
}

function isToday(dateStr: string): boolean {
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const kelayakanAlertColors = {
    layak: {
        wrapper: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
        icon: 'text-green-600',
        title: 'text-green-800 dark:text-green-200',
        sub: 'text-green-600 dark:text-green-400',
    },
    catatan: {
        wrapper: 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950',
        icon: 'text-amber-500',
        title: 'text-amber-800 dark:text-amber-200',
        sub: 'text-amber-600 dark:text-amber-400',
    },
    dilarang: {
        wrapper: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950',
        icon: 'text-red-600',
        title: 'text-red-800 dark:text-red-200',
        sub: 'text-red-600 dark:text-red-400',
    },
};

const jenisTindakanColors = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    selesai: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function Dashboard({
    stats = defaultStats,
    recent_bugar_selamat = [],
    recent_laporan_bahaya = [],
    leaderboard = {},
    target,
    new_badges = [],
    streak = 0,
    pending_re_inspeksi,
    pending_form_ok = 0,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const tod = useTimeOfDay();
    const firstName = user.name?.split(' ')[0] ?? user.name;
    const typedGreeting = useTypingText(GREETINGS_BY_TIME[tod.period]);
    const [riwayatTab, setRiwayatTab] = useState<'bugar' | 'laporan'>('bugar');

    const sudahIsiBugarHariIni = recent_bugar_selamat.length > 0 && isToday(recent_bugar_selamat[0].tanggal);
    const pendingCount = stats.laporan_bahaya.pending;
    const isSAPUser = user.participation_level === 'staff' || user.participation_level === 'srstaff';

    const [dismissedKeys, setDismissedKeys] = useState<string[]>([]);
    useEffect(() => {
        try { setDismissedKeys(JSON.parse(localStorage.getItem('dismissed_badges') ?? '[]')); }
        catch { /* ignore */ }
    }, []);
    const visibleBadges = new_badges.filter((b) => !dismissedKeys.includes(b.key));
    const dismissBadges = () => {
        const updated = [...new Set([...dismissedKeys, ...visibleBadges.map((b) => b.key)])];
        localStorage.setItem('dismissed_badges', JSON.stringify(updated));
        setDismissedKeys(updated);
    };

    const [motivasi, setMotivasi] = useState(motivasiList[0]);
    useEffect(() => {
        setMotivasi(motivasiList[Math.floor(Math.random() * motivasiList.length)]);
    }, []);

    const userSite = user.site ?? '';
    const leaderSites = Object.keys(leaderboard);
    const activeLeaderEntries = leaderboard[userSite] ?? leaderboard[leaderSites[0]] ?? [];
    const leaderSiteLabel = leaderboard[userSite] ? userSite : leaderSites[0];

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-3 pb-8">

                {/* ① HERO — compact, tidak diubah */}
                <div className="relative overflow-hidden rounded-2xl border" style={{ background: tod.gradientStyle }}>
                    <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${tod.shimmer} animate-pulse`} />
                    <div className="relative flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Foto Profil */}
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
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {user.jabatan && <Badge variant="secondary" className="text-[11px] px-2 py-0">{user.jabatan}</Badge>}
                                    {user.site && <Badge variant="outline" className="text-[11px] px-2 py-0 capitalize">Site {user.site}</Badge>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                            <p className={`font-mono text-3xl font-bold tabular-nums ${tod.clockColor}`}>{tod.timeStr}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">{tod.dateStr}</p>
                        </div>
                    </div>
                </div>

                {/* ② STREAK + STATS STRIP */}
                <div className="flex gap-2">
                    {streak > 0 && (
                        <div className="flex flex-1 items-center gap-1.5 rounded-xl border bg-orange-50 px-3 py-2 dark:bg-orange-950">
                            <Flame className="h-4 w-4 shrink-0 text-orange-500" />
                            <div>
                                <p className="text-[11px] text-muted-foreground">Streak</p>
                                <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{streak} hari</p>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-1 items-center gap-1.5 rounded-xl border bg-green-50 px-3 py-2 dark:bg-green-950">
                        <ClipboardCheck className="h-4 w-4 shrink-0 text-green-600" />
                        <div>
                            <p className="text-[11px] text-muted-foreground">Bugar</p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-300">{stats.bugar_selamat.bulan_ini}×</p>
                        </div>
                    </div>
                    <div className="flex flex-1 items-center gap-1.5 rounded-xl border bg-red-50 px-3 py-2 dark:bg-red-950">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                        <div>
                            <p className="text-[11px] text-muted-foreground">Laporan</p>
                            <p className="text-sm font-bold text-red-700 dark:text-red-300">{stats.laporan_bahaya.bulan_ini}×</p>
                        </div>
                    </div>
                </div>

                {/* ③ STATUS HARI INI */}
                {sudahIsiBugarHariIni ? (() => {
                    const kelayakan = recent_bugar_selamat[0].status_kelayakan;
                    const colors = kelayakanAlertColors[kelayakan];
                    return (
                        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${colors.wrapper}`}>
                            <ShieldCheck className={`h-7 w-7 shrink-0 ${colors.icon}`} />
                            <div>
                                <p className={`font-semibold ${colors.title}`}>✅ Bugar Selamat sudah diisi</p>
                                <p className={`text-xs mt-0.5 ${colors.sub}`}>
                                    Status hari ini: <KelayakanBadge status={kelayakan} />
                                </p>
                            </div>
                        </div>
                    );
                })() : (
                    <Link href="/bugar-selamat/create" className="block">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 active:scale-[0.99] transition-transform dark:border-amber-700 dark:bg-amber-950">
                            <AlertTriangle className="h-7 w-7 shrink-0 text-amber-500" />
                            <div className="flex-1">
                                <p className="font-semibold text-amber-800 dark:text-amber-200">⚠️ Belum isi Bugar Selamat hari ini</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">Ketuk di sini untuk mengisi sekarang →</p>
                            </div>
                        </div>
                    </Link>
                )}

                {/* ④ BADGE BARU (kondisional) */}
                {visibleBadges.length > 0 && (
                    <div className="relative rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 dark:border-yellow-700 dark:bg-yellow-950">
                        <button
                            onClick={dismissBadges}
                            className="absolute right-2 top-2 rounded-md p-1 text-yellow-600 hover:bg-yellow-200 dark:text-yellow-400 dark:hover:bg-yellow-800 transition-colors"
                            aria-label="Tutup notifikasi badge"
                        >
                            <X size={14} />
                        </button>
                        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-2 pr-6">🎉 Selamat! Pencapaian baru diraih:</p>
                        <div className="flex flex-wrap gap-2">
                            {visibleBadges.map((b) => (
                                <span key={b.key} className="flex items-center gap-1 rounded-full bg-yellow-200 dark:bg-yellow-800 px-3 py-1 text-xs font-semibold text-yellow-900 dark:text-yellow-100">
                                    {b.icon} {b.nama}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ④b REMINDER RE-INSPEKSI */}
                {pending_re_inspeksi && (pending_re_inspeksi.kantor + pending_re_inspeksi.tambang + pending_re_inspeksi.workshop + pending_re_inspeksi.mess) > 0 && (() => {
                    const total = pending_re_inspeksi.kantor + pending_re_inspeksi.tambang + pending_re_inspeksi.workshop + pending_re_inspeksi.mess;
                    const links: { label: string; href: string; count: number }[] = [
                        { label: 'Kantor', href: '/sap/inspeksi-kantor', count: pending_re_inspeksi.kantor },
                        { label: 'Tambang', href: '/sap/inspeksi-tambang', count: pending_re_inspeksi.tambang },
                        { label: 'Workshop', href: '/sap/inspeksi-workshop', count: pending_re_inspeksi.workshop },
                        { label: 'Mess', href: '/sap/inspeksi-mess', count: pending_re_inspeksi.mess },
                    ].filter(l => l.count > 0);
                    return (
                        <div className="rounded-xl border-2 border-blue-400 bg-blue-50 px-4 py-3 dark:border-blue-700 dark:bg-blue-950">
                            <div className="flex items-center gap-3">
                                <ClipboardCheck className="h-7 w-7 shrink-0 text-blue-500" />
                                <p className="font-semibold text-blue-800 dark:text-blue-200">
                                    📋 {total} form inspeksi menunggu approval Anda
                                </p>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 pl-10">
                                {links.map(l => (
                                    <Link key={l.href} href={l.href}>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-200 dark:bg-blue-800 px-3 py-1 text-xs font-semibold text-blue-900 dark:text-blue-100">
                                            {l.label} ({l.count})
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* ④c REMINDER FORM OK */}
                {pending_form_ok > 0 && (
                    <Link href="/sap/observasi-keselamatan" className="block">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-purple-400 bg-purple-50 px-4 py-3 active:scale-[0.99] transition-transform dark:border-purple-700 dark:bg-purple-950">
                            <Eye className="h-7 w-7 shrink-0 text-purple-500" />
                            <div className="flex-1">
                                <p className="font-semibold text-purple-800 dark:text-purple-200">
                                    👁️ {pending_form_ok} Form OK menunggu konfirmasi Anda
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-400">Ketuk untuk melihat dan mengkonfirmasi →</p>
                            </div>
                        </div>
                    </Link>
                )}

                {/* ⑤ TOMBOL AKSI UTAMA */}
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/bugar-selamat/create" className="block">
                            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-green-300 bg-green-50 px-3 py-4 text-center active:scale-95 transition-transform dark:border-green-700 dark:bg-green-950">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-200 dark:bg-green-800">
                                    <ClipboardCheck className="h-6 w-6 text-green-700 dark:text-green-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-green-900 dark:text-green-100">Bugar Selamat</p>
                                    <p className="text-[11px] text-green-600 dark:text-green-400">Checklist layak kerja</p>
                                </div>
                            </div>
                        </Link>
                        <Link href="/laporan-bahaya/create" className="block">
                            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-red-300 bg-red-50 px-3 py-4 text-center active:scale-95 transition-transform dark:border-red-700 dark:bg-red-950">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-200 dark:bg-red-800">
                                    <AlertTriangle className="h-6 w-6 text-red-700 dark:text-red-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-900 dark:text-red-100">Laporan Bahaya</p>
                                    <p className="text-[11px] text-red-600 dark:text-red-400">Laporkan kondisi bahaya</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* SAP shortcuts — staff & srstaff saja */}
                    {isSAPUser && (
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => router.visit('/sap/komunikasi-jsa/create')}
                                className="block w-full"
                            >
                                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-2 py-4 text-center active:scale-95 transition-transform dark:border-amber-700 dark:bg-amber-950">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
                                        <BookOpen className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-100">JSA/SOP</p>
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400">Komunikasi JSA</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => router.visit('/sap/observasi-keselamatan/create')}
                                className="block w-full"
                            >
                                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-violet-300 bg-violet-50 px-2 py-4 text-center active:scale-95 transition-transform dark:border-violet-700 dark:bg-violet-950">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-200 dark:bg-violet-800">
                                        <Eye className="h-5 w-5 text-violet-700 dark:text-violet-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-violet-900 dark:text-violet-100">Observasi</p>
                                        <p className="text-[10px] text-violet-600 dark:text-violet-400">Keselamatan</p>
                                    </div>
                                </div>
                            </button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button type="button" className="w-full">
                                        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-teal-300 bg-teal-50 px-2 py-4 text-center active:scale-95 transition-transform dark:border-teal-700 dark:bg-teal-950">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-200 dark:bg-teal-800">
                                                <HardHat className="h-5 w-5 text-teal-700 dark:text-teal-300" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-teal-900 dark:text-teal-100">Inspeksi ▾</p>
                                                <p className="text-[10px] text-teal-600 dark:text-teal-400">Pilih area</p>
                                            </div>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem onClick={() => router.visit('/sap/inspeksi-kantor/create')}>
                                        🏢 Inspeksi Kantor
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.visit('/sap/inspeksi-tambang/create')}>
                                        ⛏️ Inspeksi Tambang
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.visit('/sap/inspeksi-workshop/create')}>
                                        🔧 Inspeksi Workshop
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.visit('/sap/inspeksi-mess/create')}>
                                        🏠 Inspeksi Mess
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* ⑥ TARGET PARTISIPASI */}
                <div className="flex flex-col gap-3">
                    {target ? (
                        <Card>
                            <div className="px-4 pt-4 pb-2">
                                <p className="text-xs font-bold">Target Partisipasi Bulan Ini</p>
                            </div>
                            <CardContent className="pt-0 space-y-3">
                                {/* Bugar Selamat — hijau */}
                                <TargetMetricRow
                                    label="Bugar Selamat"
                                    value={`${target.bugar.hari_terpenuhi}/${target.bugar.hari_berlalu} hari`}
                                    persen={target.bugar.persen}
                                    barColor="bg-green-500 dark:bg-green-400"
                                    trackColor="bg-green-100 dark:bg-green-900"
                                    textColor="text-green-700 dark:text-green-300"
                                />

                                {/* Laporan Bahaya — merah, bar per minggu */}
                                <WeeklyMetricRow
                                    label="Laporan Bahaya"
                                    metric={target.laporan}
                                    activeColor="bg-red-500 dark:bg-red-400"
                                    inactiveColor="bg-red-100 dark:bg-red-900"
                                    textColor="text-red-700 dark:text-red-300"
                                    dotColor="text-red-600 dark:text-red-300"
                                />

                                {/* Inspeksi — biru */}
                                {target.inspeksi && (
                                    <WeeklyMetricRow
                                        label="Inspeksi"
                                        metric={target.inspeksi}
                                        activeColor="bg-blue-500 dark:bg-blue-400"
                                        inactiveColor="bg-blue-100 dark:bg-blue-900"
                                        textColor="text-blue-700 dark:text-blue-300"
                                        dotColor="text-blue-600 dark:text-blue-300"
                                    />
                                )}

                                {/* Observasi — ungu */}
                                {target.observasi && (
                                    <WeeklyMetricRow
                                        label="Observasi Keselamatan"
                                        metric={target.observasi}
                                        activeColor="bg-violet-500 dark:bg-violet-400"
                                        inactiveColor="bg-violet-100 dark:bg-violet-900"
                                        textColor="text-violet-700 dark:text-violet-300"
                                        dotColor="text-violet-600 dark:text-violet-300"
                                    />
                                )}

                                {/* JSA — amber, per 2 minggu */}
                                {target.jsa && (
                                    <WeeklyMetricRow
                                        label="Komunikasi JSA"
                                        sublabel="1× per 2 minggu"
                                        metric={target.jsa}
                                        activeColor="bg-amber-500 dark:bg-amber-400"
                                        inactiveColor="bg-amber-100 dark:bg-amber-900"
                                        textColor="text-amber-700 dark:text-amber-300"
                                        dotColor="text-amber-600 dark:text-amber-300"
                                        periodLabel="P"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border bg-muted/30 py-4 px-3 text-center">
                            <p className="text-xs text-muted-foreground">Target belum diatur</p>
                        </div>
                    )}
                </div>

                {/* ⑦ PERINGATAN LAPORAN PENDING */}
                {pendingCount > 0 && (
                    <Link href="/laporan-bahaya" className="block">
                        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
                            <Clock className="h-5 w-5 shrink-0 text-red-500" />
                            <p className="flex-1 text-sm font-semibold text-red-800 dark:text-red-200">
                                {pendingCount} laporan bahaya menunggu tindakan
                            </p>
                            <ChevronRight size={14} className="text-red-400" />
                        </div>
                    </Link>
                )}

                {/* ⑧ LEADERBOARD */}
                {activeLeaderEntries.length > 0 && (
                    <Card>
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <p className="text-sm font-bold">🏆 Papan Peringkat</p>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize">{leaderSiteLabel}</span>
                        </div>
                        <CardContent className="pt-0 space-y-1.5">
                            {activeLeaderEntries.slice(0, 3).map((entry, idx) => (
                                <div
                                    key={entry.id}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 ${entry.id === user.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-muted/40'}`}
                                >
                                    <span className="text-lg leading-none w-7 shrink-0 text-center">
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                    </span>
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt={entry.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                                    ) : (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                            {entry.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                    )}
                                    <p className="flex-1 text-sm font-medium truncate">
                                        {entry.name}
                                        {entry.id === user.id && <span className="ml-1 text-[10px] text-primary font-semibold">(kamu)</span>}
                                    </p>
                                    <span className="text-sm font-bold text-primary">{entry.skor} <span className="text-[11px] font-normal text-muted-foreground">poin</span></span>
                                </div>
                            ))}
                            <p className="text-[11px] text-muted-foreground pt-1 text-center">
                                Skor = jumlah Bugar Selamat + (2 × Laporan Bahaya) bulan ini
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* ⑨ RIWAYAT */}
                <Card>
                    <div className="flex items-center gap-1 px-4 pt-4 pb-2">
                        <button
                            onClick={() => setRiwayatTab('bugar')}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${riwayatTab === 'bugar' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}
                        >
                            Bugar Selamat
                        </button>
                        <button
                            onClick={() => setRiwayatTab('laporan')}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${riwayatTab === 'laporan' ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'}`}
                        >
                            Laporan Bahaya
                        </button>
                        <div className="flex-1" />
                        <Link href={riwayatTab === 'bugar' ? '/bugar-selamat' : '/laporan-bahaya'}>
                            <Button variant="ghost" size="sm" className="h-7 gap-0.5 text-xs px-2">
                                Semua <ChevronRight size={12} />
                            </Button>
                        </Link>
                    </div>
                    <CardContent className="pt-0">
                        {riwayatTab === 'bugar' && (
                            recent_bugar_selamat.length > 0 ? (
                                <div className="space-y-1">
                                    {recent_bugar_selamat.slice(0, 3).map((r) => (
                                        <Link key={r.id} href={`/bugar-selamat/${r.id}`}>
                                            <div className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-accent transition-colors">
                                                <div>
                                                    <p className="text-sm font-medium">{fmtDate(r.tanggal)}</p>
                                                    <p className="text-xs text-muted-foreground">Shift {r.shift}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <KelayakanBadge status={r.status_kelayakan} />
                                                    <ChevronRight size={12} className="text-muted-foreground" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Belum ada checklist." href="/bugar-selamat/create" label="Isi Sekarang" />
                            )
                        )}
                        {riwayatTab === 'laporan' && (
                            recent_laporan_bahaya.length > 0 ? (
                                <div className="space-y-1">
                                    {recent_laporan_bahaya.slice(0, 3).map((r) => (
                                        <Link key={r.id} href={`/laporan-bahaya/${r.id}`}>
                                            <div className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-accent transition-colors">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">{fmtDate(r.tanggal)}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{r.lokasi}</p>
                                                </div>
                                                <div className="ml-2 flex items-center gap-1.5 shrink-0">
                                                    <RiskBadge level={r.tingkat_risiko} />
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${jenisTindakanColors[r.status_tindakan]}`}>
                                                        {r.status_tindakan === 'pending' ? 'Pending' : 'Selesai'}
                                                    </span>
                                                    <ChevronRight size={12} className="text-muted-foreground" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Belum ada laporan." href="/laporan-bahaya/create" label="Laporkan Sekarang" />
                            )
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground pt-1 italic">
                    💬 {motivasi}
                </p>

                <p className="text-center text-xs text-muted-foreground/60 pt-1">
                    <a
                        href="https://github.com/akrestu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-muted-foreground transition-colors"
                    >
                        Create with love ❤ by ak.restu
                    </a>
                </p>
            </div>
        </>
    );
}

function TargetMetricRow({
    label,
    value,
    persen,
    barColor,
    trackColor,
    textColor,
}: {
    label: string;
    value: string;
    persen: number;
    barColor: string;
    trackColor: string;
    textColor: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold ${textColor}`}>{value}</span>
                    <span className={`text-[11px] font-bold ${textColor}`}>{persen}%</span>
                </div>
            </div>
            <div className={`h-2 w-full rounded-full overflow-hidden ${trackColor}`}>
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${persen}%` }} />
            </div>
        </div>
    );
}

function WeeklyMetricRow({
    label,
    sublabel,
    metric,
    activeColor,
    inactiveColor,
    textColor,
    dotColor,
    periodLabel = 'M',
}: {
    label: string;
    sublabel?: string;
    metric: { weeks: { count: number; terpenuhi: boolean }[]; minggu_berlalu: number; minggu_terpenuhi: number; persen: number };
    activeColor: string;
    inactiveColor: string;
    textColor: string;
    dotColor: string;
    periodLabel?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                    {sublabel && <span className="ml-1.5 text-[10px] text-muted-foreground/60">{sublabel}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold ${textColor}`}>
                        {metric.minggu_terpenuhi}/{metric.minggu_berlalu} {periodLabel === 'M' ? 'minggu' : 'periode'}
                    </span>
                    <span className={`text-[11px] font-bold ${textColor}`}>{metric.persen}%</span>
                </div>
            </div>
            <div className="flex gap-1">
                {metric.weeks.map((w, i) => (
                    <div
                        key={i}
                        title={`${periodLabel}${i + 1}: ${w.count}`}
                        className={`h-2.5 flex-1 rounded-full transition-all ${w.terpenuhi ? activeColor : inactiveColor}`}
                    />
                ))}
            </div>
            <div className="flex gap-x-1">
                {metric.weeks.map((w, i) => (
                    <span key={i} className={`text-[10px] flex-1 text-center ${w.terpenuhi ? `${dotColor} font-semibold` : 'text-muted-foreground'}`}>
                        {periodLabel}{i + 1}: {w.count}
                    </span>
                ))}
            </div>
        </div>
    );
}

function EmptyState({ message, href, label }: { message: string; href: string; label: string }) {
    return (
        <div className="rounded-xl border border-dashed py-5 text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Link href={href}>
                <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                    <Plus size={13} /> {label}
                </Button>
            </Link>
        </div>
    );
}
