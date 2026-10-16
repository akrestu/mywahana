<?php

namespace App\Http\Controllers\Admin\Inspeksi;

use App\Exports\InspeksiTambangExport;
use App\Models\InspeksiTambang;

class InspeksiTambangController extends InspeksiController
{
    protected function model(): string
    {
        return InspeksiTambang::class;
    }

    protected function slug(): string
    {
        return 'tambang';
    }

    protected function exportClass(): string
    {
        return InspeksiTambangExport::class;
    }
}
