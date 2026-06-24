import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    BriefcaseBusiness,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Eye,
    Flame,
    HardHat,
    MapPin,
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

type RecentObservasi = {
    id: number;
    tanggal: string;
    jenis_pekerjaan: string;
    lokasi_kerja: string;
    status: string;
};

type RecentInspeksi = {
    id: number;
    tanggal: string;
    status: string;
    risk_level: string | null;
    jenis: 'Kantor' | 'Tambang' | 'Workshop' | 'Mess';
};

type RecentJsa = {
    id: number;
    tanggal: string;
    lokasi: string;
    judul_dokumen: string;
    status: string;
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
    skor: number;
};

type SiteLeaderboard = {
    bugar_selamat: LeaderboardEntry[];
    laporan_bahaya: LeaderboardEntry[];
    observasi_keselamatan: LeaderboardEntry[];
    komunikasi_jsa: LeaderboardEntry[];
    inspeksi: LeaderboardEntry[];
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
    recent_observasi?: RecentObservasi[];
    recent_inspeksi?: RecentInspeksi[];
    recent_jsa?: RecentJsa[];
    trend: unknown[];
    streak?: number;
    leaderboard?: Record<string, SiteLeaderboard>;
    target?: TargetInfo;
    new_badges?: NewBadge[];
    pending_re_inspeksi?: { kantor: number; tambang: number; workshop: number; mess: number };
    pending_form_ok?: number;
    pending_jsa_tl?: number;
    my_pending_observasi?: number;
    my_pending_jsa?: number;
    my_pending_inspeksi?: number;
    pending_as_pic?: number;
    my_open_with_pic?: number;
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
    recent_observasi = [],
    recent_inspeksi = [],
    recent_jsa = [],
    leaderboard = {},
    target,
    new_badges = [],
    streak = 0,
    pending_re_inspeksi,
    pending_form_ok = 0,
    pending_jsa_tl = 0,
    my_pending_observasi = 0,
    my_pending_jsa = 0,
    my_pending_inspeksi = 0,
    pending_as_pic = 0,
    my_open_with_pic = 0,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const tod = useTimeOfDay();
    const firstName = user.name?.split(' ')[0] ?? user.name;
    const typedGreeting = useTypingText(GREETINGS_BY_TIME[tod.period]);
    const [riwayatTab, setRiwayatTab] = useState<'bugar' | 'laporan' | 'observasi' | 'inspeksi' | 'jsa'>('bugar');

    const sudahIsiBugarHariIni = recent_bugar_selamat.length > 0 && isToday(recent_bugar_selamat[0].tanggal);
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
    const activeSiteLeader: SiteLeaderboard | undefined = leaderboard[userSite] ?? leaderboard[leaderSites[0]];
    const leaderSiteLabel = leaderboard[userSite] ? userSite : leaderSites[0];

    const LEADER_TABS = [
        { key: 'bugar_selamat' as const,         label: 'Bugar Selamat',  unit: 'kali' },
        { key: 'laporan_bahaya' as const,         label: 'Lap. Bahaya',   unit: 'poin' },
        { key: 'observasi_keselamatan' as const,  label: 'Observasi',     unit: 'lap.' },
        { key: 'komunikasi_jsa' as const,         label: 'JSA',           unit: 'lap.' },
        { key: 'inspeksi' as const,               label: 'Inspeksi',      unit: 'lap.' },
    ] as const;
    const [leaderTab, setLeaderTab] = useState<keyof SiteLeaderboard>('bugar_selamat');
    const activeLeaderEntries = activeSiteLeader?.[leaderTab] ?? [];
    const hasAnyLeader = activeSiteLeader && LEADER_TABS.some(t => (activeSiteLeader[t.key]?.length ?? 0) > 0);

    const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-3 pb-8">

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

                {/* ④d REMINDER JSA — sebagai Team Leader */}
                {pending_jsa_tl > 0 && (
                    <Link href="/komunikasi-jsa?filter=pending" className="block">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-indigo-400 bg-indigo-50 px-4 py-3 active:scale-[0.99] transition-transform dark:border-indigo-700 dark:bg-indigo-950">
                            <BookOpen className="h-7 w-7 shrink-0 text-indigo-500" />
                            <div className="flex-1">
                                <p className="font-semibold text-indigo-800 dark:text-indigo-200">
                                    📋 {pending_jsa_tl} JSA menunggu tanda tangan Anda sebagai TL
                                </p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400">Ketuk untuk melihat dan menandatangani →</p>
                            </div>
                        </div>
                    </Link>
                )}

                {/* ④e REMINDER — form sendiri yang belum disetujui */}
                {(my_pending_observasi + my_pending_jsa + my_pending_inspeksi) > 0 && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950">
                        <p className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                            ⏳ Form Anda yang masih menunggu approval
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {my_pending_observasi > 0 && (
                                <Link href="/observasi-keselamatan?filter=pending">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 dark:bg-amber-800 px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-100">
                                        Form OK ({my_pending_observasi})
                                    </span>
                                </Link>
                            )}
                            {my_pending_inspeksi > 0 && (
                                <Link href="/inspeksi?filter=pending">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 dark:bg-amber-800 px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-100">
                                        Inspeksi ({my_pending_inspeksi})
                                    </span>
                                </Link>
                            )}
                            {my_pending_jsa > 0 && (
                                <Link href="/komunikasi-jsa?filter=pending">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 dark:bg-amber-800 px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-100">
                                        JSA ({my_pending_jsa})
                                    </span>
                                </Link>
                            )}
                        </div>
                    </div>
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
                        </div>
                    )}
                </div>

                {/* ⑥ TARGET PARTISIPASI */}
                {target ? (
                    <Card>
                        <div className="flex items-center justify-between px-4 pt-3 pb-1">
                            <p className="text-sm font-bold">📊 Target Bulan Ini</p>
                            <span className="text-[11px] text-muted-foreground">✅ tercapai · ⚠️ lumayan · ❗ kurang</span>
                        </div>
                        <CardContent className="px-4 pt-0 pb-3">
                            <TargetMetricRow
                                label="Bugar Selamat"
                                icon={<ClipboardCheck className="h-4 w-4" />}
                                iconColor="text-green-600 dark:text-green-400"
                                persen={target.bugar.persen}
                                hariTerpenuhi={target.bugar.hari_terpenuhi}
                                hariBerlalu={target.bugar.hari_berlalu}
                                accentColor="bg-green-500"
                                barColor="bg-green-500 dark:bg-green-400"
                                trackColor="bg-green-100 dark:bg-green-900"
                                textColor="text-green-700 dark:text-green-300"
                            />
                            <WeeklyMetricRow
                                label="Laporan Bahaya"
                                icon={<AlertTriangle className="h-4 w-4" />}
                                iconColor="text-red-500 dark:text-red-400"
                                metric={target.laporan}
                                accentColor="bg-red-500"
                                activeColor="bg-red-500 dark:bg-red-400"
                                inactiveColor="bg-red-100 dark:bg-red-900"
                                textColor="text-red-700 dark:text-red-300"
                            />
                            {target.inspeksi && (
                                <WeeklyMetricRow
                                    label="Inspeksi"
                                    icon={<HardHat className="h-4 w-4" />}
                                    iconColor="text-blue-600 dark:text-blue-400"
                                    metric={target.inspeksi}
                                    accentColor="bg-blue-500"
                                    activeColor="bg-blue-500 dark:bg-blue-400"
                                    inactiveColor="bg-blue-100 dark:bg-blue-900"
                                    textColor="text-blue-700 dark:text-blue-300"
                                />
                            )}
                            {target.observasi && (
                                <WeeklyMetricRow
                                    label="Observasi"
                                    icon={<Eye className="h-4 w-4" />}
                                    iconColor="text-violet-600 dark:text-violet-400"
                                    metric={target.observasi}
                                    accentColor="bg-violet-500"
                                    activeColor="bg-violet-500 dark:bg-violet-400"
                                    inactiveColor="bg-violet-100 dark:bg-violet-900"
                                    textColor="text-violet-700 dark:text-violet-300"
                                />
                            )}
                            {target.jsa && (
                                <WeeklyMetricRow
                                    label="JSA"
                                    icon={<BookOpen className="h-4 w-4" />}
                                    iconColor="text-amber-600 dark:text-amber-400"
                                    metric={target.jsa}
                                    accentColor="bg-amber-500"
                                    activeColor="bg-amber-500 dark:bg-amber-400"
                                    inactiveColor="bg-amber-100 dark:bg-amber-900"
                                    textColor="text-amber-700 dark:text-amber-300"
                                    periodLabel="P"
                                />
                            )}
                        </CardContent>
                    </Card>
                ) : null}

                {/* ⑦ REMINDER LAPORAN BAHAYA */}
                {pending_as_pic > 0 && (
                    <Link href="/laporan-bahaya?filter=pic" className="block">
                        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-950">
                            <BriefcaseBusiness className="h-5 w-5 shrink-0 text-orange-500" />
                            <p className="flex-1 text-sm font-semibold text-orange-800 dark:text-orange-200">
                                Anda ditugaskan sebagai PIC untuk{' '}
                                <span className="underline underline-offset-2">{pending_as_pic} laporan bahaya</span>{' '}
                                yang belum ditutup
                            </p>
                            <ChevronRight size={14} className="text-orange-400" />
                        </div>
                    </Link>
                )}
                {my_open_with_pic > 0 && (
                    <Link href="/laporan-bahaya" className="block">
                        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
                            <Clock className="h-5 w-5 shrink-0 text-red-500" />
                            <p className="flex-1 text-sm font-semibold text-red-800 dark:text-red-200">
                                <span className="underline underline-offset-2">{my_open_with_pic} laporan bahaya Anda</span>{' '}
                                sudah ada PIC namun belum ditutup — ingatkan PIC untuk closing
                            </p>
                            <ChevronRight size={14} className="text-red-400" />
                        </div>
                    </Link>
                )}

                {/* ⑧ LEADERBOARD */}
                {hasAnyLeader && (
                    <Card>
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <p className="text-sm font-bold">🏆 Papan Peringkat</p>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize">{leaderSiteLabel}</span>
                        </div>
                        {/* Tab navigasi kategori */}
                        <div className="flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
                            {LEADER_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setLeaderTab(tab.key)}
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${leaderTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <CardContent className="pt-0 space-y-1.5">
                            {activeLeaderEntries.length === 0 ? (
                                <p className="text-center text-xs text-muted-foreground py-3">Belum ada data bulan ini</p>
                            ) : (
                                activeLeaderEntries.map((entry, idx) => (
                                    <div
                                        key={entry.id}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2 ${entry.id === user.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-muted/40'}`}
                                    >
                                        <span className="text-lg leading-none w-7 shrink-0 text-center">{MEDALS[idx]}</span>
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
                                        <span className="text-sm font-bold text-primary">
                                            {entry.skor}{' '}
                                            <span className="text-[11px] font-normal text-muted-foreground">
                                                {LEADER_TABS.find(t => t.key === leaderTab)?.unit}
                                            </span>
                                        </span>
                                    </div>
                                ))
                            )}
                            {leaderTab === 'laporan_bahaya' && (
                                <p className="text-[11px] text-muted-foreground pt-1 text-center">
                                    AA=4 · A=3 · B=2 · C=1 poin
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ⑨ RIWAYAT */}
                <Card>
                    <div className="flex items-center gap-1 overflow-x-auto px-4 pt-4 pb-2 scrollbar-none">
                        <button
                            onClick={() => setRiwayatTab('bugar')}
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${riwayatTab === 'bugar' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}
                        >
                            Bugar Selamat
                        </button>
                        <button
                            onClick={() => setRiwayatTab('laporan')}
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${riwayatTab === 'laporan' ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'}`}
                        >
                            Lap. Bahaya
                        </button>
                        {isSAPUser && (
                            <>
                                <button
                                    onClick={() => setRiwayatTab('observasi')}
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${riwayatTab === 'observasi' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}
                                >
                                    Observasi
                                </button>
                                <button
                                    onClick={() => setRiwayatTab('inspeksi')}
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${riwayatTab === 'inspeksi' ? 'bg-orange-600 text-white' : 'bg-muted text-muted-foreground'}`}
                                >
                                    Inspeksi
                                </button>
                                <button
                                    onClick={() => setRiwayatTab('jsa')}
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${riwayatTab === 'jsa' ? 'bg-purple-600 text-white' : 'bg-muted text-muted-foreground'}`}
                                >
                                    JSA
                                </button>
                            </>
                        )}
                        <div className="flex-1 shrink-0" />
                        <Link href={
                            riwayatTab === 'bugar' ? '/bugar-selamat' :
                            riwayatTab === 'laporan' ? '/laporan-bahaya' :
                            riwayatTab === 'observasi' ? '/observasi-keselamatan' :
                            riwayatTab === 'inspeksi' ? '/inspeksi' :
                            '/komunikasi-jsa'
                        }>
                            <Button variant="ghost" size="sm" className="h-7 gap-0.5 text-xs px-2 shrink-0">
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
                        {riwayatTab === 'observasi' && (
                            recent_observasi.length > 0 ? (
                                <div className="space-y-1">
                                    {recent_observasi.slice(0, 3).map((r) => (
                                        <Link key={r.id} href={`/observasi-keselamatan/${r.id}`}>
                                            <div className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-accent transition-colors">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">{fmtDate(r.tanggal)}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{r.lokasi_kerja}</p>
                                                </div>
                                                <div className="ml-2 flex items-center gap-1.5 shrink-0">
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">{r.status.replace('_', ' ')}</span>
                                                    <ChevronRight size={12} className="text-muted-foreground" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Belum ada observasi." href="/observasi-keselamatan/create" label="Buat Sekarang" />
                            )
                        )}
                        {riwayatTab === 'inspeksi' && (
                            recent_inspeksi.length > 0 ? (
                                <div className="space-y-1">
                                    {recent_inspeksi.slice(0, 3).map((r) => (
                                        <div key={`${r.jenis}-${r.id}`} className="flex items-center justify-between rounded-xl px-3 py-2 bg-muted/30">
                                            <div>
                                                <p className="text-sm font-medium">{fmtDate(r.tanggal)}</p>
                                                <p className="text-xs text-muted-foreground">Inspeksi {r.jenis}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {r.risk_level && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">{r.risk_level}</span>
                                                )}
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">{r.status.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Belum ada inspeksi." href="/inspeksi" label="Lihat Inspeksi" />
                            )
                        )}
                        {riwayatTab === 'jsa' && (
                            recent_jsa.length > 0 ? (
                                <div className="space-y-1">
                                    {recent_jsa.slice(0, 3).map((r) => (
                                        <Link key={r.id} href={`/komunikasi-jsa/${r.id}`}>
                                            <div className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-accent transition-colors">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">{fmtDate(r.tanggal)}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{r.judul_dokumen}</p>
                                                </div>
                                                <div className="ml-2 flex items-center gap-1.5 shrink-0">
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">{r.status.replace(/_/g, ' ')}</span>
                                                    <ChevronRight size={12} className="text-muted-foreground" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Belum ada JSA." href="/komunikasi-jsa/create" label="Buat Sekarang" />
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
    icon,
    persen,
    hariTerpenuhi,
    hariBerlalu,
    accentColor,
    barColor,
    trackColor,
    textColor,
    iconColor,
}: {
    label: string;
    icon: React.ReactNode;
    persen: number;
    hariTerpenuhi: number;
    hariBerlalu: number;
    accentColor: string;
    barColor: string;
    trackColor: string;
    textColor: string;
    iconColor: string;
}) {
    const statusEmoji = persen >= 80 ? '✅' : persen >= 50 ? '⚠️' : '❗';
    return (
        <div className="flex items-center gap-2.5 py-2.5 border-b last:border-0">
            <div className={`w-1 self-stretch rounded-full shrink-0 ${accentColor}`} />
            <span className={`shrink-0 ${iconColor}`}>{icon}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate">{label}</span>
                    <span className={`text-xs font-bold ml-2 shrink-0 ${textColor}`}>{persen}% {statusEmoji}</span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden ${trackColor}`}>
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${persen}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{hariTerpenuhi} dari {hariBerlalu} hari</p>
            </div>
        </div>
    );
}

function WeeklyMetricRow({
    label,
    icon,
    metric,
    accentColor,
    activeColor,
    inactiveColor,
    textColor,
    iconColor,
    periodLabel = 'M',
}: {
    label: string;
    icon: React.ReactNode;
    metric: { weeks: { count: number; terpenuhi: boolean }[]; minggu_berlalu: number; minggu_terpenuhi: number; persen: number; target_per_minggu: number };
    accentColor: string;
    activeColor: string;
    inactiveColor: string;
    textColor: string;
    iconColor: string;
    periodLabel?: string;
}) {
    const isPeriod = periodLabel !== 'M';
    const unitLabel = isPeriod ? 'periode' : 'mgg';
    const statusEmoji = metric.persen >= 80 ? '✅' : metric.persen >= 50 ? '⚠️' : '❗';

    return (
        <div className="flex items-center gap-2.5 py-2.5 border-b last:border-0">
            <div className={`w-1 self-stretch rounded-full shrink-0 ${accentColor}`} />
            <span className={`shrink-0 ${iconColor}`}>{icon}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold truncate">{label}</span>
                    <span className={`text-xs font-bold ml-2 shrink-0 ${textColor}`}>{metric.persen}% {statusEmoji}</span>
                </div>
                <div className="flex gap-1">
                    {metric.weeks.map((w, i) => (
                        <div
                            key={i}
                            title={`${isPeriod ? 'P' : 'Mg'}${i + 1}: ${w.count}×`}
                            className={`h-5 flex-1 rounded transition-all ${
                                i >= metric.minggu_berlalu
                                    ? 'bg-muted/50'
                                    : w.terpenuhi ? activeColor : inactiveColor
                            }`}
                        />
                    ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    {metric.minggu_terpenuhi}/{metric.minggu_berlalu} {unitLabel} · target {metric.target_per_minggu}× per {unitLabel}
                </p>
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
