import { Link } from '@inertiajs/react';
import { MoreHorizontal, Search } from 'lucide-react';
import type { ComponentProps, FormEvent, ReactNode } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/*
 * Admin table building blocks, mirroring Redesign/.../screens/ATabel.html:
 * header actions, search + filter chips, ink selection bar, bordered table
 * card with a tinted header row, and a "1–8 dari 240" pager.
 */

/** 40px, radius-12 outline action used in admin headers and toolbars. */
export const adminButton =
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-border bg-card px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

/** Filled ink variant of {@link adminButton} for the primary action. */
export const adminButtonPrimary =
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-[13px] font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

/** Filter chip look: ink when a filter is set, dashed outline otherwise. */
export function chipClass(active: boolean) {
    return cn(
        'inline-flex h-10 w-auto shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap shadow-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        active
            ? 'border-0 bg-primary text-primary-foreground hover:bg-primary/90 [&_svg]:text-primary-foreground/70'
            : 'border border-dashed border-muted-foreground/40 bg-transparent text-foreground hover:bg-card',
    );
}

export function FilterChip({
    active,
    className,
    ...props
}: ComponentProps<'button'> & { active: boolean }) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={cn(chipClass(active), className)}
            {...props}
        />
    );
}

/** Row holding the search field and filter chips. */
export function FilterBar({ children }: { children: ReactNode }) {
    return (
        <div
            role="group"
            aria-label="Filter"
            className="flex flex-wrap items-center gap-2"
        >
            {children}
        </div>
    );
}

export function SearchField({
    value,
    onChange,
    onSubmit,
    placeholder,
    label,
}: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    placeholder: string;
    label: string;
}) {
    return (
        <form
            onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onSubmit();
            }}
            className="relative min-w-[220px] flex-[1_1_260px] sm:max-w-[340px]"
        >
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={label}
                className="h-10 w-full rounded-[12px] border border-border bg-card pr-3 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-foreground"
            />
        </form>
    );
}

/** Ink toolbar shown above the table while rows are selected. */
export function SelectionBar({
    count,
    onClear,
    children,
}: {
    count: number;
    onClear: () => void;
    children?: ReactNode;
}) {
    if (count === 0) {
        return null;
    }

    return (
        <div
            role="toolbar"
            aria-label="Aksi massal"
            className="flex flex-wrap items-center gap-2.5 rounded-[16px] bg-primary py-2.5 pr-3 pl-4 text-primary-foreground"
        >
            <span className="tabular text-sm font-bold">{count} dipilih</span>
            <span className="ml-auto flex flex-wrap gap-2">
                {children}
                <button
                    type="button"
                    onClick={onClear}
                    className="h-9 rounded-[10px] bg-accent px-3.5 text-[13px] font-bold text-accent-foreground"
                >
                    Batal pilih
                </button>
            </span>
        </div>
    );
}

/** Secondary action inside {@link SelectionBar}. */
export function SelectionAction({
    className,
    ...props
}: ComponentProps<'button'>) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-primary-foreground/12 px-3.5 text-[13px] font-semibold transition-colors hover:bg-primary-foreground/20 disabled:opacity-50 [&_svg]:size-4',
                className,
            )}
            {...props}
        />
    );
}

/** Bordered white card that holds a table and its pager. */
export function TableCard({
    children,
    footer,
    className,
}: {
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-lg border border-border bg-card',
                className,
            )}
        >
            <div className="overflow-x-auto">{children}</div>
            {footer}
        </div>
    );
}

/** Table element with the mockup's 13px body rows. */
export function DataTable({ className, ...props }: ComponentProps<'table'>) {
    return (
        <table
            className={cn(
                'w-full border-collapse text-[13px] [&_tbody_tr]:border-t [&_tbody_tr]:border-border/60 [&_td]:px-3 [&_td]:py-3 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-3 [&_th]:py-3 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4',
                className,
            )}
            {...props}
        />
    );
}

/** Tinted header row: 11px bold uppercase on the page background colour. */
export const theadRowClass =
    'bg-background text-left text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase';

/** Row background: accent-soft when selected, subtle hover otherwise. */
export function rowClass(selected = false) {
    return cn(
        'transition-colors',
        selected ? 'bg-accent-soft' : 'hover:bg-muted/40',
    );
}

/** Empty table message spanning the card. */
export function TableEmpty({ children }: { children: ReactNode }) {
    return (
        <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            {children}
        </p>
    );
}

/** "1–8 dari 240 · Sebelumnya · Berikutnya" footer for Laravel paginators. */
export function TablePager({
    from,
    to,
    total,
    prev,
    next,
}: {
    from?: number | null;
    to?: number | null;
    total?: number | null;
    prev: string | null;
    next: string | null;
}) {
    const pagerButton =
        'inline-flex h-9 items-center rounded-[10px] border border-border bg-card px-3 text-[13px] transition-colors hover:bg-muted';
    const disabled = cn(pagerButton, 'pointer-events-none opacity-50');

    return (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-[13px] text-muted-foreground">
            <span className="tabular">
                {total != null && from != null && to != null
                    ? `${from}–${to} dari ${total.toLocaleString('id-ID')}`
                    : total != null
                      ? `${total.toLocaleString('id-ID')} data`
                      : ''}
            </span>
            <span className="flex gap-1.5">
                {prev ? (
                    <Link href={prev} preserveScroll className={pagerButton}>
                        Sebelumnya
                    </Link>
                ) : (
                    <span aria-disabled className={disabled}>
                        Sebelumnya
                    </span>
                )}
                {next ? (
                    <Link
                        href={next}
                        preserveScroll
                        className={cn(
                            pagerButton,
                            'font-semibold text-foreground',
                        )}
                    >
                        Berikutnya
                    </Link>
                ) : (
                    <span aria-disabled className={disabled}>
                        Berikutnya
                    </span>
                )}
            </span>
        </div>
    );
}

/** "⋯" overflow menu for rarely used header actions (e.g. delete by range). */
export function MoreMenu({
    children,
    label = 'Aksi lainnya',
}: {
    children: ReactNode;
    label?: string;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={label}
                className={cn(adminButton, 'w-10 px-0')}
            >
                <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
                {children}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
