import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Camera,
    ChevronDown,
    IdCard,
    Mail,
    User,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { SectionLabel } from '@/components/patterns/module-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    icon: ReactNode;
    label: string;
    hint?: string;
    children: ReactNode;
    error?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{icon}</span>
                <Label className="text-[13px] font-semibold text-foreground">
                    {label}
                </Label>
            </div>
            {children}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
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

const readOnlyClass = 'h-11 cursor-not-allowed text-base opacity-70';

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
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        (user as { avatar_url?: string | null }).avatar_url ?? null,
    );
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

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

            <div className="flex flex-col gap-6">
                {/* Foto profil — the name and role already sit in the layout hero */}
                <div className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-extrabold text-accent-foreground">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt=""
                                className="size-full object-cover"
                            />
                        ) : (
                            getInitials(user.name)
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold">Foto profil</p>
                        <p className="text-xs text-muted-foreground">
                            JPG atau PNG, tampil di header dan laporan.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                    >
                        <Camera />
                        {uploading ? 'Mengunggah…' : 'Ganti foto'}
                    </Button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{ preserveScroll: true }}
                    className="flex flex-col gap-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <FieldRow
                                icon={<User size={16} />}
                                label="Nama lengkap"
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
                                label="Alamat email"
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

                            {mustVerifyEmail &&
                                user.email_verified_at === null && (
                                    <div className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">
                                        <p className="font-semibold">
                                            Email belum diverifikasi
                                        </p>
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="mt-0.5 underline"
                                        >
                                            Kirim ulang email verifikasi
                                        </Link>
                                        {status ===
                                            'verification-link-sent' && (
                                            <p className="mt-1 font-semibold text-success">
                                                Email verifikasi telah dikirim
                                            </p>
                                        )}
                                    </div>
                                )}

                            <FieldRow
                                icon={<IdCard size={16} />}
                                label="NIK / NRPP"
                                hint={
                                    isAdmin
                                        ? 'Nomor Induk Karyawan'
                                        : 'NIK hanya dapat diubah oleh admin'
                                }
                                error={errors.nik}
                            >
                                {isAdmin ? (
                                    <Input
                                        id="nik"
                                        name="nik"
                                        defaultValue={user.nik ?? ''}
                                        placeholder="Contoh: 12345678"
                                        maxLength={16}
                                        className="tabular h-11 text-base"
                                    />
                                ) : (
                                    <Input
                                        value={user.nik ?? '—'}
                                        readOnly
                                        disabled
                                        className={readOnlyClass}
                                    />
                                )}
                            </FieldRow>

                            <FieldRow
                                icon={<Briefcase size={16} />}
                                label="Jabatan"
                                hint={
                                    isAdmin
                                        ? 'Posisi atau jabatan di perusahaan'
                                        : 'Jabatan hanya dapat diubah oleh admin'
                                }
                                error={errors.jabatan}
                            >
                                {isAdmin ? (
                                    <Input
                                        id="jabatan"
                                        name="jabatan"
                                        defaultValue={user.jabatan ?? ''}
                                        placeholder="Contoh: Operator, Mekanik, Supervisor"
                                        className="h-11 text-base"
                                    />
                                ) : (
                                    <Input
                                        value={user.jabatan ?? '—'}
                                        readOnly
                                        disabled
                                        className={readOnlyClass}
                                    />
                                )}
                            </FieldRow>

                            <FieldRow
                                icon={<Building2 size={16} />}
                                label="Departemen"
                                hint={
                                    isAdmin
                                        ? 'Departemen tempat bekerja'
                                        : 'Departemen hanya dapat diubah oleh admin'
                                }
                                error={errors.departemen}
                            >
                                {isAdmin ? (
                                    <Select
                                        name="departemen"
                                        defaultValue={user.departemen ?? ''}
                                    >
                                        <SelectTrigger
                                            id="departemen"
                                            className="h-11 w-full text-base"
                                        >
                                            <SelectValue placeholder="Pilih departemen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DEPARTEMEN_OPTIONS.map((d) => (
                                                <SelectItem key={d} value={d}>
                                                    {d}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        value={user.departemen ?? '—'}
                                        readOnly
                                        disabled
                                        className={readOnlyClass}
                                    />
                                )}
                            </FieldRow>

                            <FieldRow
                                icon={<Building2 size={16} />}
                                label="Site"
                                hint={
                                    isAdmin
                                        ? 'Lokasi tempat bekerja'
                                        : 'Site hanya dapat diubah oleh admin'
                                }
                                error={errors.site}
                            >
                                {isAdmin ? (
                                    <Select
                                        name="site"
                                        defaultValue={user.site ?? ''}
                                    >
                                        <SelectTrigger
                                            id="site"
                                            className="h-11 w-full text-base"
                                        >
                                            <SelectValue placeholder="Pilih site" />
                                        </SelectTrigger>
                                        <SelectContent>
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
                                ) : (
                                    <Input
                                        value={
                                            sites.find(
                                                (s) => s.value === user.site,
                                            )?.label ??
                                            user.site ??
                                            '—'
                                        }
                                        readOnly
                                        disabled
                                        className={readOnlyClass}
                                    />
                                )}
                            </FieldRow>

                            <Button
                                type="submit"
                                size="lg"
                                disabled={processing}
                                data-test="update-profile-button"
                            >
                                {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                            </Button>
                        </>
                    )}
                </Form>

                <div className="flex flex-col gap-3">
                    <SectionLabel
                        action={
                            badges.length > 0 && (
                                <span className="tabular text-xs text-muted-foreground">
                                    {badges.length} diraih
                                </span>
                            )
                        }
                    >
                        Pencapaian
                    </SectionLabel>
                    {badges.length === 0 ? (
                        <p className="rounded-lg bg-muted px-4 py-5 text-center text-sm text-muted-foreground">
                            Belum ada badge. Isi form K3 untuk mendapatkannya.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                            {badges.map((b) => (
                                <div
                                    key={b.key}
                                    className="flex flex-col items-center gap-1 rounded-lg bg-muted px-3 py-3 text-center"
                                >
                                    <span className="text-2xl" aria-hidden>
                                        {b.icon}
                                    </span>
                                    <p className="text-xs leading-tight font-bold">
                                        {b.nama}
                                    </p>
                                    <p className="text-[11px] leading-tight text-muted-foreground">
                                        {b.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hapus akun — hanya untuk admin */}
                {isAdmin && (
                    <div className="rounded-lg bg-destructive-soft">
                        <button
                            type="button"
                            onClick={() => setShowDelete((v) => !v)}
                            aria-expanded={showDelete}
                            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-destructive"
                        >
                            <span>Hapus akun</span>
                            <ChevronDown
                                size={16}
                                className={`transition-transform duration-200 ${showDelete ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {showDelete && (
                            <div className="px-4 pb-4">
                                <DeleteUser />
                            </div>
                        )}
                    </div>
                )}
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
