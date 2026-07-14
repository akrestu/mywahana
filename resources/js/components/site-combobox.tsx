import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
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

type SiteComboboxOption = { value: string; label: string };

type SiteComboboxProps = {
    value: string;
    options: SiteComboboxOption[];
    onChange: (value: string) => void;
    placeholder?: string;
};

export function SiteCombobox({
    value,
    options,
    onChange,
    placeholder = 'Pilih site...',
}: SiteComboboxProps) {
    const [open, setOpen] = useState(false);
    const selected = options.find((option) => option.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'flex h-14 w-full items-center justify-between rounded-xl border-2 px-4 text-base transition-all',
                        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                        selected
                            ? 'border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-200'
                            : 'border-input bg-background text-muted-foreground',
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        <MapPin
                            size={16}
                            className={
                                selected
                                    ? 'shrink-0 text-orange-500'
                                    : 'shrink-0 text-muted-foreground'
                            }
                        />
                        {selected?.label || placeholder}
                    </span>
                    <ChevronsUpDown size={16} className="shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
            >
                <Command>
                    <CommandInput
                        placeholder="Cari site..."
                        className="h-11 text-base"
                    />
                    <CommandList>
                        <CommandEmpty>Site tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className="py-3 text-sm"
                                >
                                    {option.label}
                                    <Check
                                        size={15}
                                        className={cn(
                                            'ml-auto',
                                            value === option.value
                                                ? 'text-orange-600 opacity-100'
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
    );
}
