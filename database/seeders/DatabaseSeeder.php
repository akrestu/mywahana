<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Admin
        User::factory()->create([
            'name'     => 'Admin MyWahana',
            'nik'      => 'ADM-001',
            'jabatan'  => 'HSE Manager',
            'site'     => 'baratama',
            'is_admin' => true,
        ]);

        // Staff HSE Baratama
        User::factory()->create([
            'name'    => 'Budi Santoso',
            'nik'     => 'BRT-1001',
            'jabatan' => 'Operator',
            'site'    => 'baratama',
        ]);

        // Staff HSE Baratama 2
        User::factory()->create([
            'name'    => 'Agus Prasetyo',
            'nik'     => 'BRT-1002',
            'jabatan' => 'Teknisi',
            'site'    => 'baratama',
        ]);

        // Staff HSE Bandhawa
        User::factory()->create([
            'name'    => 'Siti Rahayu',
            'nik'     => 'BDW-2001',
            'jabatan' => 'Supervisor',
            'site'    => 'bandhawa',
        ]);

        // Staff HSE Bandhawa 2
        User::factory()->create([
            'name'    => 'Dewi Lestari',
            'nik'     => 'BDW-2002',
            'jabatan' => 'Staff HSE',
            'site'    => 'bandhawa',
        ]);

        $this->call([
            HrAssessmentQuestionSeeder::class,
        ]);
    }
}
