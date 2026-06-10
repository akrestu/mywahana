import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

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

type Props = {
    targets: Target[];
    users: UserRow[];
};

const LEVEL_LABELS: Record<string, string> = {
    nonstaff: 'Non-Staff',
    staff: 'Staff',
    srstaff: 'Sr. Staff',
};

export default function AdminTargets({ targets, users }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [editTarget, setEditTarget] = useState<Record<string, { laporan: string; inspeksi: string; observasi: string; bugar: string }>>(() =>
        Object.fromEntries(targets.map((t) => [t.level, {
            laporan: String(t.laporan_per_minggu),
            inspeksi: String(t.inspeksi_per_minggu),
            observasi: String(t.observasi_per_minggu),
            bugar: String(t.bugar_per_hari),
        }]))
    );
    const [userLevelEdit, setUserLevelEdit] = useState<Record<number, string>>(() =>
        Object.fromEntries(users.map((u) => [u.id, u.participation_level]))
    );

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
        });
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
                                            <label className="text-sm text-muted-foreground whitespace-nowrap">Laporan Bahaya/minggu:</label>
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
                                            <label className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
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
                                            <label className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
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
                                            <label className="text-sm text-muted-foreground whitespace-nowrap">Bugar Selamat/hari:</label>
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
                        <CardTitle className="text-base">Level Partisipasi Karyawan</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Assign level partisipasi ke setiap karyawan untuk menentukan target mereka.
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Nama</th>
                                        <th className="px-4 py-3 text-left font-medium">NIK</th>
                                        <th className="px-4 py-3 text-left font-medium">Jabatan</th>
                                        <th className="px-4 py-3 text-left font-medium">Site</th>
                                        <th className="px-4 py-3 text-left font-medium">Level</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-2.5 font-medium">{u.name}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{u.nik ?? '-'}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{u.jabatan ?? '-'}</td>
                                            <td className="px-4 py-2.5 capitalize text-muted-foreground">{u.site ?? '-'}</td>
                                            <td className="px-4 py-2.5">
                                                <Select
                                                    value={userLevelEdit[u.id]}
                                                    onValueChange={(v) =>
                                                        setUserLevelEdit((prev) => ({ ...prev, [u.id]: v }))
                                                    }
                                                >
                                                    <SelectTrigger className="w-32 h-8">
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
                                                    variant="outline"
                                                    onClick={() => saveUserLevel(u.id)}
                                                >
                                                    Simpan
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
