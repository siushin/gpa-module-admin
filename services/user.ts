/* eslint-disable */
import { request } from '@umijs/max';

/** 获取当前的用户 POST /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/currentUser', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 获取用户菜单列表 POST /api/getUserMenus */
export async function getUserMenus(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data?: any[];
  }>('/api/getUserMenus', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 刷新 Token POST /api/refreshToken */
export async function refreshToken(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data?: {
      token: {
        token_type: string;
        expires_in: number;
        access_token: string;
        refresh_token: string;
      };
    };
  }>('/api/refreshToken', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 用户注册 POST /api/register */
export async function register(
  body: {
    username?: string;
    password?: string;
    confirm_password?: string;
    phone?: string;
    code?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.LoginResult>('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 重置密码 POST /api/resetPassword */
export async function resetPassword(
  body: {
    phone?: string;
    code?: string;
    password?: string;
    confirm_password?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/resetPassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

// ========== 用户管理 API ==========

/** 用户列表 POST /api/admin/user/index */
export async function getUserList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/user/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 新增用户 POST /api/admin/user/add */
export async function addUser(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/user/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新用户 POST /api/admin/user/update */
export async function updateUser(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/user/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除用户 POST /api/admin/user/delete */
export async function deleteUser(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/user/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取用户详情 POST /api/admin/user/getDetail */
export async function getUserDetail(
  body: {
    account_id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: {
      account: any;
      profile: any;
      user: any;
      social: Array<{
        id: number;
        social_type: string;
        social_account: string;
        social_name?: string;
        avatar?: string;
        is_verified: number;
        verified_at?: string;
        created_at?: string;
        updated_at?: string;
      }>;
    };
  }>('/api/admin/user/getDetail', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 审核用户 POST /api/admin/user/audit */
export async function auditUser(
  body: {
    account_id: number;
    status: number; // 1: 通过, 0: 拒绝
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/user/audit', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 批量审核用户 POST /api/admin/user/batchAudit */
export async function batchAuditUser(
  body: {
    account_ids: number[];
    status: number; // 1: 通过, 0: 拒绝
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: {
      success_count: number;
      fail_count: number;
      success_usernames: string[];
      fail_usernames: string[];
      message: string;
    };
  }>('/api/admin/user/batchAudit', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 批量删除用户 POST /api/admin/user/batchDelete */
export async function batchDeleteUser(
  body: {
    account_ids: number[];
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: {
      success_count: number;
      fail_count: number;
      success_usernames: string[];
      fail_usernames: string[];
      message: string;
    };
  }>('/api/admin/user/batchDelete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取用户日志 POST /api/admin/user/getLogs */
export async function getUserLogs(
  params: {
    account_id: number;
    log_type: 'general' | 'operation' | 'audit' | 'login';
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/user/getLogs', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 获取用户角色 POST /api/admin/user/getRoles */
export async function getUserRoles(
  body: {
    account_id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: {
      all_roles: Array<{
        role_id: number;
        role_name: string;
        role_code: string;
        description?: string;
      }>;
      checked_role_ids: number[];
    };
  }>('/api/admin/user/getRoles', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新用户角色 POST /api/admin/user/updateRoles */
export async function updateUserRoles(
  body: {
    account_id: number;
    role_ids: number[];
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/user/updateRoles', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
