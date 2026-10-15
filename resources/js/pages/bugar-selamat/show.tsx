import { Head, Link } from '@inertiajs/react';
import { Check, Download, X } from 'lucide-react';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
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
        mark: '✓',
        screen: 'bg-success-soft text-foreground',
        ring: 'bg-success text-on-solid',
        topo: 'opacity-20',
    },
    catatan: {
        title: 'Bekerja dengan catatan',
        desc: 'Tetap waspada dan perhatikan kondisi fisik Anda. Sampaikan ke pengawas bila ada keluhan.',
        mark: '!',
        screen: 'bg-accent text-accent-foreground',
        ring: 'bg-ink text-accent',
        topo: 'opacity-25',
    },
    dilarang: {
        title: 'Dilarang bekerja',
        desc: 'Kondisi Anda belum memenuhi syarat untuk bekerja. Segera lapor ke pengawas Anda.',
        mark: '✕',
        screen: 'bg-destructive text-on-solid',
        ring: 'bg-white text-destructive',
        topo: 'opacity-15 invert',
    },
} as const;

function BugarResult({ record }: { record: BugarRecord }) {
    const r = RESULT[record.status_kelayakan] ?? RESULT.layak;
    const shift = record.shift === 'Malam' ? 'SHIFT II' : 'SHIFT I';

    return (
        <>
            <Head title="Hasil Bugar Selamat" />
            <section
                aria-live="polite"
                className={cn(
                    'relative isolate -mx-4 -mt-4 flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden lg:mx-0 lg:mt-0 lg:min-h-[640px] lg:rounded-[28px]',
                    r.screen,
                )}
            >
                <img
                    src="/images/topo.png"
                    alt=""
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute -top-36 -left-64 -z-10 w-[900px] max-w-none',
                        r.topo,
                    )}
                />
                <div className="flex flex-1 flex-col items-center justify-center gap-[18px] p-6 text-center">
                    <span
                        className={cn(
                            'flex size-28 animate-in items-center justify-center rounded-full text-5xl font-extrabold duration-500 zoom-in-75',
                            r.ring,
                        )}
                        aria-hidden
                    >
                        {r.mark}
                    </span>
                    <p className="text-xs font-bold tracking-[0.12em]">
                        HASIL · {shift} · HARI KE-{record.hari_ke}
                    </p>
                    <h1 className="text-[34px] leading-tight font-extrabold tracking-tight">
                        {r.title}
                    </h1>
                    <p className="max-w-[300px] text-[15px] leading-relaxed">
                        {r.desc}
                    </p>
                </div>
                <div className="flex flex-col gap-2.5 px-4 pt-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-6">
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-current bg-transparent text-inherit hover:bg-black/5"
                    >
                        <Link href={`/bugar-selamat/${record.id}`}>
                            Lihat detail
                        </Link>
                    </Button>
                    <Button
                        asChild
                        size="lg"
                        className="bg-ink text-white hover:bg-ink/90"
                    >
                        <Link href="/home">Kembali ke Beranda</Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
