import { router } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, Download, Search, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
    Bar, BarChart, CartesianGrid, Line, LineChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import BatchDeleteBar from '@/components/admin/BatchDeleteBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPTS, fmtMonth } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

export type SessionRecord = {
    id: number;
    departemen?: string;
    tags?: 'S' | 'NS';
    score: number;
    total_questions: number;
    percentage: number;
    passed: boolean;
    completed_at: string;
    user: { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
};

export type Summary = {
    total: number;
    lulus: number;
    tidak_lulus: number;
    avg_score: number;
    coverage_pct: number;
};

export type DeptStat = { departemen: string; total: number; lulus: number; pass_rate: number };
export type MonthTrend = { month: string; pass_rate: number; total: number };

export type WeakQuestion = {
    question_id: number;
    question: string | null;
    departemen?: string | null;
    tags?: string | null;
    total_attempt: number;
    total_salah: number;
    pct_salah: number;
};

export type UncoveredUser = {
    id: number;
    name: string;
    nik: string | null;
    departemen?: string | null;
    jabatan?: string | null;
    site: string | null;
};

export type AttendanceRecord = {
    user: { id: number; name: string; nik?: string | null; departemen?: string | null; jabatan?: string | null; site?: string | null };
    attended_at: string;
    session_id: number;
};

export type AttendanceSummary = {
    total_tercatat: number;
    belum_tercatat: number;
    records: AttendanceRecord[];
    belum_users: UncoveredUser[];
};

export type Filters = { search?: string; departemen?: string; passed?: string };

export type AssessmentConfig = {
    heading: string;
    subtitle: string;
    kpiTotalColor: string;
    kpiAvgColor: string;
    lineColor: string;
    route: string;
    showDeptChart: boolean;
    showDeptFilter: boolean;
    showTagsInWeakQuestions: boolean;
    uncoveredLabel: string;
    uncoveredSecondColLabel: string;
    uncoveredSecondColKey: 'departemen' | 'jabatan';
    uncoveredAllDoneMessage: string;
    historyLabel: string;
    inductionLabel: string;
    inductionExportUrl: string;
    attendanceShowDept: boolean;
    belumIndukeShowDept: boolean;
    belumIndukeAllDoneMessage: string;
    deleteRoute?: string;
    batchDeleteRoute?: string;
};

export type Props = {
    records: { data: SessionRecord[]; total: number; next_page_url: string | null; prev_page_url: string | null };
    filters: Filters;
    summary: Summary;
    dept_stats?: DeptStat[];
    monthly_trend: MonthTrend[];
    weak_questions: WeakQuestion[];
    uncovered_users: UncoveredUser[];
    attendance_summary: AttendanceSummary;
};

// ── Component ──────────────────────────────────────────────────────────────

export default function AssessmentMonitor({
    records, filters, summary,
    dept_stats = [], monthly_trend, weak_questions, uncovered_users, attendance_summary,
    config,
}: Props & { config: AssessmentConfig }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showWeak, setShowWeak] = useState(false);
    const [showUncovered, setShowUncovered] = useState(false);
    const [showAttendance, setShowAttendance] = useState(false);
    const [showBelumInduksi, setShowBelumInduksi] = useState(false);
    const [drillUser, setDrillUser] = useState<{ name: string; records: SessionRecord[] } | null>(null);
    const [toDelete, setToDelete] = useState<SessionRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [showBatchConfirm, setShowBatchConfirm] = useState(false);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);

            if (next.has(id)) {
next.delete(id);
} else {
next.add(id);
}

            return next;
        });
    };
    const toggleSelectAll = () => {
        if (selectedIds.size === records.data.length) {
setSelectedIds(new Set());
} else {
setSelectedIds(new Set(records.data.map(r => r.id)));
}
    };
    const exitSelectMode = () => {
 setSelectMode(false); setSelectedIds(new Set()); 
};

    const handleDelete = () => {
        if (!toDelete || !config.deleteRoute) {
return;
}

        setDeleting(true);
        router.delete(`${config.deleteRoute}/${toDelete.id}`, {
            onFinish: () => {
 setDeleting(false); setToDelete(null); 
},
        });
    };

    const handleBatchDelete = () => {
        if (!config.batchDeleteRoute) {
return;
}

        setBatchDeleting(true);
        router.delete(config.batchDeleteRoute, {
            data: { ids: Array.from(selectedIds) },
            onFinish: () => {
 setBatchDeleting(false); setShowBatchConfirm(false); exitSelectMode(); 
},
        });
    };

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        const cleaned = Object.fromEntries(
            Object.entries(merged).filter(([, v]) => v !== undefined && v !== 'all'),
        ) as Filters;
        router.get(config.route, cleaned, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
 e.preventDefault(); applyFilters({ search }); 
};

    const openDrill = (row: SessionRecord) => {
        const userRecords = records.data.filter(r => r.user.id === row.user.id);
        setDrillUser({ name: row.user.name, records: userRecords });
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div>
                <h2 className="text-xl font-bold">{config.heading}</h2>
                <p className="text-sm text-muted-foreground">{config.subtitle}</p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                    { label: 'Total Attempt',    value: summary.total,        color: config.kpiTotalColor, suffix: '' },
                    { label: 'Lulus',             value: summary.lulus,        color: 'text-green-600',     suffix: '' },
                    { label: 'Tidak Lulus',       value: summary.tidak_lulus,  color: 'text-red-600',       suffix: '' },
                    { label: 'Rata-rata Skor',    value: summary.avg_score,    color: config.kpiAvgColor,   suffix: '%' },
                    { label: 'Coverage Karyawan', value: summary.coverage_pct, color: 'text-orange-600',    suffix: '%' },
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
            <div className={cn('grid grid-cols-1 gap-4', config.showDeptChart && 'lg:grid-cols-2')}>
                {config.showDeptChart && (
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
                                        <Tooltip formatter={(v) => [`${v}%`, 'Pass Rate']} />
                                        <Bar dataKey="pass_rate" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                )}

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
                                    <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v) => [`${v}%`, 'Pass Rate']} labelFormatter={(label) => fmtMonth(String(label))} />
                                    <Line type="monotone" dataKey="pass_rate" stroke={config.lineColor} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Soal Lemah ── */}
            <Card>
                <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setShowWeak(v => !v)}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                            Soal Paling Sering Salah
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                                (Top 10{config.showTagsInWeakQuestions ? ' — identifikasi celah pengetahuan' : ''})
                            </span>
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
                                    {config.showTagsInWeakQuestions && (
                                        <th className="px-4 py-2 text-left font-medium">Dept</th>
                                    )}
                                    <th className="px-4 py-2 text-right font-medium">Salah</th>
                                    <th className="px-4 py-2 text-right font-medium">% Salah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {weak_questions.length === 0 && (
                                    <tr><td colSpan={config.showTagsInWeakQuestions ? 5 : 4} className="py-6 text-center text-muted-foreground">Belum ada data.</td></tr>
                                )}
                                {weak_questions.map((q, i) => (
                                    <tr key={q.question_id} className="hover:bg-muted/30">
                                        <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                                        <td className="px-4 py-2.5 max-w-xs">
                                            <p className="line-clamp-2 leading-snug">{q.question ?? '-'}</p>
                                        </td>
                                        {config.showTagsInWeakQuestions && (
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <span>{q.departemen ?? '-'}</span>
                                                    <Badge variant="outline" className="text-[10px] w-fit">{q.tags === 'S' ? 'Staff' : 'Non Staff'}</Badge>
                                                </div>
                                            </td>
                                        )}
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
                <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setShowUncovered(v => !v)}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                            {config.uncoveredLabel}
                            {uncovered_users.length > 0 && (
                                <Badge variant="destructive" className="ml-2 text-xs">{uncovered_users.length}</Badge>
                            )}
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
                                    <th className="px-4 py-2 text-left font-medium">{config.uncoveredSecondColLabel}</th>
                                    <th className="px-4 py-2 text-left font-medium">Site</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {uncovered_users.length === 0 && (
                                    <tr><td colSpan={3} className="py-6 text-center text-green-600 font-medium">{config.uncoveredAllDoneMessage}</td></tr>
                                )}
                                {uncovered_users.map(u => (
                                    <tr key={u.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-2.5">
                                            <p className="font-medium">{u.name}</p>
                                            <p className="text-xs text-muted-foreground">{u.nik ?? '-'}</p>
                                        </td>
                                        <td className="px-4 py-2.5">{u[config.uncoveredSecondColKey] ?? '-'}</td>
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
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{config.historyLabel}</h3>
                    {config.deleteRoute && (
                        <div className="flex gap-2">
                            {selectMode ? (
                                <>
                                    <Button size="sm" variant="outline" onClick={toggleSelectAll}>
                                        {selectedIds.size === records.data.length ? 'Batal Semua' : 'Pilih Semua'}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={exitSelectMode}>Selesai</Button>
                                </>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => setSelectMode(true)}>Pilih</Button>
                            )}
                        </div>
                    )}
                </div>
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

                    {config.showDeptFilter && (
                        <Select value={filters.departemen ?? 'all'} onValueChange={v => applyFilters({ departemen: v })}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Departemen" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Departemen</SelectItem>
                                {DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}

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
                                {selectMode && (
                                    <th className="px-4 py-3 w-10">
                                        <Checkbox
                                            checked={selectedIds.size === records.data.length && records.data.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="px-4 py-3 text-left font-medium">Karyawan</th>
                                {config.showDeptFilter && <th className="px-4 py-3 text-left font-medium">Departemen</th>}
                                {config.showTagsInWeakQuestions && <th className="px-4 py-3 text-left font-medium">Level</th>}
                                <th className="px-4 py-3 text-right font-medium">Skor</th>
                                <th className="px-4 py-3 text-right font-medium">Persentase</th>
                                <th className="px-4 py-3 text-center font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                                {config.deleteRoute && !selectMode && <th className="px-4 py-3 text-center font-medium">Hapus</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {records.data.length === 0 && (
                                <tr>
                                    <td colSpan={config.showDeptFilter ? 7 : 5} className="py-10 text-center text-muted-foreground">Tidak ada data.</td>
                                </tr>
                            )}
                            {records.data.map(r => (
                                <tr
                                    key={r.id}
                                    className="hover:bg-muted/30 transition-colors"
                                >
                                    {selectMode && (
                                        <td className="px-4 py-3">
                                            <Checkbox
                                                checked={selectedIds.has(r.id)}
                                                onCheckedChange={() => toggleSelect(r.id)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-4 py-3 cursor-pointer" onClick={() => openDrill(r)}>
                                        <p className="font-medium hover:underline">{r.user.name}</p>
                                        <p className="text-xs text-muted-foreground">{r.user.nik ?? '-'} · {r.user.site ?? '-'}</p>
                                    </td>
                                    {config.showDeptFilter && <td className="px-4 py-3">{r.departemen ?? '-'}</td>}
                                    {config.showTagsInWeakQuestions && (
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="text-xs">
                                                {r.tags === 'S' ? 'Staff' : 'Non Staff'}
                                            </Badge>
                                        </td>
                                    )}
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
                                    {config.deleteRoute && !selectMode && (
                                        <td className="px-4 py-3 text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={(e) => {
 e.stopPropagation(); setToDelete(r); 
}}
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        </td>
                                    )}
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

            {/* ── Absensi Induksi ── */}
            <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-teal-600" />
                        Absensi Induksi {config.inductionLabel}
                    </h3>
                    <a href={config.inductionExportUrl}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" /> Export Excel
                        </Button>
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <Card className="border-teal-200 bg-teal-50 dark:bg-teal-950/20">
                        <CardContent className="p-4">
                            <p className="text-xs text-teal-600 font-medium">Sudah Tercatat</p>
                            <p className="text-2xl font-bold text-teal-700">{attendance_summary.total_tercatat}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                        <CardContent className="p-4 flex items-start justify-between">
                            <div>
                                <p className="text-xs text-orange-600 font-medium">Belum Induksi</p>
                                <p className="text-2xl font-bold text-orange-700">{attendance_summary.belum_tercatat}</p>
                            </div>
                            {attendance_summary.belum_tercatat > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-orange-600 hover:text-orange-700 text-xs h-auto p-1"
                                    onClick={() => setShowBelumInduksi(true)}
                                >
                                    Lihat →
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="py-3 px-4 cursor-pointer select-none" onClick={() => setShowAttendance(v => !v)}>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Daftar Absensi Terbaru</CardTitle>
                            {showAttendance ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                    </CardHeader>
                    {showAttendance && (
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-muted-foreground">
                                        <th className="px-4 py-2.5 text-left font-medium">Nama</th>
                                        {config.attendanceShowDept && <th className="px-4 py-2.5 text-left font-medium">Departemen</th>}
                                        <th className="px-4 py-2.5 text-left font-medium">Site</th>
                                        <th className="px-4 py-2.5 text-left font-medium">Tanggal Absensi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {attendance_summary.records.length === 0 && (
                                        <tr><td colSpan={config.attendanceShowDept ? 4 : 3} className="py-6 text-center text-muted-foreground">Belum ada data absensi.</td></tr>
                                    )}
                                    {attendance_summary.records.map((a, i) => (
                                        <tr key={i} className="hover:bg-muted/30">
                                            <td className="px-4 py-2.5">
                                                <p className="font-medium">{a.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{a.user.nik ?? '-'}</p>
                                            </td>
                                            {config.attendanceShowDept && (
                                                <td className="px-4 py-2.5">{a.user.departemen ?? '-'}</td>
                                            )}
                                            <td className="px-4 py-2.5 text-muted-foreground">{a.user.site ?? '-'}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">
                                                {new Date(a.attended_at).toLocaleString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    )}
                </Card>
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

            {/* ── Delete Modal ── */}
            {config.deleteRoute && (
                <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Data Assessment</DialogTitle>
                            <DialogDescription>
                                Yakin ingin menghapus data assessment milik <strong>{toDelete?.user.name}</strong> tanggal{' '}
                                {toDelete ? new Date(toDelete.completed_at).toLocaleDateString('id-ID') : ''}?
                                Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setToDelete(null)}>Batal</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Menghapus...' : 'Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ── Batch Delete Confirm Modal ── */}
            {config.batchDeleteRoute && (
                <Dialog open={showBatchConfirm} onOpenChange={(open) => !open && setShowBatchConfirm(false)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus {selectedIds.size} Data Assessment</DialogTitle>
                            <DialogDescription>
                                Yakin ingin menghapus <strong>{selectedIds.size}</strong> data yang dipilih?
                                Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowBatchConfirm(false)} disabled={batchDeleting}>Batal</Button>
                            <Button variant="destructive" onClick={handleBatchDelete} disabled={batchDeleting}>
                                {batchDeleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {config.batchDeleteRoute && (
                <BatchDeleteBar
                    count={selectedIds.size}
                    onDelete={() => setShowBatchConfirm(true)}
                    onCancel={exitSelectMode}
                    deleting={batchDeleting}
                />
            )}

            {/* ── Belum Induksi Modal ── */}
            <Dialog open={showBelumInduksi} onOpenChange={setShowBelumInduksi}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Karyawan Belum Induksi {config.inductionLabel} ({attendance_summary.belum_users.length})</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground">
                                    <th className="px-3 py-2 text-left font-medium">Nama</th>
                                    {config.belumIndukeShowDept && <th className="px-3 py-2 text-left font-medium">Departemen</th>}
                                    <th className="px-3 py-2 text-left font-medium">Site</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {attendance_summary.belum_users.length === 0 && (
                                    <tr>
                                        <td colSpan={config.belumIndukeShowDept ? 3 : 2} className="py-6 text-center text-green-600 font-medium">
                                            {config.belumIndukeAllDoneMessage}
                                        </td>
                                    </tr>
                                )}
                                {attendance_summary.belum_users.map(u => (
                                    <tr key={u.id} className="hover:bg-muted/30">
                                        <td className="px-3 py-2">
                                            <p className="font-medium">{u.name}</p>
                                            <p className="text-xs text-muted-foreground">{u.nik ?? '-'}</p>
                                        </td>
                                        {config.belumIndukeShowDept && (
                                            <td className="px-3 py-2">{u.departemen ?? '-'}</td>
                                        )}
                                        <td className="px-3 py-2 text-muted-foreground">{u.site ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
