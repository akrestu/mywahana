import { Head, router } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, ChevronUp, Search, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    Bar, BarChart, CartesianGrid, Line, LineChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────
type SessionRecord = {
    id: number;
    departemen: string;
    tags: 'S' | 'NS';
    score: number;
    total_questions: number;
    percentage: number;
    passed: boolean;
    completed_at: string;
    user: { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
};

type Paginated = {
    data: SessionRecord[];
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Summary = {
    total: number;
    lulus: number;
    tidak_lulus: number;
    avg_score: number;
    coverage_pct: number;
};

type DeptStat = { departemen: string; total: number; lulus: number; pass_rate: number };
type MonthTrend = { month: string; pass_rate: number; total: number };
type WeakQuestion = {
    question_id: number;
    question: string | null;
    departemen: string | null;
    tags: string | null;
    total_attempt: number;
    total_salah: number;
    pct_salah: number;
};
type UncoveredUser = { id: number; name: string; nik: string | null; departemen: string | null; site: string | null };

type Filters = { search?: string; departemen?: string; passed?: string };

type Props = {
    records: Paginated;
    filters: Filters;
    summary: Summary;
    dept_stats: DeptStat[];
    monthly_trend: MonthTrend[];
    weak_questions: WeakQuestion[];
    uncovered_users: UncoveredUser[];
};

const DEPTS = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA'];

function fmt(month: string) {
    const [y, m] = month.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminAssessment({
    records, filters, summary,
    dept_stats, monthly_trend, weak_questions, uncovered_users,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showWeak, setShowWeak] = useState(false);
    const [showUncovered, setShowUncovered] = useState(false);
    const [drillUser, setDrillUser] = useState<{ name: string; records: SessionRecord[] } | null>(null);

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach(k => {
            if ((merged as Record<string, unknown>)[k] === 'all') delete (merged as Record<string, unknown>)[k];
        });
        router.get('/admin/assessment', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); applyFilters({ search }); };

    const openDrill = (row: SessionRecord) => {
        const userRecords = records.data.filter(r => r.user.id === row.user.id);
        setDrillUser({ name: row.user.name, records: userRecords });
    };

    return (
        <>
            <Head title="Monitoring Assessment Safety" />
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div>
                    <h2 className="text-xl font-bold">Assessment Safety</h2>
                    <p className="text-sm text-muted-foreground">Monitoring & analitik hasil assessment seluruh karyawan</p>
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[
                        { label: 'Total Attempt',   value: summary.total,       color: 'text-blue-600',   suffix: '' },
                        { label: 'Lulus',            value: summary.lulus,       color: 'text-green-600',  suffix: '' },
                        { label: 'Tidak Lulus',      value: summary.tidak_lulus, color: 'text-red-600',    suffix: '' },
                        { label: 'Rata-rata Skor',   value: summary.avg_score,   color: 'text-indigo-600', suffix: '%' },
                        { label: 'Coverage Karyawan',value: summary.coverage_pct,color: 'text-orange-600', suffix: '%' },
                    ].map(item => (
                        <Card key={item.label}>
                            <CardContent className="pt-4 pb-4">
                                <p className={cn('text-2xl font-bold', item.color)}>{item.value}{item.suffix}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Charts ── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Bar chart – pass rate per dept */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Pass Rate per Departemen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dept_stats.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">Belum ada data.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dept_stats} layout="vertical" margin={{ left: 16, right: 24 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                                        <YAxis type="category" dataKey="departemen" tick={{ fontSize: 11 }} width={90} />
                                        <Tooltip formatter={(v: number) => [`${v}%`, 'Pass Rate']} />
                                        <Bar dataKey="pass_rate" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Line chart – monthly trend */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Tren Pass Rate Bulanan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {monthly_trend.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">Belum ada data 6 bulan terakhir.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={monthly_trend} margin={{ left: 0, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                                        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            formatter={(v: number) => [`${v}%`, 'Pass Rate']}
                                            labelFormatter={fmt}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="pass_rate"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Soal Lemah ── */}
                <Card>
                    <CardHeader
                        className="pb-2 cursor-pointer select-none"
                        onClick={() => setShowWeak(v => !v)}
                    >
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">
                                Soal Paling Sering Salah
                                <span className="ml-2 text-xs text-muted-foreground font-normal">(Top 10 — identifikasi celah pengetahuan)</span>
                            </CardTitle>
                            {showWeak ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                    </CardHeader>
                    {showWeak && (
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-muted-foreground">
                                        <th className="px-4 py-2 text-left font-medium">#</th>
                                        <th className="px-4 py-2 text-left font-medium">Soal</th>
                                        <th className="px-4 py-2 text-left font-medium">Dept</th>
                                        <th className="px-4 py-2 text-right font-medium">Salah</th>
                                        <th className="px-4 py-2 text-right font-medium">% Salah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {weak_questions.length === 0 && (
                                        <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Belum ada data.</td></tr>
                                    )}
                                    {weak_questions.map((q, i) => (
                                        <tr key={q.question_id} className="hover:bg-muted/30">
                                            <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                                            <td className="px-4 py-2.5 max-w-xs">
                                                <p className="line-clamp-2 leading-snug">{q.question ?? '-'}</p>
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <span>{q.departemen ?? '-'}</span>
                                                    <Badge variant="outline" className="text-[10px] w-fit">{q.tags === 'S' ? 'Staff' : 'Non Staff'}</Badge>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right">{q.total_salah} / {q.total_attempt}</td>
                                            <td className="px-4 py-2.5 text-right">
                                                <span className={cn('font-semibold', q.pct_salah >= 60 ? 'text-red-600' : q.pct_salah >= 40 ? 'text-orange-500' : 'text-muted-foreground')}>
                                                    {q.pct_salah}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    )}
                </Card>

                {/* ── Coverage Gap ── */}
                <Card>
                    <CardHeader
                        className="pb-2 cursor-pointer select-none"
                        onClick={() => setShowUncovered(v => !v)}
                    >
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">
                                Karyawan Belum Assessment
                                <Badge variant="destructive" className="ml-2 text-xs">{uncovered_users.length}</Badge>
                            </CardTitle>
                            {showUncovered ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                    </CardHeader>
                    {showUncovered && (
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-muted-foreground">
                                        <th className="px-4 py-2 text-left font-medium">Karyawan</th>
                                        <th className="px-4 py-2 text-left font-medium">Departemen</th>
                                        <th className="px-4 py-2 text-left font-medium">Site</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {uncovered_users.length === 0 && (
                                        <tr><td colSpan={3} className="py-6 text-center text-green-600 font-medium">Semua karyawan sudah mengikuti assessment ✓</td></tr>
                                    )}
                                    {uncovered_users.map(u => (
                                        <tr key={u.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-2.5">
                                                <p className="font-medium">{u.name}</p>
                                                <p className="text-xs text-muted-foreground">{u.nik ?? '-'}</p>
                                            </td>
                                            <td className="px-4 py-2.5">{u.departemen ?? '-'}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{u.site ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    )}
                </Card>

                {/* ── Filters ── */}
                <div>
                    <h3 className="text-sm font-semibold mb-3">Riwayat Assessment</h3>
                    <div className="flex flex-wrap gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Cari nama / NIK..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-52"
                            />
                            <Button type="submit" variant="outline" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>

                        <Select value={filters.departemen ?? 'all'} onValueChange={v => applyFilters({ departemen: v })}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Departemen" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Departemen</SelectItem>
                                {DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={filters.passed ?? 'all'} onValueChange={v => applyFilters({ passed: v })}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="1">Lulus</SelectItem>
                                <SelectItem value="0">Tidak Lulus</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* ── Table ── */}
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground">
                                    <th className="px-4 py-3 text-left font-medium">Karyawan</th>
                                    <th className="px-4 py-3 text-left font-medium">Departemen</th>
                                    <th className="px-4 py-3 text-left font-medium">Level</th>
                                    <th className="px-4 py-3 text-right font-medium">Skor</th>
                                    <th className="px-4 py-3 text-right font-medium">Persentase</th>
                                    <th className="px-4 py-3 text-center font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {records.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-muted-foreground">Tidak ada data.</td>
                                    </tr>
                                )}
                                {records.data.map(r => (
                                    <tr
                                        key={r.id}
                                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => openDrill(r)}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium hover:underline">{r.user.name}</p>
                                            <p className="text-xs text-muted-foreground">{r.user.nik ?? '-'} · {r.user.site ?? '-'}</p>
                                        </td>
                                        <td className="px-4 py-3">{r.departemen}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="text-xs">
                                                {r.tags === 'S' ? 'Staff' : 'Non Staff'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">{r.score} / {r.total_questions}</td>
                                        <td className="px-4 py-3 text-right font-medium">{Number(r.percentage).toFixed(0)}%</td>
                                        <td className="px-4 py-3 text-center">
                                            {r.passed
                                                ? <div className="flex justify-center"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
                                                : <div className="flex justify-center"><XCircle className="h-5 w-5 text-red-500" /></div>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(r.completed_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {(records.prev_page_url || records.next_page_url) && (
                    <div className="flex justify-between">
                        {records.prev_page_url
                            ? <Button variant="outline" size="sm" onClick={() => router.get(records.prev_page_url!)}>← Sebelumnya</Button>
                            : <span />
                        }
                        {records.next_page_url
                            ? <Button variant="outline" size="sm" onClick={() => router.get(records.next_page_url!)}>Berikutnya →</Button>
                            : <span />
                        }
                    </div>
                )}
            </div>

            {/* ── Drill-down Modal ── */}
            <Dialog open={!!drillUser} onOpenChange={() => setDrillUser(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Riwayat: {drillUser?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground">
                                    <th className="px-3 py-2 text-left font-medium">Tanggal</th>
                                    <th className="px-3 py-2 text-right font-medium">Skor</th>
                                    <th className="px-3 py-2 text-right font-medium">%</th>
                                    <th className="px-3 py-2 text-center font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {drillUser?.records.map(r => (
                                    <tr key={r.id}>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {new Date(r.completed_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-3 py-2 text-right">{r.score}/{r.total_questions}</td>
                                        <td className="px-3 py-2 text-right font-medium">{Number(r.percentage).toFixed(0)}%</td>
                                        <td className="px-3 py-2 text-center">
                                            {r.passed
                                                ? <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                                                : <XCircle className="h-4 w-4 text-red-500 inline" />
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
