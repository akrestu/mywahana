<?php

namespace App\Http\Controllers\Admin\Inspeksi;

use App\Exports\InspeksiWorkshopExport;
use App\Models\InspeksiWorkshop;

class InspeksiWorkshopController extends InspeksiController
{
    protected function model(): string
    {
        return InspeksiWorkshop::class;
    }

    protected function slug(): string
    {
        return 'workshop';
    }

    protected function exportClass(): string
    {
        return InspeksiWorkshopExport::class;
    }
}
