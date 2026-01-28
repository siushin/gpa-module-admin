<?php

namespace Modules\Admin\Models;

use Exception;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Admin\Enums\LogActionEnum;
use Siushin\LaravelTool\Cases\Json;
use Siushin\LaravelTool\Enums\RequestSourceEnum;
use Siushin\LaravelTool\Traits\ModelTool;
use Siushin\Util\Traits\ParamTool;

/**
 * 模型：常规日志
 */
class GeneralLog extends Model
{
    use HasFactory, ParamTool, ModelTool;

    protected $primaryKey = 'log_id';
    protected $table      = 'gpa_logs';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'extend_data' => Json::class,
        ];
    }

    protected $hidden = ['extend_data'];

    protected function sourceType(): Attribute
    {
        return Attribute::make(
            get: fn(string $value) => RequestSourceEnum::from($value)->value,
        );
    }

    protected function actionType(): Attribute
    {
        return Attribute::make(
            get: fn(string $value) => LogActionEnum::{$value}->value,
        );
    }

    /**
     * 获取日志列表
     * @param array $params
     * @return array
     * @throws Exception
     * @author siushin<siushin@163.com>
     */
    public static function getPageData(array $params = []): array
    {
        $data = self::fastGetPageData(self::query(), $params, [
            'account_id'  => '=',
            'source_type' => '=',
            'action_type' => '=',
            'keyword'     => 'content|ip_location',
            'ip_address'  => 'like',
            'date_range'  => 'created_at',
        ]);

        $accountIds = array_values(array_unique(array_filter(array_column($data['data'], 'account_id'))));
        if (!empty($accountIds)) {
            $accounts = Account::query()
                ->whereIn('id', $accountIds)
                ->with('profile')
                ->select(['username', 'id'])
                ->get()
                ->toArray();
            $accountList = array_column($accounts, null, 'id');

            foreach ($data['data'] as &$item) {
                if (isset($accountList[$item['account_id']])) {
                    $account = $accountList[$item['account_id']];
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
