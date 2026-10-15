import { Head, useForm } from '@inertiajs/react';
import { Minus, Moon, Plus, Sun } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { FormStepper } from '@/components/patterns/form-stepper';
import { ModuleHeader } from '@/components/patterns/module-header';
import { OfflineSaved } from '@/components/patterns/offline-saved';
import { SignaturePad } from '@/components/patterns/signature-pad';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadOverlay } from '@/components/upload-overlay';
import { useDraft } from '@/hooks/use-draft';
import { enqueue, isOffline } from '@/lib/offline-queue';
import { cn } from '@/lib/utils';

type UserInfo = {
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
};

type Props = { user: UserInfo };

// Boolean answers travel as '1'/'0' for Laravel's boolean rule.
type FormData = {
    tanggal: string;
    shift: string;
    hari_ke: string;
    jam_tidur: string;
    kondisi_sakit: string;
    minum_obat: string;
    masalah_pribadi: string;
    pengaruh_alkohol: string;
    siap_bekerja: string;
    catatan: string;
};

type QKey =
    | 'kondisi_sakit'
    | 'minum_obat'
    | 'masalah_pribadi'
    | 'pengaruh_alkohol'
    | 'siap_bekerja';

const QUESTIONS: {
    key: QKey;
    label: string;
    hint?: string;
    dangerOn: '1' | '0';
}[] = [
    {
        key: 'kondisi_sakit',
        label: 'Apakah Anda sedang sakit atau kelelahan?',
        dangerOn: '1',
    },
    {
        key: 'minum_obat',
        label: 'Apakah Anda minum obat dalam 6 jam terakhir?',
        hint: 'Termasuk obat resep, pereda nyeri, antihistamin.',
        dangerOn: '1',
    },
    {
        key: 'masalah_pribadi',
        label: 'Apakah ada masalah pribadi yang sangat mengganggu?',
        dangerOn: '1',
    },
    {
        key: 'pengaruh_alkohol',
        label: 'Apakah Anda masih terpengaruh alkohol?',
        dangerOn: '1',
    },
    {
        key: 'siap_bekerja',
        label: 'Apakah Anda SIAP BEKERJA hari ini?',
        dangerOn: '0',
    },
];

const SHIFTS = [
    { value: 'Siang', label: 'Shift I · Siang', Icon: Sun },
    { value: 'Malam', label: 'Shift II · Malam', Icon: Moon },
];

const SLEEP = [
    { value: '<5', label: '< 5 jam' },
    { value: '5-6', label: '5–6 jam' },
    { value: '>6', label: '> 6 jam' },
];

const STEP_LABELS = ['Jadwal kerja', 'Kondisi tubuh', 'Konfirmasi'];

function FieldLabel({ children, id }: { children: string; id?: string }) {
    return (
        <span id={id} className="text-[13px] font-semibold">
            {children}
        </span>
    );
}

export default function BugarSelamatCreate({ user }: Props) {
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    });
    const [step, setStep] = useState(1);
    const [hasSig, setHasSig] = useState(false);
    const [savedOffline, setSavedOffline] = useState(false);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        tanggal: today,
        shift: '',
        hari_ke: '1',
        jam_tidur: '',
        kondisi_sakit: '',
        minum_obat: '',
        masalah_pribadi: '',
        pengaruh_alkohol: '',
        siap_bekerja: '',
        catatan: '',
    });

    const draft = useDraft(
        'bugar-selamat',
        data,
        (saved) =>
            setData((current) => ({ ...current, ...saved, tanggal: today })),
        (saved) => saved.tanggal === today,
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const step1OK = !!(data.shift && Number(data.hari_ke) >= 1);
    const step2OK =
        !!data.jam_tidur && QUESTIONS.every((q) => data[q.key] !== '');
    const canNext =
        step === 1
            ? step1OK
            : step === 2
              ? step2OK
              : step1OK && step2OK && hasSig;

    const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString(
        'id-ID',
        { weekday: 'long', day: 'numeric', month: 'short' },
    );
    const shiftLabel = SHIFTS.find((s) => s.value === data.shift)?.label ?? '—';
    const sleepLabel =
        SLEEP.find((s) => s.value === data.jam_tidur)?.label ?? '—';
    const flagged = QUESTIONS.filter((q) => data[q.key] === q.dangerOn).length;

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
            void enqueue({
                url: '/bugar-selamat',
                label: 'Bugar Selamat',
                fields: { ...data },
                files: {},
                successMatch: 'hasil=1',
            }).then(() => {
                draft.clear();
                setSavedOffline(true);
            });

            return;
        }

        post('/bugar-selamat', {
            onSuccess: () => draft.clear(),
            // "Already filled today" stays on the last step; schedule errors go back to step 1.
            onError: (errs) => {
                if (!errs.tanggal && (errs.shift || errs.hari_ke)) {
                    setStep(1);
                }
            },
        });
    };

    if (savedOffline) {
        return <OfflineSaved what="Checklist Bugar Selamat" />;
    }

    return (
        <>
            <Head title="Bugar Selamat" />

            <form
                onSubmit={submit}
                className="flex flex-col gap-4 pt-2 lg:mx-auto lg:max-w-[560px]"
            >
                <ModuleHeader
                    backHref="/k3"
                    title="Bugar Selamat"
                    eyebrow={`${dateLabel}${user.site ? ` · Site ${user.site.toUpperCase()}` : ''}`}
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
                            {step < 3 ? 'Lanjut' : 'Kirim'}
                        </Button>
                    }
                >
                    {step === 1 && (
                        <>
                            <div
                                role="radiogroup"
                                aria-labelledby="shift-label"
                                className="flex flex-col gap-2"
                            >
                                <FieldLabel id="shift-label">
                                    Shift kerja
                                </FieldLabel>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {SHIFTS.map(({ value, label, Icon }) => {
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
                                                    'flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                                    on
                                                        ? 'border-2 border-foreground bg-accent-soft'
                                                        : 'border border-border bg-card hover:bg-muted',
                                                )}
                                            >
                                                <Icon
                                                    className="size-5"
                                                    strokeWidth={1.8}
                                                />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.shift} />
                            </div>

                            <div className="flex flex-col gap-2">
                                <FieldLabel id="hari-label">
                                    Hari ke- dalam siklus kerja
                                </FieldLabel>
                                <div
                                    className="flex items-center justify-between rounded-lg border border-border bg-card p-1.5"
                                    aria-labelledby="hari-label"
                                    role="group"
                                >
                                    <button
                                        type="button"
                                        aria-label="Kurangi hari"
                                        disabled={Number(data.hari_ke) <= 1}
                                        onClick={() =>
                                            setData(
                                                'hari_ke',
                                                String(
                                                    Math.max(
                                                        1,
                                                        Number(data.hari_ke) -
                                                            1,
                                                    ),
                                                ),
                                            )
                                        }
                                        className="flex size-[52px] items-center justify-center rounded-md bg-muted transition-colors hover:bg-border disabled:opacity-40"
                                    >
                                        <Minus className="size-5" />
                                    </button>
                                    <output
                                        aria-live="polite"
                                        className="tabular font-sans text-[28px] font-extrabold"
                                    >
                                        {data.hari_ke}
                                    </output>
                                    <button
                                        type="button"
                                        aria-label="Tambah hari"
                                        onClick={() =>
                                            setData(
                                                'hari_ke',
                                                String(
                                                    Number(data.hari_ke) + 1,
                                                ),
                                            )
                                        }
                                        className="flex size-[52px] items-center justify-center rounded-md bg-muted transition-colors hover:bg-border"
                                    >
                                        <Plus className="size-5" />
                                    </button>
                                </div>
                                <InputError message={errors.hari_ke} />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div
                                role="radiogroup"
                                aria-labelledby="tidur-label"
                                className="flex flex-col gap-2"
                            >
                                <FieldLabel id="tidur-label">
                                    Jam tidur semalam
                                </FieldLabel>
                                <div className="grid grid-cols-3 gap-2">
                                    {SLEEP.map(({ value, label }) => {
                                        const on = data.jam_tidur === value;

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                role="radio"
                                                aria-checked={on}
                                                onClick={() =>
                                                    setData('jam_tidur', value)
                                                }
                                                className={cn(
                                                    'h-12 rounded-full text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                                    on
                                                        ? 'border-2 border-primary bg-primary text-primary-foreground'
                                                        : 'border border-border bg-card hover:bg-muted',
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.jam_tidur} />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Jawab dengan jujur — keselamatan Anda adalah
                                prioritas.
                            </p>

                            {QUESTIONS.map(({ key, label, hint, dangerOn }) => {
                                const val = data[key];

                                return (
                                    <div
                                        key={key}
                                        role="radiogroup"
                                        aria-label={label}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-[18px] border px-3.5 py-3 transition-colors',
                                            val === dangerOn
                                                ? 'border-destructive/40 bg-destructive-soft'
                                                : 'border-border bg-card',
                                        )}
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm leading-snug font-semibold">
                                                {label}
                                            </span>
                                            {hint && (
                                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                                    {hint}
                                                </span>
                                            )}
                                        </span>
                                        {(['0', '1'] as const).map((v) => {
                                            const on = val === v;
                                            const bad = v === dangerOn;

                                            return (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={on}
                                                    onClick={() =>
                                                        setData(key, v)
                                                    }
                                                    className={cn(
                                                        'h-11 w-16 shrink-0 rounded-full text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                                        on
                                                            ? bad
                                                                ? 'border-2 border-destructive bg-destructive text-destructive-foreground'
                                                                : 'border-2 border-primary bg-primary text-primary-foreground'
                                                            : 'border border-border bg-card hover:bg-muted',
                                                    )}
                                                >
                                                    {v === '1' ? 'Ya' : 'Tidak'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <dl className="overflow-hidden rounded-lg bg-muted">
                                {[
                                    { label: 'Nama', value: user.name },
                                    { label: 'Shift', value: shiftLabel },
                                    { label: 'Hari ke-', value: data.hari_ke },
                                    { label: 'Jam tidur', value: sleepLabel },
                                    {
                                        label: 'Kondisi tubuh',
                                        value:
                                            flagged === 0
                                                ? 'Tidak ada keluhan'
                                                : `${flagged} perlu perhatian`,
                                    },
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="flex justify-between gap-3 border-b border-border px-4 py-3.5 text-sm last:border-0"
                                    >
                                        <dt className="text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd
                                            className={cn(
                                                'tabular text-right font-bold',
                                                label === 'Kondisi tubuh' &&
                                                    flagged > 0 &&
                                                    'text-destructive',
                                            )}
                                        >
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="catatan"
                                    className="text-[13px] font-semibold"
                                >
                                    Catatan{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (opsional)
                                    </span>
                                </Label>
                                <Textarea
                                    id="catatan"
                                    rows={3}
                                    maxLength={1000}
                                    value={data.catatan}
                                    onChange={(e) =>
                                        setData('catatan', e.target.value)
                                    }
                                    placeholder="Tambahkan catatan jika ada keluhan atau kondisi khusus…"
                                />
                                <InputError message={errors.catatan} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-semibold">
                                    Tanda tangan{' '}
                                    <span className="text-destructive">*</span>
                                </span>
                                <SignaturePad onChange={setHasSig} />
                            </div>

                            {errors.tanggal && (
                                <div
                                    role="alert"
                                    className="rounded-md bg-destructive-soft px-4 py-3 text-sm font-semibold text-destructive"
                                >
                                    {errors.tanggal}
                                </div>
                            )}

                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Dengan mengirim, saya menyatakan data ini benar
                                sesuai kondisi saya saat ini dan bersedia
                                menerima sanksi apabila terbukti tidak jujur.
                            </p>
                        </>
                    )}
                </FormStepper>
            </form>
            <UploadOverlay open={processing} label="Menyimpan checklist..." />
        </>
    );
}
