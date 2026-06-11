import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronRight,
    ClipboardCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

type DilarangEntry = { id: number | null; name: string; jabatan: string | null; site: string | null; avatar: string | null };

type Stats = {
    bugar_selamat: { total: number; bulan_ini: number; layak: number; catatan: number; dilarang: number };
    laporan_bahaya: { total: number; bulan_ini: number; AA: number; A: number; B: number; C: number; pending: number; selesai: number };
    observasi_keselamatan: { total: number; bulan_ini: number; menunggu_konfirmasi: number };
    inspeksi: { total: number; bulan_ini: number; kantor: number; tambang: number; workshop: number; mess: number };
    users: { total: number; baratama: number; bandhawa: number };
    komunikasi_jsa: { total: number; bulan_ini: number; menunggu_konfirmasi: number };
};

type ComplianceData = { total_karyawan: number; sudah_submit_bs: number; dilarang_list: DilarangEntry[] };

type SiteItem = { site: string; bugar: number; laporan: number; observasi: number; inspeksi: number };
type TrendItem = { label: string; bugar: number; laporan: number; observasi: number; inspeksi: number };
type LeaderboardEntry = { id: number; name: string; jabatan: string | null; avatar: string | null; bs: number; lb: number; skor: number };
type ParticipationTarget = { level: string; bugar_per_hari: number; laporan_per_minggu: number; inspeksi_per_minggu: number; observasi_per_minggu: number };

type Props = {
    stats: Stats;
    compliance: ComplianceData;
    trend: TrendItem[];
    site_breakdown: SiteItem[];
    leaderboard?: Record<string, LeaderboardEntry[]>;
    participation_targets?: ParticipationTarget[];
};

// ─── Time-of-day helper (greeting card — tidak diubah) ───────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = { AA: '#ef4444', A: '#f97316', B: '#eab308', C: '#22c55e' };
const RISK_LABELS: Record<string, string> = { AA: 'Sangat Tinggi', A: 'Tinggi', B: 'Sedang', C: 'Rendah' };
const LEVEL_LABELS: Record<string, string> = { nonstaff: 'Non-Staff', staff: 'Staff', srstaff: 'Sr. Staff' };

const TREND_SERIES = [
    { key: 'bugar',     name: 'Bugar Selamat',          color: '#22c55e' },
    { key: 'laporan',   name: 'Laporan Bahaya',          color: '#f97316' },
    { key: 'observasi', name: 'Observasi Keselamatan',   color: '#8b5cf6' },
    { key: 'inspeksi',  name: 'Inspeksi',                color: '#14b8a6' },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_OK  = { total: 0, bulan_ini: 0, menunggu_konfirmasi: 0 };
const DEFAULT_INS = { total: 0, bulan_ini: 0, kantor: 0, tambang: 0, workshop: 0, mess: 0 };
const DEFAULT_JSA = { total: 0, bulan_ini: 0, menunggu_konfirmasi: 0 };
const DEFAULT_COMPLIANCE: ComplianceData = { total_karyawan: 0, sudah_submit_bs: 0, dilarang_list: [] };

export default function AdminIndex({ stats: rawStats, compliance: rawCompliance, trend = [], site_breakdown = [], leaderboard = {}, participation_targets = [] }: Props) {
    const stats = {
        ...rawStats,
        observasi_keselamatan: rawStats.observasi_keselamatan ?? DEFAULT_OK,
        inspeksi:              rawStats.inspeksi              ?? DEFAULT_INS,
        komunikasi_jsa:        rawStats.komunikasi_jsa        ?? DEFAULT_JSA,
    };
    const tod = useTimeOfDay();
    const [activeLeaderSite, setActiveLeaderSite] = useState<string>(() => Object.keys(leaderboard)[0] ?? '');
    const [dilarangExpanded, setDilarangExpanded] = useState(false);
    const leaderSites = Object.keys(leaderboard);

    const compliance = rawCompliance ?? DEFAULT_COMPLIANCE;
    const compliancePct = compliance.total_karyawan > 0
        ? Math.round(compliance.sudah_submit_bs / compliance.total_karyawan * 100)
        : 0;
    const dilarangList = compliance.dilarang_list ?? [];

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="space-y-3 pb-8">

                {/* ① ALERTS DARURAT */}
                {stats.laporan_bahaya.pending > 0 && (
                    <Link href="/admin/laporan-bahaya" className="block">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 dark:border-red-700 dark:bg-red-950">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                                    ⚠️ {stats.laporan_bahaya.pending} laporan bahaya belum ditindaklanjuti
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400">Ketuk untuk melihat dan menangani</p>
                            </div>
                            <ChevronRight size={16} className="text-red-400 shrink-0" />
                        </div>
                    </Link>
                )}
                {stats.observasi_keselamatan.menunggu_konfirmasi > 0 && (
                    <Link href="/admin/observasi-keselamatan" className="block">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-violet-400 bg-violet-50 px-4 py-3 dark:border-violet-700 dark:bg-violet-950">
                            <ClipboardCheck className="h-5 w-5 shrink-0 text-violet-500" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-violet-800 dark:text-violet-200 text-sm">
                                    📋 {stats.observasi_keselamatan.menunggu_konfirmasi} observasi menunggu konfirmasi
                                </p>
                                <p className="text-xs text-violet-600 dark:text-violet-400">Ketuk untuk melihat dan menangani</p>
                            </div>
                            <ChevronRight size={16} className="text-violet-400 shrink-0" />
                        </div>
                    </Link>
                )}
                {stats.komunikasi_jsa.menunggu_konfirmasi > 0 && (
                    <Link href="/admin/komunikasi-jsa?status=menunggu_konfirmasi" className="block">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950">
                            <ClipboardCheck className="h-5 w-5 shrink-0 text-amber-500" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                                    📄 {stats.komunikasi_jsa.menunggu_konfirmasi} komunikasi JSA menunggu konfirmasi TL
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">Ketuk untuk melihat</p>
                            </div>
                            <ChevronRight size={16} className="text-amber-400 shrink-0" />
                        </div>
                    </Link>
                )}
                {dilarangList.length > 0 && (
                    <div className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">🚫</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                                    {dilarangList.length} karyawan dilarang bekerja hari ini
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400">Berdasarkan hasil Bugar Selamat</p>
                            </div>
                            <button
                                onClick={() => setDilarangExpanded(v => !v)}
                                className="text-xs text-red-600 dark:text-red-400 underline shrink-0"
                            >
                                {dilarangExpanded ? 'Sembunyikan' : 'Lihat'}
                            </button>
                        </div>
                        {dilarangExpanded && (
                            <div className="mt-3 space-y-2">
                                {dilarangList.map((entry, i) => (
                                    <div key={i} className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900 px-3 py-2">
                                        {entry.avatar ? (
                                            <img src={entry.avatar} alt={entry.name} className="h-7 w-7 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-300 dark:bg-red-700 text-xs font-bold text-red-800 dark:text-red-200">
                                                {entry.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-red-900 dark:text-red-100 truncate">{entry.name}</p>
                                            <p className="text-[11px] text-red-600 dark:text-red-400">{entry.jabatan ?? '-'} · {entry.site ?? '-'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ② GREETING CARD — tidak diubah */}
                <div className="relative overflow-hidden rounded-2xl border" style={{ background: tod.gradientStyle }}>
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

                {/* ③ COMPLIANCE HARI INI */}
                <Card>
                    <CardHeader className="px-4 pt-4 pb-3">
                        <p className="text-sm font-bold">📅 Compliance Hari Ini</p>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-muted-foreground">Bugar Selamat sudah submit</span>
                                <span className="text-sm font-bold">
                                    {compliance.sudah_submit_bs}
                                    <span className="text-xs font-normal text-muted-foreground"> / {compliance.total_karyawan} ({compliancePct}%)</span>
                                </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${compliancePct >= 80 ? 'bg-green-500' : compliancePct >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                    style={{ width: `${compliancePct}%` }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-green-50 dark:bg-green-950 py-2 px-1">
                                <p className="text-xl font-bold text-green-700 dark:text-green-300">{compliance.sudah_submit_bs}</p>
                                <p className="text-[11px] text-muted-foreground">Sudah Submit</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 py-2 px-1">
                                <p className="text-xl font-bold">{compliance.total_karyawan - compliance.sudah_submit_bs}</p>
                                <p className="text-[11px] text-muted-foreground">Belum Submit</p>
                            </div>
                            <div className={`rounded-lg py-2 px-1 ${dilarangList.length > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted/50'}`}>
                                <p className={`text-xl font-bold ${dilarangList.length > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{dilarangList.length}</p>
                                <p className="text-[11px] text-muted-foreground">Dilarang Kerja</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>


                {/* ⑤ 6 STAT CARDS */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard emoji="📋" label="Bugar Selamat"           sublabel="Checklist kesehatan"         value={stats.bugar_selamat.total}           note={`${stats.bugar_selamat.bulan_ini} bulan ini`}           bg="bg-green-50 dark:bg-green-950"   border="border-green-200 dark:border-green-800"   valueColor="text-green-700 dark:text-green-300" />
                    <StatCard emoji="⚠️" label="Laporan Bahaya"          sublabel="Temuan risiko"               value={stats.laporan_bahaya.total}          note={`${stats.laporan_bahaya.bulan_ini} bulan ini`}          bg="bg-orange-50 dark:bg-orange-950" border="border-orange-200 dark:border-orange-800" valueColor="text-orange-700 dark:text-orange-300" />
                    <StatCard emoji="👁️" label="Observasi Keselamatan"   sublabel="SAP — observasi lapangan"    value={stats.observasi_keselamatan.total}   note={`${stats.observasi_keselamatan.bulan_ini} bulan ini`}   bg="bg-violet-50 dark:bg-violet-950" border="border-violet-200 dark:border-violet-800" valueColor="text-violet-700 dark:text-violet-300" />
                    <StatCard emoji="🏗️" label="Inspeksi"               sublabel="4 jenis inspeksi"            value={stats.inspeksi.total}               note={`${stats.inspeksi.bulan_ini} bulan ini`}               bg="bg-teal-50 dark:bg-teal-950"     border="border-teal-200 dark:border-teal-800"     valueColor="text-teal-700 dark:text-teal-300" />
                    <StatCard
                        emoji="⏳" label="LB Belum Selesai" sublabel="Perlu tindak lanjut"
                        value={stats.laporan_bahaya.pending}
                        note={`${stats.laporan_bahaya.selesai} sudah selesai`}
                        bg={stats.laporan_bahaya.pending > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted/40'}
                        border={stats.laporan_bahaya.pending > 0 ? 'border-red-200 dark:border-red-800' : 'border-border'}
                        valueColor={stats.laporan_bahaya.pending > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}
                    />
                    <StatCard emoji="👥" label="Karyawan" sublabel={`${stats.users.baratama} Baratama · ${stats.users.bandhawa} Bandhawa`} value={stats.users.total} note="total terdaftar" bg="bg-indigo-50 dark:bg-indigo-950" border="border-indigo-200 dark:border-indigo-800" valueColor="text-indigo-700 dark:text-indigo-300" />
                    <Link href="/admin/komunikasi-jsa" className="col-span-2">
                        <StatCard emoji="📄" label="Komunikasi JSA/SOP/IK" sublabel={`${stats.komunikasi_jsa.menunggu_konfirmasi} menunggu konfirmasi TL`} value={stats.komunikasi_jsa.total} note={`${stats.komunikasi_jsa.bulan_ini} bulan ini`} bg={stats.komunikasi_jsa.menunggu_konfirmasi > 0 ? 'bg-amber-50 dark:bg-amber-950' : 'bg-sky-50 dark:bg-sky-950'} border={stats.komunikasi_jsa.menunggu_konfirmasi > 0 ? 'border-amber-200 dark:border-amber-800' : 'border-sky-200 dark:border-sky-800'} valueColor={stats.komunikasi_jsa.menunggu_konfirmasi > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-sky-700 dark:text-sky-300'} />
                    </Link>
                </div>

                {/* ⑥ DONUT CHARTS — Kelayakan & Risiko side by side */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Kelayakan Kerja donut */}
                    <Card>
                        <CardHeader className="px-4 pt-4 pb-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold">Kelayakan Kerja</p>
                                <Link href="/admin/bugar-selamat">
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]">Semua <ChevronRight size={11} /></Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            {stats.bugar_selamat.total > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={130}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Layak',    value: stats.bugar_selamat.layak,    fill: '#22c55e' },
                                                    { name: 'Catatan',  value: stats.bugar_selamat.catatan,  fill: '#eab308' },
                                                    { name: 'Dilarang', value: stats.bugar_selamat.dilarang, fill: '#ef4444' },
                                                ]}
                                                cx="50%" cy="50%"
                                                innerRadius="52%" outerRadius="78%"
                                                paddingAngle={2} dataKey="value"
                                            >
                                                {[{ fill: '#22c55e' }, { fill: '#eab308' }, { fill: '#ef4444' }].map((c, i) => (
                                                    <Cell key={i} fill={c.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => [`${v}`, '']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-1 mt-1">
                                        {[
                                            { label: 'Layak',    value: stats.bugar_selamat.layak,    color: '#22c55e' },
                                            { label: 'Catatan',  value: stats.bugar_selamat.catatan,  color: '#eab308' },
                                            { label: 'Dilarang', value: stats.bugar_selamat.dilarang, color: '#ef4444' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                    {item.label}
                                                </span>
                                                <span className="text-[11px] font-semibold">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : <p className="py-8 text-center text-xs text-muted-foreground">Belum ada data</p>}
                        </CardContent>
                    </Card>

                    {/* Tingkat Risiko donut */}
                    <Card>
                        <CardHeader className="px-4 pt-4 pb-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold">Tingkat Risiko</p>
                                <Link href="/admin/laporan-bahaya">
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]">Semua <ChevronRight size={11} /></Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            {stats.laporan_bahaya.total > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={130}>
                                        <PieChart>
                                            <Pie
                                                data={(['AA', 'A', 'B', 'C'] as const).map((k) => ({ name: k, value: stats.laporan_bahaya[k], fill: RISK_COLORS[k] }))}
                                                cx="50%" cy="50%"
                                                innerRadius="52%" outerRadius="78%"
                                                paddingAngle={2} dataKey="value"
                                            >
                                                {(['AA', 'A', 'B', 'C'] as const).map((k) => (
                                                    <Cell key={k} fill={RISK_COLORS[k]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => [`${v}`, '']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-1 mt-1">
                                        {(['AA', 'A', 'B', 'C'] as const).map((k) => (
                                            <div key={k} className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: RISK_COLORS[k] }} />
                                                    {k} — {RISK_LABELS[k]}
                                                </span>
                                                <span className="text-[11px] font-semibold">{stats.laporan_bahaya[k]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : <p className="py-8 text-center text-xs text-muted-foreground">Belum ada data</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* ⑥b DONUT — Distribusi Inspeksi per jenis */}
                {stats.inspeksi.total > 0 && (
                    <Card>
                        <CardHeader className="px-4 pt-4 pb-1">
                            <p className="text-sm font-bold">🏗️ Distribusi Inspeksi SAP</p>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <div className="flex items-center gap-2">
                                <ResponsiveContainer width="45%" height={150}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Kantor',   value: stats.inspeksi.kantor,   fill: '#14b8a6' },
                                                { name: 'Tambang',  value: stats.inspeksi.tambang,  fill: '#0d9488' },
                                                { name: 'Workshop', value: stats.inspeksi.workshop, fill: '#0f766e' },
                                                { name: 'Mess',     value: stats.inspeksi.mess,     fill: '#134e4a' },
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius="50%" outerRadius="80%"
                                            paddingAngle={2} dataKey="value"
                                        >
                                            {['#14b8a6', '#0d9488', '#0f766e', '#134e4a'].map((c, i) => <Cell key={i} fill={c} />)}
                                        </Pie>
                                        <Tooltip formatter={(v) => [`${v}`, '']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex-1 space-y-2">
                                    {[
                                        { label: 'Kantor',   value: stats.inspeksi.kantor,   color: '#14b8a6' },
                                        { label: 'Tambang',  value: stats.inspeksi.tambang,  color: '#0d9488' },
                                        { label: 'Workshop', value: stats.inspeksi.workshop, color: '#0f766e' },
                                        { label: 'Mess',     value: stats.inspeksi.mess,     color: '#134e4a' },
                                    ].map((item) => {
                                        const pct = stats.inspeksi.total > 0 ? Math.round(item.value / stats.inspeksi.total * 100) : 0;
                                        return (
                                            <div key={item.label}>
                                                <div className="flex justify-between text-[11px] mb-0.5">
                                                    <span className="text-muted-foreground">{item.label}</span>
                                                    <span className="font-semibold">{item.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ⑦ TREND CHART 6 BULAN */}
                {trend.length > 0 && (
                    <Card>
                        <CardHeader className="px-4 pt-4 pb-2">
                            <p className="text-sm font-bold">📈 Tren Aktivitas 6 Bulan</p>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                                {TREND_SERIES.map((s) => (
                                    <span key={s.key} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                                        {s.name}
                                    </span>
                                ))}
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={trend} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                                    <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                        cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                                    />
                                    {TREND_SERIES.map((s) => (
                                        <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={14} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* ⑧ PER SITE BREAKDOWN */}
                {site_breakdown.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-0.5">Per Site</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {site_breakdown.map((s, i) => {
                                const clr = i === 0 ? '#6366f1' : '#ec4899';
                                return (
                                    <div key={s.site} className="rounded-xl border p-3" style={{ borderColor: clr, backgroundColor: clr + '0d' }}>
                                        <p className="text-xs font-bold capitalize mb-2.5" style={{ color: clr }}>📍 Site {s.site}</p>
                                        <div className="grid grid-cols-4 gap-1 text-center">
                                            {[
                                                { label: 'BS',    value: s.bugar,     color: '#22c55e' },
                                                { label: 'LB',    value: s.laporan,   color: '#f97316' },
                                                { label: 'OK',    value: s.observasi, color: '#8b5cf6' },
                                                { label: 'Insp',  value: s.inspeksi,  color: '#14b8a6' },
                                            ].map((item) => (
                                                <div key={item.label}>
                                                    <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                                                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ⑨ TARGET PARTISIPASI + LEADERBOARD */}
                <div className="grid gap-3 sm:grid-cols-2">
                    {/* Target */}
                    <Card>
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <p className="text-sm font-bold">🎯 Target Partisipasi</p>
                            <Link href="/admin/targets">
                                <Button size="sm" variant="outline" className="h-7 text-xs">Ubah</Button>
                            </Link>
                        </div>
                        <CardContent className="pt-0 space-y-2">
                            {participation_targets.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">Belum ada target. <Link href="/admin/targets" className="underline">Atur sekarang</Link></p>
                            ) : participation_targets.map((t) => (
                                <div key={t.level} className="rounded-lg bg-muted/50 px-3 py-2">
                                    <p className="text-sm font-semibold mb-1">{LEVEL_LABELS[t.level] ?? t.level}</p>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                        {t.bugar_per_hari > 0 && (
                                            <p className="text-[11px] text-muted-foreground">BS: <span className="font-medium text-foreground">{t.bugar_per_hari}×/hari</span></p>
                                        )}
                                        {t.laporan_per_minggu > 0 && (
                                            <p className="text-[11px] text-muted-foreground">LB: <span className="font-medium text-foreground">{t.laporan_per_minggu}×/minggu</span></p>
                                        )}
                                        {t.inspeksi_per_minggu > 0 && (
                                            <p className="text-[11px] text-muted-foreground">Insp: <span className="font-medium text-foreground">{t.inspeksi_per_minggu}×/minggu</span></p>
                                        )}
                                        {t.observasi_per_minggu > 0 && (
                                            <p className="text-[11px] text-muted-foreground">OK: <span className="font-medium text-foreground">{t.observasi_per_minggu}×/minggu</span></p>
                                        )}
                                    </div>
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
                                        <span className="text-base w-6 shrink-0 text-center">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                                        {entry.avatar ? (
                                            <img src={entry.avatar} alt={entry.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                                        ) : (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                                {entry.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                        )}
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

// ─── StatCard component ───────────────────────────────────────────────────────

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
