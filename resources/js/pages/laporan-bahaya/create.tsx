import { Head, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleDot,
    Clock,
    Loader,
    Moon,
    Sun,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { choiceChip, choiceSurface } from '@/components/patterns/choice-card';
import { ComboField } from '@/components/patterns/combo-field';
import { FormStepper } from '@/components/patterns/form-stepper';
import { ModuleHeader } from '@/components/patterns/module-header';
import { OfflineSaved } from '@/components/patterns/offline-saved';
import { PhotoPicker } from '@/components/patterns/photo-picker';
import { RiskMatrix } from '@/components/patterns/risk-matrix';
import type { RiskAxis, RiskOption } from '@/components/patterns/risk-matrix';
import { SiteCombobox } from '@/components/site-combobox';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TimePickerInput } from '@/components/ui/time-picker-input';
import { UploadOverlay } from '@/components/upload-overlay';
import { useDraft } from '@/hooks/use-draft';
import { enqueue, isOffline } from '@/lib/offline-queue';
import { computeRisk, riskLabels } from '@/lib/risk';
import { tindakanLabels } from '@/lib/status';
import type { StatusTindakan } from '@/lib/status';
import { cn } from '@/lib/utils';

type UserInfo = {
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
};
type PicUser = {
    id: number;
    name: string;
    jabatan?: string | null;
    sites: string[];
};
type SiteOption = { value: string; label: string; locations?: string[] | null };
type Props = { user: UserInfo; sites: SiteOption[]; pics: PicUser[] };

const PROBABILITAS: RiskOption[] = [
    { value: '1', label: 'Hampir tidak mungkin', sub: 'Belum pernah terjadi' },
    { value: '2', label: 'Kecil kemungkinannya', sub: 'Jarang sekali terjadi' },
    {
        value: '3',
        label: 'Kadang-kadang terjadi',
        sub: 'Pernah terjadi beberapa kali',
    },
    { value: '4', label: 'Sering terjadi', sub: 'Terjadi cukup rutin' },
    {
        value: '5',
        label: 'Hampir pasti terjadi',
        sub: 'Terjadi hampir setiap saat',
    },
];

const FREKUENSI: RiskOption[] = [
    { value: '1', label: 'Setahun sekali', sub: 'Sangat jarang terpapar' },
    { value: '2', label: 'Sebulan sekali', sub: 'Sesekali terpapar' },
    { value: '3', label: 'Seminggu sekali', sub: 'Cukup sering terpapar' },
    { value: '4', label: 'Setiap hari', sub: 'Terpapar setiap hari kerja' },
    { value: '5', label: 'Berkali-kali sehari', sub: 'Hampir selalu terpapar' },
];

const SEVERITY: RiskOption[] = [
    {
        value: '1',
        label: 'Sangat ringan',
        sub: 'Luka kecil, bisa diobati sendiri',
    },
    { value: '2', label: 'Ringan', sub: 'Perlu ke klinik / dokter' },
    { value: '3', label: 'Sedang', sub: 'Tidak bisa bekerja sementara' },
    {
        value: '25',
        label: 'Berat',
        sub: 'Cacat permanen / tidak bisa kerja lama',
    },
    {
        value: '30',
        label: 'Sangat berat / meninggal',
        sub: 'Mengancam jiwa atau kematian',
    },
];

const RISK_AXES = [
    {
        key: 'probabilitas' as const,
        title: 'Probabilitas',
        options: PROBABILITAS,
    },
    {
        key: 'frekuensi' as const,
        title: 'Frekuensi paparan',
        options: FREKUENSI,
    },
    {
        key: 'severity' as const,
        title: 'Severity (keparahan)',
        options: SEVERITY,
    },
];

const KLASIFIKASI = {
    TTA: [
        'Mengoperasikan unit tanpa wewenang',
        'Melanggar prosedur yang ditentukan',
        'Membuat peralatan safety tidak berfungsi',
        'Menggunakan peralatan yang rusak',
        'Tidak memakai APD',
        'Pemuatan Material Tidak Sesuai Prosedur',
        'Penempatan peralatan/unit tidak sesuai prosedur',
        'Berada pada posisi/daerah yang tidak aman',
        'Memperbaiki unit/alat yang sedang beroperasi',
        'Berada di bawah pengaruh obat-obatan atau alkohol',
        'Bercanda berlebihan atau tidak serius melakukan pekerjaan secara benar',
        'Menggunakan peralatan yang tidak sesuai',
        'LOTO/Barikade/Safety Cone',
        'Lain-Lain Tindakan Tidak Aman',
    ],
    KTA: [
        'Sarana Pelindung/Pengaman tidak memadai',
        'APD tidak layak/rusak',
        'Alat, peralatan dan material yang rusak',
        'Ruang Gerak Terbatas',
        'Bahaya kebakaran dan ledakan',
        'Pemeliharaan yang kurang',
        'Kondisi lingkungan yang berbahaya',
        'Paparan kebisingan',
        'Paparan radiasi',
        'Paparan terhadap suhu tinggi atau rendah',
        'Pencahayaan yang kurang',
        'Ventilasi yang tidak memadai',
        'Sistem Peringatan yang tidak memadai',
        'Kondisi Ergonomi',
        'Alat, peralatan dan material tidak sesuai',
        'Lain-lain Kondisi Tidak Aman',
    ],
};

const KATEGORI = [
    { value: 'KTA', label: 'KTA · Kondisi', sub: 'Kondisi tidak aman' },
    { value: 'TTA', label: 'TTA · Tindakan', sub: 'Tindakan tidak aman' },
];

const STATUS_OPTIONS: { value: StatusTindakan; Icon: typeof Clock }[] = [
    { value: 'pending', Icon: Clock },
    { value: 'continue', Icon: CircleDot },
    { value: 'progress', Icon: Loader },
    { value: 'close', Icon: CheckCircle2 },
];

const SHIFT_OPTIONS = [
    { value: 'siang', label: 'Siang', Icon: Sun },
    { value: 'malam', label: 'Malam', Icon: Moon },
];

const STEP_LABELS =['Lokasi & foto', 'Tingkat bahaya', 'Tindakan'];

// Step each field lives on, so a server error jumps to the right place.
const FIELD_STEP: Record<string, number> = {
    foto: 1,
    foto_2: 1,
    kategori: 1,
    klasifikasi_bahaya: 1,
    site: 1,
    lokasi: 1,
    detail_lokasi: 1,
    tanggal: 1,
    waktu_pengamatan: 1,
    shift: 1,
    probabilitas: 2,
    frekuensi: 2,
    severity: 2,
};

const toProperCase = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

type FormData = {
    site: string;
    tanggal: string;
    waktu_pengamatan: string;
    shift: string;
    kategori: string;
    klasifikasi_bahaya: string;
    lokasi: string;
    detail_lokasi: string;
    deskripsi_bahaya: string;
    tindakan_perbaikan: string;
    probabilitas: string;
    frekuensi: string;
    severity: string;
    status_tindakan: StatusTindakan;
    pic_user_id: string;
};

export default function LaporanBahayaCreate({ user, sites, pics }: Props) {
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    });
    const [step, setStep] = useState(1);
    const [fotos, setFotos] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [savedOffline, setSavedOffline] = useState(false);

    const { data, setData, post, processing, errors, transform } =
        useForm<FormData>({
            site:
                user.site && sites.some((s) => s.value === user.site)
                    ? user.site
                    : (sites[0]?.value ?? ''),
            tanggal: today,
            waktu_pengamatan: '',
            shift: '',
            kategori: '',
            klasifikasi_bahaya: '',
            lokasi: '',
            detail_lokasi: '',
            deskripsi_bahaya: '',
            tindakan_perbaikan: '',
            probabilitas: '',
            frekuensi: '',
            severity: '',
            status_tindakan: 'pending',
            pic_user_id: '',
        });

    // Photos are not kept in the draft; text fields survive a lost signal.
    const draft = useDraft('laporan-bahaya', data, (saved) =>
        setData((current) => ({
            ...current,
            ...saved,
            site:
                saved.site && sites.some((s) => s.value === saved.site)
                    ? saved.site
                    : current.site,
        })),
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const lokasiOptions = (
        sites.find((s) => s.value === data.site)?.locations ?? []
    ).map((l) => ({ value: l, label: l }));
    const picOptions = pics
        .filter((p) => p.sites.includes(data.site))
        .map((p) => ({
            value: String(p.id),
            label: p.name,
            sub: [p.jabatan, p.sites.join(', ')].filter(Boolean).join(' · '),
        }));
    const klasifikasiOptions = (
        KLASIFIKASI[data.kategori as 'KTA' | 'TTA'] ?? []
    ).map((k) => ({ value: k, label: k }));

    const risk =
        Number(data.probabilitas) &&
        Number(data.frekuensi) &&
        Number(data.severity)
            ? computeRisk(
                  Number(data.probabilitas),
                  Number(data.frekuensi),
                  Number(data.severity),
              )
            : null;

    const step1OK = !!(
        fotos.length > 0 &&
        data.site &&
        data.tanggal &&
        data.waktu_pengamatan &&
        data.shift &&
        data.kategori &&
        data.klasifikasi_bahaya &&
        data.lokasi
    );
    const step2OK = !!risk;
    const step3OK = !!(
        data.deskripsi_bahaya.trim() &&
        data.tindakan_perbaikan.trim() &&
        data.pic_user_id
    );
    const canNext =
        step === 1
            ? step1OK
            : step === 2
              ? step2OK
              : step1OK && step2OK && step3OK;

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (step < 3) {
            if (canNext) {
                setStep((s) => s + 1);
            }

            return;
        }

        if (!canNext) {
            return;
        }

        if (isOffline()) {
            const files: Record<string, Blob> = {};

            if (fotos[0]) {
                files.foto = fotos[0];
            }

            if (fotos[1]) {
                files.foto_2 = fotos[1];
            }

            void enqueue({
                url: '/laporan-bahaya',
                label: `Laporan bahaya ${data.lokasi}`,
                fields: Object.fromEntries(
                    Object.entries(data).map(([k, v]) => [k, String(v ?? '')]),
                ),
                files,
                successMatch: 'terkirim=1',
            }).then(() => {
                draft.clear();
                setSavedOffline(true);
            });

            return;
        }

        transform((d) => ({
            ...d,
            foto: fotos[0] ?? null,
            foto_2: fotos[1] ?? null,
        }));
        setUploadProgress(0);
        post('/laporan-bahaya', {
            forceFormData: true,
            onProgress: (ev) => setUploadProgress(ev?.percentage ?? null),
            onFinish: () => setUploadProgress(null),
            onSuccess: () => draft.clear(),
            onError: (errs) => {
                setStep(
                    Object.keys(errs).reduce(
                        (min, field) => Math.min(min, FIELD_STEP[field] ?? 3),
                        3,
                    ),
                );
                toast.error(
                    'Laporan belum tersimpan. Periksa kembali isian yang ditandai.',
                );
            },
        });
    };

    const picked = picOptions.find((p) => p.value === data.pic_user_id);

    if (savedOffline) {
        return (
            <OfflineSaved
                what="Laporan bahaya"
                onAgain={() => window.location.reload()}
            />
        );
    }

    return (
        <>
            <Head title="Laporan Bahaya" />

            <form
                onSubmit={submit}
                className="flex flex-col gap-4 pt-2 lg:mx-auto lg:max-w-[560px]"
            >
                <ModuleHeader
                    backHref="/laporan-bahaya"
                    title="Laporan Bahaya"
                    eyebrow="Draft tersimpan otomatis"
                    step={{ current: step, total: 3 }}
                />

                <FormStepper
                    step={step}
                    total={3}
                    labels={STEP_LABELS}
                    secondary={
                        step > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => setStep((s) => s - 1)}
                            >
                                Kembali
                            </Button>
                        ) : undefined
                    }
                    primary={
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!canNext}
                            loading={processing}
                        >
                            {step === 1
                                ? 'Lanjut · Tingkat bahaya'
                                : step === 2
                                  ? 'Lanjut · Tindakan'
                                  : 'Kirim laporan'}
                        </Button>
                    }
                >
                    {step === 1 && (
                        <>
                            <PhotoPicker
                                value={fotos}
                                onChange={setFotos}
                                label={
                                    <>
                                        Foto temuan{' '}
                                        <span className="font-normal text-muted-foreground">
                                            (wajib, min. 1)
                                        </span>
                                    </>
                                }
                            />
                            <InputError
                                message={
                                    (
                                        errors as Record<
                                            string,
                                            string | undefined
                                        >
                                    ).foto ??
                                    (
                                        errors as Record<
                                            string,
                                            string | undefined
                                        >
                                    ).foto_2
                                }
                            />

                            <div
                                role="radiogroup"
                                aria-labelledby="kategori-label"
                                className="flex flex-col gap-2"
                            >
                                <span
                                    id="kategori-label"
                                    className="text-[13px] font-semibold"
                                >
                                    Kategori
                                </span>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {KATEGORI.map((k) => {
                                        const on = data.kategori === k.value;

                                        return (
                                            <button
                                                key={k.value}
                                                type="button"
                                                role="radio"
                                                aria-checked={on}
                                                onClick={() =>
                                                    setData((d) => ({
                                                        ...d,
                                                        kategori: k.value,
                                                        klasifikasi_bahaya: '',
                                                    }))
                                                }
                                                className={cn(
                                                    'flex min-h-[64px] flex-col items-start justify-center rounded-lg px-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                                    choiceSurface(on),
                                                )}
                                            >
                                                <span className="text-sm font-bold">
                                                    {k.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {k.sub}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.kategori} />
                            </div>

                            <ComboField
                                id="klasifikasi"
                                label="Klasifikasi"
                                value={data.klasifikasi_bahaya}
                                options={klasifikasiOptions}
                                onChange={(v) =>
                                    setData('klasifikasi_bahaya', v)
                                }
                                placeholder={
                                    data.kategori
                                        ? 'Pilih klasifikasi'
                                        : 'Pilih kategori dulu'
                                }
                                searchPlaceholder="Cari klasifikasi…"
                                disabled={!data.kategori}
                                error={errors.klasifikasi_bahaya}
                            />

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <span className="text-[13px] font-semibold">
                                        Site
                                    </span>
                                    <SiteCombobox
                                        value={data.site}
                                        options={sites}
                                        onChange={(value) =>
                                            setData((d) => ({
                                                ...d,
                                                site: value,
                                                pic_user_id: '',
                                                lokasi: '',
                                            }))
                                        }
                                        placeholder="Pilih site"
                                    />
                                    <InputError message={errors.site} />
                                </div>
                                <ComboField
                                    id="lokasi"
                                    label="Lokasi"
                                    value={data.lokasi}
                                    options={lokasiOptions}
                                    onChange={(v) => setData('lokasi', v)}
                                    placeholder="Pilih lokasi"
                                    searchPlaceholder="Cari lokasi…"
                                    emptyText="Lokasi tidak ditemukan."
                                    error={errors.lokasi}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="detail_lokasi"
                                    className="text-[13px] font-semibold"
                                >
                                    Detail lokasi{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (opsional)
                                    </span>
                                </Label>
                                <Input
                                    id="detail_lokasi"
                                    value={data.detail_lokasi}
                                    maxLength={255}
                                    onChange={(e) =>
                                        setData(
                                            'detail_lokasi',
                                            toProperCase(e.target.value),
                                        )
                                    }
                                    placeholder="Contoh: KM 4, tikungan sebelum pos"
                                />
                                <InputError message={errors.detail_lokasi} />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <span className="text-[13px] font-semibold">
                                        Tanggal
                                    </span>
                                    <DatePickerInput
                                        value={data.tanggal}
                                        onChange={(v) => setData('tanggal', v)}
                                        max={today}
                                        error={!!errors.tanggal}
                                    />
                                    <InputError message={errors.tanggal} />
                                </div>
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <span className="text-[13px] font-semibold">
                                        Waktu
                                    </span>
                                    <TimePickerInput
                                        value={data.waktu_pengamatan}
                                        onChange={(v) =>
                                            setData('waktu_pengamatan', v)
                                        }
                                        error={!!errors.waktu_pengamatan}
                                    />
                                    <InputError
                                        message={errors.waktu_pengamatan}
                                    />
                                </div>
                            </div>

                            <div
                                role="radiogroup"
                                aria-labelledby="shift-label"
                                className="flex flex-col gap-2"
                            >
                                <span
                                    id="shift-label"
                                    className="text-[13px] font-semibold"
                                >
                                    Shift
                                </span>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {SHIFT_OPTIONS.map(
                                        ({ value, label, Icon }) => {
                                            const on = data.shift === value;

                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={on}
                                                    onClick={() =>
                                                        setData('shift', value)
                                                    }
                                                    className={cn(
                                                        'flex h-[52px] items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                                        choiceSurface(on),
                                                    )}
                                                >
                                                    <Icon className="size-4" />
                                                    {label}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                                <InputError message={errors.shift} />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <RiskMatrix
                            axes={RISK_AXES}
                            value={{
                                probabilitas: data.probabilitas,
                                frekuensi: data.frekuensi,
                                severity: data.severity,
                            }}
                            onChange={(key: RiskAxis, v) => setData(key, v)}
                            errors={{
                                probabilitas: errors.probabilitas,
                                frekuensi: errors.frekuensi,
                                severity: errors.severity,
                            }}
                        />
                    )}

                    {step === 3 && (
                        <>
                            {risk && (
                                <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold">
                                            {riskLabels[risk.level]} ·{' '}
                                            {risk.level} · {risk.nilai}
                                        </span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {data.kategori} · {data.lokasi}
                                            {data.detail_lokasi
                                                ? ` ${data.detail_lokasi}`
                                                : ''}{' '}
                                            · {fotos.length} foto
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="min-h-11 px-2 text-[13px] font-semibold hover:underline"
                                    >
                                        Ubah
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="deskripsi_bahaya"
                                    className="text-[13px] font-semibold"
                                >
                                    Uraian bahaya
                                </Label>
                                <Textarea
                                    id="deskripsi_bahaya"
                                    rows={3}
                                    value={data.deskripsi_bahaya}
                                    onChange={(e) =>
                                        setData(
                                            'deskripsi_bahaya',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Apa yang Anda lihat, di mana, dan mengapa berbahaya?"
                                    aria-invalid={
                                        errors.deskripsi_bahaya
                                            ? true
                                            : undefined
                                    }
                                />
                                <InputError message={errors.deskripsi_bahaya} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="tindakan_perbaikan"
                                    className="text-[13px] font-semibold"
                                >
                                    Tindakan yang sudah / perlu dilakukan
                                </Label>
                                <Textarea
                                    id="tindakan_perbaikan"
                                    rows={3}
                                    value={data.tindakan_perbaikan}
                                    onChange={(e) =>
                                        setData(
                                            'tindakan_perbaikan',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: pasang rambu dan cone, minta grader perbaiki."
                                    aria-invalid={
                                        errors.tindakan_perbaikan
                                            ? true
                                            : undefined
                                    }
                                />
                                <InputError
                                    message={errors.tindakan_perbaikan}
                                />
                            </div>

                            <div
                                role="radiogroup"
                                aria-labelledby="status-label"
                                className="flex flex-col gap-2"
                            >
                                <span
                                    id="status-label"
                                    className="text-[13px] font-semibold"
                                >
                                    Status tindakan
                                </span>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {STATUS_OPTIONS.map(({ value, Icon }) => {
                                        const on =
                                            data.status_tindakan === value;

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                role="radio"
                                                aria-checked={on}
                                                onClick={() =>
                                                    setData(
                                                        'status_tindakan',
                                                        value,
                                                    )
                                                }
                                                className={cn(
                                                    'flex h-11 items-center justify-center gap-1.5 rounded-full text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                                    choiceChip(on),
                                                )}
                                            >
                                                <Icon className="size-4" />
                                                {tindakanLabels[value]}
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.status_tindakan} />
                            </div>

                            <ComboField
                                id="pic"
                                label="PIC penanggung jawab"
                                value={data.pic_user_id}
                                options={picOptions}
                                onChange={(v) => setData('pic_user_id', v)}
                                placeholder={
                                    picOptions.length
                                        ? 'Pilih PIC'
                                        : 'Belum ada PIC di site ini'
                                }
                                searchPlaceholder="Cari nama PIC…"
                                emptyText="PIC tidak ditemukan."
                                error={errors.pic_user_id}
                                disabled={picOptions.length === 0}
                            />
                            {picked && (
                                <p className="-mt-2 text-xs text-muted-foreground">
                                    PIC akan menerima notifikasi setelah laporan
                                    dikirim.
                                </p>
                            )}
                        </>
                    )}
                </FormStepper>
            </form>

            <UploadOverlay
                open={processing}
                progress={uploadProgress}
                label="Mengirim laporan..."
            />
        </>
    );
}
