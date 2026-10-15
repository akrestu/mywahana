import { Badge } from '@/components/ui/badge';
import { kelayakanLabels, tindakanLabels } from '@/lib/status';
import type { Kelayakan, StatusTindakan } from '@/lib/status';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'ink';

// Text-only status chips, as in DSKomponen / ATabel.
const kelayakanVariant: Record<Kelayakan, Variant> = {
    layak: 'success',
    catatan: 'warning',
    dilarang: 'danger',
};

const tindakanVariant: Record<StatusTindakan, Variant> = {
    pending: 'warning',
    continue: 'neutral',
    progress: 'info',
    close: 'ink',
};

export function KelayakanBadge({ status }: { status: Kelayakan }) {
    const key = status in kelayakanVariant ? status : 'layak';

    return (
        <Badge variant={kelayakanVariant[key]}>{kelayakanLabels[key]}</Badge>
    );
}

export function TindakanBadge({ status }: { status: StatusTindakan }) {
    const key = status in tindakanVariant ? status : 'pending';

    return <Badge variant={tindakanVariant[key]}>{tindakanLabels[key]}</Badge>;
}
