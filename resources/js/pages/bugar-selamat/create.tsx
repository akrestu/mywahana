import { Head, useForm } from '@inertiajs/react';
import {
    AlertTriangle, BedDouble, Brain, CalendarIcon, Check, CheckCircle2,
    ChevronLeft, ChevronRight, Coffee, FlaskConical,
    Moon, Pen, Pill, ShieldAlert, ShieldCheck, Sun, X, XCircle,
} from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────
type UserInfo = {
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
};

type Props = { user: UserInfo };

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

// Boolean fields sent as '1'/'0' — required by Laravel boolean validation
function computeStatus(data: FormData) {
    if (!data.jam_tidur) return null;
    const danger =
        data.kondisi_sakit    === '1' ||
        data.minum_obat       === '1' ||
        data.masalah_pribadi  === '1' ||
        data.pengaruh_alkohol === '1' ||
        data.siap_bekerja     === '0';
    if (data.jam_tidur === '<5' || danger) return 'dilarang' as const;
    if (data.jam_tidur === '5-6') return 'catatan' as const;
    return 'layak' as const;
}

const STATUS_CFG = {
    layak: {
        label: 'LAYAK BEKERJA',
        desc: 'Anda dalam kondisi prima untuk bekerja hari ini.',
        bg: 'bg-green-50 border-green-300 dark:bg-green-950/30',
        badge: 'bg-green-100 text-green-800 border-green-300',
        Icon: ShieldCheck,
        iconCls: 'text-green-500',
    },
    catatan: {
        label: 'BEKERJA DENGAN CATATAN',
        desc: 'Perhatikan kondisi fisik Anda. Tetap waspada saat bekerja.',
        bg: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        Icon: AlertTriangle,
        iconCls: 'text-yellow-500',
    },
    dilarang: {
        label: 'DILARANG BEKERJA',
        desc: 'Kondisi Anda tidak memenuhi syarat untuk bekerja saat ini.',
        bg: 'bg-red-50 border-red-300 dark:bg-red-950/30',
        badge: 'bg-red-100 text-red-800 border-red-300',
        Icon: XCircle,
        iconCls: 'text-red-500',
    },
} as const;

const STEPS = [
    { label: 'Jadwal Kerja',   icon: '📅' },
    { label: 'Kondisi Tubuh',  icon: '🩺' },
    { label: 'Konfirmasi',     icon: '✅' },
];

type QKey = 'kondisi_sakit' | 'minum_obat' | 'masalah_pribadi' | 'pengaruh_alkohol' | 'siap_bekerja';

const QUESTIONS: Array<{
    key: QKey;
    label: string;
    hint?: string;
    Icon: React.FC<{ className?: string }>;
    dangerOn: '1' | '0';
}> = [
    { key: 'kondisi_sakit',    label: 'Apakah Anda sedang sakit atau kelelahan?',              Icon: Coffee,       dangerOn: '1' },
    { key: 'minum_obat',       label: 'Apakah Anda minum obat dalam 6 jam terakhir?',          Icon: Pill,         dangerOn: '1', hint: 'Termasuk obat resep, pereda nyeri, antihistamin, dll.' },
    { key: 'masalah_pribadi',  label: 'Apakah ada masalah pribadi yang sangat mengganggu?',    Icon: Brain,        dangerOn: '1' },
    { key: 'pengaruh_alkohol', label: 'Apakah Anda masih terpengaruh alkohol?',                Icon: FlaskConical, dangerOn: '1' },
    { key: 'siap_bekerja',     label: 'Apakah Anda SIAP BEKERJA hari ini?',                    Icon: ShieldCheck,  dangerOn: '0' },
];

// ── Signature pad ──────────────────────────────────────────────────
function SignaturePad({ onChange }: { onChange: (filled: boolean) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const pos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
        const r = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) * (canvas.width / r.width),
            y: (e.clientY - r.top) * (canvas.height / r.height),
        };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const down = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            drawing.current = true;
            const p = pos('touches' in e ? e.touches[0] : e, canvas);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
        };
        const move = (e: MouseEvent | TouchEvent) => {
            if (!drawing.current) return;
            e.preventDefault();
            const p = pos('touches' in e ? e.touches[0] : e, canvas);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            if (isEmpty) { setIsEmpty(false); onChange(true); }
        };
        const up = () => { drawing.current = false; };

        canvas.addEventListener('mousedown', down);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', up);
        canvas.addEventListener('touchstart', down, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', up);
        return () => {
            canvas.removeEventListener('mousedown', down);
            canvas.removeEventListener('mousemove', move);
            canvas.removeEventListener('mouseup', up);
            canvas.removeEventListener('touchstart', down);
            canvas.removeEventListener('touchmove', move);
            canvas.removeEventListener('touchend', up);
        };
    }, [isEmpty, onChange]);

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onChange(false);
    };

    return (
        <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-input bg-white dark:bg-muted/20">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={260}
                    className="w-full touch-none block"
                    style={{ cursor: 'crosshair' }}
                />
                {isEmpty && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Pen size={28} className="opacity-20" />
                        <p className="text-sm opacity-50 font-medium">Tanda tangan di sini</p>
                    </div>
                )}
            </div>
            {!isEmpty && (
                <button
                    type="button"
                    onClick={clear}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors py-1"
                >
                    <X size={14} /> Hapus &amp; Ulangi Tanda Tangan
                </button>
            )}
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────
export default function BugarSelamatCreate({ user }: Props) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const [step, setStep] = useState(0);
    useEffect(() => { window.scrollTo(0, 0); }, [step]);
    const [hasSig, setHasSig] = useState(false);

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

    const status = computeStatus(data);
    const step1OK = !!(data.tanggal && data.shift && data.hari_ke);
    const step2OK = !!(data.jam_tidur) && QUESTIONS.every((q) => data[q.key] !== '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!step1OK || !step2OK || !hasSig) return;
        post('/bugar-selamat');
    };

    // ── Step indicator ────────────────────────────────────────────
    const StepBar = () => (
        <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
                <Fragment key={s.label}>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className={cn(
                            'flex size-11 items-center justify-center rounded-full text-lg font-bold transition-all border-2',
                            i < step  && 'bg-primary border-primary text-primary-foreground',
                            i === step && 'border-primary bg-primary/10 text-primary',
                            i > step  && 'border-muted-foreground/30 bg-muted text-muted-foreground',
                        )}>
                            {i < step ? <Check size={18} /> : <span>{s.icon}</span>}
                        </div>
                        <span className={cn(
                            'text-[11px] font-semibold text-center leading-tight max-w-[56px]',
                            i === step ? 'text-primary' : 'text-muted-foreground',
                        )}>
                            {s.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={cn(
                            'flex-1 h-0.5 mb-5 mx-1 transition-all',
                            i < step ? 'bg-primary' : 'bg-muted',
                        )} />
                    )}
                </Fragment>
            ))}
        </div>
    );

    // ── Nav buttons ────────────────────────────────────────────────
    const NavButtons = () => (
        <div className={cn('flex gap-3 pt-4', step === 0 ? 'justify-end' : 'justify-between')}>
            {step > 0 && (
                <Button
                    type="button" variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                    className="h-14 px-6 text-base gap-2"
                >
                    <ChevronLeft size={18} /> Kembali
                </Button>
            )}
            {step < STEPS.length - 1 ? (
                <Button
                    type="button"
                    disabled={step === 0 ? !step1OK : !step2OK}
                    onClick={() => setStep((s) => s + 1)}
                    className="flex-1 h-14 text-base gap-2 font-bold"
                >
                    Lanjut <ChevronRight size={18} />
                </Button>
            ) : (
                <Button
                    type="submit"
                    disabled={processing || !step1OK || !step2OK || !hasSig}
                    className="flex-1 h-14 text-base gap-2 font-bold"
                >
                    {processing
                        ? 'Menyimpan...'
                        : <><CheckCircle2 size={18} /> Kirim Checklist</>}
                </Button>
            )}
        </div>
    );

    return (
        <>
            <Head title="Checklist Bugar Selamat" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h2 className="text-xl font-bold">Checklist Bugar Selamat</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">WBK-HSE-FO-021 · Formulir Kesehatan Harian</p>
                </div>

                <StepBar />
                <Separator />

                {/* ════════════════════════════════════════════════
                    STEP 1 — Jadwal Kerja
                ════════════════════════════════════════════════ */}
                {step === 0 && (
                    <div className="flex flex-col gap-6">

                        {/* User identity */}
                        <Card className="bg-primary/5 border-primary/20 shadow-none">
                            <CardContent className="flex items-center gap-4 py-4">
                                <Avatar className="size-14 shrink-0">
                                    <AvatarFallback className="bg-primary/20 text-xl font-bold text-primary">
                                        {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-base font-bold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {[user.nik, user.jabatan, user.site
                                            ? user.site.charAt(0).toUpperCase() + user.site.slice(1)
                                            : null].filter(Boolean).join(' · ') || '—'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tanggal — dikunci ke hari ini, tidak bisa diubah */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-bold">📅 Tanggal Kerja</Label>
                            <div className="flex h-14 w-full items-center gap-3 rounded-xl border-2 border-input bg-muted/40 px-4 text-base">
                                <CalendarIcon size={18} className="shrink-0 text-muted-foreground" />
                                <span className="font-semibold">
                                    {new Date(data.tanggal).toLocaleDateString('id-ID', {
                                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                    })}
                                </span>
                                <span className="ml-auto text-xs text-muted-foreground">Hari ini</span>
                            </div>
                            <input type="hidden" name="tanggal" value={data.tanggal} />
                            {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
                        </div>

                        {/* Shift */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-bold">🔄 Pilih Shift Kerja</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'Siang', label: 'Shift I',  Icon: Sun,  iconCls: 'text-amber-500' },
                                    { value: 'Malam', label: 'Shift II', Icon: Moon, iconCls: 'text-indigo-500' },
                                ].map(({ value, label, sub, Icon, iconCls }) => {
                                    const selected = data.shift === value;
                                    return (
                                        <button
                                            key={value} type="button"
                                            onClick={() => setData('shift', value)}
                                            className={cn(
                                                'flex flex-col items-center gap-3 rounded-2xl border-2 py-6 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                selected
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-border hover:border-primary/30 hover:bg-muted/50',
                                            )}
                                        >
                                            <Icon size={36} className={iconCls} />
                                            <p className={cn('text-base font-bold', selected && 'text-primary')}>{label}</p>
                                            {selected && (
                                                <div className="flex size-6 items-center justify-center rounded-full bg-primary">
                                                    <Check size={13} className="text-primary-foreground" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.shift && <p className="text-sm text-destructive">{errors.shift}</p>}
                        </div>

                        {/* Hari ke */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-bold">🔢 Hari ke berapa dalam siklus kerja?</Label>
                            <p className="text-sm text-muted-foreground -mt-1">Pilih nomor hari kerja Anda saat ini</p>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => {
                                    const sel = data.hari_ke === String(n);
                                    return (
                                        <button
                                            key={n} type="button"
                                            onClick={() => setData('hari_ke', String(n))}
                                            className={cn(
                                                'aspect-square rounded-xl border-2 text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                sel
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                                    : 'border-border hover:border-primary/40 hover:bg-muted/50',
                                            )}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.hari_ke && <p className="text-sm text-destructive">{errors.hari_ke}</p>}
                        </div>

                        <NavButtons />
                    </div>
                )}

                {/* ════════════════════════════════════════════════
                    STEP 2 — Kondisi Fisik
                ════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                            <AlertTriangle size={18} className="text-amber-500" />
                            <AlertDescription className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                Jawab dengan jujur — keselamatan Anda adalah prioritas utama kami.
                            </AlertDescription>
                        </Alert>

                        {/* Sleep duration */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <BedDouble size={20} className="text-muted-foreground" />
                                </div>
                                <p className="text-base font-bold leading-snug">Berapa jam Anda tidur tadi malam?</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: '<5',  label: '< 5 jam', sub: 'Kurang',  selCls: 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 shadow-sm' },
                                    { value: '5-6', label: '5–6 jam', sub: 'Cukup',   selCls: 'border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 shadow-sm' },
                                    { value: '>6',  label: '> 6 jam', sub: 'Optimal', selCls: 'border-green-400 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 shadow-sm' },
                                ].map(({ value, label, sub, selCls }) => {
                                    const sel = data.jam_tidur === value;
                                    return (
                                        <button
                                            key={value} type="button"
                                            onClick={() => setData('jam_tidur', value)}
                                            className={cn(
                                                'flex flex-col items-center gap-1.5 rounded-2xl border-2 py-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                sel ? selCls : 'border-border hover:border-primary/30 hover:bg-muted/40',
                                            )}
                                        >
                                            <span className="text-base font-bold">{label}</span>
                                            <span className="text-sm opacity-75">{sub}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator />

                        {/* Yes/No questions */}
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pertanyaan Kondisi</p>
                        {QUESTIONS.map(({ key, label, hint, Icon, dangerOn }) => {
                            const val = data[key];
                            return (
                                <div key={key} className={cn(
                                    'rounded-2xl border-2 p-4 transition-all',
                                    val !== ''
                                        ? (val === dangerOn ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' : 'border-green-200 bg-green-50/50 dark:bg-green-950/10')
                                        : 'border-border bg-card',
                                )}>
                                    <div className="mb-4 flex items-start gap-3">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
                                            <Icon className="size-5 text-muted-foreground" />
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-base font-semibold leading-snug">{label}</p>
                                            {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['1', '0'] as const).map((v) => {
                                            const isDanger = dangerOn === v;
                                            const sel = val === v;
                                            return (
                                                <button
                                                    key={v} type="button"
                                                    onClick={() => setData(key, v)}
                                                    className={cn(
                                                        'flex h-14 items-center justify-center gap-2.5 rounded-xl border-2 text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                        sel && isDanger  && 'border-red-400 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                                                        sel && !isDanger && 'border-green-400 bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
                                                        !sel && 'border-border bg-background hover:border-primary/30 hover:bg-muted/40',
                                                    )}
                                                >
                                                    {sel
                                                        ? (isDanger ? <X size={18} /> : <Check size={18} />)
                                                        : <span className="size-5 rounded-full border-2 border-muted-foreground/30" />
                                                    }
                                                    {v === '1' ? 'Ya' : 'Tidak'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        <NavButtons />
                    </div>
                )}

                {/* ════════════════════════════════════════════════
                    STEP 3 — Konfirmasi & Tanda Tangan
                ════════════════════════════════════════════════ */}
                {step === 2 && (
                    <div className="flex flex-col gap-6">

                        {/* Status result */}
                        {status && (() => {
                            const cfg = STATUS_CFG[status];
                            const SIcon = cfg.Icon;
                            return (
                                <div className={cn('flex flex-col items-center gap-4 rounded-2xl border-2 py-8 text-center', cfg.bg)}>
                                    <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-background">
                                        <SIcon size={32} className={cfg.iconCls} />
                                    </div>
                                    <div className="space-y-2">
                                        <Badge variant="outline" className={cn('px-4 py-1.5 text-sm font-bold', cfg.badge)}>
                                            {cfg.label}
                                        </Badge>
                                        <p className="text-sm text-muted-foreground px-4">{cfg.desc}</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Summary table */}
                        <Card>
                            <CardContent className="py-0">
                                <dl>
                                    {[
                                        { label: 'Nama',      value: user.name },
                                        { label: 'NIK',       value: user.nik ?? '—' },
                                        { label: 'Jabatan',   value: user.jabatan ?? '—' },
                                        { label: 'Site',      value: user.site ? user.site.charAt(0).toUpperCase() + user.site.slice(1) : '—' },
                                        { label: 'Tanggal',   value: new Date(data.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                        { label: 'Shift',     value: data.shift === 'Siang' ? 'Shift I – Siang' : 'Shift II – Malam' },
                                        { label: 'Hari ke-',  value: data.hari_ke },
                                        { label: 'Jam tidur', value: data.jam_tidur === '<5' ? '< 5 jam' : data.jam_tidur === '5-6' ? '5–6 jam' : '> 6 jam' },
                                    ].map(({ label, value }, idx, arr) => (
                                        <Fragment key={label}>
                                            <div className="flex items-center justify-between py-3.5 text-sm">
                                                <dt className="text-muted-foreground">{label}</dt>
                                                <dd className="font-semibold text-right">{value}</dd>
                                            </div>
                                            {idx < arr.length - 1 && <Separator />}
                                        </Fragment>
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Catatan opsional */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="catatan" className="text-base font-bold">
                                Catatan Tambahan
                                <span className="ml-2 text-sm font-normal text-muted-foreground">(opsional)</span>
                            </Label>
                            <Textarea
                                id="catatan"
                                value={data.catatan}
                                onChange={(e) => setData('catatan', e.target.value)}
                                placeholder="Tambahkan catatan jika ada keluhan atau kondisi khusus..."
                                className="text-base min-h-[96px]"
                                rows={3}
                            />
                        </div>

                        {/* Tanda tangan */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-bold">
                                ✍️ Tanda Tangan <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Tanda tangani dengan jari Anda sebagai pernyataan kejujuran.
                            </p>
                            <SignaturePad onChange={setHasSig} />
                            {!hasSig && (
                                <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 dark:bg-amber-950/20">
                                    <ShieldAlert size={16} className="text-amber-500 shrink-0" />
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Tanda tangan diperlukan sebelum mengirim.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pernyataan */}
                        <div className="rounded-2xl border bg-muted/40 px-4 py-4">
                            <p className="text-sm italic leading-relaxed text-muted-foreground">
                                Dengan menandatangani dan menekan{' '}
                                <strong className="text-foreground not-italic">Kirim Checklist</strong>,
                                saya menyatakan mengisi formulir ini dengan sebenar-benarnya dan bersedia menerima sanksi apabila terbukti tidak jujur.
                            </p>
                        </div>

                        <NavButtons />
                    </div>
                )}
            </form>
        </>
    );
}
