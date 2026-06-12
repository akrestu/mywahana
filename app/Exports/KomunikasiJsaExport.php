<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class KomunikasiJsaExport implements FromArray, ShouldAutoSize
{
    public function __construct(private readonly array $rows) {}

    public function array(): array
    {
        return $this->rows;
    }
}
