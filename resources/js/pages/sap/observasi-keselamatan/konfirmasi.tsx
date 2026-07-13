import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, CheckCircle2, MapPin, Pen, User, Wrench, X, XCircle } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type ChecklistVal = 'aman' | 'beresiko' | null;

type OKRecord = {
    id: number;
    user: UserInfo;
    penanggung_jawab: UserInfo | null;
    tanggal: string;
    jenis_pekerjaan: string;
    lokasi_kerja: string;
    peralatan_digunakan: string | null;
    tindakan_kondisi_aman: string | null;
    tindakan_meningkatkan_selamat: string | null;
    tindakan_kondisi_tidak_aman: string | null;
    tindakan_segera: string | null;
    tindakan_mencegah_terulang: string | null;
    status_temuan: string[] | null;
    catatan: string | null;
    [key: string]: unknown;
};

type Props = { record: OKRecord };

const CHECKLIST_CATEGORIES = [
    {
        label: '1.0 Prosedur',
        items: [
            { key: 'cl_prosedur_mine_permit',     label: '1.1 Mine Permit / Ijin Masuk Lokasi Tambang' },
            { key: 'cl_prosedur_komisioning',     label: '1.2 Komisioning / Inspeksi' },
            { key: 'cl_prosedur_p2h',             label: '1.3 Pelaksanaan Pemeriksaan Harian (P2H)' },
            { key: 'cl_prosedur_instruksi_kerja', label: '1.4 Instruksi Kerja / Tata Cara Kerja Aman' },
            { key: 'cl_prosedur_loto',            label: '1.5 Sistem Penguncian & Pelabelan (LOTO)' },
            { key: 'cl_prosedur_sop_jsa',         label: '1.6 SOP / JSA' },
        ],
    },
    {
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
        label: '3.0 Posisi Badan & Reaksi Orang',
        items: [
            { key: 'cl_posisi_mengangkat',         label: '3.1 Cara Mengangkat, Mendorong, Menarik' },
            { key: 'cl_posisi_mengubah_posisi',    label: '3.2 Mengubah Posisi' },
            { key: 'cl_posisi_mengatur_pekerjaan', label: '3.3 Mengatur Pekerjaan' },
            { key: 'cl_posisi_dekat_listrik',      label: '3.4 Dekat dengan Arus Listrik Bertegangan' },
            { key: 'cl_posisi_dekat_berbahaya',    label: '3.5 Dekat dengan Area atau Bahan Berbahaya' },
            { key: 'cl_posisi_dekat_longsor',      label: '3.6 Dekat dengan Dinding/Galian Rawan Longsor' },
            { key: 'cl_posisi_dekat_air',          label: '3.6b Dekat dengan Air' },
            { key: 'cl_posisi_turun_naik',         label: '3.7 Turun / Naik' },
        ],
    },
    {
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
];

const STATUS_TEMUAN_LABELS: Record<string, string> = {
    sudah_selesai:    'Sudah Diperbaiki / Selesai',
    perlu_penanganan: 'Perlu Penanganan Khusus',
    sedang_diperbaiki:'Sedang Diperbaiki',
    menunggu_material:'Menunggu Material / Peralatan',
};

function ClItem({ value, label }: { value: ChecklistVal; label: string }) {
    if (!value) {
return null;
}

    return (
        <div className={cn(
            'flex items-center justify-between gap-3 px-4 py-3',
            value === 'beresiko' && 'bg-red-50/50 dark:bg-red-950/10',
            value === 'aman' && 'bg-green-50/50 dark:bg-green-950/10',
        )}>
            <span className="text-sm flex-1">{label}</span>
            <Badge variant="outline" className={cn(
                'text-xs font-bold',
                value === 'aman' ? 'border-green-400 text-green-700 bg-green-50' : 'border-red-400 text-red-700 bg-red-50',
            )}>
                {value === 'aman' ? <><Check size={12} className="mr-1" />Aman</> : <><X size={12} className="mr-1" />Beresiko</>}
            </Badge>
        </div>
    );
}

function SignaturePadCapture({ onCapture }: { onCapture: (data: string | null) => void }) {
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

        if (!canvas) {
return;
}

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
            if (!drawing.current) {
return;
}

            e.preventDefault();
            const p = pos('touches' in e ? e.touches[0] : e, canvas);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();

            if (isEmpty) {
                setIsEmpty(false);
                onCapture(canvas.toDataURL('image/png'));
            } else {
                onCapture(canvas.toDataURL('image/png'));
            }
        };
        const up = () => {
 drawing.current = false; 
};

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
    }, [isEmpty, onCapture]);

    const clear = () => {
        const canvas = canvasRef.current;

        if (!canvas) {
return;
}

        canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onCapture(null);
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

export default function ObservasiKeselamatanKonfirmasi({ record }: Props) {
    const [step, setStep] = useState<'review' | 'sign' | 'reject'>('review');

    const signForm = useForm({ pj_signature: '' });
    const [hasSig, setHasSig] = useState(false);

    const rejectForm = useForm({ alasan: '' });

    const tanggalFormatted = new Date(record.tanggal).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const handleSignCapture = (imgData: string | null) => {
        signForm.setData('pj_signature', imgData ?? '');
        setHasSig(!!imgData);
    };

    const handleSign = (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasSig) {
return;
}

        signForm.post(`/sap/observasi-keselamatan/${record.id}/konfirmasi`);
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();

        if (!rejectForm.data.alasan.trim()) {
return;
}

        rejectForm.post(`/sap/observasi-keselamatan/${record.id}/tolak`);
    };

    return (
        <>
            <Head title="Konfirmasi Form OK" />
            <div className="flex flex-col gap-6 max-w-2xl">

                {/* Step: Review */}
                {step === 'review' && (
                    <>
                        <div>
                            <h2 className="text-xl font-bold">Konfirmasi Penanggung Jawab</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Review form berikut sebelum memberikan keputusan
                            </p>
                        </div>

                        {/* Info umum */}
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Informasi Umum</div>
                            <CardContent className="py-0">
                                {[
                                    { icon: User,   label: 'Observer',        value: `${record.user.name}${record.user.jabatan ? ` — ${record.user.jabatan}` : ''}` },
                                    { icon: User,   label: 'Penanggung Jawab', value: record.penanggung_jawab?.name ?? '—' },
                                    { icon: MapPin, label: 'Lokasi Kerja',     value: record.lokasi_kerja },
                                    { icon: Wrench, label: 'Jenis Pekerjaan',  value: record.jenis_pekerjaan },
                                    { icon: Wrench, label: 'Peralatan',        value: record.peralatan_digunakan ?? '—' },
                                ].map(({ icon: Icon, label, value }, idx, arr) => (
                                    <Fragment key={label}>
                                        <div className="flex items-start gap-3 py-3.5 text-sm">
                                            <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                                            <dt className="text-muted-foreground w-40 shrink-0">{label}</dt>
                                            <dd className="font-semibold">{value}</dd>
                                        </div>
                                        {idx < arr.length - 1 && <Separator />}
                                    </Fragment>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Checklist */}
                        {CHECKLIST_CATEGORIES.map(cat => {
                            const filled = cat.items.filter(i => record[i.key]);

                            if (filled.length === 0) {
return null;
}

                            return (
                                <Card key={cat.label} className="p-0 overflow-hidden">
                                    <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">{cat.label}</div>
                                    <CardContent className="p-0">
                                        {cat.items.map((item, idx) => {
                                            const val = record[item.key] as ChecklistVal;

                                            if (!val) {
return null;
}

                                            return (
                                                <Fragment key={item.key}>
                                                    <ClItem value={val} label={item.label} />
                                                    {idx < cat.items.length - 1 && <Separator />}
                                                </Fragment>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {/* Lain-lain */}
                        {[1, 2, 3, 4].some(n => record[`ll_${n}_nilai`]) && (
                            <Card className="p-0 overflow-hidden">
                                <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">7.0 Lain-Lain</div>
                                <CardContent className="p-0">
                                    {[1, 2, 3, 4].map((n, idx) => {
                                        const val = record[`ll_${n}_nilai`] as ChecklistVal;
                                        const label = (record[`ll_${n}_label`] as string) || `Item ${n}`;

                                        if (!val) {
return null;
}

                                        return (
                                            <Fragment key={n}>
                                                <ClItem value={val} label={`7.${n} ${label}`} />
                                                {idx < 3 && <Separator />}
                                            </Fragment>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Narasi */}
                        {[
                            { key: 'tindakan_kondisi_aman',         label: 'Tindakan / Kondisi Aman yang Diamati' },
                            { key: 'tindakan_meningkatkan_selamat', label: 'Tindakan untuk Meningkatkan Kerja Selamat' },
                            { key: 'tindakan_kondisi_tidak_aman',   label: 'Kondisi Tidak Aman yang Diamati' },
                            { key: 'tindakan_segera',               label: 'Tindakan yang Diambil Segera' },
                            { key: 'tindakan_mencegah_terulang',    label: 'Tindakan untuk Mencegah Terulang Kembali' },
                        ].filter(({ key }) => record[key]).map(({ key, label }) => (
                            <Card key={key} className={cn('p-0 overflow-hidden', key === 'tindakan_kondisi_tidak_aman' && 'border-red-200 dark:border-red-800')}>
                                <div className={cn('px-4 py-3 border-b font-bold text-sm', key === 'tindakan_kondisi_tidak_aman' ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-muted/50')}>
                                    {label}
                                </div>
                                <CardContent className="px-4 py-4 text-sm leading-relaxed">
                                    {record[key] as string}
                                </CardContent>
                            </Card>
                        ))}

                        {/* Status Temuan */}
                        {record.status_temuan && record.status_temuan.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="font-bold text-sm">Status Temuan</p>
                                <div className="flex flex-wrap gap-2">
                                    {record.status_temuan.map(s => (
                                        <Badge key={s} variant="outline" className="text-xs">{STATUS_TEMUAN_LABELS[s] ?? s}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Catatan */}
                        {record.catatan && (
                            <Card className="p-0 overflow-hidden">
                                <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Catatan</div>
                                <CardContent className="px-4 py-4 text-sm leading-relaxed">{record.catatan}</CardContent>
                            </Card>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col gap-3 pt-2">
                            <p className="text-sm font-bold text-center text-muted-foreground">Keputusan Anda sebagai Penanggung Jawab</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="destructive"
                                    className="h-14 text-base font-bold gap-2"
                                    onClick={() => setStep('reject')}
                                >
                                    <XCircle size={20} /> Tolak
                                </Button>
                                <Button
                                    className="h-14 text-base font-bold gap-2 bg-green-600 hover:bg-green-700"
                                    onClick={() => setStep('sign')}
                                >
                                    <CheckCircle2 size={20} /> Konfirmasi
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Step: Sign */}
                {step === 'sign' && (
                    <form onSubmit={handleSign} className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setStep('review')} className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-accent transition-colors">
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold">Tanda Tangan Konfirmasi</h2>
                                <p className="text-sm text-muted-foreground">{tanggalFormatted}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800 px-4 py-4">
                            <p className="text-sm leading-relaxed text-green-800 dark:text-green-300">
                                Dengan memberikan tanda tangan, Anda menyatakan telah mengetahui isi form Observasi Keselamatan ini
                                dan akan menindaklanjuti temuan yang ada.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <p className="text-base font-bold">
                                Tanda Tangan <span className="text-destructive">*</span>
                            </p>
                            <SignaturePadCapture onCapture={handleSignCapture} />
                            {signForm.errors.pj_signature && <p className="text-sm text-destructive">{signForm.errors.pj_signature}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-14 text-base font-bold" onClick={() => setStep('review')}>
                                <ArrowLeft size={18} className="mr-2" /> Kembali
                            </Button>
                            <Button
                                type="submit"
                                className="h-14 text-base font-bold gap-2 bg-green-600 hover:bg-green-700"
                                disabled={signForm.processing || !hasSig}
                            >
                                <Check size={20} /> Kirim Konfirmasi
                            </Button>
                        </div>
                    </form>
                )}

                {/* Step: Reject */}
                {step === 'reject' && (
                    <form onSubmit={handleReject} className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setStep('review')} className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-accent transition-colors">
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold">Penolakan Konfirmasi</h2>
                                <p className="text-sm text-muted-foreground">{tanggalFormatted}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-800 px-4 py-4">
                            <p className="text-sm leading-relaxed text-red-800 dark:text-red-300">
                                Jelaskan alasan penolakan agar observer dapat memperbaiki form atau tindakan yang diperlukan.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-base font-bold">
                                Alasan Penolakan <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                value={rejectForm.data.alasan}
                                onChange={e => rejectForm.setData('alasan', e.target.value)}
                                placeholder="Tuliskan alasan penolakan..."
                                className="min-h-32 resize-none text-sm"
                            />
                            {rejectForm.errors.alasan && <p className="text-sm text-destructive">{rejectForm.errors.alasan}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-14 text-base font-bold" onClick={() => setStep('review')}>
                                <ArrowLeft size={18} className="mr-2" /> Kembali
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                className="h-14 text-base font-bold gap-2"
                                disabled={rejectForm.processing || !rejectForm.data.alasan.trim()}
                            >
                                <XCircle size={20} /> Kirim Penolakan
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}
