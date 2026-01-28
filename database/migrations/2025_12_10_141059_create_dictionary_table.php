<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Base\Enums\SysParamFlagEnum;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $sysParamFlagComment = buildEnumComment(SysParamFlagEnum::cases(), '系统参数标识');

        Schema::create('gpa_dictionary_category', function (Blueprint $table) use ($sysParamFlagComment) {
            $table->id('category_id')->comment('数据字典分类ID');
            $table->string('category_name')->comment('数据字典分类名');
            $table->string('category_code')->comment('数据字典编码');
            $table->string('tpl_path')->nullable()->default('')->comment('模板文件路径');
            $table->text('category_desc')->nullable()->comment('描述');
            $table->unsignedTinyInteger('sys_param_flag')->default(SysParamFlagEnum::No)->comment($sysParamFlagComment);
            $table->timestamps();

            $table->unique('category_name');
            $table->unique('category_code');

            $table->comment('数据字典分类表');
        });

        Schema::create('gpa_dictionary', function (Blueprint $table) use ($sysParamFlagComment) {
            $table->id('dictionary_id')->comment('数据字典ID');
            $table->unsignedBigInteger('category_id')->comment('字典类型ID');
            $table->foreign('category_id')->references('category_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete()
                ->on('gpa_dictionary_category');
            $table->string('dictionary_name')->comment('键名');
            $table->string('dictionary_value')->comment('值');
            $table->text('dictionary_desc')->nullable()->comment('描述');
            $table->unsignedInteger('sort')->default(0)->comment('排序');
            $table->unsignedTinyInteger('sys_param_flag')->default(SysParamFlagEnum::No)->comment($sysParamFlagComment);
            $table->unique(['category_id', 'dictionary_name'], 'unique_dictionary_name');
            $table->unique(['category_id', 'dictionary_name', 'dictionary_value'], 'unique_dictionary');
            $table->timestamps();

            $table->comment('数据字典表');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gpa_dictionary_category');
        Schema::dropIfExists('gpa_dictionary');
    }
};
