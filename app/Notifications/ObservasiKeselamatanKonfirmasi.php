<?php

namespace App\Notifications;

use App\Models\ObservasiKeselamatan;
use Illuminate\Notifications\Notification;

class ObservasiKeselamatanKonfirmasi extends Notification
{
    public function __construct(
        private readonly ObservasiKeselamatan $ok
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => "Form Observasi Keselamatan dari {$this->ok->user->name} pada {$this->ok->tanggal->format('d/m/Y')} menunggu konfirmasi Anda.",
            'url'     => "/sap/observasi-keselamatan/{$this->ok->id}/konfirmasi",
        ];
    }
}
