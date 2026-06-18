import { Head, useForm } from '@inertiajs/react';
import { Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, ChevronsUpDown, Images, MapPin, X } from 'lucide-react';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { TimePickerInput } from '@/components/ui/time-picker-input';
import { Fragment, useEffect, useRef, useState } from 'react';
import { CameraCapture } from '@/components/camera-capture';
import { UploadOverlay } from '@/components/upload-overlay';
import { RiskBadge } from '@/components/risk-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { compressImageWithToast } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

type UserInfo = {
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
};

type Props = { user: UserInfo };

function computeRisk(p: number, f: number, s: number) {
    const nilai = p * f * s;
    const level = nilai >= 125 ? 'AA' : nilai >= 25 ? 'A' : nilai >= 10 ? 'B' : 'C';
    return { nilai, level: level as 'AA' | 'A' | 'B' | 'C' };
}

const PROBABILITAS = [
    { value: '1', label: 'Hampir tidak mungkin',    sub: 'Belum pernah terjadi' },
    { value: '2', label: 'Kecil kemungkinannya',    sub: 'Jarang sekali terjadi' },
    { value: '3', label: 'Kadang-kadang terjadi',   sub: 'Pernah terjadi beberapa kali' },
    { value: '4', label: 'Sering terjadi',          sub: 'Terjadi cukup rutin' },
    { value: '5', label: 'Hampir pasti terjadi',    sub: 'Terjadi hampir setiap saat' },
];

const FREKUENSI = [
    { value: '1', label: 'Setahun sekali',          sub: 'Sangat jarang terpapar' },
    { value: '2', label: 'Sebulan sekali',          sub: 'Sesekali terpapar' },
    { value: '3', label: 'Seminggu sekali',         sub: 'Cukup sering terpapar' },
    { value: '4', label: 'Setiap hari',             sub: 'Terpapar setiap hari kerja' },
    { value: '5', label: 'Berkali-kali sehari',     sub: 'Hampir selalu terpapar' },
];

const SEVERITY = [
    { value: '1',  label: 'Sangat Ringan',          sub: 'Luka kecil, bisa diobati sendiri',            color: 'green' },
    { value: '2',  label: 'Ringan',                 sub: 'Perlu ke klinik / dokter',                    color: 'lime' },
    { value: '3',  label: 'Sedang',                 sub: 'Tidak bisa bekerja sementara',                color: 'yellow' },
    { value: '25', label: 'Berat',                  sub: 'Cacat permanen / tidak bisa kerja lama',      color: 'orange' },
    { value: '30', label: 'Sangat Berat / Meninggal', sub: 'Mengancam jiwa atau kematian',              color: 'red' },
];

const RISK_COLORS = {
    AA: { bg: 'bg-red-50 border-red-300 dark:bg-red-950/30',       text: 'text-red-700',    desc: 'Sangat Berbahaya — Hentikan pekerjaan segera!' },
    A:  { bg: 'bg-orange-50 border-orange-300 dark:bg-orange-950/30', text: 'text-orange-700', desc: 'Berbahaya — Perlu tindakan segera' },
    B:  { bg: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30', text: 'text-yellow-700', desc: 'Sedang — Perlu dipantau & ditangani' },
    C:  { bg: 'bg-green-50 border-green-300 dark:bg-green-950/30',  text: 'text-green-700',  desc: 'Rendah — Aman terkendali' },
} as const;

const LOKASI_OPTIONS = [
    'Tambang / Pit',
    'Jalan Hauling OB',
    'Jalan Hauling COAL',
    'Disposal',
    'Sump',
    'Area Parkir',
    'Pit Stop / Area Refueling',
    'Workshop',
    'Warehouse',
    'Laydown B3',
    'TPS Limbah B3',
    'Office',
    'Stock Room',
    'Crusher Stock Pile',
    'Mess',
    'Katering',
    'Jalan Warga / Raya',
    'Area Vendor',
    'Water Fill',
    'Washing Pad',
    'Area Pembagian Nasi',
    'Unit/Peralatan',
    'Sarana',
    'Area Diversi Sungai Kungkilan',
    'Area Akses Senapo',
    'Container Produksi',
    'Container HSE &/ GA',
];

const STEPS = [
    { label: 'Lokasi & Foto',   icon: '📷' },
    { label: 'Tingkat Bahaya',  icon: '⚠️' },
    { label: 'Tindakan',        icon: '🔧' },
];

export default function LaporanBahayaCreate({ user }: Props) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const galleryRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [photoSheet, setPhotoSheet] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    useEffect(() => { window.scrollTo(0, 0); }, [currentStep]);
    const [lokasiOpen, setLokasiOpen] = useState(false);

    function openPhotoSource(source: 'camera' | 'gallery') {
        setPhotoSheet(false);
        if (source === 'camera') setShowCamera(true);
        else galleryRef.current?.click();
    }

    const { data, setData, post, processing, errors } = useForm({
        tanggal: today,
        waktu_pengamatan: '',
        kategori: '',
        lokasi: '',
        deskripsi_bahaya: '',
        tindakan_perbaikan: '',
        probabilitas: '',
        frekuensi: '',
        severity: '',
        status_tindakan: 'pending',
        foto: null as File | null,
    });

    const p = parseInt(data.probabilitas) || 0;
    const f = parseInt(data.frekuensi) || 0;
    const s = parseInt(data.severity) || 0;
    const risk = (p && f && s) ? computeRisk(p, f, s) : null;

    const step1Valid = !!(data.tanggal && data.waktu_pengamatan && data.kategori && data.lokasi && data.deskripsi_bahaya);
    const step2Valid = !!(data.probabilitas && data.frekuensi && data.severity);
    const step3Valid = !!data.tindakan_perbaikan;

    const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const compressed = await compressImageWithToast(file);
            setData('foto', compressed);
            setPreview(URL.createObjectURL(compressed));
        }
    };

    const removeFoto = () => {
        setData('foto', null);
        setPreview(null);
        if (galleryRef.current) galleryRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUploadProgress(0);
        post('/laporan-bahaya', {
            forceFormData: true,
            onProgress: (e) => setUploadProgress(e.percentage ?? null),
            onFinish: () => setUploadProgress(null),
        });
    };

    // ── Step bar ──
    const StepBar = () => (
        <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
                <Fragment key={s.label}>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className={cn(
                            'flex size-11 items-center justify-center rounded-full text-lg font-bold transition-all border-2',
                            i < currentStep  && 'bg-primary border-primary text-primary-foreground',
                            i === currentStep && 'border-primary bg-primary/10 text-primary',
                            i > currentStep  && 'border-muted-foreground/30 bg-muted text-muted-foreground',
                        )}>
                            {i < currentStep ? <Check size={18} /> : <span>{s.icon}</span>}
                        </div>
                        <span className={cn(
                            'text-[11px] font-semibold text-center leading-tight max-w-[60px]',
                            i === currentStep ? 'text-primary' : 'text-muted-foreground',
                        )}>
                            {s.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={cn(
                            'flex-1 h-0.5 mb-5 mx-1 transition-all',
                            i < currentStep ? 'bg-primary' : 'bg-muted',
                        )} />
                    )}
                </Fragment>
            ))}
        </div>
    );

    // ── Nav buttons ──
    const NavButtons = ({ canNext }: { canNext: boolean }) => (
        <div className={cn('flex gap-3 pt-4', currentStep === 0 ? 'justify-end' : 'justify-between')}>
            {currentStep > 0 && (
                <Button
                    type="button" variant="outline"
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="h-14 px-6 text-base gap-2"
                >
                    <ChevronLeft size={18} /> Kembali
                </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
                <Button
                    type="button"
                    disabled={!canNext}
                    onClick={() => setCurrentStep((s) => s + 1)}
                    className="flex-1 h-14 text-base gap-2 font-bold"
                >
                    Lanjut <ChevronRight size={18} />
                </Button>
            ) : (
                <Button
                    type="submit"
                    disabled={processing || !step1Valid || !step2Valid || !step3Valid}
                    className="flex-1 h-14 text-base gap-2 font-bold"
                >
                    {processing ? 'Menyimpan...' : <><CheckCircle2 size={18} /> Kirim Laporan</>}
                </Button>
            )}
        </div>
    );

    return (
        <>
            <Head title="Laporan Bahaya" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h2 className="text-xl font-bold">Laporan Bahaya</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">WBK-HSE-FO-010 — Hazard Report</p>
                </div>

                <StepBar />
                <Separator />

                {/* ══════════════════════════════════════
                    STEP 1 — Lokasi & Foto
                ══════════════════════════════════════ */}
                {currentStep === 0 && (
                    <div className="flex flex-col gap-6">

                        {/* Reporter */}
                        <div className="flex items-center gap-4 rounded-2xl bg-orange-50 border border-orange-200 dark:bg-orange-950/20 p-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xl font-bold text-orange-700 dark:bg-orange-900/50">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-base font-bold">{user.name}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {[user.nik, user.jabatan, user.site
                                        ? user.site.charAt(0).toUpperCase() + user.site.slice(1)
                                        : null].filter(Boolean).join(' · ') || '—'}
                                </p>
                            </div>
                        </div>

                        {/* Tanggal */}
                        <div className="flex flex-col gap-2">
                            <label className="text-base font-bold">📅 Tanggal Kejadian</label>
                            <DatePickerInput
                                value={data.tanggal}
                                onChange={(val) => setData('tanggal', val)}
                                max={today}
                                error={!!errors.tanggal}
                            />
                            {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
                        </div>

                        {/* Waktu Pengamatan */}
                        <div className="flex flex-col gap-2">
                            <label className="text-base font-bold">🕐 Waktu Pengamatan</label>
                            <p className="text-sm text-muted-foreground -mt-1">Jam berapa Anda melihat bahaya ini?</p>
                            <TimePickerInput
                                value={data.waktu_pengamatan}
                                onChange={(val) => setData('waktu_pengamatan', val)}
                                error={!!errors.waktu_pengamatan}
                            />
                            {errors.waktu_pengamatan && <p className="text-sm text-destructive">{errors.waktu_pengamatan}</p>}
                        </div>

                        {/* Kategori */}
                        <div className="flex flex-col gap-3">
                            <label className="text-base font-bold">🏷️ Kategori Bahaya</label>
                            <p className="text-sm text-muted-foreground -mt-1">Pilih jenis bahaya yang Anda temukan.</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    {
                                        value: 'KTA',
                                        emoji: '⚠️',
                                        label: 'KTA',
                                        fullLabel: 'Kondisi Tidak Aman',
                                        sub: 'Bahaya dari kondisi fisik / lingkungan kerja',
                                        selCls: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30',
                                    },
                                    {
                                        value: 'TTA',
                                        emoji: '🚷',
                                        label: 'TTA',
                                        fullLabel: 'Tindakan Tidak Aman',
                                        sub: 'Bahaya dari perilaku / tindakan seseorang',
                                        selCls: 'border-red-400 bg-red-50 dark:bg-red-950/30',
                                    },
                                ].map(({ value, emoji, label, fullLabel, sub, selCls }) => {
                                    const sel = data.kategori === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setData('kategori', value)}
                                            className={cn(
                                                'flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-all',
                                                sel ? selCls : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
                                            )}
                                        >
                                            <span className="text-3xl">{emoji}</span>
                                            <div>
                                                <p className="text-base font-black">{label}</p>
                                                <p className="text-xs font-semibold text-muted-foreground">{fullLabel}</p>
                                                <p className="text-xs text-muted-foreground mt-1 leading-tight">{sub}</p>
                                            </div>
                                            {sel && (
                                                <div className="flex size-6 items-center justify-center rounded-full bg-primary">
                                                    <Check size={13} className="text-primary-foreground" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.kategori && <p className="text-sm text-destructive">{errors.kategori}</p>}
                        </div>

                        {/* Lokasi */}
                        <div className="flex flex-col gap-2">
                            <label className="text-base font-bold">📍 Lokasi Bahaya</label>
                            <p className="text-sm text-muted-foreground -mt-1">Di mana Anda melihat bahaya ini?</p>
                            <Popover open={lokasiOpen} onOpenChange={setLokasiOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        role="combobox"
                                        aria-expanded={lokasiOpen}
                                        className={cn(
                                            'flex h-14 w-full items-center justify-between rounded-xl border-2 px-4 text-base transition-all',
                                            'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:outline-none',
                                            data.lokasi
                                                ? 'border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-200'
                                                : 'border-input bg-background text-muted-foreground',
                                        )}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <MapPin size={16} className={data.lokasi ? 'text-orange-500 shrink-0' : 'text-muted-foreground shrink-0'} />
                                            {data.lokasi || 'Pilih lokasi...'}
                                        </span>
                                        <ChevronsUpDown size={16} className="shrink-0 opacity-50" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari lokasi..." className="h-11 text-base" />
                                        <CommandList>
                                            <CommandEmpty>Lokasi tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {LOKASI_OPTIONS.map((lokasi) => (
                                                    <CommandItem
                                                        key={lokasi}
                                                        value={lokasi}
                                                        onSelect={(val) => {
                                                            setData('lokasi', val === data.lokasi ? '' : val);
                                                            setLokasiOpen(false);
                                                        }}
                                                        className="text-sm py-3"
                                                    >
                                                        {lokasi}
                                                        <Check
                                                            size={15}
                                                            className={cn('ml-auto', data.lokasi === lokasi ? 'opacity-100 text-orange-600' : 'opacity-0')}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {errors.lokasi && <p className="text-sm text-destructive">{errors.lokasi}</p>}
                        </div>

                        {/* Deskripsi */}
                        <div className="flex flex-col gap-2">
                            <label className="text-base font-bold">⚠️ Ceritakan Bahayanya</label>
                            <p className="text-sm text-muted-foreground -mt-1">Apa yang Anda lihat? Jelaskan kondisi bahayanya.</p>
                            <textarea
                                value={data.deskripsi_bahaya}
                                onChange={(e) => setData('deskripsi_bahaya', e.target.value)}
                                placeholder="Contoh: Ada kabel listrik terkelupas di dekat pintu masuk, bisa menyetrum orang yang lewat..."
                                rows={4}
                                className={cn(
                                    'border-input bg-background text-foreground w-full rounded-xl border-2 px-4 py-3 text-base shadow-xs',
                                    'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:outline-none placeholder:text-muted-foreground resize-none',
                                )}
                            />
                            {errors.deskripsi_bahaya && <p className="text-sm text-destructive">{errors.deskripsi_bahaya}</p>}
                        </div>

                        {/* Foto */}
                        <div className="flex flex-col gap-2">
                            <label className="text-base font-bold">📸 Foto Bahaya <span className="text-sm font-normal text-muted-foreground">(opsional)</span></label>
                            <p className="text-sm text-muted-foreground -mt-1">Foto membantu verifikasi laporan Anda.</p>
                            {preview ? (
                                <div className="relative">
                                    <img src={preview} alt="Preview" className="w-full rounded-2xl object-cover max-h-64" />
                                    <button
                                        type="button"
                                        onClick={removeFoto}
                                        className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                    <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm font-medium">
                                        ✓ Foto terpilih
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setPhotoSheet(true)}
                                    className="flex h-44 w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 transition-all hover:border-orange-400/60 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                                >
                                    <div className="flex size-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/40">
                                        <Camera size={28} className="text-orange-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-base font-semibold">Ambil / Pilih Foto</p>
                                        <p className="text-sm text-muted-foreground">Ketuk untuk membuka kamera atau galeri</p>
                                    </div>
                                </button>
                            )}
                            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
                            {errors.foto && <p className="text-sm text-destructive">{errors.foto}</p>}
                        </div>

                        <NavButtons canNext={step1Valid} />
                    </div>
                )}

                {/* ══════════════════════════════════════
                    STEP 2 — Tingkat Bahaya (P×F×S)
                ══════════════════════════════════════ */}
                {currentStep === 1 && (
                    <div className="flex flex-col gap-6">

                        <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 px-4 py-3">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                ℹ️ Jawab 3 pertanyaan berikut untuk menentukan seberapa berbahaya kondisi yang Anda laporkan.
                            </p>
                        </div>

                        {/* Probabilitas */}
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="text-base font-bold">1. Seberapa mungkin bahaya ini terjadi?</p>
                                <p className="text-sm text-muted-foreground mt-0.5">Pilih yang paling mendekati kondisi sebenarnya.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {PROBABILITAS.map(({ value, label, sub }) => {
                                    const sel = data.probabilitas === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setData('probabilitas', value)}
                                            className={cn(
                                                'flex items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-all',
                                                sel
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
                                            )}
                                        >
                                            <div className={cn(
                                                'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-black transition-all',
                                                sel ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground',
                                            )}>
                                                {value}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn('text-base font-semibold', sel && 'text-primary')}>{label}</p>
                                                <p className="text-sm text-muted-foreground">{sub}</p>
                                            </div>
                                            {sel && <Check size={18} className="ml-auto shrink-0 text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.probabilitas && <p className="text-sm text-destructive">{errors.probabilitas}</p>}
                        </div>

                        <Separator />

                        {/* Frekuensi */}
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="text-base font-bold">2. Seberapa sering orang berada di dekat bahaya ini?</p>
                                <p className="text-sm text-muted-foreground mt-0.5">Pilih seberapa sering orang terpapar kondisi ini.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {FREKUENSI.map(({ value, label, sub }) => {
                                    const sel = data.frekuensi === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setData('frekuensi', value)}
                                            className={cn(
                                                'flex items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-all',
                                                sel
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
                                            )}
                                        >
                                            <div className={cn(
                                                'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-black transition-all',
                                                sel ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground',
                                            )}>
                                                {value}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn('text-base font-semibold', sel && 'text-primary')}>{label}</p>
                                                <p className="text-sm text-muted-foreground">{sub}</p>
                                            </div>
                                            {sel && <Check size={18} className="ml-auto shrink-0 text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.frekuensi && <p className="text-sm text-destructive">{errors.frekuensi}</p>}
                        </div>

                        <Separator />

                        {/* Severity */}
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="text-base font-bold">3. Seberapa parah akibatnya jika terjadi?</p>
                                <p className="text-sm text-muted-foreground mt-0.5">Pilih dampak terburuk yang mungkin terjadi.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {SEVERITY.map(({ value, label, sub, color }) => {
                                    const sel = data.severity === value;
                                    const colorCls = {
                                        green:  { sel: 'border-green-400 bg-green-50 dark:bg-green-950/30',   num: 'border-green-400 bg-green-100 text-green-700',   check: 'text-green-600' },
                                        lime:   { sel: 'border-lime-400 bg-lime-50 dark:bg-lime-950/30',      num: 'border-lime-400 bg-lime-100 text-lime-700',      check: 'text-lime-600' },
                                        yellow: { sel: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30', num: 'border-yellow-400 bg-yellow-100 text-yellow-700', check: 'text-yellow-600' },
                                        orange: { sel: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30', num: 'border-orange-400 bg-orange-100 text-orange-700', check: 'text-orange-600' },
                                        red:    { sel: 'border-red-400 bg-red-50 dark:bg-red-950/30',         num: 'border-red-400 bg-red-100 text-red-700',         check: 'text-red-600' },
                                    }[color]!;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setData('severity', value)}
                                            className={cn(
                                                'flex items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-all',
                                                sel ? colorCls.sel : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
                                            )}
                                        >
                                            <div className={cn(
                                                'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition-all',
                                                sel ? colorCls.num : 'border-muted-foreground/30 text-muted-foreground',
                                            )}>
                                                S{value}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-base font-semibold">{label}</p>
                                                <p className="text-sm text-muted-foreground">{sub}</p>
                                            </div>
                                            {sel && <Check size={18} className={cn('ml-auto shrink-0', colorCls.check)} />}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.severity && <p className="text-sm text-destructive">{errors.severity}</p>}
                        </div>

                        {/* Risk result */}
                        {risk && (() => {
                            const rc = RISK_COLORS[risk.level];
                            return (
                                <div className={cn('flex flex-col items-center gap-3 rounded-2xl border-2 py-7 text-center', rc.bg)}>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Hasil Penilaian Risiko</p>
                                    <p className={cn('text-6xl font-black tabular-nums', rc.text)}>{risk.nilai}</p>
                                    <RiskBadge level={risk.level} />
                                    <p className="text-sm text-muted-foreground px-4">{rc.desc}</p>
                                </div>
                            );
                        })()}

                        <NavButtons canNext={step2Valid} />
                    </div>
                )}

                {/* ══════════════════════════════════════
                    STEP 3 — Tindakan
                ══════════════════════════════════════ */}
                {currentStep === 2 && (
                    <div className="flex flex-col gap-6">

                        {/* Summary */}
                        <Card>
                            <CardContent className="py-0">
                                <p className="py-3 text-sm font-bold text-muted-foreground uppercase tracking-wide">Ringkasan Laporan</p>
                                <Separator />
                                {[
                                    { label: 'Tanggal', value: new Date(data.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                    { label: 'Waktu', value: data.waktu_pengamatan || '—' },
                                    { label: 'Kategori', value: data.kategori === 'KTA' ? '⚠️ KTA — Kondisi Tidak Aman' : data.kategori === 'TTA' ? '🚷 TTA — Tindakan Tidak Aman' : '—' },
                                    { label: 'Lokasi', value: data.lokasi },
                                    ...(risk ? [{ label: 'Nilai Risiko', value: `${risk.nilai} (${risk.level})` }] : []),
                                ].map(({ label, value }, idx, arr) => (
                                    <div key={label}>
                                        <div className="flex items-center justify-between py-3.5 text-sm">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-semibold text-right max-w-[60%] truncate">{value}</span>
                                        </div>
                                        {idx < arr.length - 1 && <Separator />}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Tindakan perbaikan */}
                        <div className="flex flex-col gap-2">
                            <label className="text-base font-bold">🔧 Tindakan yang Sudah atau Akan Dilakukan</label>
                            <p className="text-sm text-muted-foreground -mt-1">Apa yang sudah Anda lakukan, atau apa yang perlu dilakukan untuk mengatasi bahaya ini?</p>
                            <textarea
                                value={data.tindakan_perbaikan}
                                onChange={(e) => setData('tindakan_perbaikan', e.target.value)}
                                placeholder="Contoh: Sudah memasang tanda peringatan. Perlu diperbaiki oleh teknisi dalam 2 hari..."
                                rows={4}
                                className={cn(
                                    'border-input bg-background text-foreground w-full rounded-xl border-2 px-4 py-3 text-base shadow-xs',
                                    'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:outline-none placeholder:text-muted-foreground resize-none',
                                )}
                            />
                            {errors.tindakan_perbaikan && <p className="text-sm text-destructive">{errors.tindakan_perbaikan}</p>}
                        </div>

                        {/* Status tindakan */}
                        <div className="flex flex-col gap-3">
                            <label className="text-base font-bold">📋 Status Penanganan</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'pending',  emoji: '⏳', label: 'Pending',  sub: 'Belum ditangani',        selCls: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' },
                                    { value: 'continue', emoji: '🔵', label: 'Continue', sub: 'Dilanjutkan penanganan',  selCls: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' },
                                    { value: 'progress', emoji: '🟡', label: 'Progress', sub: 'Sedang dalam proses',     selCls: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30' },
                                    { value: 'close',    emoji: '✅', label: 'Close',    sub: 'Bahaya sudah ditangani',  selCls: 'border-green-400 bg-green-50 dark:bg-green-950/30' },
                                ].map(({ value, emoji, label, sub, selCls }) => {
                                    const sel = data.status_tindakan === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setData('status_tindakan', value)}
                                            className={cn(
                                                'flex flex-col items-center gap-2 rounded-2xl border-2 py-5 text-center transition-all',
                                                sel ? selCls : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
                                            )}
                                        >
                                            <span className="text-3xl">{emoji}</span>
                                            <div>
                                                <p className="text-base font-bold">{label}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                                            </div>
                                            {sel && (
                                                <div className="flex size-6 items-center justify-center rounded-full bg-primary">
                                                    <Check size={13} className="text-primary-foreground" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <NavButtons canNext={step3Valid} />
                    </div>
                )}

                <p className="text-center text-xs text-muted-foreground pb-2">
                    Datang sehat — kerja aman — pulang selamat
                </p>
            </form>

            <Sheet open={photoSheet} onOpenChange={setPhotoSheet}>
                <SheetContent side="bottom" className="pb-8">
                    <SheetHeader>
                        <SheetTitle>Pilih Sumber Foto</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-3">
                        <Button variant="outline" className="h-14 text-base gap-3" onClick={() => openPhotoSource('camera')}>
                            <Camera size={22} /> Ambil dari Kamera
                        </Button>
                        <Button variant="outline" className="h-14 text-base gap-3" onClick={() => openPhotoSource('gallery')}>
                            <Images size={22} /> Pilih dari Galeri
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
            <UploadOverlay open={processing} progress={uploadProgress} label="Menyimpan laporan..." />
            <CameraCapture
                open={showCamera}
                onCapture={async (file) => {
                    setShowCamera(false);
                    const compressed = await compressImageWithToast(file);
                    setData('foto', compressed);
                    setPreview(URL.createObjectURL(compressed));
                }}
                onClose={() => setShowCamera(false)}
            />
        </>
    );
}
