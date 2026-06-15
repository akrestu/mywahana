<?php

namespace App\Notifications;

use App\Models\ObservasiKeselamatan;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class ObservasiKeselamatanKonfirmasi extends Notification
{
    public function __construct(
        private readonly ObservasiKeselamatan $ok
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => "Form Observasi Keselamatan dari {$this->ok->user->name} pada {$this->ok->tanggal->format('d/m/Y')} menunggu konfirmasi Anda.",
            'url'     => "/sap/observasi-keselamatan/{$this->ok->id}/konfirmasi",
        ];
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        $data = $this->toDatabase($notifiable);

        return (new WebPushMessage)
            ->title('MyWahana HSE')
            ->icon('/logo.png')
            ->body($data['message'])
            ->action('Konfirmasi', 'open')
            ->data(['url' => $data['url']])
            ->options(['TTL' => 86400]);
    }
}
