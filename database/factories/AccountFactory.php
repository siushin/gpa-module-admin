<?php

namespace Modules\Admin\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Modules\Admin\Enums\AccountTypeEnum;
use Modules\Admin\Models\Account;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Account::class;

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
            'id'           => generateId(),
            'username'     => fake()->unique()->word(),
            'password'     => static::$password ??= Hash::make('123456'),
            'account_type' => fake()->randomElement(AccountTypeEnum::cases()),
        ];
    }
}
