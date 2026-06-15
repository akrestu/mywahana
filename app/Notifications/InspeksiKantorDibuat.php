<?php

namespace App\Notifications;

use App\Models\InspeksiKantor;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class InspeksiKantorDibuat extends Notification
{
    public function __construct(
        private readonly InspeksiKantor $record,
        private readonly string $role // 're_inspektor' | 'peserta'
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        if ($this->role === 're_inspektor') {
            return [
                'message' => "Form Inspeksi Kantor dari {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')} menunggu re-inspeksi Anda.",
                'url'     => "/sap/inspeksi-kantor/{$this->record->id}/re-inspeksi",
            ];
        }

        return [
            'message' => "Anda ditambahkan sebagai peserta Inspeksi Kantor oleh {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')}.",
            'url'     => "/sap/inspeksi-kantor/{$this->record->id}",
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
