import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { KelayakanBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    filled: number; not_filled: number;
    layak: number; catatan: number; dilarang: number; total: number;
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
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type SiteOption = { value: string; label: string };
type CommonFilters = { site?: string; search?: string; tanggal?: string; view?: string; periode?: string; status?: string };

type Props =
    | { view: 'harian';  tanggal: string; users: UserRow[]; entries: Record<string, Entry>; summary: HarianSummary; filters: CommonFilters; sites: SiteOption[] }
    | { view: 'kalender'; tanggal: string; users: UserRow[]; dates: string[]; entries: Record<string, Entry>; summary: { total: number; bulan: string }; filters: CommonFilters; sites: SiteOption[] }
    | { view: 'daftar';  records: PaginatedRecords; filters: CommonFilters; summary: { layak: number; catatan: number; dilarang: number; total: number }; sites: SiteOption[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const siteName = (s: string | null) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const formatTanggal = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const formatTanggalShort = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

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

const isToday = (iso: string) => iso === new Date().toISOString().split('T')[0];
const isFuture = (iso: string) => iso > new Date().toISOString().split('T')[0];

const STATUS_COLOR: Record<string, string> = {
    layak:    'bg-green-500',
    catatan:  'bg-yellow-400',
    dilarang: 'bg-red-500',
};

const STATUS_LABEL: Record<string, string> = {
    layak:    'Layak',
    catatan:  'Catatan',
    dilarang: 'Dilarang',
};

// ─── Harian View ──────────────────────────────────────────────────────────────

function HarianView({ tanggal, users, entries, summary, filters, sites }: Extract<Props, { view: 'harian' }>) {
    const [search, setSearch] = useState(filters.search ?? '');

    const navigate = (newFilters: Partial<CommonFilters>) => {
        const merged = { ...filters, ...newFilters, view: 'harian' };
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === undefined || (merged as Record<string, unknown>)[k] === '') {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/bugar-selamat', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigate({ search: search || undefined });
    };

    const prevDay = addDays(tanggal, -1);
    const nextDay = addDays(tanggal, 1);

    const summaryItems = [
        { label: 'Belum Mengisi', count: summary.not_filled, color: 'text-slate-500', bg: 'bg-slate-100' },
        { label: 'Layak',         count: summary.layak,      color: 'text-green-700',  bg: 'bg-green-50' },
        { label: 'Catatan',       count: summary.catatan,    color: 'text-yellow-700', bg: 'bg-yellow-50' },
        { label: 'Dilarang',      count: summary.dilarang,   color: 'text-red-700',    bg: 'bg-red-50' },
    ];

    return (
        <div className="space-y-4">
            {/* Date Navigator */}
            <div className="flex items-center justify-between gap-2">
                <Button size="icon" variant="outline" onClick={() => navigate({ tanggal: prevDay })}>
                    <ChevronLeft size={16} />
                </Button>
                <div className="text-center">
                    <p className="text-sm font-semibold leading-tight">{formatTanggal(tanggal)}</p>
                    {isToday(tanggal) && <span className="text-xs text-primary font-medium">Hari Ini</span>}
                </div>
                <Button size="icon" variant="outline" onClick={() => navigate({ tanggal: nextDay })} disabled={!isFuture(nextDay) && isToday(tanggal)}>
                    <ChevronRight size={16} />
                </Button>
            </div>

            {/* Summary Pills */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {summaryItems.map((item) => (
                    <div key={item.label} className={`rounded-lg p-3 text-center ${item.bg}`}>
                        <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="space-y-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau NIK..."
                        className="text-sm"
                    />
                    <Button type="submit" size="sm" variant="outline" className="shrink-0">
                        <Search size={15} />
                    </Button>
                </form>
                <Select value={filters.site ?? 'all'} onValueChange={(v) => navigate({ site: v === 'all' ? undefined : v })}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Site" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Site</SelectItem>
                        {sites.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{summary.total} karyawan terdaftar</p>
            </div>

            {/* Table */}
            {users.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada karyawan.</p>
            ) : (
                <div className="space-y-2">
                    {users.map((user) => {
                        const entry = entries[user.id.toString()];
                        return (
                            <Card key={user.id} className={entry
                                ? entry.status === 'layak'    ? 'border-l-4 border-l-green-500'
                                : entry.status === 'catatan'  ? 'border-l-4 border-l-yellow-400'
                                : 'border-l-4 border-l-red-500'
                                : 'border-l-4 border-l-slate-300 opacity-70'
                            }>
                                <CardContent className="py-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                NIK: {user.nik ?? '—'} · {siteName(user.site)}
                                            </p>
                                            {entry ? (
                                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                    <KelayakanBadge status={entry.status} />
                                                    <Badge variant="outline" className="text-xs">
                                                        Shift {entry.shift}
                                                    </Badge>
                                                    <Badge variant={entry.siap_bekerja ? 'outline' : 'destructive'} className="text-xs">
                                                        {entry.siap_bekerja ? '✓ Siap Bekerja' : '✗ Tidak Siap'}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-xs text-muted-foreground italic">Belum mengisi</p>
                                            )}
                                        </div>
                                        {entry && (
                                            <Link href={`/bugar-selamat/${entry.id}?ref=monitoring`}>
                                                <Button size="sm" variant="outline" className="h-8 shrink-0">
                                                    Detail
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Kalender View ────────────────────────────────────────────────────────────

function KalenderView({ tanggal, users, dates, entries, summary, filters, sites }: Extract<Props, { view: 'kalender' }>) {
    const [search, setSearch] = useState(filters.search ?? '');

    const navigate = (newFilters: Partial<CommonFilters>) => {
        const merged = { ...filters, ...newFilters, view: 'kalender' };
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === undefined || (merged as Record<string, unknown>)[k] === '') {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/bugar-selamat', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigate({ search: search || undefined });
    };

    const prevMonth = addMonths(tanggal, -1);
    const nextMonth = addMonths(tanggal, 1);

    // Dates to show — only past + today dates in the month
    const displayDates = dates.filter((d) => !isFuture(d));

    return (
        <div className="space-y-4">
            {/* Month Navigator */}
            <div className="flex items-center justify-between gap-2">
                <Button size="icon" variant="outline" onClick={() => navigate({ tanggal: prevMonth })}>
                    <ChevronLeft size={16} />
                </Button>
                <p className="text-sm font-semibold">{summary.bulan}</p>
                <Button size="icon" variant="outline" onClick={() => navigate({ tanggal: nextMonth })}>
                    <ChevronRight size={16} />
                </Button>
            </div>

            {/* Filters */}
            <div className="space-y-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau NIK..."
                        className="text-sm"
                    />
                    <Button type="submit" size="sm" variant="outline" className="shrink-0">
                        <Search size={15} />
                    </Button>
                </form>
                <Select value={filters.site ?? 'all'} onValueChange={(v) => navigate({ site: v === 'all' ? undefined : v })}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Site" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Site</SelectItem>
                        {sites.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-green-500" /> Layak</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-yellow-400" /> Catatan</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-red-500" /> Dilarang</span>
                <span className="flex items-center gap-1"><span className="text-muted-foreground">–</span> Belum isi</span>
            </div>

            {/* Matrix */}
            {users.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada karyawan.</p>
            ) : displayDates.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data untuk bulan ini.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="sticky left-0 z-10 bg-muted/80 backdrop-blur-sm border-r px-3 py-2 text-left font-semibold min-w-[140px]">
                                    Karyawan
                                </th>
                                {displayDates.map((date) => {
                                    const d = new Date(date);
                                    const day = d.getDate();
                                    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                                    const isSun = d.getDay() === 0;
                                    const today = isToday(date);
                                    return (
                                        <th
                                            key={date}
                                            className={`px-1.5 py-2 text-center font-medium min-w-[36px] ${isSun ? 'text-red-500' : ''} ${today ? 'bg-primary/10' : ''}`}
                                        >
                                            <div>{dayName}</div>
                                            <div className={`text-sm font-bold ${today ? 'text-primary' : ''}`}>{day}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                    <td className="sticky left-0 z-10 border-r px-3 py-2 backdrop-blur-sm font-medium" style={{ background: idx % 2 === 0 ? 'hsl(var(--background))' : 'hsl(var(--muted) / 0.2)' }}>
                                        <p className="truncate max-w-[130px]" title={user.name}>{user.name}</p>
                                        <p className="text-muted-foreground text-[10px]">{siteName(user.site)}</p>
                                    </td>
                                    {displayDates.map((date) => {
                                        const entry = entries[`${user.id}_${date}`];
                                        return (
                                            <td key={date} className={`text-center py-2 px-1 ${isToday(date) ? 'bg-primary/5' : ''}`}>
                                                {entry ? (
                                                    <Link href={`/bugar-selamat/${entry.id}?ref=kalender`} title={`${STATUS_LABEL[entry.status]} · Shift ${entry.shift}`}>
                                                        <span className={`inline-block h-3 w-3 rounded-full ${STATUS_COLOR[entry.status]} hover:scale-125 transition-transform`} />
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">–</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Daftar/Riwayat View (existing) ──────────────────────────────────────────

function DaftarView({ records, filters, summary, sites }: Extract<Props, { view: 'daftar' }>) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<BugarRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const PERIODE_OPTIONS = [
        { value: 'hari_ini',   label: 'Hari Ini' },
        { value: 'minggu_ini', label: 'Minggu Ini' },
        { value: 'bulan_ini',  label: 'Bulan Ini' },
    ];

    const applyFilters = (newFilters: Partial<CommonFilters>) => {
        const merged = { ...filters, ...newFilters, search, view: 'daftar' };
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === 'all' || (merged as Record<string, unknown>)[k] === undefined) {
                delete (merged as Record<string, unknown>)[k];
            }
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

    const exportUrl = `/admin/bugar-selamat/export${(() => {
        const p = new URLSearchParams();
        if (filters.search) p.set('search', filters.search);
        if (filters.site) p.set('site', filters.site);
        if (filters.status) p.set('status', filters.status);
        if (filters.periode) p.set('periode', filters.periode);
        const qs = p.toString();
        return qs ? '?' + qs : '';
    })()}`;

    const cardBorder: Record<string, string> = {
        layak:    'border-l-4 border-l-green-500',
        catatan:  'border-l-4 border-l-yellow-400',
        dilarang: 'border-l-4 border-l-red-500',
    };

    const bannerBg = summary.dilarang > 0
        ? 'bg-red-50 border border-red-200'
        : summary.catatan > 0
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-green-50 border border-green-200';

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-end">
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
                                {sites.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
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
                                                NIK: {record.user.nik ?? '—'} · {siteName(record.user.site ?? null)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatTanggalShort(record.tanggal)}
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
                                                size="sm" variant="ghost"
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
                            <Link href={records.prev_page_url}><Button variant="outline">← Sebelumnya</Button></Link>
                        ) : <div />}
                        {records.next_page_url && (
                            <Link href={records.next_page_url}><Button variant="outline">Berikutnya →</Button></Link>
                        )}
                    </div>
                )}
            </div>

            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Data Bugar Selamat</DialogTitle>
                        <DialogDescription>
                            Hapus data checklist <strong>{toDelete?.user.name}</strong> tanggal{' '}
                            <strong>{toDelete && formatTanggalShort(toDelete.tanggal)}</strong>?{' '}
                            Tindakan ini tidak dapat dibatalkan.
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
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBugarSelamat(props: Props) {
    const currentView = props.view ?? 'harian';

    const switchTab = (v: string) => {
        router.get('/admin/bugar-selamat', { view: v }, { preserveState: false, replace: true });
    };

    return (
        <>
            <Head title="Admin — Bugar Selamat" />
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-bold">Bugar Selamat</h2>
                    <p className="text-sm text-muted-foreground">Monitoring checklist kesehatan karyawan</p>
                </div>

                {/* Tabs */}
                <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
                    {(['harian', 'kalender', 'daftar'] as const).map((v) => {
                        const labels = { harian: 'Monitoring Harian', kalender: 'Kalender', daftar: 'Riwayat' };
                        return (
                            <button
                                key={v}
                                onClick={() => switchTab(v)}
                                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                                    currentView === v
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {labels[v]}
                            </button>
                        );
                    })}
                </div>

                {/* View Content */}
                {props.view === 'harian'   && <HarianView   {...props} />}
                {props.view === 'kalender' && <KalenderView {...props} />}
                {props.view === 'daftar'   && <DaftarView   {...props} />}
            </div>
        </>
    );
}
