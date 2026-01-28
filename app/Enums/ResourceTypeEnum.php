<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：资源类型
 */
enum ResourceTypeEnum: string
{
    case user   = '用户';
    case role   = '角色';
    case menu   = '菜单';
    case config = '配置';
    case file   = '文件';
    case log    = '日志';
    case other  = '其他';
}
