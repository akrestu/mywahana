<?php

namespace App\Imports;

use App\Models\Site;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;

class UsersImport implements ToModel, WithHeadingRow, WithChunkReading, SkipsOnError
{
    use SkipsErrors;

    public function chunkSize(): int
    {
        return 50;
    }

    public int $imported = 0;
    public int $skipped = 0;

    private bool $headersLogged = false;
    private ?Collection $validSites = null;

    private function getValidSites(): Collection
    {
        if ($this->validSites === null) {
            $this->validSites = Site::pluck('value');
        }
        return $this->validSites;
    }

    /**
     * Resolve a value from multiple possible column key aliases.
     */
    private function resolve(array $row, array $keys, mixed $default = null): mixed
    {
        foreach ($keys as $key) {
            if (isset($row[$key]) && $row[$key] !== '' && $row[$key] !== null) {
                return $row[$key];
            }
        }
        return $default;
    }

    public function model(array $row): ?User
    {
        // Log header keys once for debugging
        if (!$this->headersLogged) {
            Log::info('[UsersImport] Row keys: ' . implode(', ', array_keys($row)));
            Log::info('[UsersImport] First row values: ' . json_encode($row));
            $this->headersLogged = true;
        }

        // Support both import-template format and export format
        $nama     = trim($this->resolve($row, ['nama', 'nama_1']) ?? '');
        $nik      = trim((string) ($this->resolve($row, ['nik', 'nik_1']) ?? ''));
        $password = trim($this->resolve($row, ['password', 'password_hash']) ?? '');

        if (empty($nama) || empty($nik) || empty($password)) {
            return null;
        }

        // Site: find any column key starting with 'site' (heading slug varies by DB values)
        $siteKey = collect(array_keys($row))->first(fn($k) => str_starts_with($k, 'site'));
        $siteRaw = strtolower(trim($siteKey ? ($row[$siteKey] ?? '') : ''));
        $siteMatch = $this->getValidSites()->first(fn($v) => strtolower($v) === $siteRaw);
        $site = $siteMatch ?? null;

        // Level: handles both slug variants from heading formatter
        $levelRaw = strtolower(trim(
            $this->resolve($row, ['level_nonstaffstaffsrstaff', 'level_nonstaff_staff_srstaff', 'level']) ?? ''
        ));
        $level = in_array($levelRaw, ['nonstaff', 'staff', 'srstaff']) ? $levelRaw : 'nonstaff';

        // Email
        $emailRaw = $this->resolve($row, ['email']);
        $email = $emailRaw ? trim($emailRaw) : null;

        // Jabatan
        $jabatanRaw = $this->resolve($row, ['jabatan']);
        $jabatan = $jabatanRaw ? trim($jabatanRaw) : null;

        // Departemen: must match enum values exactly
        $validDepartemen = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA', 'Management'];
        $departemenRaw = $this->resolve($row, ['departemen']);
        $departemenTrimmed = $departemenRaw ? trim($departemenRaw) : null;
        $departemen = in_array($departemenTrimmed, $validDepartemen, true) ? $departemenTrimmed : null;

        // is_admin: handles both slug variants
        $adminRaw = strtolower(trim(
            $this->resolve($row, ['is_admin_01', 'is_admin_0_1', 'is_admin', 'admin']) ?? '0'
        ));
        $isAdmin = in_array($adminRaw, ['1', 'true', 'yes', 'ya'], true);

        $isPlainPassword = !str_starts_with($password, '$2y$') && !str_starts_with($password, '$2b$');

        // Use lower bcrypt cost for bulk import to avoid execution timeout
        $hashOptions = ['rounds' => 6];

        $existing = User::where('nik', $nik)->first();

        if ($existing) {
            Log::info('[UsersImport] Checking update for NIK: ' . $nik, [
                'jabatan_excel'    => $jabatan,
                'jabatan_db'       => $existing->jabatan,
                'site_raw'         => $siteRaw,
                'site_match'       => $siteMatch,
                'site_db'          => $existing->site,
                'departemen_excel' => $departemen,
                'departemen_db'    => $existing->departemen,
            ]);

            $changes = [];

            if ($existing->name !== $nama) {
                $changes['name'] = $nama;
            }
            if ($email !== null && $existing->email !== $email) {
                $changes['email'] = $email;
            }
            if ($jabatan !== null && $existing->jabatan !== $jabatan) {
                $changes['jabatan'] = $jabatan;
            }
            if ($departemen !== null && $existing->departemen !== $departemen) {
                $changes['departemen'] = $departemen;
            }
            // Update site whenever a valid site was found in the row
            if ($siteMatch !== null && $existing->site !== $siteMatch) {
                $changes['site'] = $siteMatch;
            }
            if ($existing->participation_level !== $level) {
                $changes['participation_level'] = $level;
            }
            if ($existing->is_admin !== $isAdmin) {
                $changes['is_admin'] = $isAdmin;
            }

            $passwordChanged = false;
            if ($isPlainPassword && !Hash::check($password, $existing->password)) {
                $passwordChanged = true;
            }

            if (empty($changes) && !$passwordChanged) {
                $this->skipped++;
                return null;
            }

            if (!empty($changes)) {
                $existing->fill($changes)->save();
            }

            if ($passwordChanged) {
                $existing->getConnection()
                    ->table('users')
                    ->where('id', $existing->id)
                    ->update(['password' => Hash::make($password, $hashOptions)]);
            }

            $this->imported++;
            return null;
        }

        // New user
        $hashedPassword = $isPlainPassword
            ? Hash::make($password, $hashOptions)
            : $password;

        $user = new User([
            'name'                => $nama,
            'nik'                 => $nik,
            'email'               => $email,
            'jabatan'             => $jabatan,
            'departemen'          => $departemen,
            'site'                => $site,
            'participation_level' => $level,
            'is_admin'            => $isAdmin,
        ]);

        // Set raw hashed password directly to bypass the 'hashed' cast (avoid double-hashing)
        $user->setRawAttributes(array_merge($user->getAttributes(), ['password' => $hashedPassword]));
        $user->save();

        $this->imported++;
        return null;
    }
}
