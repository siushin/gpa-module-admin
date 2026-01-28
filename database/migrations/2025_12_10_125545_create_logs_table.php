<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Base\Enums\BrowserEnum;
use Modules\Base\Enums\DeviceTypeEnum;
use Modules\Base\Enums\HttpMethodEnum;
use Modules\Base\Enums\OperatingSystemEnum;
use Modules\Base\Enums\OperationActionEnum;
use Modules\Base\Enums\ResourceTypeEnum;
use Siushin\LaravelTool\Enums\RequestSourceEnum;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 构造枚举备注
        $sourceTypeComment = buildEnumComment(RequestSourceEnum::cases(), '访问来源');
        $httpMethodComment = buildEnumComment(HttpMethodEnum::cases(), 'HTTP方法');
        $operationActionComment = buildEnumComment(OperationActionEnum::cases(), '操作类型');
        $browserComment = buildEnumComment(BrowserEnum::cases(), '浏览器名称');
        $operatingSystemComment = buildEnumComment(OperatingSystemEnum::cases(), '操作系统');
        $deviceTypeComment = buildEnumComment(DeviceTypeEnum::cases(), '设备类型');
        $resourceTypeComment = buildEnumComment(ResourceTypeEnum::cases(), '资源类型');

        // 常规日志表（用于记录各种业务操作日志，如：文件上传、消息推送、短信发送等）
        Schema::create('gpa_logs', function (Blueprint $table) use ($sourceTypeComment) {
            $table->id('log_id')->comment('日志ID');
            $table->unsignedBigInteger('account_id')->nullable()->comment('账号ID（关联gpa_account.id）');
            $table->string('source_type', 50)->comment($sourceTypeComment);
            $table->char('action_type', 20)->comment('操作类型（对应LogActionEnum）');
            $table->string('content')->comment('日志内容');
            $table->ipAddress()->comment('IP地址');
            $table->string('ip_location')->nullable()->comment('IP归属地');
            $table->json('extend_data')->nullable()->comment('补充数据（JSON格式）');
            $table->timestamp('created_at')->comment('创建时间');

            $table->foreign('account_id')
                ->references('id')
                ->on('gpa_account')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->index('account_id');
            $table->index('source_type');
            $table->index('action_type');
            $table->index('created_at');
            $table->index(['account_id', 'created_at']);
            $table->index(['action_type', 'created_at']);

            $table->comment('常规日志表');
        });

        // 操作日志表（用于记录HTTP请求相关的操作日志）
        Schema::create('gpa_operation_log', function (Blueprint $table) use ($sourceTypeComment, $operationActionComment, $httpMethodComment) {
            $table->id()->comment('操作日志ID');
            $table->unsignedBigInteger('account_id')->nullable()->comment('账号ID（关联gpa_account.id）');
            $table->string('source_type', 50)->comment($sourceTypeComment);
            $table->string('module', 50)->comment('模块名称');
            $table->string('action', 50)->comment($operationActionComment);
            $table->string('method', 10)->comment($httpMethodComment);
            $table->text('path')->comment('请求URL');
            $table->text('params')->nullable()->comment('请求参数（JSON格式）');
            $table->ipAddress()->comment('IP地址');
            $table->string('ip_location')->nullable()->comment('IP归属地');
            $table->string('user_agent', 500)->nullable()->comment('User-Agent');
            $table->integer('response_code')->nullable()->comment('响应状态码');
            $table->integer('execution_time')->nullable()->comment('执行耗时（毫秒）');
            $table->timestamp('operated_at')->useCurrent()->comment('操作时间');

            $table->foreign('account_id')
                ->references('id')
                ->on('gpa_account')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->index('account_id');
            $table->index('module');
            $table->index('action');
            $table->index('method');
            $table->index('operated_at');
            $table->index(['module', 'action']);
            $table->index(['account_id', 'operated_at']);
            $table->index(['module', 'operated_at']);

            $table->comment('操作日志表');
        });

        // 审计日志表（用于记录敏感操作和重要数据变更）
        Schema::create('gpa_audit_log', function (Blueprint $table) use ($operationActionComment, $resourceTypeComment) {
            $table->id()->comment('审计日志ID');
            $table->unsignedBigInteger('account_id')->nullable()->comment('操作人ID（关联gpa_account.id）');
            $table->string('module', 50)->comment('模块名称');
            $table->string('action', 50)->comment($operationActionComment);
            $table->string('resource_type', 50)->nullable()->comment($resourceTypeComment);
            $table->unsignedBigInteger('resource_id')->nullable()->comment('资源ID');
            $table->json('before_data')->nullable()->comment('变更前数据（JSON格式）');
            $table->json('after_data')->nullable()->comment('变更后数据（JSON格式）');
            $table->text('description')->nullable()->comment('操作描述');
            $table->ipAddress()->comment('IP地址');
            $table->string('ip_location')->nullable()->comment('IP归属地');
            $table->string('user_agent', 500)->nullable()->comment('User-Agent');
            $table->timestamp('audited_at')->useCurrent()->comment('审计时间');

            $table->foreign('account_id')
                ->references('id')
                ->on('gpa_account')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->index('account_id');
            $table->index('module');
            $table->index('action');
            $table->index('resource_type');
            $table->index('resource_id');
            $table->index('audited_at');
            $table->index(['module', 'action']);
            $table->index(['resource_type', 'resource_id']);
            $table->index(['account_id', 'audited_at']);
            $table->index(['module', 'audited_at']);

            $table->comment('审计日志表');
        });

        // 登录日志表（用于记录用户登录/登出日志）
        Schema::create('gpa_login_log', function (Blueprint $table) use ($browserComment, $operatingSystemComment, $deviceTypeComment) {
            $table->id()->comment('登录日志ID');
            $table->unsignedBigInteger('account_id')->nullable()->comment('账号ID（关联gpa_account.id）');
            $table->string('username', 50)->nullable()->comment('用户名（冗余字段，便于查询）');
            $table->tinyInteger('status')->default(0)->comment('登录状态: 1成功, 0失败');
            $table->ipAddress('ip_address')->comment('IP地址');
            $table->string('ip_location')->nullable()->comment('IP归属地');
            $table->string('browser', 50)->nullable()->comment($browserComment);
            $table->string('browser_version', 20)->nullable()->comment('浏览器版本');
            $table->string('operating_system', 50)->nullable()->comment($operatingSystemComment);
            $table->string('device_type', 20)->nullable()->comment($deviceTypeComment);
            $table->text('user_agent')->nullable()->comment('User-Agent');
            $table->string('message', 500)->nullable()->comment('登录信息/错误信息（如：登录成功、密码错误）');
            $table->timestamp('login_at')->useCurrent()->comment('登录时间');

            $table->foreign('account_id')
                ->references('id')
                ->on('gpa_account')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->index('account_id');
            $table->index('username');
            $table->index('status');
            $table->index('ip_address');
            $table->index('login_at');
            $table->index(['account_id', 'login_at']);
            $table->index(['status', 'login_at']);
            $table->index(['ip_address', 'login_at']);

            $table->comment('登录日志表');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gpa_logs');
        Schema::dropIfExists('gpa_operation_log');
        Schema::dropIfExists('gpa_audit_log');
        Schema::dropIfExists('gpa_login_log');
    }
};
