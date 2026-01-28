<?php

namespace Modules\Admin\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Modules\Admin\Enums\OperationActionEnum;
use Modules\Admin\Models\NotificationRead;
use Siushin\LaravelTool\Attributes\ControllerName;
use Siushin\LaravelTool\Attributes\OperationAction;

#[ControllerName('通知查看记录')]
class NotificationReadController extends Controller
{
    /**
     * 获取通知查看记录列表
     * @return JsonResponse
     * @throws Exception
     * @author siushin<siushin@163.com>
     */
    #[OperationAction(OperationActionEnum::index)]
    public function index(): JsonResponse
    {
        $params = request()->all();
        return success(NotificationRead::getPageData($params));
    }
}

