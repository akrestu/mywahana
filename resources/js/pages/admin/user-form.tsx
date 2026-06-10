import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type UserData = {
    id: number;
    name: string;
    nik: string;
    email: string | null;
    jabatan: string | null;
    site: string | null;
    is_admin: boolean;
    participation_level: string;
};

type Props = {
    mode: 'create' | 'edit';
    user?: UserData;
};

type FormFields = {
    name: string;
    nik: string;
    email: string;
    password: string;
    password_confirmation: string;
    jabatan: string;
    site: string;
    is_admin: boolean;
    participation_level: string;
};

export default function UserForm({ mode, user }: Props) {
    const isEdit = mode === 'edit';
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, put, processing, errors } = useForm<FormFields>({
        name: user?.name ?? '',
        nik: user?.nik ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
        jabatan: user?.jabatan ?? '',
        site: user?.site ?? '',
        is_admin: user?.is_admin ?? false,
        participation_level: user?.participation_level ?? 'nonstaff',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && user) {
            put(`/admin/users/${user.id}`);
        } else {
            post('/admin/users');
        }
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'} />

            <div className="space-y-4">
                {/* Back + Title */}
                <div className="flex items-center gap-3">
                    <Link href="/admin/users">
                        <Button size="sm" variant="ghost" className="h-9 gap-1.5">
                            <ArrowLeft size={15} /> Kembali
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold">
                            {isEdit ? `Edit: ${user?.name}` : 'Tambah Pengguna Baru'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {isEdit ? 'Ubah data akun karyawan' : 'Isi data untuk membuat akun karyawan'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Section 1: Data Diri */}
                    <Card>
                        <CardHeader className="pb-3 pt-4">
                            <CardTitle className="text-base">Data Diri Karyawan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Nama Lengkap <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="h-10"
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="nik" className="text-sm font-medium">
                                    NIK (Nomor Induk Karyawan) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="nik"
                                    value={data.nik}
                                    onChange={(e) => setData('nik', e.target.value)}
                                    placeholder="Contoh: 12345"
                                    className="h-10"
                                />
                                {errors.nik && <p className="text-sm text-destructive">{errors.nik}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="jabatan" className="text-sm font-medium">Jabatan / Posisi</Label>
                                <Input
                                    id="jabatan"
                                    value={data.jabatan}
                                    onChange={(e) => setData('jabatan', e.target.value)}
                                    placeholder="Contoh: Operator Alat Berat"
                                    className="h-10"
                                />
                                {errors.jabatan && <p className="text-sm text-destructive">{errors.jabatan}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Site Kerja</Label>
                                    <Select value={data.site || 'none'} onValueChange={(v) => setData('site', v === 'none' ? '' : v)}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Pilih site" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">— Belum dipilih —</SelectItem>
                                            <SelectItem value="baratama">Baratama</SelectItem>
                                            <SelectItem value="bandhawa">Bandhawa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.site && <p className="text-sm text-destructive">{errors.site}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">
                                        Level Partisipasi <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={data.participation_level} onValueChange={(v) => setData('participation_level', v)}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nonstaff">Non-Staff</SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                            <SelectItem value="srstaff">Sr. Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.participation_level && <p className="text-sm text-destructive">{errors.participation_level}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Login */}
                    <Card>
                        <CardHeader className="pb-3 pt-4">
                            <CardTitle className="text-base">Akses Login</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="email@perusahaan.com (opsional)"
                                    className="h-10"
                                />
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password{' '}
                                    {!isEdit && <span className="text-destructive">*</span>}
                                    {isEdit && (
                                        <span className="font-normal text-muted-foreground"> — kosongkan jika tidak diubah</span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder={isEdit ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
                                        className="h-10 pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="text-sm font-medium">
                                    Konfirmasi Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password di atas"
                                        className="h-10 pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowConfirm((v) => !v)}
                                    >
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Hak Akses Admin */}
                    <Card className={data.is_admin ? 'border-primary/50 bg-primary/5' : ''}>
                        <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert size={16} className={data.is_admin ? 'text-primary' : 'text-muted-foreground'} />
                                        <p className="font-medium">Akses Admin</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Admin dapat melihat semua data karyawan, mengubah status laporan, dan mengelola pengguna.
                                        Berikan akses ini hanya kepada petugas HSE yang berwenang.
                                    </p>
                                </div>
                                <Switch
                                    checked={data.is_admin}
                                    onCheckedChange={(v) => setData('is_admin', v)}
                                    className="shrink-0 mt-0.5"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-3 pb-4">
                        <Button type="submit" disabled={processing} className="flex-1 h-11 text-base">
                            {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                        </Button>
                        <Link href="/admin/users">
                            <Button type="button" variant="outline" className="h-11">
                                Batal
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
