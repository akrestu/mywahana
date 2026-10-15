import { Head, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, Download, OctagonX } from 'lucide-react';
import { ObservasiReview } from '@/components/observasi/observasi-review';
import type { ObservasiRecord } from '@/components/observasi/observasi-review';
import { ApprovalBar } from '@/components/patterns/approval-bar';
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

type Status = 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak';
type Props = {
    record: ObservasiRecord & {
        status: Status;
        pj_signature: string | null;
        pj_tolak_alasan: string | null;
        pj_dikonfirmasi_at: string | null;
        pj_ditolak_at: string | null;
    };
    is_pj: boolean;
    terkirim?: boolean;
};

const STATUS: Record<
    Status,
    {
        label: string;
        variant: 'warning' | 'success' | 'danger';
        icon: typeof Clock;
    }
> = {
    menunggu_konfirmasi: {
        label: 'Menunggu konfirmasi PJ',
        variant: 'warning',
        icon: Clock,
    },
    dikonfirmasi: {
        label: 'Dikonfirmasi',
        variant: 'success',
        icon: CheckCircle2,
    },
    ditolak: { label: 'Ditolak oleh PJ', variant: 'danger', icon: OctagonX },
};

const fmt = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

export default function ObservasiKeselamatanShow({
    record,
    is_pj,
    terkirim = false,
}: Props) {
    if (terkirim) {
        return <ObservasiTerkirim record={record} />;
    }

    return <ObservasiDetail record={record} is_pj={is_pj} />;
}

function ObservasiTerkirim({ record }: { record: Props['record'] }) {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <SubmittedScreen
            title="Observasi terkirim"
            description={`Terima kasih, ${firstNameOf(auth.user.name)}. Observasi Anda membantu rekan kerja pulang dengan selamat.`}
            rows={[
                { label: 'Pekerjaan', value: record.jenis_pekerjaan },
                { label: 'Lokasi', value: record.lokasi_kerja },
                {
                    label: 'PJ diberi tahu',
                    value: record.penanggung_jawab?.name ?? '—',
                },
            ]}
            detailHref={`/sap/observasi-keselamatan/${record.id}`}
            detailLabel="Lihat observasi"
        />
    );
}

function ObservasiDetail({ record, is_pj }: Pick<Props, 'record' | 'is_pj'>) {
    const base = `/sap/observasi-keselamatan/${record.id}`;
    const status = STATUS[record.status] ?? STATUS.menunggu_konfirmasi;
    const StatusIcon = status.icon;
    const decidedAt = record.pj_dikonfirmasi_at ?? record.pj_ditolak_at;

    return (
        <>
            <Head title="Observasi Keselamatan" />
            <div className="flex flex-col gap-4 pt-2 pb-4 lg:mx-auto lg:max-w-[640px]">
                <ModuleHeader
                    backHref="/sap/observasi-keselamatan"
                    title="Observasi Keselamatan"
                    eyebrow={new Date(record.tanggal).toLocaleDateString(
                        'id-ID',
                        {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        },
                    )}
                    actions={
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`${base}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Download /> PDF
                            </a>
                        </Button>
                    }
                />

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={status.variant}>
                        <StatusIcon />
                        {status.label}
                    </Badge>
                    {decidedAt && (
                        <span className="text-xs text-muted-foreground">
                            {fmt(decidedAt)}
                        </span>
                    )}
                </div>

                {record.status === 'ditolak' && record.pj_tolak_alasan && (
                    <div
                        role="note"
                        className="rounded-lg bg-destructive-soft px-4 py-3"
                    >
                        <p className="text-sm font-bold text-destructive">
                            Alasan penolakan
                        </p>
                        <p className="mt-1 text-sm">{record.pj_tolak_alasan}</p>
                    </div>
                )}

                <ObservasiReview record={record} />

                {record.pj_signature && (
                    <>
                        <SectionLabel>
                            Tanda tangan penanggung jawab
                        </SectionLabel>
                        <div className="flex flex-col gap-2 rounded-lg bg-card p-4">
                            {record.penanggung_jawab && (
                                <p className="text-xs font-semibold text-muted-foreground">
                                    {record.penanggung_jawab.name}
                                </p>
                            )}
                            <img
                                src={record.pj_signature}
                                alt="Tanda tangan penanggung jawab"
                                className="max-h-40 w-full max-w-xs rounded-md bg-white object-contain"
                            />
                        </div>
                    </>
                )}

                {record.status === 'menunggu_konfirmasi' && (
                    <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] -mx-4 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-2 lg:bottom-0 lg:mx-0 lg:px-0">
                        {is_pj ? (
                            <ApprovalBar
                                rejectUrl={`${base}/tolak`}
                                approveHref={`${base}/konfirmasi`}
                                approveLabel="Konfirmasi"
                                subject="observasi ini"
                            />
                        ) : (
                            <p className="rounded-full bg-warning-soft px-4 py-3 text-center text-sm font-semibold text-warning">
                                Menunggu konfirmasi{' '}
                                {record.penanggung_jawab?.name ??
                                    'penanggung jawab'}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
