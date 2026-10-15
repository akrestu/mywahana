import { Head } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    Download,
    OctagonX,
    TriangleAlert,
    X,
} from 'lucide-react';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { SubmittedScreen } from '@/components/patterns/submitted-screen';
import { KelayakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BugarRecord = {
    id: number;
    tanggal: string;
    shift: string;
    hari_ke: number;
    jam_tidur: string;
    kondisi_sakit: boolean;
    minum_obat: boolean;
    masalah_pribadi: boolean;
    pengaruh_alkohol: boolean;
    siap_bekerja: boolean;
    status_kelayakan: 'layak' | 'catatan' | 'dilarang';
    catatan?: string | null;
    user: {
        name: string;
        nik?: string | null;
        jabatan?: string | null;
        site?: string | null;
    };
};

type Props = { record: BugarRecord; back_url?: string; hasil?: boolean };

const STATUS_TONE = {
    layak: {
        bg: 'bg-success-soft',
        text: 'text-success',
        desc: 'Kondisi prima untuk bekerja hari ini.',
    },
    catatan: {
        bg: 'bg-warning-soft',
        text: 'text-warning',
        desc: 'Tetap waspada dan perhatikan kondisi fisik.',
    },
    dilarang: {
        bg: 'bg-destructive-soft',
        text: 'text-destructive',
        desc: 'Kondisi tidak memenuhi syarat untuk bekerja.',
    },
} as const;

/** Yes/no answer chip; red when the answer is the risky one. */
function AnswerChip({ value, risky }: { value: boolean; risky: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                risky
                    ? 'bg-destructive-soft text-destructive'
                    : 'bg-success-soft text-success',
            )}
        >
            {risky ? (
                <X className="size-3.5" />
            ) : (
                <Check className="size-3.5" />
            )}
            {value ? 'Ya' : 'Tidak'}
        </span>
    );
}

/** Label/value rows in a single card. */
function InfoList({
    rows,
}: {
    rows: { label: string; value: string | number }[];
}) {
    return (
        <dl className="overflow-hidden rounded-lg bg-card">
            {rows.map((r) => (
                <div
                    key={r.label}
                    className="flex justify-between gap-4 border-b border-border/60 px-4 py-3 text-sm last:border-0"
                >
                    <dt className="text-muted-foreground">{r.label}</dt>
                    <dd className="tabular text-right font-semibold">
                        {r.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default function BugarSelamatShow({
    record,
    back_url = '/bugar-selamat',
    hasil = false,
}: Props) {
    if (hasil) {
        return <BugarResult record={record} />;
    }

    const tone = STATUS_TONE[record.status_kelayakan] ?? STATUS_TONE.layak;
    const jamTidur =
        record.jam_tidur === '<5'
            ? '< 5 jam'
            : record.jam_tidur === '5-6'
              ? '5–6 jam'
              : '> 6 jam';
    const site = record.user.site
        ? record.user.site.charAt(0).toUpperCase() + record.user.site.slice(1)
        : '—';
    const answers = [
        {
            label: 'Sakit atau kelelahan',
            value: record.kondisi_sakit,
            riskyWhen: true,
        },
        {
            label: 'Minum obat (6 jam terakhir)',
            value: record.minum_obat,
            riskyWhen: true,
        },
        {
            label: 'Masalah pribadi mengganggu',
            value: record.masalah_pribadi,
            riskyWhen: true,
        },
        {
            label: 'Terpengaruh alkohol',
            value: record.pengaruh_alkohol,
            riskyWhen: true,
        },
        {
            label: 'Siap bekerja hari ini',
            value: record.siap_bekerja,
            riskyWhen: false,
        },
    ];

    return (
        <>
            <Head title="Detail Bugar Selamat" />

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
                    title="Bugar Selamat"
                    actions={
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`/bugar-selamat/${record.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Download /> PDF
                            </a>
                        </Button>
                    }
                />

                <section
                    className={cn(
                        'flex flex-col items-start gap-1.5 rounded-lg px-4 py-4',
                        tone.bg,
                    )}
                >
                    <KelayakanBadge status={record.status_kelayakan} />
                    <p className={cn('text-sm font-bold', tone.text)}>
                        {tone.desc}
                    </p>
                </section>

                <SectionLabel>Jadwal kerja</SectionLabel>
                <InfoList
                    rows={[
                        {
                            label: 'Shift',
                            value:
                                record.shift === 'Siang'
                                    ? 'Shift I · Siang'
                                    : 'Shift II · Malam',
                        },
                        { label: 'Hari ke-', value: record.hari_ke },
                        { label: 'Jam tidur', value: jamTidur },
                    ]}
                />

                <SectionLabel>Kondisi fisik &amp; mental</SectionLabel>
                <ul className="overflow-hidden rounded-lg bg-card">
                    {answers.map((a) => (
                        <li
                            key={a.label}
                            className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 text-sm last:border-0"
                        >
                            <span>{a.label}</span>
                            <AnswerChip
                                value={a.value}
                                risky={a.value === a.riskyWhen}
                            />
                        </li>
                    ))}
                </ul>

                {record.catatan && (
                    <section className="flex flex-col gap-1.5 rounded-lg bg-card px-4 py-3">
                        <h3 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                            Catatan
                        </h3>
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                            {record.catatan}
                        </p>
                    </section>
                )}

                <SectionLabel>Karyawan</SectionLabel>
                <InfoList
                    rows={[
                        { label: 'Nama', value: record.user.name },
                        { label: 'NIK', value: record.user.nik ?? '—' },
                        { label: 'Jabatan', value: record.user.jabatan ?? '—' },
                        { label: 'Site', value: site },
                    ]}
                />
            </div>
        </>
    );
}

const RESULT = {
    layak: {
        title: 'Layak bekerja',
        desc: 'Kondisi Anda prima. Selamat bekerja dan tetap utamakan keselamatan.',
        icon: CheckCircle2,
        tone: 'success',
    },
    catatan: {
        title: 'Bekerja dengan catatan',
        desc: 'Tetap waspada dan perhatikan kondisi fisik Anda. Sampaikan ke pengawas bila ada keluhan.',
        icon: TriangleAlert,
        tone: 'warning',
    },
    dilarang: {
        title: 'Dilarang bekerja',
        desc: 'Kondisi Anda belum memenuhi syarat untuk bekerja. Segera lapor ke pengawas Anda.',
        icon: OctagonX,
        tone: 'danger',
    },
} as const;

function BugarResult({ record }: { record: BugarRecord }) {
    const r = RESULT[record.status_kelayakan] ?? RESULT.layak;

    return (
        <SubmittedScreen
            title={r.title}
            description={r.desc}
            icon={r.icon}
            tone={r.tone}
            rows={[
                {
                    label: 'Tanggal',
                    value: new Date(record.tanggal).toLocaleDateString(
                        'id-ID',
                        { day: 'numeric', month: 'long', year: 'numeric' },
                    ),
                },
                {
                    label: 'Shift',
                    value:
                        record.shift === 'Malam'
                            ? 'Shift II · Malam'
                            : 'Shift I · Siang',
                },
                { label: 'Hari ke-', value: record.hari_ke },
            ]}
            detailHref={`/bugar-selamat/${record.id}`}
            detailLabel="Lihat detail"
        />
    );
}
