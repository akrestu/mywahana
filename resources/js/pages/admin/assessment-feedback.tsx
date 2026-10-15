import { Head, router } from '@inertiajs/react';
import { Download, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { AdminTitle } from '@/components/admin/admin-title';
import {
    adminButton,
    chipClass,
    DataTable,
    FilterBar,
    rowClass,
    SearchField,
    TableCard,
    TableEmpty,
    TablePager,
    theadRowClass,
} from "@/components/admin/data-table";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

type AspectAvg = { label: string; avg: number };
type TrainerStat = { trainer_name: string; total: number; trainer_avg: number; effectiveness_avg: number };
type FeedbackRecord = {
    id: number;
    trainer_name: string;
    trainer_avg: number;
    effectiveness_avg: number;
    komentar: string | null;
    created_at: string;
    user: { name: string; nik: string; departemen: string | null } | null;
    session: { percentage: number; passed: boolean } | null;
};
type Paginated<T> = { data: T[]; from?: number | null; to?: number | null; total: number; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null };
type Filters = { search?: string; trainer?: string; date_from?: string; date_to?: string };

type Props = {
    records: Paginated<FeedbackRecord>;
    filters: Filters;
    summary: { total: number; trainer_avg: number; effectiveness_avg: number };
    trainer_aspects: AspectAvg[];
    effectiveness_aspects: AspectAvg[];
    trainer_stats: TrainerStat[];
    trainers: string[];
};

function scoreColor(v: number) {
    if (v >= 4) {
        return 'text-success';
    }

    if (v >= 3) {
        return 'text-warning';
    }

    return 'text-destructive';
}

function AspectBars({ title, items }: { title: string; items: AspectAvg[] }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
                {items.map((item, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex items-start justify-between gap-3 text-sm">
                            <span className="leading-snug"><span className="text-muted-foreground mr-1">{i + 1}.</span>{item.label}</span>
                            <span className={cn('font-semibold tabular-nums shrink-0', scoreColor(item.avg))}>{item.avg.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-info" style={{ width: `${(item.avg / 5) * 100}%` }} />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function AdminAssessmentFeedback({ records, filters, summary, trainer_aspects, effectiveness_aspects, trainer_stats, trainers }: Props) {
    const [form, setForm] = useState<Filters>(filters);

    const cleaned = (f: Filters) => Object.fromEntries(Object.entries(f).filter(([, v]) => v));

    const apply = (next: Filters) => {
        setForm(next);
        router.get('/admin/assessment/feedback', cleaned(next), { preserveState: true, replace: true });
    };

    const exportUrl = `/admin/assessment/feedback/export?${new URLSearchParams(cleaned(form) as Record<string, string>).toString()}`;

    return (
        <>
            <Head title="Lembar Penilaian Induksi Safety" />

            <div className="flex flex-col gap-[18px] pb-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <AdminTitle
                        eyebrow="Assessment"
                        title="Lembar Penilaian Induksi"
                        description="Rekap penilaian pemateri dan efektivitas pembelajaran dari peserta assessment."
                    />
                    <a href={exportUrl} className={adminButton}>
                        <Download /> Ekspor Excel
                    </a>
                </div>

                <FilterBar>
                    <SearchField
                        value={form.search ?? ''}
                        onChange={(v) => setForm({ ...form, search: v })}
                        onSubmit={() => apply(form)}
                        placeholder="Cari nama atau NIK…"
                        label="Cari peserta"
                    />
                    <Select
                        value={form.trainer || 'all'}
                        onValueChange={(v) =>
                            apply({ ...form, trainer: v === 'all' ? '' : v })
                        }
                    >
                        <SelectTrigger
                            className={chipClass(!!form.trainer)}
                            aria-label="Pemateri"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Pemateri: semua</SelectItem>
                            {trainers.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DateRangeFilter
                        dateFrom={form.date_from}
                        dateTo={form.date_to}
                        onChange={(v) =>
                            apply({
                                ...form,
                                date_from: v.date_from ?? '',
                                date_to: v.date_to ?? '',
                            })
                        }
                    />
                </FilterBar>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                    {[
                        {
                            label: 'Total penilaian',
                            value: String(summary.total),
                            color: 'text-foreground',
                        },
                        {
                            label: 'Rata-rata pemateri',
                            value: summary.trainer_avg.toFixed(2) + ' / 5',
                            color: scoreColor(summary.trainer_avg),
                        },
                        {
                            label: 'Rata-rata efektivitas',
                            value: summary.effectiveness_avg.toFixed(2) + ' / 5',
                            color: scoreColor(summary.effectiveness_avg),
                        },
                    ].map((kpi) => (
                        <div
                            key={kpi.label}
                            className="flex flex-col gap-2 rounded-[18px] border border-border bg-card p-4"
                        >
                            <span className="text-xs font-semibold text-muted-foreground">
                                {kpi.label}
                            </span>
                            <span
                                className={cn(
                                    'tabular text-[28px] leading-none font-extrabold tracking-tight',
                                    summary.total
                                        ? kpi.color
                                        : 'text-muted-foreground',
                                )}
                            >
                                {kpi.value}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="text-base font-bold">Rekap per pemateri</h2>
                    <TableCard>
                        {trainer_stats.length === 0 ? (
                            <TableEmpty>Belum ada data penilaian.</TableEmpty>
                        ) : (
                            <DataTable className="min-w-[560px]">
                                <thead>
                                    <tr className={theadRowClass}>
                                        <th>Pemateri</th>
                                        <th className="text-right">Jumlah</th>
                                        <th className="text-right">
                                            Rata-rata pemateri
                                        </th>
                                        <th className="text-right">
                                            Rata-rata efektivitas
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trainer_stats.map((t) => (
                                        <tr
                                            key={t.trainer_name}
                                            className={rowClass()}
                                        >
                                            <td className="font-semibold">
                                                {t.trainer_name}
                                            </td>
                                            <td className="tabular text-right">
                                                {t.total}
                                            </td>
                                            <td
                                                className={cn(
                                                    'tabular text-right font-bold',
                                                    scoreColor(t.trainer_avg),
                                                )}
                                            >
                                                {t.trainer_avg.toFixed(2)}
                                            </td>
                                            <td
                                                className={cn(
                                                    'tabular text-right font-bold',
                                                    scoreColor(
                                                        t.effectiveness_avg,
                                                    ),
                                                )}
                                            >
                                                {t.effectiveness_avg.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        )}
                    </TableCard>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <AspectBars
                        title="Rata-rata per aspek pemateri"
                        items={trainer_aspects}
                    />
                    <AspectBars
                        title="Rata-rata efektivitas pembelajaran"
                        items={effectiveness_aspects}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="text-base font-bold">Riwayat penilaian</h2>
                    <TableCard
                        footer={
                            <TablePager
                                from={records.from}
                                to={records.to}
                                total={records.total}
                                prev={records.prev_page_url}
                                next={records.next_page_url}
                            />
                        }
                    >
                        {records.data.length === 0 ? (
                            <TableEmpty>Belum ada data.</TableEmpty>
                        ) : (
                            <DataTable className="min-w-[900px]">
                                <thead>
                                    <tr className={theadRowClass}>
                                        <th>Tanggal</th>
                                        <th>Peserta</th>
                                        <th>Pemateri</th>
                                        <th className="text-right">
                                            Skor pemateri
                                        </th>
                                        <th className="text-right">
                                            Efektivitas
                                        </th>
                                        <th className="text-right">Nilai</th>
                                        <th>Komentar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.data.map((r) => (
                                        <tr
                                            key={r.id}
                                            className={cn(
                                                rowClass(),
                                                'align-top',
                                            )}
                                        >
                                            <td className="tabular whitespace-nowrap text-muted-foreground">
                                                {new Date(
                                                    r.created_at,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td>
                                                <span className="block font-semibold">
                                                    {r.user?.name ?? '—'}
                                                </span>
                                                <span className="tabular block text-xs text-muted-foreground">
                                                    {r.user?.nik} ·{' '}
                                                    {r.user?.departemen ?? '—'}
                                                </span>
                                            </td>
                                            <td>{r.trainer_name}</td>
                                            <td
                                                className={cn(
                                                    'tabular text-right font-bold',
                                                    scoreColor(r.trainer_avg),
                                                )}
                                            >
                                                {r.trainer_avg.toFixed(2)}
                                            </td>
                                            <td
                                                className={cn(
                                                    'tabular text-right font-bold',
                                                    scoreColor(
                                                        r.effectiveness_avg,
                                                    ),
                                                )}
                                            >
                                                {r.effectiveness_avg.toFixed(2)}
                                            </td>
                                            <td className="text-right whitespace-nowrap">
                                                {r.session ? (
                                                    <Badge
                                                        variant={
                                                            r.session.passed
                                                                ? 'success'
                                                                : 'danger'
                                                        }
                                                    >
                                                        {r.session.percentage}%
                                                    </Badge>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="max-w-xs">
                                                {r.komentar ? (
                                                    <span className="flex gap-1.5 text-muted-foreground">
                                                        <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
                                                        <span className="line-clamp-3">
                                                            {r.komentar}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        )}
                    </TableCard>
                </div>
            </div>
        </>
    );
}
