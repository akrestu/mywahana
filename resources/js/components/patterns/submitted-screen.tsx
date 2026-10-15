import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { ResultScreen } from '@/components/patterns/result-screen';
import { Button } from '@/components/ui/button';

type Row = { label: string; value: string | number };

/**
 * Screen shown right after a form is submitted: outcome, a short summary
 * card, then "Kembali ke Beranda" and a link to the saved record.
 */
export function SubmittedScreen({
    title,
    description,
    icon = CheckCircle2,
    tone = 'accent',
    rows,
    detailHref,
    detailLabel = 'Lihat laporan',
}: {
    title: string;
    description: string;
    icon?: LucideIcon;
    tone?: ComponentProps<typeof ResultScreen>['tone'];
    rows: Row[];
    detailHref: string;
    detailLabel?: string;
}) {
    return (
        <>
            <Head title={title} />
            <ResultScreen
                icon={icon}
                tone={tone}
                title={title}
                description={description}
                actions={
                    <>
                        <Button asChild size="lg">
                            <Link href="/home">Kembali ke Beranda</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href={detailHref}>{detailLabel}</Link>
                        </Button>
                    </>
                }
            >
                <dl className="overflow-hidden rounded-lg bg-card">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex justify-between gap-3 border-b border-border/60 px-4 py-3.5 text-sm last:border-0"
                        >
                            <dt className="shrink-0 text-muted-foreground">
                                {row.label}
                            </dt>
                            <dd className="tabular text-right font-bold">
                                {row.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </ResultScreen>
        </>
    );
}

/** First name of the signed-in user, for the thank-you line. */
export function firstNameOf(name?: string | null): string {
    return name?.split(' ')[0] ?? '';
}
