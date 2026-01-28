/* eslint-disable */
import { request } from '@umijs/max';

// ========== 管理员列表 API ==========

/** 管理员列表 POST /api/admin/admin/index */
export async function getAdminList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/admin/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 管理员列表（全部，不分页） POST /api/admin/admin/list */
export async function getAdminListAll(
  params?: {
    company_id?: number;
    status?: number;
    keyword?: string;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: Array<{
      account_id: number;
      username: string;
      nickname?: string;
      name?: string;
      account?: string;
      phone?: string;
      email?: string;
      status: number;
      company_id?: number;
      [key: string]: any;
    }>;
  }>('/api/admin/admin/list', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 新增管理员 POST /api/admin/admin/add */
export async function addAdmin(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/admin/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新管理员 POST /api/admin/admin/update */
export async function updateAdmin(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/admin/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除管理员 POST /api/admin/admin/delete */
export async function deleteAdmin(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/admin/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 批量移除员工（从公司移除） POST /api/admin/admin/batchRemoveFromCompany */
export async function batchRemoveAdminFromCompany(
  body: {
    account_ids: number[];
    company_id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: {
      count: number;
      deleted_department_count: number;
    };
  }>('/api/admin/admin/batchRemoveFromCompany', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取管理员详情 POST /api/admin/admin/getDetail */
export async function getAdminDetail(
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
      admin: any;
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
      departments?: Array<{
        id: number;
        department_id: number;
        department_name: string;
        department_code?: string;
        company_id?: number;
        company_name?: string;
        is_primary: number;
        start_date?: string;
        end_date?: string;
        status: number;
        sort_order: number;
        created_at?: string;
        updated_at?: string;
      }>;
    };
  }>('/api/admin/admin/getDetail', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取账号所属部门列表 POST /api/admin/admin/getAccountDepartments */
export async function getAccountDepartments(
  body: {
    account_id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: Array<{
      id: number;
      department_id: number;
      department_name: string;
      department_code?: string;
      company_id?: number;
      company_name?: string;
      is_primary: number;
      start_date?: string;
      end_date?: string;
      status: number;
      sort_order: number;
      created_at?: string;
      updated_at?: string;
    }>;
  }>('/api/admin/admin/getAccountDepartments', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取管理员角色 POST /api/admin/admin/getRoles */
export async function getAdminRoles(
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
  }>('/api/admin/admin/getRoles', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新管理员角色 POST /api/admin/admin/updateRoles */
export async function updateAdminRoles(
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
  }>('/api/admin/admin/updateRoles', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取管理员日志 POST /api/admin/admin/getLogs */
export async function getAdminLogs(
  params: {
    account_id: number;
    log_type: 'general' | 'operation' | 'audit' | 'login';
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/admin/getLogs', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 公司列表 POST /api/admin/company/list */
export async function getCompanyList(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data?: Array<{
      company_id: number;
      company_code: string;
      company_name: string;
    }>;
  }>('/api/admin/company/list', {
    method: 'POST',
    data: {},
    ...(options || {}),
  });
}

// ========== 角色管理 API ==========

/** 角色列表 POST /api/admin/role/index */
export async function getRoleList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/role/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 新增角色 POST /api/admin/role/add */
export async function addRole(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/role/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新角色 POST /api/admin/role/update */
export async function updateRole(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/role/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除角色 POST /api/admin/role/delete */
export async function deleteRole(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/role/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// ========== 菜单管理 API ==========

/** 菜单列表 POST /api/admin/menu/index */
export async function getMenuList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/menu/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 菜单树形列表 POST /api/admin/menu/tree */
export async function getMenuTree(
  params?: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any[];
  }>('/api/admin/menu/tree', {
    method: 'POST',
    data: params || {},
    ...(options || {}),
  });
}

/** 目录树形列表（仅目录类型，用于筛选） POST /api/admin/menu/dirTree */
export async function getMenuDirTree(
  params: {
    account_type: 'admin' | 'user';
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: Array<{
      menu_id: number;
      menu_name: string;
      menu_key: string;
      children?: any[];
    }>;
  }>('/api/admin/menu/dirTree', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 获取菜单列表搜索数据 POST /api/admin/menu/getMenuListSearchData */
export async function getMenuListSearchData(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data?: {
      module?: Array<{
        label: string;
        value: number;
      }>;
    };
  }>('/api/admin/menu/getMenuListSearchData', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 新增菜单 POST /api/admin/menu/add */
export async function addMenu(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/menu/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新菜单 POST /api/admin/menu/update */
export async function updateMenu(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/menu/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除菜单 POST /api/admin/menu/delete */
export async function deleteMenu(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/menu/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 移动菜单组到新模块 POST /api/admin/role/moveMenuToModule */
export async function moveMenuToModule(
  body: {
    role_id: number;
    menu_ids: number[];
    target_module_id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/role/moveMenuToModule', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 将菜单组移回原模块 POST /api/admin/role/moveMenuBackToOriginal */
export async function moveMenuBackToOriginal(
  body: {
    role_id: number;
    menu_ids: number[];
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/role/moveMenuBackToOriginal', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// ========== 用户角色关联 API ==========

/** 用户角色关联列表 POST /api/admin/userRole/index */
export async function getUserRoleList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/userRole/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 新增用户角色关联 POST /api/admin/userRole/add */
export async function addUserRole(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/userRole/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除用户角色关联 POST /api/admin/userRole/delete */
export async function deleteUserRole(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/userRole/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// ========== 角色菜单关联 API ==========

/** 角色菜单关联列表 POST /api/admin/roleMenu/index */
export async function getRoleMenuList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/roleMenu/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 新增角色菜单关联 POST /api/admin/roleMenu/add */
export async function addRoleMenu(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/roleMenu/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除角色菜单关联 POST /api/admin/roleMenu/delete */
export async function deleteRoleMenu(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/roleMenu/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取角色菜单（按模块分组） POST /api/admin/role/getMenus */
export async function getRoleMenus(
  body: {
    role_id: number;
    account_type: 'admin' | 'user';
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: {
      modules_with_menus: Array<{
        module: {
          module_id: number;
          module_name: string;
          module_alias: string;
          module_title?: string;
        };
        menus: Array<{
          menu_id: number;
          menu_name: string;
          menu_key: string;
          menu_type: string;
          parent_id: number;
          module_id?: number | null;
          is_required?: number;
          target_module_id?: number | null;
          children?: any[];
        }>;
      }>;
      checked_menu_ids: number[];
      menu_move_map: Record<number, number>;
    };
  }>('/api/admin/role/getMenus', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新角色菜单 POST /api/admin/role/updateMenus */
export async function updateRoleMenus(
  body: {
    role_id: number;
    menu_ids: number[];
    menu_move_map?: Record<number, number>;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/role/updateMenus', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取所有模块列表 POST /api/admin/role/getModuleList */
export async function getModuleList(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data?: Array<{
      module_id: number;
      module_name: string;
      module_alias: string;
    }>;
  }>('/api/admin/role/getModuleList', {
    method: 'POST',
    data: {},
    ...(options || {}),
  });
}

/** 将指定模块下所有已移入的菜单组移回原模块 POST /api/admin/role/moveAllBackByModule */
export async function moveAllBackByModule(
  body: {
    role_id: number;
    module_id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: {
      count: number;
    };
  }>('/api/admin/role/moveAllBackByModule', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// ========== 数据字典分类管理 API ==========

/** 数据字典分类列表 POST /api/admin/DictionaryCategory/index */
export async function getDictionaryCategoryList(
  params?: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any[];
  }>('/api/admin/DictionaryCategory/index', {
    method: 'POST',
    data: params || {},
    ...(options || {}),
  });
}

// ========== 数据字典管理 API ==========

/** 数据字典列表 POST /api/admin/dictionary/index */
export async function getDictionaryList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/dictionary/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 数据字典全部列表 POST /api/admin/dictionary/list */
export async function getDictionaryAll(
  params?: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any[];
  }>('/api/admin/dictionary/list', {
    method: 'POST',
    data: params || {},
    ...(options || {}),
  });
}

/** 新增数据字典 POST /api/admin/dictionary/add */
export async function addDictionary(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/dictionary/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新数据字典 POST /api/admin/dictionary/update */
export async function updateDictionary(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/dictionary/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除数据字典 POST /api/admin/dictionary/delete */
export async function deleteDictionary(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/dictionary/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 批量删除数据字典 POST /api/admin/dictionary/batchDelete */
export async function batchDeleteDictionary(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/dictionary/batchDelete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取数据字典父级数据 POST /api/admin/dictionary/getPidData */
export async function getDictionaryPidData(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any[];
  }>('/api/admin/dictionary/getPidData', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// ========== 日志相关 API ==========

/** 常规日志列表 POST /api/admin/log/generalLog */
export async function getLogList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/log/generalLog', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 操作日志列表 POST /api/admin/log/operationLog */
export async function getOperationLogList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/log/operationLog', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 登录日志列表 POST /api/admin/log/loginLog */
export async function getLoginLogList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/log/loginLog', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 审计日志列表 POST /api/admin/log/auditLog */
export async function getAuditLogList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/log/auditLog', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 获取常规日志搜索数据 POST /api/admin/log/getGeneralLogSearchData */
export async function getGeneralLogSearchData(options?: {
  [key: string]: any;
}) {
  return request<{
    code: number;
    message: string;
    data: {
      action_type: Array<{ label: string; value: string }>;
      source_type: Array<{ label: string; value: string }>;
    };
  }>('/api/admin/log/getGeneralLogSearchData', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 获取操作日志搜索数据 POST /api/admin/log/getOperationLogSearchData */
export async function getOperationLogSearchData(options?: {
  [key: string]: any;
}) {
  return request<{
    code: number;
    message: string;
    data: {
      module: Array<{ label: string; value: string }>;
      action: Array<{ label: string; value: string }>;
      method: Array<{ label: string; value: string }>;
      response_code: Array<{ label: string; value: number }>;
      source_type: Array<{ label: string; value: string }>;
    };
  }>('/api/admin/log/getOperationLogSearchData', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 获取登录日志搜索数据 POST /api/admin/log/getLoginLogSearchData */
export async function getLoginLogSearchData(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data: {
      browser: Array<{ label: string; value: string }>;
      operating_system: Array<{ label: string; value: string }>;
      device_type: Array<{ label: string; value: string }>;
      status: Array<{ label: string; value: number }>;
    };
  }>('/api/admin/log/getLoginLogSearchData', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 获取审计日志搜索数据 POST /api/admin/log/getAuditLogSearchData */
export async function getAuditLogSearchData(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data: {
      module: Array<{ label: string; value: string }>;
      action: Array<{ label: string; value: string }>;
      resource_type: Array<{ label: string; value: string }>;
    };
  }>('/api/admin/log/getAuditLogSearchData', {
    method: 'POST',
    ...(options || {}),
  });
}

// ========== 组织架构管理 API ==========

/** 获取组织架构类型列表 POST /api/admin/organization/getOrganizationTypeList */
export async function getOrganizationTypeList(options?: {
  [key: string]: any;
}) {
  return request<{
    code: number;
    message: string;
    data?: Array<{
      dictionary_id: number;
      dictionary_name: string;
      dictionary_value: string;
    }>;
  }>('/api/admin/organization/getOrganizationTypeList', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 新增组织架构类型 POST /api/admin/organization/addOrganizationType */
export async function addOrganizationType(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: {
      dictionary_id: string;
      dictionary_name: string;
      dictionary_value: string;
      dictionary_desc?: string;
    };
  }>('/api/admin/organization/addOrganizationType', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新组织架构类型 POST /api/admin/organization/updateOrganizationType */
export async function updateOrganizationType(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/organization/updateOrganizationType', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除组织架构类型 POST /api/admin/organization/deleteOrganizationType */
export async function deleteOrganizationType(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/organization/deleteOrganizationType', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 组织架构列表（树形） POST /api/admin/organization/index */
export async function getOrganizationList(
  params?: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any[];
  }>('/api/admin/organization/index', {
    method: 'POST',
    data: params || {},
    ...(options || {}),
  });
}

/** 获取组织架构树状Html数据 POST /api/admin/organization/getFullTreeDataForHtml */
export async function getFullTreeDataForHtml(
  params?: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: Array<{
      organization_name: string;
      organization_pid: number;
    }>;
  }>('/api/admin/organization/getFullTreeDataForHtml', {
    method: 'POST',
    data: params || {},
    ...(options || {}),
  });
}

/** 新增组织架构 POST /api/admin/organization/add */
export async function addOrganization(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/organization/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新组织架构 POST /api/admin/organization/update */
export async function updateOrganization(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/organization/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除组织架构 POST /api/admin/organization/delete */
export async function deleteOrganization(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/organization/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 移动组织架构 POST /api/admin/organization/move */
export async function moveOrganization(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/organization/move', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
