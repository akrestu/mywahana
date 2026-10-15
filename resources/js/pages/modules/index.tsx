import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SectionLabel } from '@/components/patterns/module-header';
import { cn } from '@/lib/utils';
import { modules, programsFor } from '@/modules/registry';
import type { Auth } from '@/types';

type Props = { counts: Record<string, number> };

export default function ModulesIndex({ counts }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const level = auth?.user?.participation_level as string | undefined;
    const [query, setQuery] = useState('');

    const active = modules.filter((m) => m.status === 'active');
    const soon = modules.filter((m) => m.status === 'soon');

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return null;
        }

        return modules
            .filter((m) => m.status === 'active')
            .flatMap((m) =>
                programsFor(m, level)
                    .filter((p) =>
                        `${m.label} ${p.label}`.toLowerCase().includes(q),
                    )
                    .map((p) => ({ module: m, program: p })),
            );
    }, [query, level]);

    return (
        <>
            <Head title="Modul" />
            <div className="flex flex-col gap-4 pt-2">
                <h1 className="text-[28px] font-extrabold tracking-tight">
                    Modul
                </h1>

                <label className="relative block">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground"
                        strokeWidth={1.8}
                    />
                    <span className="sr-only">Cari modul atau fitur</span>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari modul atau fitur…"
                        className="h-12 w-full rounded-full border-2 border-transparent bg-card pr-4 pl-11 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-foreground dark:focus-visible:border-accent"
                    />
                </label>

                {results ? (
                    <div
                        className="overflow-hidden rounded-lg bg-card"
                        aria-live="polite"
                    >
                        {results.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                                Tidak ada fitur yang cocok dengan “{query}”.
                            </p>
                        ) : (
                            results.map(({ module, program }) => {
                                const Icon = program.icon;

                                return (
                                    <Link
                                        key={program.key}
                                        href={program.href}
                                        className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 last:border-0 hover:bg-muted"
                                    >
                                        <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                                            <Icon
                                                className="size-5"
                                                strokeWidth={1.7}
                                            />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold">
                                                {program.label}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {module.label}
                                            </span>
                                        </span>
                                        <ChevronRight className="size-4 text-muted-foreground" />
                                    </Link>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <>
                        <SectionLabel>Aktif</SectionLabel>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {active.map((m) => {
                                const Icon = m.icon;
                                const count = counts[m.key] ?? 0;

                                return (
                                    <Link
                                        key={m.key}
                                        href={m.href!}
                                        className="relative flex min-h-[132px] flex-col justify-between gap-5 rounded-[22px] bg-card p-[18px] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.191_0_0/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    >
                                        <span
                                            className={cn(
                                                'flex size-12 items-center justify-center rounded-md',
                                                m.tint,
                                            )}
                                        >
                                            <Icon
                                                className="size-6"
                                                strokeWidth={1.6}
                                            />
                                        </span>
                                        {count > 0 && (
                                            <span
                                                className="tabular absolute top-4 right-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-extrabold text-accent-foreground"
                                                aria-label={`${count} perlu tindakan`}
                                            >
                                                {count}
                                            </span>
                                        )}
                                        <span>
                                            <span className="block text-base font-bold">
                                                {m.label}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {m.description}
                                            </span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        <SectionLabel>Segera hadir</SectionLabel>
                        <ul className="overflow-hidden rounded-[22px] bg-card">
                            {soon.map((m) => (
                                <li
                                    key={m.key}
                                    className="flex items-center gap-3.5 border-b border-border/60 px-4 py-3.5 last:border-0"
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-dashed border-border text-[13px] font-bold text-muted-foreground">
                                        {m.abbr}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold">
                                            {m.label}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {m.description}
                                        </span>
                                    </span>
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        Segera
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </>
    );
}
