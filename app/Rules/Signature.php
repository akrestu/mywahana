<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Tanda tangan dari canvas (data URL gambar base64) dengan batas ukuran,
 * agar kolom teks tidak bisa diisi payload sembarang/berukuran besar.
 */
class Signature implements ValidationRule
{
    public const MAX_LENGTH = 200_000;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match('#^data:image/(png|jpeg);base64,[A-Za-z0-9+/=]+$#', $value)) {
            $fail('Format tanda tangan tidak valid.');

            return;
        }

        if (strlen($value) > self::MAX_LENGTH) {
            $fail('Ukuran tanda tangan terlalu besar.');
        }
    }
}
