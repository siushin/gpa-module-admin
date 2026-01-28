<?php

namespace Modules\Admin\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Modules\Base\Enums\LogActionEnum;
use Modules\Base\Enums\OperationActionEnum;
use Modules\Base\Enums\ResourceTypeEnum;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Siushin\LaravelTool\Enums\UploadFileTypeEnum;
use Siushin\LaravelTool\Traits\ModelTool;

/**
 * 模型：文件
 */
class File extends Model
{
    use HasFactory, SoftDeletes, ModelTool;

    protected $primaryKey = 'file_id';
    protected $table      = 'gpa_files';

    const string DEFAULT_DISK    = 'public';   // 默认存储 disk
    const string DEFAULT_PRIVATE = 'local';   // 默认私人 disk
    const string DEFAULT_RECYCLE = 'recycle';   // 默认回收站 disk

    // 文件类型 => 存储 disk 符
    const string FILE_IMAGE = 'image';
    const string FILE_PDF   = 'pdf';

    protected $fillable = [
        'file_name', 'origin_file_name', 'file_path', 'file_size', 'mime_type', 'file_ext_name',
        'account_id', 'checksum',
    ];

    private static array $allowImages = [
        UploadFileTypeEnum::JPG, UploadFileTypeEnum::JPEG, UploadFileTypeEnum::PNG, UploadFileTypeEnum::GIF,
    ];

    private static array $allowPDFs = [
        UploadFileTypeEnum::PDF,
    ];

    protected $hidden = ['original_file_name', 'created_at', 'updated_at'];

    /**
     * 获取关联文件图片
     */
    public function image(): HasOne
    {
        return $this->hasOne(FileImage::class);
    }

    /**
     * 获取一对一（多态）的关联模型
     * @param string $file_type
     * @return string
     * @author siushin<siushin@163.com>
     */
    public static function getFileableType(string $file_type): string
    {
        return match ($file_type) {
            self::FILE_IMAGE => FileImage::class,
            default => '',
        };
    }

    /**
     * 上传文件
     * @param UploadedFile $file
     * @param string       $disk
     * @return array
     * @throws ContainerExceptionInterface|NotFoundExceptionInterface
     * @author siushin<siushin@163.com>
     */
    public static function uploadFile(UploadedFile $file, string $disk = self::DEFAULT_DISK): array
    {
        // 获取原始文件名
        $originalName = $file->getClientOriginalName();
        // 获取原始文件的扩展名
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        if ($extension) $extension = strtolower($extension);
        // 文件类型 / 按文件类型分配存储目录
        $file_type = $save_path = self::getAllowFileType($extension);
        empty($file_type) && throw_exception('该文件不支持上传');

        $file_path = Storage::disk($disk)->putFile("/$save_path", $file);
        !$file_path && throw_exception('存储文件失败');
        $file_path = '/' . ltrim($file_path, '/');

        // 文件名
        $full_file_path = storage_path("app/" . ltrim($disk, '/')) . $file_path;
        // 额外表信息处理
        $extra_file_obj = self::getFileableType($file_type);

        // 存储文件信息到数据库
        $data = [
            'file_name'        => basename($full_file_path),
            'origin_file_name' => $file->getClientOriginalName(),
            'file_path'        => $file_path,
            'file_size'        => $file->getSize(),
            'mime_type'        => mime_content_type($file->getPathname()),
            'file_ext_name'    => $extension,
            'account_id'       => currentUserId(),
            'checksum'         => hash_file('sha256', $file->getPathname()),
        ];
        $result = self::query()->create($data);

        logGeneral(LogActionEnum::upload_file->name, "上传文件({$result['file_name']})", $result->toArray());

        // 记录审计日志
        logAudit(
            request(),
            currentUserId(),
            '文件管理',
            OperationActionEnum::upload->value,
            ResourceTypeEnum::file->value,
            $result->file_id,
            null,
            $result->only(['file_id', 'file_name', 'origin_file_name', 'file_path', 'file_size', 'mime_type', 'file_ext_name', 'account_id']),
            "上传文件: {$result['origin_file_name']} (大小: " . formatBytes($result['file_size']) . ")"
        );

        // 根据文件类型分发执行附属模型
        if (method_exists($extra_file_obj, 'uploadFileExtraAfterHook')) {
            $extra_file_obj::uploadFileExtraAfterHook($result->file_id, $full_file_path);
        }

        $url_path = self::getFileUrl($result['file_path']);

        return compact('file_path', 'url_path');
    }

    /**
     * 获取文件类型
     * @param string $extension
     * @return string
     * @author siushin<siushin@163.com>
     */
    public static function getAllowFileType(string $extension): string
    {
        $file_type = '';
        if (in_array($extension, array_column(self::$allowImages, 'value'))) {
            $file_type = self::FILE_IMAGE;
        } elseif (in_array($extension, array_column(self::$allowPDFs, 'value'))) {
            $file_type = self::FILE_PDF;
        }
        return $file_type;
    }

    /**
     * 获取文件url地址
     * @param string $file_path 文件路径
     * @param string $disk      磁盘
     * @return string
     * @author siushin<siushin@163.com>
     */
    public static function getFileUrl(string $file_path, string $disk = self::DEFAULT_DISK): string
    {
        $file_path = ltrim($file_path, '/');

        $url = '';
        $full_file_path = Storage::disk($disk)->path($file_path);
        if (file_exists($full_file_path)) {
            $url = url($file_path);
        }
        return $url;
    }

    /**
     * 删除文件
     * @param array $params
     * @return array
     * @throws Exception
     * @author siushin<siushin@163.com>
     */
    public static function deleteFile(array $params): array
    {
        self::checkEmptyParam($params, ['file_path']);
        $real_delete = $params['real_delete'] ?? false;

        // 文件信息
        $file_info = self::where('file_path', $params['file_path'])->first();

        if (!$file_info) {
            return [];
        }

        if (currentUserId() != $file_info->account_id) {
            throw_exception('您没有权限删除此文件');
        }

        $from = ltrim($file_info->file_path, '/');

        if (!$real_delete) {
            // 将文件移至回收站目录（带日期，用户）
            $date = date('Ymd');
            $recycle_path = "recycle/$date/$file_info->account_id/";
            $to = $recycle_path . basename($file_info->file_path);

            Storage::disk(self::DEFAULT_PRIVATE)->makeDirectory($recycle_path);

            // 使用流处理（适合大文件）
            $readStream = Storage::disk(self::DEFAULT_DISK)->readStream($from);
            $copied = Storage::disk(self::DEFAULT_PRIVATE)->writeStream($to, $readStream);

            if (!$copied || !is_resource($readStream)) {
                throw_exception("文件删除失败");
            }

            fclose($readStream); // 关闭流

            // 删除源文件
            $deleted = Storage::disk(self::DEFAULT_DISK)->delete($from);

            if (!$deleted) {
                Storage::disk(self::DEFAULT_PRIVATE)->delete($to);
                throw_exception("文件删除失败");
            }

            // 删除文件表数据（软删除）
            $old_data = $file_info->toArray();
            $file_id = $file_info->file_id;
            $file_info->delete();

            // 记录审计日志
            logAudit(
                request(),
                currentUserId(),
                '文件管理',
                OperationActionEnum::delete->value,
                ResourceTypeEnum::file->value,
                $file_id,
                $old_data,
                null,
                "删除文件: {$old_data['origin_file_name']} (移至回收站)"
            );
        } else {
            // 删除源文件
            $deleted = Storage::disk(self::DEFAULT_DISK)->delete($from);
            !$deleted && throw_exception("文件删除失败");
            // 删除文件（真实删除）
            $old_data = $file_info->toArray();
            $file_id = $file_info->file_id;
            $file_info->forceDelete();

            // 记录审计日志
            logAudit(
                request(),
                currentUserId(),
                '文件管理',
                OperationActionEnum::delete->value,
                ResourceTypeEnum::file->value,
                $file_id,
                $old_data,
                null,
                "永久删除文件: {$old_data['origin_file_name']}"
            );
        }

        return [];
    }

    /**
     * 清空文件（只能清空属于自己的）
     * @param int  $account_id
     * @param bool $real_delete
     * @return void
     * @throws ContainerExceptionInterface|NotFoundExceptionInterface
     * @author siushin<siushin@163.com>
     */
    public static function cleanupFileByAccountId(int $account_id, bool $real_delete = false): void
    {
        // TODO 写入redis 缓存，走异步后台删除
        $count = self::where('account_id', $account_id)->count();
        $file_ids = self::where('account_id', $account_id)->pluck('file_id')->toArray();
        self::where('account_id', $account_id)->select('account_id', 'file_path')
            ->orderBy('file_id')
            ->chunk(100, function (Collection $files) use ($real_delete) {
                foreach ($files as $file) {
                    $file->real_delete = $real_delete;
                    self::deleteFile($file->toArray());
                }
            });
        logGeneral(LogActionEnum::batchDelete->name, "批量删除文件{$count}个", compact('file_ids'));

        // 记录审计日志
        logAudit(
            request(),
            $account_id,
            '文件管理',
            OperationActionEnum::delete->value,
            ResourceTypeEnum::file->value,
            null,
            null,
            null,
            "清空文件: 共删除 $count 个文件"
        );
    }
}
