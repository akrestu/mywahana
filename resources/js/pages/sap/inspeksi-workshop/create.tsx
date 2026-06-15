import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Calendar, Camera, Check, ChevronsUpDown, Images, Plus, Trash2, X } from 'lucide-react';
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
type Props = { user: { name: string; jabatan?: string | null; departemen?: string | null; site?: string | null }; staffUsers: StaffUser[]; sites: SiteOption[] };

const CATEGORIES = [
    { key: 'bangunan', label: 'Bangunan / Fasilitas', items: [
        { key: 'bangunan_1', label: '1. Atap/dinding tidak bocor/rusak/tidak aman' },
        { key: 'bangunan_2', label: '2. Lantai kering, bersih, dan tidak licin' },
        { key: 'bangunan_3', label: '3. Jalan keluar masuk bebas hambatan' },
        { key: 'bangunan_4', label: '4. Pintu darurat berfungsi dan tidak terhalang' },
        { key: 'bangunan_5', label: '5. Ventilasi dan pencahayaan mencukupi' },
        { key: 'bangunan_6', label: '6. Tangga/platform dalam kondisi aman' },
        { key: 'bangunan_7', label: '7. Rambu keselamatan terpasang dan terlihat jelas' },
        { key: 'bangunan_8', label: '8. Kebersihan area kerja terjaga' },
        { key: 'bangunan_9', label: '9. Area penyimpanan bahan kimia aman dan berlabel' },
        { key: 'bangunan_10', label: '10. Tempat sampah tersedia dan terpisah sesuai jenis' },
        { key: 'bangunan_11', label: '11. Fasilitas P3K tersedia dan lengkap' },
        { key: 'bangunan_12', label: '12. Jalur evakuasi ditandai dengan jelas' },
        { key: 'bangunan_13', label: '13. Titik kumpul evakuasi jelas' },
        { key: 'bangunan_14', label: '14. Peralatan kerja disimpan dengan tertata rapi' },
        { key: 'bangunan_15', label: '15. Bahan mudah terbakar tersimpan di tempat aman' },
        { key: 'bangunan_16', label: '16. Material tidak berserakan di area kerja' },
        { key: 'bangunan_17', label: '17. MSDS/SDS tersedia untuk semua bahan kimia' },
        { key: 'bangunan_18', label: '18. Tanda larangan merokok terpasang di tempat yang tepat' },
        { key: 'bangunan_19', label: '19. Area non-smoking dipatuhi' },
        { key: 'bangunan_20', label: '20. Toilet/kamar mandi bersih dan berfungsi' },
        { key: 'bangunan_21', label: '21. Air bersih tersedia untuk cuci tangan' },
    ]},
    { key: 'kelistrikan', label: 'Instalasi Kelistrikan', items: [
        { key: 'kelistrikan_1', label: '22. Panel listrik dalam kondisi tertutup dan berlabel' },
        { key: 'kelistrikan_2', label: '23. Kabel tidak berserakan atau terkelupas' },
        { key: 'kelistrikan_3', label: '24. Stop kontak/saklar tidak rusak' },
        { key: 'kelistrikan_4', label: '25. Grounding/earthing peralatan listrik berfungsi' },
        { key: 'kelistrikan_5', label: '26. Tidak ada overloading pada instalasi listrik' },
        { key: 'kelistrikan_6', label: '27. Lampu penerangan berfungsi dengan baik' },
        { key: 'kelistrikan_7', label: '28. Genset/UPS dalam kondisi baik jika ada' },
        { key: 'kelistrikan_8', label: '29. Peralatan listrik portabel dalam kondisi aman' },
    ]},
    { key: 'welder', label: 'Area Pengelasan (Welder)', items: [
        { key: 'welder_1', label: '30. APD las (helm, sarung tangan, apron) tersedia dan layak' },
        { key: 'welder_2', label: '31. Tirai/welding curtain terpasang' },
        { key: 'welder_3', label: '32. Ventilasi memadai di area pengelasan' },
        { key: 'welder_4', label: '33. Peralatan las dalam kondisi baik dan aman' },
        { key: 'welder_5', label: '34. Tidak ada bahan mudah terbakar di sekitar area las' },
        { key: 'welder_6', label: '35. Izin kerja las (hot work permit) tersedia jika diperlukan' },
    ]},
    { key: 'tabung', label: 'Tabung Gas', items: [
        { key: 'tabung_1', label: '36. Tabung gas berdiri tegak dan terikat/terpasang aman' },
        { key: 'tabung_2', label: '37. Tutup/cap tabung gas terpasang saat tidak digunakan' },
        { key: 'tabung_3', label: '38. Regulator dan selang gas dalam kondisi baik' },
        { key: 'tabung_4', label: '39. Tabung gas tidak bocor (dilakukan pengecekan)' },
        { key: 'tabung_5', label: '40. Tabung gas penuh dan kosong dipisahkan' },
        { key: 'tabung_6', label: '41. Label tabung gas (isi, kosong, rusak) jelas' },
    ]},
    { key: 'alat_angkat', label: 'Alat Angkat / Rigging', items: [
        { key: 'alat_angkat_1', label: '42. Sling/rantai angkat dalam kondisi baik, tidak rusak' },
        { key: 'alat_angkat_2', label: '43. Kapasitas angkat alat tertera dengan jelas' },
        { key: 'alat_angkat_3', label: '44. Hoist/crane diperiksa secara berkala (ada stiker inspeksi)' },
        { key: 'alat_angkat_4', label: '45. Operator alat angkat berkompetensi/bersertifikat' },
        { key: 'alat_angkat_5', label: '46. Area pengangkatan dibebaskan dari personel yang tidak berkepentingan' },
    ]},
    { key: 'tps', label: 'Tempat Penyimpanan (TPS)', items: [
        { key: 'tps_1', label: '47. Rak/shelving kokoh dan tidak overload' },
        { key: 'tps_2', label: '48. Barang berat di bawah, ringan di atas' },
        { key: 'tps_3', label: '49. Material bertumpuk tidak melebihi batas aman' },
        { key: 'tps_4', label: '50. Label/identifikasi material terpasang jelas' },
        { key: 'tps_5', label: '51. Jalur akses penyimpanan bebas hambatan' },
        { key: 'tps_6', label: '52. Limbah B3 tersimpan di TPS khusus dan berlabel' },
        { key: 'tps_7', label: '53. Manifest limbah B3 tersedia dan updated' },
        { key: 'tps_8', label: '54. Oli bekas tersimpan di drum tertutup' },
        { key: 'tps_9', label: '55. Spill kit tersedia di dekat area TPS' },
        { key: 'tps_10', label: '56. Bunding/secondary containment untuk bahan kimia tersedia' },
        { key: 'tps_11', label: '57. APAR tersedia dan mudah dijangkau di area TPS' },
        { key: 'tps_12', label: '58. Inspeksi APAR dilakukan secara rutin (kartu inspeksi ada)' },
    ]},
    { key: 'tyre', label: 'Area Tyre / Ban', items: [
        { key: 'tyre_1', label: '59. Ban tersimpan dengan aman (tidak berpotensi menggelinding)' },
        { key: 'tyre_2', label: '60. Peralatan pengisian angin (kompresor, selang) aman' },
        { key: 'tyre_3', label: '61. APD tersedia untuk pekerjaan tyre (sarung tangan, pelindung wajah)' },
    ]},
] as const;

type ScoreKey = 'bangunan_1'|'bangunan_2'|'bangunan_3'|'bangunan_4'|'bangunan_5'|'bangunan_6'|'bangunan_7'|'bangunan_8'|'bangunan_9'|'bangunan_10'|'bangunan_11'|'bangunan_12'|'bangunan_13'|'bangunan_14'|'bangunan_15'|'bangunan_16'|'bangunan_17'|'bangunan_18'|'bangunan_19'|'bangunan_20'|'bangunan_21'|'kelistrikan_1'|'kelistrikan_2'|'kelistrikan_3'|'kelistrikan_4'|'kelistrikan_5'|'kelistrikan_6'|'kelistrikan_7'|'kelistrikan_8'|'welder_1'|'welder_2'|'welder_3'|'welder_4'|'welder_5'|'welder_6'|'tabung_1'|'tabung_2'|'tabung_3'|'tabung_4'|'tabung_5'|'tabung_6'|'alat_angkat_1'|'alat_angkat_2'|'alat_angkat_3'|'alat_angkat_4'|'alat_angkat_5'|'tps_1'|'tps_2'|'tps_3'|'tps_4'|'tps_5'|'tps_6'|'tps_7'|'tps_8'|'tps_9'|'tps_10'|'tps_11'|'tps_12'|'tyre_1'|'tyre_2'|'tyre_3';
type TindakanRow = { tindakan: string; pic: string; due_date: string; remark: string };
type FormData = { re_inspektor_id: string; peserta_ids: number[]; tanggal: string; project_site: string; departemen: string } & { [K in ScoreKey]: string } & { tindakan_perbaikan: TindakanRow[]; ttd_inspektor: string; [key: string]: unknown };

const ALL_SCORE_KEYS: ScoreKey[] = ['bangunan_1','bangunan_2','bangunan_3','bangunan_4','bangunan_5','bangunan_6','bangunan_7','bangunan_8','bangunan_9','bangunan_10','bangunan_11','bangunan_12','bangunan_13','bangunan_14','bangunan_15','bangunan_16','bangunan_17','bangunan_18','bangunan_19','bangunan_20','bangunan_21','kelistrikan_1','kelistrikan_2','kelistrikan_3','kelistrikan_4','kelistrikan_5','kelistrikan_6','kelistrikan_7','kelistrikan_8','welder_1','welder_2','welder_3','welder_4','welder_5','welder_6','tabung_1','tabung_2','tabung_3','tabung_4','tabung_5','tabung_6','alat_angkat_1','alat_angkat_2','alat_angkat_3','alat_angkat_4','alat_angkat_5','tps_1','tps_2','tps_3','tps_4','tps_5','tps_6','tps_7','tps_8','tps_9','tps_10','tps_11','tps_12','tyre_1','tyre_2','tyre_3'];

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

export default function InspeksiWorkshopCreate({ user, staffUsers, sites }: Props) {
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
    const { data, setData, post, processing, errors } = useForm<FormData>({ re_inspektor_id: '', peserta_ids: [], tanggal: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }), project_site: defaultSite, departemen: user.departemen ?? '', ...initialScores, tindakan_perbaikan: [], ttd_inspektor: '' });
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
        post('/sap/inspeksi-workshop', {
            data: fd as unknown as FormData,
            onProgress: (e) => setUploadProgress(e.percentage ?? null),
            onFinish: () => setUploadProgress(null),
        });
    };

    return (
        <>
            <Head title="Buat Inspeksi Workshop" />
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
                <div>
                    <h2 className="text-xl font-bold">Inspeksi Area Workshop</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-007 — Langkah {step} dari 3</p>
                    <div className="flex gap-2 mt-3">{[1,2,3].map(s => <div key={s} className={cn('h-1.5 flex-1 rounded-full', step >= s ? 'bg-primary' : 'bg-muted')} />)}</div>
                </div>

                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Informasi Inspeksi</div>
                            <CardContent className="flex flex-col gap-4 py-4">
                                <div className="space-y-1.5"><Label>Tanggal <span className="text-destructive">*</span></Label><div className="relative"><Input type="date" max={today} value={data.tanggal} onChange={e => setData('tanggal', e.target.value)} className="h-12 text-base pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" /><Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" /></div></div>
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
                                    {errors.project_site && <p className="text-sm text-destructive">{errors.project_site}</p>}
                                </div>
                                <div className="space-y-1.5"><Label>Departemen <span className="text-destructive">*</span></Label><Input value={data.departemen} onChange={e => setData('departemen', e.target.value)} placeholder="Nama departemen" className="h-12 text-base" /></div>
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
                        <Button type="button" className="h-14 text-base font-bold gap-2" onClick={() => setStep(2)} disabled={!data.tanggal || !data.project_site || !data.departemen}>Lanjut ke Checklist <ArrowRight size={18} /></Button>
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
