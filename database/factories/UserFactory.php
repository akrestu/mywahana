<?php

namespace Database\Factories;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'                       => fake()->name(),
            'nik'                        => fake()->unique()->numerify('######'),
            'email'                      => null,
            'email_verified_at'          => null,
            'jabatan'                    => fake()->randomElement(['Operator', 'Supervisor', 'Teknisi', 'Staff HSE', 'Driver']),
            'site'                       => fake()->randomElement(['baratama', 'bandhawa']),
            'is_admin'                   => false,
            'password'                   => static::$password ??= Hash::make('password'),
            'remember_token'             => Str::random(10),
            'two_factor_secret'          => null,
            'two_factor_recovery_codes'  => null,
            'two_factor_confirmed_at'    => null,
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function ($user) {
            $teamName = $user->name."'s Team";
            $team = Team::factory()->personal()->create([
                'name' => $teamName,
                'slug' => Str::slug($teamName),
            ]);

            $team->members()->attach($user, [
                'role' => TeamRole::Owner->value,
            ]);

            $user->switchTeam($team);
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
