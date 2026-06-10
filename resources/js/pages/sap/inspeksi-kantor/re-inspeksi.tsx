import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };

type Record = {
    id: number;
    user: UserInfo;
    re_inspektor: UserInfo | null;
    tanggal: string;
    project_site: string;
    departemen: string;
    persentase: number | null;
    risk_level: 'L' | 'M' | 'H' | 'VH' | null;
};

type Props = { record: Record };

const RISK_CFG = {
    L:  { label: 'Baik',           cls: 'bg-green-100 text-green-800 border-green-300' },
    M:  { label: 'Cukup',          cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    H:  { label: 'Perhatian',      cls: 'bg-orange-100 text-orange-800 border-orange-300' },
    VH: { label: 'Perlu Tindakan', cls: 'bg-red-100 text-red-800 border-red-300' },
};

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

export default function InspeksiKantorReInspeksi({ record }: Props) {
    const [step, setStep] = useState<'review' | 'sign' | 'reject'>('review');

    const signForm = useForm({ ttd_re_inspektor: '' });
    const [hasSig, setHasSig] = useState(false);
    const rejectForm = useForm({ alasan: '' });

    const tanggal = new Date(record.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const risk = record.risk_level ? RISK_CFG[record.risk_level] : null;

    const handleSign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasSig) return;
        signForm.post(`/sap/inspeksi-kantor/${record.id}/re-inspeksi`);
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectForm.data.alasan.trim()) return;
        rejectForm.post(`/sap/inspeksi-kantor/${record.id}/tolak`);
    };

    return (
        <>
            <Head title="Re-Inspeksi Kantor" />
            <div className="flex flex-col gap-6 max-w-2xl">

                {step === 'review' && (
                    <>
                        <div>
                            <h2 className="text-xl font-bold">Re-Inspeksi Area Kantor</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">{tanggal}</p>
                        </div>

                        <Card className="p-0 overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b font-bold text-sm">Ringkasan Inspeksi</div>
                            <CardContent className="py-4 flex flex-col gap-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Inspektor</span><span className="font-semibold">{record.user.name}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Project/Site</span><span className="font-semibold">{record.project_site}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Departemen</span><span className="font-semibold">{record.departemen}</span></div>
                            </CardContent>
                        </Card>

                        {risk && record.persentase !== null && (
                            <div className={`rounded-2xl border-2 px-4 py-4 ${risk.cls}`}>
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-2xl">{record.persentase}%</p>
                                    <span className="font-bold text-sm">{risk.label}</span>
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800 px-4 py-4">
                            <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-300">
                                Sebagai re-inspektor, Anda diminta untuk memverifikasi hasil inspeksi ini. Lihat detail lengkap di halaman{' '}
                                <a href={`/sap/inspeksi-kantor/${record.id}`} className="font-bold underline" target="_blank" rel="noreferrer">detail inspeksi</a>.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <p className="text-sm font-bold text-center text-muted-foreground">Keputusan Anda sebagai Re-Inspektor</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="destructive" className="h-14 text-base font-bold gap-2" onClick={() => setStep('reject')}>
                                    <XCircle size={20} /> Tolak
                                </Button>
                                <Button className="h-14 text-base font-bold gap-2 bg-green-600 hover:bg-green-700" onClick={() => setStep('sign')}>
                                    <CheckCircle2 size={20} /> Konfirmasi
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {step === 'sign' && (
                    <form onSubmit={handleSign} className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setStep('review')} className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-accent transition-colors">
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold">Tanda Tangan Re-Inspeksi</h2>
                                <p className="text-sm text-muted-foreground">{tanggal}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800 px-4 py-4">
                            <p className="text-sm leading-relaxed text-green-800 dark:text-green-300">
                                Dengan memberikan tanda tangan, Anda menyatakan telah melakukan re-inspeksi dan menyetujui hasil inspeksi ini.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <p className="text-base font-bold">Tanda Tangan <span className="text-destructive">*</span></p>
                            <SignaturePad onCapture={d => { signForm.setData('ttd_re_inspektor', d ?? ''); setHasSig(!!d); }} />
                            {signForm.errors.ttd_re_inspektor && <p className="text-sm text-destructive">{signForm.errors.ttd_re_inspektor}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-14 text-base font-bold" onClick={() => setStep('review')}>
                                <ArrowLeft size={18} className="mr-2" /> Kembali
                            </Button>
                            <Button type="submit" className="h-14 text-base font-bold gap-2 bg-green-600 hover:bg-green-700" disabled={signForm.processing || !hasSig}>
                                <Check size={20} /> Kirim Konfirmasi
                            </Button>
                        </div>
                    </form>
                )}

                {step === 'reject' && (
                    <form onSubmit={handleReject} className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setStep('review')} className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-accent transition-colors">
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold">Penolakan Re-Inspeksi</h2>
                                <p className="text-sm text-muted-foreground">{tanggal}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-800 px-4 py-4">
                            <p className="text-sm leading-relaxed text-red-800 dark:text-red-300">
                                Jelaskan alasan penolakan agar inspektor dapat memperbaiki form atau melakukan tindakan yang diperlukan.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-base font-bold">Alasan Penolakan <span className="text-destructive">*</span></label>
                            <Textarea value={rejectForm.data.alasan} onChange={e => rejectForm.setData('alasan', e.target.value)} placeholder="Tuliskan alasan penolakan..." className="min-h-32 resize-none text-sm" />
                            {rejectForm.errors.alasan && <p className="text-sm text-destructive">{rejectForm.errors.alasan}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-14 text-base font-bold" onClick={() => setStep('review')}>
                                <ArrowLeft size={18} className="mr-2" /> Kembali
                            </Button>
                            <Button type="submit" variant="destructive" className="h-14 text-base font-bold gap-2" disabled={rejectForm.processing || !rejectForm.data.alasan.trim()}>
                                <XCircle size={20} /> Kirim Penolakan
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}
