<?php

namespace Modules\Admin\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Siushin\LaravelTool\Cases\Json;
use Siushin\LaravelTool\Traits\ModelTool;
use Siushin\Util\Traits\ParamTool;

/**
 * 模型：操作日志
 */
class OperationLog extends Model
{
    use HasFactory, ParamTool, ModelTool;

    protected $table = 'gpa_operation_log';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'params' => Json::class,
        ];
    }

    /**
     * 获取操作日志列表
     * @param array $params
     * @return array
     * @throws Exception
     * @author siushin<siushin@163.com>
     */
    public static function getPageData(array $params = []): array
    {
        $data = self::fastGetPageData(self::query(), $params, [
            'account_id'    => '=',
            'source_type'   => '=',
            'module'        => '=',
            'action'        => '=',
            'method'        => '=',
            'path'          => 'like',
            'ip_address'    => 'like',
            'response_code' => '=',
            'date_range'    => 'operated_at',
            'keyword'       => ['params', 'ip_location', 'user_agent'],
        ]);

        // 关联账号信息
        $accountIds = array_values(array_unique(array_column($data['data'], 'account_id')));
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
                    $item['username'] = $nickname ? "{$nickname}({$username})" : $username;
                } else {
                    $item['username'] = '';
                }
            }
        } else {
            foreach ($data['data'] as &$item) {
                $item['username'] = '';
            }
        }

        return $data;
    }
}
