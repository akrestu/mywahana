import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
    participation_level?: string;
};

type SiteOption = { value: string; label: string };

type Props = {
    targets: Target[];
    users: PaginatedUsers;
    filters: Filters;
    sites: SiteOption[];
};

const LEVEL_LABELS: Record<string, string> = {
    nonstaff: 'Non-Staff',
    staff: 'Staff',
    srstaff: 'Sr. Staff',
};

function levelBadge(level: string) {
    if (level === 'srstaff') {
return <Badge variant="default" className="text-xs">Sr. Staff</Badge>;
}

    if (level === 'staff')   {
return <Badge variant="secondary" className="text-xs">Staff</Badge>;
}

    return <Badge variant="outline" className="text-xs text-muted-foreground">Non-Staff</Badge>;
}

export default function AdminTargets({ targets, users, filters, sites }: Props) {
    usePage<{ flash?: { success?: string } }>();

    const [editTarget, setEditTarget] = useState<Record<string, { laporan: string; inspeksi: string; observasi: string; bugar: string }>>(() =>
        Object.fromEntries(targets.map((t) => [t.level, {
            laporan: String(t.laporan_per_minggu),
            inspeksi: String(t.inspeksi_per_minggu),
            observasi: String(t.observasi_per_minggu),
            bugar: String(t.bugar_per_hari),
        }]))
    );
    const [userLevelEdit, setUserLevelEdit] = useState<Record<number, string>>(() =>
        Object.fromEntries(users.data.map((u) => [u.id, u.participation_level]))
    );
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (newFilters: Partial<Filters>) => {
        const merged = { ...filters, ...newFilters, search };
        Object.keys(merged).forEach((k) => {
            if ((merged as Record<string, unknown>)[k] === 'all' || (merged as Record<string, unknown>)[k] === '') {
                delete (merged as Record<string, unknown>)[k];
            }
        });
        router.get('/admin/targets', merged, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const hasActiveFilter = !!(filters.site || filters.participation_level || filters.search);
    const clearFilters = () => {
        setSearch('');
        router.get('/admin/targets', {}, { preserveState: false, replace: true });
    };

    const saveTarget = (level: string) => {
        const isNonStaff = level === 'nonstaff';
        router.patch(`/admin/targets/${level}`, {
            laporan_per_minggu: Number(editTarget[level].laporan),
            inspeksi_per_minggu: isNonStaff ? 0 : Number(editTarget[level].inspeksi),
            observasi_per_minggu: isNonStaff ? 0 : Number(editTarget[level].observasi),
            bugar_per_hari: Number(editTarget[level].bugar),
        });
    };

    const saveUserLevel = (userId: number) => {
        router.patch(`/admin/users/${userId}/level`, {
            participation_level: userLevelEdit[userId],
        }, { preserveState: true });
    };

    return (
        <>
            <Head title="Target Partisipasi" />

            <div className="space-y-6">
                {/* Target per Level */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Target Pelaporan per Level</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Atur target minimum per level: Laporan Bahaya, Form Inspeksi (Kantor/Tambang/Workshop/Mess), Form OK (Observasi Keselamatan), dan Bugar Selamat. Form Inspeksi &amp; OK hanya berlaku untuk Staff dan Sr. Staff.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {targets.map((t) => {
                                const isNonStaff = t.level === 'nonstaff';

                                return (
                                <div key={t.level} className="flex flex-col gap-3 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{LEVEL_LABELS[t.level] ?? t.level}</span>
                                        {isNonStaff && (
                                            <span className="text-xs text-muted-foreground">(Form Inspeksi &amp; OK tidak berlaku)</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="whitespace-nowrap text-sm text-muted-foreground">Laporan Bahaya/minggu:</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={20}
                                                className="w-20"
                                                value={editTarget[t.level]?.laporan ?? ''}
                                                onChange={(e) =>
                                                    setEditTarget((prev) => ({
                                                        ...prev,
                                                        [t.level]: { ...prev[t.level], laporan: e.target.value },
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
                                                Form Inspeksi/minggu
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info size={13} className="cursor-help text-muted-foreground/60" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-48">
                                                        Gabungan: Inspeksi Kantor, Tambang, Workshop, Mess
                                                    </TooltipContent>
                                                </Tooltip>
                                                :
                                            </label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={20}
                                                className="w-20"
                                                disabled={isNonStaff}
                                                value={isNonStaff ? '0' : (editTarget[t.level]?.inspeksi ?? '')}
                                                onChange={(e) =>
                                                    !isNonStaff && setEditTarget((prev) => ({
                                                        ...prev,
                                                        [t.level]: { ...prev[t.level], inspeksi: e.target.value },
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
                                                Form OK/minggu
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info size={13} className="cursor-help text-muted-foreground/60" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-48">
                                                        Form OK = Observasi Keselamatan (WBK-HSE-FO-037)
                                                    </TooltipContent>
                                                </Tooltip>
                                                :
                                            </label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={20}
                                                className="w-20"
                                                disabled={isNonStaff}
                                                value={isNonStaff ? '0' : (editTarget[t.level]?.observasi ?? '')}
                                                onChange={(e) =>
                                                    !isNonStaff && setEditTarget((prev) => ({
                                                        ...prev,
                                                        [t.level]: { ...prev[t.level], observasi: e.target.value },
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="whitespace-nowrap text-sm text-muted-foreground">Bugar Selamat/hari:</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={3}
                                                className="w-20"
                                                value={editTarget[t.level]?.bugar ?? ''}
                                                onChange={(e) =>
                                                    setEditTarget((prev) => ({
                                                        ...prev,
                                                        [t.level]: { ...prev[t.level], bugar: e.target.value },
                                                    }))
                                                }
                                            />
                                        </div>
                                        <Button size="sm" onClick={() => saveTarget(t.level)}>
                                            Simpan
                                        </Button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Assign Level per User */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <CardTitle className="text-base">Level Partisipasi Karyawan</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Assign level partisipasi ke setiap karyawan untuk menentukan target mereka.
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground self-end">
                                {users.from !== null && users.to !== null
                                    ? `${users.from}–${users.to} dari ${users.total} karyawan`
                                    : `${users.total} karyawan`}
                                {hasActiveFilter && ' (terfilter)'}
                            </p>
                        </div>

                        {/* Toolbar filter */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <form onSubmit={handleSearch} className="flex min-w-44 flex-1 gap-2">
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

                            {hasActiveFilter && (
                                <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={clearFilters}>
                                    <X size={13} /> Reset
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium w-8 text-center">#</th>
                                        <th className="px-4 py-3 text-left font-medium">Nama</th>
                                        <th className="px-4 py-3 text-left font-medium">NIK</th>
                                        <th className="px-4 py-3 text-left font-medium">Jabatan</th>
                                        <th className="px-4 py-3 text-left font-medium">Site</th>
                                        <th className="px-4 py-3 text-left font-medium">Level Saat Ini</th>
                                        <th className="px-4 py-3 text-left font-medium">Ubah Level</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                                                Tidak ada karyawan yang sesuai filter.
                                                {hasActiveFilter && (
                                                    <span> <button className="underline" onClick={clearFilters}>Reset filter</button></span>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((u, idx) => (
                                            <tr key={u.id} className="hover:bg-muted/30">
                                                <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">
                                                    {(users.from ?? 1) + idx}
                                                </td>
                                                <td className="px-4 py-2.5 font-medium">{u.name}</td>
                                                <td className="px-4 py-2.5 font-mono text-muted-foreground">{u.nik ?? '—'}</td>
                                                <td className="px-4 py-2.5 text-muted-foreground">{u.jabatan ?? '—'}</td>
                                                <td className="px-4 py-2.5 capitalize text-muted-foreground">{u.site ?? '—'}</td>
                                                <td className="px-4 py-2.5">
                                                    {levelBadge(u.participation_level)}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Select
                                                        value={userLevelEdit[u.id] ?? u.participation_level}
                                                        onValueChange={(v) =>
                                                            setUserLevelEdit((prev) => ({ ...prev, [u.id]: v }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="nonstaff">Non-Staff</SelectItem>
                                                            <SelectItem value="staff">Staff</SelectItem>
                                                            <SelectItem value="srstaff">Sr. Staff</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Button
                                                        size="sm"
                                                        variant={userLevelEdit[u.id] !== u.participation_level ? 'default' : 'outline'}
                                                        onClick={() => saveUserLevel(u.id)}
                                                    >
                                                        Simpan
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
                                <p className="text-xs text-muted-foreground">
                                    Halaman {users.current_page} dari {users.last_page}
                                </p>
                                <div className="flex items-center gap-1">
                                    {/* First page */}
                                    {users.current_page > 2 && (
                                        <Link href={users.links[1]?.url ?? '#'}>
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs">1</Button>
                                        </Link>
                                    )}
                                    {users.current_page > 3 && (
                                        <span className="px-1 text-xs text-muted-foreground">…</span>
                                    )}
                                    {/* Page window */}
                                    {users.links.slice(1, -1).filter((link) => {
                                        const p = Number(link.label);

                                        return p >= users.current_page - 1 && p <= users.current_page + 1;
                                    }).map((link) => (
                                        link.url && !link.active ? (
                                            <Link key={link.label} href={link.url}>
                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-xs">
                                                    {link.label}
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button key={link.label} variant={link.active ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 text-xs" disabled={link.active}>
                                                {link.label}
                                            </Button>
                                        )
                                    ))}
                                    {users.current_page < users.last_page - 2 && (
                                        <span className="px-1 text-xs text-muted-foreground">…</span>
                                    )}
                                    {/* Last page */}
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
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
