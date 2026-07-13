import { Badge } from '@/components/ui/badge';

type Kelayakan = 'layak' | 'catatan' | 'dilarang';
type StatusTindakan = 'pending' | 'continue' | 'progress' | 'close';

const kelayakanConfig: Record<Kelayakan, { label: string; className: string }> = {
    layak:    { label: 'Layak Bekerja',          className: 'bg-green-100 text-green-800 border-green-200' },
    catatan:  { label: 'Bekerja dengan Catatan',  className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    dilarang: { label: 'Dilarang Bekerja',        className: 'bg-red-100 text-red-800 border-red-200' },
};

const tindakanConfig: Record<StatusTindakan, { label: string; className: string }> = {
    pending:  { label: 'Pending',  className: 'bg-orange-100 text-orange-800 border-orange-200' },
    continue: { label: 'Continue', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    progress: { label: 'Progress', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    close:    { label: 'Close',    className: 'bg-green-100 text-green-800 border-green-200' },
};

export function KelayakanBadge({ status }: { status: Kelayakan }) {
    const { label, className } = kelayakanConfig[status] ?? kelayakanConfig.layak;

    return <Badge variant="outline" className={className}>{label}</Badge>;
}

export function TindakanBadge({ status }: { status: StatusTindakan }) {
    const { label, className } = tindakanConfig[status] ?? tindakanConfig.pending;

    return <Badge variant="outline" className={className}>{label}</Badge>;
}
