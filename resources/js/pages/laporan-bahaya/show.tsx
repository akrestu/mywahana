import { Head, router, usePage } from '@inertiajs/react';
import { Download, Paperclip, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { SignaturePad } from '@/components/patterns/signature-pad';
import {
    firstNameOf,
    SubmittedScreen,
} from '@/components/patterns/submitted-screen';
import { RiskBadge } from '@/components/risk-badge';
import { TindakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { riskLabels } from '@/lib/risk';
import { tindakanLabels } from '@/lib/status';
import type { StatusTindakan } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

type Review = {
    id: number;
    comment: string | null;
    attachment_paths: string[] | null;
    status_tindakan: StatusTindakan;
    tanda_tangan: string | null;
    created_at: string;
    user: { name: string; jabatan?: string | null };
};

type LaporanRecord = {
    id: number;
    tanggal: string;
    waktu_pengamatan?: string | null;
    shift?: 'siang' | 'malam' | null;
    kategori?: 'KTA' | 'TTA' | null;
    klasifikasi_bahaya?: string | null;
    site?: string | null;
    lokasi: string;
    detail_lokasi?: string | null;
    deskripsi_bahaya: string;
    tindakan_perbaikan: string;
    probabilitas: number;
    frekuensi: number;
    severity: number;
    nilai_risiko: number;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    status_tindakan: StatusTindakan;
    foto_path?: string | null;
    user: {
        name: string;
        nik?: string | null;
        jabatan?: string | null;
        site?: string | null;
    };
    pic?: { name: string; jabatan?: string | null } | null;
    reviews: Review[];
};

type Props = {
    record: LaporanRecord;
    fotoUrl?: string | null;
    fotoUrls?: string[];
    terkirim?: boolean;
    back_url?: string;
    is_pic: boolean;
    attachment_urls: Record<number, string[]>;
};

const RISK_TONE = {
    AA: {
        bg: 'bg-destructive-soft',
        text: 'text-destructive',
        desc: 'Sangat berbahaya — hentikan pekerjaan segera',
    },
    A: {
        bg: 'bg-warning-soft',
        text: 'text-warning',
        desc: 'Berbahaya — perlu tindakan segera',
    },
    B: {
        bg: 'bg-warning-soft',
        text: 'text-warning',
        desc: 'Sedang — perlu dipantau & ditangani',
    },
    C: {
        bg: 'bg-success-soft',
        text: 'text-success',
        desc: 'Rendah — aman terkendali',
    },
} as const;

const P_LABELS: Record<number, string> = {
    1: 'Hampir tidak mungkin',
    2: 'Kecil kemungkinannya',
    3: 'Kadang-kadang',
    4: 'Sering terjadi',
    5: 'Hampir pasti',
};
const F_LABELS: Record<number, string> = {
    1: 'Setahun sekali',
    2: 'Sebulan sekali',
    3: 'Seminggu sekali',
    4: 'Setiap hari',
    5: 'Berkali-kali sehari',
};
const S_LABELS: Record<number, string> = {
    1: 'Sangat ringan',
    2: 'Ringan',
    3: 'Sedang',
    25: 'Berat',
    30: 'Sangat berat / meninggal',
};

const STATUS_OPTIONS: StatusTindakan[] = [
    'pending',
    'continue',
    'progress',
    'close',
];

/** Label/value rows in a single card, matching the other detail pages. */
function InfoList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
    return (
        <dl className="overflow-hidden rounded-lg bg-card">
            {rows.map((r) => (
                <div
                    key={r.label}
                    className="flex justify-between gap-4 border-b border-border/60 px-4 py-3 text-sm last:border-0"
                >
                    <dt className="shrink-0 text-muted-foreground">
                        {r.label}
                    </dt>
                    <dd className="text-right font-semibold">{r.value}</dd>
                </div>
            ))}
        </dl>
    );
}

export default function LaporanBahayaShow(props: Props) {
    return props.terkirim ? (
        <LaporanTerkirim record={props.record} />
    ) : (
        <LaporanDetail {...props} />
    );
}

function LaporanTerkirim({ record }: { record: LaporanRecord }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const nomor = `LB-${(record.site ?? '').toUpperCase()}-${String(record.id).padStart(4, '0')}`;

    return (
        <SubmittedScreen
            title="Laporan terkirim"
            description={`Terima kasih, ${firstNameOf(auth.user.name)}. Laporan Anda membantu rekan kerja pulang dengan selamat.`}
            rows={[
                { label: 'Nomor', value: nomor },
                {
                    label: 'Tingkat',
                    value: `${riskLabels[record.tingkat_risiko]} · ${record.tingkat_risiko}`,
                },
                { label: 'PIC diberi tahu', value: record.pic?.name ?? '—' },
            ]}
            detailHref={`/laporan-bahaya/${record.id}`}
        />
    );
}

function ReviewForm({
    record,
    onCancel,
}: {
    record: LaporanRecord;
    onCancel: () => void;
}) {
    const [comment, setComment] = useState('');
    const [status, setStatus] = useState<StatusTindakan>(
        record.status_tindakan,
    );
    const [signature, setSignature] = useState<string | null>(null);
    const [files, setFiles] = useState<FileList | null>(null);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const needsSignature = status === 'close';

    function handleSubmit() {
        const data = new FormData();
        data.append('status_tindakan', status);

        if (comment) {
            data.append('comment', comment);
        }

        if (signature) {
            data.append('tanda_tangan', signature);
        }

        if (files) {
            Array.from(files).forEach((f) => data.append('attachments[]', f));
        }

        setProcessing(true);
        router.post(`/laporan-bahaya/${record.id}/review`, data, {
            forceFormData: true,
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <div className="flex flex-col gap-5 rounded-lg bg-card p-4">
            <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-bold">
                    Status tindakan
                </legend>
                <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            aria-pressed={status === opt}
                            onClick={() => setStatus(opt)}
                            className={cn(
                                'min-h-11 rounded-full border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                                status === opt
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border bg-background hover:bg-muted',
                            )}
                        >
                            {tindakanLabels[opt]}
                        </button>
                    ))}
                </div>
            </fieldset>

            <label className="flex flex-col gap-2">
                <span className="text-sm font-bold">
                    Komentar{' '}
                    <span className="font-normal text-muted-foreground">
                        (opsional)
                    </span>
                </span>
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tindakan yang sudah diambil, kendala, atau catatan lainnya…"
                    className="min-h-24 text-base"
                />
            </label>

            <div className="flex flex-col gap-2">
                <span className="text-sm font-bold">
                    Lampiran{' '}
                    <span className="font-normal text-muted-foreground">
                        (opsional, maks 5 file)
                    </span>
                </span>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => setFiles(e.target.files)}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip />
                    {files && files.length > 0
                        ? `${files.length} file dipilih`
                        : 'Pilih file'}
                </Button>
                {files && files.length > 0 && (
                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                        {Array.from(files).map((f, i) => (
                            <li key={i}>{f.name}</li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-sm font-bold">
                    Tanda tangan PIC
                    {needsSignature ? (
                        <span className="ml-1 text-destructive">*</span>
                    ) : (
                        <span className="font-normal text-muted-foreground">
                            {' '}
                            (opsional)
                        </span>
                    )}
                </span>
                {needsSignature && (
                    <span className="text-xs text-muted-foreground">
                        Tanda tangan diperlukan untuk menutup laporan.
                    </span>
                )}
                <SignaturePad onDataUrl={setSignature} />
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={processing}
                >
                    Batal
                </Button>
                <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={processing || (needsSignature && !signature)}
                >
                    {processing ? 'Menyimpan…' : 'Simpan review'}
                </Button>
            </div>
        </div>
    );
}

function LaporanDetail({
    record,
    fotoUrl,
    fotoUrls,
    back_url = '/laporan-bahaya',
    is_pic,
    attachment_urls,
}: Props) {
    const rc = RISK_TONE[record.tingkat_risiko] ?? RISK_TONE.C;
    const [showForm, setShowForm] = useState(false);
    const fotos = fotoUrls ?? (fotoUrl ? [fotoUrl] : []);
    const site = record.user.site
        ? record.user.site.charAt(0).toUpperCase() + record.user.site.slice(1)
        : '—';

    return (
        <>
            <Head title="Detail Laporan Bahaya" />

            <div className="flex flex-col gap-4 pt-2 pb-4 lg:mx-auto lg:max-w-[640px]">
                <ModuleHeader
                    backHref={back_url}
                    eyebrow={new Date(record.tanggal).toLocaleDateString(
                        'id-ID',
                        {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        },
                    )}
                    title="Laporan Bahaya"
                    actions={
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`/laporan-bahaya/${record.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Download /> PDF
                            </a>
                        </Button>
                    }
                />

                <div className="flex flex-wrap items-center gap-2">
                    <TindakanBadge status={record.status_tindakan} />
                    <RiskBadge level={record.tingkat_risiko} />
                    {record.kategori && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                            {record.kategori} ·{' '}
                            {record.kategori === 'KTA'
                                ? 'Kondisi tidak aman'
                                : 'Tindakan tidak aman'}
                        </span>
                    )}
                </div>

                <section
                    className={cn(
                        'flex items-center gap-4 rounded-lg px-4 py-4',
                        rc.bg,
                    )}
                >
                    <span
                        className={cn(
                            'tabular text-4xl font-extrabold',
                            rc.text,
                        )}
                    >
                        {record.nilai_risiko}
                    </span>
                    <span className="min-w-0">
                        <span className="block text-xs font-semibold text-muted-foreground">
                            Nilai risiko (P × F × S)
                        </span>
                        <span
                            className={cn('block text-sm font-bold', rc.text)}
                        >
                            {rc.desc}
                        </span>
                    </span>
                </section>

                <SectionLabel>Rincian bahaya</SectionLabel>
                <section className="flex flex-col gap-3 rounded-lg bg-card px-4 py-3">
                    <div>
                        <p className="text-sm font-bold">{record.lokasi}</p>
                        {record.detail_lokasi && (
                            <p className="text-xs text-muted-foreground">
                                {record.detail_lokasi}
                            </p>
                        )}
                        {record.klasifikasi_bahaya && (
                            <p className="text-xs text-muted-foreground">
                                {record.klasifikasi_bahaya}
                            </p>
                        )}
                        {record.waktu_pengamatan && (
                            <p className="text-xs text-muted-foreground">
                                Pukul {record.waktu_pengamatan.slice(0, 5)} WIB
                                {record.shift &&
                                    ` · Shift ${record.shift === 'siang' ? 'Siang' : 'Malam'}`}
                            </p>
                        )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                        {record.deskripsi_bahaya}
                    </p>
                    {fotos.length > 0 && (
                        <div
                            className={cn(
                                'grid gap-2',
                                fotos.length > 1
                                    ? 'grid-cols-2'
                                    : 'grid-cols-1',
                            )}
                        >
                            {fotos.map((src, i) => (
                                <a
                                    key={src}
                                    href={src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={src}
                                        alt={`Foto bahaya ${i + 1}`}
                                        className="max-h-72 w-full rounded-md object-cover"
                                    />
                                </a>
                            ))}
                        </div>
                    )}
                </section>

                <SectionLabel>Penilaian risiko</SectionLabel>
                <div className="grid grid-cols-3 gap-2.5">
                    {[
                        {
                            key: 'P',
                            label: 'Kemungkinan',
                            value: record.probabilitas,
                            sub: P_LABELS[record.probabilitas] ?? '—',
                        },
                        {
                            key: 'F',
                            label: 'Frekuensi',
                            value: record.frekuensi,
                            sub: F_LABELS[record.frekuensi] ?? '—',
                        },
                        {
                            key: 'S',
                            label: 'Keparahan',
                            value: record.severity,
                            sub: S_LABELS[record.severity] ?? '—',
                        },
                    ].map((c) => (
                        <div
                            key={c.key}
                            className="rounded-lg bg-card px-3 py-3"
                        >
                            <p className="text-[11px] font-semibold text-muted-foreground">
                                {c.key} · {c.label}
                            </p>
                            <p className="tabular text-2xl font-extrabold">
                                {c.value}
                            </p>
                            <p className="text-[11px] leading-tight text-muted-foreground">
                                {c.sub}
                            </p>
                        </div>
                    ))}
                </div>

                <SectionLabel>Tindakan perbaikan</SectionLabel>
                <section className="rounded-lg bg-card px-4 py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                        {record.tindakan_perbaikan}
                    </p>
                </section>
                <InfoList
                    rows={[
                        {
                            label: 'PIC',
                            value: record.pic
                                ? `${record.pic.name}${record.pic.jabatan ? ` — ${record.pic.jabatan}` : ''}`
                                : '—',
                        },
                        {
                            label: 'Status',
                            value: tindakanLabels[record.status_tindakan],
                        },
                    ]}
                />

                <SectionLabel>Pelapor</SectionLabel>
                <InfoList
                    rows={[
                        { label: 'Nama', value: record.user.name },
                        { label: 'NIK / NRPP', value: record.user.nik ?? '—' },
                        { label: 'Jabatan', value: record.user.jabatan ?? '—' },
                        { label: 'Site', value: site },
                    ]}
                />

                {record.reviews.length > 0 && (
                    <>
                        <SectionLabel>Riwayat review PIC</SectionLabel>
                        <ul className="flex flex-col gap-2.5">
                            {record.reviews.map((review) => {
                                const attachments =
                                    attachment_urls[review.id] ?? [];

                                return (
                                    <li
                                        key={review.id}
                                        className="flex flex-col gap-3 rounded-lg bg-card px-4 py-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold">
                                                    {review.user.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {[
                                                        review.user.jabatan,
                                                        new Date(
                                                            review.created_at,
                                                        ).toLocaleDateString(
                                                            'id-ID',
                                                            {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            },
                                                        ),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                            </div>
                                            <TindakanBadge
                                                status={review.status_tindakan}
                                            />
                                        </div>

                                        {review.comment && (
                                            <p className="text-sm leading-relaxed whitespace-pre-line">
                                                {review.comment}
                                            </p>
                                        )}

                                        {attachments.length > 0 && (
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                                    Lampiran
                                                </p>
                                                {attachments.map((url, i) =>
                                                    /\.(jpg|jpeg|png|webp)$/i.test(
                                                        url,
                                                    ) ? (
                                                        <img
                                                            key={url}
                                                            src={url}
                                                            alt={`Lampiran ${i + 1}`}
                                                            className="max-h-52 w-full rounded-md object-cover"
                                                        />
                                                    ) : (
                                                        <a
                                                            key={url}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-sm font-semibold underline"
                                                        >
                                                            <Paperclip className="size-3.5" />
                                                            Lampiran {i + 1}
                                                        </a>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        {review.tanda_tangan && (
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                                                    Tanda tangan PIC
                                                </p>
                                                <img
                                                    src={review.tanda_tangan}
                                                    alt="Tanda tangan PIC"
                                                    className="h-20 w-full max-w-xs rounded-md bg-white object-contain"
                                                />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}

                {is_pic && record.status_tindakan !== 'close' && (
                    <>
                        <SectionLabel
                            action={
                                !showForm && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowForm(true)}
                                    >
                                        <Plus /> Review
                                    </Button>
                                )
                            }
                        >
                            Tambah review
                        </SectionLabel>
                        {showForm && (
                            <ReviewForm
                                record={record}
                                onCancel={() => setShowForm(false)}
                            />
                        )}
                    </>
                )}
            </div>
        </>
    );
}
