<?php

namespace App\Notifications;

use App\Models\InspeksiWorkshop;
use Illuminate\Notifications\Notification;

class InspeksiWorkshopDibuat extends Notification
{
    public function __construct(
        private readonly InspeksiWorkshop $record,
        private readonly string $role
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        if ($this->role === 're_inspektor') {
            return [
                'message' => "Form Inspeksi Workshop dari {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')} menunggu re-inspeksi Anda.",
                'url'     => "/sap/inspeksi-workshop/{$this->record->id}/re-inspeksi",
            ];
        }

        return [
            'message' => "Anda ditambahkan sebagai peserta Inspeksi Workshop oleh {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')}.",
            'url'     => "/sap/inspeksi-workshop/{$this->record->id}",
        ];
    }
}
