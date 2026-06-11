import { Head, router } from '@inertiajs/react';
import { BookOpen, Calendar, Camera, Check, ChevronsUpDown, MapPin, PenLine, Plus, Trash2, UserCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { compressImage } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

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

type UserInfo = { name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type StaffUser = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type Props = { user: UserInfo; staffUsers: StaffUser[] };

type Peserta = { nama: string; jabatan: string; nik: string; tanda_tangan: string };

const today = new Date().toISOString().slice(0, 10);

function SignaturePad({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

function startDraw(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        drawing.current = true;
        lastPos.current = getPosNative(e);
    }

    function draw(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        if (!drawing.current) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const pos = getPosNative(e);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    }

    function getPosNative(e: MouseEvent | TouchEvent) {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
    }

    function stopDraw() { drawing.current = false; lastPos.current = null; }

    function clear() {
        const canvas = canvasRef.current!;
        canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    }

    function save() {
        const canvas = canvasRef.current!;
        onSave(canvas.toDataURL('image/png'));
    }

    useEffect(() => {
        const canvas = canvasRef.current!;
        canvas.addEventListener('mousedown', startDraw, { passive: false });
        canvas.addEventListener('mousemove', draw, { passive: false });
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseleave', stopDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDraw);
        return () => {
            canvas.removeEventListener('mousedown', startDraw);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDraw);
            canvas.removeEventListener('mouseleave', stopDraw);
            canvas.removeEventListener('touchstart', startDraw);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', stopDraw);
        };
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <canvas
                ref={canvasRef}
                width={320}
                height={160}
                className="border rounded-lg bg-white touch-none w-full"
            />
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={clear} className="flex-1">Hapus</Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel} className="flex-1">Batal</Button>
                <Button type="button" size="sm" onClick={save} className="flex-1">Simpan TTD</Button>
            </div>
        </div>
    );
}

export default function KomunikasiJsaCreate({ user, staffUsers }: Props) {
    const [tlOpen, setTlOpen] = useState(false);
    const [lokasiOpen, setLokasiOpen] = useState(false);
    const [teamLeaderId, setTeamLeaderId] = useState<string>('');
    const [tanggal, setTanggal] = useState(today);
    const [lokasi, setLokasi] = useState('');
    const [shift, setShift] = useState<'siang' | 'malam' | ''>('');
    const [durasi, setDurasi] = useState('');
    const [kegiatan, setKegiatan] = useState('');
    const [judulDokumen, setJudulDokumen] = useState('');
    const [catatan, setCatatan] = useState('');

    const [peserta, setPeserta] = useState<Peserta[]>([{ nama: '', jabatan: '', nik: '', tanda_tangan: '' }]);
    const [ttdDialogIdx, setTtdDialogIdx] = useState<number | null>(null);

    const [fotoKelompok, setFotoKelompok] = useState<File | null>(null);
    const [fotoDokumen, setFotoDokumen] = useState<File | null>(null);
    const [fotoKelompokPreview, setFotoKelompokPreview] = useState<string>('');
    const [fotoDokumenPreview, setFotoDokumenPreview] = useState<string>('');

    const [supervisorSig, setSupervisorSig] = useState('');
    const [showSupervisorSig, setShowSupervisorSig] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const selectedTL = staffUsers.find(u => String(u.id) === teamLeaderId);
    const noExternalTL = !teamLeaderId;

    async function handleFotoChange(type: 'kelompok' | 'dokumen', file: File | null) {
        if (!file) return;
        const compressed = await compressImage(file);
        if (type === 'kelompok') {
            setFotoKelompok(compressed);
            setFotoKelompokPreview(URL.createObjectURL(compressed));
        } else {
            setFotoDokumen(compressed);
            setFotoDokumenPreview(URL.createObjectURL(compressed));
        }
    }

    function addPeserta() {
        if (peserta.length >= 10) return;
        setPeserta(p => [...p, { nama: '', jabatan: '', nik: '', tanda_tangan: '' }]);
    }

    function removePeserta(idx: number) {
        setPeserta(p => p.filter((_, i) => i !== idx));
    }

    function updatePeserta(idx: number, field: keyof Peserta, value: string) {
        setPeserta(p => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    }

    function handleTtdSave(dataUrl: string) {
        if (ttdDialogIdx === null) return;
        updatePeserta(ttdDialogIdx, 'tanda_tangan', dataUrl);
        setTtdDialogIdx(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        if (!tanggal) newErrors.tanggal = 'Tanggal wajib diisi.';
        if (!lokasi.trim()) newErrors.lokasi = 'Lokasi wajib diisi.';
        if (!shift) newErrors.shift = 'Shift wajib dipilih.';
        if (!durasi || Number(durasi) < 1) newErrors.durasi = 'Durasi wajib diisi (minimal 1 menit).';
        if (!kegiatan.trim()) newErrors.kegiatan = 'Kegiatan wajib diisi.';
        if (!judulDokumen.trim()) newErrors.judul_dokumen = 'Judul dokumen JSA/SOP/IK wajib diisi.';
        if (peserta.length === 0) newErrors.peserta = 'Minimal 1 peserta harus ditambahkan.';
        peserta.forEach((p, i) => {
            if (!p.nama.trim()) newErrors[`peserta_${i}_nama`] = `Nama peserta ${i + 1} wajib diisi.`;
            if (!p.tanda_tangan) newErrors[`peserta_${i}_ttd`] = `Tanda tangan peserta ${i + 1} wajib diisi.`;
        });
        if (!fotoKelompok) newErrors.foto_kelompok = 'Foto kelompok wajib dilampirkan.';
        if (!fotoDokumen) newErrors.foto_dokumen = 'Foto dokumen JSA/SOP/IK wajib dilampirkan.';
        if (noExternalTL && !supervisorSig) newErrors.supervisor_signature = 'Tanda tangan supervisor wajib diisi.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const formData = new FormData();
        if (teamLeaderId) formData.append('team_leader_id', teamLeaderId);
        formData.append('tanggal', tanggal);
        formData.append('lokasi', lokasi);
        formData.append('shift', shift!);
        formData.append('durasi', durasi);
        formData.append('kegiatan', kegiatan);
        formData.append('judul_dokumen', judulDokumen);
        if (catatan) formData.append('catatan', catatan);
        peserta.forEach((p, i) => {
            formData.append(`peserta[${i}][nama]`, p.nama);
            formData.append(`peserta[${i}][jabatan]`, p.jabatan);
            formData.append(`peserta[${i}][nik]`, p.nik);
            formData.append(`peserta[${i}][tanda_tangan]`, p.tanda_tangan);
        });
        if (supervisorSig) formData.append('supervisor_signature', supervisorSig);
        formData.append('foto_kelompok', fotoKelompok!);
        formData.append('foto_dokumen', fotoDokumen!);

        setProcessing(true);
        router.post('/sap/komunikasi-jsa', formData, {
            forceFormData: true,
            onError: (errs) => { setErrors(errs); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <>
            <Head title="Buat Komunikasi JSA" />
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
                <div>
                    <h2 className="text-xl font-bold">Lembar Komunikasi JSA/SOP/IK</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-026 · {user.name}</p>
                </div>

                {/* ── Informasi Dasar ── */}
                <Card>
                    <CardContent className="flex flex-col gap-5 pt-5">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="tanggal" className="text-base font-bold">Tanggal <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <Input id="tanggal" type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="h-12 text-base pr-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                            {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-bold">Lokasi <span className="text-destructive">*</span></Label>
                            <Popover open={lokasiOpen} onOpenChange={setLokasiOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={lokasiOpen}
                                        className="h-12 w-full justify-between text-base font-normal"
                                    >
                                        <span className="flex items-center gap-2">
                                            <MapPin size={16} className={lokasi ? 'text-orange-500 shrink-0' : 'text-muted-foreground shrink-0'} />
                                            {lokasi || <span className="text-muted-foreground">Pilih lokasi...</span>}
                                        </span>
                                        <ChevronsUpDown size={16} className="opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full min-w-[320px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari lokasi..." className="h-11 text-base" />
                                        <CommandList>
                                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {LOKASI_OPTIONS.map((opt) => (
                                                    <CommandItem
                                                        key={opt}
                                                        value={opt}
                                                        onSelect={val => { setLokasi(val === lokasi ? '' : val); setLokasiOpen(false); }}
                                                    >
                                                        {opt}
                                                        <Check
                                                            size={14}
                                                            className={cn('ml-auto', lokasi === opt ? 'opacity-100 text-orange-600' : 'opacity-0')}
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-bold">Shift <span className="text-destructive">*</span></Label>
                                <Select value={shift} onValueChange={v => setShift(v as 'siang' | 'malam')}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue placeholder="Pilih shift" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="siang">Siang</SelectItem>
                                        <SelectItem value="malam">Malam</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.shift && <p className="text-sm text-destructive">{errors.shift}</p>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="durasi" className="text-base font-bold">Durasi (menit) <span className="text-destructive">*</span></Label>
                                <Input id="durasi" type="number" min={1} value={durasi} onChange={e => setDurasi(e.target.value)} placeholder="Contoh: 30" className="h-12 text-base" />
                                {errors.durasi && <p className="text-sm text-destructive">{errors.durasi}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="kegiatan" className="text-base font-bold">Kegiatan <span className="text-destructive">*</span></Label>
                            <Textarea id="kegiatan" value={kegiatan} onChange={e => setKegiatan(e.target.value)} placeholder="Uraian kegiatan yang akan dilakukan" className="text-base min-h-[80px]" />
                            {errors.kegiatan && <p className="text-sm text-destructive">{errors.kegiatan}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="judul_dokumen" className="text-base font-bold">
                                Judul JSA / SOP / IK yang Dikomunikasikan <span className="text-destructive">*</span>
                            </Label>
                            <Input id="judul_dokumen" value={judulDokumen} onChange={e => setJudulDokumen(e.target.value)} placeholder="Contoh: JSA-001 Pengoperasian Excavator" className="h-12 text-base" />
                            {errors.judul_dokumen && <p className="text-sm text-destructive">{errors.judul_dokumen}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="catatan" className="text-base font-bold">Catatan / Masukan <span className="text-sm font-normal text-muted-foreground">(opsional)</span></Label>
                            <Textarea id="catatan" value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan tambahan atau masukan" className="text-base min-h-[60px]" />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Team Leader ── */}
                <div className="flex flex-col gap-2">
                    <Label className="text-base font-bold flex items-center gap-2">
                        <UserCheck size={16} />
                        Team Leader / Supervisor
                        <span className="text-sm font-normal text-muted-foreground">(opsional)</span>
                    </Label>
                    <p className="text-sm text-muted-foreground -mt-1">Jika tidak dipilih, Anda otomatis menjadi team leader dan form langsung selesai.</p>
                    <Popover open={tlOpen} onOpenChange={setTlOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="h-12 w-full justify-between text-base font-normal">
                                {selectedTL
                                    ? <span>{selectedTL.name}{selectedTL.jabatan ? ` — ${selectedTL.jabatan}` : ''}</span>
                                    : <span className="text-muted-foreground">Pilih team leader... (default: Anda)</span>}
                                <ChevronsUpDown size={16} className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[320px] p-0">
                            <Command>
                                <CommandInput placeholder="Cari nama / NIK..." />
                                <CommandList>
                                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {teamLeaderId && (
                                            <CommandItem value="__clear__" onSelect={() => { setTeamLeaderId(''); setTlOpen(false); }}>
                                                <X size={16} className="mr-2 text-destructive" />
                                                <span className="text-muted-foreground">Hapus pilihan (saya sendiri TL)</span>
                                            </CommandItem>
                                        )}
                                        {staffUsers.map(u => (
                                            <CommandItem
                                                key={u.id}
                                                value={`${u.name} ${u.nik ?? ''}`}
                                                onSelect={() => { setTeamLeaderId(String(u.id)); setTlOpen(false); }}
                                            >
                                                <Check size={16} className={cn('mr-2', String(u.id) === teamLeaderId ? 'opacity-100' : 'opacity-0')} />
                                                <span>{u.name}</span>
                                                {u.jabatan && <span className="ml-2 text-xs text-muted-foreground">{u.jabatan}</span>}
                                                {u.site && <span className="ml-1 text-xs text-muted-foreground">· {u.site}</span>}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {selectedTL && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            Form akan dikirim ke {selectedTL.name} untuk dikonfirmasi.
                        </p>
                    )}
                    {errors.team_leader_id && <p className="text-sm text-destructive">{errors.team_leader_id}</p>}
                </div>

                <Separator />

                {/* ── Daftar Peserta ── */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-bold">
                            Daftar Peserta <span className="text-destructive">*</span>
                            <span className="ml-1.5 text-sm font-normal text-muted-foreground">({peserta.length}/10)</span>
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPeserta} disabled={peserta.length >= 10} className="gap-1.5">
                            <Plus size={14} /> Tambah
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground -mt-1">
                        Yang bertanda tangan di bawah ini menyatakan sudah mendiskusikan/membaca JSA/SOP/IK, memahami dan akan melaksanakannya.
                    </p>
                    {errors.peserta && <p className="text-sm text-destructive">{errors.peserta}</p>}

                    <div className="flex flex-col gap-3">
                        {peserta.map((p, idx) => (
                            <Card key={idx} className="overflow-hidden">
                                <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-muted-foreground">Peserta {idx + 1}</span>
                                        {peserta.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePeserta(idx)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-medium">Nama <span className="text-destructive">*</span></Label>
                                        <Input value={p.nama} onChange={e => updatePeserta(idx, 'nama', e.target.value)} placeholder="Nama lengkap" className="h-10 text-sm" />
                                        {errors[`peserta_${idx}_nama`] && <p className="text-sm text-destructive">{errors[`peserta_${idx}_nama`]}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-sm font-medium">Jabatan</Label>
                                            <Input value={p.jabatan} onChange={e => updatePeserta(idx, 'jabatan', e.target.value)} placeholder="Jabatan" className="h-10 text-sm" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-sm font-medium">NIK</Label>
                                            <Input value={p.nik} onChange={e => updatePeserta(idx, 'nik', e.target.value)} placeholder="NIK" className="h-10 text-sm" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-medium">Tanda Tangan <span className="text-destructive">*</span></Label>
                                        {p.tanda_tangan ? (
                                            <div className="flex items-center gap-3">
                                                <img src={p.tanda_tangan} alt="TTD" className="h-14 border rounded bg-white object-contain" />
                                                <Button type="button" variant="outline" size="sm" onClick={() => setTtdDialogIdx(idx)} className="gap-1.5">
                                                    <PenLine size={13} /> Ubah
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button type="button" variant="outline" className="h-10 gap-2 justify-start text-muted-foreground" onClick={() => setTtdDialogIdx(idx)}>
                                                <PenLine size={15} /> Tanda tangan di sini
                                            </Button>
                                        )}
                                        {errors[`peserta_${idx}_ttd`] && <p className="text-sm text-destructive">{errors[`peserta_${idx}_ttd`]}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* ── Foto Bukti ── */}
                <div className="flex flex-col gap-3">
                    <Label className="text-base font-bold flex items-center gap-2">
                        <Camera size={16} />
                        Foto Bukti Komunikasi <span className="text-destructive">*</span>
                    </Label>

                    <div className="flex flex-col gap-3">
                        {/* Foto Kelompok */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-medium">Foto Kelompok (saat briefing berlangsung) <span className="text-destructive">*</span></Label>
                            {fotoKelompokPreview ? (
                                <div className="flex flex-col gap-2">
                                    <img src={fotoKelompokPreview} alt="Foto kelompok" className="w-full max-h-48 object-cover rounded-lg border" />
                                    <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start"
                                        onClick={() => { setFotoKelompok(null); setFotoKelompokPreview(''); }}>
                                        <X size={13} /> Hapus foto
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                                    <Camera size={28} className="text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Ketuk untuk ambil/pilih foto kelompok</span>
                                    <input type="file" accept="image/*" capture="environment" className="hidden"
                                        onChange={e => handleFotoChange('kelompok', e.target.files?.[0] ?? null)} />
                                </label>
                            )}
                            {errors.foto_kelompok && <p className="text-sm text-destructive">{errors.foto_kelompok}</p>}
                        </div>

                        {/* Foto Dokumen */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-medium">Foto Dokumen JSA/SOP/IK yang Dikomunikasikan <span className="text-destructive">*</span></Label>
                            {fotoDokumenPreview ? (
                                <div className="flex flex-col gap-2">
                                    <img src={fotoDokumenPreview} alt="Foto dokumen" className="w-full max-h-48 object-cover rounded-lg border" />
                                    <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start"
                                        onClick={() => { setFotoDokumen(null); setFotoDokumenPreview(''); }}>
                                        <X size={13} /> Hapus foto
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                                    <BookOpen size={28} className="text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Ketuk untuk ambil/pilih foto dokumen JSA/SOP/IK</span>
                                    <input type="file" accept="image/*" capture="environment" className="hidden"
                                        onChange={e => handleFotoChange('dokumen', e.target.files?.[0] ?? null)} />
                                </label>
                            )}
                            {errors.foto_dokumen && <p className="text-sm text-destructive">{errors.foto_dokumen}</p>}
                        </div>
                    </div>
                </div>

                {/* ── TTD Supervisor (jika tidak ada TL eksternal) ── */}
                {noExternalTL && (
                    <>
                        <Separator />
                        <div className="flex flex-col gap-3">
                            <Label className="text-base font-bold">Tanda Tangan Supervisor <span className="text-destructive">*</span></Label>
                            <p className="text-sm text-muted-foreground -mt-1">{user.name}{user.jabatan ? ` — ${user.jabatan}` : ''}</p>
                            {supervisorSig ? (
                                <div className="flex items-center gap-3">
                                    <img src={supervisorSig} alt="TTD Supervisor" className="h-20 border rounded bg-white object-contain" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowSupervisorSig(true)} className="gap-1.5">
                                        <PenLine size={13} /> Ubah
                                    </Button>
                                </div>
                            ) : (
                                <Button type="button" variant="outline" className="h-12 gap-2 justify-start text-muted-foreground" onClick={() => setShowSupervisorSig(true)}>
                                    <PenLine size={16} /> Tanda tangan supervisor di sini
                                </Button>
                            )}
                            {errors.supervisor_signature && <p className="text-sm text-destructive">{errors.supervisor_signature}</p>}
                        </div>
                    </>
                )}

                <Button type="submit" disabled={processing} className="h-12 text-base font-bold gap-2 mt-2">
                    <BookOpen size={18} />
                    {processing ? 'Menyimpan...' : teamLeaderId ? 'Kirim untuk Dikonfirmasi' : 'Simpan Lembar Komunikasi'}
                </Button>
            </form>

            {/* Dialog TTD Peserta */}
            <Dialog open={ttdDialogIdx !== null} onOpenChange={open => !open && setTtdDialogIdx(null)}>
                <DialogContent className="max-w-sm" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Tanda Tangan Peserta {ttdDialogIdx !== null ? ttdDialogIdx + 1 : ''}</DialogTitle>
                    </DialogHeader>
                    {ttdDialogIdx !== null && (
                        <SignaturePad onSave={handleTtdSave} onCancel={() => setTtdDialogIdx(null)} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog TTD Supervisor */}
            <Dialog open={showSupervisorSig} onOpenChange={setShowSupervisorSig}>
                <DialogContent className="max-w-sm" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Tanda Tangan Supervisor</DialogTitle>
                    </DialogHeader>
                    <SignaturePad onSave={sig => { setSupervisorSig(sig); setShowSupervisorSig(false); }} onCancel={() => setShowSupervisorSig(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
