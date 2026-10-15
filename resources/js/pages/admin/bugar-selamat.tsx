import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
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
import { SegmentTabs } from '@/components/patterns/segment-tabs';
import { KelayakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRow = {
    id: number;
    name: string;
    nik: string | null;
    site: string | null;
};

type Entry = {
    id: number;
    status: 'layak' | 'catatan' | 'dilarang';
    shift: string;
    siap_bekerja: boolean;
    hari_ke?: number;
};

type HarianSummary = {
    filled: number;
    not_filled: number;
    layak: number;
    catatan: number;
    dilarang: number;
    total: number;
};

type BugarRecord = {
    id: number;
    tanggal: string;
    shift: string;
    hari_ke: number;
    status_kelayakan: 'layak' | 'catatan' | 'dilarang';
    user: { name: string; nik?: string | null; site?: string | null };
};

type PaginatedRecords = {
    data: BugarRecord[];
    from?: number | null;
    to?: number | null;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type SiteOption = { value: string; label: string };
type CommonFilters = {
    site?: string;
    search?: string;
    tanggal?: string;
    view?: string;
    periode?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
};

type Props =
    | {
          view: 'harian';
          tanggal: string;
          users: UserRow[];
          entries: Record<string, Entry>;
          summary: HarianSummary;
          filters: CommonFilters;
          sites: SiteOption[];
      }
    | {
          view: 'kalender';
          tanggal: string;
          users: UserRow[];
          dates: string[];
          entries: Record<string, Entry>;
          summary: { total: number; bulan: string };
          filters: CommonFilters;
          sites: SiteOption[];
      }
    | {
          view: 'daftar';
          records: PaginatedRecords;
          filters: CommonFilters;
          summary: {
              layak: number;
              catatan: number;
              dilarang: number;
              total: number;
          };
          sites: SiteOption[];
      };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTanggal = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const formatTanggalShort = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

const addDays = (iso: string, n: number) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + n);

    return d.toISOString().split('T')[0];
};

const addMonths = (iso: string, n: number) => {
    const d = new Date(iso);
    d.setMonth(d.getMonth() + n);
    d.setDate(1);

    return d.toISOString().split('T')[0];
};

const todayJakarta = () =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
const isToday = (iso: string) => iso === todayJakarta();
const isFuture = (iso: string) => iso > todayJakarta();

const STATUS_DOT: Record<string, string> = {
    layak: 'bg-success',
    catatan: 'bg-warning',
    dilarang: 'bg-destructive',
};

const STATUS_LABEL: Record<string, string> = {
    layak: 'Layak',
    catatan: 'Catatan',
    dilarang: 'Dilarang',
};

const shiftLabel = (s: string) => (s === 'Siang' ? 'Shift I' : 'Shift II');

function useSiteLabel(sites: SiteOption[]) {
    return (v?: string | null) =>
        v ? (sites.find((s) => s.value === v)?.label ?? v.toUpperCase()) : '—';
}

/** KPI tile from ADashboard: small label, large number, coloured note. */
function Kpi({
    label,
    value,
    note,
    tone = 'text-muted-foreground',
}: {
    label: string;
    value: number;
    note?: string;
    tone?: string;
}) {
    return (
        <div className="flex flex-col gap-2 rounded-[18px] border border-border bg-card p-4">
            <span className="text-xs font-semibold text-muted-foreground">
                {label}
            </span>
            <span className="tabular text-[28px] leading-none font-extrabold tracking-tight">
                {value.toLocaleString('id-ID')}
            </span>
            {note && (
                <span className={cn('text-xs font-semibold', tone)}>
                    {note}
                </span>
            )}
        </div>
    );
}

/** Prev / label / next stepper used for day and month navigation. */
function PeriodStepper({
    label,
    sub,
    onPrev,
    onNext,
    nextDisabled,
}: {
    label: string;
    sub?: ReactNode;
    onPrev: () => void;
    onNext: () => void;
    nextDisabled?: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                aria-label="Sebelumnya"
                onClick={onPrev}
                className={cn(adminButton, 'w-10 px-0')}
            >
                <ChevronLeft />
            </button>
            <div className="min-w-[200px] text-center">
                <p className="text-sm font-bold">{label}</p>
                {sub}
            </div>
            <button
                type="button"
                aria-label="Berikutnya"
                onClick={onNext}
                disabled={nextDisabled}
                className={cn(adminButton, 'w-10 px-0')}
            >
                <ChevronRight />
            </button>
        </div>
    );
}

function SiteChip({
    value,
    sites,
    onChange,
}: {
    value?: string;
    sites: SiteOption[];
    onChange: (v: string | undefined) => void;
}) {
    return (
        <Select
            value={value ?? 'all'}
            onValueChange={(v) => onChange(v === 'all' ? undefined : v)}
        >
            <SelectTrigger className={chipClass(!!value)} aria-label="Site">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Site: semua</SelectItem>
                {sites.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                        {s.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// ─── Harian View ──────────────────────────────────────────────────────────────

function HarianView({
    tanggal,
    users,
    entries,
    summary,
    filters,
    sites,
}: Extract<Props, { view: 'harian' }>) {
    const [search, setSearch] = useState(filters.search ?? '');
    const siteLabel = useSiteLabel(sites);

    const navigate = (newFilters: Partial<CommonFilters>) => {
        const merged = { ...filters, ...newFilters, view: 'harian' };
        Object.keys(merged).forEach((k) => {
            const v = (merged as Record<string, unknown>)[k];

            if (v === undefined || v === '') {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/bugar-selamat', merged, {
            preserveState: true,
            replace: true,
        });
    };

    const nextDay = addDays(tanggal, 1);

    return (
        <div className="flex flex-col gap-4">
            <PeriodStepper
                label={formatTanggal(tanggal)}
                sub={
                    isToday(tanggal) && (
                        <span className="text-xs font-semibold text-muted-foreground">
                            Hari ini
                        </span>
                    )
                }
                onPrev={() => navigate({ tanggal: addDays(tanggal, -1) })}
                onNext={() => navigate({ tanggal: nextDay })}
                nextDisabled={!isFuture(nextDay) && isToday(tanggal)}
            />

            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
                <Kpi
                    label="Sudah mengisi"
                    value={summary.filled}
                    note={`dari ${summary.total} karyawan`}
                />
                <Kpi
                    label="Belum mengisi"
                    value={summary.not_filled}
                    tone="text-warning"
                    note={
                        summary.not_filled > 0 ? 'perlu diingatkan' : 'lengkap'
                    }
                />
                <Kpi
                    label="Layak"
                    value={summary.layak}
                    tone="text-success"
                    note="siap bekerja"
                />
                <Kpi
                    label="Dengan catatan"
                    value={summary.catatan}
                    tone="text-warning"
                    note="perlu dipantau"
                />
                <Kpi
                    label="Dilarang bekerja"
                    value={summary.dilarang}
                    tone="text-destructive"
                    note="hari ini"
                />
            </div>

            <FilterBar>
                <SearchField
                    value={search}
                    onChange={setSearch}
                    onSubmit={() => navigate({ search: search || undefined })}
                    placeholder="Cari nama atau NIK…"
                    label="Cari karyawan"
                />
                <SiteChip
                    value={filters.site}
                    sites={sites}
                    onChange={(site) => navigate({ site })}
                />
            </FilterBar>

            <TableCard>
                {users.length === 0 ? (
                    <TableEmpty>Tidak ada karyawan.</TableEmpty>
                ) : (
                    <DataTable className="min-w-[760px]">
                        <thead>
                            <tr className={theadRowClass}>
                                <th>Karyawan</th>
                                <th>Site</th>
                                <th>Status</th>
                                <th>Shift</th>
                                <th>Siap kerja</th>
                                <th>
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const entry = entries[user.id.toString()];

                                return (
                                    <tr key={user.id} className={rowClass()}>
                                        <td>
                                            <span className="block max-w-[200px] truncate font-semibold">
                                                {user.name}
                                            </span>
                                            <span className="tabular block text-xs text-muted-foreground">
                                                {user.nik ?? '—'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap">
                                            {siteLabel(user.site)}
                                        </td>
                                        <td>
                                            {entry ? (
                                                <KelayakanBadge
                                                    status={entry.status}
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    Belum mengisi
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap">
                                            {entry
                                                ? shiftLabel(entry.shift)
                                                : '—'}
                                        </td>
                                        <td>
                                            {entry ? (
                                                entry.siap_bekerja ? (
                                                    <span className="text-xs font-semibold text-success">
                                                        ✓ Ya
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-destructive">
                                                        ✕ Tidak
                                                    </span>
                                                )
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="text-right">
                                            {entry && (
                                                <Link
                                                    href={`/bugar-selamat/${entry.id}?ref=monitoring`}
                                                    className="text-[13px] font-semibold hover:underline"
                                                >
                                                    Detail
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </DataTable>
                )}
            </TableCard>
        </div>
    );
}

// ─── Kalender View ────────────────────────────────────────────────────────────

function KalenderView({
    tanggal,
    users,
    dates,
    entries,
    summary,
    filters,
    sites,
}: Extract<Props, { view: 'kalender' }>) {
    const [search, setSearch] = useState(filters.search ?? '');
    const siteLabel = useSiteLabel(sites);

    const navigate = (newFilters: Partial<CommonFilters>) => {
        const merged = { ...filters, ...newFilters, view: 'kalender' };
        Object.keys(merged).forEach((k) => {
            const v = (merged as Record<string, unknown>)[k];

            if (v === undefined || v === '') {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/bugar-selamat', merged, {
            preserveState: true,
            replace: true,
        });
    };

    // Only past + today dates in the month
    const displayDates = dates.filter((d) => !isFuture(d));

    return (
        <div className="flex flex-col gap-4">
            <PeriodStepper
                label={summary.bulan}
                onPrev={() => navigate({ tanggal: addMonths(tanggal, -1) })}
                onNext={() => navigate({ tanggal: addMonths(tanggal, 1) })}
            />

            <FilterBar>
                <SearchField
                    value={search}
                    onChange={setSearch}
                    onSubmit={() => navigate({ search: search || undefined })}
                    placeholder="Cari nama atau NIK…"
                    label="Cari karyawan"
                />
                <SiteChip
                    value={filters.site}
                    sites={sites}
                    onChange={(site) => navigate({ site })}
                />
                <span className="ml-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {(['layak', 'catatan', 'dilarang'] as const).map((s) => (
                        <span key={s} className="flex items-center gap-1.5">
                            <span
                                className={cn(
                                    'size-2.5 rounded-full',
                                    STATUS_DOT[s],
                                )}
                            />
                            {STATUS_LABEL[s]}
                        </span>
                    ))}
                    <span>– Belum isi</span>
                </span>
            </FilterBar>

            <TableCard>
                {users.length === 0 ? (
                    <TableEmpty>Tidak ada karyawan.</TableEmpty>
                ) : displayDates.length === 0 ? (
                    <TableEmpty>Belum ada data untuk bulan ini.</TableEmpty>
                ) : (
                    <table className="w-full border-collapse text-[13px]">
                        <thead>
                            <tr className={theadRowClass}>
                                <th className="sticky left-0 z-10 min-w-[180px] border-r border-border bg-background px-4 py-3 text-left">
                                    Karyawan
                                </th>
                                {displayDates.map((date) => {
                                    const d = new Date(date);
                                    const today = isToday(date);

                                    return (
                                        <th
                                            key={date}
                                            className={cn(
                                                'min-w-[38px] px-1 py-2 text-center',
                                                d.getDay() === 0 &&
                                                    'text-destructive',
                                                today &&
                                                    'bg-accent-soft text-foreground',
                                            )}
                                        >
                                            <div className="text-[10px]">
                                                {d.toLocaleDateString('id-ID', {
                                                    weekday: 'short',
                                                })}
                                            </div>
                                            <div className="tabular text-sm">
                                                {d.getDate()}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-t border-border/60"
                                >
                                    <td className="sticky left-0 z-10 border-r border-border bg-card px-4 py-2.5">
                                        <span
                                            className="block max-w-[170px] truncate font-semibold"
                                            title={user.name}
                                        >
                                            {user.name}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {siteLabel(user.site)}
                                        </span>
                                    </td>
                                    {displayDates.map((date) => {
                                        const entry =
                                            entries[`${user.id}_${date}`];

                                        return (
                                            <td
                                                key={date}
                                                className={cn(
                                                    'px-1 py-2.5 text-center',
                                                    isToday(date) &&
                                                        'bg-accent-soft/60',
                                                )}
                                            >
                                                {entry ? (
                                                    <Link
                                                        href={`/bugar-selamat/${entry.id}?ref=kalender`}
                                                        title={`${STATUS_LABEL[entry.status]} · ${shiftLabel(entry.shift)}`}
                                                        aria-label={`${user.name} ${date}: ${STATUS_LABEL[entry.status]}`}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'inline-block size-3 rounded-full transition-transform hover:scale-125',
                                                                STATUS_DOT[
                                                                    entry.status
                                                                ],
                                                            )}
                                                        />
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        –
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </TableCard>
        </div>
    );
}

// ─── Riwayat View ─────────────────────────────────────────────────────────────

const PERIODE_OPTIONS = [
    { value: 'hari_ini', label: 'Hari ini' },
    { value: 'minggu_ini', label: 'Minggu ini' },
    { value: 'bulan_ini', label: 'Bulan ini' },
];

function DaftarView({
    records,
    filters,
    summary,
    sites,
}: Extract<Props, { view: 'daftar' }>) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<BugarRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [showBatchConfirm, setShowBatchConfirm] = useState(false);
    const [showDeleteRange, setShowDeleteRange] = useState(false);
    const siteLabel = useSiteLabel(sites);

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
    const allSelected =
        records.data.length > 0 && selectedIds.size === records.data.length;
    const toggleSelectAll = () =>
        setSelectedIds(
            allSelected ? new Set() : new Set(records.data.map((r) => r.id)),
        );
    const clearSelection = () => setSelectedIds(new Set());

    const handleBatchDelete = () => {
        setBatchDeleting(true);
        router.delete('/admin/bugar-selamat/batch', {
            data: { ids: Array.from(selectedIds) },
            onFinish: () => {
                setBatchDeleting(false);
                setShowBatchConfirm(false);
                clearSelection();
            },
        });
    };

    const applyFilters = (newFilters: Partial<CommonFilters>) => {
        const merged = { ...filters, ...newFilters, search, view: 'daftar' };
        Object.keys(merged).forEach((k) => {
            const v = (merged as Record<string, unknown>)[k];

            if (v === 'all' || v === undefined) {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/bugar-selamat', merged, {
            preserveState: true,
            replace: true,
        });
    };

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/bugar-selamat/${toDelete.id}`, {
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
            },
        });
    };

    const exportUrl = `/admin/bugar-selamat/export${(() => {
        const p = new URLSearchParams();

        for (const key of [
            'search',
            'site',
            'status',
            'periode',
            'date_from',
            'date_to',
        ] as const) {
            if (filters[key]) {
                p.set(key, filters[key]!);
            }
        }

        const qs = p.toString();

        return qs ? '?' + qs : '';
    })()}`;

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <FilterBar>
                        <SearchField
                            value={search}
                            onChange={setSearch}
                            onSubmit={() => applyFilters({ search })}
                            placeholder="Cari nama atau NIK…"
                            label="Cari karyawan"
                        />
                        <SiteChip
                            value={filters.site}
                            sites={sites}
                            onChange={(site) => applyFilters({ site })}
                        />
                        <Select
                            value={filters.periode ?? 'all'}
                            onValueChange={(v) => applyFilters({ periode: v })}
                        >
                            <SelectTrigger
                                className={chipClass(!!filters.periode)}
                                aria-label="Periode"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Periode: semua
                                </SelectItem>
                                {PERIODE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.status ?? 'all'}
                            onValueChange={(v) => applyFilters({ status: v })}
                        >
                            <SelectTrigger
                                className={chipClass(!!filters.status)}
                                aria-label="Status"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Status: semua · {summary.total}
                                </SelectItem>
                                <SelectItem value="layak">
                                    Layak · {summary.layak}
                                </SelectItem>
                                <SelectItem value="catatan">
                                    Dengan catatan · {summary.catatan}
                                </SelectItem>
                                <SelectItem value="dilarang">
                                    Dilarang · {summary.dilarang}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <DateRangeFilter
                            dateFrom={filters.date_from}
                            dateTo={filters.date_to}
                            onChange={(v) => applyFilters(v)}
                        />
                    </FilterBar>
                    <div className="flex gap-2">
                        <a href={exportUrl} className={adminButton}>
                            <Download /> Ekspor Excel
                        </a>
                        <MoreMenu>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setShowDeleteRange(true)}
                            >
                                <Lock /> Hapus rentang tanggal
                            </DropdownMenuItem>
                        </MoreMenu>
                    </div>
                </div>

                <SelectionBar count={selectedIds.size} onClear={clearSelection}>
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
                        <TableEmpty>
                            Tidak ada data yang sesuai filter.
                        </TableEmpty>
                    ) : (
                        <DataTable className="min-w-[820px]">
                            <thead>
                                <tr className={theadRowClass}>
                                    <th className="w-12">
                                        <Checkbox
                                            checked={
                                                allSelected
                                                    ? true
                                                    : selectedIds.size > 0
                                                      ? 'indeterminate'
                                                      : false
                                            }
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Pilih semua di halaman ini"
                                        />
                                    </th>
                                    <th>Tanggal</th>
                                    <th>Karyawan</th>
                                    <th>Site</th>
                                    <th>Shift</th>
                                    <th>Hari ke</th>
                                    <th>Status</th>
                                    <th>
                                        <span className="sr-only">Aksi</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.map((record) => {
                                    const selected = selectedIds.has(record.id);

                                    return (
                                        <tr
                                            key={record.id}
                                            className={rowClass(selected)}
                                        >
                                            <td>
                                                <Checkbox
                                                    checked={selected}
                                                    onCheckedChange={() =>
                                                        toggleSelect(record.id)
                                                    }
                                                    aria-label={`Pilih ${record.user.name}`}
                                                />
                                            </td>
                                            <td className="tabular whitespace-nowrap text-muted-foreground">
                                                {formatTanggalShort(
                                                    record.tanggal,
                                                )}
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/bugar-selamat/${record.id}?ref=daftar`}
                                                    className="block max-w-[200px] truncate font-semibold hover:underline"
                                                >
                                                    {record.user.name}
                                                </Link>
                                                <span className="tabular block text-xs text-muted-foreground">
                                                    {record.user.nik ?? '—'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {siteLabel(record.user.site)}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {shiftLabel(record.shift)}
                                            </td>
                                            <td className="tabular">
                                                {record.hari_ke}
                                            </td>
                                            <td>
                                                <KelayakanBadge
                                                    status={
                                                        record.status_kelayakan
                                                    }
                                                />
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    className="inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                                                    aria-label={`Hapus data ${record.user.name}`}
                                                    onClick={() =>
                                                        setToDelete(record)
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </DataTable>
                    )}
                </TableCard>
            </div>

            <Dialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus data Bugar Selamat?</DialogTitle>
                        <DialogDescription>
                            Checklist <strong>{toDelete?.user.name}</strong>{' '}
                            tanggal{' '}
                            <strong>
                                {toDelete &&
                                    formatTanggalShort(toDelete.tanggal)}
                            </strong>{' '}
                            akan dihapus permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setToDelete(null)}
                            disabled={deleting}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Menghapus…' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showBatchConfirm}
                onOpenChange={(open) => !open && setShowBatchConfirm(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Hapus {selectedIds.size} data Bugar Selamat?
                        </DialogTitle>
                        <DialogDescription>
                            Data yang dipilih akan dihapus permanen. Tindakan
                            ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
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
                            {batchDeleting ? 'Menghapus…' : 'Hapus semua'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteRangeDialog
                open={showDeleteRange}
                onOpenChange={setShowDeleteRange}
                endpoint="/admin/bugar-selamat/delete-range"
                title="Hapus data Bugar Selamat"
                description="Ini akan menghapus permanen seluruh data Bugar Selamat yang disubmit pada rentang tanggal yang dipilih (mengikuti batas site admin, di luar filter tampilan saat ini). Tindakan ini tidak dapat dibatalkan."
            />
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBugarSelamat(props: Props) {
    const currentView = props.view ?? 'harian';

    const switchTab = (v: string) => {
        router.get(
            '/admin/bugar-selamat',
            { view: v },
            { preserveState: false, replace: true },
        );
    };

    const harianExport =
        props.view === 'harian'
            ? `/admin/bugar-selamat/export?${new URLSearchParams({
                  date_from: props.tanggal,
                  date_to: props.tanggal,
                  ...(props.filters.search
                      ? { search: props.filters.search }
                      : {}),
              }).toString()}`
            : null;

    return (
        <>
            <Head title="Admin — Bugar Selamat" />
            <div className="flex flex-col gap-[18px] pb-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <AdminTitle eyebrow="K3 / Safety" title="Bugar Selamat" />
                    {harianExport && (
                        <a href={harianExport} className={adminButton}>
                            <Download /> Ekspor Excel
                        </a>
                    )}
                </div>

                <div className="max-w-md">
                    <SegmentTabs
                        label="Tampilan monitoring"
                        value={currentView}
                        onChange={switchTab}
                        tabs={[
                            { key: 'harian', label: 'Harian' },
                            { key: 'kalender', label: 'Kalender' },
                            { key: 'daftar', label: 'Riwayat' },
                        ]}
                    />
                </div>

                {props.view === 'harian' && <HarianView {...props} />}
                {props.view === 'kalender' && <KalenderView {...props} />}
                {props.view === 'daftar' && <DaftarView {...props} />}
            </div>
        </>
    );
}
