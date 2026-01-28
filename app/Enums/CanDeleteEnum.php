<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：禁止删除标识
 */
enum CanDeleteEnum: int
{
    case DISABLE = 0; // 禁止删除
    case ALLOWED = 1; // 允许删除
}
