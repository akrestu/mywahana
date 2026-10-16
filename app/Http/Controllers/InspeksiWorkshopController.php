<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Inspeksi\InspeksiFormController;
use App\Models\InspeksiWorkshop;
use App\Notifications\InspeksiWorkshopDibuat;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notification;

class InspeksiWorkshopController extends InspeksiFormController
{
    protected function model(): string
    {
        return InspeksiWorkshop::class;
    }

    protected function slug(): string
    {
        return 'workshop';
    }

    protected function notification(Model $record, string $role): Notification
    {
        return new InspeksiWorkshopDibuat($record, $role);
    }

    protected function extraRules(): array
    {
        return [
            'departemen' => ['required', 'string', 'max:255'],
        ];
    }
}
