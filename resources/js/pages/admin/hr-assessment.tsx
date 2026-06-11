import { Head } from '@inertiajs/react';
import AssessmentMonitor, { type AssessmentConfig, type Props } from '@/components/admin/AssessmentMonitor';

const config: AssessmentConfig = {
    heading: 'HR Assessment',
    subtitle: 'Monitoring & analitik hasil HR assessment seluruh karyawan',
    kpiTotalColor: 'text-violet-600',
    kpiAvgColor: 'text-purple-600',
    lineColor: '#8b5cf6',
    route: '/admin/hr-assessment',
    showDeptChart: false,
    showDeptFilter: false,
    showTagsInWeakQuestions: false,
    uncoveredLabel: 'Karyawan Belum HR Assessment',
    uncoveredSecondColLabel: 'Jabatan',
    uncoveredSecondColKey: 'jabatan',
    uncoveredAllDoneMessage: 'Semua karyawan sudah mengikuti HR assessment ✓',
    historyLabel: 'Riwayat HR Assessment',
    inductionLabel: 'HR',
    inductionExportUrl: '/admin/induction-attendance/export/hr',
    attendanceShowDept: false,
    belumIndukeShowDept: false,
    belumIndukeAllDoneMessage: 'Semua karyawan sudah induksi HR ✓',
};

export default function AdminHrAssessment(props: Props) {
    return (
        <>
            <Head title="Monitoring HR Assessment" />
            <AssessmentMonitor {...props} config={config} />
        </>
    );
}
