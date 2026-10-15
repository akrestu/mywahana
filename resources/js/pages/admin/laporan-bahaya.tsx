import { Head, Link, router } from '@inertiajs/react';
import {
    Check,
    ChevronsUpDown,
    Download,
    Lock,
    Search,
    Trash2,
    UserPen,
} from 'lucide-react';
import { useState } from 'react';
import BatchDeleteBar from '@/components/admin/BatchDeleteBar';
import DateRangeFilter from '@/components/admin/DateRangeFilter';
import DeleteRangeDialog from '@/components/admin/DeleteRangeDialog';
import { RiskBadge } from '@/components/risk-badge';
import { TindakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type PicUser = {
    id: number;
    name: string;
    jabatan?: string | null;
    site?: string | null;
};

type LaporanRecord = {
    id: number;
    tanggal: string;
    lokasi: string;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    nilai_risiko: number;
    status_tindakan: 'pending' | 'continue' | 'progress' | 'close';
    pic_user_id: number | null;
    user: { name: string; nik?: string | null; site?: string | null };
    pic?: { id: number; name: string } | null;
};

type PaginatedRecords = {
    data: LaporanRecord[];
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Summary = {
    pending: number;
    aa: number;
    a: number;
    b: number;
    c: number;
    total: number;
};
type Filters = {
    site?: string;
    tingkat_risiko?: string;
    status_tindakan?: string;
    search?: string;
    periode?: string;
    date_from?: string;
    date_to?: string;
};
type SiteOption = { value: string; label: string };
type Props = {
    records: PaginatedRecords;
    filters: Filters;
    summary: Summary;
    sites: SiteOption[];
    pics: PicUser[];
};

const PERIODE_OPTIONS = [
    { value: 'hari_ini', label: 'Hari Ini' },
    { value: 'minggu_ini', label: 'Minggu Ini' },
    { value: 'bulan_ini', label: 'Bulan Ini' },
];

export default function AdminLaporanBahaya({
    records,
    filters,
    summary,
    sites,
    pics,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<LaporanRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [showBatchConfirm, setShowBatchConfirm] = useState(false);
    const [picDialogRecord, setPicDialogRecord] =
        useState<LaporanRecord | null>(null);
    const [picDialogValue, setPicDialogValue] = useState<string>('');
    const [picOpen, setPicOpen] = useState(false);
    const [updatingPic, setUpdatingPic] = useState(false);
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
    const toggleSelectAll = () => {
        if (selectedIds.size === records.data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(records.data.map((r) => r.id)));
        }
    };
    const exitSelectMode = () => setSelectedIds(new Set());

    const handleBatchDelete = () => {
        setBatchDeleting(true);
        router.delete('/admin/laporan-bahaya/batch', {
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
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === 'all') {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/laporan-bahaya', merged, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleStatusUpdate = (id: number, status: string) => {
        setUpdatingId(id);
        router.patch(
            `/admin/laporan-bahaya/${id}/status`,
            { status_tindakan: status },
            {
                onFinish: () => setUpdatingId(null),
            },
        );
    };

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/laporan-bahaya/${toDelete.id}`, {
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
            },
        });
    };

    const openPicDialog = (record: LaporanRecord) => {
        setPicDialogRecord(record);
        setPicDialogValue(record.pic_user_id ? String(record.pic_user_id) : '');
        setPicOpen(false);
    };

    const savePic = () => {
        if (!picDialogRecord) {
            return;
        }

        setUpdatingPic(true);
        router.patch(
            `/admin/laporan-bahaya/${picDialogRecord.id}/status`,
            {
                status_tindakan: picDialogRecord.status_tindakan,
                pic_user_id: picDialogValue || null,
            },
            {
                onFinish: () => {
                    setUpdatingPic(false);
                    setPicDialogRecord(null);
                },
            },
        );
    };

    const exportUrl = `/admin/laporan-bahaya/export${(() => {
        const p = new URLSearchParams();

        if (filters.search) {
            p.set('search', filters.search);
        }

        if (filters.site) {
            p.set('site', filters.site);
        }

        if (filters.tingkat_risiko) {
            p.set('tingkat_risiko', filters.tingkat_risiko);
        }

        if (filters.status_tindakan) {
            p.set('status_tindakan', filters.status_tindakan);
        }

        if (filters.periode) {
            p.set('periode', filters.periode);
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

    const allSelected =
        records.data.length > 0 && selectedIds.size === records.data.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const chips = [
        {
            key: 'all',
            label: 'Semua',
            count: summary.total,
            active: !filters.status_tindakan && !filters.tingkat_risiko,
            apply: { status_tindakan: undefined, tingkat_risiko: undefined },
        },
        {
            key: 'pending',
            label: 'Menunggu',
            count: summary.pending,
            active: filters.status_tindakan === 'pending',
            apply: { status_tindakan: 'pending', tingkat_risiko: undefined },
        },
        {
            key: 'AA',
            label: 'Ekstrem · AA',
            count: summary.aa,
            active: filters.tingkat_risiko === 'AA',
            apply: { tingkat_risiko: 'AA', status_tindakan: undefined },
        },
        {
            key: 'A',
            label: 'Tinggi · A',
            count: summary.a,
            active: filters.tingkat_risiko === 'A',
            apply: { tingkat_risiko: 'A', status_tindakan: undefined },
        },
        {
            key: 'B',
            label: 'Sedang · B',
            count: summary.b,
            active: filters.tingkat_risiko === 'B',
            apply: { tingkat_risiko: 'B', status_tindakan: undefined },
        },
        {
            key: 'C',
            label: 'Rendah · C',
            count: summary.c,
            active: filters.tingkat_risiko === 'C',
            apply: { tingkat_risiko: 'C', status_tindakan: undefined },
        },
    ];

    const nomor = (r: LaporanRecord) =>
        `LB-${(r.user.site ?? '').toUpperCase()}-${String(r.id).padStart(4, '0')}`;

    return (
        <>
            <Head title="Admin — Laporan Bahaya" />

            <div className="flex flex-col gap-4 pb-24">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                            K3 / Safety
                        </p>
                        <h1 className="text-[28px] font-extrabold tracking-tight">
                            Laporan Bahaya
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                            <a href={exportUrl}>
                                <Download /> Ekspor Excel
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setShowDeleteRange(true)}
                        >
                            <Lock /> Hapus rentang tanggal
                        </Button>
                    </div>
                </div>

                <div
                    className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1"
                    role="group"
                    aria-label="Filter cepat"
                >
                    {chips.map((c) => (
                        <button
                            key={c.key}
                            type="button"
                            aria-pressed={c.active}
                            onClick={() => applyFilters(c.apply)}
                            className={cn(
                                'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition-colors',
                                c.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-foreground hover:bg-muted',
                            )}
                        >
                            {c.label}
                            <span
                                className={cn(
                                    'tabular text-xs',
                                    c.active
                                        ? 'text-primary-foreground/70'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {c.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-2 rounded-lg bg-card p-3 lg:flex-row lg:items-center">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau NIK pelapor…"
                            className="pl-10"
                            aria-label="Cari pelapor"
                        />
                    </form>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
                        <Select
                            value={filters.site ?? 'all'}
                            onValueChange={(v) =>
                                applyFilters({
                                    site: v === 'all' ? undefined : v,
                                })
                            }
                        >
                            <SelectTrigger
                                className="h-11 rounded-full lg:w-40"
                                aria-label="Site"
                            >
                                <SelectValue placeholder="Semua site" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua site</SelectItem>
                                {sites.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.status_tindakan ?? 'all'}
                            onValueChange={(v) =>
                                applyFilters({
                                    status_tindakan:
                                        v === 'all' ? undefined : v,
                                })
                            }
                        >
                            <SelectTrigger
                                className="h-11 rounded-full lg:w-36"
                                aria-label="Status"
                            >
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua status
                                </SelectItem>
                                <SelectItem value="pending">
                                    Menunggu
                                </SelectItem>
                                <SelectItem value="continue">
                                    Berlanjut
                                </SelectItem>
                                <SelectItem value="progress">
                                    Diproses
                                </SelectItem>
                                <SelectItem value="close">Selesai</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.periode ?? 'all'}
                            onValueChange={(v) =>
                                applyFilters({
                                    periode: v === 'all' ? undefined : v,
                                })
                            }
                        >
                            <SelectTrigger
                                className="h-11 rounded-full lg:w-36"
                                aria-label="Periode"
                            >
                                <SelectValue placeholder="Semua waktu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua waktu</SelectItem>
                                {PERIODE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DateRangeFilter
                            dateFrom={filters.date_from}
                            dateTo={filters.date_to}
                            onChange={(v) => applyFilters(v)}
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-card">
                    {records.data.length === 0 ? (
                        <p className="px-4 py-14 text-center text-sm text-muted-foreground">
                            Tidak ada laporan yang sesuai filter.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] border-collapse text-sm">
                                <thead className="sticky top-0 z-10 bg-card">
                                    <tr className="border-b border-border text-left text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                        <th className="w-12 px-4 py-3">
                                            <Checkbox
                                                checked={
                                                    allSelected
                                                        ? true
                                                        : someSelected
                                                          ? 'indeterminate'
                                                          : false
                                                }
                                                onCheckedChange={
                                                    toggleSelectAll
                                                }
                                                aria-label="Pilih semua di halaman ini"
                                            />
                                        </th>
                                        <th className="px-3 py-3">Nomor</th>
                                        <th className="px-3 py-3">Tanggal</th>
                                        <th className="px-3 py-3">Pelapor</th>
                                        <th className="px-3 py-3">Lokasi</th>
                                        <th className="px-3 py-3">Risiko</th>
                                        <th className="px-3 py-3">PIC</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-3 py-3 text-right">
                                            <span className="sr-only">
                                                Aksi
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.data.map((record) => {
                                        const selected = selectedIds.has(
                                            record.id,
                                        );

                                        return (
                                            <tr
                                                key={record.id}
                                                className={cn(
                                                    'border-b border-border/60 transition-colors last:border-0',
                                                    selected
                                                        ? 'bg-accent-soft'
                                                        : 'hover:bg-muted/50',
                                                )}
                                            >
                                                <td className="px-4 py-3">
                                                    <Checkbox
                                                        checked={selected}
                                                        onCheckedChange={() =>
                                                            toggleSelect(
                                                                record.id,
                                                            )
                                                        }
                                                        aria-label={`Pilih laporan ${nomor(record)}`}
                                                    />
                                                </td>
                                                <td className="tabular px-3 py-3 font-semibold whitespace-nowrap">
                                                    <Link
                                                        href={`/laporan-bahaya/${record.id}?ref=admin`}
                                                        className="hover:underline"
                                                    >
                                                        {nomor(record)}
                                                    </Link>
                                                </td>
                                                <td className="tabular px-3 py-3 whitespace-nowrap text-muted-foreground">
                                                    {new Date(
                                                        record.tanggal,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        },
                                                    )}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="max-w-[160px] truncate font-semibold">
                                                        {record.user.name}
                                                    </p>
                                                    <p className="tabular text-xs text-muted-foreground">
                                                        {record.user.nik ?? '—'}
                                                    </p>
                                                </td>
                                                <td className="max-w-[180px] truncate px-3 py-3">
                                                    {record.lokasi}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <RiskBadge
                                                        level={
                                                            record.tingkat_risiko
                                                        }
                                                    />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openPicDialog(
                                                                record,
                                                            )
                                                        }
                                                        className={cn(
                                                            'flex max-w-[140px] items-center gap-1.5 rounded-full px-2 py-1 text-left hover:bg-muted',
                                                            !record.pic &&
                                                                'text-destructive',
                                                        )}
                                                    >
                                                        <span className="truncate">
                                                            {record.pic
                                                                ? record.pic
                                                                      .name
                                                                : 'Belum ada'}
                                                        </span>
                                                        <UserPen className="size-3.5 shrink-0 opacity-60" />
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Select
                                                        value={
                                                            record.status_tindakan
                                                        }
                                                        onValueChange={(v) =>
                                                            handleStatusUpdate(
                                                                record.id,
                                                                v,
                                                            )
                                                        }
                                                        disabled={
                                                            updatingId ===
                                                            record.id
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            className="h-9 w-[124px] rounded-full border-0 bg-transparent p-0 shadow-none [&>svg]:hidden"
                                                            aria-label="Ubah status"
                                                        >
                                                            <TindakanBadge
                                                                status={
                                                                    record.status_tindakan
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">
                                                                Menunggu
                                                            </SelectItem>
                                                            <SelectItem value="continue">
                                                                Berlanjut
                                                            </SelectItem>
                                                            <SelectItem value="progress">
                                                                Diproses
                                                            </SelectItem>
                                                            <SelectItem value="close">
                                                                Selesai
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-9 text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                                                        aria-label={`Hapus laporan ${nomor(record)}`}
                                                        onClick={() =>
                                                            setToDelete(record)
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                        <span className="tabular">
                            {records.data.length} dari {records.total} laporan
                        </span>
                        <div className="flex gap-2">
                            {records.prev_page_url ? (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={records.prev_page_url}>
                                        Sebelumnya
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" disabled>
                                    Sebelumnya
                                </Button>
                            )}
                            {records.next_page_url ? (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={records.next_page_url}>
                                        Berikutnya
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" disabled>
                                    Berikutnya
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialog konfirmasi hapus */}
            <Dialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Laporan Bahaya</DialogTitle>
                        <DialogDescription>
                            Hapus laporan dari{' '}
                            <strong>{toDelete?.user.name}</strong> tanggal{' '}
                            <strong>
                                {toDelete &&
                                    new Date(
                                        toDelete.tanggal,
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                            </strong>{' '}
                            di lokasi <strong>{toDelete?.lokasi}</strong>?{' '}
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
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
                            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog konfirmasi batch hapus */}
            <Dialog
                open={showBatchConfirm}
                onOpenChange={(open) => !open && setShowBatchConfirm(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Hapus {selectedIds.size} Laporan Bahaya
                        </DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus{' '}
                            <strong>{selectedIds.size}</strong> data laporan
                            bahaya yang dipilih? Tindakan ini tidak dapat
                            dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
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
                            {batchDeleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog ubah PIC */}
            <Dialog
                open={!!picDialogRecord}
                onOpenChange={(open) => !open && setPicDialogRecord(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ubah PIC</DialogTitle>
                        <DialogDescription>
                            Pilih penanggung jawab tindakan perbaikan untuk
                            laporan dari{' '}
                            <strong>{picDialogRecord?.user.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Popover open={picOpen} onOpenChange={setPicOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    role="combobox"
                                    aria-expanded={picOpen}
                                    className={cn(
                                        'flex h-11 w-full items-center justify-between rounded-lg border px-3 text-sm',
                                        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                        picDialogValue
                                            ? 'border-primary'
                                            : 'border-input text-muted-foreground',
                                    )}
                                >
                                    <span className="truncate text-left">
                                        {picDialogValue
                                            ? (() => {
                                                  const p = pics.find(
                                                      (p) =>
                                                          String(p.id) ===
                                                          picDialogValue,
                                                  );

                                                  return p
                                                      ? `${p.name}${p.jabatan ? ` — ${p.jabatan}` : ''}`
                                                      : 'Pilih PIC...';
                                              })()
                                            : 'Pilih PIC...'}
                                    </span>
                                    <ChevronsUpDown
                                        size={15}
                                        className="shrink-0 opacity-50"
                                    />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[var(--radix-popover-trigger-width)] p-0"
                                align="start"
                            >
                                <Command>
                                    <CommandInput
                                        placeholder="Cari nama PIC..."
                                        className="h-10 text-sm"
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            Tidak ditemukan.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {pics.map((pic) => (
                                                <CommandItem
                                                    key={pic.id}
                                                    value={`${pic.name} ${pic.jabatan ?? ''}`}
                                                    onSelect={() => {
                                                        setPicDialogValue(
                                                            picDialogValue ===
                                                                String(pic.id)
                                                                ? ''
                                                                : String(
                                                                      pic.id,
                                                                  ),
                                                        );
                                                        setPicOpen(false);
                                                    }}
                                                    className="py-2 text-sm"
                                                >
                                                    <div>
                                                        <p className="font-medium">
                                                            {pic.name}
                                                        </p>
                                                        {pic.jabatan && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {pic.jabatan}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Check
                                                        size={14}
                                                        className={cn(
                                                            'ml-auto shrink-0',
                                                            picDialogValue ===
                                                                String(pic.id)
                                                                ? 'text-primary opacity-100'
                                                                : 'opacity-0',
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPicDialogRecord(null)}
                            disabled={updatingPic}
                        >
                            Batal
                        </Button>
                        <Button onClick={savePic} disabled={updatingPic}>
                            {updatingPic ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BatchDeleteBar
                count={selectedIds.size}
                onDelete={() => setShowBatchConfirm(true)}
                onCancel={exitSelectMode}
                deleting={batchDeleting}
            />

            <DeleteRangeDialog
                open={showDeleteRange}
                onOpenChange={setShowDeleteRange}
                endpoint="/admin/laporan-bahaya/delete-range"
                title="Hapus Data Laporan Bahaya"
                description="Ini akan menghapus permanen seluruh Laporan Bahaya yang disubmit pada rentang tanggal yang dipilih (mengikuti batas site admin, di luar filter tampilan saat ini). Tindakan ini tidak dapat dibatalkan."
            />
        </>
    );
}
