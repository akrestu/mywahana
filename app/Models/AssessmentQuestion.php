<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class AssessmentQuestion extends Model
{
    protected $fillable = [
        'departemen', 'tags', 'question',
        'jawaban_benar', 'jawaban_1', 'jawaban_2', 'jawaban_3', 'jawaban_4',
        'keterangan',
    ];

    public function scopeForDepartemenAndTags(Builder $query, string $departemen, string $tags): Builder
    {
        return $query->where('departemen', $departemen)->where('tags', $tags);
    }
}
