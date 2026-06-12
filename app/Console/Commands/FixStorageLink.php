<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class FixStorageLink extends Command
{
    protected $signature = 'storage:fix-link';
    protected $description = 'Remove real storage folder and recreate as symlink';

    public function handle(): void
    {
        $link = public_path('storage');
        $target = storage_path('app/public');

        if (is_link($link)) {
            $this->info('Already a symlink pointing to: ' . readlink($link));
            return;
        }

        if (is_dir($link)) {
            File::deleteDirectory($link);
            $this->info('Deleted real directory: ' . $link);
        }

        app('files')->link($target, $link);

        $this->info('Symlink created: ' . $link . ' -> ' . $target);
        $this->info('Is symlink: ' . (is_link($link) ? 'YES' : 'NO'));
        $this->info('Avatars accessible: ' . (is_dir($link . '/avatars') ? 'YES' : 'NO'));
    }
}
