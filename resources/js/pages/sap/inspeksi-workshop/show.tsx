import { INSPEKSI } from '@/components/inspeksi/checklists';
import { InspeksiDetail } from '@/components/inspeksi/inspeksi-detail';
import type { InspeksiRecord } from '@/components/inspeksi/inspeksi-detail';

type Props = { record: InspeksiRecord; is_ri: boolean };

export default function InspeksiWorkshopShow({ record, is_ri }: Props) {
    return (
        <InspeksiDetail
            config={INSPEKSI.workshop}
            record={record}
            isRi={is_ri}
        />
    );
}
