<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrAssessmentQuestion extends Model
{
    protected $fillable = [
        'question', 'jawaban_benar',
        'jawaban_1', 'jawaban_2', 'jawaban_3', 'jawaban_4',
        'keterangan',
    ];
}
