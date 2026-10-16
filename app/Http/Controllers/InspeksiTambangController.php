<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Inspeksi\InspeksiFormController;
use App\Models\InspeksiTambang;
use App\Notifications\InspeksiTambangDibuat;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notification;

class InspeksiTambangController extends InspeksiFormController
{
    protected function model(): string
    {
        return InspeksiTambang::class;
    }

    protected function slug(): string
    {
        return 'tambang';
    }

    protected function notification(Model $record, string $role): Notification
    {
        return new InspeksiTambangDibuat($record, $role);
    }

    protected function extraRules(): array
    {
        return [
            'departemen' => ['required', 'string', 'max:255'],
            'lokasi' => ['nullable', 'string', 'max:255'],
        ];
    }
}
