import { Head, useForm } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, ClipboardCheck, MapPin, Wrench } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type UserInfo = { name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type StaffUser = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type Props = { user: UserInfo; staffUsers: StaffUser[] };

const LOKASI_OPTIONS = [
    'Tambang / Pit', 'Jalan Hauling OB', 'Jalan Hauling COAL', 'Disposal', 'Sump',
    'Area Parkir', 'Pit Stop / Area Refueling', 'Workshop', 'Warehouse', 'Laydown B3',
    'TPS Limbah B3', 'Office', 'Stock Room', 'Crusher Stock Pile', 'Mess', 'Katering',
    'Jalan Warga / Raya', 'Area Vendor', 'Water Fill', 'Washing Pad',
    'Area Pembagian Nasi', 'Unit/Peralatan', 'Lainnya',
];

type ChecklistVal = 'aman' | 'beresiko' | '';

const CHECKLIST_CATEGORIES = [
    {
        key: 'prosedur',
        label: '1.0 Prosedur',
        items: [
            { key: 'cl_prosedur_mine_permit',     label: '1.1 Mine Permit / Ijin Masuk Lokasi Tambang' },
            { key: 'cl_prosedur_komisioning',     label: '1.2 Komisioning / Inspeksi' },
            { key: 'cl_prosedur_p2h',             label: '1.3 Pelaksanaan Pemeriksaan Harian (P2H)' },
            { key: 'cl_prosedur_instruksi_kerja', label: '1.4 Instruksi Kerja / Tata Cara Kerja Aman' },
            { key: 'cl_prosedur_loto',            label: '1.5 Sistem Penguncian & Pelabelan (LOTO)' },
            { key: 'cl_prosedur_sop_jsa',         label: '1.6 SOP / JSA (Job Safety Analysis)' },
        ],
    },
    {
        key: 'apd',
        label: '2.0 Alat Pelindung Diri (APD)',
        items: [
            { key: 'cl_apd_kepala',              label: '2.1 Kepala' },
            { key: 'cl_apd_mata_wajah',          label: '2.2 Mata dan Wajah' },
            { key: 'cl_apd_pendengaran',         label: '2.3 Pendengaran' },
            { key: 'cl_apd_pernapasan',          label: '2.4 Sistem Pernapasan' },
            { key: 'cl_apd_pelindung_jatuh',     label: '2.5 Alat Pelindung Jatuh' },
            { key: 'cl_apd_pelindung_tenggelam', label: '2.6 Alat Pelindung Tenggelam' },
            { key: 'cl_apd_lengan_tangan',       label: '2.7 Lengan dan Tangan' },
            { key: 'cl_apd_paha_kaki',           label: '2.8 Paha dan Kaki' },
        ],
    },
    {
        key: 'posisi',
        label: '3.0 Posisi Badan & Reaksi Orang',
        items: [
            { key: 'cl_posisi_mengangkat',          label: '3.1 Cara Mengangkat, Mendorong, Menarik' },
            { key: 'cl_posisi_mengubah_posisi',     label: '3.2 Mengubah Posisi' },
            { key: 'cl_posisi_mengatur_pekerjaan',  label: '3.3 Mengatur Pekerjaan' },
            { key: 'cl_posisi_dekat_listrik',       label: '3.4 Dekat dengan Arus Listrik Bertegangan' },
            { key: 'cl_posisi_dekat_berbahaya',     label: '3.5 Dekat dengan Area atau Bahan Berbahaya' },
            { key: 'cl_posisi_dekat_longsor',       label: '3.6 Dekat dengan Dinding/Galian Rawan Longsor' },
            { key: 'cl_posisi_dekat_air',           label: '3.6b Dekat dengan Air' },
            { key: 'cl_posisi_turun_naik',          label: '3.7 Turun / Naik' },
        ],
    },
    {
        key: 'kendaraan',
        label: '4.0 Berkendara & Mengoperasikan Unit',
        items: [
            { key: 'cl_kendaraan_sim_sio',    label: '4.1 SIM / SIO / SIMPER' },
            { key: 'cl_kendaraan_sabuk',      label: '4.2 Sabuk Keselamatan' },
            { key: 'cl_kendaraan_kecepatan',  label: '4.3 Batas Kecepatan' },
            { key: 'cl_kendaraan_jarak',      label: '4.4 Jarak Kendaraan / Beriringan' },
            { key: 'cl_kendaraan_haluan',     label: '4.5 Cara Mengambil Haluan' },
            { key: 'cl_kendaraan_buggy_whip', label: '4.6 Bendera Tanda Kendaraan / Buggy Whip' },
            { key: 'cl_kendaraan_radio',      label: '4.7 Radio Komunikasi' },
            { key: 'cl_kendaraan_lampu',      label: '4.8 Lampu Rotary / Lampu Utama' },
        ],
    },
    {
        key: 'peralatan',
        label: '5.0 Peralatan dan Perlindungan',
        items: [
            { key: 'cl_peralatan_pemilihan',    label: '5.1 Pemilihan & Penggunaan Peralatan' },
            { key: 'cl_peralatan_safety_guard', label: '5.2 Pelindung Peralatan / Safety Guard' },
            { key: 'cl_peralatan_pemakaian',    label: '5.3 Pemakaian Peralatan' },
            { key: 'cl_peralatan_angkat',       label: '5.4 Peralatan Angkat' },
            { key: 'cl_peralatan_elektrikal',   label: '5.5 Peralatan Elektrikal' },
            { key: 'cl_peralatan_tangan',       label: '5.6 Peralatan Tangan' },
        ],
    },
    {
        key: 'lingkungan',
        label: '6.0 Daerah Kerja & Lingkungan',
        items: [
            { key: 'cl_lingkungan_kebersihan',  label: '6.1 Kebersihan & Kerapian Area Kerja' },
            { key: 'cl_lingkungan_tumpahan',    label: '6.2 Pencegahan Tumpahan / Kebocoran' },
            { key: 'cl_lingkungan_pencahayaan', label: '6.3 Pencahayaan / Penerangan' },
            { key: 'cl_lingkungan_kebisingan',  label: '6.4 Kebisingan, Suhu, Getaran' },
            { key: 'cl_lingkungan_barikade',    label: '6.5 Perlindungan / Barikade' },
            { key: 'cl_lingkungan_rambu',       label: '6.6 Rambu-Rambu Peringatan & Delineator' },
            { key: 'cl_lingkungan_limbah',      label: '6.7 Pengaturan Limbah & Sampah' },
        ],
    },
] as const;

type FormData = {
    penanggung_jawab_id: string;
    tanggal: string;
    jenis_pekerjaan: string;
    lokasi_kerja: string;
    peralatan_digunakan: string;
    // checklists
    cl_prosedur_mine_permit: ChecklistVal;
    cl_prosedur_komisioning: ChecklistVal;
    cl_prosedur_p2h: ChecklistVal;
    cl_prosedur_instruksi_kerja: ChecklistVal;
    cl_prosedur_loto: ChecklistVal;
    cl_prosedur_sop_jsa: ChecklistVal;
    cl_apd_kepala: ChecklistVal;
    cl_apd_mata_wajah: ChecklistVal;
    cl_apd_pendengaran: ChecklistVal;
    cl_apd_pernapasan: ChecklistVal;
    cl_apd_pelindung_jatuh: ChecklistVal;
    cl_apd_pelindung_tenggelam: ChecklistVal;
    cl_apd_lengan_tangan: ChecklistVal;
    cl_apd_paha_kaki: ChecklistVal;
    cl_posisi_mengangkat: ChecklistVal;
    cl_posisi_mengubah_posisi: ChecklistVal;
    cl_posisi_mengatur_pekerjaan: ChecklistVal;
    cl_posisi_dekat_listrik: ChecklistVal;
    cl_posisi_dekat_berbahaya: ChecklistVal;
    cl_posisi_dekat_longsor: ChecklistVal;
    cl_posisi_dekat_air: ChecklistVal;
    cl_posisi_turun_naik: ChecklistVal;
    cl_kendaraan_sim_sio: ChecklistVal;
    cl_kendaraan_sabuk: ChecklistVal;
    cl_kendaraan_kecepatan: ChecklistVal;
    cl_kendaraan_jarak: ChecklistVal;
    cl_kendaraan_haluan: ChecklistVal;
    cl_kendaraan_buggy_whip: ChecklistVal;
    cl_kendaraan_radio: ChecklistVal;
    cl_kendaraan_lampu: ChecklistVal;
    cl_peralatan_pemilihan: ChecklistVal;
    cl_peralatan_safety_guard: ChecklistVal;
    cl_peralatan_pemakaian: ChecklistVal;
    cl_peralatan_angkat: ChecklistVal;
    cl_peralatan_elektrikal: ChecklistVal;
    cl_peralatan_tangan: ChecklistVal;
    cl_lingkungan_kebersihan: ChecklistVal;
    cl_lingkungan_tumpahan: ChecklistVal;
    cl_lingkungan_pencahayaan: ChecklistVal;
    cl_lingkungan_kebisingan: ChecklistVal;
    cl_lingkungan_barikade: ChecklistVal;
    cl_lingkungan_rambu: ChecklistVal;
    cl_lingkungan_limbah: ChecklistVal;
    ll_1_label: string; ll_1_nilai: ChecklistVal;
    ll_2_label: string; ll_2_nilai: ChecklistVal;
    ll_3_label: string; ll_3_nilai: ChecklistVal;
    ll_4_label: string; ll_4_nilai: ChecklistVal;
    // Narasi
    tindakan_kondisi_aman: string;
    tindakan_meningkatkan_selamat: string;
    tindakan_kondisi_tidak_aman: string;
    tindakan_segera: string;
    tindakan_mencegah_terulang: string;
    status_temuan: string[];
    catatan: string;
};

const CHECKLIST_KEYS = CHECKLIST_CATEGORIES.flatMap(c => c.items.map(i => i.key));
const LL_NILAI_KEYS = ['ll_1_nilai', 'll_2_nilai', 'll_3_nilai', 'll_4_nilai'] as const;
const ALL_CL_KEYS = [...CHECKLIST_KEYS, ...LL_NILAI_KEYS] as (keyof FormData)[];

const STATUS_TEMUAN_OPTIONS = [
    { value: 'sudah_selesai',       label: 'Sudah Diperbaiki / Selesai' },
    { value: 'perlu_penanganan',    label: 'Perlu Penanganan Khusus' },
    { value: 'sedang_diperbaiki',   label: 'Sedang Diperbaiki' },
    { value: 'menunggu_material',   label: 'Menunggu Material / Peralatan' },
] as const;

const STEPS = [
    { icon: '📋', label: 'Info Umum' },
    { icon: '✅', label: 'Checklist' },
    { icon: '📝', label: 'Temuan' },
];

function ChecklistToggle({
    value,
    onChange,
}: { value: ChecklistVal; onChange: (v: ChecklistVal) => void }) {
    return (
        <div className="flex gap-1.5">
            {(['aman', 'beresiko'] as const).map((v) => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onChange(value === v ? '' : v)}
                    className={cn(
                        'flex h-9 items-center justify-center rounded-lg border-2 px-3 text-sm font-bold transition-all',
                        v === 'aman' && value === 'aman'   && 'border-green-400 bg-green-100 text-green-700 dark:bg-green-950/40',
                        v === 'beresiko' && value === 'beresiko' && 'border-red-400 bg-red-100 text-red-700 dark:bg-red-950/40',
                        value !== v && 'border-border bg-background text-muted-foreground hover:border-primary/30',
                    )}
                >
                    {v === 'aman' ? 'Aman' : 'Beresiko'}
                </button>
            ))}
        </div>
    );
}

export default function ObservasiKeselamatanCreate({ user, staffUsers }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const [step, setStep] = useState(0);
    const [pjOpen, setPjOpen] = useState(false);
    const [lokasiOpen, setLokasiOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        penanggung_jawab_id: '',
        tanggal: today,
        jenis_pekerjaan: '',
        lokasi_kerja: '',
        peralatan_digunakan: '',
        cl_prosedur_mine_permit: '', cl_prosedur_komisioning: '', cl_prosedur_p2h: '',
        cl_prosedur_instruksi_kerja: '', cl_prosedur_loto: '', cl_prosedur_sop_jsa: '',
        cl_apd_kepala: '', cl_apd_mata_wajah: '', cl_apd_pendengaran: '', cl_apd_pernapasan: '',
        cl_apd_pelindung_jatuh: '', cl_apd_pelindung_tenggelam: '', cl_apd_lengan_tangan: '', cl_apd_paha_kaki: '',
        cl_posisi_mengangkat: '', cl_posisi_mengubah_posisi: '', cl_posisi_mengatur_pekerjaan: '',
        cl_posisi_dekat_listrik: '', cl_posisi_dekat_berbahaya: '', cl_posisi_dekat_longsor: '',
        cl_posisi_dekat_air: '', cl_posisi_turun_naik: '',
        cl_kendaraan_sim_sio: '', cl_kendaraan_sabuk: '', cl_kendaraan_kecepatan: '',
        cl_kendaraan_jarak: '', cl_kendaraan_haluan: '', cl_kendaraan_buggy_whip: '',
        cl_kendaraan_radio: '', cl_kendaraan_lampu: '',
        cl_peralatan_pemilihan: '', cl_peralatan_safety_guard: '', cl_peralatan_pemakaian: '',
        cl_peralatan_angkat: '', cl_peralatan_elektrikal: '', cl_peralatan_tangan: '',
        cl_lingkungan_kebersihan: '', cl_lingkungan_tumpahan: '', cl_lingkungan_pencahayaan: '',
        cl_lingkungan_kebisingan: '', cl_lingkungan_barikade: '', cl_lingkungan_rambu: '', cl_lingkungan_limbah: '',
        ll_1_label: '', ll_1_nilai: '',
        ll_2_label: '', ll_2_nilai: '',
        ll_3_label: '', ll_3_nilai: '',
        ll_4_label: '', ll_4_nilai: '',
        tindakan_kondisi_aman: '',
        tindakan_meningkatkan_selamat: '',
        tindakan_kondisi_tidak_aman: '',
        tindakan_segera: '',
        tindakan_mencegah_terulang: '',
        status_temuan: [],
        catatan: '',
    });

    const filledCount = ALL_CL_KEYS.filter(k => data[k] !== '').length;
    const totalCount = ALL_CL_KEYS.length;

    const step1OK = !!(data.tanggal && data.jenis_pekerjaan && data.lokasi_kerja);

    const selectedPj = staffUsers.find(u => String(u.id) === data.penanggung_jawab_id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!step1OK) return;
        post('/sap/observasi-keselamatan');
    };

    const StepBar = () => (
        <div className="flex items-center gap-0 mb-6">
            {STEPS.map((s, i) => (
                <Fragment key={s.label}>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className={cn(
                            'flex size-11 items-center justify-center rounded-full text-lg font-bold transition-all border-2',
                            i < step   && 'bg-primary border-primary text-primary-foreground',
                            i === step && 'border-primary bg-primary/10 text-primary',
                            i > step   && 'border-muted-foreground/30 bg-muted text-muted-foreground',
                        )}>
                            {i < step ? <Check size={18} /> : <span>{s.icon}</span>}
                        </div>
                        <span className={cn(
                            'text-[11px] font-semibold text-center leading-tight max-w-[56px]',
                            i === step ? 'text-primary' : 'text-muted-foreground',
                        )}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={cn('flex-1 h-0.5 mb-5 mx-1 transition-all', i < step ? 'bg-primary' : 'bg-muted')} />
                    )}
                </Fragment>
            ))}
        </div>
    );

    const NavButtons = ({ canNext = true }: { canNext?: boolean }) => (
        <div className="flex items-center justify-between gap-3 pt-2">
            {step > 0
                ? <Button type="button" variant="outline" className="h-12 px-6 text-base gap-2" onClick={() => setStep(s => s - 1)}>
                    <ChevronLeft size={18} /> Kembali
                  </Button>
                : <div />}
            {step < STEPS.length - 1
                ? <Button type="button" className="h-12 px-6 text-base gap-2" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
                    Lanjut <ChevronRight size={18} />
                  </Button>
                : <Button type="submit" className="h-12 px-6 text-base font-bold gap-2" disabled={processing || !step1OK}>
                    <ClipboardCheck size={18} /> Simpan Form OK
                  </Button>}
        </div>
    );

    return (
        <>
            <Head title="Buat Observasi Keselamatan" />
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
                <div>
                    <h2 className="text-xl font-bold">Observasi Keselamatan</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-037 · {user.name}</p>
                </div>

                <StepBar />

                {/* ── STEP 1: Informasi Umum ── */}
                {step === 0 && (
                    <div className="flex flex-col gap-5">
                        {/* Tanggal */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="tanggal" className="text-base font-bold">Tanggal <span className="text-destructive">*</span></Label>
                            <Input
                                id="tanggal"
                                type="date"
                                value={data.tanggal}
                                onChange={e => setData('tanggal', e.target.value)}
                                className="h-12 text-base block text-left"
                            />
                            {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
                        </div>

                        {/* PJ */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-bold">
                                Penanggung Jawab
                                <span className="ml-1.5 text-sm font-normal text-muted-foreground">(opsional, default: Anda)</span>
                            </Label>
                            <Popover open={pjOpen} onOpenChange={setPjOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="h-12 w-full justify-between text-base font-normal">
                                        {selectedPj
                                            ? <span>{selectedPj.name}{selectedPj.jabatan ? ` — ${selectedPj.jabatan}` : ''}</span>
                                            : <span className="text-muted-foreground">Pilih penanggung jawab... (default: Anda)</span>}
                                        <ChevronsUpDown size={16} className="opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full min-w-[320px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari nama / NIK..." />
                                        <CommandList>
                                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {staffUsers.map(u => (
                                                    <CommandItem
                                                        key={u.id}
                                                        value={`${u.name} ${u.nik ?? ''}`}
                                                        onSelect={() => { setData('penanggung_jawab_id', String(u.id)); setPjOpen(false); }}
                                                    >
                                                        <Check size={16} className={cn('mr-2', String(u.id) === data.penanggung_jawab_id ? 'opacity-100' : 'opacity-0')} />
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
                            {errors.penanggung_jawab_id && <p className="text-sm text-destructive">{errors.penanggung_jawab_id}</p>}
                        </div>

                        {/* Jenis Pekerjaan */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="jenis_pekerjaan" className="text-base font-bold">
                                Jenis Pekerjaan <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="jenis_pekerjaan"
                                value={data.jenis_pekerjaan}
                                onChange={e => setData('jenis_pekerjaan', e.target.value)}
                                placeholder="Contoh: Pengoperasian Excavator di Pit A"
                                className="h-12 text-base"
                            />
                            {errors.jenis_pekerjaan && <p className="text-sm text-destructive">{errors.jenis_pekerjaan}</p>}
                        </div>

                        {/* Lokasi Kerja */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-bold">
                                <MapPin size={16} className="inline mr-1" />
                                Lokasi Kerja <span className="text-destructive">*</span>
                            </Label>
                            <Popover open={lokasiOpen} onOpenChange={setLokasiOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="h-12 w-full justify-between text-base font-normal">
                                        {data.lokasi_kerja
                                            ? <span>{data.lokasi_kerja}</span>
                                            : <span className="text-muted-foreground">Pilih atau ketik lokasi...</span>}
                                        <ChevronsUpDown size={16} className="opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full min-w-[320px] p-0">
                                    <Command>
                                        <CommandInput
                                            placeholder="Cari lokasi..."
                                            onValueChange={v => setData('lokasi_kerja', v)}
                                        />
                                        <CommandList>
                                            <CommandGroup>
                                                {LOKASI_OPTIONS.map(l => (
                                                    <CommandItem key={l} value={l} onSelect={() => { setData('lokasi_kerja', l); setLokasiOpen(false); }}>
                                                        <Check size={16} className={cn('mr-2', data.lokasi_kerja === l ? 'opacity-100' : 'opacity-0')} />
                                                        {l}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {errors.lokasi_kerja && <p className="text-sm text-destructive">{errors.lokasi_kerja}</p>}
                        </div>

                        {/* Peralatan */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="peralatan" className="text-base font-bold">
                                <Wrench size={16} className="inline mr-1" />
                                Peralatan yang Digunakan
                            </Label>
                            <Input
                                id="peralatan"
                                value={data.peralatan_digunakan}
                                onChange={e => setData('peralatan_digunakan', e.target.value)}
                                placeholder="Contoh: Excavator PC200, Dump Truck"
                                className="h-12 text-base"
                            />
                        </div>

                        <NavButtons canNext={step1OK} />
                    </div>
                )}

                {/* ── STEP 2: Checklist Audit ── */}
                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        {/* Progress */}
                        <div className="rounded-2xl border bg-muted/30 p-4 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between mb-1.5 text-sm font-semibold">
                                    <span>Item terisi</span>
                                    <span>{filledCount} / {totalCount}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${Math.round((filledCount / totalCount) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Checklist categories */}
                        {CHECKLIST_CATEGORIES.map(cat => (
                            <Card key={cat.key} className="p-0 overflow-hidden">
                                <div className="bg-muted/50 px-4 py-3 border-b">
                                    <p className="font-bold text-sm">{cat.label}</p>
                                </div>
                                <CardContent className="p-0">
                                    {cat.items.map((item, idx) => (
                                        <Fragment key={item.key}>
                                            <div className={cn(
                                                'flex items-center justify-between gap-3 px-4 py-3',
                                                (data[item.key as keyof FormData] as ChecklistVal) === 'beresiko' && 'bg-red-50/50 dark:bg-red-950/10',
                                                (data[item.key as keyof FormData] as ChecklistVal) === 'aman' && 'bg-green-50/50 dark:bg-green-950/10',
                                            )}>
                                                <p className="text-sm flex-1 leading-snug">{item.label}</p>
                                                <ChecklistToggle
                                                    value={data[item.key as keyof FormData] as ChecklistVal}
                                                    onChange={v => setData(item.key as keyof FormData, v)}
                                                />
                                            </div>
                                            {idx < cat.items.length - 1 && <Separator />}
                                        </Fragment>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}

                        {/* 7.0 Lain-lain */}
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b">
                                <p className="font-bold text-sm">7.0 Lain-Lain</p>
                            </div>
                            <CardContent className="p-0">
                                {([1, 2, 3, 4] as const).map((n, idx) => {
                                    const labelKey = `ll_${n}_label` as keyof FormData;
                                    const nilaiKey = `ll_${n}_nilai` as keyof FormData;
                                    return (
                                        <Fragment key={n}>
                                            <div className={cn(
                                                'flex items-center gap-3 px-4 py-3',
                                                (data[nilaiKey] as ChecklistVal) === 'beresiko' && 'bg-red-50/50 dark:bg-red-950/10',
                                                (data[nilaiKey] as ChecklistVal) === 'aman' && 'bg-green-50/50 dark:bg-green-950/10',
                                            )}>
                                                <span className="text-sm text-muted-foreground shrink-0">7.{n}</span>
                                                <Input
                                                    value={data[labelKey] as string}
                                                    onChange={e => setData(labelKey, e.target.value)}
                                                    placeholder={`Item tambahan ${n}...`}
                                                    className="h-9 text-sm flex-1"
                                                />
                                                <ChecklistToggle
                                                    value={data[nilaiKey] as ChecklistVal}
                                                    onChange={v => setData(nilaiKey, v)}
                                                />
                                            </div>
                                            {idx < 3 && <Separator />}
                                        </Fragment>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <NavButtons />
                    </div>
                )}

                {/* ── STEP 3: Temuan & Tindakan ── */}
                {step === 2 && (
                    <div className="flex flex-col gap-5">
                        {[
                            { key: 'tindakan_kondisi_aman',         label: 'Tindakan / Kondisi Aman yang Diamati' },
                            { key: 'tindakan_meningkatkan_selamat', label: 'Tindakan untuk Meningkatkan Kerja Selamat' },
                            { key: 'tindakan_kondisi_tidak_aman',   label: 'Tindakan / Kondisi Tidak Aman yang Diamati' },
                            { key: 'tindakan_segera',               label: 'Tindakan yang Diambil Segera' },
                            { key: 'tindakan_mencegah_terulang',    label: 'Tindakan untuk Mencegah Terulang Kembali' },
                        ].map(({ key, label }) => (
                            <div key={key} className="flex flex-col gap-2">
                                <Label htmlFor={key} className="text-base font-bold">{label}</Label>
                                <Textarea
                                    id={key}
                                    value={data[key as keyof FormData] as string}
                                    onChange={e => setData(key as keyof FormData, e.target.value)}
                                    placeholder="Deskripsikan..."
                                    className="text-base min-h-[80px]"
                                    rows={3}
                                />
                            </div>
                        ))}

                        {/* Status Temuan */}
                        <div className="flex flex-col gap-3">
                            <Label className="text-base font-bold">Status Temuan</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {STATUS_TEMUAN_OPTIONS.map(({ value, label }) => {
                                    const checked = data.status_temuan.includes(value);
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => {
                                                const next = checked
                                                    ? data.status_temuan.filter(v => v !== value)
                                                    : [...data.status_temuan, value];
                                                setData('status_temuan', next);
                                            }}
                                            className={cn(
                                                'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                                                checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30',
                                            )}
                                        >
                                            <div className={cn(
                                                'flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                                                checked ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                                            )}>
                                                {checked && <Check size={13} className="text-primary-foreground" />}
                                            </div>
                                            <span className="text-sm font-medium">{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Catatan */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="catatan" className="text-base font-bold">
                                Catatan Tambahan
                                <span className="ml-2 text-sm font-normal text-muted-foreground">(opsional)</span>
                            </Label>
                            <Textarea
                                id="catatan"
                                value={data.catatan}
                                onChange={e => setData('catatan', e.target.value)}
                                placeholder="Catatan lain..."
                                className="text-base min-h-[80px]"
                                rows={3}
                            />
                        </div>

                        {/* Disclaimer */}
                        <div className="rounded-2xl border bg-muted/40 px-4 py-4 text-sm italic text-muted-foreground leading-relaxed">
                            <strong className="font-bold not-italic text-foreground">SAYA PILIH SELAMAT</strong> —
                            Dengan menyimpan form ini saya menyatakan bahwa data yang diisi adalah benar sesuai kondisi di lapangan.
                            {selectedPj && (
                                <> Form ini akan dikirim ke <strong className="not-italic text-foreground">{selectedPj.name}</strong> sebagai Penanggung Jawab untuk dikonfirmasi.</>
                            )}
                        </div>

                        <NavButtons />
                    </div>
                )}
            </form>
        </>
    );
}
