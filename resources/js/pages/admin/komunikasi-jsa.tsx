import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, CalendarDays, Clock, Download, MapPin, Search, Trash2, Users } from 'lucide-react';
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

type JsaRecord = {
    id: number;
    tanggal: string;
    lokasi: string;
    shift: 'siang' | 'malam';
    durasi: number;
    kegiatan: string;
    judul_dokumen: string;
    status: 'selesai' | 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak';
    peserta: { nama: string }[];
    catatan?: string | null;
    user: { name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
    team_leader?: { name: string; jabatan?: string | null } | null;
};

type Paginated = { data: JsaRecord[]; total: number; next_page_url: string | null; prev_page_url: string | null };
type Summary = { total: number; selesai: number; dikonfirmasi: number; menunggu_konfirmasi: number; ditolak: number };
type Filters = { site?: string; status?: string; shift?: string; search?: string; periode?: string };
type SiteOption = { value: string; label: string };
type Props = { records: Paginated; filters: Filters; summary: Summary; sites: SiteOption[] };

const PERIODE_OPTIONS = [
    { value: 'hari_ini',   label: 'Hari Ini' },
    { value: 'minggu_ini', label: 'Minggu Ini' },
    { value: 'bulan_ini',  label: 'Bulan Ini' },
];

function StatusBadge({ status }: { status: JsaRecord['status'] }) {
    if (status === 'selesai')              {
return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">Selesai</Badge>;
}

    if (status === 'dikonfirmasi')         {
return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">Dikonfirmasi</Badge>;
}

    if (status === 'ditolak')              {
return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">Ditolak</Badge>;
}

    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100">Menunggu Konfirmasi</Badge>;
}

function barColor(status: JsaRecord['status']) {
    if (status === 'selesai' || status === 'dikonfirmasi') {
return 'border-l-green-500';
}

    if (status === 'ditolak') {
return 'border-l-red-500';
}

    return 'border-l-yellow-500';
}

export default function AdminKomunikasiJsa({ records, filters, summary, sites }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<JsaRecord | null>(null);
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
        router.delete('/admin/komunikasi-jsa/batch', {
            data: { ids: Array.from(selectedIds) },
            onFinish: () => {
 setBatchDeleting(false); setShowBatchConfirm(false); exitSelectMode(); 
},
        });
    };

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach(k => {
            if ((merged as Record<string, unknown>)[k] === 'all') {
delete (merged as Record<string, unknown>)[k];
}
        });
        router.get('/admin/komunikasi-jsa', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const confirmDelete = () => {
        if (!toDelete) {
return;
}

        setDeleting(true);
        router.delete(`/admin/komunikasi-jsa/${toDelete.id}`, {
            onFinish: () => {
 setDeleting(false); setToDelete(null); 
},
        });
    };

    const exportUrl = `/admin/komunikasi-jsa/export${(() => {
        const p = new URLSearchParams();

        if (filters.search)  {
p.set('search', filters.search);
}

        if (filters.site)    {
p.set('site', filters.site);
}

        if (filters.status)  {
p.set('status', filters.status);
}

        if (filters.shift)   {
p.set('shift', filters.shift);
}

        if (filters.periode) {
p.set('periode', filters.periode);
}

        const qs = p.toString();

        return qs ? '?' + qs : '';
    })()}`;

    const hasPending = summary.menunggu_konfirmasi > 0;

    return (
        <>
            <Head title="Admin — Komunikasi JSA/SOP/IK" />

            <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold">Komunikasi JSA/SOP/IK</h2>
                        <p className="text-sm text-muted-foreground">WBK-HSE-FO-026 · Semua data karyawan</p>
                    </div>
                    <div className="flex gap-2">
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
                            </>
                        )}
                    </div>
                </div>

                {/* Banner Ringkasan */}
                <div className={`rounded-lg p-3 ${hasPending ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                        <span className="text-sm">
                            <span className={`font-bold text-base ${hasPending ? 'text-yellow-600' : 'text-green-600'}`}>{summary.menunggu_konfirmasi}</span>
                            <span className="ml-1 text-muted-foreground">Menunggu Konfirmasi</span>
                        </span>
                        <span className="text-sm">
                            <span className="font-bold text-base text-green-600">{summary.selesai + summary.dikonfirmasi}</span>
                            <span className="ml-1 text-muted-foreground">Selesai / Dikonfirmasi</span>
                        </span>
                        <span className="text-sm">
                            <span className="font-bold text-base text-red-500">{summary.ditolak}</span>
                            <span className="ml-1 text-muted-foreground">Ditolak</span>
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Total {summary.total} form dalam filter ini</p>
                </div>

                {/* Filter Periode */}
                <div className="flex gap-2 flex-wrap">
                    {PERIODE_OPTIONS.map(opt => (
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

                {/* Filter Pencarian & Dropdown */}
                <div className="space-y-2">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari nama, NIK, lokasi, atau judul JSA..."
                            className="text-sm"
                        />
                        <Button type="submit" size="sm" variant="outline" className="shrink-0">
                            <Search size={15} />
                        </Button>
                    </form>
                    <div className="grid grid-cols-3 gap-2">
                        <Select value={filters.site ?? 'all'} onValueChange={v => applyFilters({ site: v === 'all' ? undefined : v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Site" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Site</SelectItem>
                                {sites.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.status ?? 'all'} onValueChange={v => applyFilters({ status: v === 'all' ? undefined : v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="selesai">✅ Selesai</SelectItem>
                                <SelectItem value="dikonfirmasi">✅ Dikonfirmasi</SelectItem>
                                <SelectItem value="menunggu_konfirmasi">⏳ Menunggu Konfirmasi</SelectItem>
                                <SelectItem value="ditolak">❌ Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.shift ?? 'all'} onValueChange={v => applyFilters({ shift: v === 'all' ? undefined : v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Shift" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Shift</SelectItem>
                                <SelectItem value="siang">🌤 Siang</SelectItem>
                                <SelectItem value="malam">🌙 Malam</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">Menampilkan {records.data.length} dari {records.total} form</p>
                </div>

                {records.data.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada data yang sesuai filter.</p>
                ) : (
                    <div className="space-y-2">
                        {records.data.map(record => (
                            <Card key={record.id} className={`border-l-4 ${barColor(record.status)}`}>
                                <CardContent className="py-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        {selectMode && (
                                            <Checkbox
                                                checked={selectedIds.has(record.id)}
                                                onCheckedChange={() => toggleSelect(record.id)}
                                                className="mt-1 shrink-0"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <StatusBadge status={record.status} />
                                                <Badge variant="outline" className="text-xs capitalize">{record.shift}</Badge>
                                            </div>
                                            <p className="font-semibold text-sm leading-snug line-clamp-1 flex items-center gap-1.5">
                                                <BookOpen size={13} className="shrink-0 text-muted-foreground" />
                                                {record.judul_dokumen}
                                            </p>
                                            <p className="text-sm text-muted-foreground font-medium">{record.user.name}
                                                {record.user.nik && <span className="font-normal"> · {record.user.nik}</span>}
                                                {record.user.site && <span className="font-normal capitalize"> · {record.user.site}</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays size={11} />
                                                    {new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1"><MapPin size={11} />{record.lokasi}</span>
                                                <span className="flex items-center gap-1"><Users size={11} />{record.peserta.length} peserta</span>
                                                <span className="flex items-center gap-1"><Clock size={11} />{record.durasi} mnt</span>
                                            </div>
                                            {record.team_leader && (
                                                <p className="text-xs text-muted-foreground mt-0.5">TL: {record.team_leader.name}</p>
                                            )}
                                        </div>
                                        {!selectMode && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-9 w-9 p-0 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => setToDelete(record)}
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex justify-end">
                                        <Link href={`/sap/komunikasi-jsa/${record.id}`}>
                                            <Button size="sm" variant="ghost" className="h-8 text-xs">Lihat Detail</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {(records.prev_page_url || records.next_page_url) && (
                    <div className="flex justify-between gap-2 pt-2">
                        {records.prev_page_url
                            ? <Link href={records.prev_page_url}><Button variant="outline">← Sebelumnya</Button></Link>
                            : <div />}
                        {records.next_page_url && (
                            <Link href={records.next_page_url}><Button variant="outline">Berikutnya →</Button></Link>
                        )}
                    </div>
                )}
            </div>

            {/* Dialog konfirmasi hapus */}
            <Dialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Form Komunikasi JSA</DialogTitle>
                        <DialogDescription>
                            Hapus form dari <strong>{toDelete?.user.name}</strong> tanggal{' '}
                            <strong>
                                {toDelete && new Date(toDelete.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </strong>{' '}
                            ({toDelete?.judul_dokumen})? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>Batal</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showBatchConfirm} onOpenChange={(open) => !open && setShowBatchConfirm(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus {selectedIds.size} Form Komunikasi JSA</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus <strong>{selectedIds.size}</strong> data yang dipilih?
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

            <BatchDeleteBar
                count={selectedIds.size}
                onDelete={() => setShowBatchConfirm(true)}
                onCancel={exitSelectMode}
                deleting={batchDeleting}
            />
        </>
    );
}
