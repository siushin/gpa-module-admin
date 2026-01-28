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
        Schema::create('gpa_user', function (Blueprint $table) {
            $table->id()->comment('用户ID');
            $table->unsignedBigInteger('account_id')->unique()->comment('账号ID');
            $table->timestamps();

            $table->foreign('account_id')->references('id')->on('gpa_account')->onDelete('cascade');
            $table->comment('用户表');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gpa_user');
    }
};

