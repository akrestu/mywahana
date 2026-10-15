import { Head, Link, router } from '@inertiajs/react';
import {
    Check,
    ChevronsUpDown,
    Download,
    Lock,
    Trash2,
    UserPen,
} from 'lucide-react';
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
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
    kategori?: 'KTA' | 'TTA' | null;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    nilai_risiko: number;
    status_tindakan: 'pending' | 'continue' | 'progress' | 'close';
    pic_user_id: number | null;
    user: { name: string; nik?: string | null; site?: string | null };
    pic?: { id: number; name: string } | null;
};

type PaginatedRecords = {
    data: LaporanRecord[];
    from: number | null;
    to: number | null;
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
    { value: 'hari_ini', label: 'Hari ini' },
    { value: 'minggu_ini', label: 'Minggu ini' },
    { value: 'bulan_ini', label: 'Bulan ini' },
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

        for (const key of [
            'search',
            'site',
            'tingkat_risiko',
            'status_tindakan',
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

    const allSelected =
        records.data.length > 0 && selectedIds.size === records.data.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const nomor = (r: LaporanRecord) =>
        `LB-${(r.user.site ?? '').toUpperCase()}-${String(r.id).padStart(4, '0')}`;
    const siteLabel = (v?: string | null) =>
        v ? (sites.find((s) => s.value === v)?.label ?? v.toUpperCase()) : '—';

    return (
        <>
            <Head title="Admin — Laporan Bahaya" />

            <div className="flex flex-col gap-[18px] pb-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <AdminTitle eyebrow="K3 / Safety" title="Laporan Bahaya" />
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

                <FilterBar>
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        onSubmit={() => applyFilters({ search })}
                        placeholder="Cari nama atau NIK pelapor…"
                        label="Cari laporan"
                    />
                    <Select
                        value={filters.site ?? 'all'}
                        onValueChange={(v) =>
                            applyFilters({ site: v === 'all' ? undefined : v })
                        }
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
                        onValueChange={(v) =>
                            applyFilters({
                                periode: v === 'all' ? undefined : v,
                            })
                        }
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
                        value={filters.tingkat_risiko ?? 'all'}
                        onValueChange={(v) =>
                            applyFilters({
                                tingkat_risiko: v === 'all' ? undefined : v,
                            })
                        }
                    >
                        <SelectTrigger
                            className={chipClass(!!filters.tingkat_risiko)}
                            aria-label="Risiko"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Risiko: semua · {summary.total}
                            </SelectItem>
                            <SelectItem value="AA">
                                Ekstrem · AA · {summary.aa}
                            </SelectItem>
                            <SelectItem value="A">
                                Tinggi · A · {summary.a}
                            </SelectItem>
                            <SelectItem value="B">
                                Sedang · B · {summary.b}
                            </SelectItem>
                            <SelectItem value="C">
                                Rendah · C · {summary.c}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status_tindakan ?? 'all'}
                        onValueChange={(v) =>
                            applyFilters({
                                status_tindakan: v === 'all' ? undefined : v,
                            })
                        }
                    >
                        <SelectTrigger
                            className={chipClass(!!filters.status_tindakan)}
                            aria-label="Status"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Status: semua</SelectItem>
                            <SelectItem value="pending">
                                Menunggu · {summary.pending}
                            </SelectItem>
                            <SelectItem value="continue">Berlanjut</SelectItem>
                            <SelectItem value="progress">Diproses</SelectItem>
                            <SelectItem value="close">Selesai</SelectItem>
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
                        <TableEmpty>
                            Tidak ada laporan yang sesuai filter.
                        </TableEmpty>
                    ) : (
                        <DataTable className="min-w-[980px]">
                            <thead>
                                <tr className={theadRowClass}>
                                    <th className="w-12">
                                        <Checkbox
                                            checked={
                                                allSelected
                                                    ? true
                                                    : someSelected
                                                      ? 'indeterminate'
                                                      : false
                                            }
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Pilih semua di halaman ini"
                                        />
                                    </th>
                                    <th>Nomor</th>
                                    <th>Tanggal</th>
                                    <th>Pelapor</th>
                                    <th>Site</th>
                                    <th>Lokasi</th>
                                    <th>Kat.</th>
                                    <th>Risiko</th>
                                    <th>PIC</th>
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
                                                    aria-label={`Pilih laporan ${nomor(record)}`}
                                                />
                                            </td>
                                            <td className="tabular font-bold whitespace-nowrap">
                                                <Link
                                                    href={`/laporan-bahaya/${record.id}?ref=admin`}
                                                    className="hover:underline"
                                                >
                                                    {nomor(record)}
                                                </Link>
                                            </td>
                                            <td className="tabular whitespace-nowrap text-muted-foreground">
                                                {new Date(
                                                    record.tanggal,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </td>
                                            <td className="max-w-[160px] truncate font-semibold">
                                                {record.user.name}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {siteLabel(record.user.site)}
                                            </td>
                                            <td className="max-w-[200px] truncate">
                                                {record.lokasi}
                                            </td>
                                            <td>{record.kategori ?? '—'}</td>
                                            <td>
                                                <RiskBadge
                                                    level={record.tingkat_risiko}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openPicDialog(record)
                                                    }
                                                    className={cn(
                                                        'flex max-w-[140px] items-center gap-1.5 py-1 text-left hover:underline',
                                                        !record.pic &&
                                                            'text-destructive',
                                                    )}
                                                >
                                                    <span className="truncate">
                                                        {record.pic?.name ??
                                                            'Belum ada'}
                                                    </span>
                                                    <UserPen className="size-3.5 shrink-0 opacity-60" />
                                                </button>
                                            </td>
                                            <td>
                                                <Select
                                                    value={record.status_tindakan}
                                                    onValueChange={(v) =>
                                                        handleStatusUpdate(
                                                            record.id,
                                                            v,
                                                        )
                                                    }
                                                    disabled={
                                                        updatingId === record.id
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className="h-8 w-auto border-0 bg-transparent p-0 shadow-none [&>svg]:hidden"
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
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    className="inline-flex size-8 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                                                    aria-label={`Hapus laporan ${nomor(record)}`}
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

            {/* Dialog konfirmasi hapus */}
            <Dialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus laporan bahaya?</DialogTitle>
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

            {/* Dialog konfirmasi batch hapus */}
            <Dialog
                open={showBatchConfirm}
                onOpenChange={(open) => !open && setShowBatchConfirm(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Hapus {selectedIds.size} laporan bahaya?
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
                                        'flex h-[50px] w-full items-center justify-between rounded-md bg-input px-4 text-[15px]',
                                        'focus-visible:outline-2 focus-visible:outline-ring',
                                        !picDialogValue &&
                                            'text-muted-foreground',
                                    )}
                                >
                                    <span className="truncate text-left">
                                        {(() => {
                                            const p = pics.find(
                                                (p) =>
                                                    String(p.id) ===
                                                    picDialogValue,
                                            );

                                            return p
                                                ? `${p.name}${p.jabatan ? ` — ${p.jabatan}` : ''}`
                                                : 'Pilih PIC…';
                                        })()}
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
                                        placeholder="Cari nama PIC…"
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
                                                        <p className="font-semibold">
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
                                                                ? 'opacity-100'
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
                            variant="ghost"
                            onClick={() => setPicDialogRecord(null)}
                            disabled={updatingPic}
                        >
                            Batal
                        </Button>
                        <Button onClick={savePic} disabled={updatingPic}>
                            {updatingPic ? 'Menyimpan…' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteRangeDialog
                open={showDeleteRange}
                onOpenChange={setShowDeleteRange}
                endpoint="/admin/laporan-bahaya/delete-range"
                title="Hapus data laporan bahaya"
                description="Ini akan menghapus permanen seluruh Laporan Bahaya yang disubmit pada rentang tanggal yang dipilih (mengikuti batas site admin, di luar filter tampilan saat ini). Tindakan ini tidak dapat dibatalkan."
            />
        </>
    );
}
