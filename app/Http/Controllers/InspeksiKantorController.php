<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Inspeksi\InspeksiFormController;
use App\Models\InspeksiKantor;
use App\Notifications\InspeksiKantorDibuat;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notification;

class InspeksiKantorController extends InspeksiFormController
{
    protected function model(): string
    {
        return InspeksiKantor::class;
    }

    protected function slug(): string
    {
        return 'kantor';
    }

    protected function notification(Model $record, string $role): Notification
    {
        return new InspeksiKantorDibuat($record, $role);
    }

    protected function extraRules(): array
    {
        return [
            'departemen' => ['required', 'string', 'max:255'],
        ];
    }
}
