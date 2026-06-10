import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BedDouble, Brain, Check, Coffee, FileDown, FlaskConical, Moon, Pill, ShieldAlert, ShieldCheck, Sun, X } from 'lucide-react';
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

type Props = { record: BugarRecord };

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
            <span className="flex-1 text-base text-foreground leading-snug">{label}</span>
            {isBool ? (
                <div className={cn(
                    'flex size-9 items-center justify-center rounded-full',
                    isDanger ? 'bg-red-100 dark:bg-red-950/40' : 'bg-green-100 dark:bg-green-950/40',
                )}>
                    {isDanger
                        ? <X size={16} className="text-red-600 font-bold" />
                        : <Check size={16} className="text-green-600 font-bold" />}
                </div>
            ) : (
                <span className="text-base font-bold">{value as string}</span>
            )}
        </div>
    );
}

export default function BugarSelamatShow({ record }: Props) {
    const cfg = statusConfig[record.status_kelayakan];
    const StatusIcon = cfg.icon;

    const jamTidurLabel = record.jam_tidur === '<5' ? '< 5 jam' : record.jam_tidur === '5-6' ? '5–6 jam' : '> 6 jam';

    return (
        <>
            <Head title="Detail Bugar Selamat" />

            <div className="flex flex-col gap-6">
                {/* Back */}
                <Link
                    href="/bugar-selamat"
                    className="flex w-fit items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                    <ArrowLeft size={18} />
                    Kembali ke Riwayat
                </Link>

                {/* Status hero */}
                <div className={cn('flex flex-col items-center gap-4 rounded-2xl border-2 py-8 text-center px-4', cfg.bg)}>
                    <div className={cn('flex size-20 items-center justify-center rounded-full shadow-sm', cfg.iconBg)}>
                        <StatusIcon className={cn('size-10', cfg.iconClass)} />
                    </div>
                    <div className="space-y-2">
                        <KelayakanBadge status={record.status_kelayakan} />
                        <p className="text-sm text-muted-foreground">{cfg.desc}</p>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {new Date(record.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                    </p>
                </div>

                {/* Identitas karyawan */}
                <Card>
                    <CardHeader className="pb-2 pt-5">
                        <CardTitle className="text-base font-bold">👤 Identitas Karyawan</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <dl className="flex flex-col gap-0">
                            {[
                                { label: 'Nama',    value: record.user.name },
                                { label: 'NIK',     value: record.user.nik ?? '—' },
                                { label: 'Jabatan', value: record.user.jabatan ?? '—' },
                                { label: 'Site',    value: record.user.site ? record.user.site.charAt(0).toUpperCase() + record.user.site.slice(1) : '—' },
                            ].map(({ label, value }, idx, arr) => (
                                <div key={label}>
                                    <div className="flex items-center justify-between py-3.5 text-sm">
                                        <dt className="text-muted-foreground">{label}</dt>
                                        <dd className="font-semibold text-right">{value}</dd>
                                    </div>
                                    {idx < arr.length - 1 && <Separator />}
                                </div>
                            ))}
                        </dl>
                    </CardContent>
                </Card>

                {/* Jadwal */}
                <Card>
                    <CardHeader className="pb-2 pt-5">
                        <CardTitle className="text-base font-bold">📅 Jadwal Kerja</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center justify-between py-3.5 text-sm">
                            <span className="text-muted-foreground">Shift</span>
                            <div className="flex items-center gap-2 font-semibold">
                                {record.shift === 'Siang'
                                    ? <Sun size={16} className="text-amber-500" />
                                    : <Moon size={16} className="text-indigo-500" />}
                                {record.shift === 'Siang' ? 'Shift I – Siang' : 'Shift II – Malam'}
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between py-3.5 text-sm">
                            <span className="text-muted-foreground">Hari ke-</span>
                            <span className="font-semibold">{record.hari_ke}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Kondisi fisik */}
                <Card>
                    <CardHeader className="pb-2 pt-5">
                        <CardTitle className="text-base font-bold">🩺 Kondisi Fisik &amp; Mental</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <AnswerRow icon={BedDouble}    label="Jam tidur"                           value={jamTidurLabel} />
                        <Separator />
                        <AnswerRow icon={Coffee}       label="Sedang sakit atau kelelahan?"        value={record.kondisi_sakit}    dangerWhen={true} />
                        <Separator />
                        <AnswerRow icon={Pill}         label="Minum obat dalam 6 jam terakhir?"   value={record.minum_obat}       dangerWhen={true} />
                        <Separator />
                        <AnswerRow icon={Brain}        label="Ada masalah pribadi mengganggu?"     value={record.masalah_pribadi}  dangerWhen={true} />
                        <Separator />
                        <AnswerRow icon={FlaskConical} label="Terpengaruh alkohol?"                value={record.pengaruh_alkohol} dangerWhen={true} />
                        <Separator />
                        <AnswerRow icon={ShieldCheck}  label="Siap bekerja hari ini?"              value={record.siap_bekerja}     dangerWhen={false} />
                    </CardContent>
                </Card>

                {/* Catatan */}
                {record.catatan && (
                    <Card>
                        <CardHeader className="pb-2 pt-5">
                            <CardTitle className="text-base font-bold">📝 Catatan</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-5">
                            <p className="text-base text-muted-foreground leading-relaxed">{record.catatan}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <a href={`/bugar-selamat/${record.id}/pdf`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full h-13 text-base gap-2 font-semibold">
                        <FileDown size={18} />
                        Unduh / Export PDF
                    </Button>
                </a>
            </div>
        </>
    );
}
