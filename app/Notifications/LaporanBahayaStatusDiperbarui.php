<?php

namespace App\Notifications;

use App\Models\LaporanBahayaReview;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class LaporanBahayaStatusDiperbarui extends Notification
{
    public function __construct(private readonly LaporanBahayaReview $review) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $laporan = $this->review->laporanBahaya;
        $pic = $this->review->user;
        $statusLabel = match ($this->review->status_tindakan) {
            'pending'  => 'Pending',
            'continue' => 'Continue',
            'progress' => 'Progress',
            'close'    => 'Close',
            default    => $this->review->status_tindakan,
        };

        return [
            'message' => "PIC {$pic->name} memperbarui status laporan bahaya di {$laporan->lokasi} menjadi {$statusLabel}.",
            'url'     => "/laporan-bahaya/{$laporan->id}",
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
