<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;

class UsersImport implements ToModel, WithHeadingRow, SkipsOnError
{
    use SkipsErrors;

    public int $imported = 0;

    public function model(array $row): ?User
    {
        $nama = trim($row['nama'] ?? '');
        $nik = trim($row['nik'] ?? '');
        $password = trim($row['password'] ?? '');

        if (empty($nama) || empty($nik) || empty($password)) {
            return null;
        }

        $site = in_array($row['site_baratama_bandhawa'] ?? '', ['baratama', 'bandhawa'])
            ? $row['site_baratama_bandhawa']
            : null;

        $level = in_array($row['level_nonstaff_staff_srstaff'] ?? '', ['nonstaff', 'staff', 'srstaff'])
            ? $row['level_nonstaff_staff_srstaff']
            : 'nonstaff';

        $email = !empty($row['email']) ? trim($row['email']) : null;
        $isAdmin = ($row['is_admin_0_1'] ?? '0') === '1';

        $existing = User::where('nik', $nik)->first();
        if ($existing) {
            $existing->update([
                'name' => $nama,
                'email' => $email ?? $existing->email,
                'password' => Hash::make($password),
                'jabatan' => $row['jabatan'] ?? $existing->jabatan,
                'site' => $site ?? $existing->site,
                'participation_level' => $level,
                'is_admin' => $isAdmin,
            ]);
            $this->imported++;
            return null;
        }

        $this->imported++;

        return new User([
            'name' => $nama,
            'nik' => $nik,
            'email' => $email,
            'password' => Hash::make($password),
            'jabatan' => $row['jabatan'] ?? null,
            'site' => $site,
            'participation_level' => $level,
            'is_admin' => $isAdmin,
        ]);
    }
}
