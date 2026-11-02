import { format, isValid, parse } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { chipClass } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface Props {
    dateFrom?: string;
    dateTo?: string;
    onChange: (values: { date_from?: string; date_to?: string }) => void;
}

const toDate = (d?: string) => {
    if (!d) return undefined;
    const parsed = parse(d, 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? parsed : undefined;
};

const toValue = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : undefined);

const short = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

/**
 * Filter chip that opens a range calendar (ATabel chip style). The range is
 * held locally and only applied on "Terapkan", so picking never triggers a
 * reload with a half-chosen range.
 */
export default function DateRangeFilter({ dateFrom, dateTo, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DateRange | undefined>();

    const active = !!(dateFrom || dateTo);
    const label = active
        ? `${dateFrom ? short(dateFrom) : '…'} – ${dateTo ? short(dateTo) : '…'}`
        : 'Tanggal: semua';

    const handleOpenChange = (next: boolean) => {
        if (next) {
            const from = toDate(dateFrom);
            setDraft(from || dateTo ? { from, to: toDate(dateTo) } : undefined);
        }
        setOpen(next);
    };

    const apply = () => {
        onChange({
            date_from: toValue(draft?.from),
            date_to: toValue(draft?.to ?? draft?.from),
        });
        setOpen(false);
    };

    const clear = () => {
        onChange({ date_from: undefined, date_to: undefined });
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger className={chipClass(active)}>
                <CalendarDays className="size-4" />
                {label}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-2">
                <Calendar
                    mode="range"
                    selected={draft}
                    onSelect={setDraft}
                    resetOnSelect
                    defaultMonth={draft?.from ?? new Date()}
                    locale={id}
                />
                <div className="flex items-center justify-between gap-2 border-t px-1 pt-2">
                    {active ? (
                        <button
                            type="button"
                            onClick={clear}
                            className="text-[13px] font-semibold underline"
                        >
                            Hapus filter
                        </button>
                    ) : (
                        <span />
                    )}
                    <Button size="sm" onClick={apply} disabled={!draft?.from}>
                        Terapkan
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
