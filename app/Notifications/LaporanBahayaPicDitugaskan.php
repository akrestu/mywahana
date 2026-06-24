<?php

namespace App\Notifications;

use App\Models\LaporanBahaya;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class LaporanBahayaPicDitugaskan extends Notification
{
    public function __construct(private readonly LaporanBahaya $record) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => "Anda ditugaskan sebagai PIC untuk laporan bahaya di {$this->record->lokasi} oleh {$this->record->user->name}.",
            'url'     => "/laporan-bahaya/{$this->record->id}",
        ];
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        $data = $this->toDatabase($notifiable);

        return (new WebPushMessage)
            ->title('MyWahana HSE')
            ->icon('/logo.png')
            ->body($data['message'])
            ->action('Buka', 'open')
            ->data(['url' => $data['url']])
            ->options(['TTL' => 86400]);
    }
}
