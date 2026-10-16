<?php

namespace App\Http\Controllers\Admin;

use App\Exports\InductionAttendanceExport;
use App\Http\Controllers\Admin\Concerns\ScopesToAdminSite;
use App\Http\Controllers\Controller;
use App\Models\InductionAttendance;
use Maatwebsite\Excel\Facades\Excel;

class InductionAttendanceController extends Controller
{
    use ScopesToAdminSite;

    public function export(string $type)
    {
        abort_unless(in_array($type, ['safety', 'hr']), 404);

        $this->prepareLargeExport();

        $query = InductionAttendance::where('type', $type)
            ->with('user:id,name,nik,jabatan,departemen,site')
            ->latest('attended_at');

        return Excel::download(
            new InductionAttendanceExport($query),
            "absensi-induksi-{$type}-".now()->format('Ymd').'.xlsx'
        );
    }
}
