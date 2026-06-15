<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class BugarSelamatReminder extends Notification
{
    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => 'Anda belum mengisi form Bugar Selamat hari ini. Silakan isi sebelum mulai bekerja.',
            'url'     => '/bugar-selamat/create',
        ];
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title('MyWahana HSE')
            ->icon('/logo.png')
            ->body('Anda belum mengisi form Bugar Selamat hari ini. Silakan isi sebelum mulai bekerja.')
            ->action('Isi Sekarang', 'open')
            ->data(['url' => '/bugar-selamat/create'])
            ->options(['TTL' => 86400]);
    }
}
