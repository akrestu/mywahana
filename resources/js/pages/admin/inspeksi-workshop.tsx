import { InspeksiMonitor } from '@/components/admin/InspeksiMonitor';
import type { Props } from '@/components/admin/InspeksiMonitor';

export default function AdminInspeksiWorkshop(props: Props) {
    return <InspeksiMonitor {...props} slug="workshop" label="Workshop" heading="Inspeksi Workshop" />;
}
