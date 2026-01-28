<?php

namespace Modules\Admin\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

/**
 * 模型：个人访问令牌
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $table = 'sys_personal_access_tokens';
}

