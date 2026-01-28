<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Siushin\LaravelTool\Enums\SocialTypeEnum;

/**
 * 模型：账号社交网络
 */
class AccountSocial extends Model
{
    protected $table = 'gpa_account_social';

    protected $fillable = [
        'id',
        'account_id',
        'social_type',
        'social_account',
        'social_name',
        'avatar',
        'is_verified',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'social_type' => SocialTypeEnum::class,
            'is_verified' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

    /**
     * 关联账号
     * @return BelongsTo
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }
}
