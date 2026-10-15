import { Head, router } from '@inertiajs/react';
import { Download, Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
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

type InspeksiRecord = {
    id: number;
    tanggal: string;
    project_site: string;
    departemen: string;
    persentase: number | null;
    risk_level: 'L' | 'M' | 'H' | 'VH' | null;
    status: 'menunggu_re_inspeksi' | 'selesai' | 'ditolak';
    user: { name: string; nik?: string | null; site?: string | null };
    re_inspektor: { name: string } | null;
};

type Paginated = {
    data: InspeksiRecord[];
    from?: number | null;
    to?: number | null;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};
type Summary = {
    total: number;
    menunggu_re_inspeksi: number;
    selesai: number;
    ditolak: number;
};
type Filters = {
    site?: string;
    status?: string;
    search?: string;
    periode?: string;
    date_from?: string;
    date_to?: string;
};
type SiteOption = { value: string; label: string };
export type Props = {
    records: Paginated;
    filters: Filters;
    summary: Summary;
    sites: SiteOption[];
};

const PERIODE_OPTIONS = [
    { value: 'hari_ini', label: 'Hari ini' },
    { value: 'minggu_ini', label: 'Minggu ini' },
    { value: 'bulan_ini', label: 'Bulan ini' },
];

const RISK: Record<
    NonNullable<InspeksiRecord['risk_level']>,
    { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
    L: { label: 'Baik', variant: 'success' },
    M: { label: 'Cukup', variant: 'warning' },
    H: { label: 'Perhatian', variant: 'warning' },
    VH: { label: 'Perlu tindakan', variant: 'danger' },
};

const STATUS: Record<
    InspeksiRecord['status'],
    { label: string; variant: 'ink' | 'warning' | 'danger' }
> = {
    selesai: { label: 'Selesai', variant: 'ink' },
    menunggu_re_inspeksi: { label: 'Menunggu', variant: 'warning' },
    ditolak: { label: 'Ditolak', variant: 'danger' },
};

export type InspeksiMonitorConfig = {
    /** segmen URL admin: /admin/inspeksi-{slug} */
    slug: 'kantor' | 'tambang' | 'workshop' | 'mess';
    /** nama singkat, mis. 'Kantor' */
    label: string;
    /** judul halaman */
    heading: string;
};

export function InspeksiMonitor({
    records,
    filters,
    summary,
    sites,
    slug,
    label,
    heading,
}: Props & InspeksiMonitorConfig) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<InspeksiRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [showBatchConfirm, setShowBatchConfirm] = useState(false);
    const [showDeleteRange, setShowDeleteRange] = useState(false);

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
        router.delete(`/admin/inspeksi-${slug}/batch`, {
            data: { ids: Array.from(selectedIds) },
            onFinish: () => {
                setBatchDeleting(false);
                setShowBatchConfirm(false);
                clearSelection();
            },
        });
    };

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach((k) => {
            const v = (merged as Record<string, unknown>)[k];

            if (v === 'all' || v === undefined) {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get(`/admin/inspeksi-${slug}`, merged, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (!toDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/inspeksi-${slug}/${toDelete.id}`, {
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
            },
        });
    };

    const exportUrl = `/admin/inspeksi-${slug}/export?${new URLSearchParams(
        Object.fromEntries(
            Object.entries(filters).filter(([, v]) => v),
        ) as Record<string, string>,
    ).toString()}`;

    const siteLabel = (v?: string | null) =>
        v ? (sites.find((s) => s.value === v)?.label ?? v.toUpperCase()) : '—';

    return (
        <>
            <Head title={`Monitoring Inspeksi ${label}`} />
            <div className="flex flex-col gap-[18px] pb-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <AdminTitle eyebrow="K3 / Safety" title={heading} />
                    <div className="flex gap-2">
                        <a href={exportUrl} download className={adminButton}>
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

                <div className="max-w-lg">
                    <SegmentTabs
                        label="Jenis inspeksi"
                        value={slug}
                        onChange={(v) => router.get(`/admin/inspeksi-${v}`)}
                        tabs={[
                            { key: 'kantor', label: 'Kantor' },
                            { key: 'tambang', label: 'Tambang' },
                            { key: 'workshop', label: 'Workshop' },
                            { key: 'mess', label: 'Mess' },
                        ]}
                    />
                </div>

                <FilterBar>
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        onSubmit={() => applyFilters({ search })}
                        placeholder="Cari nama atau NIK…"
                        label={`Cari inspeksi ${label}`}
                    />
                    <Select
                        value={filters.site ?? 'all'}
                        onValueChange={(v) => applyFilters({ site: v })}
                    >
                        <SelectTrigger
                            className={chipClass(!!filters.site)}
                            aria-label="Site"
                        >
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
                            <SelectItem value="all">Periode: semua</SelectItem>
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
                            <SelectItem value="menunggu_re_inspeksi">
                                Menunggu re-inspeksi ·{' '}
                                {summary.menunggu_re_inspeksi}
                            </SelectItem>
                            <SelectItem value="selesai">
                                Selesai · {summary.selesai}
                            </SelectItem>
                            <SelectItem value="ditolak">
                                Ditolak · {summary.ditolak}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <DateRangeFilter
                        dateFrom={filters.date_from}
                        dateTo={filters.date_to}
                        onChange={(v) => applyFilters(v)}
                    />
                </FilterBar>

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
                            Tidak ada inspeksi yang sesuai filter.
                        </TableEmpty>
                    ) : (
                        <DataTable className="min-w-[900px]">
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
                                    <th>Inspektor</th>
                                    <th>Site</th>
                                    <th>Lokasi · Dept</th>
                                    <th>Skor</th>
                                    <th>Re-inspektor</th>
                                    <th>Status</th>
                                    <th>
                                        <span className="sr-only">Aksi</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.map((record) => {
                                    const selected = selectedIds.has(record.id);
                                    const risk = record.risk_level
                                        ? RISK[record.risk_level]
                                        : null;
                                    const status =
                                        STATUS[record.status] ??
                                        STATUS.menunggu_re_inspeksi;

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
                                                    aria-label={`Pilih inspeksi ${record.user.name}`}
                                                />
                                            </td>
                                            <td className="tabular whitespace-nowrap text-muted-foreground">
                                                {new Date(
                                                    record.tanggal,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </td>
                                            <td className="max-w-[170px] truncate font-semibold">
                                                {record.user.name}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {siteLabel(record.user.site)}
                                            </td>
                                            <td>
                                                <span className="block max-w-[180px] truncate">
                                                    {record.project_site}
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {record.departemen}
                                                </span>
                                            </td>
                                            <td>
                                                {risk &&
                                                record.persentase !== null ? (
                                                    <Badge
                                                        variant={risk.variant}
                                                    >
                                                        {record.persentase}% ·{' '}
                                                        {risk.label}
                                                    </Badge>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="max-w-[150px] truncate">
                                                {record.re_inspektor?.name ??
                                                    '—'}
                                            </td>
                                            <td>
                                                <Badge variant={status.variant}>
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    className="inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                                                    aria-label={`Hapus inspeksi ${record.user.name}`}
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

            <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus inspeksi {label}?</DialogTitle>
                        <DialogDescription>
                            Data milik <strong>{toDelete?.user.name}</strong>{' '}
                            tanggal{' '}
                            {toDelete
                                ? new Date(toDelete.tanggal).toLocaleDateString(
                                      'id-ID',
                                  )
                                : ''}{' '}
                            akan dihapus permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setToDelete(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
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
                            Hapus {selectedIds.size} inspeksi {label}?
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
                endpoint={`/admin/inspeksi-${slug}/delete-range`}
                title={`Hapus data inspeksi ${label}`}
                description={`Ini akan menghapus permanen seluruh data Inspeksi ${label} yang disubmit pada rentang tanggal yang dipilih (mengikuti batas site admin, di luar filter tampilan saat ini). Tindakan ini tidak dapat dibatalkan.`}
            />
        </>
    );
}
