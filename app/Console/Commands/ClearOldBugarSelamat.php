<?php

namespace App\Console\Commands;

use App\Models\BugarSelamat;
use Illuminate\Console\Command;

class ClearOldBugarSelamat extends Command
{
    protected $signature = 'app:clear-old-bugar-selamat {--days=30 : Jumlah hari data yang dipertahankan}';

    protected $description = 'Hapus data Bugar Selamat yang lebih lama dari periode retensi (default 30 hari)';

    public function handle(): void
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days)->startOfDay();

        $deleted = 0;

        BugarSelamat::where('tanggal', '<', $cutoff)
            ->orderBy('id')
            ->chunkById(500, function ($rows) use (&$deleted) {
                $deleted += $rows->count();
                BugarSelamat::whereIn('id', $rows->pluck('id'))->delete();
            });

        $this->info("Selesai. {$deleted} data Bugar Selamat sebelum {$cutoff->toDateString()} telah dihapus.");
    }
}
