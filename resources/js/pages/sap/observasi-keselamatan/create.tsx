import { Head, useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { choiceSurface } from '@/components/patterns/choice-card';
import { ComboField } from '@/components/patterns/combo-field';
import { FormStepper } from '@/components/patterns/form-stepper';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { SiteCombobox } from '@/components/site-combobox';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadOverlay } from '@/components/upload-overlay';
import { useDraft } from '@/hooks/use-draft';
import { cn } from '@/lib/utils';

type UserInfo = {
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
};
type StaffUser = {
    id: number;
    name: string;
    nik?: string | null;
    jabatan?: string | null;
    site?: string | null;
    sites: string[];
};
type SiteOption = { value: string; label: string; locations?: string[] | null };
type Props = { user: UserInfo; staffUsers: StaffUser[]; sites: SiteOption[] };

type ChecklistVal = 'aman' | 'beresiko' | '';

const CHECKLIST_CATEGORIES = [
    {
        key: 'prosedur',
        label: '1.0 Prosedur',
        items: [
            {
                key: 'cl_prosedur_mine_permit',
                label: '1.1 Mine Permit / Ijin Masuk Lokasi Tambang',
            },
            {
                key: 'cl_prosedur_komisioning',
                label: '1.2 Komisioning / Inspeksi',
            },
            {
                key: 'cl_prosedur_p2h',
                label: '1.3 Pelaksanaan Pemeriksaan Harian (P2H)',
            },
            {
                key: 'cl_prosedur_instruksi_kerja',
                label: '1.4 Instruksi Kerja / Tata Cara Kerja Aman',
            },
            {
                key: 'cl_prosedur_loto',
                label: '1.5 Sistem Penguncian & Pelabelan (LOTO)',
            },
            {
                key: 'cl_prosedur_sop_jsa',
                label: '1.6 SOP / JSA (Job Safety Analysis)',
            },
        ],
    },
    {
        key: 'apd',
        label: '2.0 Alat Pelindung Diri (APD)',
        items: [
            { key: 'cl_apd_kepala', label: '2.1 Kepala' },
            { key: 'cl_apd_mata_wajah', label: '2.2 Mata dan Wajah' },
            { key: 'cl_apd_pendengaran', label: '2.3 Pendengaran' },
            { key: 'cl_apd_pernapasan', label: '2.4 Sistem Pernapasan' },
            {
                key: 'cl_apd_pelindung_jatuh',
                label: '2.5 Alat Pelindung Jatuh',
            },
            {
                key: 'cl_apd_pelindung_tenggelam',
                label: '2.6 Alat Pelindung Tenggelam',
            },
            { key: 'cl_apd_lengan_tangan', label: '2.7 Lengan dan Tangan' },
            { key: 'cl_apd_paha_kaki', label: '2.8 Paha dan Kaki' },
        ],
    },
    {
        key: 'posisi',
        label: '3.0 Posisi Badan & Reaksi Orang',
        items: [
            {
                key: 'cl_posisi_mengangkat',
                label: '3.1 Cara Mengangkat, Mendorong, Menarik',
            },
            { key: 'cl_posisi_mengubah_posisi', label: '3.2 Mengubah Posisi' },
            {
                key: 'cl_posisi_mengatur_pekerjaan',
                label: '3.3 Mengatur Pekerjaan',
            },
            {
                key: 'cl_posisi_dekat_listrik',
                label: '3.4 Dekat dengan Arus Listrik Bertegangan',
            },
            {
                key: 'cl_posisi_dekat_berbahaya',
                label: '3.5 Dekat dengan Area atau Bahan Berbahaya',
            },
            {
                key: 'cl_posisi_dekat_longsor',
                label: '3.6 Dekat dengan Dinding/Galian Rawan Longsor',
            },
            { key: 'cl_posisi_dekat_air', label: '3.6b Dekat dengan Air' },
            { key: 'cl_posisi_turun_naik', label: '3.7 Turun / Naik' },
        ],
    },
    {
        key: 'kendaraan',
        label: '4.0 Berkendara & Mengoperasikan Unit',
        items: [
            { key: 'cl_kendaraan_sim_sio', label: '4.1 SIM / SIO / SIMPER' },
            { key: 'cl_kendaraan_sabuk', label: '4.2 Sabuk Keselamatan' },
            { key: 'cl_kendaraan_kecepatan', label: '4.3 Batas Kecepatan' },
            {
                key: 'cl_kendaraan_jarak',
                label: '4.4 Jarak Kendaraan / Beriringan',
            },
            { key: 'cl_kendaraan_haluan', label: '4.5 Cara Mengambil Haluan' },
            {
                key: 'cl_kendaraan_buggy_whip',
                label: '4.6 Bendera Tanda Kendaraan / Buggy Whip',
            },
            { key: 'cl_kendaraan_radio', label: '4.7 Radio Komunikasi' },
            {
                key: 'cl_kendaraan_lampu',
                label: '4.8 Lampu Rotary / Lampu Utama',
            },
        ],
    },
    {
        key: 'peralatan',
        label: '5.0 Peralatan dan Perlindungan',
        items: [
            {
                key: 'cl_peralatan_pemilihan',
                label: '5.1 Pemilihan & Penggunaan Peralatan',
            },
            {
                key: 'cl_peralatan_safety_guard',
                label: '5.2 Pelindung Peralatan / Safety Guard',
            },
            { key: 'cl_peralatan_pemakaian', label: '5.3 Pemakaian Peralatan' },
            { key: 'cl_peralatan_angkat', label: '5.4 Peralatan Angkat' },
            {
                key: 'cl_peralatan_elektrikal',
                label: '5.5 Peralatan Elektrikal',
            },
            { key: 'cl_peralatan_tangan', label: '5.6 Peralatan Tangan' },
        ],
    },
    {
        key: 'lingkungan',
        label: '6.0 Daerah Kerja & Lingkungan',
        items: [
            {
                key: 'cl_lingkungan_kebersihan',
                label: '6.1 Kebersihan & Kerapian Area Kerja',
            },
            {
                key: 'cl_lingkungan_tumpahan',
                label: '6.2 Pencegahan Tumpahan / Kebocoran',
            },
            {
                key: 'cl_lingkungan_pencahayaan',
                label: '6.3 Pencahayaan / Penerangan',
            },
            {
                key: 'cl_lingkungan_kebisingan',
                label: '6.4 Kebisingan, Suhu, Getaran',
            },
            {
                key: 'cl_lingkungan_barikade',
                label: '6.5 Perlindungan / Barikade',
            },
            {
                key: 'cl_lingkungan_rambu',
                label: '6.6 Rambu-Rambu Peringatan & Delineator',
            },
            {
                key: 'cl_lingkungan_limbah',
                label: '6.7 Pengaturan Limbah & Sampah',
            },
        ],
    },
] as const;

type FormData = {
    site: string;
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
    ll_1_label: string;
    ll_1_nilai: ChecklistVal;
    ll_2_label: string;
    ll_2_nilai: ChecklistVal;
    ll_3_label: string;
    ll_3_nilai: ChecklistVal;
    ll_4_label: string;
    ll_4_nilai: ChecklistVal;
    // Narasi
    tindakan_kondisi_aman: string;
    tindakan_meningkatkan_selamat: string;
    tindakan_kondisi_tidak_aman: string;
    tindakan_segera: string;
    tindakan_mencegah_terulang: string;
    status_temuan: string[];
    catatan: string;
};

const CHECKLIST_KEYS = CHECKLIST_CATEGORIES.flatMap((c) =>
    c.items.map((i) => i.key),
);
const LL_NILAI_KEYS = [
    'll_1_nilai',
    'll_2_nilai',
    'll_3_nilai',
    'll_4_nilai',
] as const;
const ALL_CL_KEYS = [...CHECKLIST_KEYS, ...LL_NILAI_KEYS] as (keyof FormData)[];

const STATUS_TEMUAN_OPTIONS = [
    { value: 'sudah_selesai', label: 'Sudah Diperbaiki / Selesai' },
    { value: 'perlu_penanganan', label: 'Perlu Penanganan Khusus' },
    { value: 'sedang_diperbaiki', label: 'Sedang Diperbaiki' },
    { value: 'menunggu_material', label: 'Menunggu Material / Peralatan' },
] as const;

const NARASI = [
    {
        key: 'tindakan_kondisi_aman',
        label: 'Tindakan / kondisi aman yang diamati',
    },
    {
        key: 'tindakan_meningkatkan_selamat',
        label: 'Tindakan untuk meningkatkan kerja selamat',
    },
    {
        key: 'tindakan_kondisi_tidak_aman',
        label: 'Tindakan / kondisi tidak aman yang diamati',
    },
    { key: 'tindakan_segera', label: 'Tindakan yang diambil segera' },
    {
        key: 'tindakan_mencegah_terulang',
        label: 'Tindakan untuk mencegah terulang kembali',
    },
] as const;

function ChecklistToggle({
    value,
    onChange,
    label,
}: {
    value: ChecklistVal;
    onChange: (v: ChecklistVal) => void;
    label: string;
}) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className="flex shrink-0 gap-1.5"
        >
            {(['aman', 'beresiko'] as const).map((v) => {
                const on = value === v;

                return (
                    <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => onChange(on ? '' : v)}
                        className={cn(
                            'h-11 rounded-full px-3.5 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                            on &&
                                v === 'aman' &&
                                'bg-primary text-primary-foreground',
                            on &&
                                v === 'beresiko' &&
                                'bg-destructive text-destructive-foreground',
                            !on &&
                                'border border-border bg-card hover:bg-muted',
                        )}
                    >
                        {v === 'aman' ? 'Aman' : 'Beresiko'}
                    </button>
                );
            })}
        </div>
    );
}

export default function ObservasiKeselamatanCreate({
    user,
    staffUsers,
    sites,
}: Props) {
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    });
    const [step, setStep] = useState(1);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        site: sites.some((site) => site.value === user.site)
            ? user.site!
            : (sites[0]?.value ?? ''),
        penanggung_jawab_id: '',
        tanggal: today,
        jenis_pekerjaan: '',
        lokasi_kerja: '',
        peralatan_digunakan: '',
        cl_prosedur_mine_permit: '',
        cl_prosedur_komisioning: '',
        cl_prosedur_p2h: '',
        cl_prosedur_instruksi_kerja: '',
        cl_prosedur_loto: '',
        cl_prosedur_sop_jsa: '',
        cl_apd_kepala: '',
        cl_apd_mata_wajah: '',
        cl_apd_pendengaran: '',
        cl_apd_pernapasan: '',
        cl_apd_pelindung_jatuh: '',
        cl_apd_pelindung_tenggelam: '',
        cl_apd_lengan_tangan: '',
        cl_apd_paha_kaki: '',
        cl_posisi_mengangkat: '',
        cl_posisi_mengubah_posisi: '',
        cl_posisi_mengatur_pekerjaan: '',
        cl_posisi_dekat_listrik: '',
        cl_posisi_dekat_berbahaya: '',
        cl_posisi_dekat_longsor: '',
        cl_posisi_dekat_air: '',
        cl_posisi_turun_naik: '',
        cl_kendaraan_sim_sio: '',
        cl_kendaraan_sabuk: '',
        cl_kendaraan_kecepatan: '',
        cl_kendaraan_jarak: '',
        cl_kendaraan_haluan: '',
        cl_kendaraan_buggy_whip: '',
        cl_kendaraan_radio: '',
        cl_kendaraan_lampu: '',
        cl_peralatan_pemilihan: '',
        cl_peralatan_safety_guard: '',
        cl_peralatan_pemakaian: '',
        cl_peralatan_angkat: '',
        cl_peralatan_elektrikal: '',
        cl_peralatan_tangan: '',
        cl_lingkungan_kebersihan: '',
        cl_lingkungan_tumpahan: '',
        cl_lingkungan_pencahayaan: '',
        cl_lingkungan_kebisingan: '',
        cl_lingkungan_barikade: '',
        cl_lingkungan_rambu: '',
        cl_lingkungan_limbah: '',
        ll_1_label: '',
        ll_1_nilai: '',
        ll_2_label: '',
        ll_2_nilai: '',
        ll_3_label: '',
        ll_3_nilai: '',
        ll_4_label: '',
        ll_4_nilai: '',
        tindakan_kondisi_aman: '',
        tindakan_meningkatkan_selamat: '',
        tindakan_kondisi_tidak_aman: '',
        tindakan_segera: '',
        tindakan_mencegah_terulang: '',
        status_temuan: [],
        catatan: '',
    });
    const draft = useDraft('observasi-keselamatan', data, (saved) =>
        setData((current) => ({ ...current, ...saved })),
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const filledCount = ALL_CL_KEYS.filter((k) => data[k] !== '').length;
    const totalCount = ALL_CL_KEYS.length;
    const risikoCount = ALL_CL_KEYS.filter(
        (k) => data[k] === 'beresiko',
    ).length;
    const step1OK = !!(
        data.site &&
        data.tanggal &&
        data.jenis_pekerjaan &&
        data.lokasi_kerja
    );

    const staff = staffUsers.filter((u) => u.sites.includes(data.site));
    const selectedPj = staff.find(
        (u) => String(u.id) === data.penanggung_jawab_id,
    );
    const lokasiOptions =
        sites.find((site) => site.value === data.site)?.locations ?? [];

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (step < 3) {
            if (step !== 1 || step1OK) {
                setStep((s) => s + 1);
            }

            return;
        }

        if (!step1OK) {
            return;
        }

        setUploadProgress(0);
        post('/sap/observasi-keselamatan', {
            onProgress: (ev) => setUploadProgress(ev?.percentage ?? null),
            onFinish: () => setUploadProgress(null),
            onSuccess: () => draft.clear(),
            onError: (errs) => {
                if (
                    [
                        'site',
                        'tanggal',
                        'jenis_pekerjaan',
                        'lokasi_kerja',
                        'penanggung_jawab_id',
                    ].some((k) => k in errs)
                ) {
                    setStep(1);
                }
            },
        });
    };

    return (
        <>
            <Head title="Observasi Keselamatan" />
            <form
                onSubmit={submit}
                className="flex flex-col gap-4 pt-2 lg:mx-auto lg:max-w-[640px]"
            >
                <ModuleHeader
                    backHref="/sap/observasi-keselamatan"
                    title="Observasi Keselamatan"
                    eyebrow={`WBK-HSE-FO-037 · ${user.name}`}
                    step={{ current: step, total: 3 }}
                />

                <FormStepper
                    step={step}
                    total={3}
                    labels={[
                        'Informasi umum',
                        'Checklist',
                        'Temuan & tindakan',
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
                            disabled={!step1OK}
                            loading={processing}
                        >
                            {step === 1
                                ? 'Lanjut · Checklist'
                                : step === 2
                                  ? `Lanjut · ${filledCount}/${totalCount} terisi`
                                  : 'Kirim observasi'}
                        </Button>
                    }
                >
                    {step === 1 && (
                        <>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <span className="text-[13px] font-semibold">
                                        Site
                                    </span>
                                    <SiteCombobox
                                        value={data.site}
                                        options={sites}
                                        onChange={(site) =>
                                            setData((d) => ({
                                                ...d,
                                                site,
                                                lokasi_kerja: '',
                                                penanggung_jawab_id: '',
                                            }))
                                        }
                                        placeholder="Pilih site"
                                    />
                                    <InputError message={errors.site} />
                                </div>
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
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="jenis_pekerjaan"
                                    className="text-[13px] font-semibold"
                                >
                                    Jenis pekerjaan
                                </Label>
                                <Input
                                    id="jenis_pekerjaan"
                                    value={data.jenis_pekerjaan}
                                    onChange={(e) =>
                                        setData(
                                            'jenis_pekerjaan',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Pengoperasian excavator di Pit A"
                                    aria-invalid={
                                        errors.jenis_pekerjaan
                                            ? true
                                            : undefined
                                    }
                                />
                                <InputError message={errors.jenis_pekerjaan} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="lokasi_kerja"
                                    className="text-[13px] font-semibold"
                                >
                                    Lokasi kerja
                                </Label>
                                <Input
                                    id="lokasi_kerja"
                                    list="lokasi-options"
                                    value={data.lokasi_kerja}
                                    onChange={(e) =>
                                        setData('lokasi_kerja', e.target.value)
                                    }
                                    placeholder="Pilih atau ketik lokasi"
                                    aria-invalid={
                                        errors.lokasi_kerja ? true : undefined
                                    }
                                />
                                <datalist id="lokasi-options">
                                    {lokasiOptions.map((l) => (
                                        <option key={l} value={l} />
                                    ))}
                                </datalist>
                                <InputError message={errors.lokasi_kerja} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="peralatan"
                                    className="text-[13px] font-semibold"
                                >
                                    Peralatan yang digunakan{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (opsional)
                                    </span>
                                </Label>
                                <Input
                                    id="peralatan"
                                    value={data.peralatan_digunakan}
                                    onChange={(e) =>
                                        setData(
                                            'peralatan_digunakan',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Excavator PC200, dump truck"
                                />
                            </div>

                            <ComboField
                                id="penanggung_jawab"
                                label="Penanggung jawab (opsional, default: Anda)"
                                value={data.penanggung_jawab_id}
                                options={[
                                    { value: '', label: 'Saya sendiri' },
                                    ...staff.map((u) => ({
                                        value: String(u.id),
                                        label: u.name,
                                        sub: u.jabatan,
                                    })),
                                ]}
                                onChange={(v) =>
                                    setData('penanggung_jawab_id', v)
                                }
                                placeholder="Saya sendiri"
                                searchPlaceholder="Cari nama…"
                                error={errors.penanggung_jawab_id}
                            />
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="flex flex-col gap-2 rounded-lg bg-card p-4">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Item terisi</span>
                                    <span className="tabular">
                                        {filledCount}/{totalCount}
                                        {risikoCount > 0 && (
                                            <span className="text-destructive">
                                                {' '}
                                                · {risikoCount} beresiko
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-foreground transition-[width] duration-500"
                                        style={{
                                            width: `${Math.round((filledCount / totalCount) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {CHECKLIST_CATEGORIES.map((cat) => (
                                <section
                                    key={cat.key}
                                    className="flex flex-col gap-2"
                                >
                                    <SectionLabel>{cat.label}</SectionLabel>
                                    <ul className="overflow-hidden rounded-lg bg-card">
                                        {cat.items.map((item) => {
                                            const val = data[
                                                item.key as keyof FormData
                                            ] as ChecklistVal;

                                            return (
                                                <li
                                                    key={item.key}
                                                    className={cn(
                                                        'flex items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-0',
                                                        val === 'beresiko' &&
                                                            'bg-destructive-soft',
                                                    )}
                                                >
                                                    <span className="min-w-0 flex-1 text-sm leading-snug">
                                                        {item.label}
                                                    </span>
                                                    <ChecklistToggle
                                                        label={item.label}
                                                        value={val}
                                                        onChange={(v) =>
                                                            setData(
                                                                item.key as keyof FormData,
                                                                v,
                                                            )
                                                        }
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            ))}

                            <section className="flex flex-col gap-2">
                                <SectionLabel>7.0 Lain-lain</SectionLabel>
                                <ul className="overflow-hidden rounded-lg bg-card">
                                    {([1, 2, 3, 4] as const).map((n) => {
                                        const labelKey =
                                            `ll_${n}_label` as keyof FormData;
                                        const nilaiKey =
                                            `ll_${n}_nilai` as keyof FormData;
                                        const val = data[
                                            nilaiKey
                                        ] as ChecklistVal;

                                        return (
                                            <li
                                                key={n}
                                                className={cn(
                                                    'flex items-center gap-2 border-b border-border/60 px-4 py-2.5 last:border-0',
                                                    val === 'beresiko' &&
                                                        'bg-destructive-soft',
                                                )}
                                            >
                                                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                                                    7.{n}
                                                </span>
                                                <Input
                                                    value={
                                                        data[labelKey] as string
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            labelKey,
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={`Item tambahan ${n}`}
                                                    aria-label={`Item tambahan ${n}`}
                                                    className="min-w-0 flex-1"
                                                />
                                                <ChecklistToggle
                                                    label={`Item tambahan ${n}`}
                                                    value={val}
                                                    onChange={(v) =>
                                                        setData(nilaiKey, v)
                                                    }
                                                />
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            {NARASI.map(({ key, label }) => (
                                <div
                                    key={key}
                                    className="flex flex-col gap-1.5"
                                >
                                    <Label
                                        htmlFor={key}
                                        className="text-[13px] font-semibold"
                                    >
                                        {label}
                                    </Label>
                                    <Textarea
                                        id={key}
                                        rows={3}
                                        value={data[key]}
                                        onChange={(e) =>
                                            setData(key, e.target.value)
                                        }
                                        placeholder="Deskripsikan…"
                                    />
                                </div>
                            ))}

                            <div className="flex flex-col gap-2">
                                <span className="text-[13px] font-semibold">
                                    Status temuan
                                </span>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {STATUS_TEMUAN_OPTIONS.map(
                                        ({ value, label }) => {
                                            const checked =
                                                data.status_temuan.includes(
                                                    value,
                                                );

                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    role="checkbox"
                                                    aria-checked={checked}
                                                    onClick={() =>
                                                        setData(
                                                            'status_temuan',
                                                            checked
                                                                ? data.status_temuan.filter(
                                                                      (v) =>
                                                                          v !==
                                                                          value,
                                                                  )
                                                                : [
                                                                      ...data.status_temuan,
                                                                      value,
                                                                  ],
                                                        )
                                                    }
                                                    className={cn(
                                                        'flex min-h-[52px] items-center gap-3 rounded-lg px-4 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                                        choiceSurface(checked),
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2',
                                                            checked
                                                                ? 'border-foreground bg-foreground text-background'
                                                                : 'border-border',
                                                        )}
                                                    >
                                                        {checked && (
                                                            <Check className="size-3.5" />
                                                        )}
                                                    </span>
                                                    {label}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </div>

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
                                    value={data.catatan}
                                    onChange={(e) =>
                                        setData('catatan', e.target.value)
                                    }
                                    placeholder="Catatan lain…"
                                />
                            </div>

                            <p className="rounded-md bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                                <strong className="text-foreground">
                                    SAYA PILIH SELAMAT
                                </strong>{' '}
                                — dengan mengirim form ini saya menyatakan data
                                yang diisi benar sesuai kondisi di lapangan.
                                {selectedPj && (
                                    <>
                                        {' '}
                                        Form akan dikirim ke{' '}
                                        <strong className="text-foreground">
                                            {selectedPj.name}
                                        </strong>{' '}
                                        untuk dikonfirmasi.
                                    </>
                                )}
                            </p>
                        </>
                    )}
                </FormStepper>
            </form>
            <UploadOverlay
                open={processing}
                progress={uploadProgress}
                label="Menyimpan observasi..."
            />
        </>
    );
}
