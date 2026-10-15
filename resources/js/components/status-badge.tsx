import { CheckCircle2, CircleDot, Clock, Loader, OctagonX, TriangleAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/badge';
import { kelayakanLabels, tindakanLabels } from '@/lib/status';
import type { Kelayakan, StatusTindakan } from '@/lib/status';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type Config = { variant: Variant; icon: ComponentType };

const kelayakanConfig: Record<Kelayakan, Config> = {
    layak: { variant: 'success', icon: CheckCircle2 },
    catatan: { variant: 'warning', icon: TriangleAlert },
    dilarang: { variant: 'danger', icon: OctagonX },
};

const tindakanConfig: Record<StatusTindakan, Config> = {
    pending: { variant: 'warning', icon: Clock },
    continue: { variant: 'info', icon: CircleDot },
    progress: { variant: 'neutral', icon: Loader },
    close: { variant: 'success', icon: CheckCircle2 },
};

export function KelayakanBadge({ status }: { status: Kelayakan }) {
    const key = status in kelayakanConfig ? status : 'layak';
    const { variant, icon: Icon } = kelayakanConfig[key];

    return (
        <Badge variant={variant}>
            <Icon />
            {kelayakanLabels[key]}
        </Badge>
    );
}

export function TindakanBadge({ status }: { status: StatusTindakan }) {
    const key = status in tindakanConfig ? status : 'pending';
    const { variant, icon: Icon } = tindakanConfig[key];

    return (
        <Badge variant={variant}>
            <Icon />
            {tindakanLabels[key]}
        </Badge>
    );
}
