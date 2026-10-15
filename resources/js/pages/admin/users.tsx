import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronRight,
    Download,
    FileSpreadsheet,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    Upload,
    Users,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type UserRecord = {
    id: number;
    name: string;
    nik: string | null;
    email: string | null;
    jabatan: string | null;
    site: string | null;
    participation_level: string | null;
    is_admin: boolean;
    departemen?: string | null;
    two_factor_confirmed_at?: string | null;
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
type LevelCounts = {
    all: number;
    nonstaff: number;
    staff: number;
    srstaff: number;
    admin: number;
};
type Props = {
    users: PaginatedUsers;
    filters: Filters;
    sites: SiteOption[];
    admin_site: string | null;
    level_counts?: LevelCounts;
};

const LEVEL: Record<string, { label: string; cls: string }> = {
    nonstaff: { label: 'Non-staff', cls: 'bg-muted text-foreground' },
    staff: { label: 'Staff', cls: 'bg-accent-soft text-foreground' },
    srstaff: { label: 'Sr. Staff', cls: 'bg-info-soft text-info' },
    admin: { label: 'Admin', cls: 'bg-primary text-accent' },
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

export default function AdminUsers({
    users,
    filters,
    sites,
    admin_site,
    level_counts,
}: Props) {
    const siteLabel = (value: string | null) =>
        sites.find((s) => s.value === value)?.label ?? '—';

    const [search, setSearch] = useState(filters.search ?? '');
    const [toDelete, setToDelete] = useState<UserRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [editing, setEditing] = useState<UserRecord | null>(null);
    const [savingLevel, setSavingLevel] = useState(false);

    const changeLevel = (
        user: UserRecord,
        level: 'nonstaff' | 'staff' | 'srstaff',
    ) => {
        setSavingLevel(true);
        router.patch(
            `/admin/users/${user.id}/level`,
            { participation_level: level },
            {
                preserveScroll: true,
                onSuccess: () =>
                    setEditing({ ...user, participation_level: level }),
                onFinish: () => setSavingLevel(false),
            },
        );
    };
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm<{
        file: File | null;
    }>({ file: null });

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === 'all') {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/users', merged, {
            preserveState: true,
            replace: true,
        });
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
        router.delete(`/admin/users/${toDelete.id}`, {
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
            },
        });
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users/import', { onSuccess: () => setImportOpen(false) });
    };

    const exportUrl = () => {
        const params = new URLSearchParams();

        if (filters.search) {
            params.set('search', filters.search);
        }

        if (filters.site) {
            params.set('site', filters.site);
        }

        if (filters.is_admin) {
            params.set('is_admin', filters.is_admin);
        }

        if (filters.participation_level) {
            params.set('participation_level', filters.participation_level);
        }

        const qs = params.toString();

        return `/admin/users/export${qs ? '?' + qs : ''}`;
    };

    const hasActiveFilter = !!(
        filters.site ||
        filters.is_admin ||
        filters.participation_level ||
        filters.search
    );
    const clearFilters = () => {
        setSearch('');
        router.get('/admin/users', {}, { preserveState: false, replace: true });
    };

    const tabs = [
        {
            key: 'all',
            label: 'Semua',
            count: level_counts?.all,
            active: !filters.participation_level && !filters.is_admin,
            apply: { participation_level: undefined, is_admin: undefined },
        },
        {
            key: 'nonstaff',
            label: 'Non-staff',
            count: level_counts?.nonstaff,
            active: filters.participation_level === 'nonstaff',
            apply: { participation_level: 'nonstaff', is_admin: undefined },
        },
        {
            key: 'staff',
            label: 'Staff',
            count: level_counts?.staff,
            active: filters.participation_level === 'staff',
            apply: { participation_level: 'staff', is_admin: undefined },
        },
        {
            key: 'srstaff',
            label: 'Sr. Staff',
            count: level_counts?.srstaff,
            active: filters.participation_level === 'srstaff',
            apply: { participation_level: 'srstaff', is_admin: undefined },
        },
        {
            key: 'admin',
            label: 'Admin',
            count: level_counts?.admin,
            active: filters.is_admin === '1',
            apply: { is_admin: '1', participation_level: undefined },
        },
    ];

    return (
        <>
            <Head title="Manajemen Pengguna" />

            <div className="flex flex-col gap-4 pb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                            Manajemen
                        </p>
                        <h1 className="text-[28px] font-extrabold tracking-tight">
                            Pengguna
                        </h1>
                        {admin_site && (
                            <p className="text-xs text-muted-foreground">
                                Hanya pengguna {siteLabel(admin_site)}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImportOpen(true)}
                        >
                            <Upload /> Impor Excel
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <a href={exportUrl()}>
                                <Download /> Ekspor
                            </a>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/admin/users/create">
                                <Plus /> Tambah pengguna
                            </Link>
                        </Button>
                    </div>
                </div>

                <div
                    className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1"
                    role="group"
                    aria-label="Filter level"
                >
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            aria-pressed={t.active}
                            onClick={() => applyFilters(t.apply)}
                            className={cn(
                                'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition-colors',
                                t.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card hover:bg-muted',
                            )}
                        >
                            {t.label}
                            {t.count != null && (
                                <span
                                    className={cn(
                                        'tabular text-xs',
                                        t.active
                                            ? 'text-primary-foreground/70'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {t.count.toLocaleString('id-ID')}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-2 rounded-lg bg-card p-3 sm:flex-row">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau NIK…"
                            className="pl-10"
                            aria-label="Cari pengguna"
                        />
                    </form>
                    {!admin_site && (
                        <Select
                            value={filters.site ?? 'all'}
                            onValueChange={(v) =>
                                applyFilters({
                                    site: v === 'all' ? undefined : v,
                                })
                            }
                        >
                            <SelectTrigger
                                className="h-11 rounded-full sm:w-48"
                                aria-label="Site"
                            >
                                <SelectValue placeholder="Semua site" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua site</SelectItem>
                                {sites.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {hasActiveFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="self-center"
                            onClick={clearFilters}
                        >
                            <X /> Reset
                        </Button>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg bg-card">
                    {users.data.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                            <Users className="size-8 text-muted-foreground" />
                            <p className="font-bold">Tidak ada pengguna</p>
                            <p className="text-sm text-muted-foreground">
                                Coba ubah kata kunci atau filter.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                        <th className="px-4 py-3">Nama</th>
                                        <th className="px-3 py-3">
                                            Jabatan · Dept
                                        </th>
                                        <th className="px-3 py-3">Level</th>
                                        <th className="px-3 py-3">Site</th>
                                        <th className="px-3 py-3">2FA</th>
                                        <th className="px-3 py-3 text-right">
                                            <span className="sr-only">
                                                Aksi
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((u) => {
                                        const level =
                                            LEVEL[
                                                u.is_admin
                                                    ? 'admin'
                                                    : (u.participation_level ??
                                                      'nonstaff')
                                            ] ?? LEVEL.nonstaff;

                                        return (
                                            <tr
                                                key={u.id}
                                                onClick={() => setEditing(u)}
                                                className={cn(
                                                    'cursor-pointer border-b border-border/60 transition-colors last:border-0',
                                                    editing?.id === u.id
                                                        ? 'bg-accent-soft'
                                                        : 'hover:bg-muted/50',
                                                )}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-extrabold">
                                                            {getInitials(
                                                                u.name,
                                                            )}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block max-w-[200px] truncate font-semibold">
                                                                {u.name}
                                                            </span>
                                                            <span className="tabular block text-xs text-muted-foreground">
                                                                {u.nik ?? '—'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="max-w-[200px] truncate">
                                                        {u.jabatan ?? '—'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {u.departemen ?? '—'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2.5 py-1 text-xs font-bold',
                                                            level.cls,
                                                        )}
                                                    >
                                                        {level.label}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {siteLabel(u.site)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {u.two_factor_confirmed_at ? (
                                                        <span className="flex items-center gap-1 text-xs font-semibold text-success">
                                                            <ShieldCheck className="size-3.5" />{' '}
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            Belum
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                        <span className="tabular">
                            {users.from ?? 0}–{users.to ?? 0} dari{' '}
                            {users.total.toLocaleString('id-ID')}
                        </span>
                        <div className="flex gap-2">
                            {users.prev_page_url ? (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={users.prev_page_url}>
                                        Sebelumnya
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" disabled>
                                    Sebelumnya
                                </Button>
                            )}
                            {users.next_page_url ? (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={users.next_page_url}>
                                        Berikutnya
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" disabled>
                                    Berikutnya
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Sheet
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <SheetContent
                    side="right"
                    className="w-full gap-0 border-0 p-0 sm:max-w-md"
                >
                    {editing && (
                        <>
                            <SheetHeader className="px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-2">
                                <SheetTitle className="text-left text-xl font-extrabold">
                                    Pengguna
                                </SheetTitle>
                                <SheetDescription className="text-left">
                                    Ubah level langsung di sini, atau buka form
                                    lengkap.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5">
                                <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-accent-foreground">
                                        {getInitials(editing.name)}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate font-bold">
                                            {editing.name}
                                        </span>
                                        <span className="tabular block text-xs text-muted-foreground">
                                            NIK {editing.nik ?? '—'}
                                        </span>
                                    </span>
                                </div>

                                <dl className="overflow-hidden rounded-lg border border-border">
                                    {[
                                        {
                                            label: 'Jabatan',
                                            value: editing.jabatan,
                                        },
                                        {
                                            label: 'Departemen',
                                            value: editing.departemen,
                                        },
                                        {
                                            label: 'Site',
                                            value: siteLabel(editing.site),
                                        },
                                        {
                                            label: 'Email',
                                            value: editing.email,
                                        },
                                        {
                                            label: 'Akses admin',
                                            value: editing.is_admin
                                                ? 'Ya'
                                                : 'Tidak',
                                        },
                                        {
                                            label: '2FA',
                                            value: editing.two_factor_confirmed_at
                                                ? 'Aktif'
                                                : 'Belum',
                                        },
                                    ].map((r) => (
                                        <div
                                            key={r.label}
                                            className="flex justify-between gap-4 border-b border-border/60 px-4 py-3 text-sm last:border-0"
                                        >
                                            <dt className="text-muted-foreground">
                                                {r.label}
                                            </dt>
                                            <dd className="truncate text-right font-semibold">
                                                {r.value || '—'}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>

                                <div
                                    role="radiogroup"
                                    aria-label="Level partisipasi"
                                    className="flex flex-col gap-2"
                                >
                                    <span className="text-[13px] font-semibold">
                                        Level partisipasi
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(
                                            [
                                                'nonstaff',
                                                'staff',
                                                'srstaff',
                                            ] as const
                                        ).map((lv) => {
                                            const on =
                                                (editing.participation_level ??
                                                    'nonstaff') === lv;

                                            return (
                                                <button
                                                    key={lv}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={on}
                                                    disabled={savingLevel}
                                                    onClick={() =>
                                                        changeLevel(editing, lv)
                                                    }
                                                    className={cn(
                                                        'h-11 rounded-full text-[13px] font-bold transition-colors disabled:opacity-60',
                                                        on
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'border border-border bg-card hover:bg-muted',
                                                    )}
                                                >
                                                    {LEVEL[lv].label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Menentukan program & target K3 yang
                                        wajib diikuti.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 border-t border-border/60 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                                <Button
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                        setToDelete(editing);
                                        setEditing(null);
                                    }}
                                >
                                    <Trash2 /> Hapus
                                </Button>
                                <Button asChild className="flex-1">
                                    <Link
                                        href={`/admin/users/${editing.id}/edit`}
                                    >
                                        <Pencil /> Edit lengkap
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Dialog: Konfirmasi Hapus ── */}
            <Dialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Pengguna?</DialogTitle>
                        <DialogDescription className="space-y-1">
                            <span className="block">
                                Anda akan menghapus akun{' '}
                                <strong>{toDelete?.name}</strong> (NIK:{' '}
                                {toDelete?.nik ?? '—'}).
                            </span>
                            <span className="block text-destructive">
                                Semua data checklist dan laporan milik pengguna
                                ini akan ikut terhapus. Tindakan ini tidak bisa
                                dibatalkan.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
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
                            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Import Excel ── */}
            <Dialog
                open={importOpen}
                onOpenChange={(open) => {
                    if (!processing) {
                        setImportOpen(open);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet
                                size={18}
                                className="text-primary"
                            />
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
                            <div
                                key={step.n}
                                className="flex flex-1 items-center gap-1.5"
                            >
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                                    {step.n}
                                </div>
                                <span className="text-xs leading-tight text-muted-foreground">
                                    {step.label}
                                </span>
                                {i < 2 && (
                                    <div className="ml-auto h-px w-3 shrink-0 bg-border" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Template download */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Langkah 1 — Download template
                        </p>
                        <a
                            href="/admin/users/import-template"
                            className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
                                <Download size={16} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium">
                                    Download Template Excel
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Format sudah disesuaikan dengan sistem
                                </p>
                            </div>
                        </a>
                    </div>

                    <div className="relative flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            Langkah 3 — Upload file
                        </span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <form onSubmit={handleImport} className="space-y-3">
                        <div
                            className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${data.file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/40'}`}
                        >
                            {data.file ? (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                        <FileSpreadsheet
                                            size={16}
                                            className="text-primary"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="text-sm font-medium"
                                            title={data.file.name}
                                        >
                                            {data.file.name.length > 30
                                                ? data.file.name.slice(0, 13) +
                                                  '…' +
                                                  data.file.name.slice(-12)
                                                : data.file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(data.file.size / 1024).toFixed(1)}{' '}
                                            KB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('file', null);

                                            if (fileRef.current) {
                                                fileRef.current.value = '';
                                            }
                                        }}
                                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center gap-1.5 px-4 py-6 text-center">
                                    <Upload
                                        size={20}
                                        className="text-muted-foreground/50"
                                    />
                                    <span className="text-sm font-medium">
                                        Pilih file Excel
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Format: .xlsx atau .xls
                                    </span>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="sr-only"
                                        onChange={(e) =>
                                            setData(
                                                'file',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </label>
                            )}
                        </div>
                        {errors.file && (
                            <p className="text-sm text-destructive">
                                {errors.file}
                            </p>
                        )}

                        <DialogFooter className="gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setImportOpen(false)}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !data.file}
                                className="gap-2"
                            >
                                {processing ? (
                                    <>
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Mengupload...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={14} /> Upload & Import
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
