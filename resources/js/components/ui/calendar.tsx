import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    const defaultClassNames = getDefaultClassNames();

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                root: cn('w-fit', defaultClassNames.root),
                months: cn('flex flex-col sm:flex-row gap-4', defaultClassNames.months),
                month: cn('flex flex-col gap-4', defaultClassNames.month),
                month_caption: cn('flex justify-center pt-1 relative items-center', defaultClassNames.month_caption),
                caption_label: cn('text-sm font-medium', defaultClassNames.caption_label),
                nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
                button_previous: cn(
                    buttonVariants({ variant: 'outline' }),
                    'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    defaultClassNames.button_previous,
                ),
                button_next: cn(
                    buttonVariants({ variant: 'outline' }),
                    'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    defaultClassNames.button_next,
                ),
                month_grid: cn('w-full border-collapse space-y-1', defaultClassNames.month_grid),
                weekdays: cn('flex', defaultClassNames.weekdays),
                weekday: cn('text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1 text-center', defaultClassNames.weekday),
                week: cn('flex w-full mt-2', defaultClassNames.week),
                day: cn(
                    'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1',
                    defaultClassNames.day,
                ),
                day_button: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'size-8 p-0 font-normal mx-auto',
                    defaultClassNames.day_button,
                ),
                selected: cn(
                    '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
                    defaultClassNames.selected,
                ),
                today: cn('[&>button]:bg-accent [&>button]:text-accent-foreground', defaultClassNames.today),
                outside: cn('text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30', defaultClassNames.outside),
                disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
                range_middle: cn('aria-selected:bg-accent aria-selected:text-accent-foreground', defaultClassNames.range_middle),
                hidden: cn('invisible', defaultClassNames.hidden),
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === 'left' ? (
                        <ChevronLeft className="size-4" />
                    ) : (
                        <ChevronRight className="size-4" />
                    ),
            }}
            {...props}
        />
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };
