import { CalendarDays } from 'lucide-react';
import { chipClass } from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const short = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

/** Filter chip that opens a from/to date picker (ATabel chip style). */
export default function DateRangeFilter({ dateFrom, dateTo, onChange }: Props) {
    const active = !!(dateFrom || dateTo);
    const label = active
        ? `${dateFrom ? short(dateFrom) : '…'} – ${dateTo ? short(dateTo) : '…'}`
        : 'Tanggal: semua';

    return (
        <Popover>
            <PopoverTrigger className={chipClass(active)}>
                <CalendarDays className="size-4" />
                {label}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            Dari
                        </Label>
                        <Input
                            type="date"
                            value={dateFrom ?? ''}
                            onChange={(e) =>
                                onChange({
                                    date_from: e.target.value || undefined,
                                    date_to: dateTo,
                                })
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            Sampai
                        </Label>
                        <Input
                            type="date"
                            value={dateTo ?? ''}
                            onChange={(e) =>
                                onChange({
                                    date_from: dateFrom,
                                    date_to: e.target.value || undefined,
                                })
                            }
                        />
                    </div>
                </div>
                {active && (
                    <button
                        type="button"
                        onClick={() =>
                            onChange({ date_from: undefined, date_to: undefined })
                        }
                        className="mt-3 text-[13px] font-semibold underline"
                    >
                        Hapus filter tanggal
                    </button>
                )}
            </PopoverContent>
        </Popover>
    );
}
