import { INSPEKSI } from '@/components/inspeksi/checklists';
import { InspeksiForm } from '@/components/inspeksi/inspeksi-form';
import type {
    InspeksiUser,
    SiteOption,
    StaffUser,
} from '@/components/inspeksi/inspeksi-form';

type Props = {
    user: InspeksiUser;
    staffUsers: StaffUser[];
    sites: SiteOption[];
};

export default function InspeksiMessCreate(props: Props) {
    return <InspeksiForm config={INSPEKSI.mess} {...props} />;
}
