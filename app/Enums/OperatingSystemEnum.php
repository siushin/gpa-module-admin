<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：操作系统
 */
enum OperatingSystemEnum: string
{
    case Windows = 'Windows'; // Windows系统
    case macOS   = 'macOS';   // macOS系统
    case Linux   = 'Linux';   // Linux系统
    case iOS     = 'iOS';     // iOS系统
    case Android = 'Android'; // Android系统
    case Other   = 'Other';   // 其他系统
}
