<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：认证方式
 */
enum VerificationMethodEnum: string
{
    case IDCard          = 'id_card';       // 身份证实名认证
    case BankCard        = 'bank_card';     // 银行卡认证
    case FaceRecognition = 'face';          // 人脸识别
    case Manual          = 'manual';        // 人工审核
}

