import { InspeksiMonitor } from '@/components/admin/InspeksiMonitor';
import type { Props } from '@/components/admin/InspeksiMonitor';

export default function AdminInspeksiKantor(props: Props) {
    return <InspeksiMonitor {...props} slug="kantor" label="Kantor" heading="Inspeksi Area Kantor" />;
}
