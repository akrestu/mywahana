import { Head, router, usePage } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { Overview } from '@/components/admin/admin-overview';
import { AdminOverview } from '@/components/admin/admin-overview';
import { chipClass } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

type DilarangEntry  = { id: number | null; name: string; jabatan: string | null; site: string | null; avatar: string | null };
type ComplianceData = { total_karyawan: number; sudah_submit_bs: number; dilarang_list: DilarangEntry[] };

type Filter       = { bulan: number; tahun: number; site: string; departemen: string; level: string; jabatan: string };
type SiteOption   = { value: string; label: string };

type SapBreakdownRow = {
    level: string; total_users: number;
    on_track: number | null; persen: number | null; total_submissions: number;
};
type SapCategory = {
    label: string; total_submissions: number; persen_on_track: number;
    minggu_berlalu?: number; periode_berlalu?: number; breakdown: SapBreakdownRow[];
};
type SapMonitoring = {
    laporan_bahaya: SapCategory; inspeksi: SapCategory;
    observasi_keselamatan: SapCategory; komunikasi_jsa: SapCategory;
};

type Props = {
    overview?: Overview;
    compliance:       ComplianceData;
    filter:           Filter;
    sites:            SiteOption[];
    jabatan_options:  string[];
    admin_site?:      string | null;
    sap_monitoring?:  SapMonitoring;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BULAN_NAMES = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

const LEVEL_LABELS: Record<string, string> = {
    nonstaff: 'Non-Staff', staff: 'Staff', srstaff: 'Sr. Staff',
};
const DEPT_OPTIONS = ['Management','Production','Maintenance','Supply Chain','Engineering','HSE','HRGA'];

// Warna latar tiap departemen untuk group header
const ACTIVITIES = [
    { key: 'laporan'   as const, label: 'Laporan Bahaya',  unit: 'minggu',  icon: '⚠️' },
    { key: 'inspeksi'  as const, label: 'Inspeksi',         unit: 'minggu',  icon: '🏗️' },
    { key: 'observasi' as const, label: 'Obs. Keselamatan', unit: 'minggu',  icon: '👁️' },
    { key: 'jsa'       as const, label: 'JSA',               unit: 'periode', icon: '📋' },
] as const;

// Peta key ACTIVITIES → key pada payload sap_monitoring dari backend
const SAP_MONITORING_KEY: Record<typeof ACTIVITIES[number]['key'], keyof SapMonitoring> = {
    laporan: 'laporan_bahaya', inspeksi: 'inspeksi',
    observasi: 'observasi_keselamatan', jsa: 'komunikasi_jsa',
};

const DEFAULT_SAP_CATEGORY: SapCategory = { label: '', total_submissions: 0, persen_on_track: 0, breakdown: [] };
const DEFAULT_SAP_MONITORING: SapMonitoring = {
    laporan_bahaya: DEFAULT_SAP_CATEGORY, inspeksi: DEFAULT_SAP_CATEGORY,
    observasi_keselamatan: DEFAULT_SAP_CATEGORY, komunikasi_jsa: DEFAULT_SAP_CATEGORY,
};

function percentTone(persen: number): { text: string; bg: string } {
    if (persen >= 80) {
        return { text: 'text-success', bg: 'bg-success-soft' };
    }

    if (persen >= 50) {
        return { text: 'text-warning', bg: 'bg-warning-soft' };
    }

    return { text: 'text-destructive', bg: 'bg-destructive-soft' };
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

function FilterBar({ filter, sites, jabatanOptions, adminSite }: {
    filter: Filter; sites: SiteOption[]; jabatanOptions: string[]; adminSite?: string | null | undefined;
}) {
    const { url } = usePage();
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
        siteLabel                   && { label: siteLabel, prefix: '' },
        filter.departemen !== 'all' && { label: filter.departemen, prefix: '' },
        filter.level !== 'all'      && { label: LEVEL_LABELS[filter.level] ?? filter.level, prefix: '' },
        filter.jabatan !== 'all'    && { label: filter.jabatan, prefix: '' },
    ].filter(Boolean) as { label: string; prefix: string }[];

    const chip = (on: boolean) => chipClass(on);

    return (
        <div role="group" aria-label="Filter data" className="flex flex-wrap items-center gap-2">
            <Select value={filter.site} onValueChange={v => apply({ site: v })}>
                <SelectTrigger className={chip(filter.site !== 'all')} aria-label="Site"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua site</SelectItem>
                    {sites.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                            {s.label}{adminSite === s.value ? ' (site Anda)' : ''}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={String(filter.bulan)} onValueChange={v => apply({ bulan: +v })}>
                <SelectTrigger className={chip(true)} aria-label="Bulan"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {BULAN_NAMES.map((name, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={String(filter.tahun)} onValueChange={v => apply({ tahun: +v })}>
                <SelectTrigger className={chip(true)} aria-label="Tahun"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filter.departemen} onValueChange={v => apply({ departemen: v })}>
                <SelectTrigger className={chip(filter.departemen !== 'all')} aria-label="Departemen"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Departemen: semua</SelectItem>
                    {DEPT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filter.level} onValueChange={v => apply({ level: v })}>
                <SelectTrigger className={chip(filter.level !== 'all')} aria-label="Level"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Level: semua</SelectItem>
                    <SelectItem value="nonstaff">Non-staff</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="srstaff">Sr. Staff</SelectItem>
                </SelectContent>
            </Select>
            {jabatanOptions.length > 0 && (
                <Select value={filter.jabatan} onValueChange={v => apply({ jabatan: v })}>
                    <SelectTrigger className={chip(filter.jabatan !== 'all')} aria-label="Jabatan"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Jabatan: semua</SelectItem>
                        {jabatanOptions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
            {activeFilters.length > 0 && (
                <button
                    type="button"
                    onClick={() => apply({ site: 'all', departemen: 'all', level: 'all', jabatan: 'all' })}
                    className="h-10 px-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
                >
                    Reset filter
                </button>
            )}
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

// ─── Stat Cards (ringkasan) ─────────────────────────────────────────────────────

function StatTile({ label, value, sub, tone, onClick }: {
    icon?: string; label: string; value: string; sub?: string;
    tone: { text: string; bg: string }; onClick?: () => void;
}) {
    const Comp = onClick ? 'button' : 'div';
    const pct = Number.parseFloat(value);

    return (
        <Comp
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`flex min-w-0 flex-col gap-1.5 rounded-[18px] border border-border bg-card p-4 text-left ${
                onClick ? 'cursor-pointer transition-shadow hover:shadow-[0_8px_24px_oklch(0.191_0_0/0.08)]' : ''
            }`}
        >
            <span className="truncate text-xs font-semibold text-muted-foreground">{label}</span>
            <p className={`text-2xl leading-none font-extrabold tabular ${tone.text}`}>{value}</p>
            {value.endsWith('%') && Number.isFinite(pct) && (
                <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span className={`block h-full rounded-full ${tone.text.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </span>
            )}
            {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
        </Comp>
    );
}

function StatCardsRow({ compliance, sapMonitoring, dilarangExpanded, onToggleDilarang }: {
    compliance: ComplianceData; sapMonitoring: SapMonitoring;
    dilarangExpanded: boolean; onToggleDilarang: () => void;
}) {
    const bsPersen = compliance.total_karyawan > 0
        ? Math.round((compliance.sudah_submit_bs / compliance.total_karyawan) * 100)
        : 0;
    const dilarangCount = compliance.dilarang_list.length;

    return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
            <StatTile
                icon="💪" label="Bugar Selamat"
                value={`${bsPersen}%`}
                sub={`${compliance.sudah_submit_bs}/${compliance.total_karyawan} submit hari ini`}
                tone={percentTone(bsPersen)}
            />

            {ACTIVITIES.map(activity => {
                const cat = sapMonitoring[SAP_MONITORING_KEY[activity.key]];

                return (
                    <StatTile
                        key={activity.key}
                        icon={activity.icon}
                        label={activity.label}
                        value={`${cat.persen_on_track}%`}
                        sub={`${cat.total_submissions} submission`}
                        tone={percentTone(cat.persen_on_track)}
                    />
                );
            })}

            <StatTile
                icon="🚫" label="Dilarang Bekerja"
                value={String(dilarangCount)}
                sub={dilarangCount > 0 ? (dilarangExpanded ? 'Tutup daftar' : 'Lihat daftar') : 'Aman'}
                tone={dilarangCount > 0
                    ? { text: 'text-destructive', bg: 'bg-destructive-soft' }
                    : { text: 'text-success', bg: 'bg-success-soft' }}
                onClick={dilarangCount > 0 ? onToggleDilarang : undefined}
            />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_COMPLIANCE: ComplianceData = { total_karyawan: 0, sudah_submit_bs: 0, dilarang_list: [] };
const DEFAULT_FILTER: Filter = {
    bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear(),
    site: 'all', departemen: 'all', level: 'all', jabatan: 'all',
};

export default function AdminIndex({
    compliance: rawCompliance,
    filter          = DEFAULT_FILTER,
    sites           = [],
    jabatan_options = [],
    admin_site,
    sap_monitoring  = DEFAULT_SAP_MONITORING,
    overview,
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

                {/* ① PAGE TITLE + EXPORT */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-[13px] text-muted-foreground capitalize">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}{overview ? ` · ${overview.employees.toLocaleString('id-ID')} karyawan` : ''}</p>
                        <h1 className="mt-1 text-[30px] leading-tight font-extrabold tracking-tight">Ringkasan lintas modul</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {BULAN_NAMES[filter.bulan - 1]} {filter.tahun}
                            {filter.site !== 'all' && <span> · {sites.find(s => s.value === filter.site)?.label ?? filter.site}</span>}
                        </p>
                    </div>
                    <ExportButtons targetRef={exportRef} filename={exportFilename} />
                </div>

                <FilterBar filter={filter} sites={sites} jabatanOptions={jabatan_options} adminSite={admin_site} />

                <div ref={exportRef} className="space-y-4 bg-background">
                {/* ② RINGKASAN — stat cards */}
                <StatCardsRow
                    compliance={compliance}
                    sapMonitoring={sap_monitoring}
                    dilarangExpanded={dilarangExpanded}
                    onToggleDilarang={() => setDilarangExpanded(v => !v)}
                />

                {/* Daftar dilarang bekerja — muncul saat tile "Dilarang Bekerja" diklik */}
                {dilarangExpanded && dilarangList.length > 0 && (
                    <div className="rounded-lg bg-destructive-soft px-4 py-3">
                        <p className="text-xs text-destructive mb-2">
                            Berdasarkan hasil Bugar Selamat terbaru
                        </p>
                        <div className="space-y-2">
                            {dilarangList.map((entry, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-md bg-card px-3 py-2">
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt={entry.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                                    ) : (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground">
                                            {entry.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-destructive truncate">{entry.name}</p>
                                        <p className="text-xs text-destructive">{entry.jabatan ?? '-'} · {entry.site ?? '-'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {overview && <AdminOverview overview={overview} />}
                </div>


            </div>
        </>
    );
}
