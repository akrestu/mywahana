import { Head, router } from '@inertiajs/react';
import {
    Camera,
    Check,
    ChevronsUpDown,
    Images,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CameraCapture } from '@/components/camera-capture';
import InputError from '@/components/input-error';
import type { InspeksiConfig } from '@/components/inspeksi/checklists';
import { ComboField } from '@/components/patterns/combo-field';
import { FormStepper } from '@/components/patterns/form-stepper';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { SignaturePad } from '@/components/patterns/signature-pad';
import { SiteCombobox } from '@/components/site-combobox';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { UploadOverlay } from '@/components/upload-overlay';
import { compressImageWithToast } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

export type InspeksiCategory = {
    key: string;
    label: string;
    items: readonly { key: string; label: string }[];
};
export type InspeksiField = {
    key: 'departemen' | 'lokasi';
    label: string;
    placeholder: string;
    required?: boolean;
    format?: (value: string) => string;
};
export type StaffUser = {
    id: number;
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
    sites: string[];
};
export type SiteOption = { value: string; label: string };
export type InspeksiUser = {
    name: string;
    departemen?: string | null;
    site?: string | null;
};

type TindakanRow = {
    tindakan: string;
    pic: string;
    due_date: string;
    remark: string;
};

const SCORE_LABELS = ['', 'Sangat kurang', 'Kurang', 'Baik', 'Sangat baik'];
const SCORE_ON = [
    '',
    'bg-destructive text-destructive-foreground',
    'bg-warning text-on-solid',
    'bg-success text-on-solid',
    'bg-primary text-primary-foreground',
];

// Same thresholds as the backend grading.
const LEVEL = {
    L: { label: 'Baik', card: 'bg-success-soft text-success' },
    M: { label: 'Cukup', card: 'bg-accent-soft text-foreground' },
    H: { label: 'Perhatian', card: 'bg-warning-soft text-warning' },
    VH: {
        label: 'Perlu tindakan',
        card: 'bg-destructive-soft text-destructive',
    },
} as const;

function calcScore(keys: string[], scores: Record<string, string>) {
    const filled = keys
        .map((k) => Number(scores[k]))
        .filter((v) => v >= 1 && v <= 4);
    const total = filled.reduce((a, b) => a + b, 0);
    const max = keys.length * 4;
    const pct =
        filled.length > 0 ? Math.round((total / max) * 100 * 10) / 10 : 0;
    const level: keyof typeof LEVEL =
        pct >= 85 ? 'L' : pct >= 70 ? 'M' : pct >= 50 ? 'H' : 'VH';

    return { total, max, pct, level, filled: filled.length };
}

/**
 * Shared three-step inspection form (info → checklist → summary & sign).
 * Each inspection type only supplies its checklist and identity fields;
 * the payload matches what the four controllers already validate.
 */
export function InspeksiForm({
    config,
    user,
    staffUsers,
    sites,
}: {
    config: InspeksiConfig;
    user: InspeksiUser;
    staffUsers: StaffUser[];
    sites: SiteOption[];
}) {
    const { title, formCode, categories, fields } = config;
    const postUrl = `/sap/inspeksi-${config.kind}`;
    const backHref = postUrl;
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    });
    const scoreKeys = useMemo(
        () => categories.flatMap((c) => c.items.map((i) => i.key)),
        [categories],
    );

    const [step, setStep] = useState(1);
    const [tanggal, setTanggal] = useState(today);
    const [projectSite, setProjectSite] = useState(
        sites.find((s) => s.value === user.site)?.label ?? '',
    );
    const [info, setInfo] = useState<Record<string, string>>({
        departemen: user.departemen ?? '',
        lokasi: '',
    });
    const [reInspektorId, setReInspektorId] = useState('');
    const [pesertaIds, setPesertaIds] = useState<number[]>([]);
    const [scores, setScores] = useState<Record<string, string>>(() =>
        Object.fromEntries(scoreKeys.map((k) => [k, ''])),
    );
    const [fotos, setFotos] = useState<Record<string, File>>({});
    const [tindakan, setTindakan] = useState<TindakanRow[]>([]);
    const [ttd, setTtd] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [pesertaOpen, setPesertaOpen] = useState(false);
    const [photoFor, setPhotoFor] = useState<string | null>(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const galleryRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const siteValue = sites.find((s) => s.label === projectSite)?.value;
    const staff = staffUsers.filter(
        (u) => siteValue && u.sites.includes(siteValue),
    );
    const staffOptions = staff.map((u) => ({
        value: String(u.id),
        label: u.name,
        sub: u.jabatan,
    }));
    const score = calcScore(scoreKeys, scores);
    const level = LEVEL[score.level];

    const step1OK =
        !!tanggal &&
        !!projectSite &&
        fields.every((f) => !f.required || info[f.key]?.trim());
    const canNext = step === 1 ? step1OK : step === 2 ? true : step1OK && !!ttd;

    const addFoto = async (file: File) => {
        if (!photoFor) {
            return;
        }

        const key = photoFor;
        const compressed = await compressImageWithToast(file, 1600, 0.8);
        setFotos((prev) => ({ ...prev, [key]: compressed }));
        setPhotoFor(null);
    };

    const pickGallery = () => galleryRef.current?.click();

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

        const fd = new FormData();
        fd.append('re_inspektor_id', reInspektorId);
        pesertaIds.forEach((id) => fd.append('peserta_ids[]', String(id)));
        fd.append('tanggal', tanggal);
        fd.append('project_site', projectSite);
        fields.forEach((f) => fd.append(f.key, info[f.key] ?? ''));
        scoreKeys.forEach((k) => fd.append(k, scores[k] ?? ''));
        tindakan.forEach((row, i) =>
            (Object.keys(row) as (keyof TindakanRow)[]).forEach((rk) =>
                fd.append(`tindakan_perbaikan[${i}][${rk}]`, row[rk]),
            ),
        );
        fd.append('ttd_inspektor', ttd);
        Object.entries(fotos).forEach(([k, f]) => fd.append(`foto[${k}]`, f));

        setUploadProgress(0);
        router.post(postUrl, fd, {
            onStart: () => setProcessing(true),
            onProgress: (ev) => setUploadProgress(ev?.percentage ?? null),
            onError: (errs) => {
                setErrors(errs);
                const infoKeys = [
                    'tanggal',
                    'project_site',
                    're_inspektor_id',
                    'peserta_ids',
                    ...fields.map((f) => f.key),
                ];
                const keys = Object.keys(errs);
                setStep(
                    keys.some((k) => infoKeys.includes(k))
                        ? 1
                        : keys.some(
                                (k) =>
                                    scoreKeys.includes(k) ||
                                    k.startsWith('foto'),
                            )
                          ? 2
                          : 3,
                );
                toast.error(
                    'Inspeksi belum tersimpan. Periksa kembali isian yang ditandai.',
                );
            },
            onFinish: () => {
                setUploadProgress(null);
                setProcessing(false);
            },
        });
    };

    const updateRow = (i: number, field: keyof TindakanRow, value: string) =>
        setTindakan((rows) =>
            rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
        );

    return (
        <>
            <Head title={title} />

            <form
                onSubmit={submit}
                className="flex flex-col gap-4 pt-2 lg:mx-auto lg:max-w-[640px]"
            >
                <ModuleHeader
                    backHref={backHref}
                    title={title}
                    eyebrow={formCode}
                    step={{ current: step, total: 3 }}
                />

                <FormStepper
                    step={step}
                    total={3}
                    labels={[
                        'Informasi',
                        'Checklist',
                        'Ringkasan & tanda tangan',
                    ]}
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
                                ? 'Lanjut · Checklist'
                                : step === 2
                                  ? `Lanjut · ${score.filled}/${scoreKeys.length} dinilai`
                                  : 'Simpan inspeksi'}
                        </Button>
                    }
                >
                    {step === 1 && (
                        <>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <span className="text-[13px] font-semibold">
                                        Tanggal
                                    </span>
                                    <DatePickerInput
                                        value={tanggal}
                                        onChange={setTanggal}
                                        max={today}
                                        error={!!errors.tanggal}
                                    />
                                    <InputError message={errors.tanggal} />
                                </div>
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <span className="text-[13px] font-semibold">
                                        Project / site
                                    </span>
                                    <SiteCombobox
                                        value={projectSite}
                                        options={sites.map((s) => ({
                                            value: s.label,
                                            label: s.label,
                                        }))}
                                        onChange={(v) => {
                                            setProjectSite(v);
                                            setReInspektorId('');
                                            setPesertaIds([]);
                                        }}
                                        placeholder="Pilih site"
                                    />
                                    <InputError message={errors.project_site} />
                                </div>
                            </div>

                            {fields.map((f) => (
                                <div
                                    key={f.key}
                                    className="flex flex-col gap-1.5"
                                >
                                    <Label
                                        htmlFor={f.key}
                                        className="text-[13px] font-semibold"
                                    >
                                        {f.label}{' '}
                                        {!f.required && (
                                            <span className="font-normal text-muted-foreground">
                                                (opsional)
                                            </span>
                                        )}
                                    </Label>
                                    <Input
                                        id={f.key}
                                        value={info[f.key] ?? ''}
                                        placeholder={f.placeholder}
                                        onChange={(e) =>
                                            setInfo((d) => ({
                                                ...d,
                                                [f.key]: e.target.value,
                                            }))
                                        }
                                        onBlur={(e) =>
                                            f.format &&
                                            setInfo((d) => ({
                                                ...d,
                                                [f.key]: f.format!(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        aria-invalid={
                                            errors[f.key] ? true : undefined
                                        }
                                    />
                                    <InputError message={errors[f.key]} />
                                </div>
                            ))}

                            <SectionLabel>Inspektor</SectionLabel>
                            <ComboField
                                id="re_inspektor"
                                label="Re-inspektor (opsional)"
                                value={reInspektorId}
                                options={[
                                    { value: '', label: 'Tanpa re-inspektor' },
                                    ...staffOptions,
                                ]}
                                onChange={setReInspektorId}
                                placeholder={
                                    staff.length
                                        ? 'Pilih re-inspektor'
                                        : 'Pilih site dulu'
                                }
                                searchPlaceholder="Cari nama…"
                                disabled={!siteValue}
                                error={errors.re_inspektor_id}
                            />

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-semibold">
                                    Peserta inspeksi{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (opsional)
                                    </span>
                                </span>
                                <Popover
                                    open={pesertaOpen}
                                    onOpenChange={setPesertaOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            role="combobox"
                                            aria-expanded={pesertaOpen}
                                            disabled={!siteValue}
                                            className="flex h-11 w-full items-center justify-between gap-2 rounded-md border-2 border-transparent bg-input px-4 text-left text-[15px] text-muted-foreground outline-none focus-visible:border-foreground disabled:opacity-50"
                                        >
                                            {pesertaIds.length
                                                ? `${pesertaIds.length} peserta dipilih`
                                                : 'Tambah peserta'}
                                            <ChevronsUpDown className="size-4 opacity-50" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-[var(--radix-popover-trigger-width)] rounded-lg p-0"
                                        align="start"
                                    >
                                        <Command>
                                            <CommandInput placeholder="Cari nama…" />
                                            <CommandList>
                                                <CommandEmpty>
                                                    Tidak ditemukan.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {staff.map((u) => {
                                                        const on =
                                                            pesertaIds.includes(
                                                                u.id,
                                                            );

                                                        return (
                                                            <CommandItem
                                                                key={u.id}
                                                                value={u.name}
                                                                className="min-h-11"
                                                                onSelect={() =>
                                                                    setPesertaIds(
                                                                        (
                                                                            ids,
                                                                        ) =>
                                                                            on
                                                                                ? ids.filter(
                                                                                      (
                                                                                          id,
                                                                                      ) =>
                                                                                          id !==
                                                                                          u.id,
                                                                                  )
                                                                                : [
                                                                                      ...ids,
                                                                                      u.id,
                                                                                  ],
                                                                    )
                                                                }
                                                            >
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block">
                                                                        {u.name}
                                                                    </span>
                                                                    {u.jabatan && (
                                                                        <span className="block text-xs text-muted-foreground">
                                                                            {
                                                                                u.jabatan
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <Check
                                                                    className={cn(
                                                                        'size-4',
                                                                        on
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {pesertaIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {staff
                                            .filter((u) =>
                                                pesertaIds.includes(u.id),
                                            )
                                            .map((u) => (
                                                <span
                                                    key={u.id}
                                                    className="flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-3 text-sm"
                                                >
                                                    {u.name}
                                                    <button
                                                        type="button"
                                                        aria-label={`Hapus ${u.name}`}
                                                        onClick={() =>
                                                            setPesertaIds(
                                                                (ids) =>
                                                                    ids.filter(
                                                                        (id) =>
                                                                            id !==
                                                                            u.id,
                                                                    ),
                                                            )
                                                        }
                                                        className="flex size-7 items-center justify-center rounded-full hover:bg-border"
                                                    >
                                                        <X className="size-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <p className="rounded-md bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                                Beri skor{' '}
                                <strong className="text-foreground">1–4</strong>
                                : 1 sangat kurang · 2 kurang · 3 baik · 4 sangat
                                baik. Item yang tidak relevan boleh dilewati.
                                Skor 1–2 sebaiknya disertai foto.
                            </p>
                            {categories.map((cat) => {
                                const done = cat.items.filter(
                                    (i) => scores[i.key],
                                ).length;

                                return (
                                    <section
                                        key={cat.key}
                                        className="flex flex-col gap-2"
                                    >
                                        <SectionLabel
                                            action={
                                                <span className="tabular text-xs font-semibold text-muted-foreground">
                                                    {done}/{cat.items.length}
                                                </span>
                                            }
                                        >
                                            {cat.label}
                                        </SectionLabel>
                                        {cat.items.map((item) => {
                                            const val = scores[item.key];
                                            const low =
                                                val === '1' || val === '2';
                                            const hasFoto = !!fotos[item.key];

                                            return (
                                                <div
                                                    key={item.key}
                                                    role="radiogroup"
                                                    aria-label={item.label}
                                                    className={cn(
                                                        'flex flex-col gap-3 rounded-lg p-4 transition-colors',
                                                        low
                                                            ? 'bg-destructive-soft'
                                                            : 'bg-card',
                                                    )}
                                                >
                                                    <p className="text-sm leading-relaxed">
                                                        {item.label}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {[1, 2, 3, 4].map(
                                                            (v) => {
                                                                const on =
                                                                    val ===
                                                                    String(v);

                                                                return (
                                                                    <button
                                                                        key={v}
                                                                        type="button"
                                                                        role="radio"
                                                                        aria-checked={
                                                                            on
                                                                        }
                                                                        aria-label={`${v} — ${SCORE_LABELS[v]}`}
                                                                        title={
                                                                            SCORE_LABELS[
                                                                                v
                                                                            ]
                                                                        }
                                                                        onClick={() =>
                                                                            setScores(
                                                                                (
                                                                                    s,
                                                                                ) => ({
                                                                                    ...s,
                                                                                    [item.key]:
                                                                                        on
                                                                                            ? ''
                                                                                            : String(
                                                                                                  v,
                                                                                              ),
                                                                                }),
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            'tabular size-11 rounded-full text-sm font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                                                            on
                                                                                ? SCORE_ON[
                                                                                      v
                                                                                  ]
                                                                                : 'border border-border bg-card hover:bg-muted',
                                                                        )}
                                                                    >
                                                                        {v}
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPhotoFor(
                                                                    item.key,
                                                                )
                                                            }
                                                            aria-label={
                                                                hasFoto
                                                                    ? 'Ganti atau hapus foto'
                                                                    : 'Tambah foto'
                                                            }
                                                            className={cn(
                                                                'ml-auto flex h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors',
                                                                hasFoto
                                                                    ? 'bg-success-soft text-success'
                                                                    : low
                                                                      ? 'bg-card text-foreground'
                                                                      : 'text-muted-foreground hover:bg-muted',
                                                            )}
                                                        >
                                                            {hasFoto ? (
                                                                <Check className="size-4" />
                                                            ) : (
                                                                <Camera className="size-4" />
                                                            )}
                                                            Foto
                                                        </button>
                                                    </div>
                                                    <InputError
                                                        message={
                                                            errors[item.key] ??
                                                            errors[
                                                                `foto.${item.key}`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            );
                                        })}
                                    </section>
                                );
                            })}
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div
                                aria-live="polite"
                                className={cn(
                                    'flex items-center gap-4 rounded-[22px] p-[18px]',
                                    level.card,
                                )}
                            >
                                <span className="flex size-[72px] shrink-0 flex-col items-center justify-center rounded-full bg-card/80 text-foreground">
                                    <span className="tabular text-xl font-extrabold">
                                        {score.pct}%
                                    </span>
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-lg font-extrabold">
                                        {level.label}
                                    </span>
                                    <span className="tabular block text-[13px]">
                                        {score.total} dari {score.max} poin ·{' '}
                                        {score.filled}/{scoreKeys.length} item
                                        dinilai
                                    </span>
                                </span>
                            </div>

                            <SectionLabel
                                action={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTindakan((rows) => [
                                                ...rows,
                                                {
                                                    tindakan: '',
                                                    pic: '',
                                                    due_date: '',
                                                    remark: '',
                                                },
                                            ])
                                        }
                                        className="flex min-h-11 items-center gap-1 text-[13px] font-semibold hover:underline"
                                    >
                                        <Plus className="size-4" /> Tambah
                                    </button>
                                }
                            >
                                Rekomendasi tindakan perbaikan
                            </SectionLabel>
                            {tindakan.length === 0 && (
                                <p className="rounded-lg bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                                    Belum ada tindakan perbaikan.
                                </p>
                            )}
                            {tindakan.map((row, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col gap-2 rounded-lg bg-card p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted-foreground">
                                            #{i + 1}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Hapus tindakan ${i + 1}`}
                                            onClick={() =>
                                                setTindakan((rows) =>
                                                    rows.filter(
                                                        (_, idx) => idx !== i,
                                                    ),
                                                )
                                            }
                                            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                    <Input
                                        placeholder="Tindakan perbaikan"
                                        aria-label="Tindakan perbaikan"
                                        value={row.tindakan}
                                        onChange={(e) =>
                                            updateRow(
                                                i,
                                                'tindakan',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="PIC"
                                            aria-label="PIC"
                                            value={row.pic}
                                            onChange={(e) =>
                                                updateRow(
                                                    i,
                                                    'pic',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <Input
                                            placeholder="Due date"
                                            aria-label="Due date"
                                            value={row.due_date}
                                            onChange={(e) =>
                                                updateRow(
                                                    i,
                                                    'due_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <Input
                                        placeholder="Keterangan"
                                        aria-label="Keterangan"
                                        value={row.remark}
                                        onChange={(e) =>
                                            updateRow(
                                                i,
                                                'remark',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            ))}

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-semibold">
                                    Tanda tangan inspektor{' '}
                                    <span className="text-destructive">*</span>
                                </span>
                                <SignaturePad
                                    onDataUrl={(d) => setTtd(d ?? '')}
                                />
                                <InputError message={errors.ttd_inspektor} />
                            </div>
                        </>
                    )}
                </FormStepper>
            </form>

            <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';

                    if (file) {
                        await addFoto(file);
                    }
                }}
            />

            <Sheet
                open={photoFor !== null && !cameraOpen}
                onOpenChange={(open) => !open && setPhotoFor(null)}
            >
                <SheetContent
                    side="bottom"
                    className="mx-auto max-w-lg gap-0 border-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                >
                    <div
                        className="mx-auto mt-3 h-1 w-10 rounded-full bg-border"
                        aria-hidden
                    />
                    <SheetHeader className="px-0 pb-4">
                        <SheetTitle className="text-left text-xl font-extrabold">
                            Foto temuan
                        </SheetTitle>
                        <SheetDescription className="text-left">
                            Foto dikompres otomatis sebelum diunggah.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant="soft"
                            size="lg"
                            className="h-[88px] flex-col rounded-lg"
                            onClick={() => setCameraOpen(true)}
                        >
                            <Camera className="size-6" />
                            Kamera
                        </Button>
                        <Button
                            type="button"
                            variant="soft"
                            size="lg"
                            className="h-[88px] flex-col rounded-lg"
                            onClick={pickGallery}
                        >
                            <Images className="size-6" />
                            Galeri
                        </Button>
                    </div>
                    {photoFor && fotos[photoFor] && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="mt-3 w-full text-destructive hover:text-destructive"
                            onClick={() => {
                                setFotos((prev) =>
                                    Object.fromEntries(
                                        Object.entries(prev).filter(
                                            ([k]) => k !== photoFor,
                                        ),
                                    ),
                                );
                                setPhotoFor(null);
                            }}
                        >
                            Hapus foto
                        </Button>
                    )}
                </SheetContent>
            </Sheet>

            <CameraCapture
                open={cameraOpen}
                onCapture={async (file) => {
                    setCameraOpen(false);
                    await addFoto(file);
                }}
                onClose={() => {
                    setCameraOpen(false);
                    setPhotoFor(null);
                }}
            />

            <UploadOverlay
                open={processing}
                progress={uploadProgress}
                label="Menyimpan inspeksi..."
            />
        </>
    );
}
