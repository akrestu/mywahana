import { Head, Link, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Download,
    ImageIcon,
    OctagonX,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import type { InspeksiConfig } from '@/components/inspeksi/checklists';
import { ApprovalBar } from '@/components/patterns/approval-bar';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { RejectDialog } from '@/components/patterns/reject-dialog';
import { SignaturePad } from '@/components/patterns/signature-pad';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string; jabatan?: string | null };
type TindakanRow = {
    tindakan: string;
    pic: string;
    due_date: string;
    remark: string;
};
type RiskLevel = 'L' | 'M' | 'H' | 'VH';
type Status = 'menunggu_re_inspeksi' | 'selesai' | 'ditolak';

export type InspeksiRecord = {
    id: number;
    user: UserInfo;
    re_inspektor: UserInfo | null;
    peserta?: UserInfo[];
    tanggal: string;
    project_site: string;
    total_poin?: number;
    max_poin?: number;
    persentase: number | null;
    risk_level: RiskLevel | null;
    status?: Status;
    tindakan_perbaikan?: TindakanRow[] | null;
    foto_items?: Record<string, string> | null;
    ttd_inspektor?: string | null;
    ttd_re_inspektor?: string | null;
    tolak_alasan?: string | null;
    created_at?: string;
    re_inspeksi_at?: string | null;
    [key: string]: unknown;
};

const LEVEL: Record<RiskLevel, { label: string; card: string; bar: string }> = {
    L: {
        label: 'Baik',
        card: 'bg-success-soft text-success',
        bar: 'bg-success',
    },
    M: {
        label: 'Cukup',
        card: 'bg-accent-soft text-foreground',
        bar: 'bg-accent',
    },
    H: {
        label: 'Perhatian',
        card: 'bg-warning-soft text-warning',
        bar: 'bg-warning',
    },
    VH: {
        label: 'Perlu tindakan',
        card: 'bg-destructive-soft text-destructive',
        bar: 'bg-destructive',
    },
};

const SCORE: Record<string, { label: string; cls: string }> = {
    '1': {
        label: 'Sangat kurang',
        cls: 'bg-destructive-soft text-destructive',
    },
    '2': { label: 'Kurang', cls: 'bg-warning-soft text-warning' },
    '3': { label: 'Baik', cls: 'bg-success-soft text-success' },
    '4': { label: 'Sangat baik', cls: 'bg-muted text-foreground' },
};

const STATUS: Record<
    Status,
    {
        label: string;
        variant: 'warning' | 'success' | 'danger';
        icon: typeof Clock;
    }
> = {
    menunggu_re_inspeksi: {
        label: 'Menunggu re-inspeksi',
        variant: 'warning',
        icon: Clock,
    },
    selesai: { label: 'Selesai', variant: 'success', icon: CheckCircle2 },
    ditolak: { label: 'Ditolak', variant: 'danger', icon: OctagonX },
};

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

function ScoreCard({ record }: { record: InspeksiRecord }) {
    if (!record.risk_level || record.persentase === null) {
        return null;
    }

    const lv = LEVEL[record.risk_level];

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-[22px] p-[18px]',
                lv.card,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="tabular text-3xl font-extrabold">
                        {record.persentase}%
                    </p>
                    {record.max_poin ? (
                        <p className="tabular text-[13px]">
                            {record.total_poin} dari {record.max_poin} poin
                        </p>
                    ) : null}
                </div>
                <span className="rounded-full bg-card/80 px-3.5 py-1.5 text-sm font-bold text-foreground">
                    {lv.label}
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-card/60">
                <div
                    className={cn('h-full rounded-full', lv.bar)}
                    style={{ width: `${record.persentase}%` }}
                />
            </div>
        </div>
    );
}

function InfoList({
    config,
    record,
}: {
    config: InspeksiConfig;
    record: InspeksiRecord;
}) {
    const rows = [
        { label: 'Inspektor', value: record.user.name },
        { label: 'Project / site', value: record.project_site },
        ...config.fields.map((f) => ({
            label: f.label,
            value: (record[f.key] as string | null) ?? '—',
        })),
        ...(record.re_inspektor
            ? [{ label: 'Re-inspektor', value: record.re_inspektor.name }]
            : []),
        ...(record.peserta?.length
            ? [
                  {
                      label: 'Peserta',
                      value: record.peserta.map((p) => p.name).join(', '),
                  },
              ]
            : []),
    ];

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
                    <dd className="text-right font-semibold">
                        {r.value || '—'}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

/** Read-only inspection record with approval actions for the re-inspector. */
export function InspeksiDetail({
    config,
    record,
    isRi,
}: {
    config: InspeksiConfig;
    record: InspeksiRecord;
    isRi: boolean;
}) {
    const base = `/sap/inspeksi-${config.kind}`;
    const status = record.status ? STATUS[record.status] : null;
    const StatusIcon = status?.icon;
    const waiting = record.status === 'menunggu_re_inspeksi';

    const timeline: {
        label: string;
        date: string | null;
        done: boolean;
        bad?: boolean;
    }[] = [
        {
            label: `Dibuat oleh ${record.user.name}`,
            date: record.created_at ?? record.tanggal,
            done: true,
        },
        record.status === 'ditolak'
            ? {
                  label: `Ditolak${record.re_inspektor ? ` oleh ${record.re_inspektor.name}` : ''}`,
                  date: record.re_inspeksi_at ?? null,
                  done: true,
                  bad: true,
              }
            : {
                  label: record.re_inspektor
                      ? `Re-inspeksi oleh ${record.re_inspektor.name}`
                      : 'Tanpa re-inspektor',
                  date:
                      record.status === 'selesai'
                          ? (record.re_inspeksi_at ?? null)
                          : null,
                  done: record.status === 'selesai' || !record.re_inspektor,
              },
    ];

    return (
        <>
            <Head title={`Detail ${config.title}`} />
            <div className="flex flex-col gap-4 pt-2 pb-4 lg:mx-auto lg:max-w-[640px]">
                <ModuleHeader
                    backHref={base}
                    title={config.title}
                    eyebrow={fmtDate(record.tanggal)}
                    actions={
                        <Button asChild variant="outline" size="sm">
                            <a
                                href={`${base}/${record.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Download /> PDF
                            </a>
                        </Button>
                    }
                />

                {status && StatusIcon && (
                    <Badge variant={status.variant} className="self-start">
                        <StatusIcon />
                        {status.label}
                    </Badge>
                )}

                <ScoreCard record={record} />

                {record.status === 'ditolak' && record.tolak_alasan && (
                    <div
                        role="note"
                        className="rounded-lg bg-destructive-soft px-4 py-3"
                    >
                        <p className="text-sm font-bold text-destructive">
                            Alasan penolakan
                        </p>
                        <p className="mt-1 text-sm">{record.tolak_alasan}</p>
                    </div>
                )}

                <InfoList config={config} record={record} />

                <SectionLabel>Riwayat</SectionLabel>
                <ol className="flex flex-col rounded-lg bg-card px-4 py-3">
                    {timeline.map((t, i) => (
                        <li
                            key={i}
                            className="relative flex gap-3 pb-3 last:pb-0"
                        >
                            {i < timeline.length - 1 && (
                                <span
                                    aria-hidden
                                    className="absolute top-5 left-[7px] h-full w-0.5 bg-border"
                                />
                            )}
                            <span
                                aria-hidden
                                className={cn(
                                    'relative mt-1 size-4 shrink-0 rounded-full border-2',
                                    t.bad
                                        ? 'border-destructive bg-destructive'
                                        : t.done
                                          ? 'border-foreground bg-foreground'
                                          : 'border-border bg-card',
                                )}
                            />
                            <span className="min-w-0">
                                <span
                                    className={cn(
                                        'block text-sm font-semibold',
                                        !t.done && 'text-muted-foreground',
                                    )}
                                >
                                    {t.label}
                                </span>
                                {t.date && (
                                    <span className="block text-xs text-muted-foreground">
                                        {new Date(t.date).toLocaleString(
                                            'id-ID',
                                            {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            },
                                        )}
                                    </span>
                                )}
                                {!t.done && (
                                    <span className="block text-xs text-warning">
                                        Menunggu
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ol>

                {config.categories.map((cat) => (
                    <section key={cat.key} className="flex flex-col gap-2">
                        <SectionLabel>{cat.label}</SectionLabel>
                        <ul className="overflow-hidden rounded-lg bg-card">
                            {cat.items.map((item) => {
                                const score = String(record[item.key] ?? '');
                                const foto = record.foto_items?.[item.key];

                                return (
                                    <li
                                        key={item.key}
                                        className="flex flex-col gap-2 border-b border-border/60 px-4 py-3 last:border-0"
                                    >
                                        <p className="text-sm leading-relaxed">
                                            {item.label}
                                        </p>
                                        <div className="flex items-center justify-between gap-3">
                                            {score && SCORE[score] ? (
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2.5 py-1 text-xs font-bold',
                                                        SCORE[score].cls,
                                                    )}
                                                >
                                                    {score} ·{' '}
                                                    {SCORE[score].label}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    Tidak dinilai
                                                </span>
                                            )}
                                            {foto && (
                                                <a
                                                    href={`/storage/${foto}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex min-h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-bold hover:bg-border"
                                                >
                                                    <ImageIcon className="size-3.5" />{' '}
                                                    Foto
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}

                {record.tindakan_perbaikan &&
                    record.tindakan_perbaikan.length > 0 && (
                        <>
                            <SectionLabel>
                                Rekomendasi tindakan perbaikan
                            </SectionLabel>
                            <ul className="flex flex-col gap-2">
                                {record.tindakan_perbaikan.map((row, i) => (
                                    <li
                                        key={i}
                                        className="flex flex-col gap-1 rounded-lg bg-card px-4 py-3 text-sm"
                                    >
                                        <p className="font-semibold">
                                            {i + 1}. {row.tindakan}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            PIC{' '}
                                            <span className="text-foreground">
                                                {row.pic || '—'}
                                            </span>{' '}
                                            · Due{' '}
                                            <span className="text-foreground">
                                                {row.due_date || '—'}
                                            </span>
                                        </p>
                                        {row.remark && (
                                            <p className="text-xs text-muted-foreground">
                                                {row.remark}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                <SectionLabel>Tanda tangan</SectionLabel>
                <div className="grid grid-cols-1 gap-3 rounded-lg bg-card p-4 sm:grid-cols-2">
                    {[
                        {
                            who: `Inspektor · ${record.user.name}`,
                            src: record.ttd_inspektor,
                            empty: 'Belum ada tanda tangan',
                        },
                        ...(record.re_inspektor
                            ? [
                                  {
                                      who: `Re-inspektor · ${record.re_inspektor.name}`,
                                      src: record.ttd_re_inspektor,
                                      empty: 'Belum ditandatangani',
                                  },
                              ]
                            : []),
                    ].map((s) => (
                        <div key={s.who} className="flex flex-col gap-2">
                            <p className="text-xs font-semibold text-muted-foreground">
                                {s.who}
                            </p>
                            {s.src ? (
                                <img
                                    src={s.src}
                                    alt={`Tanda tangan ${s.who}`}
                                    className="w-full max-w-xs rounded-md bg-white"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {s.empty}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {waiting && record.re_inspektor && (
                    <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] -mx-4 flex flex-col gap-2 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-2 lg:bottom-0 lg:mx-0 lg:px-0">
                        {isRi ? (
                            <ApprovalBar
                                rejectUrl={`${base}/${record.id}/tolak`}
                                approveHref={`${base}/${record.id}/re-inspeksi`}
                                approveLabel="Re-inspeksi"
                                subject={config.title}
                            />
                        ) : (
                            <p className="rounded-full bg-warning-soft px-4 py-3 text-center text-sm font-semibold text-warning">
                                Menunggu re-inspeksi dari{' '}
                                {record.re_inspektor.name}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

/** Re-inspector confirms with a signature, or rejects with a reason. */
export function InspeksiReInspeksi({
    config,
    record,
}: {
    config: InspeksiConfig;
    record: InspeksiRecord;
}) {
    const base = `/sap/inspeksi-${config.kind}`;
    const form = useForm({ ttd_re_inspektor: '' });
    const [rejectOpen, setRejectOpen] = useState(false);

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (form.data.ttd_re_inspektor) {
            form.post(`${base}/${record.id}/re-inspeksi`);
        }
    };

    return (
        <>
            <Head title={`Re-inspeksi ${config.title}`} />
            <form
                onSubmit={submit}
                className="flex flex-col gap-4 pt-2 lg:mx-auto lg:max-w-[640px]"
            >
                <ModuleHeader
                    backHref={`${base}/${record.id}`}
                    eyebrow={`${config.title} · ${fmtDate(record.tanggal)}`}
                    title="Re-inspeksi"
                />

                <ScoreCard record={record} />
                <InfoList config={config} record={record} />

                <Link
                    href={`${base}/${record.id}`}
                    className="text-[13px] font-semibold underline-offset-4 hover:underline"
                >
                    Lihat checklist lengkap →
                </Link>

                <p className="rounded-md bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    Dengan memberikan tanda tangan, Anda menyatakan telah
                    melakukan re-inspeksi dan menyetujui hasil inspeksi ini.
                </p>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold">
                        Tanda tangan re-inspektor{' '}
                        <span className="text-destructive">*</span>
                    </span>
                    <SignaturePad
                        onDataUrl={(d) =>
                            form.setData('ttd_re_inspektor', d ?? '')
                        }
                    />
                    <InputError message={form.errors.ttd_re_inspektor} />
                </div>

                <div className="sticky bottom-0 -mx-4 flex gap-3 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:mx-0 lg:px-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setRejectOpen(true)}
                    >
                        Tolak
                    </Button>
                    <Button
                        type="submit"
                        size="lg"
                        className="flex-[2]"
                        disabled={!form.data.ttd_re_inspektor}
                        loading={form.processing}
                    >
                        Konfirmasi
                    </Button>
                </div>
            </form>
            <RejectDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                url={`${base}/${record.id}/tolak`}
                subject={config.title}
            />
        </>
    );
}
