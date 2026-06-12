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
            $this->validSites = Site::pluck('value')->map(fn($v) => strtolower($v));
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

        // Site: validate against dynamic sites table (case-insensitive)
        $siteRaw = strtolower(trim(
            $this->resolve($row, ['site_baratamabandhawa', 'site_baratama_bandhawa', 'site']) ?? ''
        ));
        $site = $this->getValidSites()->contains($siteRaw) ? $siteRaw : null;

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

        // Departemen
        $departemenRaw = $this->resolve($row, ['departemen']);
        $departemen = $departemenRaw ? trim($departemenRaw) : null;

        // is_admin: handles both slug variants
        $adminRaw = strtolower(trim(
            $this->resolve($row, ['is_admin_01', 'is_admin_0_1', 'is_admin', 'admin']) ?? '0'
        ));
        $isAdmin = in_array($adminRaw, ['1', 'true', 'yes', 'ya'], true);

        $isPlainPassword = !str_starts_with($password, '$2y$') && !str_starts_with($password, '$2b$');

        $existing = User::where('nik', $nik)->first();

        if ($existing) {
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
            if ($site !== null && $existing->site !== $site) {
                $changes['site'] = $site;
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
                    ->update(['password' => Hash::make($password)]);
            }

            $this->imported++;
            return null;
        }

        // New user
        $hashedPassword = $isPlainPassword
            ? Hash::make($password)
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
