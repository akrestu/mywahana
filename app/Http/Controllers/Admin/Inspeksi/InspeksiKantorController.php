<?php

namespace App\Http\Controllers\Admin\Inspeksi;

use App\Exports\InspeksiKantorExport;
use App\Models\InspeksiKantor;

class InspeksiKantorController extends InspeksiController
{
    protected function model(): string
    {
        return InspeksiKantor::class;
    }

    protected function slug(): string
    {
        return 'kantor';
    }

    protected function exportClass(): string
    {
        return InspeksiKantorExport::class;
    }
}
