import { InspeksiMonitor } from '@/components/admin/InspeksiMonitor';
import type { Props } from '@/components/admin/InspeksiMonitor';

export default function AdminInspeksiMess(props: Props) {
    return <InspeksiMonitor {...props} slug="mess" label="Mess" heading="Inspeksi Mess" />;
}
