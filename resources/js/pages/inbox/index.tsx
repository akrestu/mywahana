import { Deferred, Head, Link } from '@inertiajs/react';
import { ChevronRight, Inbox as InboxIcon } from 'lucide-react';
import { useState } from 'react';
import { ApprovalBar } from '@/components/patterns/approval-bar';
import { EmptyState } from '@/components/patterns/empty-state';
import { SectionLabel } from '@/components/patterns/module-header';
import { ListSkeleton } from '@/components/patterns/skeletons';
import { cn } from '@/lib/utils';

export type InboxItem = {
    key: string;
    module: string;
    program: string;
    ab: string;
    tone: 'neutral' | 'info' | 'accent' | 'danger';
    title: string;
    subtitle: string;
    status: string | null;
    created_at: string | null;
    detail_url: string;
    action_url: string | null;
    action_label: string | null;
    reject_url: string | null;
};

type Props = {
    for_me: InboxItem[];
    submitted: InboxItem[];
    done?: InboxItem[];
};
type Tab = 'for_me' | 'submitted' | 'done';

const toneClass: Record<InboxItem['tone'], string> = {
    neutral: 'bg-muted text-foreground',
    info: 'bg-info-soft text-info',
    accent: 'bg-accent-soft text-foreground',
    danger: 'bg-destructive-soft text-destructive',
};

function ago(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const minutes = Math.max(
        0,
        Math.round((Date.now() - new Date(iso).getTime()) / 60000),
    );

    if (minutes < 60) {
        return `${Math.max(1, minutes)} mnt`;
    }

    if (minutes < 60 * 24) {
        return `${Math.round(minutes / 60)} j`;
    }

    return `${Math.round(minutes / (60 * 24))} h`;
}

function ItemMark({ item }: { item: InboxItem }) {
    return (
        <span
            className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-[14px] text-xs font-extrabold',
                toneClass[item.tone],
            )}
            aria-hidden
        >
            {item.ab}
        </span>
    );
}

function Eyebrow({ item }: { item: InboxItem }) {
    return (
        <span className="block text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            {item.module} · {item.program}
        </span>
    );
}

function ActionCard({ item }: { item: InboxItem }) {
    return (
        <article className="flex flex-col gap-3 rounded-lg bg-card p-4">
            <div className="flex items-start gap-3">
                <ItemMark item={item} />
                <div className="min-w-0 flex-1">
                    <Eyebrow item={item} />
                    <h3 className="mt-0.5 text-[15px] font-bold">
                        {item.title}
                    </h3>
                    {item.subtitle && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.subtitle}
                        </p>
                    )}
                </div>
                <span className="tabular text-[11px] text-muted-foreground">
                    {ago(item.created_at)}
                </span>
            </div>
            <ApprovalBar
                rejectUrl={item.reject_url}
                detailHref={item.detail_url}
                approveHref={item.action_url}
                approveLabel={item.action_label ?? 'Setujui'}
                subject={item.program}
            />
        </article>
    );
}

function ItemList({ items }: { items: InboxItem[] }) {
    return (
        <ul className="overflow-hidden rounded-lg bg-card">
            {items.map((item) => (
                <li
                    key={item.key}
                    className="border-b border-border/60 last:border-0"
                >
                    <Link
                        href={item.detail_url}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
                    >
                        <ItemMark item={item} />
                        <span className="min-w-0 flex-1">
                            <Eyebrow item={item} />
                            <span className="block truncate text-sm font-bold">
                                {item.title}
                            </span>
                            {item.subtitle && (
                                <span className="block truncate text-xs text-muted-foreground">
                                    {item.subtitle}
                                </span>
                            )}
                        </span>
                        <span className="tabular flex items-center gap-1 text-[11px] text-muted-foreground">
                            {ago(item.created_at)}
                            <ChevronRight className="size-4" />
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function ForMe({ items }: { items: InboxItem[] }) {
    const actionable = items.filter((i) => i.action_url);
    const followUp = items.filter((i) => !i.action_url);

    if (items.length === 0) {
        return (
            <EmptyState
                icon={InboxIcon}
                title="Semua beres"
                description="Tidak ada yang menunggu tindakan Anda saat ini."
            />
        );
    }

    return (
        <>
            {actionable.length > 0 && (
                <>
                    <SectionLabel>Perlu persetujuan</SectionLabel>
                    {actionable.map((item) => (
                        <ActionCard key={item.key} item={item} />
                    ))}
                </>
            )}
            {followUp.length > 0 && (
                <>
                    <SectionLabel>Perlu tindak lanjut</SectionLabel>
                    <ItemList items={followUp} />
                </>
            )}
        </>
    );
}

export default function InboxIndex({ for_me, submitted, done }: Props) {
    const [tab, setTab] = useState<Tab>('for_me');

    const tabs: { key: Tab; label: string; count?: number }[] = [
        { key: 'for_me', label: 'Untuk saya', count: for_me.length },
        { key: 'submitted', label: 'Diajukan', count: submitted.length },
        { key: 'done', label: 'Selesai' },
    ];

    return (
        <>
            <Head title="Inbox" />
            <div className="flex flex-col gap-3.5 pt-2">
                <h1 className="text-[28px] font-extrabold tracking-tight">
                    Inbox
                </h1>

                <div
                    role="tablist"
                    aria-label="Kategori inbox"
                    className="flex rounded-full bg-muted p-1"
                >
                    {tabs.map((t) => {
                        const selected = tab === t.key;

                        return (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                id={`tab-${t.key}`}
                                aria-selected={selected}
                                aria-controls={`panel-${t.key}`}
                                onClick={() => setTab(t.key)}
                                className={cn(
                                    'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-ring',
                                    selected
                                        ? 'bg-card font-bold shadow-[0_1px_2px_oklch(0.191_0_0/0.08)] dark:bg-primary dark:text-primary-foreground'
                                        : 'font-semibold text-muted-foreground',
                                )}
                            >
                                {t.label}
                                {t.key === 'for_me' && (t.count ?? 0) > 0 && (
                                    <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-accent-foreground">
                                        {t.count}
                                    </span>
                                )}
                                {t.key === 'submitted' &&
                                    (t.count ?? 0) > 0 && (
                                        <span className="tabular">
                                            · {t.count}
                                        </span>
                                    )}
                            </button>
                        );
                    })}
                </div>

                <div
                    role="tabpanel"
                    id={`panel-${tab}`}
                    aria-labelledby={`tab-${tab}`}
                    className="flex flex-col gap-3.5"
                >
                    {tab === 'for_me' && <ForMe items={for_me} />}

                    {tab === 'submitted' &&
                        (submitted.length > 0 ? (
                            <ItemList items={submitted} />
                        ) : (
                            <EmptyState
                                icon={InboxIcon}
                                title="Tidak ada pengajuan aktif"
                                description="Form yang menunggu persetujuan orang lain akan muncul di sini."
                            />
                        ))}

                    {tab === 'done' && (
                        <Deferred
                            data="done"
                            fallback={
                                <ListSkeleton rows={4} />
                            }
                        >
                            {done && done.length > 0 ? (
                                <ItemList items={done} />
                            ) : (
                                <EmptyState
                                    icon={InboxIcon}
                                    title="Belum ada riwayat"
                                    description="Pengajuan yang sudah disetujui atau ditolak akan muncul di sini."
                                />
                            )}
                        </Deferred>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Semua persetujuan lintas modul berkumpul di sini.
                </p>
            </div>
        </>
    );
}
