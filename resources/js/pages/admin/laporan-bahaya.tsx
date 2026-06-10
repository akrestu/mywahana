import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, Download, Search, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { RiskBadge } from '@/components/risk-badge';
import { TindakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LaporanRecord = {
    id: number;
    tanggal: string;
    lokasi: string;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    nilai_risiko: number;
    status_tindakan: 'pending' | 'selesai';
    user: { name: string; nik?: string | null; site?: string | null };
};

type PaginatedRecords = {
    data: LaporanRecord[];
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Summary = { pending: number; aa: number; a: number; b: number; c: number; total: number };
type Filters = { site?: string; tingkat_risiko?: string; status_tindakan?: string; search?: string; periode?: string };
type Props = { records: PaginatedRecords; filters: Filters; summary: Summary };

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

export default function AdminLaporanBahaya({ records, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<LaporanRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === 'all') delete (merged as Record<string, unknown>)[k];
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
        if (!toDelete) return;
        setDeleting(true);
        router.delete(`/admin/laporan-bahaya/${toDelete.id}`, {
            onFinish: () => { setDeleting(false); setToDelete(null); },
        });
    };

    const hasCritical = summary.pending > 0 || summary.aa > 0;
    const bannerBg = hasCritical
        ? 'bg-red-50 border border-red-200'
        : 'bg-green-50 border border-green-200';

    const exportUrl = `/admin/laporan-bahaya/export${(() => {
        const p = new URLSearchParams();
        if (filters.search) p.set('search', filters.search);
        if (filters.site) p.set('site', filters.site);
        if (filters.tingkat_risiko) p.set('tingkat_risiko', filters.tingkat_risiko);
        if (filters.status_tindakan) p.set('status_tindakan', filters.status_tindakan);
        if (filters.periode) p.set('periode', filters.periode);
        const qs = p.toString();
        return qs ? '?' + qs : '';
    })()}`;

    return (
        <>
            <Head title="Admin — Laporan Bahaya" />

            <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold">Laporan Bahaya</h2>
                        <p className="text-sm text-muted-foreground">Semua laporan bahaya karyawan</p>
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
                                <SelectItem value="baratama">Baratama</SelectItem>
                                <SelectItem value="bandhawa">Bandhawa</SelectItem>
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
                                <SelectItem value="pending">⏳ Belum Ditangani</SelectItem>
                                <SelectItem value="selesai">✅ Sudah Selesai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">Menampilkan {records.data.length} dari {records.total} laporan</p>
                </div>

                {records.data.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada laporan yang sesuai filter.</p>
                ) : (
                    <div className="space-y-2">
                        {records.data.map((record) => (
                            <Card key={record.id} className={cardBorder[record.tingkat_risiko]}>
                                <CardContent className="space-y-3 py-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">{record.user.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                NIK: {record.user.nik ?? '—'} · {record.user.site ? record.user.site.charAt(0).toUpperCase() + record.user.site.slice(1) : '—'}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                {' · '}{record.lokasi}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <RiskBadge level={record.tingkat_risiko} />
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
                                    <div className="flex items-center justify-between">
                                        <TindakanBadge status={record.status_tindakan} />
                                        <div className="flex gap-2">
                                            {record.status_tindakan === 'pending' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 gap-1 border-green-400 text-green-700 hover:bg-green-50"
                                                    disabled={updatingId === record.id}
                                                    onClick={() => handleStatusUpdate(record.id, 'selesai')}
                                                >
                                                    <CheckCircle size={14} />
                                                    {updatingId === record.id ? 'Menyimpan...' : 'Tandai Selesai'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 gap-1"
                                                    disabled={updatingId === record.id}
                                                    onClick={() => handleStatusUpdate(record.id, 'pending')}
                                                >
                                                    <Undo2 size={14} />
                                                    {updatingId === record.id ? 'Menyimpan...' : 'Buka Kembali'}
                                                </Button>
                                            )}
                                            <Link href={`/laporan-bahaya/${record.id}`}>
                                                <Button size="sm" variant="ghost" className="h-9">Detail</Button>
                                            </Link>
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
        </>
    );
}
