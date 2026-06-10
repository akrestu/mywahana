<?php

namespace App\Console\Commands;

use App\Models\BugarSelamat;
use App\Models\User;
use App\Notifications\BugarSelamatReminder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:send-bugar-selamat-reminder')]
#[Description('Kirim reminder ke user yang belum mengisi Bugar Selamat hari ini')]
class SendBugarSelamatReminder extends Command
{
    public function handle(): void
    {
        $today = now()->toDateString();

        $sudahIsiIds = BugarSelamat::whereDate('tanggal', $today)
            ->pluck('user_id');

        $users = User::whereNotIn('id', $sudahIsiIds)->get();

        foreach ($users as $user) {
            // Hapus reminder lama yang belum dibaca untuk hari ini agar tidak menumpuk
            DB::table('notifications')
                ->where('notifiable_id', $user->id)
                ->where('notifiable_type', User::class)
                ->whereNull('read_at')
                ->whereJsonContains('data->url', '/bugar-selamat/create')
                ->whereDate('created_at', $today)
                ->delete();

            $user->notify(new BugarSelamatReminder());
        }

        $this->info("Reminder dikirim ke {$users->count()} user.");
    }
}
