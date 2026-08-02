import { Head } from '@inertiajs/react';
import AssessmentMonitor from '@/components/admin/AssessmentMonitor';
import type {AssessmentConfig, Props} from '@/components/admin/AssessmentMonitor';

const config: AssessmentConfig = {
    heading: 'Assessment Safety',
    subtitle: 'Monitoring & analitik hasil assessment seluruh karyawan',
    kpiTotalColor: 'text-blue-600',
    kpiAvgColor: 'text-indigo-600',
    lineColor: '#22c55e',
    route: '/admin/assessment',
    showDeptChart: true,
    showDeptFilter: true,
    showTagsInWeakQuestions: true,
    uncoveredLabel: 'Karyawan Belum Assessment',
    uncoveredSecondColLabel: 'Departemen',
    uncoveredSecondColKey: 'departemen',
    uncoveredAllDoneMessage: 'Semua karyawan sudah mengikuti assessment ✓',
    historyLabel: 'Riwayat Assessment',
    exportUrl: '/admin/assessment/export',
    questionStatsExportUrl: '/admin/assessment/export-soal',
    inductionLabel: 'Safety',
    inductionExportUrl: '/admin/induction-attendance/export/safety',
    attendanceShowDept: true,
    belumIndukeShowDept: true,
    belumIndukeAllDoneMessage: 'Semua karyawan sudah induksi Safety ✓',
    deleteRoute: '/admin/assessment',
    batchDeleteRoute: '/admin/assessment/batch',
    deleteRangeRoute: '/admin/assessment/delete-range',
};

export default function AdminAssessment(props: Props) {
    return (
        <>
            <Head title="Monitoring Assessment Safety" />
            <AssessmentMonitor {...props} config={config} />
        </>
    );
}
