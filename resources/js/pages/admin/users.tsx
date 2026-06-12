import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Download, FileSpreadsheet, Pencil, Plus, Search, Trash2, Upload, UserCheck, Users, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

type UserRecord = {
    id: number;
    name: string;
    nik: string | null;
    email: string | null;
    jabatan: string | null;
    site: string | null;
    participation_level: string | null;
    is_admin: boolean;
};

type PaginatedUsers = {
    data: UserRecord[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Filters = {
    search?: string;
    site?: string;
    is_admin?: string;
    participation_level?: string;
};

type SiteOption = { value: string; label: string };
type Props = { users: PaginatedUsers; filters: Filters; sites: SiteOption[] };

function levelBadge(level: string | null) {
    if (level === 'srstaff') return <Badge variant="default" className="text-xs">Sr. Staff</Badge>;
    if (level === 'staff')   return <Badge variant="secondary" className="text-xs">Staff</Badge>;
    return <Badge variant="outline" className="text-xs text-muted-foreground">Non-Staff</Badge>;
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function AdminUsers({ users, filters, sites }: Props) {
    const siteLabel = (value: string | null) =>
        sites.find((s) => s.value === value)?.label ?? '—';

    const [search, setSearch]       = useState(filters.search ?? '');
    const [toDelete, setToDelete]   = useState<UserRecord | null>(null);
    const [deleting, setDeleting]   = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm<{ file: File | null }>({ file: null });

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === 'all') delete (merged as Record<string, unknown>)[k];
        });
        router.get('/admin/users', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setDeleting(true);
        router.delete(`/admin/users/${toDelete.id}`, {
            onFinish: () => { setDeleting(false); setToDelete(null); },
        });
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users/import', { onSuccess: () => setImportOpen(false) });
    };

    const exportUrl = () => {
        const params = new URLSearchParams();
        if (filters.search)              params.set('search', filters.search);
        if (filters.site)                params.set('site', filters.site);
        if (filters.is_admin)            params.set('is_admin', filters.is_admin);
        if (filters.participation_level) params.set('participation_level', filters.participation_level);
        const qs = params.toString();
        return `/admin/users/export${qs ? '?' + qs : ''}`;
    };

    const hasActiveFilter = !!(filters.site || filters.is_admin || filters.participation_level || filters.search);
    const clearFilters = () => {
        setSearch('');
        router.get('/admin/users', {}, { preserveState: false, replace: true });
    };

    return (
        <>
            <Head title="Admin — Kelola Pengguna" />

            <div className="space-y-4">

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold">Kelola Pengguna</h2>
                        <p className="text-sm text-muted-foreground">{users.total} pengguna terdaftar dalam sistem</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <a href={exportUrl()}>
                            <Button size="sm" variant="outline" className="gap-1.5">
                                <Download size={14} /> Export
                            </Button>
                        </a>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setImportOpen(true)}>
                            <Upload size={14} /> Import
                        </Button>
                        <Link href="/admin/users/create">
                            <Button size="sm" className="gap-1.5">
                                <Plus size={14} /> Tambah Pengguna
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Toolbar: Search + Filter ── */}
                <div className="flex flex-wrap gap-2">
                    <form onSubmit={handleSearch} className="flex min-w-52 flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau NIK..."
                                className="pl-8 text-sm"
                            />
                        </div>
                        <Button type="submit" size="sm" variant="outline">Cari</Button>
                    </form>

                    <Select value={filters.site ?? 'all'} onValueChange={(v) => applyFilters({ site: v })}>
                        <SelectTrigger className="w-36 text-sm"><SelectValue placeholder="Semua Site" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Site</SelectItem>
                            {sites.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.participation_level ?? 'all'} onValueChange={(v) => applyFilters({ participation_level: v })}>
                        <SelectTrigger className="w-36 text-sm"><SelectValue placeholder="Semua Level" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Level</SelectItem>
                            <SelectItem value="nonstaff">Non-Staff</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="srstaff">Sr. Staff</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.is_admin ?? 'all'} onValueChange={(v) => applyFilters({ is_admin: v })}>
                        <SelectTrigger className="w-36 text-sm"><SelectValue placeholder="Semua Role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Role</SelectItem>
                            <SelectItem value="0">Karyawan</SelectItem>
                            <SelectItem value="1">Admin</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilter && (
                        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={clearFilters}>
                            <X size={13} /> Reset
                        </Button>
                    )}
                </div>

                {/* ── Result info ── */}
                <p className="text-xs text-muted-foreground">
                    {users.from !== null && users.to !== null
                        ? `Menampilkan ${users.from}–${users.to} dari ${users.total} pengguna`
                        : `${users.total} pengguna`}
                    {hasActiveFilter && ' (terfilter)'}
                </p>

                {/* ── Table ── */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-10 text-center">#</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead className="w-32">NIK</TableHead>
                                <TableHead className="w-28">Site</TableHead>
                                <TableHead>Jabatan</TableHead>
                                <TableHead className="w-28">Level</TableHead>
                                <TableHead className="w-24">Role</TableHead>
                                <TableHead className="w-28 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                                            <Users size={36} className="text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">Tidak ada pengguna yang sesuai filter.</p>
                                            {hasActiveFilter && (
                                                <Button size="sm" variant="outline" onClick={clearFilters}>Reset filter</Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.data.map((user, idx) => (
                                    <TableRow key={user.id} className={user.is_admin ? 'bg-primary/[0.03]' : ''}>
                                        <TableCell className="text-center text-xs text-muted-foreground">
                                            {(users.from ?? 1) + idx}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2.5">
                                                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${user.is_admin ? 'bg-primary' : 'bg-muted-foreground/40'}`}>
                                                    {getInitials(user.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium leading-tight">{user.name}</p>
                                                    {user.email && (
                                                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{user.nik ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{siteLabel(user.site)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{user.jabatan ?? '—'}</TableCell>
                                        <TableCell>{levelBadge(user.participation_level)}</TableCell>
                                        <TableCell>
                                            {user.is_admin ? (
                                                <Badge className="gap-1 text-xs">
                                                    <UserCheck size={10} /> Admin
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Karyawan</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={`/admin/users/${user.id}/edit`}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <Pencil size={14} />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setToDelete(user)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* ── Pagination ── */}
                {users.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <p className="text-xs text-muted-foreground">
                            Halaman {users.current_page} dari {users.last_page}
                        </p>
                        <div className="flex items-center gap-1">
                            {/* First */}
                            {users.current_page > 2 && (
                                <Link href={users.links[1]?.url ?? '#'}>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs">1</Button>
                                </Link>
                            )}
                            {users.current_page > 3 && (
                                <span className="px-1 text-xs text-muted-foreground">…</span>
                            )}
                            {/* Page window: prev, current, next */}
                            {users.links.slice(1, -1).filter((link) => {
                                const p = Number(link.label);
                                return p >= users.current_page - 1 && p <= users.current_page + 1;
                            }).map((link) => (
                                link.url ? (
                                    <Link key={link.label} href={link.url}>
                                        <Button
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-8 w-8 p-0 text-xs"
                                        >
                                            {link.label}
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button key={link.label} variant="default" size="sm" className="h-8 w-8 p-0 text-xs" disabled>
                                        {link.label}
                                    </Button>
                                )
                            ))}
                            {users.current_page < users.last_page - 2 && (
                                <span className="px-1 text-xs text-muted-foreground">…</span>
                            )}
                            {/* Last */}
                            {users.current_page < users.last_page - 1 && (
                                <Link href={users.links[users.links.length - 2]?.url ?? '#'}>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs">{users.last_page}</Button>
                                </Link>
                            )}
                            {/* Prev / Next */}
                            <div className="ml-2 flex gap-1">
                                {users.prev_page_url ? (
                                    <Link href={users.prev_page_url}>
                                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs">←</Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs" disabled>←</Button>
                                )}
                                {users.next_page_url ? (
                                    <Link href={users.next_page_url}>
                                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs">→</Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs" disabled>→</Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Dialog: Konfirmasi Hapus ── */}
            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Pengguna?</DialogTitle>
                        <DialogDescription className="space-y-1">
                            <span className="block">
                                Anda akan menghapus akun <strong>{toDelete?.name}</strong> (NIK: {toDelete?.nik ?? '—'}).
                            </span>
                            <span className="block text-destructive">
                                Semua data checklist dan laporan milik pengguna ini akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
                            </span>
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

            {/* ── Dialog: Import Excel ── */}
            <Dialog open={importOpen} onOpenChange={(open) => { if (!processing) setImportOpen(open); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet size={18} className="text-primary" />
                            Import Pengguna dari Excel
                        </DialogTitle>
                    </DialogHeader>

                    {/* Steps */}
                    <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                        {[
                            { n: 1, label: 'Download template' },
                            { n: 2, label: 'Isi data pengguna' },
                            { n: 3, label: 'Upload file' },
                        ].map((step, i) => (
                            <div key={step.n} className="flex flex-1 items-center gap-1.5">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {step.n}
                                </div>
                                <span className="text-xs text-muted-foreground leading-tight">{step.label}</span>
                                {i < 2 && <div className="ml-auto h-px w-3 shrink-0 bg-border" />}
                            </div>
                        ))}
                    </div>

                    {/* Template download */}
                    <a
                        href="/admin/users/import-template"
                        className="flex items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <Download size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-primary">Download Template Excel</p>
                            <p className="text-xs text-muted-foreground">Format sudah disesuaikan dengan sistem</p>
                        </div>
                    </a>

                    <form onSubmit={handleImport} className="space-y-3">
                        <div className={`relative rounded-lg border-2 border-dashed transition-colors ${data.file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/40'}`}>
                            {data.file ? (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                        <FileSpreadsheet size={16} className="text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{data.file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(data.file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setData('file', null); if (fileRef.current) fileRef.current.value = ''; }}
                                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center gap-1.5 px-4 py-6 text-center">
                                    <Upload size={20} className="text-muted-foreground/50" />
                                    <span className="text-sm font-medium">Pilih file Excel</span>
                                    <span className="text-xs text-muted-foreground">Format: .xlsx atau .xls</span>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="sr-only"
                                        onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            )}
                        </div>
                        {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}

                        <DialogFooter className="gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setImportOpen(false)} disabled={processing}>Batal</Button>
                            <Button type="submit" disabled={processing || !data.file} className="gap-2">
                                {processing ? (
                                    <>
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Mengupload...
                                    </>
                                ) : (
                                    <><Upload size={14} /> Upload & Import</>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
