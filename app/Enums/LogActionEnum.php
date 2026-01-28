<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：日志操作类型
 */
enum LogActionEnum: string
{
    case login          = '登录';
    case logout         = '退出登录';
    case fail_login     = '登录失败';
    case insert         = '新增数据';
    case update         = '更新数据';
    case delete         = '删除数据';
    case reset_password = '重置密码';
    case batchDelete    = '批量删除数据';
    case export_excel   = '导出Excel';
    case export_pdf     = '导出PDF';
    case export_csv     = '导出CSV';
    case export_txt     = '导出TXT';
    case export_zip     = '导出ZIP';
    case upload_file    = '上传文件';
    case push_message   = '推送消息';
    case send_sms       = '发送短信';
    case send_email     = '发送邮件';
}
