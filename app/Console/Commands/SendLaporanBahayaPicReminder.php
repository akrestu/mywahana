<?php

namespace App\Console\Commands;

use App\Models\LaporanBahaya;
use App\Notifications\LaporanBahayaPicDitugaskan;
use Illuminate\Console\Command;

class SendLaporanBahayaPicReminder extends Command
{
    protected $signature = 'app:send-laporan-bahaya-pic-reminder';

    protected $description = 'Kirim reminder ke PIC yang laporannya masih pending/continue lebih dari 3 hari';

    public function handle(): void
    {
        $cutoff = now()->subDays(3)->toDateString();

        $laporan = LaporanBahaya::whereNotNull('pic_user_id')
            ->whereIn('status_tindakan', ['pending', 'continue'])
            ->whereDate('updated_at', '<=', $cutoff)
            ->with('pic', 'user')
            ->get();

        $count = 0;
        foreach ($laporan as $record) {
            if (! $record->pic) continue;
            $record->pic->notify(new LaporanBahayaPicDitugaskan($record));
            $count++;
        }

        $this->info("Reminder dikirim ke {$count} PIC.");
    }
}
