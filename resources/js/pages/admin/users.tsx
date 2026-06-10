import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, Pencil, Plus, Search, Trash2, Upload, UserCheck, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Filters = {
    search?: string;
    site?: string;
    is_admin?: string;
    participation_level?: string;
};

type SiteOption = { value: string; label: string };
type Props = { users: PaginatedUsers; filters: Filters; sites: SiteOption[] };

function levelLabel(level: string | null): string {
    if (level === 'staff') return 'Staff';
    if (level === 'srstaff') return 'Sr. Staff';
    return 'Non-Staff';
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}


export default function AdminUsers({ users, filters, sites }: Props) {
    const siteLabel = (value: string | null) =>
        sites.find((s) => s.value === value)?.label ?? '—';
    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<UserRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
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
        post('/admin/users/import', {
            onSuccess: () => setImportOpen(false),
        });
    };

    const exportUrl = () => {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.site) params.set('site', filters.site);
        if (filters.is_admin) params.set('is_admin', filters.is_admin);
        if (filters.participation_level) params.set('participation_level', filters.participation_level);
        const qs = params.toString();
        return `/admin/users/export${qs ? '?' + qs : ''}`;
    };

    return (
        <>
            <Head title="Admin — Kelola Pengguna" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold">Kelola Pengguna</h2>
                        <p className="text-sm text-muted-foreground">
                            {users.total} pengguna terdaftar dalam sistem
                        </p>
                    </div>
                    <Link href="/admin/users/create">
                        <Button className="gap-2">
                            <Plus size={16} /> Tambah Pengguna
                        </Button>
                    </Link>
                </div>

                {/* Tools: Export & Import */}
                <div className="flex gap-2">
                    <a href={exportUrl()}>
                        <Button size="sm" variant="outline" className="gap-2">
                            <Download size={14} /> Export Excel
                        </Button>
                    </a>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
                        <Upload size={14} /> Import Excel
                    </Button>
                </div>

                {/* Filter */}
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
                        <Select value={filters.site ?? 'all'} onValueChange={(v) => applyFilters({ site: v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Site" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Site</SelectItem>
                                {sites.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filters.participation_level ?? 'all'} onValueChange={(v) => applyFilters({ participation_level: v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Level</SelectItem>
                                <SelectItem value="nonstaff">Non-Staff</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="srstaff">Sr. Staff</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.is_admin ?? 'all'} onValueChange={(v) => applyFilters({ is_admin: v })}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Semua Role" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Role</SelectItem>
                                <SelectItem value="0">Karyawan</SelectItem>
                                <SelectItem value="1">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Menampilkan {users.data.length} dari {users.total} pengguna
                    </p>
                </div>

                {/* User List */}
                {users.data.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <Users size={40} className="text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Tidak ada pengguna yang sesuai filter.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {users.data.map((user) => (
                            <Card
                                key={user.id}
                                className={user.is_admin ? 'border-l-4 border-l-primary' : ''}
                            >
                                <CardContent className="py-3">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${user.is_admin ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                                            {getInitials(user.name)}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold leading-tight">{user.name}</p>
                                                {user.is_admin && (
                                                    <Badge className="gap-1 px-1.5 py-0 text-xs">
                                                        <UserCheck size={10} /> Admin
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                NIK: {user.nik ?? '—'} · {siteLabel(user.site)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {user.jabatan ?? 'Jabatan belum diisi'} · {levelLabel(user.participation_level)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center">
                                            <Link href={`/admin/users/${user.id}/edit`}>
                                                <Button size="sm" variant="outline" className="h-9 w-full gap-1.5 sm:w-auto">
                                                    <Pencil size={13} /> Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-9 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => setToDelete(user)}
                                            >
                                                <Trash2 size={13} /> Hapus
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {(users.prev_page_url || users.next_page_url) && (
                    <div className="flex justify-between gap-2 pt-2">
                        {users.prev_page_url ? (
                            <Link href={users.prev_page_url}>
                                <Button variant="outline">← Sebelumnya</Button>
                            </Link>
                        ) : <div />}
                        {users.next_page_url && (
                            <Link href={users.next_page_url}>
                                <Button variant="outline">Berikutnya →</Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Dialog: Konfirmasi Hapus */}
            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
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
                        <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Import Excel */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Pengguna dari Excel</DialogTitle>
                        <DialogDescription>
                            Upload file Excel (.xlsx) yang sudah diisi sesuai format.{' '}
                            <a href="/admin/users/import-template" className="font-medium text-primary underline">
                                Download template di sini
                            </a>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleImport} className="space-y-4">
                        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
                            <Upload size={24} className="mx-auto mb-2 text-muted-foreground/50" />
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="block w-full cursor-pointer text-sm"
                                onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                            />
                            <p className="mt-2 text-xs text-muted-foreground">Format yang diterima: .xlsx atau .xls</p>
                            {errors.file && <p className="mt-1 text-sm text-destructive">{errors.file}</p>}
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing || !data.file}>
                                {processing ? 'Mengupload...' : 'Upload & Import'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
