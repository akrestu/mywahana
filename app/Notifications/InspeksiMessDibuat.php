<?php

namespace App\Notifications;

use App\Models\InspeksiMess;
use Illuminate\Notifications\Notification;

class InspeksiMessDibuat extends Notification
{
    public function __construct(
        private readonly InspeksiMess $record,
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
                'message' => "Form Inspeksi Mess dari {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')} menunggu re-inspeksi Anda.",
                'url'     => "/sap/inspeksi-mess/{$this->record->id}/re-inspeksi",
            ];
        }

        return [
            'message' => "Anda ditambahkan sebagai peserta Inspeksi Mess oleh {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')}.",
            'url'     => "/sap/inspeksi-mess/{$this->record->id}",
        ];
    }
}
