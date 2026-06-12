import { Form, Head, router, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Camera,
    ChevronDown,
    IdCard,
    Mail,
    Save,
    User,
} from 'lucide-react';
import { useRef, useState } from 'react';
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

type SiteOption = { value: string; label: string };

const DEPARTEMEN_OPTIONS = [
    'Production',
    'Maintenance',
    'Supply Chain',
    'Engineering',
    'HSE',
    'HRGA',
    'Management',
];

export default function Profile({
    mustVerifyEmail,
    status,
    badges = [],
    sites = [],
}: {
    mustVerifyEmail: boolean;
    status?: string;
    badges?: BadgeItem[];
    sites?: SiteOption[];
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user.is_admin === true;
    const [showDelete, setShowDelete] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar ?? null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        setUploading(true);
        const data = new FormData();
        data.append('avatar', file);
        router.post('/settings/profile/avatar', data, {
            forceFormData: true,
            onFinish: () => setUploading(false),
        });
    };

    return (
        <>
            <Head title="Profil Saya" />

            <div className="space-y-6">
                {/* Avatar + Nama Header */}
                <div className="flex flex-col items-center gap-3 py-4">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="group relative h-20 w-20 overflow-hidden rounded-full shadow-md focus:outline-none"
                        disabled={uploading}
                        aria-label="Ganti foto profil"
                    >
                        {avatarPreview ? (
                            <img src={avatarPreview} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary text-2xl font-bold text-primary-foreground">
                                {getInitials(user.name)}
                            </div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            {uploading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <Camera className="h-5 w-5 text-white" />
                                    <span className="text-[10px] font-medium text-white">Ganti</span>
                                </>
                            )}
                        </div>
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
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
                                            maxLength={16}
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
                                        label="Departemen"
                                        hint={isAdmin ? 'Pilih departemen tempat user bekerja' : 'Departemen hanya dapat diubah oleh admin'}
                                        error={errors.departemen}
                                    >
                                        {isAdmin ? (
                                            <Select name="departemen" defaultValue={user.departemen ?? ''}>
                                                <SelectTrigger id="departemen" className="h-11 w-full text-base">
                                                    <SelectValue placeholder="— Pilih Departemen —" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DEPARTEMEN_OPTIONS.map((d) => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                value={user.departemen ?? '—'}
                                                readOnly
                                                disabled
                                                className="h-11 text-base bg-muted cursor-not-allowed"
                                            />
                                        )}
                                    </FieldRow>

                                    <FieldRow
                                        icon={<Building2 size={16} />}
                                        label="Lokasi Site"
                                        hint={isAdmin ? 'Pilih lokasi tempat user bekerja' : 'Site hanya dapat diubah oleh admin'}
                                        error={errors.site}
                                    >
                                        {isAdmin ? (
                                            <Select name="site" defaultValue={user.site ?? ''}>
                                                <SelectTrigger id="site" className="h-11 w-full text-base">
                                                    <SelectValue placeholder="— Pilih Site —" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sites.map((s) => (
                                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                value={sites.find((s) => s.value === user.site)?.label ?? user.site ?? '—'}
                                                readOnly
                                                disabled
                                                className="h-11 text-base bg-muted cursor-not-allowed"
                                            />
                                        )}
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
