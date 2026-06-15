<?php

namespace App\Notifications;

use App\Models\KomunikasiJsa;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class KomunikasiJsaKonfirmasi extends Notification
{
    public function __construct(
        private readonly KomunikasiJsa $form
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => "Form Komunikasi JSA dari {$this->form->user->name} pada {$this->form->tanggal->format('d/m/Y')} menunggu konfirmasi Anda.",
            'url'     => "/sap/komunikasi-jsa/{$this->form->id}/konfirmasi",
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
