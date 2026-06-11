import { Head, router } from '@inertiajs/react';
import { BookOpen, Calendar, Clock, MapPin, PenLine, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
type Peserta = { nama: string; jabatan: string; nik: string; tanda_tangan: string };

type JsaRecord = {
    id: number;
    tanggal: string;
    lokasi: string;
    shift: 'siang' | 'malam';
    durasi: number;
    kegiatan: string;
    judul_dokumen: string;
    catatan: string | null;
    peserta: Peserta[];
    foto_kelompok: string;
    foto_dokumen: string;
    user: UserInfo;
    team_leader: UserInfo;
};

type Props = { record: JsaRecord };

function SignaturePad({ onSave, onClear }: { onSave: (dataUrl: string) => void; onClear: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    function getPos(e: React.MouseEvent | React.TouchEvent) {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    }

    function startDraw(e: React.MouseEvent | React.TouchEvent) { drawing.current = true; lastPos.current = getPos(e); }

    function draw(e: React.MouseEvent | React.TouchEvent) {
        if (!drawing.current) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const pos = getPos(e);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    }

    function stopDraw() { drawing.current = false; lastPos.current = null; }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onTouchStart = (e: TouchEvent) => { e.preventDefault(); drawing.current = true; lastPos.current = getTouchPos(e, canvas); };
        const onTouchMove = (e: TouchEvent) => { e.preventDefault(); if (!drawing.current) return; const ctx = canvas.getContext('2d')!; const pos = getTouchPos(e, canvas); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lastPos.current!.x, lastPos.current!.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); lastPos.current = pos; };
        const onTouchEnd = () => stopDraw();
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);
        return () => { canvas.removeEventListener('touchstart', onTouchStart); canvas.removeEventListener('touchmove', onTouchMove); canvas.removeEventListener('touchend', onTouchEnd); };
    }, []);

    function getTouchPos(e: TouchEvent, canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }

    function clear() {
        canvasRef.current!.getContext('2d')!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        onClear();
    }

    function save() { onSave(canvasRef.current!.toDataURL('image/png')); }

    return (
        <div className="flex flex-col gap-3">
            <canvas
                ref={canvasRef}
                width={480}
                height={160}
                className="border-2 rounded-xl bg-white touch-none w-full"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
            />
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={clear} className="flex-1">Hapus</Button>
                <Button type="button" onClick={save} className="flex-1 gap-2"><PenLine size={15} /> Simpan Tanda Tangan</Button>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="text-sm">{children}</div>
        </div>
    );
}

export default function KomunikasiJsaKonfirmasi({ record }: Props) {
    const [signature, setSignature] = useState('');
    const [sigSaved, setSigSaved] = useState(false);
    const [processing, setProcessing] = useState(false);

    function handleKonfirmasi() {
        if (!sigSaved || !signature) return;
        setProcessing(true);
        router.post(`/sap/komunikasi-jsa/${record.id}/konfirmasi`, { tl_signature: signature }, {
            onFinish: () => setProcessing(false),
        });
    }

    function handleTolak() {
        if (!confirm('Yakin ingin menolak form komunikasi JSA ini?')) return;
        setProcessing(true);
        router.post(`/sap/komunikasi-jsa/${record.id}/tolak`, {}, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <>
            <Head title="Konfirmasi Komunikasi JSA" />
            <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                    <h2 className="text-xl font-bold">Konfirmasi Lembar Komunikasi JSA</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Sebagai Team Leader / Supervisor</p>
                </div>

                {/* Summary */}
                <Card>
                    <CardContent className="flex flex-col gap-4 pt-5">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Tanggal">
                                <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </Field>
                            <Field label="Shift">
                                <Badge variant="outline" className="capitalize">{record.shift}</Badge>
                            </Field>
                        </div>
                        <Field label="Lokasi">
                            <span className="flex items-center gap-1.5"><MapPin size={13} /> {record.lokasi}</span>
                        </Field>
                        <Field label="Durasi">
                            <span className="flex items-center gap-1.5"><Clock size={13} /> {record.durasi} menit</span>
                        </Field>
                        <Field label="Kegiatan">
                            <p className="whitespace-pre-line">{record.kegiatan}</p>
                        </Field>
                        <Field label="Judul JSA / SOP / IK">
                            <span className="flex items-center gap-1.5 font-medium"><BookOpen size={13} /> {record.judul_dokumen}</span>
                        </Field>
                        {record.catatan && (
                            <Field label="Catatan">{record.catatan}</Field>
                        )}
                        <Separator />
                        <Field label="Dibuat Oleh">
                            <p>{record.user.name}</p>
                            {record.user.jabatan && <p className="text-muted-foreground text-xs">{record.user.jabatan}</p>}
                        </Field>
                    </CardContent>
                </Card>

                {/* Peserta */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold flex items-center gap-2"><Users size={16} /> Daftar Peserta ({record.peserta.length})</h3>
                    <div className="flex flex-col gap-2">
                        {record.peserta.map((p, idx) => (
                            <Card key={idx}>
                                <CardContent className="flex items-center gap-4 py-3 px-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold">{p.nama}</p>
                                        <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                                            {p.jabatan && <span>{p.jabatan}</span>}
                                            {p.nik && <span>NIK: {p.nik}</span>}
                                        </div>
                                    </div>
                                    {p.tanda_tangan && (
                                        <img src={p.tanda_tangan} alt={`TTD ${p.nama}`} className="h-12 w-24 object-contain border rounded bg-white" />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Foto Bukti */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold">Foto Bukti Komunikasi</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto Kelompok</p>
                            <img src={`/storage/${record.foto_kelompok}`} alt="Foto kelompok" className="w-full rounded-lg border object-cover max-h-52" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto Dokumen</p>
                            <img src={`/storage/${record.foto_dokumen}`} alt="Foto dokumen" className="w-full rounded-lg border object-cover max-h-52" />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* TTD Team Leader */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold">Tanda Tangan Team Leader</h3>
                    <p className="text-sm text-muted-foreground -mt-1">{record.team_leader.name}{record.team_leader.jabatan ? ` — ${record.team_leader.jabatan}` : ''}</p>

                    {sigSaved ? (
                        <div className="flex flex-col gap-2">
                            <img src={signature} alt="TTD TL" className="h-24 border rounded-xl bg-white object-contain" />
                            <Button type="button" variant="outline" size="sm" className="self-start gap-1.5" onClick={() => setSigSaved(false)}>
                                <PenLine size={13} /> Ubah Tanda Tangan
                            </Button>
                        </div>
                    ) : (
                        <SignaturePad
                            onSave={sig => { setSignature(sig); setSigSaved(true); }}
                            onClear={() => { setSignature(''); setSigSaved(false); }}
                        />
                    )}
                </div>

                <div className="flex flex-col gap-3 pb-6">
                    <Button
                        onClick={handleKonfirmasi}
                        disabled={!sigSaved || processing}
                        className="h-12 text-base font-bold"
                    >
                        {processing ? 'Memproses...' : 'Konfirmasi'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleTolak}
                        disabled={processing}
                        className="h-12 text-base font-medium text-destructive border-destructive/40 hover:bg-destructive/10"
                    >
                        Tolak Form Ini
                    </Button>
                </div>
            </div>
        </>
    );
}
