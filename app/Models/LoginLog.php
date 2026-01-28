<?php

namespace Modules\Admin\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Siushin\LaravelTool\Traits\ModelTool;
use Siushin\Util\Traits\ParamTool;

/**
 * 模型：登录日志
 */
class LoginLog extends Model
{
    use HasFactory, ParamTool, ModelTool;

    protected $table = 'gpa_login_log';

    protected $guarded = [];

    /**
     * 获取登录日志列表
     * @param array $params
     * @return array
     * @throws Exception
     * @author siushin<siushin@163.com>
     */
    public static function getPageData(array $params = []): array
    {
        $data = self::fastGetPageData(self::query(), $params, [
            'account_id'       => '=',
            'keyword'          => ['username', 'ip_location', 'message'],
            'status'           => '=',
            'ip_address'       => 'like',
            'date_range'       => 'login_at',
            'browser'          => '=',
            'operating_system' => '=',
            'device_type'      => '=',
        ]);

        // 关联账号信息
        $accountIds = array_values(array_unique(array_filter(array_column($data['data'], 'account_id'))));
        if (!empty($accountIds)) {
            $accounts = Account::query()
                ->whereIn('id', $accountIds)
                ->with('profile')
                ->select(['id', 'username'])
                ->get()
                ->keyBy('id')
                ->toArray();

            foreach ($data['data'] as &$item) {
                if (isset($accounts[$item['account_id']])) {
                    $account = $accounts[$item['account_id']];
                    $nickname = $account['profile']['nickname'] ?? '';
                    $username = $account['username'];
                    $item['account_username'] = $nickname ? "{$nickname}({$username})" : $username;
                } else {
                    $item['account_username'] = '';
                }
            }
        } else {
            foreach ($data['data'] as &$item) {
                $item['account_username'] = '';
            }
        }

        return $data;
    }
}
