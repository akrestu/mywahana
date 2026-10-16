<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Inspeksi\InspeksiFormController;
use App\Models\InspeksiMess;
use App\Notifications\InspeksiMessDibuat;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notification;

class InspeksiMessController extends InspeksiFormController
{
    protected function model(): string
    {
        return InspeksiMess::class;
    }

    protected function slug(): string
    {
        return 'mess';
    }

    protected function notification(Model $record, string $role): Notification
    {
        return new InspeksiMessDibuat($record, $role);
    }

    protected function extraRules(): array
    {
        return [
            'lokasi' => ['required', 'string', 'max:255'],
        ];
    }

    protected function userFields(): array
    {
        return ['name', 'nik', 'jabatan', 'site'];
    }
}
