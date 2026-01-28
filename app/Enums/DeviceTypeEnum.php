<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：设备类型
 */
enum DeviceTypeEnum: string
{
    case Desktop = 'Desktop'; // 桌面设备
    case Mobile  = 'Mobile';  // 移动设备
    case Tablet  = 'Tablet';  // 平板设备
    case Other   = 'Other';   // 其他设备
}
