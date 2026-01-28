<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：浏览器名称
 */
enum BrowserEnum: string
{
    case Chrome  = 'Chrome';   // Chrome浏览器
    case Firefox = 'Firefox';  // Firefox浏览器
    case Safari  = 'Safari';   // Safari浏览器
    case Edge    = 'Edge';     // Edge浏览器
    case Opera   = 'Opera';    // Opera浏览器
    case IE      = 'IE';       // Internet Explorer浏览器
    case Other   = 'Other';    // 其他浏览器
}
