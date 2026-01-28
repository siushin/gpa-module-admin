/* eslint-disable */
import { request } from '@umijs/max';

/** 短信发送记录列表 POST /api/admin/sms/log/index */
export async function getSmsLogList(
  params: {
    current?: number;
    pageSize?: number;
    [key: string]: any;
  },
  options?: { [key: string]: any },
) {
  return request<API.PageResponse>('/api/admin/sms/log/index', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 获取短信发送记录搜索数据 POST /api/admin/sms/log/getSmsLogSearchData */
export async function getSmsLogSearchData(options?: { [key: string]: any }) {
  return request<{
    code: number;
    message: string;
    data: {
      sms_type: Array<{ label: string; value: string }>;
      source_type: Array<{ label: string; value: string }>;
      status: Array<{ label: string; value: number }>;
    };
  }>('/api/admin/sms/log/getSmsLogSearchData', {
    method: 'POST',
    ...(options || {}),
  });
}
