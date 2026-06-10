import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    Settings,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Stats = {
    bugar_selamat: { total: number; bulan_ini: number; layak: number; catatan: number; dilarang: number };
    laporan_bahaya: { total: number; bulan_ini: number; AA: number; A: number; B: number; C: number; pending: number; selesai: number };
    users: { total: number; baratama: number; bandhawa: number };
};

type SiteItem = { site: string; bugar: number; laporan: number };

type LeaderboardEntry = { id: number; name: string; jabatan: string | null; bs: number; lb: number; skor: number };

type Props = {
    stats: Stats;
    trend: unknown[];
    site_breakdown: SiteItem[];
    leaderboard?: Record<string, LeaderboardEntry[]>;
    participation_targets?: { level: string; laporan_per_minggu: number }[];
};

type TimeOfDay = { greeting: string; emoji: string; gradient: string; shimmer: string; clockColor: string };

function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 12)
        return { greeting: 'Selamat Pagi', emoji: '🌅', gradient: 'from-green-400/30 via-emerald-300/20 to-teal-500/10', shimmer: 'bg-green-400/10', clockColor: 'text-emerald-700 dark:text-emerald-300' };
    if (hour >= 12 && hour < 15)
        return { greeting: 'Selamat Siang', emoji: '☀️', gradient: 'from-yellow-400/30 via-amber-300/20 to-orange-400/10', shimmer: 'bg-yellow-400/10', clockColor: 'text-amber-700 dark:text-amber-300' };
    if (hour >= 15 && hour < 19)
        return { greeting: 'Selamat Sore', emoji: '🌇', gradient: 'from-orange-400/30 via-rose-400/20 to-pink-500/10', shimmer: 'bg-orange-400/10', clockColor: 'text-orange-700 dark:text-orange-300' };
    return { greeting: 'Selamat Malam', emoji: '🌙', gradient: 'from-blue-600/30 via-indigo-500/20 to-violet-600/10', shimmer: 'bg-indigo-400/10', clockColor: 'text-indigo-300 dark:text-indigo-200' };
}

function useTimeOfDay() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const tick = () => setNow(new Date());
        const delay = 1000 - new Date().getMilliseconds();
        const t1 = setTimeout(() => { tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv); }, delay);
        return () => clearTimeout(t1);
    }, []);
    const tod = useMemo(() => getTimeOfDay(now.getHours()), [now.getHours()]);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return { ...tod, timeStr, dateStr };
}

const RISK_COLORS: Record<string, string> = { AA: '#ef4444', A: '#f97316', B: '#eab308', C: '#22c55e' };
const RISK_LABELS: Record<string, string> = { AA: 'Sangat Tinggi', A: 'Tinggi', B: 'Sedang', C: 'Rendah' };
const LEVEL_LABELS: Record<string, string> = { nonstaff: 'Non-Staff', staff: 'Staff', srstaff: 'Sr. Staff' };

export default function AdminIndex({ stats, site_breakdown = [], leaderboard = {}, participation_targets = [] }: Props) {
    const tod = useTimeOfDay();
    const [activeLeaderSite, setActiveLeaderSite] = useState<string>('baratama');
    const [kelayakanTab, setKelayakanTab] = useState<'bugar' | 'risiko'>('bugar');
    const leaderSites = Object.keys(leaderboard);
    const totalBugar = stats.bugar_selamat.total;
    const totalLaporan = stats.laporan_bahaya.total;

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="space-y-3 pb-8">

                {/* ① ALERT DARURAT — paling atas jika ada */}
                {stats.laporan_bahaya.pending > 0 && (
                    <Link href="/admin/laporan-bahaya" className="block">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 dark:border-red-700 dark:bg-red-950">
                            <Clock className="h-6 w-6 shrink-0 text-red-500" />
                            <div className="flex-1">
                                <p className="font-semibold text-red-800 dark:text-red-200">
                                    ⚠️ {stats.laporan_bahaya.pending} laporan bahaya belum ditindaklanjuti
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400">Ketuk untuk melihat dan menangani</p>
                            </div>
                            <ChevronRight size={16} className="text-red-400" />
                        </div>
                    </Link>
                )}

                {/* ② HEADER — compact */}
                <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${tod.gradient}`}>
                    <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${tod.shimmer} animate-pulse`} />
                    <div className="relative flex items-center justify-between p-4">
                        <div>
                            <p className="flex items-center gap-1.5 text-xs text-foreground/60"><span>{tod.emoji}</span>{tod.greeting}</p>
                            <h1 className="text-xl font-bold">Admin Dashboard</h1>
                            <p className="text-xs text-muted-foreground">Monitoring HSE semua site</p>
                        </div>
                        <div className="text-right">
                            <p className={`font-mono text-3xl font-bold tabular-nums ${tod.clockColor}`}>{tod.timeStr}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">{tod.dateStr}</p>
                        </div>
                    </div>
                </div>

                {/* ③ AKSI CEPAT */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { href: '/admin/bugar-selamat', icon: ClipboardList, label: 'Bugar Selamat', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-950', border: 'border-green-200 dark:border-green-800' },
                        { href: '/admin/laporan-bahaya', icon: AlertTriangle, label: 'Laporan Bahaya', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800' },
                        { href: '/admin/targets', icon: Settings, label: 'Atur Target', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-950', border: 'border-indigo-200 dark:border-indigo-800' },
                    ].map(({ href, icon: Icon, label, color, bg, border }) => (
                        <Link key={href} href={href} className="block">
                            <div className={`flex flex-col items-center gap-1.5 rounded-xl border ${border} ${bg} py-3 text-center active:scale-95 transition-transform`}>
                                <Icon size={20} className={color} />
                                <p className={`text-[11px] font-semibold leading-tight ${color}`}>{label}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ④ 4 STAT CARDS */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        emoji="📋" label="Checklist" sublabel="Bugar Selamat"
                        value={stats.bugar_selamat.total} note={`${stats.bugar_selamat.bulan_ini} bulan ini`}
                        bg="bg-green-50 dark:bg-green-950" border="border-green-200 dark:border-green-800"
                        valueColor="text-green-700 dark:text-green-300"
                    />
                    <StatCard
                        emoji="⚠️" label="Laporan" sublabel="Laporan Bahaya"
                        value={stats.laporan_bahaya.total} note={`${stats.laporan_bahaya.bulan_ini} bulan ini`}
                        bg="bg-orange-50 dark:bg-orange-950" border="border-orange-200 dark:border-orange-800"
                        valueColor="text-orange-700 dark:text-orange-300"
                    />
                    <StatCard
                        emoji="⏳" label="Belum Selesai" sublabel="Perlu tindak lanjut"
                        value={stats.laporan_bahaya.pending} note={`${stats.laporan_bahaya.selesai} sudah selesai`}
                        bg={stats.laporan_bahaya.pending > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted/40'}
                        border={stats.laporan_bahaya.pending > 0 ? 'border-red-200 dark:border-red-800' : 'border-border'}
                        valueColor={stats.laporan_bahaya.pending > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}
                    />
                    <StatCard
                        emoji="👥" label="Karyawan" sublabel={`${stats.users.baratama} Baratama · ${stats.users.bandhawa} Bandhawa`}
                        value={stats.users.total} note="total terdaftar"
                        bg="bg-indigo-50 dark:bg-indigo-950" border="border-indigo-200 dark:border-indigo-800"
                        valueColor="text-indigo-700 dark:text-indigo-300"
                    />
                </div>

                {/* ⑤ STATUS KELAYAKAN + TINGKAT RISIKO — 1 card, 2 tab */}
                <Card>
                    <div className="flex items-center gap-1 px-4 pt-4 pb-3">
                        <button
                            onClick={() => setKelayakanTab('bugar')}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${kelayakanTab === 'bugar' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}
                        >
                            Kelayakan Kerja
                        </button>
                        <button
                            onClick={() => setKelayakanTab('risiko')}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${kelayakanTab === 'risiko' ? 'bg-orange-600 text-white' : 'bg-muted text-muted-foreground'}`}
                        >
                            Tingkat Risiko
                        </button>
                        <div className="flex-1" />
                        <Link href={kelayakanTab === 'bugar' ? '/admin/bugar-selamat' : '/admin/laporan-bahaya'}>
                            <Button variant="ghost" size="sm" className="h-7 gap-0.5 text-xs px-2">Semua <ChevronRight size={12} /></Button>
                        </Link>
                    </div>
                    <CardContent className="pt-0">
                        {kelayakanTab === 'bugar' && (
                            totalBugar > 0 ? (
                                <div className="space-y-2.5">
                                    {[
                                        { key: 'layak',    label: 'Layak Bekerja',    value: stats.bugar_selamat.layak,    color: 'bg-green-500',  emoji: '✅' },
                                        { key: 'catatan',  label: 'Dengan Catatan',   value: stats.bugar_selamat.catatan,  color: 'bg-yellow-400', emoji: '⚠️' },
                                        { key: 'dilarang', label: 'Dilarang Bekerja', value: stats.bugar_selamat.dilarang, color: 'bg-red-500',    emoji: '❌' },
                                    ].map((item) => (
                                        <div key={item.key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm">{item.emoji} {item.label}</span>
                                                <span className="text-sm font-bold">{item.value} <span className="text-xs font-normal text-muted-foreground">({totalBugar > 0 ? Math.round(item.value / totalBugar * 100) : 0}%)</span></span>
                                            </div>
                                            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                                <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${totalBugar > 0 ? Math.round(item.value / totalBugar * 100) : 0}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="py-4 text-center text-sm text-muted-foreground">Belum ada data.</p>
                        )}
                        {kelayakanTab === 'risiko' && (
                            <div className="grid grid-cols-2 gap-2">
                                {(['AA', 'A', 'B', 'C'] as const).map((k) => (
                                    <div key={k} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: RISK_COLORS[k] + '18' }}>
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-sm text-white" style={{ backgroundColor: RISK_COLORS[k] }}>
                                            {k}
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">{RISK_LABELS[k]}</p>
                                            <p className="text-xl font-bold" style={{ color: RISK_COLORS[k] }}>{stats.laporan_bahaya[k]}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="col-span-2 flex items-center justify-between rounded-xl bg-green-50 dark:bg-green-950 px-3 py-2">
                                    <span className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-300">
                                        <CheckCircle2 size={14} /> Sudah selesai ditangani
                                    </span>
                                    <span className="font-bold text-green-700 dark:text-green-300">{stats.laporan_bahaya.selesai}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ⑥ PER SITE — compact inline */}
                {site_breakdown.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                        {site_breakdown.map((s, i) => {
                            const clr = i === 0 ? '#6366f1' : '#ec4899';
                            return (
                                <div key={s.site} className="rounded-xl border p-3" style={{ borderColor: clr, backgroundColor: clr + '0d' }}>
                                    <p className="text-xs font-bold capitalize mb-2" style={{ color: clr }}>📍 Site {s.site}</p>
                                    <div className="grid grid-cols-2 gap-1 text-center">
                                        <div>
                                            <p className="text-2xl font-bold">{s.bugar}</p>
                                            <p className="text-[11px] text-muted-foreground">Checklist</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{s.laporan}</p>
                                            <p className="text-[11px] text-muted-foreground">Laporan</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ⑦ TARGET + LEADERBOARD */}
                <div className="grid gap-3 sm:grid-cols-2">
                    {/* Target partisipasi */}
                    <Card>
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <p className="text-sm font-bold">🎯 Target Partisipasi</p>
                            <Link href="/admin/targets">
                                <Button size="sm" variant="outline" className="h-7 text-xs">Ubah</Button>
                            </Link>
                        </div>
                        <CardContent className="pt-0 space-y-1.5">
                            {participation_targets.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">Belum ada target. <Link href="/admin/targets" className="underline">Atur sekarang</Link></p>
                            ) : participation_targets.map((t) => (
                                <div key={t.level} className="flex justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                                    <span className="font-medium">{LEVEL_LABELS[t.level] ?? t.level}</span>
                                    <span className="text-muted-foreground">{t.laporan_per_minggu}×/minggu</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Leaderboard */}
                    {leaderSites.length > 0 && (
                        <Card>
                            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                                <p className="text-sm font-bold">🏆 Peringkat Bulan Ini</p>
                                <div className="flex gap-1">
                                    {leaderSites.map((site) => (
                                        <button
                                            key={site}
                                            onClick={() => setActiveLeaderSite(site)}
                                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition-colors ${activeLeaderSite === site ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                        >
                                            {site}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <CardContent className="pt-0 space-y-1.5">
                                {(leaderboard[activeLeaderSite] ?? []).filter((e) => e.skor > 0).slice(0, 3).map((entry, idx) => (
                                    <div key={entry.id} className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
                                        <span className="text-base w-6 text-center">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                                        <p className="flex-1 text-sm font-medium truncate">{entry.name}</p>
                                        <span className="text-sm font-bold text-primary">{entry.skor}</span>
                                    </div>
                                ))}
                                {(leaderboard[activeLeaderSite] ?? []).filter((e) => e.skor > 0).length === 0 && (
                                    <p className="text-center text-xs text-muted-foreground py-3">Belum ada data bulan ini</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

            </div>
        </>
    );
}

function StatCard({ emoji, label, sublabel, value, note, bg, border, valueColor }: {
    emoji: string; label: string; sublabel: string; value: number;
    note: string; bg: string; border: string; valueColor: string;
}) {
    return (
        <div className={`rounded-xl border ${border} ${bg} p-4`}>
            <p className="text-2xl leading-none mb-2">{emoji}</p>
            <p className={`text-3xl font-bold tabular-nums ${valueColor}`}>{value}</p>
            <p className="text-sm font-semibold mt-0.5">{label}</p>
            <p className="text-[11px] text-muted-foreground">{sublabel}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{note}</p>
        </div>
    );
}
