import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
    Download, FileText, Minus, SlidersHorizontal, TrendingUp, Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

type DilarangEntry  = { id: number | null; name: string; jabatan: string | null; site: string | null; avatar: string | null };
type ComplianceData = { total_karyawan: number; sudah_submit_bs: number; dilarang_list: DilarangEntry[] };

type WeekCell     = { count: number; target: number; met: boolean | null };
type EmployeeWeek = { laporan: WeekCell; inspeksi: WeekCell; observasi: WeekCell; jsa: WeekCell };
type WeekMeta     = { num: number; start: string; end: string };
type EmployeeRecapRow = {
    id: number; name: string; jabatan: string | null; departemen: string | null;
    level: string; site: string; avatar: string | null;
    weeks: EmployeeWeek[];
};
type EmployeeRecap = { weeks: WeekMeta[]; employees: EmployeeRecapRow[] };
type Filter       = { bulan: number; tahun: number; site: string; departemen: string; level: string; jabatan: string };
type SiteOption   = { value: string; label: string };

type Props = {
    compliance:       ComplianceData;
    employee_recap:   EmployeeRecap;
    filter:           Filter;
    sites:            SiteOption[];
    jabatan_options:  string[];
    admin_site?:      string | null;
    sap_monitoring?:  unknown;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BULAN_NAMES = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

const LEVEL_LABELS: Record<string, string> = {
    nonstaff: 'Non-Staff', staff: 'Staff', srstaff: 'Sr. Staff',
};
const LEVEL_COLORS: Record<string, string> = {
    nonstaff: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    staff:    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    srstaff:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

const DEPT_OPTIONS = ['Management','Production','Maintenance','Supply Chain','Engineering','HSE','HRGA'];

// Warna latar tiap departemen untuk group header
const DEPT_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
    'Production':    { bg: 'bg-orange-50  dark:bg-orange-950/50',  text: 'text-orange-800 dark:text-orange-200',  badge: 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    'Maintenance':   { bg: 'bg-blue-50    dark:bg-blue-950/50',    text: 'text-blue-800   dark:text-blue-200',    badge: 'bg-blue-200   text-blue-800   dark:bg-blue-900   dark:text-blue-200' },
    'Supply Chain':  { bg: 'bg-violet-50  dark:bg-violet-950/50',  text: 'text-violet-800 dark:text-violet-200',  badge: 'bg-violet-200 text-violet-800 dark:bg-violet-900 dark:text-violet-200' },
    'Engineering':   { bg: 'bg-teal-50    dark:bg-teal-950/50',    text: 'text-teal-800   dark:text-teal-200',    badge: 'bg-teal-200   text-teal-800   dark:bg-teal-900   dark:text-teal-200' },
    'HSE':           { bg: 'bg-green-50   dark:bg-green-950/50',   text: 'text-green-800  dark:text-green-200',   badge: 'bg-green-200  text-green-800  dark:bg-green-900  dark:text-green-200' },
    'HRGA':          { bg: 'bg-pink-50    dark:bg-pink-950/50',    text: 'text-pink-800   dark:text-pink-200',    badge: 'bg-pink-200   text-pink-800   dark:bg-pink-900   dark:text-pink-200' },
    'Management':    { bg: 'bg-amber-50   dark:bg-amber-950/50',   text: 'text-amber-800  dark:text-amber-200',   badge: 'bg-amber-200  text-amber-800  dark:bg-amber-900  dark:text-amber-200' },
};
const DEFAULT_DEPT_COLOR = { bg: 'bg-muted/40', text: 'text-foreground', badge: 'bg-muted text-muted-foreground' };

const DEPT_ICONS: Record<string, string> = {
    'Production':   '⚙️', 'Maintenance':  '🔧', 'Supply Chain': '📦',
    'Engineering':  '🏗️', 'HSE':          '🦺', 'HRGA':         '👥',
    'Management':   '🏢',
};

const ACTIVITIES = [
    { key: 'laporan'   as const, label: 'Laporan Bahaya',  unit: 'minggu',  icon: '⚠️' },
    { key: 'inspeksi'  as const, label: 'Inspeksi',         unit: 'minggu',  icon: '🏗️' },
    { key: 'observasi' as const, label: 'Obs. Keselamatan', unit: 'minggu',  icon: '👁️' },
    { key: 'jsa'       as const, label: 'JSA',               unit: 'periode', icon: '📋' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ActivitySummary = { met: number; total: number };

function computeActivitySummary(
    weeks: EmployeeWeek[], key: keyof EmployeeWeek, weekMetas: WeekMeta[],
): ActivitySummary {
    if (key === 'jsa') {
        const seen = new Set<number>();
        let met = 0, total = 0;
        weeks.forEach((w, i) => {
            if (i >= weekMetas.length) {
return;
}

            const period = new Date(weekMetas[i].start).getDate() <= 15 ? 1 : 2;

            if (!seen.has(period)) {
                seen.add(period);

                if (w.jsa.met !== null) {
 total++;

 if (w.jsa.met) {
met++;
} 
}
            }
        });

        return { met, total };
    }

    let met = 0, total = 0;

    for (const w of weeks) {
        const cell = w[key];

        if (cell.met !== null) {
 total++;

 if (cell.met) {
met++;
} 
}
    }

    return { met, total };
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

function FilterBar({ filter, sites, jabatanOptions, adminSite }: {
    filter: Filter; sites: SiteOption[]; jabatanOptions: string[]; adminSite?: string | null | undefined;
}) {
    const { url } = usePage();
    const [open, setOpen] = useState(false);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const apply = (patch: Partial<Filter>) =>
        router.get(url.split('?')[0], { ...filter, ...patch } as Record<string, string | number>, {
            preserveState: false, replace: true,
        });

    const siteLabel = filter.site !== 'all'
        ? (sites.find(s => s.value === filter.site)?.label ?? filter.site)
        : null;

    const activeFilters = [
        siteLabel                   && { label: siteLabel, prefix: '📍' },
        filter.departemen !== 'all' && { label: filter.departemen, prefix: '🏭' },
        filter.level !== 'all'      && { label: LEVEL_LABELS[filter.level] ?? filter.level, prefix: '👤' },
        filter.jabatan !== 'all'    && { label: filter.jabatan, prefix: '💼' },
    ].filter(Boolean) as { label: string; prefix: string }[];

    const activeLabel = `${BULAN_NAMES[filter.bulan - 1]} ${filter.tahun}` +
        (activeFilters.length ? ` · ${activeFilters.length} filter aktif` : '');

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            {/* Header toggle — always visible */}
            <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                        <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold leading-tight">Filter Data</p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{activeLabel}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        {activeFilters.length > 0 && (
                            <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 leading-none">
                                {activeFilters.length}
                            </span>
                        )}
                        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                </button>
            </CollapsibleTrigger>

            {/* Active filter chips — visible when collapsed */}
            {!open && activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1 pt-2">
                    {activeFilters.map((f, i) => (
                        <span key={i} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                            {f.prefix} {f.label}
                        </span>
                    ))}
                </div>
            )}

            {/* Collapsible content */}
            <CollapsibleContent>
                <div className="rounded-xl border bg-card mt-1 px-4 py-3 space-y-3">

                    {/* Periode */}
                    <div className="space-y-1">
                        <p className="text-[11px] font-medium text-muted-foreground">Periode</p>
                        <div className="flex gap-2">
                            <Select value={String(filter.bulan)} onValueChange={v => apply({ bulan: +v })}>
                                <SelectTrigger className="h-9 flex-1 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {BULAN_NAMES.map((name, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={String(filter.tahun)} onValueChange={v => apply({ tahun: +v })}>
                                <SelectTrigger className="h-9 w-24 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Site — otomatis terisi dari site admin, bisa diubah jika perlu */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-medium text-muted-foreground">Site / Lokasi</p>
                            {adminSite && (
                                <span className="text-[10px] text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                                    otomatis dari akun Anda
                                </span>
                            )}
                        </div>
                        <Select value={filter.site} onValueChange={v => apply({ site: v })}>
                            <SelectTrigger className="h-9 w-full text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">🏢 Semua Site</SelectItem>
                                {sites.map(s => (
                                    <SelectItem key={s.value} value={s.value}>
                                        📍 {s.label}{adminSite === s.value ? ' (site Anda)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Departemen & Level */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <p className="text-[11px] font-medium text-muted-foreground">Departemen</p>
                            <Select value={filter.departemen} onValueChange={v => apply({ departemen: v })}>
                                <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Semua" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Dept.</SelectItem>
                                    {DEPT_OPTIONS.map(d => <SelectItem key={d} value={d}>{DEPT_ICONS[d] ?? '🏢'} {d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-medium text-muted-foreground">User Role</p>
                            <Select value={filter.level} onValueChange={v => apply({ level: v })}>
                                <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Semua" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Role</SelectItem>
                                    <SelectItem value="nonstaff">Non-Staff</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="srstaff">Sr. Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Jabatan */}
                    {jabatanOptions.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[11px] font-medium text-muted-foreground">Jabatan / Posisi</p>
                            <Select value={filter.jabatan} onValueChange={v => apply({ jabatan: v })}>
                                <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Semua Jabatan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jabatan</SelectItem>
                                    {jabatanOptions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

// ─── ActivityCell ─────────────────────────────────────────────────────────────

function ActivityCell({ summary }: { summary: ActivitySummary }) {
    const { met, total } = summary;

    if (total === 0) {
        return (
            <div className="flex items-center justify-center py-1">
                <Minus className="h-3 w-3 text-muted-foreground/25" />
            </div>
        );
    }

    const all  = met === total;
    const none = met === 0;
    const circleCls = all ? 'bg-green-500' : none ? 'bg-red-400' : 'bg-amber-400';
    const txtCls    = all ? 'text-green-700 dark:text-green-300' : none ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300';
    const IconEl    = all ? <CheckCircle2 className="h-2.5 w-2.5 text-white" /> : none ? <AlertTriangle className="h-2.5 w-2.5 text-white" /> : <TrendingUp className="h-2.5 w-2.5 text-white" />;

    return (
        <div className="flex flex-col items-center gap-0.5 py-1">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${circleCls}`}>{IconEl}</div>
            <span className={`text-[9px] font-bold tabular-nums leading-none ${txtCls}`}>
                {met}<span className="font-normal opacity-50">/{total}</span>
            </span>
        </div>
    );
}

// ─── ScoreBadge ───────────────────────────────────────────────────────────────

function ScoreBadge({ pct }: { pct: number | null }) {
    if (pct === null) {
return <span className="text-[10px] text-muted-foreground/50">—</span>;
}

    const cls = pct >= 80
        ? 'bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-900 dark:text-green-200 dark:ring-green-700'
        : pct >= 50
        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:ring-amber-700'
        : 'bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900 dark:text-red-300 dark:ring-red-700';

    return (
        <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${cls}`}>
            {pct}%
        </span>
    );
}

// ─── DeptScoreBar ─────────────────────────────────────────────────────────────

function DeptScoreBar({ avg }: { avg: number }) {
    const barCls = avg >= 80 ? 'bg-green-500' : avg >= 50 ? 'bg-amber-400' : 'bg-red-400';

    return (
        <div className="flex items-center gap-1.5 min-w-[60px]">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${barCls}`} style={{ width: `${avg}%` }} />
            </div>
            <span className={`text-[11px] font-bold tabular-nums ${avg >= 80 ? 'text-green-700' : avg >= 50 ? 'text-amber-700' : 'text-red-600'}`}>
                {avg}%
            </span>
        </div>
    );
}

// ─── EmployeeRecapTable ───────────────────────────────────────────────────────

const PAGE_SIZE = 50;

type RowData = {
    emp: EmployeeRecapRow;
    summaries: ({ key: typeof ACTIVITIES[number]['key']; label: string; unit: string; icon: string; summary: ActivitySummary })[];
    score: number | null;
};

function EmployeeRecapTable({ recap, filter, exportRef }: {
    recap: EmployeeRecap; filter: Filter; exportRef: React.RefObject<HTMLDivElement | null>;
}) {
    const { weeks, employees } = recap;
    const bulanLabel = BULAN_NAMES[filter.bulan - 1] ?? '';
    const [page, setPage] = useState(0);

    const allRows = useMemo<RowData[]>(() =>
        employees.map(emp => {
            const summaries = ACTIVITIES.map(act => ({
                ...act,
                summary: computeActivitySummary(emp.weeks, act.key, weeks),
            }));
            let metTotal = 0, appTotal = 0;
            summaries.forEach(({ summary }) => {
 metTotal += summary.met; appTotal += summary.total; 
});

            return { emp, summaries, score: appTotal > 0 ? Math.round(metTotal / appTotal * 100) : null };
        }),
        [employees, weeks]
    );

    const deptGroups = useMemo(() => {
        const map = new Map<string, RowData[]>();

        for (const row of allRows) {
            const dept = row.emp.departemen ?? 'Lainnya';

            if (!map.has(dept)) {
map.set(dept, []);
}

            map.get(dept)!.push(row);
        }

        map.forEach(rows => rows.sort((a, b) => {
            if (a.score === null && b.score === null) {
return 0;
}

            if (a.score === null) {
return 1;
}

            if (b.score === null) {
return -1;
}

            return b.score - a.score;
        }));

        return [...map.entries()].sort(([a], [b]) => {
            const ai = DEPT_OPTIONS.indexOf(a);
            const bi = DEPT_OPTIONS.indexOf(b);

            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
    }, [allRows]);

    // Flatten all rows preserving dept order for pagination
    const flatRows = useMemo(() => deptGroups.flatMap(([dept, rows]) =>
        rows.map(r => ({ ...r, dept }))
    ), [deptGroups]);

    // Reset to page 0 when employees change
    useEffect(() => {
 setPage(0); 
}, [employees]);

    const totalPages = Math.ceil(flatRows.length / PAGE_SIZE);
    const pageRows   = flatRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const agg = useMemo(() => {
        const valid = allRows.filter(r => r.score !== null);

        if (valid.length === 0) {
return null;
}

        const avg  = Math.round(valid.reduce((s, r) => s + (r.score ?? 0), 0) / valid.length);
        const full = valid.filter(r => r.score === 100).length;

        return { avg, full, total: employees.length };
    }, [allRows, employees.length]);

    if (employees.length === 0) {
        return (
            <Card>
                <CardHeader className="px-4 pt-4 pb-2">
                    <p className="text-sm font-bold">📊 Rekap Capaian Karyawan</p>
                    <p className="text-xs text-muted-foreground">{bulanLabel} {filter.tahun}</p>
                </CardHeader>
                <CardContent className="pt-0 pb-10 text-center">
                    <Users className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2 mt-6" />
                    <p className="text-sm font-medium text-muted-foreground">Tidak ada karyawan</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Coba ubah filter di atas</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {/* Section header */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h2 className="text-sm font-bold">📊 Rekap Capaian Karyawan</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {bulanLabel} {filter.tahun} · {employees.length} karyawan · {deptGroups.length} departemen
                    </p>
                </div>
                {agg && (
                    <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${agg.avg >= 80 ? 'text-green-600' : agg.avg >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {agg.avg}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">{agg.full} capai 100%</p>
                    </div>
                )}
            </div>

            {/* Legend — single compact row */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground px-0.5">
                {[
                    { cls: 'bg-green-500', Icon: CheckCircle2,  label: 'Terpenuhi' },
                    { cls: 'bg-amber-400', Icon: TrendingUp,    label: 'Sebagian'  },
                    { cls: 'bg-red-400',   Icon: AlertTriangle, label: 'Belum'     },
                    { cls: 'bg-muted',     Icon: Minus,         label: 'N/A'       },
                ].map(({ cls, Icon, label }) => (
                    <span key={label} className="flex items-center gap-1">
                        <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${cls}`}>
                            <Icon className="h-2 w-2 text-white" />
                        </span>
                        {label}
                    </span>
                ))}
            </div>

            <div ref={exportRef} className="overflow-x-auto rounded-xl border bg-card">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="sticky left-0 top-0 z-20 bg-muted/95 backdrop-blur-sm px-2 py-1.5 text-left border-b border-r border-border min-w-[140px]">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Karyawan</span>
                            </th>
                            {ACTIVITIES.map(act => (
                                <th key={act.key} className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm px-1 py-1.5 text-center border-b border-border min-w-[56px]">
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-xs leading-none">{act.icon}</span>
                                        <span className="text-[9px] font-medium text-muted-foreground leading-tight">{act.label}</span>
                                    </div>
                                </th>
                            ))}
                            <th className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm px-1.5 py-1.5 text-center border-b border-l border-border min-w-[44px]">
                                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Skor</span>
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {pageRows.map((row, i) => {
                            const { emp, summaries, score, dept } = row;
                            const levelCls = LEVEL_COLORS[emp.level] ?? LEVEL_COLORS['staff'];
                            const rowBg    = i % 2 === 0 ? 'bg-background' : 'bg-muted/10';
                            const deptColor = DEPT_COLORS[dept] ?? DEFAULT_DEPT_COLOR;

                            // Show dept header row when dept changes
                            const prevDept = i > 0 ? pageRows[i - 1].dept : null;
                            const showDeptHeader = dept !== prevDept;

                            return (
                                <Fragment key={emp.id}>
                                    {showDeptHeader && (
                                        <tr>
                                            <td colSpan={ACTIVITIES.length + 2} className={`${deptColor.bg} border-b border-t border-border/50 px-2 py-1`}>
                                                <span className={`text-[10px] font-semibold ${deptColor.text}`}>
                                                    {DEPT_ICONS[dept] ?? '🏢'} {dept}
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className={`sticky left-0 z-10 ${rowBg} border-b border-r border-border/40 px-2 py-1`}>
                                            <p className="font-medium text-[11px] leading-tight truncate max-w-[130px]">{emp.name}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className={`inline-flex rounded-full px-1 text-[9px] font-medium leading-tight ${levelCls}`}>
                                                    {LEVEL_LABELS[emp.level] ?? emp.level}
                                                </span>
                                                {emp.jabatan && (
                                                    <span className="text-[9px] text-muted-foreground truncate max-w-[60px] leading-tight">{emp.jabatan}</span>
                                                )}
                                            </div>
                                        </td>
                                        {summaries.map(({ key, summary }) => (
                                            <td key={key} className={`${rowBg} border-b border-border/40 px-0 py-0 text-center`}>
                                                <ActivityCell summary={summary} />
                                            </td>
                                        ))}
                                        <td className={`${rowBg} border-b border-l border-border/40 px-1 py-1 text-center`}>
                                            <ScoreBadge pct={score} />
                                        </td>
                                    </tr>
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] text-muted-foreground">
                        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, flatRows.length)} dari {flatRows.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-[11px] font-medium px-1">{page + 1} / {totalPages}</span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            <p className="text-[10px] text-muted-foreground/60 text-center">
                Geser ke kanan untuk melihat semua kolom →
            </p>
        </div>
    );
}

// ─── ExportButtons ────────────────────────────────────────────────────────────

function ExportButtons({ targetRef, filename }: { targetRef: React.RefObject<HTMLDivElement | null>; filename: string }) {
    const [loading, setLoading] = useState<'png' | 'pdf' | null>(null);

    const exportPng = useCallback(async () => {
        const el = targetRef.current;

        if (!el) {
return;
}

        setLoading('png');

        try {
            const { toPng } = await import('html-to-image');
            // Expand overflow agar seluruh tabel tertangkap
            const prevOverflow = el.style.overflow;
            el.style.overflow = 'visible';
            const dataUrl = await toPng(el, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                width: el.scrollWidth,
                height: el.scrollHeight,
            });
            el.style.overflow = prevOverflow;
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error('Export PNG gagal:', e);
        } finally {
            setLoading(null);
        }
    }, [targetRef, filename]);

    const exportPdf = useCallback(() => {
        setLoading('pdf');
        // Buka print dialog — browser render ke PDF langsung
        const style = document.createElement('style');
        style.id = '__print_override';
        style.innerHTML = `
            @media print {
                body > * { display: none !important; }
                body > #print-target { display: block !important; }
                @page { size: A4 landscape; margin: 12mm; }
            }
        `;
        const wrap = document.createElement('div');
        wrap.id = 'print-target';
        wrap.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:9999;background:#fff;';
        const clone = targetRef.current?.cloneNode(true) as HTMLElement | undefined;

        if (clone) {
            clone.style.cssText = 'overflow:visible;max-height:none;';
            wrap.appendChild(clone);
        }

        document.head.appendChild(style);
        document.body.appendChild(wrap);
        window.print();
        setTimeout(() => {
            document.getElementById('print-target')?.remove();
            document.getElementById('__print_override')?.remove();
            setLoading(null);
        }, 1000);
    }, [targetRef]);

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={exportPng}
                disabled={loading !== null}
            >
                <Download className="h-3.5 w-3.5" />
                {loading === 'png' ? 'Menyimpan…' : 'Simpan PNG'}
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={exportPdf}
                disabled={loading !== null}
            >
                <FileText className="h-3.5 w-3.5" />
                {loading === 'pdf' ? 'Membuka…' : 'Cetak PDF'}
            </Button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_COMPLIANCE: ComplianceData = { total_karyawan: 0, sudah_submit_bs: 0, dilarang_list: [] };
const DEFAULT_FILTER: Filter = {
    bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear(),
    site: 'all', departemen: 'all', level: 'all', jabatan: 'all',
};
const DEFAULT_RECAP: EmployeeRecap = { weeks: [], employees: [] };

export default function AdminIndex({
    compliance: rawCompliance,
    employee_recap  = DEFAULT_RECAP,
    filter          = DEFAULT_FILTER,
    sites           = [],
    jabatan_options = [],
    admin_site,
}: Props) {
    const [dilarangExpanded, setDilarangExpanded] = useState(false);
    const compliance   = rawCompliance ?? DEFAULT_COMPLIANCE;
    const dilarangList = compliance.dilarang_list ?? [];
    const exportRef    = useRef<HTMLDivElement>(null);

    const exportFilename = `monitoring-sap-${BULAN_NAMES[filter.bulan - 1].toLowerCase()}-${filter.tahun}`;

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="space-y-4 pb-10">

                {/* ① DILARANG BEKERJA ALERT */}
                {dilarangList.length > 0 && (
                    <div className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
                        <div className="flex items-center gap-3">
                            <span className="text-xl shrink-0">🚫</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-red-800 dark:text-red-200 text-sm">
                                    {dilarangList.length} karyawan dilarang bekerja hari ini
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                    Berdasarkan hasil Bugar Selamat terbaru
                                </p>
                            </div>
                            <button
                                onClick={() => setDilarangExpanded(v => !v)}
                                className="shrink-0 rounded-lg bg-red-100 dark:bg-red-900 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300"
                            >
                                {dilarangExpanded ? 'Tutup' : 'Lihat'}
                            </button>
                        </div>
                        {dilarangExpanded && (
                            <div className="mt-3 space-y-2">
                                {dilarangList.map((entry, i) => (
                                    <div key={i} className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900 px-3 py-2">
                                        {entry.avatar ? (
                                            <img src={entry.avatar} alt={entry.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-300 dark:bg-red-700 text-sm font-bold text-red-800 dark:text-red-200">
                                                {entry.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-red-900 dark:text-red-100 truncate">{entry.name}</p>
                                            <p className="text-xs text-red-600 dark:text-red-400">{entry.jabatan ?? '-'} · {entry.site ?? '-'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ② PAGE TITLE + EXPORT */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-bold">Monitoring SAP</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {BULAN_NAMES[filter.bulan - 1]} {filter.tahun}
                            {filter.site !== 'all' && <span> · {sites.find(s => s.value === filter.site)?.label ?? filter.site}</span>}
                        </p>
                    </div>
                    <ExportButtons targetRef={exportRef} filename={exportFilename} />
                </div>

                {/* ③ COLLAPSIBLE FILTER */}
                <FilterBar filter={filter} sites={sites} jabatanOptions={jabatan_options} adminSite={admin_site} />

                {/* ④ TABLE */}
                <EmployeeRecapTable recap={employee_recap} filter={filter} exportRef={exportRef} />

            </div>
        </>
    );
}
