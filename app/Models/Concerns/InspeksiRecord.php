<?php

namespace App\Models\Concerns;

use App\Models\Site;
use Illuminate\Database\Eloquent\Builder;

/**
 * Perilaku bersama keempat model inspeksi (kantor, tambang, workshop, mess).
 */
trait InspeksiRecord
{
    use DeletesStoredFiles;

    /**
     * Inspeksi menyimpan label site di kolom project_site.
     */
    public function scopeAtSite(Builder $query, string $site): Builder
    {
        return $query->whereIn('project_site', Site::where('value', $site)->select('label'));
    }

    public function storedFilePaths(): array
    {
        return array_values($this->foto_items ?? []);
    }
}
