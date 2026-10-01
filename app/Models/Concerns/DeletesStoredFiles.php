<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\Storage;

/**
 * Menghapus file upload di disk "public" ketika record dihapus,
 * agar foto/lampiran form tidak tertinggal menjadi file yatim.
 */
trait DeletesStoredFiles
{
    /** @var array<int, string> */
    protected array $pendingFileDeletes = [];

    /**
     * Path relatif (disk "public") milik record ini.
     *
     * @return array<int, string|null>
     */
    abstract public function storedFilePaths(): array;

    protected static function bootDeletesStoredFiles(): void
    {
        // Path dikumpulkan sebelum delete (relasi masih ada), file dihapus
        // setelah delete berhasil agar tidak hilang bila query gagal.
        static::deleting(function (self $model) {
            $model->pendingFileDeletes = array_values(array_filter($model->storedFilePaths()));
        });

        static::deleted(function (self $model) {
            if (! empty($model->pendingFileDeletes)) {
                Storage::disk('public')->delete($model->pendingFileDeletes);
            }
        });
    }
}
