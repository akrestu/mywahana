import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminTitle } from '@/components/admin/admin-title';
import {
    chipClass,
    DataTable,
    FilterBar,
    rowClass,
    SearchField,
    TableCard,
    TableEmpty,
    TablePager,
    theadRowClass,
} from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Target = {
    level: string;
    laporan_per_minggu: number;
    inspeksi_per_minggu: number;
    observasi_per_minggu: number;
    bugar_per_hari: number;
};

type UserRow = {
    id: number;
    name: string;
    nik: string | null;
    jabatan: string | null;
    site: string | null;
    participation_level: string;
};

type PaginatedUsers = {
    data: UserRow[];
    total: number;
    from: number | null;
    to: number | null;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Filters = {
    search?: string;
    site?: string;
    participation_level?: string;
};

type SiteOption = { value: string; label: string };

type Props = {
    targets: Target[];
    users: PaginatedUsers;
    filters: Filters;
    sites: SiteOption[];
};

type Level = 'nonstaff' | 'staff' | 'srstaff';
type TargetField = 'laporan' | 'inspeksi' | 'observasi' | 'bugar';

const LEVEL: Record<string, { label: string; cls: string }> = {
    nonstaff: { label: 'Non-staff', cls: 'bg-muted text-foreground' },
    staff: { label: 'Staff', cls: 'bg-accent-soft text-foreground' },
    srstaff: { label: 'Sr. Staff', cls: 'bg-info-soft text-info' },
};

const TARGET_COLUMNS: {
    key: TargetField;
    label: string;
    max: number;
    staffOnly?: boolean;
}[] = [
    { key: 'laporan', label: 'Laporan bahaya / minggu', max: 20 },
    { key: 'inspeksi', label: 'Inspeksi / minggu', max: 20, staffOnly: true },
    { key: 'observasi', label: 'Observasi / minggu', max: 20, staffOnly: true },
    { key: 'bugar', label: 'Bugar Selamat / hari', max: 3 },
];

export default function AdminTargets({ targets, users, filters, sites }: Props) {
    const [editTarget, setEditTarget] = useState<
        Record<string, Record<TargetField, string>>
    >(() =>
        Object.fromEntries(
            targets.map((t) => [
                t.level,
                {
                    laporan: String(t.laporan_per_minggu),
                    inspeksi: String(t.inspeksi_per_minggu),
                    observasi: String(t.observasi_per_minggu),
                    bugar: String(t.bugar_per_hari),
                },
            ]),
        ),
    );
    const [search, setSearch] = useState(filters.search ?? '');
    const [savingUser, setSavingUser] = useState<number | null>(null);

    const siteLabel = (v: string | null) =>
        v ? (sites.find((s) => s.value === v)?.label ?? v.toUpperCase()) : '—';

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach((k) => {
            const v = (merged as Record<string, unknown>)[k];

            if (v === 'all' || v === '' || v === undefined) {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/targets', merged, {
            preserveState: true,
            replace: true,
        });
    };

    const isDirty = (t: Target) => {
        const e = editTarget[t.level];

        return (
            e.laporan !== String(t.laporan_per_minggu) ||
            e.inspeksi !== String(t.inspeksi_per_minggu) ||
            e.observasi !== String(t.observasi_per_minggu) ||
            e.bugar !== String(t.bugar_per_hari)
        );
    };

    const saveTarget = (level: string) => {
        const isNonStaff = level === 'nonstaff';
        router.patch(
            `/admin/targets/${level}`,
            {
                laporan_per_minggu: Number(editTarget[level].laporan),
                inspeksi_per_minggu: isNonStaff
                    ? 0
                    : Number(editTarget[level].inspeksi),
                observasi_per_minggu: isNonStaff
                    ? 0
                    : Number(editTarget[level].observasi),
                bugar_per_hari: Number(editTarget[level].bugar),
            },
            { preserveScroll: true },
        );
    };

    const changeUserLevel = (userId: number, level: Level) => {
        setSavingUser(userId);
        router.patch(
            `/admin/users/${userId}/level`,
            { participation_level: level },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setSavingUser(null),
            },
        );
    };

    return (
        <>
            <Head title="Target Partisipasi" />

            <div className="flex flex-col gap-[18px] pb-10">
                <AdminTitle
                    eyebrow="Manajemen"
                    title="Target kinerja"
                    description="Target minimum pelaporan per level partisipasi. Inspeksi & observasi hanya berlaku untuk Staff dan Sr. Staff."
                />

                <TableCard>
                    <DataTable className="min-w-[860px]">
                        <thead>
                            <tr className={theadRowClass}>
                                <th>Level</th>
                                {TARGET_COLUMNS.map((c) => (
                                    <th key={c.key}>{c.label}</th>
                                ))}
                                <th>
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {targets.map((t) => {
                                const isNonStaff = t.level === 'nonstaff';
                                const lv = LEVEL[t.level];

                                return (
                                    <tr key={t.level} className={rowClass()}>
                                        <td>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2.5 py-1 text-[11px] font-bold',
                                                    lv?.cls,
                                                )}
                                            >
                                                {lv?.label ?? t.level}
                                            </span>
                                        </td>
                                        {TARGET_COLUMNS.map((c) => {
                                            const disabled =
                                                !!c.staffOnly && isNonStaff;

                                            return (
                                                <td key={c.key}>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={c.max}
                                                        aria-label={`${c.label} — ${lv?.label ?? t.level}`}
                                                        disabled={disabled}
                                                        value={
                                                            disabled
                                                                ? '0'
                                                                : (editTarget[
                                                                      t.level
                                                                  ]?.[c.key] ??
                                                                  '')
                                                        }
                                                        onChange={(e) =>
                                                            setEditTarget(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [t.level]: {
                                                                        ...prev[
                                                                            t
                                                                                .level
                                                                        ],
                                                                        [c.key]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                }),
                                                            )
                                                        }
                                                        className="tabular h-10 w-20 rounded-[12px]"
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td className="text-right">
                                            <Button
                                                size="sm"
                                                variant={
                                                    isDirty(t)
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    saveTarget(t.level)
                                                }
                                            >
                                                Simpan
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </DataTable>
                </TableCard>

                <div className="mt-2 flex flex-col gap-3">
                    <div>
                        <h2 className="text-base font-bold">
                            Level partisipasi karyawan
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Level menentukan program dan target K3 yang wajib
                            diikuti tiap karyawan.
                        </p>
                    </div>

                    <FilterBar>
                        <SearchField
                            value={search}
                            onChange={setSearch}
                            onSubmit={() => applyFilters({ search })}
                            placeholder="Cari nama atau NIK…"
                            label="Cari karyawan"
                        />
                        <Select
                            value={filters.site ?? 'all'}
                            onValueChange={(v) => applyFilters({ site: v })}
                        >
                            <SelectTrigger
                                className={chipClass(!!filters.site)}
                                aria-label="Site"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Site: semua</SelectItem>
                                {sites.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.participation_level ?? 'all'}
                            onValueChange={(v) =>
                                applyFilters({ participation_level: v })
                            }
                        >
                            <SelectTrigger
                                className={chipClass(
                                    !!filters.participation_level,
                                )}
                                aria-label="Level"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Level: semua</SelectItem>
                                <SelectItem value="nonstaff">
                                    Non-staff
                                </SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="srstaff">
                                    Sr. Staff
                                </SelectItem>
                            </SelectContent>
                        </Select>
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
                            <TableEmpty>
                                Tidak ada karyawan yang sesuai filter.
                            </TableEmpty>
                        ) : (
                            <DataTable className="min-w-[760px]">
                                <thead>
                                    <tr className={theadRowClass}>
                                        <th>Nama</th>
                                        <th>Jabatan</th>
                                        <th>Site</th>
                                        <th>Level partisipasi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((u) => (
                                        <tr key={u.id} className={rowClass()}>
                                            <td>
                                                <span className="block font-semibold">
                                                    {u.name}
                                                </span>
                                                <span className="tabular block text-xs text-muted-foreground">
                                                    {u.nik ?? '—'}
                                                </span>
                                            </td>
                                            <td className="max-w-[220px] truncate">
                                                {u.jabatan ?? '—'}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {siteLabel(u.site)}
                                            </td>
                                            <td>
                                                <div
                                                    role="radiogroup"
                                                    aria-label={`Level ${u.name}`}
                                                    className="inline-flex rounded-full bg-muted p-1"
                                                >
                                                    {(
                                                        [
                                                            'nonstaff',
                                                            'staff',
                                                            'srstaff',
                                                        ] as const
                                                    ).map((lv) => {
                                                        const on =
                                                            u.participation_level ===
                                                            lv;

                                                        return (
                                                            <button
                                                                key={lv}
                                                                type="button"
                                                                role="radio"
                                                                aria-checked={
                                                                    on
                                                                }
                                                                disabled={
                                                                    savingUser ===
                                                                    u.id
                                                                }
                                                                onClick={() =>
                                                                    !on &&
                                                                    changeUserLevel(
                                                                        u.id,
                                                                        lv,
                                                                    )
                                                                }
                                                                className={cn(
                                                                    'h-8 rounded-full px-3 text-xs transition-colors disabled:opacity-60',
                                                                    on
                                                                        ? 'bg-card font-bold shadow-[0_1px_2px_oklch(0.191_0_0/0.08)] dark:bg-primary dark:text-primary-foreground'
                                                                        : 'font-medium text-muted-foreground hover:text-foreground',
                                                                )}
                                                            >
                                                                {
                                                                    LEVEL[lv]
                                                                        .label
                                                                }
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        )}
                    </TableCard>
                </div>
            </div>
        </>
    );
}
