import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, Clock, Download, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import BatchDeleteBar from '@/components/admin/BatchDeleteBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type OKRecord = {
    id: number;
    tanggal: string;
    lokasi_kerja: string;
    jenis_pekerjaan: string;
    status: 'menunggu_konfirmasi' | 'dikonfirmasi';
    pj_dikonfirmasi_at: string | null;
    user: { name: string; nik?: string | null; site?: string | null };
    penanggung_jawab: { name: string } | null;
};

type Paginated = { data: OKRecord[]; total: number; next_page_url: string | null; prev_page_url: string | null };
type Summary = { total: number; menunggu_konfirmasi: number; dikonfirmasi: number };
type Filters = { site?: string; status?: string; search?: string; periode?: string };
type SiteOption = { value: string; label: string };
type Props = { records: Paginated; filters: Filters; summary: Summary; sites: SiteOption[] };

const PERIODE_OPTIONS = [
    { value: 'hari_ini',   label: 'Hari Ini' },
    { value: 'minggu_ini', label: 'Minggu Ini' },
    { value: 'bulan_ini',  label: 'Bulan Ini' },
];

export default function AdminObservasiKeselamatan({ records, filters, summary, sites }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<OKRecord | null>(null);
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

    const handleBatchDelete = () => {
        setBatchDeleting(true);
        router.delete('/admin/observasi-keselamatan/batch', {
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
        router.get('/admin/observasi-keselamatan', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleDelete = () => {
        if (!toDelete) {
return;
}

        setDeleting(true);
        router.delete(`/admin/observasi-keselamatan/${toDelete.id}`, {
            onFinish: () => {
 setDeleting(false); setToDelete(null); 
},
        });
    };

    const exportUrl = `/admin/observasi-keselamatan/export?${new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string>
    ).toString()}`;

    return (
        <>
            <Head title="Monitoring Observasi Keselamatan" />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Observasi Keselamatan</h2>
                        <p className="text-sm text-muted-foreground">Monitoring form OK seluruh site</p>
                    </div>
                    <div className="flex gap-2">
                        {selectMode ? (
                            <>
                                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                                    {selectedIds.size === records.data.length ? 'Batal Semua' : 'Pilih Semua'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={exitSelectMode}>Selesai</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>Pilih</Button>
                                <a href={exportUrl} download>
                                    <Button variant="outline" className="gap-2 h-9">
                                        <Download size={16} /> Export
                                    </Button>
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total', value: summary.total, color: 'text-foreground' },
                        { label: 'Menunggu', value: summary.menunggu_konfirmasi, color: 'text-yellow-600' },
                        { label: 'Dikonfirmasi', value: summary.dikonfirmasi, color: 'text-green-600' },
                    ].map(({ label, value, color }) => (
                        <Card key={label} className="p-0">
                            <CardContent className="flex flex-col items-center py-4 px-3 gap-1">
                                <span className={cn('text-2xl font-bold', color)}>{value}</span>
                                <span className="text-xs text-muted-foreground">{label}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari nama / NIK..."
                            className="h-10"
                        />
                        <Button type="submit" size="icon" className="h-10 w-10 shrink-0">
                            <Search size={16} />
                        </Button>
                    </form>
                    <div className="flex gap-2 flex-wrap">
                        <Select value={filters.site ?? 'all'} onValueChange={v => applyFilters({ site: v })}>
                            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Semua site" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Site</SelectItem>
                                {sites.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filters.status ?? 'all'} onValueChange={v => applyFilters({ status: v })}>
                            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Semua status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="menunggu_konfirmasi">Menunggu Konfirmasi</SelectItem>
                                <SelectItem value="dikonfirmasi">Dikonfirmasi</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.periode ?? 'all'} onValueChange={v => applyFilters({ periode: v })}>
                            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Periode" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Periode</SelectItem>
                                {PERIODE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                {records.data.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">Tidak ada data.</p>
                ) : (
                    <Card className="p-0 overflow-hidden">
                        {records.data.map((record, idx) => (
                            <div key={record.id}>
                                <div className={cn(
                                    'flex items-center gap-3 px-4 py-4',
                                    record.status === 'dikonfirmasi' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-500',
                                )}>
                                    {selectMode && (
                                        <Checkbox
                                            checked={selectedIds.has(record.id)}
                                            onCheckedChange={() => toggleSelect(record.id)}
                                            className="shrink-0"
                                        />
                                    )}
                                    {/* Status icon */}
                                    {record.status === 'dikonfirmasi'
                                        ? <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                                        : <Clock size={20} className="text-yellow-600 shrink-0" />}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm">
                                                    {record.user.name}
                                                    {record.user.site && <span className="ml-2 text-xs text-muted-foreground">· {record.user.site}</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{record.lokasi_kerja} · {record.jenis_pekerjaan}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    PJ: {record.penanggung_jawab?.name ?? '—'}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-medium">
                                                    {new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                <Badge variant="outline" className={cn(
                                                    'text-xs mt-1',
                                                    record.status === 'dikonfirmasi' ? 'border-green-400 text-green-700' : 'border-yellow-400 text-yellow-700',
                                                )}>
                                                    {record.status === 'dikonfirmasi' ? 'Dikonfirmasi' : 'Menunggu'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {!selectMode && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
                                            onClick={() => setToDelete(record)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                                {idx < records.data.length - 1 && <Separator />}
                            </div>
                        ))}
                    </Card>
                )}

                {/* Pagination */}
                {(records.prev_page_url || records.next_page_url) && (
                    <div className="flex justify-between gap-3">
                        {records.prev_page_url
                            ? <Link href={records.prev_page_url}><Button variant="outline" className="h-10 px-5">← Sebelumnya</Button></Link>
                            : <div />}
                        {records.next_page_url && (
                            <Link href={records.next_page_url}><Button variant="outline" className="h-10 px-5">Berikutnya →</Button></Link>
                        )}
                    </div>
                )}
            </div>

            {/* Delete dialog */}
            <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Data</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus data OK milik <strong>{toDelete?.user.name}</strong> tanggal{' '}
                            {toDelete ? new Date(toDelete.tanggal).toLocaleDateString('id-ID') : ''}?
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

            <Dialog open={showBatchConfirm} onOpenChange={(open) => !open && setShowBatchConfirm(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus {selectedIds.size} Data Observasi Keselamatan</DialogTitle>
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

            <BatchDeleteBar
                count={selectedIds.size}
                onDelete={() => setShowBatchConfirm(true)}
                onCancel={exitSelectMode}
                deleting={batchDeleting}
            />
        </>
    );
}
