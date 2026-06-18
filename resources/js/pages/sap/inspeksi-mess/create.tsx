import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Calendar, Camera, Check, ChevronsUpDown, Images, Plus, Trash2, X } from 'lucide-react';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Fragment, useEffect, useRef, useState } from 'react';
import { CameraCapture } from '@/components/camera-capture';
import { UploadOverlay } from '@/components/upload-overlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { compressImageWithToast } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

type StaffUser = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type SiteOption = { value: string; label: string };
type Props = { user: { name: string; site?: string | null }; staffUsers: StaffUser[]; sites: SiteOption[] };

const CATEGORIES = [
    { key: 'sanitasi', label: 'Sanitasi & Kebersihan Umum', items: [
        { key: 'sanitasi_1', label: '1. Lingkungan mess bersih, bebas sampah berserakan' },
        { key: 'sanitasi_2', label: '2. Saluran air/drainase tidak tersumbat dan berfungsi baik' },
        { key: 'sanitasi_3', label: '3. Tersedia tempat sampah yang cukup dan terpilah' },
        { key: 'sanitasi_4', label: '4. Sampah diangkut/dibuang secara rutin' },
        { key: 'sanitasi_5', label: '5. Tidak ada genangan air yang berpotensi jadi sarang nyamuk' },
        { key: 'sanitasi_6', label: '6. Toilet/kamar mandi bersih, tidak berbau, dan berfungsi' },
        { key: 'sanitasi_7', label: '7. Air bersih tersedia 24 jam dan cukup untuk penghuni' },
        { key: 'sanitasi_8', label: '8. Sabun dan perlengkapan kebersihan tersedia di kamar mandi' },
        { key: 'sanitasi_9', label: '9. Area cuci pakaian bersih dan drainasenya baik' },
        { key: 'sanitasi_10', label: '10. Hewan pengganggu (tikus, kecoa, nyamuk) dikendalikan' },
    ]},
    { key: 'kamar', label: 'Kamar Tidur & Fasilitas Pribadi', items: [
        { key: 'kamar_1', label: '11. Kamar tidur bersih, rapi, dan berventilasi baik' },
        { key: 'kamar_2', label: '12. Kapasitas kamar tidak melebihi batas yang ditentukan' },
        { key: 'kamar_3', label: '13. Tempat tidur dalam kondisi layak dan bersih' },
        { key: 'kamar_4', label: '14. Lemari/loker penyimpanan tersedia dan memadai' },
        { key: 'kamar_5', label: '15. Pencahayaan kamar mencukupi' },
        { key: 'kamar_6', label: '16. AC/kipas angin berfungsi dengan baik' },
        { key: 'kamar_7', label: '17. Tidak ada kerusakan pada pintu, jendela, atau kunci kamar' },
        { key: 'kamar_8', label: '18. Area koridor/lorong bersih dan bebas hambatan' },
    ]},
    { key: 'dapur', label: 'Dapur & Area Makan', items: [
        { key: 'dapur_1', label: '19. Dapur bersih, peralatan masak dalam kondisi baik' },
        { key: 'dapur_2', label: '20. Makanan tersimpan dengan benar (tertutup, suhu tepat)' },
        { key: 'dapur_3', label: '21. Kulkas/freezer berfungsi baik dan bersih' },
        { key: 'dapur_4', label: '22. Area makan bersih dan meja makan layak' },
        { key: 'dapur_5', label: '23. Tidak ada kontaminasi silang antara makanan mentah dan matang' },
    ]},
    { key: 'sampah', label: 'Pengelolaan Sampah & Lingkungan', items: [
        { key: 'sampah_1', label: '24. TPS sampah mess tertutup dan tidak menimbulkan bau' },
        { key: 'sampah_2', label: '25. Jadwal pengangkutan sampah ada dan dipatuhi' },
        { key: 'sampah_3', label: '26. Tidak ada pembakaran sampah di area mess' },
        { key: 'sampah_4', label: '27. Taman/area hijau di sekitar mess terawat' },
        { key: 'sampah_5', label: '28. Fasilitas olahraga/rekreasi (jika ada) aman dan terawat' },
    ]},
] as const;

type ScoreKey = 'sanitasi_1'|'sanitasi_2'|'sanitasi_3'|'sanitasi_4'|'sanitasi_5'|'sanitasi_6'|'sanitasi_7'|'sanitasi_8'|'sanitasi_9'|'sanitasi_10'|'kamar_1'|'kamar_2'|'kamar_3'|'kamar_4'|'kamar_5'|'kamar_6'|'kamar_7'|'kamar_8'|'dapur_1'|'dapur_2'|'dapur_3'|'dapur_4'|'dapur_5'|'sampah_1'|'sampah_2'|'sampah_3'|'sampah_4'|'sampah_5';
type TindakanRow = { tindakan: string; pic: string; due_date: string; remark: string };
type FormData = { re_inspektor_id: string; peserta_ids: number[]; tanggal: string; project_site: string; lokasi: string } & { [K in ScoreKey]: string } & { tindakan_perbaikan: TindakanRow[]; ttd_inspektor: string; [key: string]: unknown };

const ALL_SCORE_KEYS: ScoreKey[] = ['sanitasi_1','sanitasi_2','sanitasi_3','sanitasi_4','sanitasi_5','sanitasi_6','sanitasi_7','sanitasi_8','sanitasi_9','sanitasi_10','kamar_1','kamar_2','kamar_3','kamar_4','kamar_5','kamar_6','kamar_7','kamar_8','dapur_1','dapur_2','dapur_3','dapur_4','dapur_5','sampah_1','sampah_2','sampah_3','sampah_4','sampah_5'];

function calcScore(data: FormData) {
    const filled = ALL_SCORE_KEYS.map(k => Number(data[k])).filter(v => v >= 1 && v <= 4);
    const total = filled.reduce((a, b) => a + b, 0);
    const max = ALL_SCORE_KEYS.length * 4;
    const pct = filled.length > 0 ? Math.round((total / max) * 100 * 10) / 10 : 0;
    const level = pct >= 85 ? 'L' : pct >= 70 ? 'M' : pct >= 50 ? 'H' : 'VH';
    return { total, max, pct, level };
}

const SCORE_LABELS = ['', 'Sangat Kurang', 'Kurang', 'Baik', 'Sangat Baik'];
const SCORE_COLORS = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
const RISK_CFG = { L: { label: 'Baik', cls: 'bg-green-100 text-green-800' }, M: { label: 'Cukup', cls: 'bg-yellow-100 text-yellow-800' }, H: { label: 'Perhatian', cls: 'bg-orange-100 text-orange-800' }, VH: { label: 'Perlu Tindakan', cls: 'bg-red-100 text-red-800' } };

function ScoreButton({ val, current, onChange }: { val: number; current: string; onChange: (v: string) => void }) {
    const isActive = current === String(val);
    return <button type="button" onClick={() => onChange(isActive ? '' : String(val))} className={cn('flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all', isActive ? cn(SCORE_COLORS[val], 'border-transparent text-white scale-110 shadow-md') : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary')} title={SCORE_LABELS[val]}>{val}</button>;
}

function SignaturePad({ onCapture }: { onCapture: (d: string | null) => void }) {
    const ref = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const [empty, setEmpty] = useState(true);
    const pos = (e: MouseEvent | Touch, c: HTMLCanvasElement) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }; };
    useEffect(() => {
        const c = ref.current; if (!c) return;
        const ctx = c.getContext('2d')!; ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#0f172a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const down = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing.current = true; const p = pos('touches' in e ? e.touches[0] : e, c); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
        const move = (e: MouseEvent | TouchEvent) => { if (!drawing.current) return; e.preventDefault(); const p = pos('touches' in e ? e.touches[0] : e, c); ctx.lineTo(p.x, p.y); ctx.stroke(); setEmpty(false); onCapture(c.toDataURL()); };
        const up = () => { drawing.current = false; };
        c.addEventListener('mousedown', down); c.addEventListener('mousemove', move); c.addEventListener('mouseup', up);
        c.addEventListener('touchstart', down, { passive: false }); c.addEventListener('touchmove', move, { passive: false }); c.addEventListener('touchend', up);
        return () => { c.removeEventListener('mousedown', down); c.removeEventListener('mousemove', move); c.removeEventListener('mouseup', up); c.removeEventListener('touchstart', down); c.removeEventListener('touchmove', move); c.removeEventListener('touchend', up); };
    }, [onCapture]);
    return (
        <div className="space-y-2">
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-input bg-white dark:bg-muted/20"><canvas ref={ref} width={600} height={220} className="w-full touch-none block" style={{ cursor: 'crosshair' }} />{empty && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm font-medium">Tanda tangan di sini</div>}</div>
            {!empty && <button type="button" onClick={() => { ref.current?.getContext('2d')!.clearRect(0,0,600,220); setEmpty(true); onCapture(null); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"><X size={14} /> Hapus &amp; Ulangi</button>}
        </div>
    );
}

export default function InspeksiMessCreate({ user, staffUsers, sites }: Props) {
    const [step, setStep] = useState(1);
    useEffect(() => { window.scrollTo(0, 0); }, [step]);
    const [riOpen, setRiOpen] = useState(false);
    const [pesertaOpen, setPesertaOpen] = useState(false);
    const [siteOpen, setSiteOpen] = useState(false);
    const [fotoFiles, setFotoFiles] = useState<Record<string, File>>({});
    const fotoGalleryRef = useRef<HTMLInputElement>(null);
    const [photoSheet, setPhotoSheet] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [pendingFotoKey, setPendingFotoKey] = useState<string | null>(null);
    function openFotoPicker(key: string) { setPendingFotoKey(key); setPhotoSheet(true); }
    function chooseFotoSource(source: 'camera' | 'gallery') {
        setPhotoSheet(false);
        if (source === 'camera') setShowCamera(true);
        else fotoGalleryRef.current?.click();
    }
    const handleFotoChange = async (key: string, file: File) => {
        const compressed = await compressImageWithToast(file);
        setFotoFiles(prev => ({ ...prev, [key]: compressed }));
    };
    const initialScores = Object.fromEntries(ALL_SCORE_KEYS.map(k => [k, ''])) as { [K in ScoreKey]: string };
    const defaultSite = sites.find(s => s.value === user.site)?.label ?? '';
    const { data, setData, post, processing, errors } = useForm<FormData>({ re_inspektor_id: '', peserta_ids: [], tanggal: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }), project_site: defaultSite, lokasi: '', ...initialScores, tindakan_perbaikan: [], ttd_inspektor: '' });
    const selectedRI = staffUsers.find(u => String(u.id) === data.re_inspektor_id);
    const selectedPeserta = staffUsers.filter(u => data.peserta_ids.includes(u.id));
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    const score = calcScore(data);
    const risk = RISK_CFG[score.level as keyof typeof RISK_CFG];
    const addTindakan = () => setData('tindakan_perbaikan', [...data.tindakan_perbaikan, { tindakan: '', pic: '', due_date: '', remark: '' }]);
    const removeTindakan = (i: number) => setData('tindakan_perbaikan', data.tindakan_perbaikan.filter((_, idx) => idx !== i));
    const updateTindakan = (i: number, field: keyof TindakanRow, val: string) => { const rows = [...data.tindakan_perbaikan]; rows[i] = { ...rows[i], [field]: val }; setData('tindakan_perbaikan', rows); };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (k === 'tindakan_perbaikan') (v as TindakanRow[]).forEach((row, i) => Object.entries(row).forEach(([rk, rv]) => fd.append(`tindakan_perbaikan[${i}][${rk}]`, rv)));
            else if (k === 'peserta_ids') (v as number[]).forEach(id => fd.append('peserta_ids[]', String(id)));
            else fd.append(k, String(v ?? ''));
        });
        Object.entries(fotoFiles).forEach(([k, f]) => fd.append(`foto[${k}]`, f));
        setUploadProgress(0);
        post('/sap/inspeksi-mess', {
            data: fd as unknown as FormData,
            onProgress: (e) => setUploadProgress(e.percentage ?? null),
            onFinish: () => setUploadProgress(null),
        });
    };

    return (
        <>
            <Head title="Buat Inspeksi Mess" />
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
                <div>
                    <h2 className="text-xl font-bold">Inspeksi Area Mess</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-038 — Langkah {step} dari 3</p>
                    <div className="flex gap-2 mt-3">{[1,2,3].map(s => <div key={s} className={cn('h-1.5 flex-1 rounded-full', step >= s ? 'bg-primary' : 'bg-muted')} />)}</div>
                </div>

                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Informasi Inspeksi</div>
                            <CardContent className="flex flex-col gap-4 py-4">
                                <div className="space-y-1.5"><Label>Tanggal <span className="text-destructive">*</span></Label><DatePickerInput value={data.tanggal} onChange={(val) => setData('tanggal', val)} max={today} error={!!errors.tanggal} />{errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}</div>
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
                                            <Command><CommandList><CommandGroup>
                                                {sites.map(s => (
                                                    <CommandItem key={s.value} value={s.label} onSelect={() => { setData('project_site', s.label); setSiteOpen(false); }}>
                                                        <Check size={14} className={cn('mr-2', data.project_site === s.label ? 'opacity-100' : 'opacity-0')} />{s.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup></CommandList></Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-1.5"><Label>Lokasi Mess <span className="text-destructive">*</span></Label><Input value={data.lokasi} onChange={e => setData('lokasi', e.target.value)} placeholder="Nama/lokasi mess" className="h-12 text-base" /></div>
                            </CardContent>
                        </Card>
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Inspektor</div>
                            <CardContent className="py-4 flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label>Re-Inspektor (Opsional)</Label>
                                    <Popover open={riOpen} onOpenChange={setRiOpen}>
                                        <PopoverTrigger asChild><Button variant="outline" role="combobox" className="h-12 w-full justify-between text-base">{selectedRI ? selectedRI.name : 'Pilih re-inspektor...'}<ChevronsUpDown size={16} className="ml-2 opacity-50" /></Button></PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start"><Command><CommandInput placeholder="Cari nama..." /><CommandList><CommandEmpty>Tidak ditemukan</CommandEmpty><CommandGroup>{data.re_inspektor_id && <CommandItem onSelect={() => { setData('re_inspektor_id', ''); setRiOpen(false); }}><X size={14} className="mr-2" /> Hapus pilihan</CommandItem>}{staffUsers.map(u => <CommandItem key={u.id} value={u.name} onSelect={() => { setData('re_inspektor_id', String(u.id)); setRiOpen(false); }}><Check size={14} className={cn('mr-2', String(u.id) === data.re_inspektor_id ? 'opacity-100' : 'opacity-0')} /><div><p className="font-semibold">{u.name}</p>{u.jabatan && <p className="text-xs text-muted-foreground">{u.jabatan}</p>}</div></CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Peserta Inspeksi (Opsional)</Label>
                                    <Popover open={pesertaOpen} onOpenChange={setPesertaOpen}>
                                        <PopoverTrigger asChild><Button variant="outline" role="combobox" className="h-12 w-full justify-between text-base">{selectedPeserta.length > 0 ? `${selectedPeserta.length} peserta dipilih` : 'Tambah peserta...'}<ChevronsUpDown size={16} className="ml-2 opacity-50" /></Button></PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start"><Command><CommandInput placeholder="Cari nama..." /><CommandList><CommandEmpty>Tidak ditemukan</CommandEmpty><CommandGroup>{staffUsers.map(u => { const selected = data.peserta_ids.includes(u.id); return <CommandItem key={u.id} value={u.name} onSelect={() => setData('peserta_ids', selected ? data.peserta_ids.filter(id => id !== u.id) : [...data.peserta_ids, u.id])}><Check size={14} className={cn('mr-2', selected ? 'opacity-100' : 'opacity-0')} /><div><p className="font-semibold">{u.name}</p>{u.jabatan && <p className="text-xs text-muted-foreground">{u.jabatan}</p>}</div></CommandItem>; })}</CommandGroup></CommandList></Command></PopoverContent>
                                    </Popover>
                                    {selectedPeserta.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{selectedPeserta.map(u => <div key={u.id} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">{u.name}<button type="button" onClick={() => setData('peserta_ids', data.peserta_ids.filter(id => id !== u.id))}><X size={12} className="text-muted-foreground hover:text-destructive" /></button></div>)}</div>}
                                </div>
                            </CardContent>
                        </Card>
                        <Button type="button" className="h-14 text-base font-bold gap-2" onClick={() => setStep(2)} disabled={!data.tanggal || !data.project_site || !data.lokasi}>Lanjut ke Checklist <ArrowRight size={18} /></Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-5">
                        <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">Berikan skor <strong>1–4</strong>: <span className="text-red-600 font-semibold">1=Sangat Kurang</span>, <span className="text-orange-500 font-semibold">2=Kurang</span>, <span className="text-yellow-600 font-semibold">3=Baik</span>, <span className="text-green-600 font-semibold">4=Sangat Baik</span>. Item tidak relevan bisa dilewati.</div>
                        {CATEGORIES.map(cat => (
                            <Card key={cat.key} className="p-0 overflow-hidden">
                                <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">{cat.label}</div>
                                <CardContent className="p-0">
                                    {cat.items.map((item, idx) => (
                                        <Fragment key={item.key}>
                                            <div className="px-4 py-4 flex flex-col gap-3">
                                                <p className="text-sm leading-relaxed">{item.label}</p>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex gap-2">{[1,2,3,4].map(v => <ScoreButton key={v} val={v} current={data[item.key as ScoreKey]} onChange={val => setData(item.key as ScoreKey, val)} />)}</div>
                                                    <button type="button" onClick={() => openFotoPicker(item.key)} className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-primary transition-colors"><Camera size={18} />{fotoFiles[item.key] ? <span className="text-xs text-green-600 font-semibold">Foto ✓</span> : <span className="text-xs">Foto</span>}</button>
                                                </div>
                                            </div>
                                            {idx < cat.items.length - 1 && <Separator />}
                                        </Fragment>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-14 text-base font-bold gap-2" onClick={() => setStep(1)}><ArrowLeft size={18} /> Kembali</Button>
                            <Button type="button" className="h-14 text-base font-bold gap-2" onClick={() => setStep(3)}>Lanjut <ArrowRight size={18} /></Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col gap-5">
                        <Card className={cn('p-0 overflow-hidden border-2', risk.cls)}>
                            <div className={cn('px-4 py-4 flex flex-col gap-1', risk.cls)}>
                                <div className="flex items-center justify-between"><p className="font-bold text-lg">{score.pct}%</p><span className="font-bold text-sm px-3 py-1 rounded-full bg-white/50">{risk.label}</span></div>
                                <p className="text-sm">Total: {score.total} / {score.max} poin</p>
                            </div>
                        </Card>
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm flex items-center justify-between"><span>Rekomendasi Tindakan Perbaikan</span><button type="button" onClick={addTindakan} className="flex items-center gap-1 text-xs text-primary font-semibold"><Plus size={14} /> Tambah Baris</button></div>
                            <CardContent className="p-4 flex flex-col gap-3">
                                {data.tindakan_perbaikan.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada tindakan perbaikan.</p>}
                                {data.tindakan_perbaikan.map((row, i) => (
                                    <div key={i} className="rounded-xl border p-3 flex flex-col gap-2 relative">
                                        <button type="button" onClick={() => removeTindakan(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                                        <p className="text-xs font-bold text-muted-foreground">#{i + 1}</p>
                                        <Input placeholder="Tindakan perbaikan" value={row.tindakan} onChange={e => updateTindakan(i, 'tindakan', e.target.value)} className="h-10 text-sm" />
                                        <div className="grid grid-cols-2 gap-2"><Input placeholder="PIC" value={row.pic} onChange={e => updateTindakan(i, 'pic', e.target.value)} className="h-10 text-sm" /><Input placeholder="Due date" value={row.due_date} onChange={e => updateTindakan(i, 'due_date', e.target.value)} className="h-10 text-sm" /></div>
                                        <Input placeholder="Keterangan" value={row.remark} onChange={e => updateTindakan(i, 'remark', e.target.value)} className="h-10 text-sm" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Tanda Tangan Inspektor</div>
                            <CardContent className="py-4"><SignaturePad onCapture={d => setData('ttd_inspektor', d ?? '')} /></CardContent>
                        </Card>
                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-14 text-base font-bold gap-2" onClick={() => setStep(2)}><ArrowLeft size={18} /> Kembali</Button>
                            <Button type="submit" className="h-14 text-base font-bold gap-2" disabled={processing}><Check size={20} /> Simpan</Button>
                        </div>
                    </div>
                )}
            </form>

            <input ref={fotoGalleryRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f && pendingFotoKey) { handleFotoChange(pendingFotoKey, f); setPendingFotoKey(null); }
                e.target.value = '';
            }} />
            <UploadOverlay open={processing} progress={uploadProgress} label="Menyimpan inspeksi..." />
            <CameraCapture
                open={showCamera}
                onCapture={(file) => {
                    setShowCamera(false);
                    if (pendingFotoKey) { handleFotoChange(pendingFotoKey, file); setPendingFotoKey(null); }
                }}
                onClose={() => { setShowCamera(false); setPendingFotoKey(null); }}
            />

            <Sheet open={photoSheet} onOpenChange={setPhotoSheet}>
                <SheetContent side="bottom" className="pb-8">
                    <SheetHeader>
                        <SheetTitle>Pilih Sumber Foto</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-3">
                        <Button variant="outline" className="h-14 text-base gap-3" onClick={() => chooseFotoSource('camera')}>
                            <Camera size={22} /> Ambil dari Kamera
                        </Button>
                        <Button variant="outline" className="h-14 text-base gap-3" onClick={() => chooseFotoSource('gallery')}>
                            <Images size={22} /> Pilih dari Galeri
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
