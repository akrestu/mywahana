<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ClearOrphanedAvatars extends Command
{
    protected $signature = 'avatars:clear-orphaned';
    protected $description = 'Reset avatar users yang file-nya tidak ada di storage';

    public function handle(): void
    {
        $cleared = 0;

        User::whereNotNull('avatar')->each(function (User $user) use (&$cleared) {
            if (! Storage::disk('public')->exists($user->avatar)) {
                $user->update(['avatar' => null]);
                $this->line("Cleared: {$user->name} ({$user->email})");
                $cleared++;
            }
        });

        $this->info("Selesai. {$cleared} avatar direset.");
    }
}
