import * as React from 'react';
import { ClockIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TimePickerInputProps {
    value: string; // HH:MM
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    error?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export function TimePickerInput({
    value,
    onChange,
    className,
    placeholder = 'Pilih waktu...',
    error = false,
}: TimePickerInputProps) {
    const [open, setOpen] = React.useState(false);

    const [selectedHour, selectedMinute] = value ? value.split(':') : ['', ''];
    const [tempHour, setTempHour] = React.useState(selectedHour || '07');
    const [tempMinute, setTempMinute] = React.useState(selectedMinute || '00');

    const hourRef = React.useRef<HTMLDivElement>(null);
    const minuteRef = React.useRef<HTMLDivElement>(null);

    const displayValue = value ? `${selectedHour}:${selectedMinute}` : null;

    const scrollToSelected = (ref: React.RefObject<HTMLDivElement | null>, value: string) => {
        if (!ref.current) return;
        const el = ref.current.querySelector(`[data-value="${value}"]`) as HTMLElement;
        if (el) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    };

    React.useEffect(() => {
        if (open) {
            const h = selectedHour || '07';
            const m = selectedMinute || '00';
            setTempHour(h);
            setTempMinute(m);
            setTimeout(() => {
                scrollToSelected(hourRef, h);
                scrollToSelected(minuteRef, m);
            }, 100);
        }
    }, [open]);

    const handleConfirm = () => {
        onChange(`${tempHour}:${tempMinute}`);
        setOpen(false);
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(true)}
                className={cn(
                    'h-14 w-full justify-start rounded-xl border-2 px-4 text-base font-normal',
                    !displayValue && 'text-muted-foreground',
                    error && 'border-destructive',
                    className,
                )}
            >
                <ClockIcon size={18} className="mr-2 shrink-0 text-muted-foreground" />
                {displayValue ?? placeholder}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-[320px] max-w-[320px]" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="text-base">Pilih Waktu</DialogTitle>
                    </DialogHeader>

                    {/* Preview */}
                    <div className="flex items-center justify-center py-2">
                        <span className="text-4xl font-bold tabular-nums">
                            {tempHour}:{tempMinute}
                        </span>
                    </div>

                    {/* Scroll columns */}
                    <div className="flex gap-4">
                        {/* Jam */}
                        <div className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Jam</span>
                            <div
                                ref={hourRef}
                                className="h-48 w-full overflow-y-auto rounded-lg border bg-muted/30 py-[72px] scroll-smooth"
                                style={{ scrollSnapType: 'y mandatory' }}
                            >
                                {HOURS.map((h) => (
                                    <button
                                        key={h}
                                        type="button"
                                        data-value={h}
                                        onClick={() => {
                                            setTempHour(h);
                                            scrollToSelected(hourRef, h);
                                        }}
                                        className={cn(
                                            'flex h-10 w-full items-center justify-center text-base font-medium transition-colors',
                                            'scroll-snap-align-center',
                                            tempHour === h
                                                ? 'bg-primary text-primary-foreground rounded-md mx-1 w-[calc(100%-8px)]'
                                                : 'text-foreground hover:bg-accent',
                                        )}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-center pt-6 text-2xl font-bold">:</div>

                        {/* Menit */}
                        <div className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Menit</span>
                            <div
                                ref={minuteRef}
                                className="h-48 w-full overflow-y-auto rounded-lg border bg-muted/30 py-[72px] scroll-smooth"
                                style={{ scrollSnapType: 'y mandatory' }}
                            >
                                {MINUTES.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        data-value={m}
                                        onClick={() => {
                                            setTempMinute(m);
                                            scrollToSelected(minuteRef, m);
                                        }}
                                        className={cn(
                                            'flex h-10 w-full items-center justify-center text-base font-medium transition-colors',
                                            tempMinute === m
                                                ? 'bg-primary text-primary-foreground rounded-md mx-1 w-[calc(100%-8px)]'
                                                : 'text-foreground hover:bg-accent',
                                        )}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                            Batal
                        </Button>
                        <Button onClick={handleConfirm} className="flex-1">
                            Setel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
