import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, OctagonX } from 'lucide-react';
import { JsaReview } from '@/components/jsa/jsa-review';
import type { JsaRecord } from '@/components/jsa/jsa-review';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import {
    firstNameOf,
    SubmittedScreen,
} from '@/components/patterns/submitted-screen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Auth } from '@/types';

type Props = {
    record: JsaRecord;
    isTeamLeader: boolean;
    terkirim?: boolean;
};

const STATUS: Record<
    JsaRecord['status'],
    {
        label: string;
        variant: 'warning' | 'success' | 'danger';
        icon: typeof Clock;
    }
> = {
    selesai: { label: 'Selesai', variant: 'success', icon: CheckCircle2 },
    dikonfirmasi: {
        label: 'Dikonfirmasi TL',
        variant: 'success',
        icon: CheckCircle2,
    },
    menunggu_konfirmasi: {
        label: 'Menunggu tanda tangan TL',
        variant: 'warning',
        icon: Clock,
    },
    ditolak: { label: 'Ditolak TL', variant: 'danger', icon: OctagonX },
};

export default function KomunikasiJsaShow({
    record,
    isTeamLeader,
    terkirim = false,
}: Props) {
    if (terkirim) {
        return <JsaTerkirim record={record} />;
    }

    return <JsaDetail record={record} isTeamLeader={isTeamLeader} />;
}

function JsaTerkirim({ record }: { record: JsaRecord }) {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <SubmittedScreen
            title="JSA terkirim"
            description={`Terima kasih, ${firstNameOf(auth.user.name)}. Komunikasi JSA membantu tim bekerja dengan aman.`}
            rows={[
                { label: 'Dokumen', value: record.judul_dokumen },
                { label: 'Lokasi', value: record.lokasi },
                {
                    label: 'Team leader diberi tahu',
                    value: record.team_leader?.name ?? '—',
                },
            ]}
            detailHref={`/sap/komunikasi-jsa/${record.id}`}
            detailLabel="Lihat JSA"
        />
    );
}

function JsaDetail({
    record,
    isTeamLeader,
}: {
    record: JsaRecord;
    isTeamLeader: boolean;
}) {
    const status = STATUS[record.status] ?? STATUS.menunggu_konfirmasi;
    const StatusIcon = status.icon;
    const signatures = [
        ...(record.supervisor_signature
            ? [
                  {
                      who: `Supervisor · ${record.user.name}`,
                      src: record.supervisor_signature,
                  },
              ]
            : []),
        ...(record.tl_signature
            ? [
                  {
                      who: `Team leader · ${record.team_leader?.name ?? ''}`,
                      src: record.tl_signature,
                  },
              ]
            : []),
    ];

    return (
        <>
            <Head title="Komunikasi JSA" />
            <div className="flex flex-col gap-4 pt-2 pb-4 lg:mx-auto lg:max-w-[640px]">
                <ModuleHeader
                    backHref="/sap/komunikasi-jsa"
                    title="Komunikasi JSA"
                    eyebrow={new Date(record.tanggal).toLocaleDateString(
                        'id-ID',
                        {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        },
                    )}
                />

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={status.variant}>
                        <StatusIcon />
                        {status.label}
                    </Badge>
                    {record.tl_dikonfirmasi_at && (
                        <span className="text-xs text-muted-foreground">
                            {new Date(
                                record.tl_dikonfirmasi_at,
                            ).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                    )}
                </div>

                <JsaReview record={record} />

                {signatures.length > 0 && (
                    <>
                        <SectionLabel>Tanda tangan</SectionLabel>
                        <div className="grid grid-cols-1 gap-3 rounded-lg bg-card p-4 sm:grid-cols-2">
                            {signatures.map((s) => (
                                <div
                                    key={s.who}
                                    className="flex flex-col gap-2"
                                >
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        {s.who}
                                    </p>
                                    <img
                                        src={s.src}
                                        alt={`Tanda tangan ${s.who}`}
                                        className="max-h-32 w-full max-w-xs rounded-md bg-white object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {record.status === 'menunggu_konfirmasi' && (
                    <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] -mx-4 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-2 lg:bottom-0 lg:mx-0 lg:px-0">
                        {isTeamLeader ? (
                            <Button asChild size="lg" className="w-full">
                                <Link
                                    href={`/sap/komunikasi-jsa/${record.id}/konfirmasi`}
                                >
                                    Tanda tangan sebagai TL
                                </Link>
                            </Button>
                        ) : (
                            <p className="rounded-full bg-warning-soft px-4 py-3 text-center text-sm font-semibold text-warning">
                                Menunggu tanda tangan{' '}
                                {record.team_leader?.name ?? 'team leader'}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
