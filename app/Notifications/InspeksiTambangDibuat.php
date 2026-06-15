<?php

namespace App\Notifications;

use App\Models\InspeksiTambang;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class InspeksiTambangDibuat extends Notification
{
    public function __construct(
        private readonly InspeksiTambang $record,
        private readonly string $role
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
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
