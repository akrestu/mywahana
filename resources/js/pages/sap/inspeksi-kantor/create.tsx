import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Calendar, Camera, Check, ChevronsUpDown, Plus, Trash2, X } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type StaffUser = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type SiteOption = { value: string; label: string };
type Props = { user: { name: string; nik?: string | null; jabatan?: string | null; departemen?: string | null; site?: string | null }; staffUsers: StaffUser[]; sites: SiteOption[] };

const CATEGORIES = [
    {
        key: 'situasi', label: 'Situasi',
        items: [
            { key: 'situasi_1', label: '1. Atap, Dinding, pintu, jendela dalam kondisi bersih dan baik' },
            { key: 'situasi_2', label: '2. Lantai dalam kondisi bersih dan tidak rusak' },
            { key: 'situasi_3', label: '3. Penerangan di semua area/ruangan memadai/standar' },
            { key: 'situasi_4', label: '4. Ventilasi di semua area/ruangan memadai (tidak pengap)' },
            { key: 'situasi_5', label: '5. House keeping/kebersihan secara umum baik' },
            { key: 'situasi_6', label: '6. Tersedia halaman parkir sarana memadai; Tersedia rambu parkir & sarana parkir mundur' },
            { key: 'situasi_7', label: '7. Terdapat rambu tempat berkumpul darurat' },
        ],
    },
    {
        key: 'individu', label: 'Individu',
        items: [
            { key: 'individu_1', label: '8. Semua karyawan memakai APD sesuai standar' },
        ],
    },
    {
        key: 'alat', label: 'Alat',
        items: [
            { key: 'alat_1', label: '9. Rambu K3 (safety sign) lengkap dan memadai' },
            { key: 'alat_2', label: '10. Instalasi listrik, saklar, kabel dalam kondisi baik dan aman' },
            { key: 'alat_3', label: '11. Semua pipa, kran dan katup dalam kondisi baik' },
            { key: 'alat_4', label: '12. Pada pintu ruangan khusus terdapat rambu "Dilarang Masuk selain Petugas"' },
            { key: 'alat_5', label: '13. Bangunan dilengkapi alarm emergency & Rambu Evakuasi' },
            { key: 'alat_6', label: '14. Semua furniture (lemari, meja kerja, kursi dll) dalam kondisi baik, bersih dan ergonomis' },
            { key: 'alat_7', label: '15. Terdapat APAR atau instalasi hydran dalam kondisi baik' },
        ],
    },
    {
        key: 'prosedur', label: 'Prosedur',
        items: [
            { key: 'prosedur_1', label: '16. Tempat sampah mencukupi, dan dikosongkan setiap hari' },
            { key: 'prosedur_2', label: '17. APAR tersedia memadai dan diinspeksi secara rutin' },
            { key: 'prosedur_3', label: '18. Bangunan dilengkapi dengan sistem pentanahan dan dilakukan inspeksi/pengukuran secara rutin' },
            { key: 'prosedur_4', label: '19. Kotak P3K lengkap dengan peralatannya' },
            { key: 'prosedur_5', label: '20. Tidak menyimpan Cairan Mudah Terbakar/menyala di dalam ruang kerja' },
            { key: 'prosedur_6', label: '21. Penyimpanan & Pengendalian Bahan Kimia Berbahaya' },
            { key: 'prosedur_7', label: '22. Terdapat Papan Pengumuman K3 & LH' },
        ],
    },
] as const;

type ScoreKey = 'situasi_1'|'situasi_2'|'situasi_3'|'situasi_4'|'situasi_5'|'situasi_6'|'situasi_7'
    |'individu_1'
    |'alat_1'|'alat_2'|'alat_3'|'alat_4'|'alat_5'|'alat_6'|'alat_7'
    |'prosedur_1'|'prosedur_2'|'prosedur_3'|'prosedur_4'|'prosedur_5'|'prosedur_6'|'prosedur_7';

type TindakanRow = { tindakan: string; pic: string; due_date: string; remark: string };

type FormData = {
    re_inspektor_id: string;
    peserta_ids: number[];
    tanggal: string;
    project_site: string;
    departemen: string;
} & { [K in ScoreKey]: string } & {
    tindakan_perbaikan: TindakanRow[];
    ttd_inspektor: string;
    [key: string]: unknown;
};

const ALL_SCORE_KEYS: ScoreKey[] = [
    'situasi_1','situasi_2','situasi_3','situasi_4','situasi_5','situasi_6','situasi_7',
    'individu_1',
    'alat_1','alat_2','alat_3','alat_4','alat_5','alat_6','alat_7',
    'prosedur_1','prosedur_2','prosedur_3','prosedur_4','prosedur_5','prosedur_6','prosedur_7',
];

function calcScore(data: FormData) {
    const filled = ALL_SCORE_KEYS.map(k => Number(data[k])).filter(v => v >= 1 && v <= 4);
    const total = filled.reduce((a, b) => a + b, 0);
    const max = ALL_SCORE_KEYS.length * 4;
    const pct = filled.length > 0 ? Math.round((total / max) * 100 * 10) / 10 : 0;
    const level = pct >= 85 ? 'L' : pct >= 70 ? 'M' : pct >= 50 ? 'H' : 'VH';
    return { total, max, pct, level, filled: filled.length };
}

const SCORE_LABELS = ['', 'Sangat Kurang', 'Kurang', 'Baik', 'Sangat Baik'];
const SCORE_COLORS = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
const RISK_CFG = {
    L:  { label: 'Baik',           cls: 'bg-green-100 text-green-800 border-green-300' },
    M:  { label: 'Cukup',          cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    H:  { label: 'Perhatian',      cls: 'bg-orange-100 text-orange-800 border-orange-300' },
    VH: { label: 'Perlu Tindakan', cls: 'bg-red-100 text-red-800 border-red-300' },
};

function ScoreButton({ val, current, onChange }: { val: number; current: string; onChange: (v: string) => void }) {
    const isActive = current === String(val);
    return (
        <button
            type="button"
            onClick={() => onChange(isActive ? '' : String(val))}
            className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all',
                isActive
                    ? cn(SCORE_COLORS[val], 'border-transparent text-white scale-110 shadow-md')
                    : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary',
            )}
            title={SCORE_LABELS[val]}
        >
            {val}
        </button>
    );
}

function SignaturePad({ onCapture }: { onCapture: (d: string | null) => void }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const [empty, setEmpty] = useState(true);

    const pos = (e: MouseEvent | Touch, c: HTMLCanvasElement) => {
        const r = c.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
    };

    useEffect(() => {
        const c = ref.current; if (!c) return;
        const ctx = c.getContext('2d')!;
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const down = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing.current = true; const p = pos('touches' in e ? e.touches[0] : e, c); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
        const move = (e: MouseEvent | TouchEvent) => { if (!drawing.current) return; e.preventDefault(); const p = pos('touches' in e ? e.touches[0] : e, c); ctx.lineTo(p.x, p.y); ctx.stroke(); setEmpty(false); onCapture(c.toDataURL()); };
        const up = () => { drawing.current = false; };
        c.addEventListener('mousedown', down); c.addEventListener('mousemove', move); c.addEventListener('mouseup', up);
        c.addEventListener('touchstart', down, { passive: false }); c.addEventListener('touchmove', move, { passive: false }); c.addEventListener('touchend', up);
        return () => { c.removeEventListener('mousedown', down); c.removeEventListener('mousemove', move); c.removeEventListener('mouseup', up); c.removeEventListener('touchstart', down); c.removeEventListener('touchmove', move); c.removeEventListener('touchend', up); };
    }, [onCapture]);

    return (
        <div className="space-y-2">
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-input bg-white dark:bg-muted/20">
                <canvas ref={ref} width={600} height={220} className="w-full touch-none block" style={{ cursor: 'crosshair' }} />
                {empty && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm font-medium">Tanda tangan di sini</div>}
            </div>
            {!empty && <button type="button" onClick={() => { ref.current?.getContext('2d')!.clearRect(0,0,600,220); setEmpty(true); onCapture(null); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"><X size={14} /> Hapus &amp; Ulangi</button>}
        </div>
    );
}

export default function InspeksiKantorCreate({ user, staffUsers, sites }: Props) {
    const [step, setStep] = useState(1);
    const [riOpen, setRiOpen] = useState(false);
    const [pesertaOpen, setPesertaOpen] = useState(false);
    const [siteOpen, setSiteOpen] = useState(false);
    const [fotoFiles, setFotoFiles] = useState<Record<string, File>>({});

    const initialScores = Object.fromEntries(ALL_SCORE_KEYS.map(k => [k, ''])) as { [K in ScoreKey]: string };

    const { data, setData, post, processing, errors } = useForm<FormData>({
        re_inspektor_id: '',
        peserta_ids: [],
        tanggal: new Date().toISOString().split('T')[0],
        project_site: sites.find(s => s.value === user.site)?.label ?? '',
        departemen: user.departemen ?? '',
        ...initialScores,
        tindakan_perbaikan: [],
        ttd_inspektor: '',
    });

    const selectedRI = staffUsers.find(u => String(u.id) === data.re_inspektor_id);
    const selectedPeserta = staffUsers.filter(u => data.peserta_ids.includes(u.id));

    const score = calcScore(data);
    const risk = RISK_CFG[score.level as keyof typeof RISK_CFG];

    const addTindakan = () => setData('tindakan_perbaikan', [...data.tindakan_perbaikan, { tindakan: '', pic: '', due_date: '', remark: '' }]);
    const removeTindakan = (i: number) => setData('tindakan_perbaikan', data.tindakan_perbaikan.filter((_, idx) => idx !== i));
    const updateTindakan = (i: number, field: keyof TindakanRow, val: string) => {
        const rows = [...data.tindakan_perbaikan]; rows[i] = { ...rows[i], [field]: val }; setData('tindakan_perbaikan', rows);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (k === 'tindakan_perbaikan') {
                (v as TindakanRow[]).forEach((row, i) => {
                    Object.entries(row).forEach(([rk, rv]) => fd.append(`tindakan_perbaikan[${i}][${rk}]`, rv));
                });
            } else if (k === 'peserta_ids') {
                (v as number[]).forEach(id => fd.append('peserta_ids[]', String(id)));
            } else {
                fd.append(k, String(v ?? ''));
            }
        });
        Object.entries(fotoFiles).forEach(([k, f]) => fd.append(`foto[${k}]`, f));
        post('/sap/inspeksi-kantor', { data: fd as unknown as FormData });
    };

    return (
        <>
            <Head title="Buat Inspeksi Kantor" />
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
                {/* Steps indicator */}
                <div>
                    <h2 className="text-xl font-bold">Inspeksi Area Kantor</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-004 — Langkah {step} dari 3</p>
                    <div className="flex gap-2 mt-3">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={cn('h-1.5 flex-1 rounded-full', step >= s ? 'bg-primary' : 'bg-muted')} />
                        ))}
                    </div>
                </div>

                {/* Step 1: Header */}
                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Informasi Inspeksi</div>
                            <CardContent className="flex flex-col gap-4 py-4">
                                <div className="space-y-1.5">
                                    <Label>Tanggal <span className="text-destructive">*</span></Label>
                                    <div className="relative"><Input type="date" value={data.tanggal} onChange={e => setData('tanggal', e.target.value)} className="h-12 text-base pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" /><Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" /></div>
                                    {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Project / Site <span className="text-destructive">*</span></Label>
                                    <Popover open={siteOpen} onOpenChange={setSiteOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="h-12 w-full justify-between text-base font-normal">
                                                {data.project_site || <span className="text-muted-foreground">Pilih project / site...</span>}
                                                <ChevronsUpDown size={16} className="ml-2 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandList>
                                                    <CommandGroup>
                                                        {sites.map(s => (
                                                            <CommandItem key={s.value} value={s.label} onSelect={() => { setData('project_site', s.label); setSiteOpen(false); }}>
                                                                <Check size={14} className={cn('mr-2', data.project_site === s.label ? 'opacity-100' : 'opacity-0')} />
                                                                {s.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {errors.project_site && <p className="text-sm text-destructive">{errors.project_site}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Departemen <span className="text-destructive">*</span></Label>
                                    <Input value={data.departemen} onChange={e => setData('departemen', e.target.value)} placeholder="Nama departemen" className="h-12 text-base" />
                                    {errors.departemen && <p className="text-sm text-destructive">{errors.departemen}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Inspektor</div>
                            <CardContent className="py-4 flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label>Re-Inspektor (Opsional)</Label>
                                    <Popover open={riOpen} onOpenChange={setRiOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="h-12 w-full justify-between text-base">
                                                {selectedRI ? selectedRI.name : 'Pilih re-inspektor...'}
                                                <ChevronsUpDown size={16} className="ml-2 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Cari nama..." />
                                                <CommandList>
                                                    <CommandEmpty>Tidak ditemukan</CommandEmpty>
                                                    <CommandGroup>
                                                        {data.re_inspektor_id && (
                                                            <CommandItem onSelect={() => { setData('re_inspektor_id', ''); setRiOpen(false); }}>
                                                                <X size={14} className="mr-2" /> Hapus pilihan
                                                            </CommandItem>
                                                        )}
                                                        {staffUsers.map(u => (
                                                            <CommandItem key={u.id} value={u.name} onSelect={() => { setData('re_inspektor_id', String(u.id)); setRiOpen(false); }}>
                                                                <Check size={14} className={cn('mr-2', String(u.id) === data.re_inspektor_id ? 'opacity-100' : 'opacity-0')} />
                                                                <div>
                                                                    <p className="font-semibold">{u.name}</p>
                                                                    {u.jabatan && <p className="text-xs text-muted-foreground">{u.jabatan}</p>}
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Peserta Inspeksi (Opsional)</Label>
                                    <Popover open={pesertaOpen} onOpenChange={setPesertaOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="h-12 w-full justify-between text-base">
                                                {selectedPeserta.length > 0 ? `${selectedPeserta.length} peserta dipilih` : 'Tambah peserta...'}
                                                <ChevronsUpDown size={16} className="ml-2 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Cari nama..." />
                                                <CommandList>
                                                    <CommandEmpty>Tidak ditemukan</CommandEmpty>
                                                    <CommandGroup>
                                                        {staffUsers.map(u => {
                                                            const selected = data.peserta_ids.includes(u.id);
                                                            return (
                                                                <CommandItem key={u.id} value={u.name} onSelect={() => {
                                                                    setData('peserta_ids', selected
                                                                        ? data.peserta_ids.filter(id => id !== u.id)
                                                                        : [...data.peserta_ids, u.id]);
                                                                }}>
                                                                    <Check size={14} className={cn('mr-2', selected ? 'opacity-100' : 'opacity-0')} />
                                                                    <div>
                                                                        <p className="font-semibold">{u.name}</p>
                                                                        {u.jabatan && <p className="text-xs text-muted-foreground">{u.jabatan}</p>}
                                                                    </div>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {selectedPeserta.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {selectedPeserta.map(u => (
                                                <div key={u.id} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                                                    {u.name}
                                                    <button type="button" onClick={() => setData('peserta_ids', data.peserta_ids.filter(id => id !== u.id))}>
                                                        <X size={12} className="text-muted-foreground hover:text-destructive" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="button" className="h-14 text-base font-bold gap-2" onClick={() => setStep(2)}
                            disabled={!data.tanggal || !data.project_site || !data.departemen}>
                            Lanjut ke Checklist <ArrowRight size={18} />
                        </Button>
                    </div>
                )}

                {/* Step 2: Checklist */}
                {step === 2 && (
                    <div className="flex flex-col gap-5">
                        <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                            Berikan skor <strong>1–4</strong> untuk setiap item: <span className="text-red-600 font-semibold">1=Sangat Kurang</span>, <span className="text-orange-500 font-semibold">2=Kurang</span>, <span className="text-yellow-600 font-semibold">3=Baik</span>, <span className="text-green-600 font-semibold">4=Sangat Baik</span>. Item yang tidak relevan bisa dilewati.
                        </div>

                        {CATEGORIES.map(cat => (
                            <Card key={cat.key} className="p-0 overflow-hidden">
                                <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">{cat.label}</div>
                                <CardContent className="p-0">
                                    {cat.items.map((item, idx) => (
                                        <Fragment key={item.key}>
                                            <div className="px-4 py-4 flex flex-col gap-3">
                                                <p className="text-sm leading-relaxed">{item.label}</p>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3, 4].map(v => (
                                                            <ScoreButton key={v} val={v} current={data[item.key as ScoreKey]} onChange={val => setData(item.key as ScoreKey, val)} />
                                                        ))}
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-primary transition-colors">
                                                        <Camera size={18} />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="sr-only"
                                                            onChange={e => {
                                                                const f = e.target.files?.[0];
                                                                if (f) setFotoFiles(prev => ({ ...prev, [item.key]: f }));
                                                            }}
                                                        />
                                                        {fotoFiles[item.key]
                                                            ? <span className="text-xs text-green-600 font-semibold">Foto ✓</span>
                                                            : <span className="text-xs">Foto</span>}
                                                    </label>
                                                </div>
                                                {data[item.key as ScoreKey] && (
                                                    <p className={cn('text-xs font-semibold',
                                                        data[item.key as ScoreKey] === '1' ? 'text-red-600' :
                                                        data[item.key as ScoreKey] === '2' ? 'text-orange-500' :
                                                        data[item.key as ScoreKey] === '3' ? 'text-yellow-600' : 'text-green-600'
                                                    )}>
                                                        {SCORE_LABELS[Number(data[item.key as ScoreKey])]}
                                                    </p>
                                                )}
                                            </div>
                                            {idx < cat.items.length - 1 && <Separator />}
                                        </Fragment>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-14 text-base font-bold gap-2" onClick={() => setStep(1)}>
                                <ArrowLeft size={18} /> Kembali
                            </Button>
                            <Button type="button" className="h-14 text-base font-bold gap-2" onClick={() => setStep(3)}>
                                Lanjut <ArrowRight size={18} />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Tindakan + TTD + Ringkasan */}
                {step === 3 && (
                    <div className="flex flex-col gap-5">
                        {/* Skor */}
                        <Card className={cn('p-0 overflow-hidden border-2', risk.cls.includes('green') ? 'border-green-300' : risk.cls.includes('yellow') ? 'border-yellow-300' : risk.cls.includes('orange') ? 'border-orange-300' : 'border-red-300')}>
                            <div className={cn('px-4 py-4 flex flex-col gap-1', risk.cls)}>
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-lg">{score.pct}%</p>
                                    <span className="font-bold text-sm px-3 py-1 rounded-full bg-white/50">{risk.label}</span>
                                </div>
                                <p className="text-sm">Total: {score.total} / {score.max} poin ({score.filled} dari {ALL_SCORE_KEYS.length} item diisi)</p>
                            </div>
                        </Card>

                        {/* Tindakan Perbaikan */}
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm flex items-center justify-between">
                                <span>Rekomendasi Tindakan Perbaikan</span>
                                <button type="button" onClick={addTindakan} className="flex items-center gap-1 text-xs text-primary font-semibold">
                                    <Plus size={14} /> Tambah Baris
                                </button>
                            </div>
                            <CardContent className="p-4 flex flex-col gap-3">
                                {data.tindakan_perbaikan.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada tindakan perbaikan. Klik "+ Tambah Baris" untuk menambah.</p>
                                )}
                                {data.tindakan_perbaikan.map((row, i) => (
                                    <div key={i} className="rounded-xl border p-3 flex flex-col gap-2 relative">
                                        <button type="button" onClick={() => removeTindakan(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                                        <p className="text-xs font-bold text-muted-foreground">#{i + 1}</p>
                                        <Input placeholder="Tindakan perbaikan" value={row.tindakan} onChange={e => updateTindakan(i, 'tindakan', e.target.value)} className="h-10 text-sm" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input placeholder="PIC" value={row.pic} onChange={e => updateTindakan(i, 'pic', e.target.value)} className="h-10 text-sm" />
                                            <Input placeholder="Due date" value={row.due_date} onChange={e => updateTindakan(i, 'due_date', e.target.value)} className="h-10 text-sm" />
                                        </div>
                                        <Input placeholder="Keterangan" value={row.remark} onChange={e => updateTindakan(i, 'remark', e.target.value)} className="h-10 text-sm" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Tanda Tangan */}
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Tanda Tangan Inspektor</div>
                            <CardContent className="py-4">
                                <SignaturePad onCapture={d => setData('ttd_inspektor', d ?? '')} />
                                {errors.ttd_inspektor && <p className="text-sm text-destructive mt-2">{errors.ttd_inspektor}</p>}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-14 text-base font-bold gap-2" onClick={() => setStep(2)}>
                                <ArrowLeft size={18} /> Kembali
                            </Button>
                            <Button type="submit" className="h-14 text-base font-bold gap-2" disabled={processing}>
                                <Check size={20} /> Simpan
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </>
    );
}
