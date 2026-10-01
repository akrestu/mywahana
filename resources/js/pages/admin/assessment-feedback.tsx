import { Head, router } from '@inertiajs/react';
import { Download, MessageSquare, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
type Paginated<T> = { data: T[]; total: number; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null };
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
        return 'text-green-600';
    }

    if (v >= 3) {
        return 'text-amber-600';
    }

    return 'text-red-600';
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
                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(item.avg / 5) * 100}%` }} />
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

            <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold">Lembar Penilaian Induksi Safety</h2>
                        <p className="text-sm text-muted-foreground">Rekap penilaian pemateri dan efektivitas pembelajaran dari peserta assessment.</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={exportUrl}><Download className="h-4 w-4" />Export Excel</a>
                    </Button>
                </div>

                {/* Filter */}
                <Card>
                    <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                        <form
                            className="relative"
                            onSubmit={(e) => {
                                e.preventDefault();
                                apply(form);
                            }}
                        >
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-8"
                                placeholder="Cari nama / NIK"
                                value={form.search ?? ''}
                                onChange={(e) => setForm({ ...form, search: e.target.value })}
                            />
                        </form>
                        <select
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={form.trainer ?? ''}
                            onChange={(e) => apply({ ...form, trainer: e.target.value })}
                        >
                            <option value="">Semua pemateri</option>
                            {trainers.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Input type="date" value={form.date_from ?? ''} onChange={(e) => apply({ ...form, date_from: e.target.value })} />
                        <Input type="date" value={form.date_to ?? ''} onChange={(e) => apply({ ...form, date_to: e.target.value })} />
                    </CardContent>
                </Card>

                {/* KPI */}
                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        { label: 'Total Penilaian', value: String(summary.total), color: 'text-blue-600' },
                        { label: 'Rata-rata Pemateri', value: `${summary.trainer_avg.toFixed(2)} / 5`, color: scoreColor(summary.trainer_avg) },
                        { label: 'Rata-rata Efektivitas', value: `${summary.effectiveness_avg.toFixed(2)} / 5`, color: scoreColor(summary.effectiveness_avg) },
                    ].map((kpi) => (
                        <Card key={kpi.label}>
                            <CardContent className="pt-6">
                                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                                <p className={cn('text-2xl font-bold tabular-nums', summary.total ? kpi.color : 'text-muted-foreground')}>{kpi.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Per pemateri */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Rekap per Pemateri</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        {trainer_stats.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada data penilaian.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="text-left text-xs text-muted-foreground">
                                    <tr className="border-b">
                                        <th className="py-2 pr-3">Pemateri</th>
                                        <th className="py-2 pr-3 text-right">Jumlah</th>
                                        <th className="py-2 pr-3 text-right">Rata-rata Pemateri</th>
                                        <th className="py-2 text-right">Rata-rata Efektivitas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trainer_stats.map((t) => (
                                        <tr key={t.trainer_name} className="border-b last:border-0">
                                            <td className="py-2 pr-3 font-medium">{t.trainer_name}</td>
                                            <td className="py-2 pr-3 text-right tabular-nums">{t.total}</td>
                                            <td className={cn('py-2 pr-3 text-right font-semibold tabular-nums', scoreColor(t.trainer_avg))}>{t.trainer_avg.toFixed(2)}</td>
                                            <td className={cn('py-2 text-right font-semibold tabular-nums', scoreColor(t.effectiveness_avg))}>{t.effectiveness_avg.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <AspectBars title="Rata-rata per Aspek Pemateri" items={trainer_aspects} />
                    <AspectBars title="Rata-rata Efektivitas Pembelajaran" items={effectiveness_aspects} />
                </div>

                {/* Riwayat */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Riwayat Penilaian</CardTitle>
                            <Badge variant="secondary" className="text-xs">{records.total} data</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs text-muted-foreground">
                                <tr className="border-b">
                                    <th className="py-2 pr-3">Tanggal</th>
                                    <th className="py-2 pr-3">Peserta</th>
                                    <th className="py-2 pr-3">Pemateri</th>
                                    <th className="py-2 pr-3 text-right">Pemateri</th>
                                    <th className="py-2 pr-3 text-right">Efektivitas</th>
                                    <th className="py-2 pr-3 text-right">Nilai</th>
                                    <th className="py-2">Komentar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.length === 0 && (
                                    <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Belum ada data.</td></tr>
                                )}
                                {records.data.map((r) => (
                                    <tr key={r.id} className="border-b last:border-0 align-top">
                                        <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="py-2 pr-3">
                                            <p className="font-medium">{r.user?.name ?? '-'}</p>
                                            <p className="text-xs text-muted-foreground">{r.user?.nik} · {r.user?.departemen ?? '-'}</p>
                                        </td>
                                        <td className="py-2 pr-3">{r.trainer_name}</td>
                                        <td className={cn('py-2 pr-3 text-right font-semibold tabular-nums', scoreColor(r.trainer_avg))}>{r.trainer_avg.toFixed(2)}</td>
                                        <td className={cn('py-2 pr-3 text-right font-semibold tabular-nums', scoreColor(r.effectiveness_avg))}>{r.effectiveness_avg.toFixed(2)}</td>
                                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                                            {r.session ? (
                                                <span className={r.session.passed ? 'text-green-600' : 'text-red-600'}>{r.session.percentage}%</span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-2 max-w-xs">
                                            {r.komentar ? (
                                                <span className="flex gap-1.5 text-muted-foreground">
                                                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-3">{r.komentar}</span>
                                                </span>
                                            ) : <span className="text-muted-foreground">-</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {records.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4">
                                {records.prev_page_url
                                    ? <Button variant="outline" size="sm" onClick={() => router.get(records.prev_page_url!)}>← Sebelumnya</Button>
                                    : <span />}
                                <span className="text-xs text-muted-foreground">Halaman {records.current_page} dari {records.last_page}</span>
                                {records.next_page_url
                                    ? <Button variant="outline" size="sm" onClick={() => router.get(records.next_page_url!)}>Berikutnya →</Button>
                                    : <span />}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
