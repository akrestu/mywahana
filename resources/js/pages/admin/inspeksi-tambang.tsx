import { InspeksiMonitor } from '@/components/admin/InspeksiMonitor';
import type { Props } from '@/components/admin/InspeksiMonitor';

export default function AdminInspeksiTambang(props: Props) {
    return <InspeksiMonitor {...props} slug="tambang" label="Tambang" heading="Inspeksi Tambang" />;
}
