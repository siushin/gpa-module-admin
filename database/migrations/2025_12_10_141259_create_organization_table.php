<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gpa_organization', function (Blueprint $table) {
            $table->id('organization_id')->comment('组织架构ID');
            $table->unsignedBigInteger('organization_tid')->comment('组织架构类型ID，取自字典表');
            $table->char('organization_name')->comment('组织架构名称');
            $table->unsignedBigInteger('organization_pid')->comment('上级组织架构ID');
            $table->char('full_organization_pid')->comment('完整上级组织架构ID');
            $table->unsignedInteger('sort')->default(0)->comment('排序');
            $table->timestamps();
            $table->unique(['organization_pid', 'organization_name']);

            $table->comment('组织架构表');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gpa_organization');
    }
};
