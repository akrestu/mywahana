<?php

namespace App\Http\Controllers\Admin\Inspeksi;

use App\Exports\InspeksiMessExport;
use App\Models\InspeksiMess;

class InspeksiMessController extends InspeksiController
{
    protected function model(): string
    {
        return InspeksiMess::class;
    }

    protected function slug(): string
    {
        return 'mess';
    }

    protected function exportClass(): string
    {
        return InspeksiMessExport::class;
    }
}
