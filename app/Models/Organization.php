<?php

namespace Modules\Admin\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Modules\Base\Enums\LogActionEnum;
use Modules\Base\Enums\OperationActionEnum;
use Modules\Base\Enums\ResourceTypeEnum;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Siushin\LaravelTool\Traits\ModelTool;
use Siushin\LaravelTool\Utils\Tree;
use Siushin\Util\Traits\ParamTool;
use Throwable;

/**
 * 模型：组织架构
 */
class Organization extends Model
{
    use HasFactory, ParamTool, ModelTool;

    protected $primaryKey = 'organization_id';
    protected $table      = 'gpa_organization';

    protected $fillable = [
        'organization_id', 'organization_tid', 'organization_name', 'organization_pid', 'full_organization_pid',
    ];

    protected $hidden = [
        'full_organization_pid', 'created_at', 'updated_at',
    ];

    /**
     * 获取组织架构（树状结构）
     * @param array $params
     * @return array
     * @throws Exception
     * @author siushin<siushin@163.com>
     */
    public static function getTreeData(array $params = []): array
    {
        self::checkEmptyParam($params, ['organization_tid']);

        $where = self::buildWhereData($params, [
            'organization_tid'  => '=',
            'organization_name' => 'like',
        ]);

        $searchData = self::query()->where($where)->pluck('full_organization_pid')->toArray();

        // 如果没有搜索结果，直接返回空数组
        if (empty($searchData)) {
            return [];
        }

        // 根据搜索结果，找出所有上级数据
        $all_organization_ids = [];
        foreach ($searchData as $full_organization_pid) {
            array_push($all_organization_ids, ...explode(',', trim($full_organization_pid, ',')));
        }
        $all_organization_ids = array_unique($all_organization_ids);
        $data = self::query()->whereIn('organization_id', $all_organization_ids)->get()->toArray();

        // 如果没有数据，返回空数组
        if (empty($data)) {
            return [];
        }

        return (new Tree('organization_id', 'organization_pid'))->getTree($data);
    }

    /**
     * 新增组织架构
     * @param array $params
     * @return array
     * @throws ContainerExceptionInterface|NotFoundExceptionInterface
     * @author siushin<siushin@163.com>
     */
    public static function addOrganization(array $params = []): array
    {
        // 参数校验：organization_tid 和 organization_name 必填，organization_pid 可选
        $params['only_empty_check'] = ['organization_pid'];
        self::checkEmptyParam($params, ['organization_tid', 'organization_name']);

        // 处理 organization_pid：如果为空或未传递，默认为 0（顶级组织架构）
        $organization_pid = isset($params['organization_pid']) && $params['organization_pid'] !== ''
            ? intval($params['organization_pid'])
            : 0;

        // 如果是顶级组织架构（organization_pid = 0）
        if ($organization_pid == 0) {
            // 顶级组织架构的 full_organization_pid 会在创建后设置为 ,organization_id,
            $parent_full_organization_pid = '';
        } else {
            // 检查上级组织架构是否存在
            $parent = self::query()->where('organization_id', $organization_pid)->first();
            !$parent && throw_exception('上级组织架构不存在');

            // 验证 organization_tid 是否与上级组织架构一致
            if (isset($params['organization_tid']) && $parent->organization_tid != $params['organization_tid']) {
                throw_exception('组织架构类型必须与上级组织架构一致');
            }

            // 获取上级组织架构的 full_organization_pid
            $parent_full_organization_pid = $parent->full_organization_pid;
        }

        // 同级查重：检查同一层级下是否已存在相同名称的组织架构
        $checkRepeat = self::query()
            ->where('organization_pid', $organization_pid)
            ->where('organization_name', $params['organization_name'])
            ->where('organization_tid', $params['organization_tid'])
            ->value('organization_id');
        $checkRepeat && throw_exception('该层级下已存在相同名称的组织架构，新增失败！');

        // 生成组织架构ID
        $params['organization_id'] = generateId();
        $params['organization_pid'] = $organization_pid;
        $params['organization_tid'] = intval($params['organization_tid']);

        // 创建组织架构（full_organization_pid 先设置为空，创建后再更新）
        $params['full_organization_pid'] = '';
        $organization = self::query()->create($params);
        !$organization && throw_exception('新增组织架构失败');

        // 更新完整组织架构ids
        // 顶级组织架构：,organization_id,
        // 非顶级组织架构：parent_full_organization_pid + organization_id + ,
        $organization['full_organization_pid'] = $parent_full_organization_pid . $organization['organization_id'] . ',';
        $organization->save();

        logGeneral(LogActionEnum::insert->name, "新增组织架构($organization->organization_name)", $organization->toArray());

        // 记录审计日志
        logAudit(
            request(),
            currentUserId(),
            '组织架构',
            OperationActionEnum::add->value,
            ResourceTypeEnum::other->value,
            $organization['organization_id'],
            null,
            $organization->toArray(),
            "新增组织架构: $organization->organization_name"
        );

        return $organization->toArray();
    }

    /**
     * 更新组织架构
     * @param array $params
     * @return array
     * @throws ContainerExceptionInterface|NotFoundExceptionInterface|Exception|Throwable
     * @author siushin<siushin@163.com>
     */
    public static function updateOrganization(array $params = []): array
    {
        // 参数校验：organization_id 和 organization_name 必填
        self::checkEmptyParam($params, ['organization_id', 'organization_name']);

        // 处理 organization_pid：如果为空或未传递，默认为 0（顶级组织架构）
        $organization_pid = isset($params['organization_pid']) && $params['organization_pid'] !== ''
            ? intval($params['organization_pid'])
            : 0;

        return DB::transaction(function () use ($params, $organization_pid) {
            $organization_id = (int)$params['organization_id'];

            // 查找组织架构
            $info = self::query()->find($organization_id);
            !$info && throw_exception(self::notFoundDataMsg($organization_id));

            $old_data = $info->toArray();
            $oldFullOrganizationPid = $info->full_organization_pid;
            $oldOrganizationPid = $info->organization_pid;
            $nameChanged = $info->organization_name !== $params['organization_name'];
            $pidChanged = $oldOrganizationPid !== $organization_pid;

            // 如果名称和上级都没有变化，直接返回
            if (!$nameChanged && !$pidChanged) {
                return [];
            }

            // 如果 organization_pid 发生变化，需要验证和更新层级关系
            $allSubOrganizationIds = [];
            if ($pidChanged) {
                // 如果是顶级组织架构（organization_pid = 0）
                if ($organization_pid == 0) {
                    $parent_full_organization_pid = '';
                } else {
                    // 检查上级组织架构是否存在
                    $parent = self::query()->where('organization_id', $organization_pid)->first();
                    !$parent && throw_exception('上级组织架构不存在');

                    // 验证：不能移动到自己
                    if ($organization_id === $organization_pid) {
                        throw_exception('不能将组织架构移动到自身');
                    }

                    // 验证：不能移动到自己的子级下（会造成循环引用）
                    if (str_contains($info->full_organization_pid, ",$organization_pid,")) {
                        throw_exception('不能将组织架构移动到自己的子级下');
                    }

                    // 验证：组织架构类型必须一致
                    if ($info->organization_tid !== $parent->organization_tid) {
                        throw_exception('组织架构类型必须与上级组织架构一致');
                    }

                    // 获取上级组织架构的 full_organization_pid
                    $parent_full_organization_pid = $parent->full_organization_pid;
                }

                // 计算新的完整组织架构ID路径
                $newFullOrganizationPid = $parent_full_organization_pid . $organization_id . ',';

                // 获取所有子、孙组织架构ID（不包括自己）
                $allSubOrganizationIds = self::query()
                    ->where('full_organization_pid', 'like', "%$oldFullOrganizationPid%")
                    ->where('organization_id', '!=', $organization_id)
                    ->pluck('organization_id')
                    ->toArray();

                // 更新当前组织架构的 parent ID 和 full_organization_pid
                $info->organization_pid = $organization_pid;
                $info->full_organization_pid = $newFullOrganizationPid;

                // 更新所有子、孙组织架构的 full_organization_pid
                if (!empty($allSubOrganizationIds)) {
                    self::query()->whereIn('organization_id', $allSubOrganizationIds)
                        ->update([
                            'full_organization_pid' => DB::raw("REPLACE(`full_organization_pid`, '$oldFullOrganizationPid', '$newFullOrganizationPid')")
                        ]);
                }
            }

            // 确定用于查重的 organization_pid（如果层级变化了，使用新的层级）
            $checkPid = $pidChanged ? $organization_pid : $oldOrganizationPid;

            // 如果名称有变化，需要在新层级下进行同级查重
            if ($nameChanged) {
                $checkRepeat = self::query()
                    ->where('organization_pid', $checkPid)
                    ->where('organization_name', $params['organization_name'])
                    ->where('organization_tid', $info->organization_tid)
                    ->where('organization_id', '!=', $organization_id)
                    ->value('organization_id');
                $checkRepeat && throw_exception('该层级下已存在相同名称的组织架构，更新失败！');

                // 更新组织架构名称
                $info->organization_name = $params['organization_name'];
            }

            // 保存更新
            $info->save();

            // 记录操作日志
            $extend_data = compareArray($info->toArray(), $old_data);
            if ($pidChanged) {
                $extend_data['new_parent_id'] = $organization_pid;
                $extend_data['new_full_organization_pid'] = $info->full_organization_pid;
                $extend_data['old_full_organization_pid'] = $oldFullOrganizationPid;
                $extend_data['sub_organization_count'] = count($allSubOrganizationIds);
            }
            logGeneral(LogActionEnum::update->name, "更新组织架构($info->organization_name)", $extend_data);

            // 记录审计日志
            $new_data = $info->fresh()->toArray();
            $auditMessage = "更新组织架构: $info->organization_name";
            if ($pidChanged) {
                $parentName = $organization_pid == 0 ? '顶级' : self::query()->find($organization_pid)->organization_name ?? '';
                $auditMessage .= " (移动到: $parentName)";
            }
            logAudit(
                request(),
                currentUserId(),
                '组织架构',
                OperationActionEnum::update->value,
                ResourceTypeEnum::other->value,
                $organization_id,
                $old_data,
                $new_data,
                $auditMessage
            );

            return [];
        });
    }

    /**
     * 删除组织架构
     * @param array $params
     * @return array
     * @throws ContainerExceptionInterface|NotFoundExceptionInterface
     * @author siushin<siushin@163.com>
     */
    public static function deleteOrganization(array $params = []): array
    {
        // 参数校验：organization_id 必填
        self::checkEmptyParam($params, ['organization_id']);

        $organization_id = (int)$params['organization_id'];

        // 查找组织架构
        $info = self::query()->find($organization_id);
        !$info && throw_exception(self::notFoundDataMsg($organization_id));

        // 保存旧数据用于日志记录
        $old_data = $info->toArray();

        // 获取所有下属组织架构ID（不包括自己）
        $sub_organization_ids = self::getSubOrganizationIds($info['full_organization_pid']);

        // 合并自己及所有下属组织架构ID
        $delete_ids = array_merge([$organization_id], $sub_organization_ids);
        $delete_ids = array_unique($delete_ids);

        // 删除组织架构（包括自己及所有下属）
        $delete_total = self::destroy($delete_ids);

        // 计算删除的子组织数量（不包括自己）
        $sub_count = count($sub_organization_ids);

        $extend_data = [
            'delete_ids'           => $delete_ids,
            'sub_organization_ids' => $sub_organization_ids,
            'sub_count'            => $sub_count,
        ];
        logGeneral(LogActionEnum::delete->name, "删除组织架构($info->organization_name)", $extend_data);

        // 记录审计日志
        $message = $sub_count > 0
            ? "删除组织架构: $info->organization_name (包含 $sub_count 个子组织)"
            : "删除组织架构: $info->organization_name";
        logAudit(
            request(),
            currentUserId(),
            '组织架构',
            OperationActionEnum::delete->value,
            ResourceTypeEnum::other->value,
            $organization_id,
            $old_data,
            null,
            $message
        );

        return compact('organization_id', 'delete_total', 'sub_count');
    }

    /**
     * 获取所有下属组织架构ID
     * @param string $full_organization_pid
     * @return array
     * @author siushin<siushin@163.com>
     */
    public static function getSubOrganizationIds(string $full_organization_pid): array
    {
        $where[] = ['full_organization_pid', 'like', "%$full_organization_pid%"];
        return self::query()->where($where)->pluck('organization_id')->toArray();
    }

    /**
     * 移动组织架构
     * @param array $params
     * @return array
     * @throws Exception|Throwable
     * @author siushin<siushin@163.com>
     */
    public static function moveOrganization(array $params): array
    {
        // 参数校验：organization_id 必填，belong_organization_id 可选（不传或为空默认为0，表示移动到顶级）
        self::checkEmptyParam($params, ['organization_id']);

        // 处理 belong_organization_id：如果为空或未传递，默认为 0（顶级组织架构）
        $belong_organization_id = isset($params['belong_organization_id']) && $params['belong_organization_id'] !== ''
            ? intval($params['belong_organization_id'])
            : 0;

        DB::transaction(function () use ($params, $belong_organization_id) {
            $organization_id = (int)$params['organization_id'];

            // 查找要移动的组织架构
            $organization = self::query()->find($organization_id);
            !$organization && throw_exception(self::notFoundDataMsg($organization_id));

            // 如果是顶级组织架构（belong_organization_id = 0）
            if ($belong_organization_id == 0) {
                $parent_full_organization_pid = '';
                $newParentName = '顶级';
            } else {
                // 查找目标上级组织架构
                $newParent = self::query()->find($belong_organization_id);
                !$newParent && throw_exception(self::notFoundDataMsg($belong_organization_id));

                // 验证：不能移动到自己
                if ($organization_id === $belong_organization_id) {
                    throw_exception('不能将组织架构移动到自身');
                }

                // 验证：不能移动到自己的子级下（会造成循环引用）
                if (str_contains($organization->full_organization_pid, ",$belong_organization_id,")) {
                    throw_exception('不能将组织架构移动到自己的子级下');
                }

                // 验证：组织架构类型必须一致
                if ($organization->organization_tid !== $newParent->organization_tid) {
                    throw_exception('组织架构类型必须与目标上级组织架构一致');
                }

                $parent_full_organization_pid = $newParent->full_organization_pid;
                $newParentName = $newParent->organization_name;
            }

            // 验证：目标位置下不能存在相同名称的组织架构（排除自己）
            $existingOrganization = self::query()
                ->where('organization_pid', $belong_organization_id)
                ->where('organization_name', $organization->organization_name)
                ->where('organization_id', '!=', $organization_id)
                ->first();
            if ($existingOrganization) {
                throw_exception("目标组织架构下已存在名称为「{$organization->organization_name}」的组织架构");
            }

            // 如果目标上级已经是当前上级，无需移动
            if ($organization->organization_pid === $belong_organization_id) {
                return;
            }

            // 保存旧数据用于日志记录
            $old_data = $organization->toArray();
            $oldFullOrganizationPid = $organization->full_organization_pid;

            // 计算新的完整组织架构ID路径
            $newFullOrganizationPid = $parent_full_organization_pid . $organization_id . ',';

            // 获取所有子、孙组织架构ID（不包括自己）
            $allSubOrganizationIds = self::query()
                ->where('full_organization_pid', 'like', "%$oldFullOrganizationPid%")
                ->where('organization_id', '!=', $organization_id)
                ->pluck('organization_id')
                ->toArray();

            // 更新当前组织架构的 parent ID 和 full_organization_pid
            self::query()->where('organization_id', $organization_id)
                ->update([
                    'organization_pid'      => $belong_organization_id,
                    'full_organization_pid' => $newFullOrganizationPid,
                ]);

            // 更新所有子、孙组织架构的 full_organization_pid
            if (!empty($allSubOrganizationIds)) {
                self::query()->whereIn('organization_id', $allSubOrganizationIds)
                    ->update([
                        'full_organization_pid' => DB::raw("REPLACE(`full_organization_pid`, '$oldFullOrganizationPid', '$newFullOrganizationPid')")
                    ]);
            }

            // 记录操作日志
            $extend_data = [
                'new_parent_id'             => $belong_organization_id,
                'new_parent_name'           => $newParentName,
                'new_full_organization_pid' => $newFullOrganizationPid,
                'old_full_organization_pid' => $oldFullOrganizationPid,
                'sub_organization_count'    => count($allSubOrganizationIds),
            ];
            logGeneral(LogActionEnum::update->name, "移动组织架构($organization->organization_name)", $extend_data);

            // 记录审计日志
            $organization->refresh();
            $new_data = $organization->toArray();
            logAudit(
                request(),
                currentUserId(),
                '组织架构',
                OperationActionEnum::move->value,
                ResourceTypeEnum::other->value,
                $organization_id,
                $old_data,
                $new_data,
                "移动组织架构: $organization->organization_name 到 $newParentName"
            );
        });

        return [];
    }
}
