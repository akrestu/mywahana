import { INSPEKSI } from '@/components/inspeksi/checklists';
import { InspeksiReInspeksi } from '@/components/inspeksi/inspeksi-detail';
import type { InspeksiRecord } from '@/components/inspeksi/inspeksi-detail';

type Props = { record: InspeksiRecord };

export default function InspeksiTambangReInspeksi({ record }: Props) {
    return <InspeksiReInspeksi config={INSPEKSI.tambang} record={record} />;
}
