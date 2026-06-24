<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanBahayaReview extends Model
{
    protected $fillable = [
        'laporan_bahaya_id',
        'user_id',
        'comment',
        'attachment_paths',
        'status_tindakan',
        'tanda_tangan',
    ];

    protected $casts = [
        'attachment_paths' => 'array',
    ];

    public function laporanBahaya()
    {
        return $this->belongsTo(LaporanBahaya::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
