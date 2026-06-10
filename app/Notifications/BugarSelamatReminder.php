<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class BugarSelamatReminder extends Notification
{
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => 'Anda belum mengisi form Bugar Selamat hari ini. Silakan isi sebelum mulai bekerja.',
            'url'     => '/bugar-selamat/create',
        ];
    }
}
