import { Head, router } from '@inertiajs/react';
import {
    BookOpen,
    Camera,
    Images,
    Moon,
    PenLine,
    Plus,
    Sun,
    Trash2,
    UserCheck,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { CameraCapture } from '@/components/camera-capture';
import { ComboField } from '@/components/patterns/combo-field';
import { ModuleHeader } from '@/components/patterns/module-header';
import { SignaturePad } from '@/components/patterns/signature-pad';
import { SiteCombobox } from '@/components/site-combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { UploadOverlay } from '@/components/upload-overlay';
import { compressImageWithToast } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

type UserInfo = {
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
};
type StaffUser = {
    id: number;
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
    sites: string[];
};
type SiteOption = { value: string; label: string; locations?: string[] | null };
type Props = { user: UserInfo; staffUsers: StaffUser[]; sites: SiteOption[] };

type Peserta = {
    nama: string;
    jabatan: string;
    nik: string;
    tanda_tangan: string;
};

const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
});

/** Dialog signature step: shared pad plus explicit save / cancel. */
function SignatureStep({
    onSave,
    onCancel,
}: {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}) {
    const [dataUrl, setDataUrl] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-3">
            <SignaturePad onDataUrl={setDataUrl} />
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Batal
                </Button>
                <Button
                    type="button"
                    onClick={() => dataUrl && onSave(dataUrl)}
                    disabled={!dataUrl}
                    className="flex-1"
                >
                    Simpan TTD
                </Button>
            </div>
        </div>
    );
}

export default function KomunikasiJsaCreate({
    user,
    staffUsers,
    sites,
}: Props) {
    const [teamLeaderId, setTeamLeaderId] = useState<string>('');
    const [site, setSite] = useState(() =>
        sites.some((item) => item.value === user.site)
            ? user.site!
            : (sites[0]?.value ?? ''),
    );
    const [tanggal, setTanggal] = useState(today);
    const [lokasi, setLokasi] = useState('');
    const [shift, setShift] = useState<'siang' | 'malam' | ''>('');
    const [durasi, setDurasi] = useState('');
    const [kegiatan, setKegiatan] = useState('');
    const [judulDokumen, setJudulDokumen] = useState('');
    const [catatan, setCatatan] = useState('');

    const [peserta, setPeserta] = useState<Peserta[]>([
        { nama: '', jabatan: '', nik: '', tanda_tangan: '' },
    ]);
    const [ttdDialogIdx, setTtdDialogIdx] = useState<number | null>(null);

    const [fotoKelompok, setFotoKelompok] = useState<File | null>(null);
    const [fotoDokumen, setFotoDokumen] = useState<File | null>(null);
    const [fotoKelompokPreview, setFotoKelompokPreview] = useState<string>('');
    const [fotoDokumenPreview, setFotoDokumenPreview] = useState<string>('');
    const fotoKelompokGalleryRef = useRef<HTMLInputElement>(null);
    const fotoDokumenGalleryRef = useRef<HTMLInputElement>(null);
    const [photoSheet, setPhotoSheet] = useState<'kelompok' | 'dokumen' | null>(
        null,
    );
    const [showCamera, setShowCamera] = useState<'kelompok' | 'dokumen' | null>(
        null,
    );
    function choosePhotoSource(source: 'camera' | 'gallery') {
        const slot = photoSheet;
        setPhotoSheet(null);

        if (source === 'camera') {
            setShowCamera(slot);
        } else {
            (slot === 'kelompok'
                ? fotoKelompokGalleryRef
                : fotoDokumenGalleryRef
            ).current?.click();
        }
    }

    const [supervisorSig, setSupervisorSig] = useState('');
    const [showSupervisorSig, setShowSupervisorSig] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const availableStaffUsers = staffUsers.filter((staff) =>
        staff.sites.includes(site),
    );
    const selectedTL = availableStaffUsers.find(
        (u) => String(u.id) === teamLeaderId,
    );
    const lokasiOptions =
        sites.find((item) => item.value === site)?.locations ?? [];
    const noExternalTL = !teamLeaderId;

    async function handleFotoChange(
        type: 'kelompok' | 'dokumen',
        file: File | null,
    ) {
        if (!file) {
            return;
        }

        const compressed = await compressImageWithToast(file);

        if (type === 'kelompok') {
            setFotoKelompok(compressed);
            setFotoKelompokPreview(URL.createObjectURL(compressed));
        } else {
            setFotoDokumen(compressed);
            setFotoDokumenPreview(URL.createObjectURL(compressed));
        }
    }

    function addPeserta() {
        if (peserta.length >= 10) {
            return;
        }

        setPeserta((p) => [
            ...p,
            { nama: '', jabatan: '', nik: '', tanda_tangan: '' },
        ]);
    }

    function removePeserta(idx: number) {
        setPeserta((p) => p.filter((_, i) => i !== idx));
    }

    function updatePeserta(idx: number, field: keyof Peserta, value: string) {
        setPeserta((p) =>
            p.map((item, i) =>
                i === idx ? { ...item, [field]: value } : item,
            ),
        );
    }

    function handleTtdSave(dataUrl: string) {
        if (ttdDialogIdx === null) {
            return;
        }

        updatePeserta(ttdDialogIdx, 'tanda_tangan', dataUrl);
        setTtdDialogIdx(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};

        if (!site) {
            newErrors.site = 'Site wajib dipilih.';
        }

        if (!tanggal) {
            newErrors.tanggal = 'Tanggal wajib diisi.';
        }

        if (!lokasi.trim()) {
            newErrors.lokasi = 'Lokasi wajib diisi.';
        }

        if (!shift) {
            newErrors.shift = 'Shift wajib dipilih.';
        }

        if (!durasi || Number(durasi) < 1) {
            newErrors.durasi = 'Durasi wajib diisi (minimal 1 menit).';
        }

        if (!kegiatan.trim()) {
            newErrors.kegiatan = 'Kegiatan wajib diisi.';
        }

        if (!judulDokumen.trim()) {
            newErrors.judul_dokumen = 'Judul dokumen JSA/SOP/IK wajib diisi.';
        }

        if (peserta.length === 0) {
            newErrors.peserta = 'Minimal 1 peserta harus ditambahkan.';
        }

        peserta.forEach((p, i) => {
            if (!p.nama.trim()) {
                newErrors[`peserta_${i}_nama`] =
                    `Nama peserta ${i + 1} wajib diisi.`;
            }

            if (!p.tanda_tangan) {
                newErrors[`peserta_${i}_ttd`] =
                    `Tanda tangan peserta ${i + 1} wajib diisi.`;
            }
        });

        if (!fotoKelompok) {
            newErrors.foto_kelompok = 'Foto kelompok wajib dilampirkan.';
        }

        if (!fotoDokumen) {
            newErrors.foto_dokumen =
                'Foto dokumen JSA/SOP/IK wajib dilampirkan.';
        }

        if (noExternalTL && !supervisorSig) {
            newErrors.supervisor_signature =
                'Tanda tangan supervisor wajib diisi.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);

            return;
        }

        const formData = new FormData();

        formData.append('site', site);

        if (teamLeaderId) {
            formData.append('team_leader_id', teamLeaderId);
        }

        formData.append('tanggal', tanggal);
        formData.append('lokasi', lokasi);
        formData.append('shift', shift!);
        formData.append('durasi', durasi);
        formData.append('kegiatan', kegiatan);
        formData.append('judul_dokumen', judulDokumen);

        if (catatan) {
            formData.append('catatan', catatan);
        }

        peserta.forEach((p, i) => {
            formData.append(`peserta[${i}][nama]`, p.nama);
            formData.append(`peserta[${i}][jabatan]`, p.jabatan);
            formData.append(`peserta[${i}][nik]`, p.nik);
            formData.append(`peserta[${i}][tanda_tangan]`, p.tanda_tangan);
        });

        if (supervisorSig) {
            formData.append('supervisor_signature', supervisorSig);
        }

        formData.append('foto_kelompok', fotoKelompok!);
        formData.append('foto_dokumen', fotoDokumen!);

        setProcessing(true);
        setUploadProgress(0);
        router.post('/sap/komunikasi-jsa', formData, {
            forceFormData: true,
            onProgress: (e) => setUploadProgress(e?.percentage ?? null),
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
                setUploadProgress(null);
            },
            onFinish: () => {
                setProcessing(false);
                setUploadProgress(null);
            },
        });
    }

    return (
        <>
            <Head title="Buat Komunikasi JSA" />
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5 pt-2 lg:mx-auto lg:max-w-[640px]"
            >
                <ModuleHeader
                    backHref="/sap/komunikasi-jsa"
                    title="Komunikasi JSA"
                    eyebrow={`WBK-HSE-FO-026 · ${user.name}`}
                />

                {/* ── Informasi Dasar ── */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-[13px] font-semibold">
                            Site <span className="text-destructive">*</span>
                        </Label>
                        <SiteCombobox
                            value={site}
                            options={sites}
                            onChange={(value) => {
                                setSite(value);
                                setLokasi('');
                                setTeamLeaderId('');
                            }}
                            placeholder="Pilih site"
                        />
                        {errors.site && (
                            <p className="text-sm text-destructive">
                                {errors.site}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="tanggal"
                            className="text-[13px] font-semibold"
                        >
                            Tanggal <span className="text-destructive">*</span>
                        </Label>
                        <DatePickerInput
                            value={tanggal}
                            onChange={setTanggal}
                            max={today}
                            error={!!errors.tanggal}
                        />
                        {errors.tanggal && (
                            <p className="text-sm text-destructive">
                                {errors.tanggal}
                            </p>
                        )}
                    </div>

                    <ComboField
                        id="lokasi"
                        label="Lokasi"
                        value={lokasi}
                        options={lokasiOptions.map((l) => ({
                            value: l,
                            label: l,
                        }))}
                        onChange={setLokasi}
                        placeholder="Pilih lokasi"
                        searchPlaceholder="Cari lokasi…"
                        emptyText="Lokasi tidak ditemukan."
                        error={errors.lokasi}
                    />

                    <div className="flex flex-col gap-2">
                        <Label className="text-[13px] font-semibold">
                            Shift <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    value: 'siang' as const,
                                    label: 'Siang',
                                    Icon: Sun,
                                },
                                {
                                    value: 'malam' as const,
                                    label: 'Malam',
                                    Icon: Moon,
                                },
                            ].map(({ value, label, Icon }) => {
                                const sel = shift === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={sel}
                                        onClick={() => setShift(value)}
                                        className={cn(
                                            'flex h-[52px] items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                            sel
                                                ? 'border-2 border-foreground bg-accent-soft'
                                                : 'border border-border bg-card hover:bg-muted',
                                        )}
                                    >
                                        <Icon className="size-4" />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.shift && (
                            <p className="text-sm text-destructive">
                                {errors.shift}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="durasi"
                            className="text-[13px] font-semibold"
                        >
                            Durasi <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                            {['15', '30', '45', '60'].map((preset) => {
                                const sel = durasi === preset;

                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setDurasi(preset)}
                                        aria-pressed={sel}
                                        className={cn(
                                            'h-11 rounded-full text-sm font-bold transition-colors',
                                            sel
                                                ? 'bg-primary text-primary-foreground'
                                                : 'border border-border bg-card hover:bg-muted',
                                        )}
                                    >
                                        {preset} mnt
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative">
                            <Input
                                id="durasi"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={durasi}
                                onChange={(e) => setDurasi(e.target.value)}
                                placeholder="Atau isi manual, contoh: 30"
                                className="pr-16"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">
                                menit
                            </span>
                        </div>
                        {errors.durasi && (
                            <p className="text-sm text-destructive">
                                {errors.durasi}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="kegiatan"
                            className="text-[13px] font-semibold"
                        >
                            Kegiatan <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="kegiatan"
                            value={kegiatan}
                            onChange={(e) => setKegiatan(e.target.value)}
                            placeholder="Uraian kegiatan yang akan dilakukan"
                        />
                        {errors.kegiatan && (
                            <p className="text-sm text-destructive">
                                {errors.kegiatan}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="judul_dokumen"
                            className="text-[13px] font-semibold"
                        >
                            Judul JSA / SOP / IK yang Dikomunikasikan{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="judul_dokumen"
                            value={judulDokumen}
                            onChange={(e) => setJudulDokumen(e.target.value)}
                            placeholder="Contoh: JSA-001 Pengoperasian Excavator"
                        />
                        {errors.judul_dokumen && (
                            <p className="text-sm text-destructive">
                                {errors.judul_dokumen}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="catatan"
                            className="text-[13px] font-semibold"
                        >
                            Catatan / Masukan{' '}
                            <span className="text-sm font-normal text-muted-foreground">
                                (opsional)
                            </span>
                        </Label>
                        <Textarea
                            id="catatan"
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            placeholder="Catatan tambahan atau masukan"
                        />
                    </div>
                </div>

                {/* ── Team Leader ── */}
                <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2 text-[13px] font-semibold">
                        <UserCheck size={16} />
                        Team Leader / Supervisor
                        <span className="text-sm font-normal text-muted-foreground">
                            (opsional)
                        </span>
                    </Label>
                    <p className="-mt-1 text-sm text-muted-foreground">
                        Jika tidak dipilih, Anda otomatis menjadi team leader
                        dan form langsung selesai.
                    </p>
                    <ComboField
                        id="team_leader"
                        label="Team leader"
                        value={teamLeaderId}
                        options={[
                            { value: '', label: 'Saya sendiri' },
                            ...availableStaffUsers.map((u) => ({
                                value: String(u.id),
                                label: u.name,
                                sub: u.jabatan,
                            })),
                        ]}
                        onChange={setTeamLeaderId}
                        placeholder="Saya sendiri"
                        searchPlaceholder="Cari nama…"
                    />
                    {selectedTL && (
                        <p className="text-sm font-semibold text-warning">
                            Form akan dikirim ke {selectedTL.name} untuk
                            dikonfirmasi.
                        </p>
                    )}
                    {errors.team_leader_id && (
                        <p className="text-sm text-destructive">
                            {errors.team_leader_id}
                        </p>
                    )}
                </div>

                <Separator />

                {/* ── Daftar Peserta ── */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-[13px] font-semibold">
                            Daftar Peserta{' '}
                            <span className="text-destructive">*</span>
                            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                                ({peserta.length}/10)
                            </span>
                        </Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPeserta}
                            disabled={peserta.length >= 10}
                            className="gap-1.5"
                        >
                            <Plus size={14} /> Tambah
                        </Button>
                    </div>
                    <p className="-mt-1 text-sm text-muted-foreground">
                        Yang bertanda tangan di bawah ini menyatakan sudah
                        mendiskusikan/membaca JSA/SOP/IK, memahami dan akan
                        melaksanakannya.
                    </p>
                    {errors.peserta && (
                        <p className="text-sm text-destructive">
                            {errors.peserta}
                        </p>
                    )}

                    <div className="flex flex-col gap-3">
                        {peserta.map((p, idx) => (
                            <Card
                                key={idx}
                                className="overflow-hidden border-0"
                            >
                                <CardContent className="flex flex-col gap-3 pt-4 pb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            Peserta {idx + 1}
                                        </span>
                                        {peserta.length > 1 && (
                                            <Button
                                                aria-label="Hapus"
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive"
                                                onClick={() =>
                                                    removePeserta(idx)
                                                }
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-medium">
                                            Nama{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            value={p.nama}
                                            onChange={(e) =>
                                                updatePeserta(
                                                    idx,
                                                    'nama',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Nama lengkap"
                                            className="h-10 text-sm"
                                        />
                                        {errors[`peserta_${idx}_nama`] && (
                                            <p className="text-sm text-destructive">
                                                {errors[`peserta_${idx}_nama`]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-sm font-medium">
                                                Jabatan
                                            </Label>
                                            <Input
                                                value={p.jabatan}
                                                onChange={(e) =>
                                                    updatePeserta(
                                                        idx,
                                                        'jabatan',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Jabatan"
                                                className="h-10 text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-sm font-medium">
                                                NIK
                                            </Label>
                                            <Input
                                                value={p.nik}
                                                onChange={(e) =>
                                                    updatePeserta(
                                                        idx,
                                                        'nik',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="NIK"
                                                className="h-10 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-medium">
                                            Tanda Tangan{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        {p.tanda_tangan ? (
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={p.tanda_tangan}
                                                    alt="TTD"
                                                    className="h-14 rounded border bg-white object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setTtdDialogIdx(idx)
                                                    }
                                                    className="gap-1.5"
                                                >
                                                    <PenLine size={13} /> Ubah
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-10 justify-start gap-2 text-muted-foreground"
                                                onClick={() =>
                                                    setTtdDialogIdx(idx)
                                                }
                                            >
                                                <PenLine size={15} /> Tanda
                                                tangan di sini
                                            </Button>
                                        )}
                                        {errors[`peserta_${idx}_ttd`] && (
                                            <p className="text-sm text-destructive">
                                                {errors[`peserta_${idx}_ttd`]}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* ── Foto Bukti ── */}
                <div className="flex flex-col gap-3">
                    <Label className="flex items-center gap-2 text-[13px] font-semibold">
                        <Camera size={16} />
                        Foto Bukti Komunikasi{' '}
                        <span className="text-destructive">*</span>
                    </Label>

                    <div className="flex flex-col gap-3">
                        {/* Foto Kelompok */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-medium">
                                Foto Kelompok (saat briefing berlangsung){' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            {fotoKelompokPreview ? (
                                <div className="flex flex-col gap-2">
                                    <img
                                        src={fotoKelompokPreview}
                                        alt="Foto kelompok"
                                        className="max-h-48 w-full rounded-lg object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 self-start"
                                        onClick={() => {
                                            setFotoKelompok(null);
                                            setFotoKelompokPreview('');
                                        }}
                                    >
                                        <X size={13} /> Hapus foto
                                    </Button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setPhotoSheet('kelompok')}
                                    className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-card p-6 text-sm font-bold transition-colors hover:bg-muted"
                                >
                                    <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                                        <Camera size={20} />
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Ketuk untuk ambil/pilih foto kelompok
                                    </span>
                                </button>
                            )}
                            {errors.foto_kelompok && (
                                <p className="text-sm text-destructive">
                                    {errors.foto_kelompok}
                                </p>
                            )}
                        </div>

                        {/* Foto Dokumen */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-medium">
                                Foto Dokumen JSA/SOP/IK yang Dikomunikasikan{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            {fotoDokumenPreview ? (
                                <div className="flex flex-col gap-2">
                                    <img
                                        src={fotoDokumenPreview}
                                        alt="Foto dokumen"
                                        className="max-h-48 w-full rounded-lg object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 self-start"
                                        onClick={() => {
                                            setFotoDokumen(null);
                                            setFotoDokumenPreview('');
                                        }}
                                    >
                                        <X size={13} /> Hapus foto
                                    </Button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setPhotoSheet('dokumen')}
                                    className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-card p-6 text-sm font-bold transition-colors hover:bg-muted"
                                >
                                    <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                                        <BookOpen size={20} />
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Ketuk untuk ambil/pilih foto dokumen
                                        JSA/SOP/IK
                                    </span>
                                </button>
                            )}
                            {errors.foto_dokumen && (
                                <p className="text-sm text-destructive">
                                    {errors.foto_dokumen}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── TTD Supervisor (jika tidak ada TL eksternal) ── */}
                {noExternalTL && (
                    <>
                        <Separator />
                        <div className="flex flex-col gap-3">
                            <Label className="text-[13px] font-semibold">
                                Tanda Tangan Supervisor{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <p className="-mt-1 text-sm text-muted-foreground">
                                {user.name}
                                {user.jabatan ? ` — ${user.jabatan}` : ''}
                            </p>
                            {supervisorSig ? (
                                <div className="flex items-center gap-3">
                                    <img
                                        src={supervisorSig}
                                        alt="TTD Supervisor"
                                        className="h-20 rounded border bg-white object-contain"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowSupervisorSig(true)
                                        }
                                        className="gap-1.5"
                                    >
                                        <PenLine size={13} /> Ubah
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 justify-start gap-2 text-muted-foreground"
                                    onClick={() => setShowSupervisorSig(true)}
                                >
                                    <PenLine size={16} /> Tanda tangan
                                    supervisor di sini
                                </Button>
                            )}
                            {errors.supervisor_signature && (
                                <p className="text-sm text-destructive">
                                    {errors.supervisor_signature}
                                </p>
                            )}
                        </div>
                    </>
                )}

                <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:mx-0 lg:px-0">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        loading={processing}
                    >
                        {teamLeaderId
                            ? 'Kirim untuk dikonfirmasi'
                            : 'Simpan lembar komunikasi'}
                    </Button>
                </div>
            </form>

            {/* Dialog TTD Peserta */}
            <Dialog
                open={ttdDialogIdx !== null}
                onOpenChange={(open) => !open && setTtdDialogIdx(null)}
            >
                <DialogContent
                    className="max-w-sm"
                    aria-describedby={undefined}
                >
                    <DialogHeader>
                        <DialogTitle>
                            Tanda Tangan Peserta{' '}
                            {ttdDialogIdx !== null ? ttdDialogIdx + 1 : ''}
                        </DialogTitle>
                    </DialogHeader>
                    {ttdDialogIdx !== null && (
                        <SignatureStep
                            onSave={handleTtdSave}
                            onCancel={() => setTtdDialogIdx(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Hidden file inputs untuk galeri */}
            <input
                ref={fotoKelompokGalleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    handleFotoChange('kelompok', e.target.files?.[0] ?? null);
                    e.target.value = '';
                }}
            />
            <input
                ref={fotoDokumenGalleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    handleFotoChange('dokumen', e.target.files?.[0] ?? null);
                    e.target.value = '';
                }}
            />
            <UploadOverlay
                open={processing}
                progress={uploadProgress}
                label="Menyimpan JSA..."
            />
            <CameraCapture
                open={showCamera !== null}
                onCapture={(file) => {
                    const slot = showCamera;
                    setShowCamera(null);

                    if (slot) {
                        handleFotoChange(slot, file);
                    }
                }}
                onClose={() => setShowCamera(null)}
            />

            {/* Sheet pilihan sumber foto */}
            <Sheet
                open={photoSheet !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPhotoSheet(null);
                    }
                }}
            >
                <SheetContent side="bottom" className="pb-8">
                    <SheetHeader>
                        <SheetTitle>Pilih Sumber Foto</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-3">
                        <Button
                            variant="outline"
                            className="h-14 gap-3 text-base"
                            onClick={() => choosePhotoSource('camera')}
                        >
                            <Camera size={22} /> Ambil dari Kamera
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 gap-3 text-base"
                            onClick={() => choosePhotoSource('gallery')}
                        >
                            <Images size={22} /> Pilih dari Galeri
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Dialog TTD Supervisor */}
            <Dialog
                open={showSupervisorSig}
                onOpenChange={setShowSupervisorSig}
            >
                <DialogContent
                    className="max-w-sm"
                    aria-describedby={undefined}
                >
                    <DialogHeader>
                        <DialogTitle>Tanda Tangan Supervisor</DialogTitle>
                    </DialogHeader>
                    <SignatureStep
                        onSave={(sig) => {
                            setSupervisorSig(sig);
                            setShowSupervisorSig(false);
                        }}
                        onCancel={() => setShowSupervisorSig(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
