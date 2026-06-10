<?php

namespace App\Notifications;

use App\Models\InspeksiTambang;
use Illuminate\Notifications\Notification;

class InspeksiTambangDibuat extends Notification
{
    public function __construct(
        private readonly InspeksiTambang $record,
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
                'message' => "Form Inspeksi Tambang dari {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')} menunggu re-inspeksi Anda.",
                'url'     => "/sap/inspeksi-tambang/{$this->record->id}/re-inspeksi",
            ];
        }

        return [
            'message' => "Anda ditambahkan sebagai peserta Inspeksi Tambang oleh {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')}.",
            'url'     => "/sap/inspeksi-tambang/{$this->record->id}",
        ];
    }
}
