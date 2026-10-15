import { INSPEKSI } from '@/components/inspeksi/checklists';
import { InspeksiList } from '@/components/inspeksi/inspeksi-list';
import type { InspeksiPage } from '@/components/inspeksi/inspeksi-list';

type Props = {
    myRecords: InspeksiPage;
    pendingReInspeksi: InspeksiPage;
    selesaiAsRI: InspeksiPage;
};

export default function InspeksiKantorIndex(props: Props) {
    return <InspeksiList config={INSPEKSI.kantor} {...props} />;
}
