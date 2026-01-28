<?php

namespace Modules\Admin\Enums;

/**
 * 枚举：HTTP方法
 */
enum HttpMethodEnum: string
{
    case GET     = 'GET';       // GET请求
    case POST    = 'POST';      // POST请求
    case PUT     = 'PUT';       // PUT请求
    case DELETE  = 'DELETE';    // DELETE请求
    case PATCH   = 'PATCH';     // PATCH请求
    case HEAD    = 'HEAD';      // HEAD请求
    case OPTIONS = 'OPTIONS';   // OPTIONS请求
}
