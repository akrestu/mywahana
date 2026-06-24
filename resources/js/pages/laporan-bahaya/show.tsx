import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileDown, MapPin, Paperclip, PenLine, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RiskBadge } from '@/components/risk-badge';
import { TindakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Review = {
    id: number;
    comment: string | null;
    attachment_paths: string[] | null;
    status_tindakan: 'pending' | 'continue' | 'progress' | 'close';
    tanda_tangan: string | null;
    created_at: string;
    user: { name: string; jabatan?: string | null };
};

type LaporanRecord = {
    id: number;
    tanggal: string;
    waktu_pengamatan?: string | null;
    kategori?: 'KTA' | 'TTA' | null;
    klasifikasi_bahaya?: string | null;
    lokasi: string;
    detail_lokasi?: string | null;
    deskripsi_bahaya: string;
    tindakan_perbaikan: string;
    probabilitas: number;
    frekuensi: number;
    severity: number;
    nilai_risiko: number;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    status_tindakan: 'pending' | 'continue' | 'progress' | 'close';
    foto_path?: string | null;
    user: { name: string; nik?: string | null; jabatan?: string | null; site?: string | null };
    pic?: { name: string; jabatan?: string | null } | null;
    reviews: Review[];
};

type Props = {
    record: LaporanRecord;
    fotoUrl?: string | null;
    back_url?: string;
    is_pic: boolean;
    attachment_urls: Record<number, string[]>;
};

const RISK_CONFIG = {
    AA: { bg: 'bg-red-50 border-red-300 dark:bg-red-950/30', text: 'text-red-700', desc: 'Sangat Berbahaya — Hentikan pekerjaan segera!' },
    A:  { bg: 'bg-orange-50 border-orange-300 dark:bg-orange-950/30', text: 'text-orange-700', desc: 'Berbahaya — Perlu tindakan segera' },
    B:  { bg: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30', text: 'text-yellow-700', desc: 'Sedang — Perlu dipantau & ditangani' },
    C:  { bg: 'bg-green-50 border-green-300 dark:bg-green-950/30', text: 'text-green-700', desc: 'Rendah — Aman terkendali' },
} as const;

const P_LABELS: Record<number, string> = { 1: 'Hampir tidak mungkin', 2: 'Kecil kemungkinannya', 3: 'Kadang-kadang', 4: 'Sering terjadi', 5: 'Hampir pasti' };
const F_LABELS: Record<number, string> = { 1: 'Setahun sekali', 2: 'Sebulan sekali', 3: 'Seminggu sekali', 4: 'Setiap hari', 5: 'Berkali-kali sehari' };
const S_LABELS: Record<number, string> = { 1: 'Sangat Ringan', 2: 'Ringan', 3: 'Sedang', 25: 'Berat', 30: 'Sangat Berat / Meninggal' };

const STATUS_OPTIONS = [
    { value: 'pending',  label: '⏳ Pending',  cls: 'border-gray-300 data-[active=true]:bg-gray-100 data-[active=true]:border-gray-500' },
    { value: 'continue', label: '🔁 Continue', cls: 'border-blue-300 data-[active=true]:bg-blue-50 data-[active=true]:border-blue-500' },
    { value: 'progress', label: '🔧 Progress', cls: 'border-yellow-300 data-[active=true]:bg-yellow-50 data-[active=true]:border-yellow-500' },
    { value: 'close',    label: '✅ Close',    cls: 'border-green-300 data-[active=true]:bg-green-50 data-[active=true]:border-green-500' },
] as const;

function SignaturePad({ onSave, onClear }: { onSave: (dataUrl: string) => void; onClear: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    function getPos(e: React.MouseEvent | React.TouchEvent) {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    }

    function startDraw(e: React.MouseEvent | React.TouchEvent) { drawing.current = true; lastPos.current = getPos(e); }

    function draw(e: React.MouseEvent | React.TouchEvent) {
        if (!drawing.current) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const pos = getPos(e);
        ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b';
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
        const getTouchPos = (e: TouchEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }; };
        const onTouchStart = (e: TouchEvent) => { e.preventDefault(); drawing.current = true; lastPos.current = getTouchPos(e); };
        const onTouchMove  = (e: TouchEvent) => { e.preventDefault(); if (!drawing.current) return; const ctx = canvas.getContext('2d')!; const pos = getTouchPos(e); ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lastPos.current!.x, lastPos.current!.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); lastPos.current = pos; };
        const onTouchEnd   = () => stopDraw();
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
        canvas.addEventListener('touchend',   onTouchEnd);
        return () => { canvas.removeEventListener('touchstart', onTouchStart); canvas.removeEventListener('touchmove', onTouchMove); canvas.removeEventListener('touchend', onTouchEnd); };
    }, []);

    function clear() { canvasRef.current!.getContext('2d')!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); onClear(); }
    function save() { onSave(canvasRef.current!.toDataURL('image/png')); }

    return (
        <div className="flex flex-col gap-3">
            <canvas
                ref={canvasRef} width={480} height={160}
                className="border-2 rounded-xl bg-white dark:bg-muted/20 touch-none w-full"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            />
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={clear} className="flex-1">Hapus</Button>
                <Button type="button" onClick={save} className="flex-1 gap-2"><PenLine size={15} /> Simpan Tanda Tangan</Button>
            </div>
        </div>
    );
}

export default function LaporanBahayaShow({ record, fotoUrl, back_url = '/laporan-bahaya', is_pic, attachment_urls }: Props) {
    const rc = RISK_CONFIG[record.tingkat_risiko];

    // Review form state
    const [comment, setComment]         = useState('');
    const [status, setStatus]           = useState<string>(record.status_tindakan);
    const [signature, setSignature]     = useState('');
    const [sigSaved, setSigSaved]       = useState(false);
    const [files, setFiles]             = useState<FileList | null>(null);
    const [processing, setProcessing]   = useState(false);
    const [showForm, setShowForm]       = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleSubmit() {
        const data = new FormData();
        data.append('status_tindakan', status);
        if (comment) data.append('comment', comment);
        if (signature) data.append('tanda_tangan', signature);
        if (files) {
            Array.from(files).forEach(f => data.append('attachments[]', f));
        }
        setProcessing(true);
        router.post(`/laporan-bahaya/${record.id}/review`, data, {
            forceFormData: true,
            onFinish: () => setProcessing(false),
        });
    }

    const needsSignature = status === 'close';

    return (
        <>
            <Head title="Detail Laporan Bahaya" />

            <div className="flex flex-col gap-6">
                {/* Back */}
                <Link href={back_url} className="flex w-fit items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-1">
                    <ArrowLeft size={18} />
                    {back_url.includes('admin') ? 'Kembali ke Monitoring' : 'Kembali ke Riwayat'}
                </Link>

                {/* Risk hero */}
                <div className={cn('flex flex-col items-center gap-3 rounded-2xl border-2 py-8 text-center px-4', rc.bg)}>
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tingkat Risiko</p>
                    <p className={cn('text-6xl font-black tabular-nums', rc.text)}>{record.nilai_risiko}</p>
                    <RiskBadge level={record.tingkat_risiko} />
                    <p className="text-sm text-muted-foreground">{rc.desc}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        {new Date(record.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {record.waktu_pengamatan && ` · ${record.waktu_pengamatan.slice(0, 5)} WIB`}
                    </p>
                    {record.kategori && (
                        <span className={cn('mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold', record.kategori === 'KTA' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200')}>
                            {record.kategori === 'KTA' ? '⚠️' : '🚷'} {record.kategori} — {record.kategori === 'KTA' ? 'Kondisi Tidak Aman' : 'Tindakan Tidak Aman'}
                        </span>
                    )}
                    {record.klasifikasi_bahaya && <p className="text-sm text-muted-foreground px-4">{record.klasifikasi_bahaya}</p>}
                </div>

                {/* Informasi pelapor */}
                <Card>
                    <CardHeader className="pb-2 pt-5"><CardTitle className="text-base font-bold">👤 Informasi Pelapor</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                        {[
                            { label: 'Nama',       value: record.user.name },
                            { label: 'NIK / NRPP', value: record.user.nik ?? '—' },
                            { label: 'Jabatan',    value: record.user.jabatan ?? '—' },
                            { label: 'Site',       value: record.user.site ? record.user.site.charAt(0).toUpperCase() + record.user.site.slice(1) : '—' },
                        ].map(({ label, value }, idx, arr) => (
                            <div key={label}>
                                <div className="flex items-center justify-between py-3.5 text-sm">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-semibold text-right">{value}</span>
                                </div>
                                {idx < arr.length - 1 && <Separator />}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Lokasi & Rincian Bahaya */}
                <Card>
                    <CardHeader className="pb-2 pt-5"><CardTitle className="text-base font-bold">⚠️ Rincian Bahaya</CardTitle></CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-4">
                        <div className="flex items-start gap-2">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                            <div>
                                <span className="text-base font-semibold">{record.lokasi}</span>
                                {record.detail_lokasi && <p className="text-sm text-muted-foreground mt-0.5">{record.detail_lokasi}</p>}
                            </div>
                        </div>
                        <Separator />
                        <p className="text-base leading-relaxed">{record.deskripsi_bahaya}</p>
                        {fotoUrl && <img src={fotoUrl} alt="Foto bahaya" className="w-full rounded-2xl object-cover max-h-72" />}
                    </CardContent>
                </Card>

                {/* Penilaian risiko */}
                <Card>
                    <CardHeader className="pb-2 pt-5"><CardTitle className="text-base font-bold">📊 Penilaian Risiko</CardTitle></CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                                { key: 'P', label: 'Kemungkinan', value: record.probabilitas, sub: P_LABELS[record.probabilitas] ?? '—' },
                                { key: 'F', label: 'Frekuensi',   value: record.frekuensi,    sub: F_LABELS[record.frekuensi] ?? '—' },
                                { key: 'S', label: 'Keparahan',   value: record.severity,     sub: S_LABELS[record.severity] ?? '—' },
                            ].map(({ key, label, value, sub }) => (
                                <div key={key} className="rounded-xl bg-muted p-3">
                                    <p className="text-xs text-muted-foreground">{key} — {label}</p>
                                    <p className="text-2xl font-black mt-1">{value}</p>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{sub}</p>
                                </div>
                            ))}
                        </div>
                        <div className={cn('flex items-center justify-between rounded-xl border-2 p-4', rc.bg)}>
                            <div>
                                <p className="text-sm text-muted-foreground">Nilai Risiko (P × F × S)</p>
                                <p className={cn('text-3xl font-black', rc.text)}>{record.nilai_risiko}</p>
                            </div>
                            <RiskBadge level={record.tingkat_risiko} />
                        </div>
                    </CardContent>
                </Card>

                {/* Tindakan perbaikan */}
                <Card>
                    <CardHeader className="pb-2 pt-5"><CardTitle className="text-base font-bold">🔧 Tindakan Perbaikan</CardTitle></CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-4">
                        <p className="text-base leading-relaxed">{record.tindakan_perbaikan}</p>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status Penanganan</span>
                            <TindakanBadge status={record.status_tindakan} />
                        </div>
                        {record.pic && (
                            <>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">PIC</span>
                                    <span className="font-semibold text-sm text-right">
                                        {record.pic.name}{record.pic.jabatan ? ` — ${record.pic.jabatan}` : ''}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Riwayat Review PIC */}
                {record.reviews.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-base font-bold">📋 Riwayat Review PIC</h3>
                        <div className="flex flex-col gap-3">
                            {record.reviews.map(review => (
                                <Card key={review.id}>
                                    <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold">{review.user.name}</p>
                                                {review.user.jabatan && <p className="text-xs text-muted-foreground">{review.user.jabatan}</p>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <TindakanBadge status={review.status_tindakan} />
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        {review.comment && (
                                            <>
                                                <Separator />
                                                <p className="text-sm leading-relaxed">{review.comment}</p>
                                            </>
                                        )}

                                        {(attachment_urls[review.id] ?? []).length > 0 && (
                                            <>
                                                <Separator />
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lampiran</p>
                                                    {(attachment_urls[review.id] ?? []).map((url, i) => {
                                                        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);
                                                        return isImage ? (
                                                            <img key={i} src={url} alt={`Lampiran ${i + 1}`} className="w-full rounded-xl object-cover max-h-52" />
                                                        ) : (
                                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary underline">
                                                                <Paperclip size={14} /> Lampiran {i + 1}
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}

                                        {review.tanda_tangan && (
                                            <>
                                                <Separator />
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tanda Tangan PIC</p>
                                                    <img src={review.tanda_tangan} alt="TTD PIC" className="h-20 border rounded-xl bg-white object-contain" />
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Review PIC (hanya untuk PIC) */}
                {is_pic && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold">✍️ Tambah Review</h3>
                            {!showForm && (
                                <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5">
                                    <Plus size={14} /> Review
                                </Button>
                            )}
                        </div>

                        {showForm && (
                            <Card>
                                <CardContent className="pt-5 flex flex-col gap-5">
                                    {/* Status */}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-semibold">Status Tindakan</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {STATUS_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    data-active={status === opt.value}
                                                    onClick={() => setStatus(opt.value)}
                                                    className={cn(
                                                        'rounded-xl border-2 py-3 text-sm font-semibold transition-colors',
                                                        opt.cls,
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Comment */}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-semibold">Komentar <span className="text-muted-foreground font-normal">(opsional)</span></p>
                                        <Textarea
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            placeholder="Tuliskan tindakan yang sudah diambil, kendala, atau catatan lainnya..."
                                            className="min-h-24 text-base"
                                        />
                                    </div>

                                    {/* Attachment */}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-semibold">Lampiran <span className="text-muted-foreground font-normal">(opsional, maks 5 file)</span></p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                            className="hidden"
                                            onChange={e => setFiles(e.target.files)}
                                        />
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                                            <Paperclip size={15} />
                                            {files && files.length > 0 ? `${files.length} file dipilih` : 'Pilih File'}
                                        </Button>
                                        {files && files.length > 0 && (
                                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                                                {Array.from(files).map((f, i) => <li key={i}>{f.name}</li>)}
                                            </ul>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Tanda tangan */}
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-semibold">
                                            Tanda Tangan PIC
                                            {needsSignature && <span className="text-destructive ml-1">*</span>}
                                            {!needsSignature && <span className="text-muted-foreground font-normal"> (opsional)</span>}
                                        </p>
                                        {needsSignature && (
                                            <p className="text-xs text-muted-foreground -mt-1">Tanda tangan diperlukan untuk menutup laporan.</p>
                                        )}
                                        {sigSaved ? (
                                            <div className="flex flex-col gap-2">
                                                <img src={signature} alt="TTD" className="h-24 border rounded-xl bg-white object-contain" />
                                                <Button type="button" variant="outline" size="sm" className="self-start gap-1.5" onClick={() => { setSigSaved(false); setSignature(''); }}>
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

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setShowForm(false)}
                                            disabled={processing}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            className="flex-1 font-bold"
                                            onClick={handleSubmit}
                                            disabled={processing || (needsSignature && !sigSaved)}
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan Review'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* PDF Export */}
                <a href={`/laporan-bahaya/${record.id}/pdf`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full h-13 text-base gap-2 font-semibold">
                        <FileDown size={18} />
                        Unduh / Export PDF
                    </Button>
                </a>
            </div>
        </>
    );
}
