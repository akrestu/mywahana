import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ComboOption = { value: string; label: string; sub?: string | null };

/** Filled select with search, styled like the other inputs. */
export function ComboField({
    id,
    label,
    value,
    options,
    onChange,
    placeholder = 'Pilih…',
    searchPlaceholder = 'Cari…',
    emptyText = 'Tidak ada yang cocok.',
    error,
    disabled,
}: {
    id: string;
    label: string;
    value: string;
    options: ComboOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    error?: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={id} className="text-[13px] font-semibold">
                {label}
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        id={id}
                        type="button"
                        role="combobox"
                        aria-expanded={open}
                        aria-invalid={error ? true : undefined}
                        disabled={disabled}
                        className={cn(
                            'flex min-h-11 w-full items-center gap-2 rounded-md border-2 border-transparent bg-input px-4 py-2 text-left text-[15px] outline-none focus-visible:border-foreground disabled:opacity-50 aria-invalid:border-destructive dark:focus-visible:border-accent',
                            !selected && 'text-muted-foreground',
                        )}
                    >
                        <span className="min-w-0 flex-1">
                            <span className="block truncate">
                                {selected?.label ?? placeholder}
                            </span>
                            {selected?.sub && (
                                <span className="block truncate text-xs text-muted-foreground">
                                    {selected.sub}
                                </span>
                            )}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] rounded-lg p-0"
                    align="start"
                >
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandList>
                            <CommandEmpty>{emptyText}</CommandEmpty>
                            <CommandGroup>
                                {options.map((o) => (
                                    <CommandItem
                                        key={o.value}
                                        value={`${o.label} ${o.sub ?? ''}`}
                                        onSelect={() => {
                                            onChange(o.value);
                                            setOpen(false);
                                        }}
                                        className="min-h-11"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block">
                                                {o.label}
                                            </span>
                                            {o.sub && (
                                                <span className="block text-xs text-muted-foreground">
                                                    {o.sub}
                                                </span>
                                            )}
                                        </span>
                                        <Check
                                            className={cn(
                                                'size-4',
                                                o.value === value
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
