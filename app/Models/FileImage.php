<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Admin\Models\Intfs\IFile;

/**
 * 模型：图片文件
 */
class FileImage extends Model implements IFile
{
    use HasFactory;

    protected $primaryKey = 'image_id';
    protected $table      = 'gpa_file_images';

    protected $guarded = [];

    protected $hidden = ['created_at', 'updated_at'];

    /**
     * 获取图片文件
     * @return BelongsTo
     * @author siushin<siushin@163.com>
     */
    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class);
    }

    /**
     * 后置钩子：上传文件扩展
     * @param int    $file_id
     * @param string $full_file_path
     * @return void
     * @author siushin<siushin@163.com>
     */
    public static function uploadFileExtraAfterHook(int $file_id, string $full_file_path): void
    {
        list($width, $height) = getimagesize($full_file_path);
        $data = [
            'file_id'      => $file_id,
            'image_width'  => $width,
            'image_height' => $height,
        ];
        // 图片信息 入库
        self::query()->create($data);
    }
}
