import { Head, Link, router } from '@inertiajs/react';
import { Check, ChevronsUpDown, Download, Lock, Search, Trash2, UserPen } from 'lucide-react';
import { useState } from 'react';
import BatchDeleteBar from '@/components/admin/BatchDeleteBar';
import DateRangeFilter from '@/components/admin/DateRangeFilter';
import DeleteRangeDialog from '@/components/admin/DeleteRangeDialog';
import { RiskBadge } from '@/components/risk-badge';
import { TindakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type PicUser = { id: number; name: string; jabatan?: string | null; site?: string | null };

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

type Summary = { pending: number; aa: number; a: number; b: number; c: number; total: number };
type Filters = { site?: string; tingkat_risiko?: string; status_tindakan?: string; search?: string; periode?: string; date_from?: string; date_to?: string };
type SiteOption = { value: string; label: string };
type Props = { records: PaginatedRecords; filters: Filters; summary: Summary; sites: SiteOption[]; pics: PicUser[] };

const PERIODE_OPTIONS = [
    { value: 'hari_ini',   label: 'Hari Ini' },
    { value: 'minggu_ini', label: 'Minggu Ini' },
    { value: 'bulan_ini',  label: 'Bulan Ini' },
];

const cardBorder: Record<string, string> = {
    AA: 'border-l-4 border-l-red-600',
    A:  'border-l-4 border-l-orange-500',
    B:  'border-l-4 border-l-yellow-400',
    C:  'border-l-4 border-l-green-500',
};

export default function AdminLaporanBahaya({ records, filters, summary, sites, pics }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<LaporanRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [showBatchConfirm, setShowBatchConfirm] = useState(false);
    const [picDialogRecord, setPicDialogRecord] = useState<LaporanRecord | null>(null);
    const [picDialogValue, setPicDialogValue] = useState<string>('');
    const [picOpen, setPicOpen] = useState(false);
    const [updatingPic, setUpdatingPic] = useState(false);
    const [showDeleteRange, setShowDeleteRange] = useState(false);

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

    const handleBatchDelete = () => {
        setBatchDeleting(true);
        router.delete('/admin/laporan-bahaya/batch', {
            data: { ids: Array.from(selectedIds) },
            onFinish: () => {
 setBatchDeleting(false); setShowBatchConfirm(false); exitSelectMode(); 
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
        router.get('/admin/laporan-bahaya', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleStatusUpdate = (id: number, status: string) => {
        setUpdatingId(id);
        router.patch(`/admin/laporan-bahaya/${id}/status`, { status_tindakan: status }, {
            onFinish: () => setUpdatingId(null),
        });
    };

    const confirmDelete = () => {
        if (!toDelete) {
return;
}

        setDeleting(true);
        router.delete(`/admin/laporan-bahaya/${toDelete.id}`, {
            onFinish: () => {
 setDeleting(false); setToDelete(null); 
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
        router.patch(`/admin/laporan-bahaya/${picDialogRecord.id}/status`, {
            status_tindakan: picDialogRecord.status_tindakan,
            pic_user_id: picDialogValue || null,
        }, {
            onFinish: () => {
 setUpdatingPic(false); setPicDialogRecord(null); 
},
        });
    };

    const hasCritical = summary.pending > 0 || summary.aa > 0;
    const bannerBg = hasCritical
        ? 'bg-red-50 border border-red-200'
        : 'bg-green-50 border border-green-200';

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

    const allSelected = records.data.length > 0 && selectedIds.size === records.data.length;

    return (
        <>
            <Head title="Admin — Laporan Bahaya" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold">Laporan Bahaya</h2>
                        <p className="text-sm text-muted-foreground">Semua laporan bahaya karyawan</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectMode ? (
                            <>
                                <Button size="sm" variant="outline" onClick={toggleSelectAll}>
                                    {selectedIds.size === records.data.length ? 'Batal Semua' : 'Pilih Semua'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={exitSelectMode}>Selesai</Button>
                            </>
                        ) : (
                            <>
                                <Button size="sm" variant="outline" onClick={() => setSelectMode(true)}>Pilih</Button>
                                <a href={exportUrl}>
                                    <Button size="sm" variant="outline" className="gap-1">
                                        <Download size={14} /> Export Excel
                                    </Button>
                                </a>
                                <Button
                                    size="sm" variant="outline"
                                    className="gap-1 text-destructive hover:text-destructive"
                                    onClick={() => setShowDeleteRange(true)}
                                >
                                    <Lock size={14} /> Hapus Data (Rentang Tanggal)
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Banner Ringkasan */}
                <div className={`rounded-lg p-3 ${bannerBg}`}>
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                        <span className="text-sm">
                            <span className={`font-bold text-base ${summary.pending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {summary.pending}
                            </span>
                            <span className="ml-1 text-muted-foreground">Belum Ditangani</span>
                        </span>
                        <span className="text-sm">
                            <span className={`font-bold text-base ${summary.aa > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {summary.aa}
                            </span>
                            <span className="ml-1 text-muted-foreground">Sangat Tinggi (AA)</span>
                        </span>
                        <span className="text-sm">
                            <span className="font-bold text-base text-orange-500">{summary.a}</span>
                            <span className="ml-1 text-muted-foreground">Tinggi (A)</span>
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Total {summary.total} laporan dalam filter ini</p>
                </div>

                {/* Filter Periode */}
                <div className="flex gap-2 flex-wrap">
                    {PERIODE_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            size="sm"
                            variant={filters.periode === opt.value ? 'default' : 'outline'}
                            onClick={() => applyFilters({ periode: filters.periode === opt.value ? undefined : opt.value })}
                        >
                            {opt.label}
                        </Button>
                    ))}
                    {filters.periode && (
                        <Button size="sm" variant="ghost" onClick={() => applyFilters({ periode: undefined })}>
                            Semua Waktu
                        </Button>
                    )}
                </div>

                <DateRangeFilter
                    dateFrom={filters.date_from}
                    dateTo={filters.date_to}
                    onChange={(v) => applyFilters(v)}
                />

                {/* Filter Pencarian & Dropdown */}
                <div className="space-y-2">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau NIK karyawan..."
                            className="text-sm"
                        />
                        <Button type="submit" size="sm" variant="outline" className="shrink-0">
                            <Search size={15} />
                        </Button>
                    </form>
                    <div className="grid grid-cols-3 gap-2">
                        <Select value={filters.site ?? 'all'} onValueChange={(v) => applyFilters({ site: v === 'all' ? undefined : v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Site" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Site</SelectItem>
                                {sites.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filters.tingkat_risiko ?? 'all'} onValueChange={(v) => applyFilters({ tingkat_risiko: v === 'all' ? undefined : v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Tingkat Risiko" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Risiko</SelectItem>
                                <SelectItem value="AA">🔴 AA – Sangat Tinggi</SelectItem>
                                <SelectItem value="A">🟠 A – Tinggi</SelectItem>
                                <SelectItem value="B">🟡 B – Sedang</SelectItem>
                                <SelectItem value="C">🟢 C – Rendah</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.status_tindakan ?? 'all'} onValueChange={(v) => applyFilters({ status_tindakan: v === 'all' ? undefined : v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="pending">⏳ Pending</SelectItem>
                                <SelectItem value="continue">🔵 Continue</SelectItem>
                                <SelectItem value="progress">🟡 Progress</SelectItem>
                                <SelectItem value="close">✅ Close</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">Menampilkan {records.data.length} dari {records.total} laporan</p>
                </div>

                {records.data.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada laporan yang sesuai filter.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[680px] border-collapse text-xs">
                            <thead>
                                <tr className="bg-muted/50 text-left">
                                    {selectMode && (
                                        <th className="w-8 px-2 py-2">
                                            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                                        </th>
                                    )}
                                    <th className="px-3 py-2 font-semibold">Karyawan</th>
                                    <th className="px-2 py-2 font-semibold">Lokasi</th>
                                    <th className="px-2 py-2 text-center font-semibold">Risiko</th>
                                    <th className="px-2 py-2 font-semibold">PIC</th>
                                    <th className="px-2 py-2 font-semibold">Tindakan</th>
                                    {!selectMode && <th className="px-2 py-2 text-right font-semibold">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.map((record, idx) => (
                                    <tr key={record.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                                        {selectMode && (
                                            <td className="px-2 py-2">
                                                <Checkbox
                                                    checked={selectedIds.has(record.id)}
                                                    onCheckedChange={() => toggleSelect(record.id)}
                                                />
                                            </td>
                                        )}
                                        <td className={cn('px-3 py-2', cardBorder[record.tingkat_risiko])}>
                                            <p className="truncate max-w-[160px] font-medium">{record.user.name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                NIK: {record.user.nik ?? '—'}
                                                {record.user.site && ` · ${record.user.site.charAt(0).toUpperCase() + record.user.site.slice(1)}`}
                                            </p>
                                        </td>
                                        <td className="px-2 py-2 text-muted-foreground">
                                            <p className="truncate max-w-[140px]">{record.lokasi}</p>
                                            <p className="text-[10px]">
                                                {new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-2 py-2 text-center"><RiskBadge level={record.tingkat_risiko} /></td>
                                        <td className="px-2 py-2">
                                            <div className="flex items-center gap-1">
                                                <span className={cn('truncate max-w-[100px]', !record.pic && 'italic text-destructive/70')}>
                                                    {record.pic ? record.pic.name : 'Belum ditugaskan'}
                                                </span>
                                                {!selectMode && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                                                        onClick={() => openPicDialog(record)}
                                                    >
                                                        <UserPen size={12} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex items-center gap-1.5">
                                                <TindakanBadge status={record.status_tindakan} />
                                                {!selectMode && (
                                                    <select
                                                        value={record.status_tindakan}
                                                        onChange={(e) => handleStatusUpdate(record.id, e.target.value)}
                                                        disabled={updatingId === record.id}
                                                        className="h-6 rounded border bg-background px-1 text-[10px] disabled:opacity-50"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="continue">Continue</option>
                                                        <option value="progress">Progress</option>
                                                        <option value="close">Close</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                        {!selectMode && (
                                            <td className="px-2 py-2 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link href={`/laporan-bahaya/${record.id}?ref=admin`}>
                                                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">Detail</Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => setToDelete(record)}
                                                    >
                                                        <Trash2 size={13} />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {(records.prev_page_url || records.next_page_url) && (
                    <div className="flex justify-between gap-2 pt-2">
                        {records.prev_page_url ? (
                            <Link href={records.prev_page_url}>
                                <Button variant="outline">← Sebelumnya</Button>
                            </Link>
                        ) : <div />}
                        {records.next_page_url && (
                            <Link href={records.next_page_url}>
                                <Button variant="outline">Berikutnya →</Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Dialog konfirmasi hapus */}
            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Laporan Bahaya</DialogTitle>
                        <DialogDescription>
                            Hapus laporan dari{' '}
                            <strong>{toDelete?.user.name}</strong> tanggal{' '}
                            <strong>
                                {toDelete && new Date(toDelete.tanggal).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric',
                                })}
                            </strong>{' '}
                            di lokasi <strong>{toDelete?.lokasi}</strong>?{' '}
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog konfirmasi batch hapus */}
            <Dialog open={showBatchConfirm} onOpenChange={(open) => !open && setShowBatchConfirm(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus {selectedIds.size} Laporan Bahaya</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus <strong>{selectedIds.size}</strong> data laporan bahaya yang dipilih?
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowBatchConfirm(false)} disabled={batchDeleting}>Batal</Button>
                        <Button variant="destructive" onClick={handleBatchDelete} disabled={batchDeleting}>
                            {batchDeleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog ubah PIC */}
            <Dialog open={!!picDialogRecord} onOpenChange={(open) => !open && setPicDialogRecord(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ubah PIC</DialogTitle>
                        <DialogDescription>
                            Pilih penanggung jawab tindakan perbaikan untuk laporan dari{' '}
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
                                        'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:outline-none',
                                        picDialogValue ? 'border-primary' : 'border-input text-muted-foreground',
                                    )}
                                >
                                    <span className="truncate text-left">
                                        {picDialogValue
                                            ? (() => {
 const p = pics.find((p) => String(p.id) === picDialogValue);

 return p ? `${p.name}${p.jabatan ? ` — ${p.jabatan}` : ''}` : 'Pilih PIC...'; 
})()
                                            : 'Pilih PIC...'}
                                    </span>
                                    <ChevronsUpDown size={15} className="shrink-0 opacity-50" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Cari nama PIC..." className="h-10 text-sm" />
                                    <CommandList>
                                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                        <CommandGroup>
                                            {pics.map((pic) => (
                                                <CommandItem
                                                    key={pic.id}
                                                    value={`${pic.name} ${pic.jabatan ?? ''}`}
                                                    onSelect={() => {
                                                        setPicDialogValue(picDialogValue === String(pic.id) ? '' : String(pic.id));
                                                        setPicOpen(false);
                                                    }}
                                                    className="text-sm py-2"
                                                >
                                                    <div>
                                                        <p className="font-medium">{pic.name}</p>
                                                        {pic.jabatan && <p className="text-xs text-muted-foreground">{pic.jabatan}</p>}
                                                    </div>
                                                    <Check
                                                        size={14}
                                                        className={cn('ml-auto shrink-0', picDialogValue === String(pic.id) ? 'opacity-100 text-primary' : 'opacity-0')}
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
                        <Button variant="outline" onClick={() => setPicDialogRecord(null)} disabled={updatingPic}>
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
                description="Ini akan menghapus permanen seluruh Laporan Bahaya pada rentang tanggal yang dipilih (mengikuti batas site admin, di luar filter tampilan saat ini). Tindakan ini tidak dapat dibatalkan."
            />
        </>
    );
}
