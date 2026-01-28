/* eslint-disable */
import { request } from '@umijs/max';

// ========== 系统通知管理 API ==========

/** 系统通知列表 POST /api/admin/systemNotification/index */
export async function getSystemNotificationList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/systemNotification/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 新增系统通知 POST /api/admin/systemNotification/add */
export async function addSystemNotification(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/systemNotification/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新系统通知 POST /api/admin/systemNotification/update */
export async function updateSystemNotification(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/systemNotification/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除系统通知 POST /api/admin/systemNotification/delete */
export async function deleteSystemNotification(
  body: {
    id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/systemNotification/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// ========== 站内信管理 API ==========

/** 站内信列表 POST /api/admin/message/index */
export async function getMessageList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/message/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 新增站内信 POST /api/admin/message/add */
export async function addMessage(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/message/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新站内信 POST /api/admin/message/update */
export async function updateMessage(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/message/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除站内信 POST /api/admin/message/delete */
export async function deleteMessage(
  body: {
    id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/message/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// ========== 公告管理 API ==========

/** 公告列表 POST /api/admin/announcement/index */
export async function getAnnouncementList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/announcement/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 新增公告 POST /api/admin/announcement/add */
export async function addAnnouncement(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/announcement/add', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 更新公告 POST /api/admin/announcement/update */
export async function updateAnnouncement(
  body: {
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/announcement/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 删除公告 POST /api/admin/announcement/delete */
export async function deleteAnnouncement(
  body: {
    id: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data?: any;
  }>('/api/admin/announcement/delete', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 获取公告列表搜索数据 POST /api/admin/announcement/getAnnouncementListSearchData */
export async function getAnnouncementListSearchData(options?: {
  [key: string]: any;
}) {
  return request<{
    code: number;
    message: string;
    data?: {
      position?: Array<{ label: string; value: string }>;
    };
  }>('/api/admin/announcement/getAnnouncementListSearchData', {
    method: 'POST',
    ...(options || {}),
  });
}

// ========== 通知查看记录管理 API ==========

/** 通知查看记录列表 POST /api/admin/notificationRead/index */
export async function getNotificationReadList(
  params: {
    read_type: 'system_notification' | 'message' | 'announcement';
    target_id: number;
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/notificationRead/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}
