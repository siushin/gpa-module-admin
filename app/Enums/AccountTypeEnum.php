<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：账号类型
 */
enum AccountTypeEnum: string
{
    case Admin = 'admin';   // 管理员
    case User  = 'user';    // 用户
}

