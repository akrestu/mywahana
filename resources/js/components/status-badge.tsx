import { Badge } from '@/components/ui/badge';

type Kelayakan = 'layak' | 'catatan' | 'dilarang';
type StatusTindakan = 'pending' | 'selesai';

const kelayakanConfig: Record<Kelayakan, { label: string; className: string }> = {
    layak:    { label: 'Layak Bekerja',          className: 'bg-green-100 text-green-800 border-green-200' },
    catatan:  { label: 'Bekerja dengan Catatan',  className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    dilarang: { label: 'Dilarang Bekerja',        className: 'bg-red-100 text-red-800 border-red-200' },
};

const tindakanConfig: Record<StatusTindakan, { label: string; className: string }> = {
    pending: { label: 'Ditunda',  className: 'bg-orange-100 text-orange-800 border-orange-200' },
    selesai: { label: 'Selesai',  className: 'bg-green-100 text-green-800 border-green-200' },
};

export function KelayakanBadge({ status }: { status: Kelayakan }) {
    const { label, className } = kelayakanConfig[status] ?? kelayakanConfig.layak;
    return <Badge variant="outline" className={className}>{label}</Badge>;
}

export function TindakanBadge({ status }: { status: StatusTindakan }) {
    const { label, className } = tindakanConfig[status] ?? tindakanConfig.pending;
    return <Badge variant="outline" className={className}>{label}</Badge>;
}
