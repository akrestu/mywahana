import { Head, Link, router } from '@inertiajs/react';
import { Download, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { KelayakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Summary = { layak: number; catatan: number; dilarang: number; total: number };
type Filters = { site?: string; status?: string; search?: string; periode?: string };
type Props = { records: PaginatedRecords; filters: Filters; summary: Summary };

const PERIODE_OPTIONS = [
    { value: 'hari_ini',   label: 'Hari Ini' },
    { value: 'minggu_ini', label: 'Minggu Ini' },
    { value: 'bulan_ini',  label: 'Bulan Ini' },
];

const cardBorder: Record<string, string> = {
    layak:    'border-l-4 border-l-green-500',
    catatan:  'border-l-4 border-l-yellow-400',
    dilarang: 'border-l-4 border-l-red-500',
};

export default function AdminBugarSelamat({ records, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<BugarRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === 'all') delete (merged as Record<string, unknown>)[k];
        });
        router.get('/admin/bugar-selamat', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setDeleting(true);
        router.delete(`/admin/bugar-selamat/${toDelete.id}`, {
            onFinish: () => { setDeleting(false); setToDelete(null); },
        });
    };

    // Banner background berdasarkan kondisi paling serius
    const bannerBg = summary.dilarang > 0
        ? 'bg-red-50 border border-red-200'
        : summary.catatan > 0
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-green-50 border border-green-200';

    const exportUrl = `/admin/bugar-selamat/export${(() => {
        const p = new URLSearchParams();
        if (filters.search) p.set('search', filters.search);
        if (filters.site) p.set('site', filters.site);
        if (filters.status) p.set('status', filters.status);
        if (filters.periode) p.set('periode', filters.periode);
        const qs = p.toString();
        return qs ? '?' + qs : '';
    })()}`;

    return (
        <>
            <Head title="Admin — Bugar Selamat" />

            <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold">Bugar Selamat</h2>
                        <p className="text-sm text-muted-foreground">Semua data checklist karyawan</p>
                    </div>
                    <a href={exportUrl}>
                        <Button size="sm" variant="outline" className="gap-1">
                            <Download size={14} /> Export Excel
                        </Button>
                    </a>
                </div>

                {/* Banner Ringkasan */}
                <div className={`rounded-lg p-3 ${bannerBg}`}>
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                        <span className="text-sm">
                            <span className="font-bold text-red-600 text-base">{summary.dilarang}</span>
                            <span className="ml-1 text-muted-foreground">Dilarang</span>
                        </span>
                        <span className="text-sm">
                            <span className="font-bold text-yellow-600 text-base">{summary.catatan}</span>
                            <span className="ml-1 text-muted-foreground">Catatan</span>
                        </span>
                        <span className="text-sm">
                            <span className="font-bold text-green-600 text-base">{summary.layak}</span>
                            <span className="ml-1 text-muted-foreground">Layak</span>
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Total {summary.total} data dalam filter ini</p>
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
                    <div className="grid grid-cols-2 gap-2">
                        <Select value={filters.site ?? 'all'} onValueChange={(v) => applyFilters({ site: v === 'all' ? undefined : v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Site" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Site</SelectItem>
                                <SelectItem value="baratama">Baratama</SelectItem>
                                <SelectItem value="bandhawa">Bandhawa</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilters({ status: v === 'all' ? undefined : v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="layak">✅ Layak Bekerja</SelectItem>
                                <SelectItem value="catatan">⚠️ Ada Catatan</SelectItem>
                                <SelectItem value="dilarang">🚫 Dilarang Bekerja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">Menampilkan {records.data.length} dari {records.total} data</p>
                </div>

                {records.data.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada data yang sesuai filter.</p>
                ) : (
                    <div className="space-y-2">
                        {records.data.map((record) => (
                            <Card key={record.id} className={cardBorder[record.status_kelayakan]}>
                                <CardContent className="py-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">{record.user.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                NIK: {record.user.nik ?? '—'} · {record.user.site ? record.user.site.charAt(0).toUpperCase() + record.user.site.slice(1) : '—'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                {' · Shift '}{record.shift}
                                                {' · Hari ke-'}{record.hari_ke}
                                            </p>
                                            <div className="mt-2">
                                                <KelayakanBadge status={record.status_kelayakan} />
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Link href={`/bugar-selamat/${record.id}`}>
                                                <Button size="sm" variant="outline" className="h-9">Detail</Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => setToDelete(record)}
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
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
                        <DialogTitle>Hapus Data Bugar Selamat</DialogTitle>
                        <DialogDescription>
                            Hapus data checklist{' '}
                            <strong>{toDelete?.user.name}</strong> tanggal{' '}
                            <strong>
                                {toDelete && new Date(toDelete.tanggal).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric',
                                })}
                            </strong>?{' '}
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
        </>
    );
}
