import { Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Download,
    FileQuestion,
    Lock,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { AdminTitle } from '@/components/admin/admin-title';
import {
    adminButton,
    chipClass,
    DataTable,
    FilterBar,
    MoreMenu,
    rowClass,
    SearchField,
    SelectionAction,
    SelectionBar,
    TableCard,
    TableEmpty,
    TablePager,
    theadRowClass,
} from '@/components/admin/data-table';
import DateRangeFilter from '@/components/admin/DateRangeFilter';
import DeleteRangeDialog from '@/components/admin/DeleteRangeDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    user: {
        id: number;
        name: string;
        nik?: string | null;
        jabatan?: string | null;
        site?: string | null;
    };
};

export type Summary = {
    total: number;
    lulus: number;
    tidak_lulus: number;
    avg_score: number;
    coverage_pct: number;
};

export type DeptStat = {
    departemen: string;
    total: number;
    lulus: number;
    pass_rate: number;
};
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
    user: {
        id: number;
        name: string;
        nik?: string | null;
        departemen?: string | null;
        jabatan?: string | null;
        site?: string | null;
    };
    attended_at: string;
    session_id: number;
};

export type AttendanceSummary = {
    total_tercatat: number;
    belum_tercatat: number;
    records: AttendanceRecord[];
    belum_users: UncoveredUser[];
};

export type Filters = {
    search?: string;
    departemen?: string;
    passed?: string;
    date_from?: string;
    date_to?: string;
};

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
    exportUrl: string;
    questionStatsExportUrl: string;
    manageQuestionsUrl: string;
    inductionLabel: string;
    inductionExportUrl: string;
    attendanceShowDept: boolean;
    belumIndukeShowDept: boolean;
    belumIndukeAllDoneMessage: string;
    deleteRoute?: string;
    batchDeleteRoute?: string;
    deleteRangeRoute?: string;
};

export type Props = {
    records: {
        data: SessionRecord[];
        from?: number | null;
        to?: number | null;
        total: number;
        next_page_url: string | null;
        prev_page_url: string | null;
    };
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
    records,
    filters,
    summary,
    dept_stats = [],
    monthly_trend,
    weak_questions,
    uncovered_users,
    attendance_summary,
    config,
}: Props & { config: AssessmentConfig }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showWeak, setShowWeak] = useState(false);
    const [showUncovered, setShowUncovered] = useState(false);
    const [showAttendance, setShowAttendance] = useState(false);
    const [showBelumInduksi, setShowBelumInduksi] = useState(false);
    const [drillUser, setDrillUser] = useState<{
        name: string;
        records: SessionRecord[];
    } | null>(null);
    const [toDelete, setToDelete] = useState<SessionRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteRange, setShowDeleteRange] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [showBatchConfirm, setShowBatchConfirm] = useState(false);
    const passRate =
        summary.total > 0
            ? Math.round((summary.lulus / summary.total) * 100)
            : 0;
    const topWeakQuestion = weak_questions[0];
    const allRecordsSelected =
        records.data.length > 0 &&
        records.data.every((r) => selectedIds.has(r.id));

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
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
        if (allRecordsSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(records.data.map((r) => r.id)));
        }
    };
    const exitSelectMode = () => {
        setSelectedIds(new Set());
    };

    const handleDelete = () => {
        if (!toDelete || !config.deleteRoute) {
            return;
        }

        setDeleting(true);
        router.delete(`${config.deleteRoute}/${toDelete.id}`, {
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
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
                setBatchDeleting(false);
                setShowBatchConfirm(false);
                exitSelectMode();
            },
        });
    };

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        const cleaned = Object.fromEntries(
            Object.entries(merged).filter(
                ([, v]) => v !== undefined && v !== 'all',
            ),
        ) as Filters;
        router.get(config.route, cleaned, {
            preserveState: true,
            replace: true,
        });
    };

    const openDrill = (row: SessionRecord) => {
        const userRecords = records.data.filter(
            (r) => r.user.id === row.user.id,
        );
        setDrillUser({ name: row.user.name, records: userRecords });
    };

    const exportUrl = `${config.exportUrl}${(() => {
        const p = new URLSearchParams();

        if (filters.search) {
            p.set('search', filters.search);
        }

        if (filters.departemen) {
            p.set('departemen', filters.departemen);
        }

        if (filters.passed) {
            p.set('passed', filters.passed);
        }

        if (filters.date_from) {
            p.set('date_from', filters.date_from);
        }

        if (filters.date_to) {
            p.set('date_to', filters.date_to);
        }

        const qs = p.toString();

        return qs ? '?' + qs : '';
    })()}`;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <AdminTitle
                    eyebrow="Assessment"
                    title={config.heading}
                    description={config.subtitle}
                />
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={config.manageQuestionsUrl}
                        className={adminButton}
                    >
                        <FileQuestion /> Bank soal
                    </Link>
                    <a href={exportUrl} className={adminButton}>
                        <Download /> Ekspor Excel
                    </a>
                    <MoreMenu>
                        <DropdownMenuItem asChild>
                            <a href={config.questionStatsExportUrl}>
                                <Download /> Ekspor analisa soal
                            </a>
                        </DropdownMenuItem>
                        {config.deleteRangeRoute && (
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setShowDeleteRange(true)}
                            >
                                <Lock /> Hapus rentang tanggal
                            </DropdownMenuItem>
                        )}
                    </MoreMenu>
                </div>
            </div>

            {/* Ringkasan utama */}
            <div className="-mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                    Ringkasan Seluruh Data
                </h3>
                <span className="text-xs text-muted-foreground">
                    Tidak mengikuti filter riwayat
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                {[
                    {
                        label: 'Total Assessment',
                        value: summary.total,
                        color: config.kpiTotalColor,
                        suffix: '',
                        detail: 'Percobaan tercatat',
                    },
                    {
                        label: 'Tingkat Kelulusan',
                        value: passRate,
                        color: 'text-success',
                        suffix: '%',
                        detail: `${summary.lulus} lulus · ${summary.tidak_lulus} belum lulus`,
                    },
                    {
                        label: 'Rata-rata Skor',
                        value: summary.avg_score,
                        color: config.kpiAvgColor,
                        suffix: '%',
                        detail: 'Dari seluruh percobaan',
                    },
                    {
                        label: 'Coverage Karyawan',
                        value: summary.coverage_pct,
                        color: 'text-warning',
                        suffix: '%',
                        detail: `${uncovered_users.length} belum assessment`,
                    },
                    {
                        label: 'Sudah Induksi',
                        value: attendance_summary.total_tercatat,
                        color: 'text-info',
                        suffix: '',
                        detail: `Induksi ${config.inductionLabel}`,
                    },
                    {
                        label: 'Belum Induksi',
                        value: attendance_summary.belum_tercatat,
                        color: 'text-warning',
                        suffix: '',
                        detail: 'Perlu tindak lanjut',
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="flex flex-col gap-2 rounded-[18px] border border-border bg-card p-4"
                    >
                        <span className="text-xs font-semibold text-muted-foreground">
                            {item.label}
                        </span>
                        <span className="tabular text-[28px] leading-none font-extrabold tracking-tight">
                            {item.value}
                            {item.suffix}
                        </span>
                        <span className={cn('text-xs font-semibold', item.color)}>
                            {item.detail}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <Card
                    className={cn(
                        'shadow-none',
                        uncovered_users.length > 0 && 'border-warning/30',
                    )}
                >
                    <CardContent className="flex items-start gap-3 p-4">
                        <div className="rounded-lg bg-warning-soft p-2 text-warning">
                            <Users className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                                {config.uncoveredLabel}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {uncovered_users.length > 0
                                    ? `${uncovered_users.length} karyawan belum tercakup. ${uncovered_users
                                          .slice(0, 2)
                                          .map((u) => u.name)
                                          .join(
                                              ', ',
                                          )}${uncovered_users.length > 2 ? ' dan lainnya' : ''}.`
                                    : 'Semua karyawan sudah tercakup.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setShowUncovered(true);
                                document
                                    .getElementById('uncovered-assessment')
                                    ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            disabled={uncovered_users.length === 0}
                        >
                            Lihat
                        </Button>
                    </CardContent>
                </Card>
                <Card
                    className={cn(
                        'shadow-none',
                        topWeakQuestion && 'border-destructive/30',
                    )}
                >
                    <CardContent className="flex items-start gap-3 p-4">
                        <div className="rounded-lg bg-destructive-soft p-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                                Soal Paling Sering Salah
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {topWeakQuestion
                                    ? `${topWeakQuestion.pct_salah}% salah dari ${topWeakQuestion.total_attempt} percobaan · ${topWeakQuestion.question ?? 'Soal tidak tersedia'}`
                                    : 'Belum ada data jawaban soal.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setShowWeak(true);
                                document
                                    .getElementById('weak-assessment-questions')
                                    ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            disabled={!topWeakQuestion}
                        >
                            Lihat
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ── Charts ── */}
            <div
                className={cn(
                    'grid grid-cols-1 gap-4',
                    config.showDeptChart && 'lg:grid-cols-2',
                )}
            >
                {config.showDeptChart && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">
                                Pass Rate per Departemen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dept_stats.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Belum ada data.
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart
                                        data={dept_stats}
                                        layout="vertical"
                                        margin={{ left: 16, right: 24 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            domain={[0, 100]}
                                            tickFormatter={(v) => `${v}%`}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="departemen"
                                            tick={{ fontSize: 11 }}
                                            width={90}
                                        />
                                        <Tooltip
                                            formatter={(v) => [
                                                `${v}%`,
                                                'Pass Rate',
                                            ]}
                                        />
                                        <Bar
                                            dataKey="pass_rate"
                                            fill="#6366f1"
                                            radius={[0, 4, 4, 0]}
                                            maxBarSize={20}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">
                            Tren Pass Rate Bulanan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthly_trend.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Belum ada data 6 bulan terakhir.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart
                                    data={monthly_trend}
                                    margin={{ left: 0, right: 16 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={fmtMonth}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={(v) => `${v}%`}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <Tooltip
                                        formatter={(v) => [
                                            `${v}%`,
                                            'Pass Rate',
                                        ]}
                                        labelFormatter={(label) =>
                                            fmtMonth(String(label))
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pass_rate"
                                        stroke={config.lineColor}
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
            <Card id="weak-assessment-questions">
                <CardHeader
                    className="cursor-pointer pb-2 select-none"
                    onClick={() => setShowWeak((v) => !v)}
                >
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                            Soal Paling Sering Salah
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                (Top 10
                                {config.showTagsInWeakQuestions
                                    ? ' — identifikasi celah pengetahuan'
                                    : ''}
                                )
                            </span>
                        </CardTitle>
                        {showWeak ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </div>
                </CardHeader>
                {showWeak && (
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                    <th className="px-4 py-2 text-left">#</th>
                                    <th className="px-4 py-2 text-left">
                                        Soal
                                    </th>
                                    {config.showTagsInWeakQuestions && (
                                        <th className="px-4 py-2 text-left">
                                            Dept
                                        </th>
                                    )}
                                    <th className="px-4 py-2 text-right">
                                        Salah
                                    </th>
                                    <th className="px-4 py-2 text-right">
                                        % Salah
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {weak_questions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                config.showTagsInWeakQuestions
                                                    ? 5
                                                    : 4
                                            }
                                            className="py-6 text-center text-muted-foreground"
                                        >
                                            Belum ada data.
                                        </td>
                                    </tr>
                                )}
                                {weak_questions.map((q, i) => (
                                    <tr
                                        key={q.question_id}
                                        className="hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {i + 1}
                                        </td>
                                        <td className="max-w-xs px-4 py-2.5">
                                            <p className="line-clamp-2 leading-snug">
                                                {q.question ?? '-'}
                                            </p>
                                        </td>
                                        {config.showTagsInWeakQuestions && (
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <span>
                                                        {q.departemen ?? '-'}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="w-fit text-[11px]"
                                                    >
                                                        {q.tags === 'S'
                                                            ? 'Staff'
                                                            : 'Non Staff'}
                                                    </Badge>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-4 py-2.5 text-right">
                                            {q.total_salah} / {q.total_attempt}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <span
                                                className={cn(
                                                    'font-semibold',
                                                    q.pct_salah >= 60
                                                        ? 'text-destructive'
                                                        : q.pct_salah >= 40
                                                          ? 'text-warning'
                                                          : 'text-muted-foreground',
                                                )}
                                            >
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
            <Card id="uncovered-assessment">
                <CardHeader
                    className="cursor-pointer pb-2 select-none"
                    onClick={() => setShowUncovered((v) => !v)}
                >
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                            {config.uncoveredLabel}
                            {uncovered_users.length > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="ml-2 text-xs"
                                >
                                    {uncovered_users.length}
                                </Badge>
                            )}
                        </CardTitle>
                        {showUncovered ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </div>
                </CardHeader>
                {showUncovered && (
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                    <th className="px-4 py-2 text-left">
                                        Karyawan
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        {config.uncoveredSecondColLabel}
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Site
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {uncovered_users.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="py-6 text-center font-medium text-success"
                                        >
                                            {config.uncoveredAllDoneMessage}
                                        </td>
                                    </tr>
                                )}
                                {uncovered_users.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-2.5">
                                            <p className="font-medium">
                                                {u.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {u.nik ?? '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            {u[config.uncoveredSecondColKey] ??
                                                '-'}
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {u.site ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                )}
            </Card>

            {/* ── Riwayat assessment (ATabel pattern) ── */}
            <div className="flex flex-col gap-3">
                <div>
                    <h2 className="text-base font-bold">
                        {config.historyLabel}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Klik nama untuk melihat riwayat karyawan tersebut.
                    </p>
                </div>
                <FilterBar>
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        onSubmit={() => applyFilters({ search })}
                        placeholder="Cari nama atau NIK…"
                        label="Cari peserta"
                    />
                    {config.showDeptFilter && (
                        <Select
                            value={filters.departemen ?? 'all'}
                            onValueChange={(v) =>
                                applyFilters({ departemen: v })
                            }
                        >
                            <SelectTrigger
                                className={chipClass(!!filters.departemen)}
                                aria-label="Departemen"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Departemen: semua
                                </SelectItem>
                                {DEPTS.map((d) => (
                                    <SelectItem key={d} value={d}>
                                        {d}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Select
                        value={filters.passed ?? 'all'}
                        onValueChange={(v) => applyFilters({ passed: v })}
                    >
                        <SelectTrigger
                            className={chipClass(!!filters.passed)}
                            aria-label="Status"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Status: semua</SelectItem>
                            <SelectItem value="1">Lulus</SelectItem>
                            <SelectItem value="0">Tidak lulus</SelectItem>
                        </SelectContent>
                    </Select>
                    <DateRangeFilter
                        dateFrom={filters.date_from}
                        dateTo={filters.date_to}
                        onChange={(v) => applyFilters(v)}
                    />
                </FilterBar>

                <SelectionBar count={selectedIds.size} onClear={exitSelectMode}>
                    <SelectionAction
                        onClick={() => setShowBatchConfirm(true)}
                        disabled={batchDeleting}
                    >
                        <Trash2 /> Hapus
                    </SelectionAction>
                </SelectionBar>

                <TableCard
                    footer={
                        <TablePager
                            from={records.from}
                            to={records.to}
                            total={records.total}
                            prev={records.prev_page_url}
                            next={records.next_page_url}
                        />
                    }
                >
                    {records.data.length === 0 ? (
                        <TableEmpty>Tidak ada data.</TableEmpty>
                    ) : (
                        <DataTable className="min-w-[760px]">
                            <thead>
                                <tr className={theadRowClass}>
                                    {config.batchDeleteRoute && (
                                        <th className="w-12">
                                            <Checkbox
                                                checked={
                                                    allRecordsSelected
                                                        ? true
                                                        : selectedIds.size > 0
                                                          ? 'indeterminate'
                                                          : false
                                                }
                                                onCheckedChange={
                                                    toggleSelectAll
                                                }
                                                aria-label="Pilih semua di halaman ini"
                                            />
                                        </th>
                                    )}
                                    <th>Tanggal</th>
                                    <th>Peserta</th>
                                    {config.showDeptFilter && (
                                        <th>Departemen</th>
                                    )}
                                    {config.showTagsInWeakQuestions && (
                                        <th>Level</th>
                                    )}
                                    <th className="text-right">Skor</th>
                                    <th>Status</th>
                                    {config.deleteRoute && (
                                        <th>
                                            <span className="sr-only">
                                                Aksi
                                            </span>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.map((r) => {
                                    const selected = selectedIds.has(r.id);

                                    return (
                                        <tr
                                            key={r.id}
                                            className={rowClass(selected)}
                                        >
                                            {config.batchDeleteRoute && (
                                                <td>
                                                    <Checkbox
                                                        checked={selected}
                                                        onCheckedChange={() =>
                                                            toggleSelect(r.id)
                                                        }
                                                        aria-label={'Pilih ' + r.user.name}
                                                    />
                                                </td>
                                            )}
                                            <td className="tabular whitespace-nowrap text-muted-foreground">
                                                {new Date(
                                                    r.completed_at,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => openDrill(r)}
                                                    className="block max-w-[200px] truncate text-left font-semibold hover:underline"
                                                >
                                                    {r.user.name}
                                                </button>
                                                <span className="tabular block text-xs text-muted-foreground">
                                                    {r.user.nik ?? '—'} ·{' '}
                                                    {r.user.site ?? '—'}
                                                </span>
                                            </td>
                                            {config.showDeptFilter && (
                                                <td>{r.departemen ?? '—'}</td>
                                            )}
                                            {config.showTagsInWeakQuestions && (
                                                <td>
                                                    <Badge variant="neutral">
                                                        {r.tags === 'S'
                                                            ? 'Staff'
                                                            : 'Non-staff'}
                                                    </Badge>
                                                </td>
                                            )}
                                            <td className="tabular text-right whitespace-nowrap">
                                                <span className="font-bold">
                                                    {Number(
                                                        r.percentage,
                                                    ).toFixed(0)}
                                                    %
                                                </span>{' '}
                                                <span className="text-xs text-muted-foreground">
                                                    {r.score}/{r.total_questions}
                                                </span>
                                            </td>
                                            <td>
                                                {r.passed ? (
                                                    <Badge variant="success">
                                                        Lulus
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="danger">
                                                        Tidak lulus
                                                    </Badge>
                                                )}
                                            </td>
                                            {config.deleteRoute && (
                                                <td className="text-right">
                                                    <button
                                                        type="button"
                                                        className="inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                                                        aria-label={'Hapus ' + r.user.name}
                                                        onClick={() =>
                                                            setToDelete(r)
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </DataTable>
                    )}
                </TableCard>
            </div>

            {/* ── Absensi Induksi ── */}
            <div className="border-t pt-2">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <ClipboardCheck className="h-4 w-4 text-info" />
                        Absensi Induksi {config.inductionLabel}
                    </h3>
                    <a href={config.inductionExportUrl}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" /> Export Excel
                        </Button>
                    </a>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-3">
                    <Card className="border-info/30 bg-info-soft">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-info">
                                Sudah Tercatat
                            </p>
                            <p className="text-2xl font-bold text-info">
                                {attendance_summary.total_tercatat}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-warning/30 bg-warning-soft">
                        <CardContent className="flex items-start justify-between p-4">
                            <div>
                                <p className="text-xs font-medium text-warning">
                                    Belum Induksi
                                </p>
                                <p className="text-2xl font-bold text-warning">
                                    {attendance_summary.belum_tercatat}
                                </p>
                            </div>
                            {attendance_summary.belum_tercatat > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 text-xs text-warning hover:text-warning"
                                    onClick={() => setShowBelumInduksi(true)}
                                >
                                    Lihat →
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader
                        className="cursor-pointer px-4 py-3 select-none"
                        onClick={() => setShowAttendance((v) => !v)}
                    >
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">
                                Daftar Absensi Terbaru
                            </CardTitle>
                            {showAttendance ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </div>
                    </CardHeader>
                    {showAttendance && (
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                        <th className="px-4 py-2.5 text-left">
                                            Nama
                                        </th>
                                        {config.attendanceShowDept && (
                                            <th className="px-4 py-2.5 text-left">
                                                Departemen
                                            </th>
                                        )}
                                        <th className="px-4 py-2.5 text-left">
                                            Site
                                        </th>
                                        <th className="px-4 py-2.5 text-left">
                                            Tanggal Absensi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {attendance_summary.records.length ===
                                        0 && (
                                        <tr>
                                            <td
                                                colSpan={
                                                    config.attendanceShowDept
                                                        ? 4
                                                        : 3
                                                }
                                                className="py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada data absensi.
                                            </td>
                                        </tr>
                                    )}
                                    {attendance_summary.records.map((a, i) => (
                                        <tr
                                            key={i}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-2.5">
                                                <p className="font-medium">
                                                    {a.user.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {a.user.nik ?? '-'}
                                                </p>
                                            </td>
                                            {config.attendanceShowDept && (
                                                <td className="px-4 py-2.5">
                                                    {a.user.departemen ?? '-'}
                                                </td>
                                            )}
                                            <td className="px-4 py-2.5 text-muted-foreground">
                                                {a.user.site ?? '-'}
                                            </td>
                                            <td className="px-4 py-2.5 text-muted-foreground">
                                                {new Date(
                                                    a.attended_at,
                                                ).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
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
                                <tr className="border-b border-border text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                    <th className="px-3 py-2 text-left">
                                        Tanggal
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                        Skor
                                    </th>
                                    <th className="px-3 py-2 text-right">%</th>
                                    <th className="px-3 py-2 text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {drillUser?.records.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {new Date(
                                                r.completed_at,
                                            ).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {r.score}/{r.total_questions}
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium">
                                            {Number(r.percentage).toFixed(0)}%
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {r.passed ? (
                                                <CheckCircle2 className="inline h-4 w-4 text-success" />
                                            ) : (
                                                <XCircle className="inline h-4 w-4 text-destructive" />
                                            )}
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
                <Dialog
                    open={!!toDelete}
                    onOpenChange={() => setToDelete(null)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Data Assessment</DialogTitle>
                            <DialogDescription>
                                Yakin ingin menghapus data assessment milik{' '}
                                <strong>{toDelete?.user.name}</strong> tanggal{' '}
                                {toDelete
                                    ? new Date(
                                          toDelete.completed_at,
                                      ).toLocaleDateString('id-ID')
                                    : ''}
                                ? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setToDelete(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Menghapus...' : 'Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ── Batch Delete Confirm Modal ── */}
            {config.batchDeleteRoute && (
                <Dialog
                    open={showBatchConfirm}
                    onOpenChange={(open) => !open && setShowBatchConfirm(false)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Hapus {selectedIds.size} Data Assessment
                            </DialogTitle>
                            <DialogDescription>
                                Yakin ingin menghapus{' '}
                                <strong>{selectedIds.size}</strong> data yang
                                dipilih? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowBatchConfirm(false)}
                                disabled={batchDeleting}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleBatchDelete}
                                disabled={batchDeleting}
                            >
                                {batchDeleting
                                    ? 'Menghapus...'
                                    : 'Ya, Hapus Semua'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}


            {config.deleteRangeRoute && (
                <DeleteRangeDialog
                    open={showDeleteRange}
                    onOpenChange={setShowDeleteRange}
                    endpoint={config.deleteRangeRoute}
                    title={`Hapus ${config.historyLabel}`}
                    description={`Ini akan menghapus permanen seluruh ${config.historyLabel} pada rentang tanggal yang dipilih, di luar filter tampilan saat ini. Tindakan ini tidak dapat dibatalkan.`}
                />
            )}

            {/* ── Belum Induksi Modal ── */}
            <Dialog open={showBelumInduksi} onOpenChange={setShowBelumInduksi}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Karyawan Belum Induksi {config.inductionLabel} (
                            {attendance_summary.belum_users.length})
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-96 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                    <th className="px-3 py-2 text-left">
                                        Nama
                                    </th>
                                    {config.belumIndukeShowDept && (
                                        <th className="px-3 py-2 text-left">
                                            Departemen
                                        </th>
                                    )}
                                    <th className="px-3 py-2 text-left">
                                        Site
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {attendance_summary.belum_users.length ===
                                    0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                config.belumIndukeShowDept
                                                    ? 3
                                                    : 2
                                            }
                                            className="py-6 text-center font-medium text-success"
                                        >
                                            {config.belumIndukeAllDoneMessage}
                                        </td>
                                    </tr>
                                )}
                                {attendance_summary.belum_users.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <td className="px-3 py-2">
                                            <p className="font-medium">
                                                {u.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {u.nik ?? '-'}
                                            </p>
                                        </td>
                                        {config.belumIndukeShowDept && (
                                            <td className="px-3 py-2">
                                                {u.departemen ?? '-'}
                                            </td>
                                        )}
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {u.site ?? '-'}
                                        </td>
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
