import { Head, Link, router } from '@inertiajs/react';
import { Building2, Download, Search, Trash2 } from 'lucide-react';
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

type Paginated = { data: InspeksiRecord[]; total: number; next_page_url: string | null; prev_page_url: string | null };
type Summary = { total: number; menunggu_re_inspeksi: number; selesai: number; ditolak: number };
type Filters = { site?: string; status?: string; search?: string; periode?: string };
type SiteOption = { value: string; label: string };
type Props = { records: Paginated; filters: Filters; summary: Summary; sites: SiteOption[] };

const PERIODE_OPTIONS = [
    { value: 'hari_ini',   label: 'Hari Ini' },
    { value: 'minggu_ini', label: 'Minggu Ini' },
    { value: 'bulan_ini',  label: 'Bulan Ini' },
];

function RiskBadge({ level, pct }: { level: InspeksiRecord['risk_level']; pct: number | null }) {
    if (!level || pct === null) {
return null;
}

    const cfg = {
        L:  { label: 'Baik',           cls: 'bg-green-100 text-green-700 border-green-300' },
        M:  { label: 'Cukup',          cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
        H:  { label: 'Perhatian',      cls: 'bg-orange-100 text-orange-700 border-orange-300' },
        VH: { label: 'Perlu Tindakan', cls: 'bg-red-100 text-red-700 border-red-300' },
    };
    const { label, cls } = cfg[level];

    return <Badge className={cn('hover:opacity-100', cls)}>{pct}% — {label}</Badge>;
}

function StatusBadge({ status }: { status: InspeksiRecord['status'] }) {
    if (status === 'selesai') {
return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">Selesai</Badge>;
}

    if (status === 'ditolak') {
return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">Ditolak</Badge>;
}

    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100">Menunggu Re-Inspeksi</Badge>;
}

export default function AdminInspeksiKantor({ records, filters, summary, sites }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<InspeksiRecord | null>(null);
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
        router.delete('/admin/inspeksi-kantor/batch', {
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
        router.get('/admin/inspeksi-kantor', merged, { preserveState: true, replace: true });
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
        router.delete(`/admin/inspeksi-kantor/${toDelete.id}`, {
            onFinish: () => {
 setDeleting(false); setToDelete(null); 
},
        });
    };

    const exportUrl = `/admin/inspeksi-kantor/export?${new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string>
    ).toString()}`;

    return (
        <>
            <Head title="Monitoring Inspeksi Kantor" />
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Inspeksi Area Kantor</h2>
                        <p className="text-sm text-muted-foreground">Monitoring seluruh site</p>
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

                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Total',    value: summary.total,                color: 'text-foreground' },
                        { label: 'Menunggu', value: summary.menunggu_re_inspeksi, color: 'text-yellow-600' },
                        { label: 'Selesai',  value: summary.selesai,              color: 'text-green-600' },
                        { label: 'Ditolak',  value: summary.ditolak,              color: 'text-red-600' },
                    ].map(({ label, value, color }) => (
                        <Card key={label} className="p-0">
                            <CardContent className="flex flex-col items-center py-4 px-2 gap-1">
                                <span className={cn('text-2xl font-bold', color)}>{value}</span>
                                <span className="text-xs text-muted-foreground text-center">{label}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

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
                            <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Semua status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="menunggu_re_inspeksi">Menunggu Re-Inspeksi</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                                <SelectItem value="ditolak">Ditolak</SelectItem>
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

                {records.data.length === 0 ? (
                    <p className="py-10 text-center text-muted-foreground">Tidak ada data.</p>
                ) : (
                    <Card className="p-0 overflow-hidden">
                        {records.data.map((record, idx) => (
                            <div key={record.id}>
                                <div className={cn(
                                    'flex items-center gap-3 px-4 py-4',
                                    record.status === 'selesai'   ? 'border-l-4 border-l-green-500'  :
                                    record.status === 'ditolak'   ? 'border-l-4 border-l-red-500'    :
                                                                    'border-l-4 border-l-yellow-500',
                                )}>
                                    {selectMode && (
                                        <Checkbox
                                            checked={selectedIds.has(record.id)}
                                            onCheckedChange={() => toggleSelect(record.id)}
                                            className="shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm">
                                                    {record.user.name}
                                                    {record.user.site && <span className="ml-2 text-xs text-muted-foreground">· {record.user.site}</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{record.project_site} · {record.departemen}</p>
                                                {record.re_inspektor && (
                                                    <p className="text-xs text-muted-foreground">RI: {record.re_inspektor.name}</p>
                                                )}
                                                <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                                                    <StatusBadge status={record.status} />
                                                    <RiskBadge level={record.risk_level} pct={record.persentase} />
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium shrink-0">
                                                {new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
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

            <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Data</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus data Inspeksi Kantor milik <strong>{toDelete?.user.name}</strong> tanggal{' '}
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
                        <DialogTitle>Hapus {selectedIds.size} Data Inspeksi Kantor</DialogTitle>
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
