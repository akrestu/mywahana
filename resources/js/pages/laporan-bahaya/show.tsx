import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileDown, MapPin } from 'lucide-react';
import { RiskBadge } from '@/components/risk-badge';
import { TindakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type LaporanRecord = {
    id: number;
    tanggal: string;
    waktu_pengamatan?: string | null;
    kategori?: 'KTA' | 'TTA' | null;
    lokasi: string;
    deskripsi_bahaya: string;
    tindakan_perbaikan: string;
    probabilitas: number;
    frekuensi: number;
    severity: number;
    nilai_risiko: number;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    status_tindakan: 'pending' | 'selesai';
    foto_path?: string | null;
    user: {
        name: string;
        nik?: string | null;
        jabatan?: string | null;
        site?: string | null;
    };
};

type Props = { record: LaporanRecord; fotoUrl?: string | null };

const RISK_CONFIG = {
    AA: {
        bg: 'bg-red-50 border-red-300 dark:bg-red-950/30',
        text: 'text-red-700',
        desc: 'Sangat Berbahaya — Hentikan pekerjaan segera!',
    },
    A: {
        bg: 'bg-orange-50 border-orange-300 dark:bg-orange-950/30',
        text: 'text-orange-700',
        desc: 'Berbahaya — Perlu tindakan segera',
    },
    B: {
        bg: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30',
        text: 'text-yellow-700',
        desc: 'Sedang — Perlu dipantau & ditangani',
    },
    C: {
        bg: 'bg-green-50 border-green-300 dark:bg-green-950/30',
        text: 'text-green-700',
        desc: 'Rendah — Aman terkendali',
    },
} as const;

const P_LABELS: Record<number, string> = { 1: 'Hampir tidak mungkin', 2: 'Kecil kemungkinannya', 3: 'Kadang-kadang', 4: 'Sering terjadi', 5: 'Hampir pasti' };
const F_LABELS: Record<number, string> = { 1: 'Setahun sekali', 2: 'Sebulan sekali', 3: 'Seminggu sekali', 4: 'Setiap hari', 5: 'Berkali-kali sehari' };
const S_LABELS: Record<number, string> = { 1: 'Sangat Ringan', 2: 'Ringan', 3: 'Sedang', 25: 'Berat', 30: 'Sangat Berat / Meninggal' };

export default function LaporanBahayaShow({ record, fotoUrl }: Props) {
    const rc = RISK_CONFIG[record.tingkat_risiko];

    return (
        <>
            <Head title="Detail Laporan Bahaya" />

            <div className="flex flex-col gap-6">
                {/* Back */}
                <Link
                    href="/laporan-bahaya"
                    className="flex w-fit items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                    <ArrowLeft size={18} />
                    Kembali ke Riwayat
                </Link>

                {/* Risk hero */}
                <div className={cn('flex flex-col items-center gap-3 rounded-2xl border-2 py-8 text-center px-4', rc.bg)}>
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tingkat Risiko</p>
                    <p className={cn('text-6xl font-black tabular-nums', rc.text)}>{record.nilai_risiko}</p>
                    <RiskBadge level={record.tingkat_risiko} />
                    <p className="text-sm text-muted-foreground">{rc.desc}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        {new Date(record.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                        {record.waktu_pengamatan && ` · ${record.waktu_pengamatan.slice(0, 5)} WIB`}
                    </p>
                    {record.kategori && (
                        <span className={cn(
                            'mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold',
                            record.kategori === 'KTA' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
                        )}>
                            {record.kategori === 'KTA' ? '⚠️' : '🚷'} {record.kategori} — {record.kategori === 'KTA' ? 'Kondisi Tidak Aman' : 'Tindakan Tidak Aman'}
                        </span>
                    )}
                </div>

                {/* Informasi pelapor */}
                <Card>
                    <CardHeader className="pb-2 pt-5">
                        <CardTitle className="text-base font-bold">👤 Informasi Pelapor</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {[
                            { label: 'Nama',           value: record.user.name },
                            { label: 'NIK / NRPP',     value: record.user.nik ?? '—' },
                            { label: 'Jabatan',        value: record.user.jabatan ?? '—' },
                            { label: 'Site',           value: record.user.site ? record.user.site.charAt(0).toUpperCase() + record.user.site.slice(1) : '—' },
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
                    <CardHeader className="pb-2 pt-5">
                        <CardTitle className="text-base font-bold">⚠️ Rincian Bahaya</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-4">
                        <div className="flex items-start gap-2">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                            <span className="text-base font-semibold">{record.lokasi}</span>
                        </div>
                        <Separator />
                        <p className="text-base leading-relaxed">{record.deskripsi_bahaya}</p>
                        {fotoUrl && (
                            <img
                                src={fotoUrl}
                                alt="Foto bahaya"
                                className="w-full rounded-2xl object-cover max-h-72"
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Penilaian risiko */}
                <Card>
                    <CardHeader className="pb-2 pt-5">
                        <CardTitle className="text-base font-bold">📊 Penilaian Risiko</CardTitle>
                    </CardHeader>
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
                    <CardHeader className="pb-2 pt-5">
                        <CardTitle className="text-base font-bold">🔧 Tindakan Perbaikan</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-4">
                        <p className="text-base leading-relaxed">{record.tindakan_perbaikan}</p>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status Penanganan</span>
                            <TindakanBadge status={record.status_tindakan} />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
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
