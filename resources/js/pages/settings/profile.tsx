import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    ChevronDown,
    IdCard,
    Mail,
    Save,
    User,
} from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = { auth: Auth };

function getInitials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

function FieldRow({
    icon,
    label,
    hint,
    children,
    error,
}: {
    icon: React.ReactNode;
    label: string;
    hint?: string;
    children: React.ReactNode;
    error?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{icon}</span>
                <Label className="text-sm font-semibold text-foreground">{label}</Label>
            </div>
            {children}
            {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <InputError message={error} />}
        </div>
    );
}

type BadgeItem = {
    key: string;
    nama: string;
    icon: string;
    desc: string;
    earned_at: string;
};

export default function Profile({
    mustVerifyEmail,
    status,
    badges = [],
}: {
    mustVerifyEmail: boolean;
    status?: string;
    badges?: BadgeItem[];
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const [showDelete, setShowDelete] = useState(false);

    return (
        <>
            <Head title="Profil Saya" />

            <div className="space-y-6">
                {/* Avatar + Nama Header */}
                <div className="flex flex-col items-center gap-3 py-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-md">
                        {getInitials(user.name)}
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="shadow-sm">
                    <CardContent className="pt-5">
                        <Form
                            {...ProfileController.update.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <FieldRow
                                        icon={<User size={16} />}
                                        label="Nama Lengkap"
                                        hint="Nama sesuai kartu identitas"
                                        error={errors.name}
                                    >
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={user.name}
                                            placeholder="Contoh: Budi Santoso"
                                            autoComplete="name"
                                            required
                                            className="h-11 text-base"
                                        />
                                    </FieldRow>

                                    <FieldRow
                                        icon={<Mail size={16} />}
                                        label="Alamat Email"
                                        hint="Email digunakan untuk masuk ke aplikasi"
                                        error={errors.email}
                                    >
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={user.email}
                                            placeholder="Contoh: budi@wahana.com"
                                            autoComplete="username"
                                            required
                                            className="h-11 text-base"
                                        />
                                    </FieldRow>

                                    {mustVerifyEmail && user.email_verified_at === null && (
                                        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950">
                                            <p className="font-medium text-amber-700 dark:text-amber-300">
                                                Email belum diverifikasi
                                            </p>
                                            <p className="mt-0.5 text-amber-600 dark:text-amber-400">
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="underline"
                                                >
                                                    Klik di sini untuk kirim ulang email verifikasi
                                                </Link>
                                            </p>
                                            {status === 'verification-link-sent' && (
                                                <p className="mt-1 font-medium text-green-600">
                                                    ✓ Email verifikasi telah dikirim
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <FieldRow
                                        icon={<IdCard size={16} />}
                                        label="NIK / NRPP"
                                        hint="Nomor Induk Karyawan Anda"
                                        error={errors.nik}
                                    >
                                        <Input
                                            id="nik"
                                            name="nik"
                                            defaultValue={user.nik ?? ''}
                                            placeholder="Contoh: 12345678"
                                            className="h-11 text-base"
                                        />
                                    </FieldRow>

                                    <FieldRow
                                        icon={<Briefcase size={16} />}
                                        label="Jabatan"
                                        hint="Posisi atau jabatan Anda di perusahaan"
                                        error={errors.jabatan}
                                    >
                                        <Input
                                            id="jabatan"
                                            name="jabatan"
                                            defaultValue={user.jabatan ?? ''}
                                            placeholder="Contoh: Operator, Mekanik, Supervisor"
                                            className="h-11 text-base"
                                        />
                                    </FieldRow>

                                    <FieldRow
                                        icon={<Building2 size={16} />}
                                        label="Lokasi Site"
                                        hint="Pilih lokasi tempat Anda bekerja"
                                        error={errors.site}
                                    >
                                        <Select name="site" defaultValue={user.site ?? ''}>
                                            <SelectTrigger id="site" className="h-11 w-full text-base">
                                                <SelectValue placeholder="— Pilih Site —" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="baratama">Baratama</SelectItem>
                                                <SelectItem value="bandhawa">Bandhawa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldRow>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-12 w-full gap-2 text-base font-semibold"
                                        data-test="update-profile-button"
                                    >
                                        <Save size={18} />
                                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {/* Pencapaian / Badge */}
                <div className="rounded-lg border">
                    <div className="px-4 py-3 border-b">
                        <h3 className="text-sm font-semibold">🏅 Pencapaian</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {badges.length === 0 ? 'Belum ada pencapaian. Mulai isi form untuk mendapatkan badge!' : `${badges.length} badge diraih`}
                        </p>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {badges.map((b) => (
                            <div key={b.key} className="flex flex-col items-center gap-1 rounded-xl border bg-muted/30 px-3 py-3 text-center">
                                <span className="text-2xl">{b.icon}</span>
                                <p className="text-xs font-semibold leading-tight">{b.nama}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight">{b.desc}</p>
                            </div>
                        ))}
                        {badges.length === 0 && (
                            <div className="col-span-2 sm:col-span-3 rounded-xl border border-dashed py-6 text-center">
                                <p className="text-sm text-muted-foreground">Belum ada badge</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hapus Akun — disembunyikan di bawah toggle */}
                <div className="rounded-lg border border-red-200 dark:border-red-900">
                    <button
                        type="button"
                        onClick={() => setShowDelete((v) => !v)}
                        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400"
                    >
                        <span>Hapus Akun</span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${showDelete ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {showDelete && (
                        <div className="border-t border-red-200 px-4 py-4 dark:border-red-900">
                            <DeleteUser />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profil Saya',
            href: edit(),
        },
    ],
};
