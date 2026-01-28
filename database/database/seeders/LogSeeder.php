<?php

namespace Modules\Base\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Base\Enums\BrowserEnum;
use Modules\Base\Enums\DeviceTypeEnum;
use Modules\Base\Enums\HttpMethodEnum;
use Modules\Base\Enums\LogActionEnum;
use Modules\Base\Enums\OperatingSystemEnum;
use Modules\Base\Enums\OperationActionEnum;
use Modules\Base\Enums\ResourceTypeEnum;
use Modules\Base\Models\Account;
use Modules\Base\Models\AuditLog;
use Modules\Base\Models\GeneralLog;
use Modules\Base\Models\LoginLog;
use Modules\Base\Models\OperationLog;
use Siushin\LaravelTool\Enums\RequestSourceEnum;

/**
 * 数据填充：日志
 * @author siushin<siushin@163.com>
 */
class LogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * @author siushin<siushin@163.com>
     */
    public function run(): void
    {
        // 获取所有账号ID（用于关联日志）
        $accountIds = Account::query()->pluck('id')->toArray();
        if (empty($accountIds)) {
            return;
        }

        $this->seedGeneralLogs($accountIds);
        $this->seedOperationLogs($accountIds);
        $this->seedAuditLogs($accountIds);
        $this->seedLoginLogs($accountIds);
    }

    /**
     * 填充常规日志数据
     * @param array $accountIds
     * @return void
     * @author siushin<siushin@163.com>
     */
    private function seedGeneralLogs(array $accountIds): void
    {
        $logs = [];
        $sourceTypes = array_map(fn($case) => $case->value, RequestSourceEnum::cases());
        $actionTypes = array_map(fn($case) => $case->name, LogActionEnum::cases());

        // 生成过去30天的日志数据
        for ($i = 0; $i < 200; $i++) {
            $accountId = fake()->randomElement($accountIds);
            $sourceType = fake()->randomElement($sourceTypes);
            $actionType = fake()->randomElement($actionTypes);
            $createdAt = fake()->dateTimeBetween('-30 days', 'now');

            // 根据操作类型生成不同的日志内容
            $content = $this->generateLogContent($actionType, $accountId);
            $extendData = $this->generateExtendData($actionType);

            $logs[] = [
                'account_id'  => $accountId,
                'source_type' => $sourceType,
                'action_type' => $actionType,
                'content'     => $content,
                'ip_address'  => fake()->ipv4(),
                'ip_location' => $this->generateIpLocation(),
                'extend_data' => json_encode($extendData, JSON_UNESCAPED_UNICODE),
                'created_at'  => $createdAt,
            ];

            // 批量插入，每100条插入一次
            if (count($logs) >= 100) {
                GeneralLog::query()->insert($logs);
                $logs = [];
            }
        }

        // 插入剩余数据
        if (!empty($logs)) {
            GeneralLog::query()->insert($logs);
        }
    }

    /**
     * 填充审计日志数据
     * @param array $accountIds
     * @return void
     * @author siushin<siushin@163.com>
     */
    private function seedAuditLogs(array $accountIds): void
    {
        $logs = [];
        $actions = array_map(fn($case) => $case->value, OperationActionEnum::cases());
        $resourceTypes = array_map(fn($case) => $case->value, ResourceTypeEnum::cases());
        $modules = ['账号管理', '角色管理', '菜单管理', '配置管理', '文件管理', '用户管理'];

        // 生成过去30天的审计日志数据
        for ($i = 0; $i < 150; $i++) {
            $accountId = fake()->randomElement($accountIds);
            $module = fake()->randomElement($modules);
            $action = fake()->randomElement($actions);
            $resourceType = fake()->randomElement($resourceTypes);
            $resourceId = fake()->numberBetween(1000, 9999);
            $auditedAt = fake()->dateTimeBetween('-30 days', 'now');

            // 生成变更前后数据
            [$beforeData, $afterData] = $this->generateChangeData($resourceType, $action);
            $description = $this->generateAuditDescription($module, $action, $resourceType, $resourceId);

            $logs[] = [
                'account_id'    => $accountId,
                'module'        => $module,
                'action'        => $action,
                'resource_type' => $resourceType,
                'resource_id'   => $resourceId,
                'before_data'   => json_encode($beforeData, JSON_UNESCAPED_UNICODE),
                'after_data'    => json_encode($afterData, JSON_UNESCAPED_UNICODE),
                'description'   => $description,
                'ip_address'    => fake()->ipv4(),
                'ip_location'   => $this->generateIpLocation(),
                'user_agent'    => fake()->userAgent(),
                'audited_at'    => $auditedAt,
            ];

            // 批量插入，每100条插入一次
            if (count($logs) >= 100) {
                AuditLog::query()->insert($logs);
                $logs = [];
            }
        }

        // 插入剩余数据
        if (!empty($logs)) {
            AuditLog::query()->insert($logs);
        }
    }

    /**
     * 填充操作日志数据
     * @param array $accountIds
     * @return void
     * @author siushin<siushin@163.com>
     */
    private function seedOperationLogs(array $accountIds): void
    {
        $logs = [];
        $sourceTypes = array_map(fn($case) => $case->value, RequestSourceEnum::cases());
        $actions = array_map(fn($case) => $case->value, OperationActionEnum::cases());
        $methods = array_map(fn($case) => $case->value, HttpMethodEnum::cases());
        $modules = ['账号管理', '角色管理', '菜单管理', '配置管理', '文件管理', '用户管理', '日志管理', '组织架构'];
        $paths = [
            '/api/admin/account/list',
            '/api/admin/account/create',
            '/api/admin/account/update',
            '/api/admin/role/list',
            '/api/admin/role/create',
            '/api/admin/menu/list',
            '/api/admin/config/list',
            '/api/admin/file/upload',
            '/api/admin/log/operation',
            '/api/admin/log/login',
        ];

        // 生成过去30天的操作日志数据
        for ($i = 0; $i < 180; $i++) {
            $accountId = fake()->randomElement($accountIds);
            $module = fake()->randomElement($modules);
            $action = fake()->randomElement($actions);
            $method = fake()->randomElement($methods);
            $path = fake()->randomElement($paths);
            $operatedAt = fake()->dateTimeBetween('-30 days', 'now');

            // 生成请求参数（随机决定是否有参数）
            $params = null;
            if (fake()->boolean(70)) {
                $params = json_encode([
                    'id'       => fake()->numberBetween(1, 1000),
                    'name'     => fake()->word(),
                    'status'   => fake()->randomElement([0, 1]),
                    'page'     => fake()->numberBetween(1, 10),
                    'pageSize' => fake()->randomElement([10, 20, 50]),
                ], JSON_UNESCAPED_UNICODE);
            }

            // 生成响应状态码（大部分是200，少量是错误码）
            $responseCode = fake()->boolean(85) ? 200 : fake()->randomElement([400, 401, 403, 404, 500]);

            // 生成执行耗时（毫秒）
            $executionTime = fake()->numberBetween(10, 5000);

            $logs[] = [
                'account_id'     => $accountId,
                'source_type'    => fake()->randomElement($sourceTypes),
                'module'         => $module,
                'action'         => $action,
                'method'         => $method,
                'path'           => $path,
                'params'         => $params,
                'ip_address'     => fake()->ipv4(),
                'ip_location'    => $this->generateIpLocation(),
                'user_agent'     => fake()->userAgent(),
                'response_code'  => $responseCode,
                'execution_time' => $executionTime,
                'operated_at'    => $operatedAt,
            ];

            // 批量插入，每100条插入一次
            if (count($logs) >= 100) {
                OperationLog::query()->insert($logs);
                $logs = [];
            }
        }

        // 插入剩余数据
        if (!empty($logs)) {
            OperationLog::query()->insert($logs);
        }
    }

    /**
     * 填充登录日志数据
     * @param array $accountIds
     * @return void
     * @author siushin<siushin@163.com>
     */
    private function seedLoginLogs(array $accountIds): void
    {
        $logs = [];
        $browsers = array_map(fn($case) => $case->value, BrowserEnum::cases());
        $operatingSystems = array_map(fn($case) => $case->value, OperatingSystemEnum::cases());
        $deviceTypes = array_map(fn($case) => $case->value, DeviceTypeEnum::cases());

        // 获取账号信息用于生成用户名
        $accounts = Account::query()
            ->whereIn('id', $accountIds)
            ->pluck('username', 'id')
            ->toArray();

        // 生成过去30天的登录日志数据
        for ($i = 0; $i < 120; $i++) {
            $accountId = fake()->randomElement($accountIds);
            $username = $accounts[$accountId] ?? fake()->userName();
            $status = fake()->boolean(80) ? 1 : 0; // 80% 成功率
            $loginAt = fake()->dateTimeBetween('-30 days', 'now');

            $browser = fake()->randomElement($browsers);
            $browserVersion = fake()->numberBetween(90, 120) . '.0.' . fake()->numberBetween(1000, 9999);
            $operatingSystem = fake()->randomElement($operatingSystems);
            $deviceType = fake()->randomElement($deviceTypes);

            // 生成登录信息
            $message = $status === 1
                ? '登录成功'
                : fake()->randomElement(['密码错误', '账号不存在', '账号已被禁用', '验证码错误']);

            $logs[] = [
                'account_id'       => $status === 1 ? $accountId : null, // 失败时可能没有账号ID
                'username'         => $username,
                'status'           => $status,
                'ip_address'       => fake()->ipv4(),
                'ip_location'      => $this->generateIpLocation(),
                'browser'          => $browser,
                'browser_version'  => $browserVersion,
                'operating_system' => $operatingSystem,
                'device_type'      => $deviceType,
                'user_agent'       => fake()->userAgent(),
                'message'          => $message,
                'login_at'         => $loginAt,
            ];

            // 批量插入，每100条插入一次
            if (count($logs) >= 100) {
                LoginLog::query()->insert($logs);
                $logs = [];
            }
        }

        // 插入剩余数据
        if (!empty($logs)) {
            LoginLog::query()->insert($logs);
        }
    }

    /**
     * 生成日志内容
     * @param string $actionType
     * @param int    $accountId
     * @return string
     * @author siushin<siushin@163.com>
     */
    private function generateLogContent(string $actionType, int $accountId): string
    {
        $contents = [
            'login'          => "用户登录成功(account_id: {$accountId})",
            'fail_login'     => "用户登录失败(account_id: {$accountId})",
            'insert'         => "新增数据成功，ID: " . fake()->numberBetween(1000, 9999),
            'update'         => "更新数据成功，ID: " . fake()->numberBetween(1000, 9999),
            'delete'         => "删除数据成功，ID: " . fake()->numberBetween(1000, 9999),
            'reset_password' => "重置密码成功(account_id: {$accountId})",
            'batchDelete'    => "批量删除数据成功，共删除 " . fake()->numberBetween(5, 50) . " 条记录",
            'export_excel'   => "导出Excel文件成功，文件名: " . fake()->word() . ".xlsx",
            'export_pdf'     => "导出PDF文件成功，文件名: " . fake()->word() . ".pdf",
            'export_csv'     => "导出CSV文件成功，文件名: " . fake()->word() . ".csv",
            'export_txt'     => "导出TXT文件成功，文件名: " . fake()->word() . ".txt",
            'export_zip'     => "导出ZIP文件成功，文件名: " . fake()->word() . ".zip",
            'upload_file'    => "上传文件成功，文件名: " . fake()->word() . "." . fake()->fileExtension(),
            'push_message'   => "推送消息成功，接收人: " . fake()->numberBetween(1, 100) . " 人",
            'send_sms'       => "发送短信成功，手机号: " . fake()->phoneNumber(),
            'send_email'     => "发送邮件成功，邮箱: " . fake()->email(),
        ];

        return $contents[$actionType] ?? "执行操作：{$actionType}";
    }

    /**
     * 生成延伸数据
     * @param string $actionType
     * @return array
     * @author siushin<siushin@163.com>
     */
    private function generateExtendData(string $actionType): array
    {
        $extendData = [
            'action_type' => $actionType,
            'timestamp'   => now()->toDateTimeString(),
        ];

        switch ($actionType) {
            case 'upload_file':
                $extendData['file_name'] = fake()->word() . "." . fake()->fileExtension();
                $extendData['file_size'] = fake()->numberBetween(1024, 10485760); // 1KB - 10MB
                $extendData['file_type'] = fake()->mimeType();
                break;
            case 'send_sms':
                $extendData['phone'] = fake()->phoneNumber();
                $extendData['content'] = "您的验证码是：" . fake()->numberBetween(100000, 999999);
                break;
            case 'send_email':
                $extendData['email'] = fake()->email();
                $extendData['subject'] = fake()->sentence();
                break;
            case 'export_excel':
            case 'export_pdf':
            case 'export_csv':
            case 'export_txt':
            case 'export_zip':
                $extendData['file_name'] = fake()->word() . "." . substr($actionType, 7);
                $extendData['record_count'] = fake()->numberBetween(10, 1000);
                break;
            case 'insert':
            case 'update':
            case 'delete':
                $extendData['record_id'] = fake()->numberBetween(1000, 9999);
                break;
        }

        return $extendData;
    }

    /**
     * 生成IP归属地
     * @return string
     * @author siushin<siushin@163.com>
     */
    private function generateIpLocation(): string
    {
        $provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '山东省', '河南省', '四川省', '湖北省', '湖南省'];
        $cities = ['北京', '上海', '深圳', '广州', '杭州', '南京', '济南', '郑州', '成都', '武汉', '长沙'];
        $province = fake()->randomElement($provinces);
        $city = fake()->randomElement($cities);
        return "{$province}{$city}";
    }

    /**
     * 生成变更数据
     * @param string $resourceType
     * @param string $action
     * @return array
     * @author siushin<siushin@163.com>
     */
    private function generateChangeData(string $resourceType, string $action): array
    {
        $beforeData = null;
        $afterData = null;

        if (in_array($action, ['更新', '编辑'])) {
            // 更新操作：生成变更前后数据
            switch ($resourceType) {
                case '用户':
                    $beforeData = [
                        'username' => fake()->userName(),
                        'status'   => fake()->randomElement([0, 1]),
                        'role_id'  => fake()->numberBetween(1, 10),
                    ];
                    $afterData = [
                        'username' => fake()->userName(),
                        'status'   => fake()->randomElement([0, 1]),
                        'role_id'  => fake()->numberBetween(1, 10),
                    ];
                    break;
                case '角色':
                    $beforeData = [
                        'role_name'   => fake()->word(),
                        'permissions' => fake()->words(3),
                    ];
                    $afterData = [
                        'role_name'   => fake()->word(),
                        'permissions' => fake()->words(5),
                    ];
                    break;
                case '配置':
                    $beforeData = [
                        'config_key'   => fake()->word(),
                        'config_value' => fake()->sentence(),
                    ];
                    $afterData = [
                        'config_key'   => $beforeData['config_key'],
                        'config_value' => fake()->sentence(),
                    ];
                    break;
                default:
                    $beforeData = ['field1' => fake()->word(), 'field2' => fake()->numberBetween(1, 100)];
                    $afterData = ['field1' => fake()->word(), 'field2' => fake()->numberBetween(1, 100)];
            }
        } elseif (in_array($action, ['新增', '添加'])) {
            // 新增操作：只有变更后数据
            $afterData = [
                'name'   => fake()->word(),
                'value'  => fake()->sentence(),
                'status' => fake()->randomElement([0, 1]),
            ];
        } elseif (in_array($action, ['删除'])) {
            // 删除操作：只有变更前数据
            $beforeData = [
                'name'   => fake()->word(),
                'value'  => fake()->sentence(),
                'status' => fake()->randomElement([0, 1]),
            ];
        }

        return [$beforeData, $afterData];
    }

    /**
     * 生成审计描述
     * @param string $module
     * @param string $action
     * @param string $resourceType
     * @param int    $resourceId
     * @return string
     * @author siushin<siushin@163.com>
     */
    private function generateAuditDescription(string $module, string $action, string $resourceType, int $resourceId): string
    {
        $descriptions = [
            '新增'     => "在{$module}模块中{$action}了{$resourceType}，资源ID: {$resourceId}",
            '添加'     => "在{$module}模块中{$action}了{$resourceType}，资源ID: {$resourceId}",
            '更新'     => "在{$module}模块中{$action}了{$resourceType}，资源ID: {$resourceId}",
            '编辑'     => "在{$module}模块中{$action}了{$resourceType}，资源ID: {$resourceId}",
            '删除'     => "在{$module}模块中{$action}了{$resourceType}，资源ID: {$resourceId}",
            '批量删除' => "在{$module}模块中{$action}了{$resourceType}，共删除 " . fake()->numberBetween(5, 50) . " 条记录",
            '导出'     => "在{$module}模块中{$action}了{$resourceType}数据，导出文件: " . fake()->word() . ".xlsx",
            '导入'     => "在{$module}模块中{$action}了{$resourceType}数据，导入文件: " . fake()->word() . ".xlsx",
        ];

        return $descriptions[$action] ?? "在{$module}模块中执行了{$action}操作，资源类型: {$resourceType}，资源ID: {$resourceId}";
    }
}

