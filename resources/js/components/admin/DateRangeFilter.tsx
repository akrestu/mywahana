import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    dateFrom?: string;
    dateTo?: string;
    onChange: (values: { date_from?: string; date_to?: string }) => void;
}

export default function DateRangeFilter({ dateFrom, dateTo, onChange }: Props) {
    return (
        <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
                <Input
                    type="date"
                    className="text-sm"
                    value={dateFrom ?? ''}
                    onChange={(e) => onChange({ date_from: e.target.value || undefined, date_to: dateTo })}
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
                <Input
                    type="date"
                    className="text-sm"
                    value={dateTo ?? ''}
                    onChange={(e) => onChange({ date_from: dateFrom, date_to: e.target.value || undefined })}
                />
            </div>
        </div>
    );
}
