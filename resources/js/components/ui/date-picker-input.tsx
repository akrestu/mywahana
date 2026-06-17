import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DatePickerInputProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    max?: string; // YYYY-MM-DD
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    error?: boolean;
}

export function DatePickerInput({
    value,
    onChange,
    max,
    disabled = false,
    className,
    placeholder = 'Pilih tanggal...',
    error = false,
}: DatePickerInputProps) {
    const [open, setOpen] = React.useState(false);

    const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
    const validSelectedDate = selectedDate && isValid(selectedDate) ? selectedDate : undefined;

    const maxDate = max ? parse(max, 'yyyy-MM-dd', new Date()) : undefined;
    const validMaxDate = maxDate && isValid(maxDate) ? maxDate : undefined;

    const displayValue = validSelectedDate
        ? format(validSelectedDate, 'EEEE, d MMMM yyyy', { locale: id })
        : null;

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            onChange(format(date, 'yyyy-MM-dd'));
            setOpen(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => !disabled && setOpen(true)}
                className={cn(
                    'h-14 w-full justify-start rounded-xl border-2 px-4 text-base font-normal',
                    !displayValue && 'text-muted-foreground',
                    error && 'border-destructive',
                    disabled && 'cursor-default opacity-100 bg-muted/40',
                    className,
                )}
            >
                <CalendarIcon size={18} className="mr-2 shrink-0 text-muted-foreground" />
                {displayValue ?? placeholder}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-auto max-w-[360px] p-0">
                    <DialogHeader className="px-4 pt-4 pb-0">
                        <DialogTitle className="text-base">Pilih Tanggal</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center pb-4">
                        <Calendar
                            mode="single"
                            selected={validSelectedDate}
                            onSelect={handleSelect}
                            defaultMonth={validSelectedDate ?? (validMaxDate ?? new Date())}
                            disabled={validMaxDate ? { after: validMaxDate } : undefined}
                            locale={id}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
