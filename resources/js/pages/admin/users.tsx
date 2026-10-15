import { Head, router, useForm } from '@inertiajs/react';
import {
    Download,
    FileSpreadsheet,
    Plus,
    Trash2,
    Upload,
    Users,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AdminTitle } from '@/components/admin/admin-title';
import {
    adminButton,
    adminButtonPrimary,
    chipClass,
    DataTable,
    FilterBar,
    MoreMenu,
    rowClass,
    SearchField,
    TableCard,
    TablePager,
    theadRowClass,
} from '@/components/admin/data-table';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type UserRecord = {
    id: number;
    name: string;
    nik: string | null;
    email: string | null;
    jabatan: string | null;
    departemen?: string | null;
    site: string | null;
    site_ids: string[];
    participation_level: string | null;
    is_admin: boolean;
    two_factor_confirmed_at?: string | null;
    last_active_at?: string | null;
};

type PaginatedUsers = {
    data: UserRecord[];
    total: number;
    from: number | null;
    to: number | null;
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

type Level = 'nonstaff' | 'staff' | 'srstaff';

const LEVEL: Record<string, { label: string; cls: string }> = {
    nonstaff: { label: 'Non-staff', cls: 'bg-muted text-foreground' },
    staff: { label: 'Staff', cls: 'bg-accent-soft text-foreground' },
    srstaff: { label: 'Sr. Staff', cls: 'bg-info-soft text-info' },
    admin: { label: 'Admin', cls: 'bg-primary text-accent' },
};

const DEPARTEMEN = [
    'Production',
    'Maintenance',
    'Supply Chain',
    'Engineering',
    'HSE',
    'HRGA',
    'Management',
] as const;

/** Compact relative time for the "Aktif" column, e.g. "2 jam lalu". */
function sinceLabel(iso?: string | null) {
    if (!iso) {
        return 'Belum pernah';
    }

    const min = Math.max(
        0,
        Math.round((Date.now() - new Date(iso).getTime()) / 60000),
    );

    if (min < 2) {
        return 'Baru saja';
    }

    if (min < 60) {
        return min + ' mnt lalu';
    }

    const h = Math.round(min / 60);

    if (h < 24) {
        return h + ' jam lalu';
    }

    const d = Math.round(h / 24);

    return d < 30
        ? d + ' hari lalu'
        : new Date(iso).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
          });
}

const initials = (name: string) =>
    name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

/** Small labelled field wrapper for the edit panel (AUsers spacing). */
function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {label}
            {children}
            <InputError message={error} />
        </label>
    );
}

type PanelFields = {
    name: string;
    nik: string;
    email: string;
    password: string;
    password_confirmation: string;
    jabatan: string;
    departemen: string;
    site: string;
    site_ids: string[];
    is_admin: boolean;
    participation_level: Level;
};

/** Right-hand edit/create panel from AUsers.html. */
function UserPanel({
    user,
    sites,
    adminSite,
    onClose,
    onDelete,
}: {
    user: UserRecord | null;
    sites: SiteOption[];
    adminSite: string | null;
    onClose: () => void;
    onDelete: (u: UserRecord) => void;
}) {
    const isEdit = !!user;
    const [showPassword, setShowPassword] = useState(!isEdit);
    const form = useForm<PanelFields>({
        name: user?.name ?? '',
        nik: user?.nik ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
        jabatan: user?.jabatan ?? '',
        departemen: user?.departemen ?? '',
        site: user?.site ?? adminSite ?? '',
        site_ids: user?.site_ids ?? [],
        is_admin: user?.is_admin ?? false,
        participation_level: (user?.participation_level as Level) ?? 'nonstaff',
    });
    const { data, setData, errors, processing } = form;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };

        if (user) {
            form.put(`/admin/users/${user.id}`, opts);
        } else {
            form.post('/admin/users', opts);
        }
    };

    return (
        <aside
            aria-label={isEdit ? 'Edit pengguna' : 'Tambah pengguna'}
            className="flex w-full flex-col gap-3.5 self-start rounded-lg border border-border bg-card p-5 shadow-[0_20px_48px_oklch(0.191_0_0/0.08)] lg:sticky lg:top-4 lg:max-w-[360px] lg:flex-[1_1_300px]"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-bold">
                    {isEdit ? 'Edit pengguna' : 'Tambah pengguna'}
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup panel"
                    className="flex size-9 items-center justify-center rounded-full bg-background hover:bg-muted"
                >
                    <X className="size-4" />
                </button>
            </div>

            {user && (
                <div className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft font-extrabold">
                        {initials(user.name)}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate font-bold">
                            {user.name}
                        </span>
                        <span className="tabular block text-xs text-muted-foreground">
                            NIK {user.nik ?? '—'}
                        </span>
                    </span>
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <Field label="Nama lengkap" error={errors.name}>
                    <Input
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="h-11 rounded-[14px]"
                        required
                    />
                </Field>
                <Field label="NIK" error={errors.nik}>
                    <Input
                        value={data.nik}
                        onChange={(e) => setData('nik', e.target.value)}
                        className="tabular h-11 rounded-[14px]"
                        required
                    />
                </Field>
                <Field label="Jabatan" error={errors.jabatan}>
                    <Input
                        value={data.jabatan}
                        onChange={(e) => setData('jabatan', e.target.value)}
                        className="h-11 rounded-[14px]"
                    />
                </Field>
                <Field label="Departemen" error={errors.departemen}>
                    <Select
                        value={data.departemen || 'none'}
                        onValueChange={(v) =>
                            setData('departemen', v === 'none' ? '' : v)
                        }
                    >
                        <SelectTrigger className="h-11 w-full rounded-[14px] border-0 bg-input">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                — Belum dipilih —
                            </SelectItem>
                            {DEPARTEMEN.map((d) => (
                                <SelectItem key={d} value={d}>
                                    {d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <div className="flex flex-col gap-1.5 text-[13px] font-semibold">
                    Level partisipasi
                    <div
                        role="radiogroup"
                        aria-label="Level partisipasi"
                        className="flex rounded-full bg-muted p-1"
                    >
                        {(['nonstaff', 'staff', 'srstaff'] as const).map(
                            (lv) => {
                                const on = data.participation_level === lv;

                                return (
                                    <button
                                        key={lv}
                                        type="button"
                                        role="radio"
                                        aria-checked={on}
                                        onClick={() =>
                                            setData('participation_level', lv)
                                        }
                                        className={cn(
                                            'h-9 flex-1 rounded-full text-xs transition-colors',
                                            on
                                                ? 'bg-card font-bold shadow-[0_1px_2px_oklch(0.191_0_0/0.08)]'
                                                : 'font-medium text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        {LEVEL[lv].label}
                                    </button>
                                );
                            },
                        )}
                    </div>
                    <InputError message={errors.participation_level} />
                </div>

                {!adminSite && (
                    <Field label="Site" error={errors.site}>
                        <Select
                            value={data.site || 'none'}
                            onValueChange={(v) =>
                                setData('site', v === 'none' ? '' : v)
                            }
                        >
                            <SelectTrigger className="h-11 w-full rounded-[14px] border-0 bg-input">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    — Belum dipilih —
                                </SelectItem>
                                {sites.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}

                {!adminSite && sites.length > 1 && (
                    <fieldset className="flex flex-col gap-2 text-[13px]">
                        <legend className="mb-1.5 font-semibold">
                            Site tambahan
                        </legend>
                        {sites.map((s) => {
                            const checked = data.site_ids.includes(s.value);

                            return (
                                <label
                                    key={s.value}
                                    className="flex items-center gap-2.5"
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={() =>
                                            setData(
                                                'site_ids',
                                                checked
                                                    ? data.site_ids.filter(
                                                          (v) => v !== s.value,
                                                      )
                                                    : [
                                                          ...data.site_ids,
                                                          s.value,
                                                      ],
                                            )
                                        }
                                    />
                                    {s.label}
                                </label>
                            );
                        })}
                        <InputError message={errors.site_ids} />
                    </fieldset>
                )}

                <Field label="Email" error={errors.email}>
                    <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Opsional"
                        className="h-11 rounded-[14px]"
                    />
                </Field>

                {!adminSite && (
                    <label className="flex min-h-11 items-center gap-2.5 text-[13px] font-semibold">
                        <Checkbox
                            checked={data.is_admin}
                            onCheckedChange={(v) => setData('is_admin', !!v)}
                        />
                        Akses admin
                    </label>
                )}

                {showPassword && (
                    <>
                        <Field
                            label={isEdit ? 'Kata sandi baru' : 'Kata sandi'}
                            error={errors.password}
                        >
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder="Minimal 8 karakter"
                                className="h-11 rounded-[14px]"
                                required={!isEdit}
                                autoComplete="new-password"
                            />
                        </Field>
                        <Field label="Ulangi kata sandi">
                            <Input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                className="h-11 rounded-[14px]"
                                required={!isEdit}
                                autoComplete="new-password"
                            />
                        </Field>
                    </>
                )}

                <div className="mt-1 flex gap-2">
                    {isEdit && !showPassword && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 flex-1"
                            onClick={() => setShowPassword(true)}
                        >
                            Reset kata sandi
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className="h-11 flex-1"
                        disabled={processing}
                    >
                        {processing ? 'Menyimpan…' : 'Simpan'}
                    </Button>
                </div>

                {user && (
                    <button
                        type="button"
                        onClick={() => onDelete(user)}
                        className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-destructive hover:underline"
                    >
                        <Trash2 className="size-4" /> Hapus pengguna
                    </button>
                )}
            </form>
        </aside>
    );
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
    // null = closed, 'new' = create mode, record = edit mode.
    const [panel, setPanel] = useState<UserRecord | 'new' | null>(null);
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

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/users/${toDelete.id}`, {
            onSuccess: () => setPanel(null),
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
            },
        });
    };

    const handleImport = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/users/import', { onSuccess: () => setImportOpen(false) });
    };

    const exportUrl = (() => {
        const params = new URLSearchParams();

        for (const key of [
            'search',
            'site',
            'is_admin',
            'participation_level',
        ] as const) {
            if (filters[key]) {
                params.set(key, filters[key]!);
            }
        }

        const qs = params.toString();

        return `/admin/users/export${qs ? '?' + qs : ''}`;
    })();

    const tabs = [
        {
            key: 'all',
            label: 'Semua',
            count: level_counts?.all,
            active: !filters.participation_level && !filters.is_admin,
            apply: { participation_level: undefined, is_admin: undefined },
        },
        ...(['nonstaff', 'staff', 'srstaff'] as const).map((lv) => ({
            key: lv,
            label: LEVEL[lv].label,
            count: level_counts?.[lv],
            active: filters.participation_level === lv,
            apply: { participation_level: lv, is_admin: undefined },
        })),
        {
            key: 'admin',
            label: 'Admin',
            count: level_counts?.admin,
            active: filters.is_admin === '1',
            apply: { is_admin: '1', participation_level: undefined },
        },
    ];

    const editingId = panel && panel !== 'new' ? panel.id : null;

    return (
        <>
            <Head title="Manajemen Pengguna" />

            <div className="flex flex-col gap-5 pb-10 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-col gap-4 lg:flex-[999_1_560px]">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <AdminTitle
                            eyebrow="Manajemen"
                            title="Pengguna"
                            description={
                                admin_site
                                    ? `Hanya pengguna ${siteLabel(admin_site)}`
                                    : undefined
                            }
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setImportOpen(true)}
                                className={adminButton}
                            >
                                Impor Excel
                            </button>
                            <button
                                type="button"
                                onClick={() => setPanel('new')}
                                className={adminButtonPrimary}
                            >
                                <Plus /> Tambah pengguna
                            </button>
                            <MoreMenu>
                                <DropdownMenuItem asChild>
                                    <a href={exportUrl}>
                                        <Download /> Ekspor Excel
                                    </a>
                                </DropdownMenuItem>
                            </MoreMenu>
                        </div>
                    </div>

                    <div
                        role="group"
                        aria-label="Filter level"
                        className="flex flex-wrap gap-2"
                    >
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                aria-pressed={t.active}
                                onClick={() => applyFilters(t.apply)}
                                className={cn(
                                    'flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
                                    t.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border border-border bg-card hover:bg-muted',
                                )}
                            >
                                {t.label}
                                {t.count != null &&
                                    ` · ${t.count.toLocaleString('id-ID')}`}
                            </button>
                        ))}
                    </div>

                    <FilterBar>
                        <SearchField
                            value={search}
                            onChange={setSearch}
                            onSubmit={() => applyFilters({ search })}
                            placeholder="Cari nama atau NIK…"
                            label="Cari pengguna"
                        />
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
                                    className={chipClass(!!filters.site)}
                                    aria-label="Site"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Site: semua
                                    </SelectItem>
                                    {sites.map((s) => (
                                        <SelectItem
                                            key={s.value}
                                            value={s.value}
                                        >
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </FilterBar>

                    <TableCard
                        footer={
                            <TablePager
                                from={users.from}
                                to={users.to}
                                total={users.total}
                                prev={users.prev_page_url}
                                next={users.next_page_url}
                            />
                        }
                    >
                        {users.data.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                                <Users className="size-8 text-muted-foreground" />
                                <p className="font-bold">Tidak ada pengguna</p>
                                <p className="text-sm text-muted-foreground">
                                    Coba ubah kata kunci atau filter.
                                </p>
                            </div>
                        ) : (
                            <DataTable className="min-w-[720px]">
                                <thead>
                                    <tr className={theadRowClass}>
                                        <th>Nama</th>
                                        <th>Jabatan · Dept</th>
                                        <th>Level</th>
                                        <th>Site</th>
                                        <th>2FA</th>
                                        <th>Aktif</th>
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
                                                onClick={() => setPanel(u)}
                                                className={cn(
                                                    'cursor-pointer',
                                                    rowClass(
                                                        editingId === u.id,
                                                    ),
                                                )}
                                            >
                                                <td>
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                                            {initials(u.name)}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setPanel(u);
                                                                }}
                                                                className="block max-w-[220px] truncate text-left font-bold hover:underline"
                                                            >
                                                                {u.name}
                                                            </button>
                                                            <span className="tabular block text-xs text-muted-foreground">
                                                                {u.nik ?? '—'}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="block max-w-[220px] truncate">
                                                        {u.jabatan ?? '—'}
                                                    </span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {u.departemen ?? '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
                                                            level.cls,
                                                        )}
                                                    >
                                                        {level.label}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    {siteLabel(u.site)}
                                                </td>
                                                <td>
                                                    {u.two_factor_confirmed_at ? (
                                                        <span className="text-xs font-semibold text-success">
                                                            ✓ Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-muted-foreground">
                                                            Belum
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-xs whitespace-nowrap text-muted-foreground">
                                                    {sinceLabel(
                                                        u.last_active_at,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </DataTable>
                        )}
                    </TableCard>
                </div>

                {panel && (
                    <UserPanel
                        key={panel === 'new' ? 'new' : panel.id}
                        user={panel === 'new' ? null : panel}
                        sites={sites}
                        adminSite={admin_site}
                        onClose={() => setPanel(null)}
                        onDelete={(u) => setToDelete(u)}
                    />
                )}
            </div>

            {/* ── Dialog: Konfirmasi Hapus ── */}
            <Dialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus pengguna?</DialogTitle>
                        <DialogDescription className="space-y-1">
                            <span className="block">
                                Anda akan menghapus akun{' '}
                                <strong>{toDelete?.name}</strong> (NIK{' '}
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
                            variant="ghost"
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
                            {deleting ? 'Menghapus…' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Impor Excel ── */}
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
                        <DialogTitle>Impor pengguna dari Excel</DialogTitle>
                        <DialogDescription>
                            Unduh template, isi data pengguna, lalu unggah
                            filenya.
                        </DialogDescription>
                    </DialogHeader>

                    <a
                        href="/admin/users/import-template"
                        className="flex items-center gap-3 rounded-md bg-muted px-4 py-3 transition-colors hover:bg-border/60"
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card">
                            <Download className="size-4" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-bold">
                                Unduh template Excel
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                Format sudah disesuaikan dengan sistem
                            </span>
                        </span>
                    </a>

                    <form onSubmit={handleImport} className="space-y-3">
                        <div
                            className={cn(
                                'relative overflow-hidden rounded-lg border-2 border-dashed transition-colors',
                                data.file
                                    ? 'border-foreground bg-accent-soft'
                                    : 'border-border hover:border-muted-foreground/40',
                            )}
                        >
                            {data.file ? (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <FileSpreadsheet className="size-5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="truncate text-sm font-semibold"
                                            title={data.file.name}
                                        >
                                            {data.file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(data.file.size / 1024).toFixed(1)}{' '}
                                            KB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Hapus file"
                                        onClick={() => {
                                            setData('file', null);

                                            if (fileRef.current) {
                                                fileRef.current.value = '';
                                            }
                                        }}
                                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center gap-1.5 px-4 py-6 text-center">
                                    <Upload className="size-5 text-muted-foreground" />
                                    <span className="text-sm font-semibold">
                                        Pilih file Excel
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Format .xlsx atau .xls
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
                        <InputError message={errors.file} />

                        <DialogFooter className="gap-2 pt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setImportOpen(false)}
                                disabled={processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !data.file}
                            >
                                {processing ? 'Mengunggah…' : 'Unggah & impor'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
