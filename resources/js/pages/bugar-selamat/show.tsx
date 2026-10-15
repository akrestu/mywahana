import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BedDouble,
    Brain,
    Check,
    Coffee,
    FileDown,
    FlaskConical,
    Moon,
    Pill,
    ShieldAlert,
    ShieldCheck,
    Sun,
    X,
} from 'lucide-react';
import { KelayakanBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

const statusConfig = {
    layak: {
        bg: 'bg-green-50 border-green-300 dark:bg-green-950/30',
        icon: ShieldCheck,
        iconClass: 'text-green-500',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
        title: 'LAYAK BEKERJA',
        desc: 'Kondisi Anda prima untuk bekerja hari ini.',
    },
    catatan: {
        bg: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30',
        icon: ShieldAlert,
        iconClass: 'text-yellow-500',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        title: 'BEKERJA DENGAN CATATAN',
        desc: 'Tetap waspada dan perhatikan kondisi fisik Anda.',
    },
    dilarang: {
        bg: 'bg-red-50 border-red-300 dark:bg-red-950/30',
        icon: ShieldAlert,
        iconClass: 'text-red-500',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        title: 'DILARANG BEKERJA',
        desc: 'Kondisi Anda tidak memenuhi syarat untuk bekerja.',
    },
};

function AnswerRow({
    icon: Icon,
    label,
    value,
    dangerWhen,
}: {
    icon: React.FC<{ className?: string }>;
    label: string;
    value: boolean | string;
    dangerWhen?: boolean;
}) {
    const isDanger = dangerWhen !== undefined ? value === dangerWhen : false;
    const isBool = typeof value === 'boolean';

    return (
        <div className="flex items-center gap-4 py-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-base leading-snug text-foreground">
                {label}
            </span>
            {isBool ? (
                <div
                    className={cn(
                        'flex size-9 items-center justify-center rounded-full',
                        isDanger
                            ? 'bg-red-100 dark:bg-red-950/40'
                            : 'bg-green-100 dark:bg-green-950/40',
                    )}
                >
                    {isDanger ? (
                        <X size={16} className="font-bold text-red-600" />
                    ) : (
                        <Check size={16} className="font-bold text-green-600" />
                    )}
                </div>
            ) : (
                <span className="text-base font-bold">{value as string}</span>
            )}
        </div>
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

    const cfg = statusConfig[record.status_kelayakan];
    const StatusIcon = cfg.icon;

    const jamTidurLabel =
        record.jam_tidur === '<5'
            ? '< 5 jam'
            : record.jam_tidur === '5-6'
              ? '5–6 jam'
              : '> 6 jam';

    return (
        <>
            <Head title="Detail Bugar Selamat" />

            <div className="flex flex-col gap-6">
                {/* Back */}
                <Link
                    href={back_url}
                    className="flex w-fit items-center gap-2 py-1 text-base text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft size={18} />
                    {back_url.includes('kalender')
                        ? 'Kembali ke Kalender'
                        : back_url.includes('admin')
                          ? 'Kembali ke Monitoring Harian'
                          : 'Kembali ke Riwayat'}
                </Link>

                {/* Status hero */}
                <div
                    className={cn(
                        'flex flex-col items-center gap-4 rounded-2xl border-2 px-4 py-8 text-center',
                        cfg.bg,
                    )}
                >
                    <div
                        className={cn(
                            'flex size-20 items-center justify-center rounded-full shadow-sm',
                            cfg.iconBg,
                        )}
                    >
                        <StatusIcon className={cn('size-10', cfg.iconClass)} />
                    </div>
                    <div className="space-y-2">
                        <KelayakanBadge status={record.status_kelayakan} />
                        <p className="text-sm text-muted-foreground">
                            {cfg.desc}
                        </p>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {new Date(record.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>

                {/* Identitas karyawan */}
                <Card>
                    <CardHeader className="pt-5 pb-2">
                        <CardTitle className="text-base font-bold">
                            👤 Identitas Karyawan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <dl className="flex flex-col gap-0">
                            {[
                                { label: 'Nama', value: record.user.name },
                                { label: 'NIK', value: record.user.nik ?? '—' },
                                {
                                    label: 'Jabatan',
                                    value: record.user.jabatan ?? '—',
                                },
                                {
                                    label: 'Site',
                                    value: record.user.site
                                        ? record.user.site
                                              .charAt(0)
                                              .toUpperCase() +
                                          record.user.site.slice(1)
                                        : '—',
                                },
                            ].map(({ label, value }, idx, arr) => (
                                <div key={label}>
                                    <div className="flex items-center justify-between py-3.5 text-sm">
                                        <dt className="text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="text-right font-semibold">
                                            {value}
                                        </dd>
                                    </div>
                                    {idx < arr.length - 1 && <Separator />}
                                </div>
                            ))}
                        </dl>
                    </CardContent>
                </Card>

                {/* Jadwal */}
                <Card>
                    <CardHeader className="pt-5 pb-2">
                        <CardTitle className="text-base font-bold">
                            📅 Jadwal Kerja
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center justify-between py-3.5 text-sm">
                            <span className="text-muted-foreground">Shift</span>
                            <div className="flex items-center gap-2 font-semibold">
                                {record.shift === 'Siang' ? (
                                    <Sun size={16} className="text-amber-500" />
                                ) : (
                                    <Moon
                                        size={16}
                                        className="text-indigo-500"
                                    />
                                )}
                                {record.shift === 'Siang'
                                    ? 'Shift I – Siang'
                                    : 'Shift II – Malam'}
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between py-3.5 text-sm">
                            <span className="text-muted-foreground">
                                Hari ke-
                            </span>
                            <span className="font-semibold">
                                {record.hari_ke}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Kondisi fisik */}
                <Card>
                    <CardHeader className="pt-5 pb-2">
                        <CardTitle className="text-base font-bold">
                            🩺 Kondisi Fisik &amp; Mental
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <AnswerRow
                            icon={BedDouble}
                            label="Jam tidur"
                            value={jamTidurLabel}
                        />
                        <Separator />
                        <AnswerRow
                            icon={Coffee}
                            label="Sedang sakit atau kelelahan?"
                            value={record.kondisi_sakit}
                            dangerWhen={true}
                        />
                        <Separator />
                        <AnswerRow
                            icon={Pill}
                            label="Minum obat dalam 6 jam terakhir?"
                            value={record.minum_obat}
                            dangerWhen={true}
                        />
                        <Separator />
                        <AnswerRow
                            icon={Brain}
                            label="Ada masalah pribadi mengganggu?"
                            value={record.masalah_pribadi}
                            dangerWhen={true}
                        />
                        <Separator />
                        <AnswerRow
                            icon={FlaskConical}
                            label="Terpengaruh alkohol?"
                            value={record.pengaruh_alkohol}
                            dangerWhen={true}
                        />
                        <Separator />
                        <AnswerRow
                            icon={ShieldCheck}
                            label="Siap bekerja hari ini?"
                            value={record.siap_bekerja}
                            dangerWhen={false}
                        />
                    </CardContent>
                </Card>

                {/* Catatan */}
                {record.catatan && (
                    <Card>
                        <CardHeader className="pt-5 pb-2">
                            <CardTitle className="text-base font-bold">
                                📝 Catatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-5">
                            <p className="text-base leading-relaxed text-muted-foreground">
                                {record.catatan}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <a
                    href={`/bugar-selamat/${record.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Button
                        variant="outline"
                        className="h-13 w-full gap-2 text-base font-semibold"
                    >
                        <FileDown size={18} />
                        Unduh / Export PDF
                    </Button>
                </a>
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
        ring: 'bg-success text-white dark:text-[oklch(0.191_0_0)]',
        topo: 'opacity-20',
    },
    catatan: {
        title: 'Bekerja dengan catatan',
        desc: 'Tetap waspada dan perhatikan kondisi fisik Anda. Sampaikan ke pengawas bila ada keluhan.',
        mark: '!',
        screen: 'bg-accent text-accent-foreground',
        ring: 'bg-[oklch(0.191_0_0)] text-accent',
        topo: 'opacity-25',
    },
    dilarang: {
        title: 'Dilarang bekerja',
        desc: 'Kondisi Anda belum memenuhi syarat untuk bekerja. Segera lapor ke pengawas Anda.',
        mark: '✕',
        screen: 'bg-destructive text-white dark:text-[oklch(0.191_0_0)]',
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
                        className="bg-[oklch(0.191_0_0)] text-white hover:bg-[oklch(0.191_0_0)]/90"
                    >
                        <Link href="/home">Kembali ke Beranda</Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
