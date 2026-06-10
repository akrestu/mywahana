import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Plus,
    ShieldCheck,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { KelayakanBadge } from '@/components/status-badge';
import { RiskBadge } from '@/components/risk-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
type TargetInfo = {
    level: string;
    laporan_per_minggu: number;
    minggu_berlalu: number;
    minggu_terpenuhi: number;
    persen: number;
    weeks: WeekInfo[];
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
};

const defaultStats: Stats = {
    bugar_selamat: { total: 0, bulan_ini: 0, layak: 0, catatan: 0, dilarang: 0 },
    laporan_bahaya: { total: 0, bulan_ini: 0, pending: 0, selesai: 0 },
};

type TimeOfDay = { greeting: string; emoji: string; gradientStyle: string; shimmer: string; clockColor: string };

function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 4 && hour < 6)
        return { greeting: 'Selamat Subuh', emoji: '🌄', gradientStyle: 'linear-gradient(135deg, rgba(26,14,60,0.55) 0%, rgba(90,40,120,0.40) 35%, rgba(220,90,40,0.35) 70%, rgba(255,160,60,0.25) 100%)', shimmer: 'bg-[#E85D04]/20', clockColor: 'text-[#C2410C] dark:text-[#FED7AA]' };
    if (hour >= 6 && hour < 11)
        return { greeting: 'Selamat Pagi', emoji: '🌅', gradientStyle: 'linear-gradient(135deg, rgba(255,183,77,0.45) 0%, rgba(255,213,120,0.30) 35%, rgba(100,195,230,0.30) 70%, rgba(56,189,248,0.20) 100%)', shimmer: 'bg-[#FFB74D]/25', clockColor: 'text-[#92400E] dark:text-[#FDE68A]' };
    if (hour >= 11 && hour < 15)
        return { greeting: 'Selamat Siang', emoji: '☀️', gradientStyle: 'linear-gradient(135deg, rgba(30,136,229,0.35) 0%, rgba(79,195,247,0.28) 45%, rgba(224,247,254,0.25) 100%)', shimmer: 'bg-[#29B6F6]/20', clockColor: 'text-[#075985] dark:text-[#7DD3FC]' };
    if (hour >= 15 && hour < 18)
        return { greeting: 'Selamat Sore', emoji: '🌇', gradientStyle: 'linear-gradient(135deg, rgba(255,111,0,0.45) 0%, rgba(255,160,0,0.35) 35%, rgba(255,213,79,0.25) 65%, rgba(251,140,0,0.15) 100%)', shimmer: 'bg-[#FF6F00]/25', clockColor: 'text-[#9A3412] dark:text-[#FED7AA]' };
    if (hour >= 18 && hour < 20)
        return { greeting: 'Selamat Senja', emoji: '🌆', gradientStyle: 'linear-gradient(135deg, rgba(211,47,47,0.45) 0%, rgba(194,24,91,0.35) 35%, rgba(123,31,162,0.35) 65%, rgba(49,27,146,0.25) 100%)', shimmer: 'bg-[#C2185B]/20', clockColor: 'text-[#881337] dark:text-[#FECDD3]' };
    return { greeting: 'Selamat Malam', emoji: '🌙', gradientStyle: 'linear-gradient(135deg, rgba(10,14,50,0.60) 0%, rgba(26,35,126,0.45) 45%, rgba(49,27,146,0.35) 75%, rgba(13,20,80,0.40) 100%)', shimmer: 'bg-[#3949AB]/20', clockColor: 'text-[#1E3A8A] dark:text-[#BAE6FD]' };
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

export default function Dashboard({
    stats = defaultStats,
    recent_bugar_selamat = [],
    recent_laporan_bahaya = [],
    streak = 0,
    leaderboard = {},
    target,
    new_badges = [],
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const tod = useTimeOfDay();
    const firstName = user.name?.split(' ')[0] ?? user.name;
    const [riwayatTab, setRiwayatTab] = useState<'bugar' | 'laporan'>('bugar');

    const sudahIsiBugarHariIni = recent_bugar_selamat.length > 0 && isToday(recent_bugar_selamat[0].tanggal);
    const pendingCount = stats.laporan_bahaya.pending;

    const [dismissedKeys, setDismissedKeys] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('dismissed_badges') ?? '[]'); }
        catch { return []; }
    });
    const visibleBadges = new_badges.filter((b) => !dismissedKeys.includes(b.key));
    const dismissBadges = () => {
        const updated = [...new Set([...dismissedKeys, ...visibleBadges.map((b) => b.key)])];
        localStorage.setItem('dismissed_badges', JSON.stringify(updated));
        setDismissedKeys(updated);
    };

    // Leaderboard: tampilkan site user sendiri, atau site pertama yang ada
    const userSite = user.site ?? '';
    const leaderSites = Object.keys(leaderboard);
    const activeLeaderEntries = leaderboard[userSite] ?? leaderboard[leaderSites[0]] ?? [];
    const leaderSiteLabel = leaderboard[userSite] ? userSite : leaderSites[0];

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-3 pb-8">

                {/* ① HERO — compact */}
                <div className="relative overflow-hidden rounded-2xl border" style={{ background: tod.gradientStyle }}>
                    <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${tod.shimmer} animate-pulse`} />
                    <div className="relative flex items-center justify-between p-4">
                        <div>
                            <p className="flex items-center gap-1.5 text-xs text-foreground/60">
                                <span>{tod.emoji}</span>{tod.greeting}
                            </p>
                            <h1 className="text-xl font-bold">{firstName}!</h1>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {user.jabatan && <Badge variant="secondary" className="text-[11px] px-2 py-0">{user.jabatan}</Badge>}
                                {user.site && <Badge variant="outline" className="text-[11px] px-2 py-0 capitalize">Site {user.site}</Badge>}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-mono text-3xl font-bold tabular-nums ${tod.clockColor}`}>{tod.timeStr}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">{tod.dateStr}</p>
                        </div>
                    </div>
                </div>

                {/* ② STATUS HARI INI — paling penting */}
                {sudahIsiBugarHariIni ? (
                    <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
                        <ShieldCheck className="h-7 w-7 shrink-0 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">✅ Bugar Selamat sudah diisi</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                Status hari ini: <KelayakanBadge status={recent_bugar_selamat[0].status_kelayakan} />
                            </p>
                        </div>
                    </div>
                ) : (
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

                {/* ③ BADGE BARU (kondisional) */}
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

                {/* ④ TOMBOL AKSI UTAMA */}
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

                {/* ⑤ STREAK + TARGET — motivasi partisipasi */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center justify-center rounded-2xl border bg-orange-50 dark:bg-orange-950 py-4 px-3 text-center">
                        <span className="text-3xl leading-none">🔥</span>
                        <p className="mt-1 text-3xl font-bold text-orange-600 dark:text-orange-400">{streak}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">hari berturut-turut</p>
                        <p className="text-[11px] font-semibold text-orange-700 dark:text-orange-300">Bugar Selamat</p>
                    </div>

                    {target ? (
                        <div className="flex flex-col justify-center rounded-2xl border bg-blue-50 dark:bg-blue-950 py-4 px-3 gap-2">
                            <div>
                                <p className="text-xs font-bold text-blue-800 dark:text-blue-200">Target Laporan</p>
                                <p className="text-[11px] text-muted-foreground">{target.laporan_per_minggu}× laporan/minggu</p>
                            </div>
                            {/* Indikator per-minggu */}
                            <div className="flex gap-1">
                                {target.weeks.map((w, i) => (
                                    <div
                                        key={i}
                                        title={`Minggu ${i + 1}: ${w.count} laporan`}
                                        className={`h-2.5 flex-1 rounded-full transition-all ${
                                            w.terpenuhi
                                                ? 'bg-blue-500 dark:bg-blue-400'
                                                : 'bg-blue-200 dark:bg-blue-800'
                                        }`}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                                {target.weeks.map((w, i) => (
                                    <span key={i} className={`text-[10px] flex-1 text-center ${w.terpenuhi ? 'text-blue-600 dark:text-blue-300 font-semibold' : 'text-muted-foreground'}`}>
                                        M{i + 1}: {w.count}✓
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{target.minggu_terpenuhi}</span>
                                {' '}dari{' '}
                                <span className="font-semibold text-foreground">{target.minggu_berlalu} minggu</span>
                                {' '}bulan ini terpenuhi
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border bg-muted/30 py-4 px-3 text-center">
                            <p className="text-xs text-muted-foreground">Target belum diatur</p>
                        </div>
                    )}
                </div>

                {/* ⑥ PERINGATAN LAPORAN PENDING */}
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

                {/* ⑦ LEADERBOARD — ringkas, site user sendiri, top 3 */}
                {activeLeaderEntries.length > 0 && (
                    <Card>
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <p className="text-sm font-bold">🏆 Papan Peringkat</p>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize">{leaderSiteLabel}</span>
                        </div>
                        <CardContent className="pt-0 space-y-1.5">
                            {activeLeaderEntries.slice(0, 3).map((entry, idx) => (
                                <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
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
                                    <p className="flex-1 text-sm font-medium truncate">{entry.name}</p>
                                    <span className="text-sm font-bold text-primary">{entry.skor} <span className="text-[11px] font-normal text-muted-foreground">poin</span></span>
                                </div>
                            ))}
                            <p className="text-[11px] text-muted-foreground pt-1 text-center">
                                Skor = jumlah Bugar Selamat + (2 × Laporan Bahaya) bulan ini
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* ⑧ RIWAYAT — 2 tab dalam 1 card, max 3 entri */}
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
                                                <div className="ml-2 flex items-center gap-1">
                                                    <RiskBadge level={r.tingkat_risiko} />
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

                <p className="text-center text-xs text-muted-foreground pt-1">
                    Datang sehat — kerja aman — pulang selamat
                </p>
            </div>
        </>
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
