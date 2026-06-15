<?php

namespace App\Notifications;

use App\Models\InspeksiWorkshop;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class InspeksiWorkshopDibuat extends Notification
{
    public function __construct(
        private readonly InspeksiWorkshop $record,
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
                'message' => "Form Inspeksi Workshop dari {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')} menunggu re-inspeksi Anda.",
                'url'     => "/sap/inspeksi-workshop/{$this->record->id}/re-inspeksi",
            ];
        }

        return [
            'message' => "Anda ditambahkan sebagai peserta Inspeksi Workshop oleh {$this->record->user->name} pada {$this->record->tanggal->format('d/m/Y')}.",
            'url'     => "/sap/inspeksi-workshop/{$this->record->id}",
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
