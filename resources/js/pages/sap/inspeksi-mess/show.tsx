import { INSPEKSI } from '@/components/inspeksi/checklists';
import { InspeksiDetail } from '@/components/inspeksi/inspeksi-detail';
import type { InspeksiRecord } from '@/components/inspeksi/inspeksi-detail';

type Props = { record: InspeksiRecord; is_ri: boolean; terkirim?: boolean };

export default function InspeksiMessShow({ record, is_ri, terkirim }: Props) {
    return (
        <InspeksiDetail
            config={INSPEKSI.mess}
            record={record}
            isRi={is_ri}
            terkirim={terkirim}
        />
    );
}
