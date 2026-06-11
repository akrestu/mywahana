<?php

namespace App\Notifications;

use App\Models\KomunikasiJsa;
use Illuminate\Notifications\Notification;

class KomunikasiJsaKonfirmasi extends Notification
{
    public function __construct(
        private readonly KomunikasiJsa $form
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => "Form Komunikasi JSA dari {$this->form->user->name} pada {$this->form->tanggal->format('d/m/Y')} menunggu konfirmasi Anda.",
            'url'     => "/sap/komunikasi-jsa/{$this->form->id}/konfirmasi",
        ];
    }
}
