import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Card, Descriptions, Divider, Spin, Tabs, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  getAdminLogs,
  getAuditLogSearchData,
  getGeneralLogSearchData,
  getLoginLogSearchData,
  getOperationLogSearchData,
} from '@/modules/admin/services/system';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import { dateRangeFieldProps } from '@/modules/base/utils/datePresets';

interface AdminLogsSectionProps {
  accountId: number;
}

type LogTabKey = 'operation' | 'login' | 'audit' | 'general';

const AdminLogsSection: React.FC<AdminLogsSectionProps> = ({ accountId }) => {
  const [activeTab, setActiveTab] = useState<LogTabKey>('general');
  const actionRef = useRef<ActionType | null>(null);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // 下拉框选项数据
  const [sourceTypeOptions, setSourceTypeOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [actionOptions, setActionOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [operationActionOptions, setOperationActionOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [httpMethodOptions, setHttpMethodOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [browserOptions, setBrowserOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [osOptions, setOsOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [deviceTypeOptions, setDeviceTypeOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [auditActionOptions, setAuditActionOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [resourceTypeOptions, setResourceTypeOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [moduleOptions, setModuleOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [responseCodeOptions, setResponseCodeOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);

  // 加载下拉框选项数据
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [generalLogRes, operationLogRes, loginLogRes, auditLogRes] =
          await Promise.all([
            getGeneralLogSearchData(),
            getOperationLogSearchData(),
            getLoginLogSearchData(),
            getAuditLogSearchData(),
          ]);

        if (generalLogRes.code === 200 && generalLogRes.data) {
          const data = generalLogRes.data;
          setActionOptions(
            data.action_type?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
          setSourceTypeOptions(
            data.source_type?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
        }

        if (operationLogRes.code === 200 && operationLogRes.data) {
          const data = operationLogRes.data;
          setModuleOptions(
            data.module?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
          const actionOptions =
            data.action?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [];
          setOperationActionOptions(actionOptions);
          setAuditActionOptions(actionOptions);
          setHttpMethodOptions(
            data.method?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
          setResponseCodeOptions(
            data.response_code?.map((item: any) => ({
              label:
                typeof item === 'number'
                  ? String(item)
                  : item.label || String(item.value),
              value: typeof item === 'number' ? item : item.value,
            })) || [],
          );
          if (data.source_type && data.source_type.length > 0) {
            setSourceTypeOptions(
              data.source_type.map((item: any) => ({
                label: item.label || item.value,
                value: item.value,
              })),
            );
          }
        }

        if (loginLogRes.code === 200 && loginLogRes.data) {
          const data = loginLogRes.data;
          setBrowserOptions(
            data.browser?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
          setOsOptions(
            data.operating_system?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
          setDeviceTypeOptions(
            data.device_type?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
        }

        if (auditLogRes.code === 200 && auditLogRes.data) {
          const data = auditLogRes.data;
          if (data.module && data.module.length > 0) {
            setModuleOptions((prev) => {
              if (prev.length > 0) return prev;
              return data.module.map((item: any) => ({
                label: item.label || item.value,
                value: item.value,
              }));
            });
          }
          setResourceTypeOptions(
            data.resource_type?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
        }
      } catch (error) {
        console.error('加载下拉框选项失败:', error);
      }
    };

    loadOptions();
  }, []);

  // 常规日志列定义
  const generalLogColumns: ProColumns<any>[] = [
    {
      title: '序号',
      valueType: 'index',
      width: 80,
      hideInSearch: true,
      fixed: 'left',
    },
    {
      title: '操作人',
      dataIndex: 'username',
      hideInSearch: true,
      width: 150,
      fixed: 'left',
      render: (_, record) => record.username || '',
    },
    {
      title: '访问来源',
      dataIndex: 'source_type',
      valueType: 'select',
      valueEnum: sourceTypeOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 120,
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      valueType: 'select',
      valueEnum: actionOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 150,
    },
    {
      title: '日志内容',
      dataIndex: 'keyword',
      ellipsis: true,
      width: 300,
      formItemProps: {
        label: '关键字',
      },
      fieldProps: {
        placeholder: '日志内容、IP归属地',
      },
      render: (_, record) => record.content || '',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      width: 130,
      fixed: 'right',
      fieldProps: {
        placeholder: '请输入IP地址',
      },
    },
    {
      title: 'IP归属地',
      dataIndex: 'ip_location',
      hideInSearch: true,
      width: 150,
      fixed: 'right',
      render: (_, record) => record.ip_location || '',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateRange',
      hideInTable: false,
      width: 180,
      sorter: true,
      fixed: 'right',
      fieldProps: dateRangeFieldProps,
      render: (_, record) => {
        if (!record.created_at) return '';
        try {
          return dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.created_at;
        }
      },
    },
  ];

  // 操作日志列定义（简化版，参考 Log.tsx）
  const operationLogColumns: ProColumns<any>[] = [
    {
      title: '序号',
      valueType: 'index',
      width: 80,
      hideInSearch: true,
      fixed: 'left',
    },
    {
      title: '模块名称',
      dataIndex: 'module',
      valueType: 'select',
      valueEnum: moduleOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 100,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      valueType: 'select',
      valueEnum: operationActionOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 100,
    },
    {
      title: 'HTTP方法',
      dataIndex: 'method',
      valueType: 'select',
      valueEnum: httpMethodOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 90,
    },
    {
      title: '请求URL',
      dataIndex: 'path',
      ellipsis: true,
      width: 200,
      fieldProps: {
        placeholder: '请输入请求URL',
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      width: 110,
      fixed: 'right',
      fieldProps: {
        placeholder: '请输入IP地址',
      },
    },
    {
      title: '响应状态码',
      dataIndex: 'response_code',
      width: 120,
      valueType: 'select',
      valueEnum: responseCodeOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      render: (_, record) => {
        const code = record.response_code;
        if (code === 200) {
          return <span style={{ color: '#52c41a' }}>{code}</span>;
        }
        return <span style={{ color: '#ff4d4f' }}>{code}</span>;
      },
    },
    {
      title: '操作时间',
      dataIndex: 'operated_at',
      valueType: 'dateRange',
      hideInTable: false,
      width: 180,
      sorter: true,
      fixed: 'right',
      fieldProps: dateRangeFieldProps,
      render: (_, record) => {
        if (!record.operated_at) return '';
        try {
          return dayjs(record.operated_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.operated_at;
        }
      },
    },
  ];

  // 审计日志列定义（简化版）
  const auditLogColumns: ProColumns<any>[] = [
    {
      title: '序号',
      valueType: 'index',
      width: 80,
      hideInSearch: true,
      fixed: 'left',
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      width: 100,
      valueType: 'text',
      fixed: 'left',
      render: (_, record) => {
        if (record.resource_id === null || record.resource_id === undefined) {
          return '';
        }
        return String(record.resource_id);
      },
    },
    {
      title: '模块名称',
      dataIndex: 'module',
      valueType: 'select',
      valueEnum: moduleOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 120,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      valueType: 'select',
      valueEnum: auditActionOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 150,
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      valueType: 'select',
      valueEnum: resourceTypeOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 120,
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      ellipsis: true,
      hideInSearch: true,
      width: 200,
      render: (_, record) => record.description || '',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      width: 130,
      fixed: 'right',
      fieldProps: {
        placeholder: '请输入IP地址',
      },
    },
    {
      title: '审计时间',
      dataIndex: 'audited_at',
      valueType: 'dateRange',
      hideInTable: false,
      width: 180,
      sorter: true,
      fixed: 'right',
      fieldProps: dateRangeFieldProps,
      render: (_, record) => {
        if (!record.audited_at) return '';
        try {
          return dayjs(record.audited_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.audited_at;
        }
      },
    },
  ];

  // 登录日志列定义（简化版）
  const loginLogColumns: ProColumns<any>[] = [
    {
      title: '序号',
      valueType: 'index',
      width: 80,
      hideInSearch: true,
      fixed: 'left',
    },
    {
      title: '登录状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '成功', status: 'Success' },
        0: { text: '失败', status: 'Error' },
      },
      width: 100,
      fixed: 'left',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      width: 130,
      fixed: 'right',
      fieldProps: {
        placeholder: '请输入IP地址',
      },
    },
    {
      title: 'IP归属地',
      dataIndex: 'ip_location',
      hideInSearch: true,
      width: 150,
      fixed: 'right',
      render: (_, record) => record.ip_location || '',
    },
    {
      title: '登录时间',
      dataIndex: 'login_at',
      valueType: 'dateRange',
      hideInTable: false,
      width: 180,
      sorter: true,
      fixed: 'right',
      fieldProps: dateRangeFieldProps,
      render: (_, record) => {
        if (!record.login_at) return '';
        try {
          return dayjs(record.login_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.login_at;
        }
      },
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      valueType: 'select',
      valueEnum: browserOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 120,
    },
    {
      title: '操作系统',
      dataIndex: 'operating_system',
      valueType: 'select',
      valueEnum: osOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 120,
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      valueType: 'select',
      valueEnum: deviceTypeOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      width: 120,
    },
  ];

  // 根据Tab类型获取对应的列和请求函数
  const getConfigByTab = (tab: LogTabKey) => {
    const baseRequest = async (params: any) => {
      const requestParams: any = {
        ...params,
        account_id: accountId,
        log_type: tab,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
      };

      // 处理时间范围 - 转换为字符串格式
      const dateFieldMap: Record<LogTabKey, string> = {
        general: 'created_at',
        operation: 'operated_at',
        audit: 'audited_at',
        login: 'login_at',
      };
      const dateField = dateFieldMap[tab];
      if (
        params[dateField] &&
        Array.isArray(params[dateField]) &&
        params[dateField].length === 2
      ) {
        requestParams.date_range = `${params[dateField][0]},${params[dateField][1]}`;
        delete requestParams[dateField];
      }

      const response = await getAdminLogs(requestParams);
      if (response.code === 200) {
        return {
          data: response.data?.data || [],
          success: true,
          total: response.data?.page?.total || 0,
        };
      }
      return {
        data: [],
        success: false,
        total: 0,
      };
    };

    switch (tab) {
      case 'general':
        return {
          columns: generalLogColumns,
          rowKey: 'log_id',
          request: baseRequest,
        };
      case 'operation':
        return {
          columns: operationLogColumns,
          rowKey: 'id',
          request: baseRequest,
        };
      case 'audit':
        return {
          columns: auditLogColumns,
          rowKey: 'id',
          request: baseRequest,
        };
      case 'login':
        return {
          columns: loginLogColumns,
          rowKey: 'id',
          request: baseRequest,
        };
      default:
        return {
          columns: [],
          rowKey: 'id',
          request: async () => ({ data: [], success: false, total: 0 }),
        };
    }
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as LogTabKey);
          setTimeout(() => {
            actionRef.current?.reload();
          }, 0);
        }}
        items={[
          {
            key: 'general',
            label: '常规日志',
            children: (() => {
              const config = getConfigByTab('general');
              return (
                <ProTable<any>
                  key="general-log-table"
                  actionRef={activeTab === 'general' ? actionRef : undefined}
                  rowKey={config.rowKey}
                  size={TABLE_SIZE}
                  search={{
                    labelWidth: 120,
                    defaultCollapsed: false,
                  }}
                  request={config.request}
                  columns={config.columns}
                  pagination={{
                    ...DEFAULT_PAGINATION,
                    pageSize,
                    onShowSizeChange: (_current, size) => {
                      setPageSize(size);
                    },
                  }}
                  dateFormatter="string"
                  headerTitle="常规日志列表"
                  scroll={{ x: 'max-content' }}
                />
              );
            })(),
          },
          {
            key: 'operation',
            label: '操作日志',
            children: (() => {
              const config = getConfigByTab('operation');
              return (
                <ProTable<any>
                  key="operation-log-table"
                  actionRef={activeTab === 'operation' ? actionRef : undefined}
                  rowKey={config.rowKey}
                  size={TABLE_SIZE}
                  search={{
                    labelWidth: 120,
                    defaultCollapsed: false,
                  }}
                  request={config.request}
                  columns={config.columns}
                  pagination={{
                    ...DEFAULT_PAGINATION,
                    pageSize,
                    onShowSizeChange: (_current, size) => {
                      setPageSize(size);
                    },
                  }}
                  dateFormatter="string"
                  headerTitle="操作日志列表"
                  scroll={{ x: 'max-content' }}
                />
              );
            })(),
          },
          {
            key: 'audit',
            label: '审计日志',
            children: (() => {
              const config = getConfigByTab('audit');
              return (
                <ProTable<any>
                  key="audit-log-table"
                  actionRef={activeTab === 'audit' ? actionRef : undefined}
                  rowKey={config.rowKey}
                  size={TABLE_SIZE}
                  search={{
                    labelWidth: 120,
                    defaultCollapsed: false,
                  }}
                  request={config.request}
                  columns={config.columns}
                  pagination={{
                    ...DEFAULT_PAGINATION,
                    pageSize,
                    onShowSizeChange: (_current, size) => {
                      setPageSize(size);
                    },
                  }}
                  dateFormatter="string"
                  headerTitle="审计日志列表"
                  scroll={{ x: 'max-content' }}
                />
              );
            })(),
          },
          {
            key: 'login',
            label: '登录日志',
            children: (() => {
              const config = getConfigByTab('login');
              return (
                <ProTable<any>
                  key="login-log-table"
                  actionRef={activeTab === 'login' ? actionRef : undefined}
                  rowKey={config.rowKey}
                  size={TABLE_SIZE}
                  search={{
                    labelWidth: 120,
                    defaultCollapsed: false,
                  }}
                  request={config.request}
                  columns={config.columns}
                  pagination={{
                    ...DEFAULT_PAGINATION,
                    pageSize,
                    onShowSizeChange: (_current, size) => {
                      setPageSize(size);
                    },
                  }}
                  dateFormatter="string"
                  headerTitle="登录日志列表"
                  scroll={{ x: 'max-content' }}
                />
              );
            })(),
          },
        ]}
      />
    </div>
  );
};

export default AdminLogsSection;
