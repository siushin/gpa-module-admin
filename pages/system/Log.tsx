import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tabs, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  getAuditLogList,
  getAuditLogSearchData,
  getGeneralLogSearchData,
  getLoginLogList,
  getLoginLogSearchData,
  getLogList,
  getOperationLogList,
  getOperationLogSearchData,
} from '@/modules/admin/services/system';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import { dateRangeFieldProps } from '@/modules/base/utils/datePresets';

type LogTabKey = 'operation' | 'login' | 'audit' | 'general';

const Log: React.FC = () => {
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
        // 并行加载所有日志类型的搜索数据
        const [generalLogRes, operationLogRes, loginLogRes, auditLogRes] =
          await Promise.all([
            getGeneralLogSearchData(),
            getOperationLogSearchData(),
            getLoginLogSearchData(),
            getAuditLogSearchData(),
          ]);

        // 常规日志搜索数据
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

        // 操作日志搜索数据
        if (operationLogRes.code === 200 && operationLogRes.data) {
          const data = operationLogRes.data;
          setModuleOptions(
            data.module?.map((item: any) => ({
              label: item.label || item.value,
              value: item.value,
            })) || [],
          );
          // 操作类型（操作日志和审计日志共用）
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
          // 操作日志的访问来源也设置到 sourceTypeOptions（如果常规日志没有设置的话）
          if (data.source_type && data.source_type.length > 0) {
            setSourceTypeOptions(
              data.source_type.map((item: any) => ({
                label: item.label || item.value,
                value: item.value,
              })),
            );
          }
        }

        // 登录日志搜索数据
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

        // 审计日志搜索数据
        if (auditLogRes.code === 200 && auditLogRes.data) {
          const data = auditLogRes.data;
          // 审计日志的模块名称（如果操作日志没有设置的话，使用审计日志的）
          if (data.module && data.module.length > 0) {
            setModuleOptions((prev) => {
              // 如果已经有数据了，就不覆盖
              if (prev.length > 0) return prev;
              return data.module.map((item: any) => ({
                label: item.label || item.value,
                value: item.value,
              }));
            });
          }
          // 审计日志的操作类型与操作日志相同，已在上面从操作日志接口设置
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
        // 尝试格式化日期时间
        try {
          return dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.created_at;
        }
      },
    },
  ];

  // 操作日志列定义
  const operationLogColumns: ProColumns<any>[] = [
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
      title: '请求参数',
      dataIndex: 'params',
      hideInSearch: true,
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => {
        if (!record.params) return '';
        let displayText = '';
        let tooltipText = '';
        try {
          // 如果params是字符串，先尝试解析
          const paramsData =
            typeof record.params === 'string'
              ? JSON.parse(record.params)
              : record.params;
          // 格式化JSON用于Tooltip显示
          tooltipText = JSON.stringify(paramsData, null, 2);
          // 单行JSON用于单元格显示
          displayText = JSON.stringify(paramsData);
        } catch (_e) {
          // 如果解析失败，直接返回原始值
          tooltipText =
            typeof record.params === 'string'
              ? record.params
              : JSON.stringify(record.params);
          displayText = tooltipText;
        }
        return (
          <Tooltip
            title={
              <pre
                style={{ margin: 0, whiteSpace: 'pre-wrap', maxWidth: '500px' }}
              >
                {tooltipText}
              </pre>
            }
            mouseEnterDelay={0.1}
            styles={{ root: { maxWidth: '600px' } }}
          >
            <div
              style={{
                width: '200px',
                maxWidth: '200px',
                minWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayText}
            </div>
          </Tooltip>
        );
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
      title: 'IP归属地',
      dataIndex: 'ip_location',
      hideInSearch: true,
      width: 120,
      fixed: 'right',
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
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '请求参数、IP归属地、User-Agent',
      },
    },
    {
      title: '执行耗时(ms)',
      dataIndex: 'execution_time',
      hideInSearch: true,
      width: 120,
      sorter: true,
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
      title: 'User-Agent',
      dataIndex: 'user_agent',
      hideInSearch: true,
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => {
        if (!record.user_agent) return '';
        return (
          <Tooltip
            title={
              <pre
                style={{ margin: 0, whiteSpace: 'pre-wrap', maxWidth: '500px' }}
              >
                {record.user_agent}
              </pre>
            }
            mouseEnterDelay={0.1}
            styles={{ root: { maxWidth: '600px' } }}
          >
            <div
              style={{
                width: '250px',
                maxWidth: '250px',
                minWidth: '250px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.user_agent}
            </div>
          </Tooltip>
        );
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
        // 尝试格式化日期时间
        try {
          return dayjs(record.operated_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.operated_at;
        }
      },
    },
  ];

  // 审计日志列定义
  const auditLogColumns: ProColumns<any>[] = [
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
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '变更前数据、变更后数据、操作描述',
      },
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
      title: '变更前数据',
      dataIndex: 'before_data',
      hideInSearch: true,
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => {
        if (!record.before_data) return '';
        let displayText = '';
        let tooltipText = '';
        try {
          // 如果before_data是字符串，先尝试解析
          const beforeData =
            typeof record.before_data === 'string'
              ? JSON.parse(record.before_data)
              : record.before_data;
          // 格式化JSON用于Tooltip显示
          tooltipText = JSON.stringify(beforeData, null, 2);
          // 单行JSON用于单元格显示
          displayText = JSON.stringify(beforeData);
        } catch (_e) {
          // 如果解析失败，直接返回原始值
          tooltipText =
            typeof record.before_data === 'string'
              ? record.before_data
              : JSON.stringify(record.before_data);
          displayText = tooltipText;
        }
        return (
          <Tooltip
            title={
              <pre
                style={{ margin: 0, whiteSpace: 'pre-wrap', maxWidth: '500px' }}
              >
                {tooltipText}
              </pre>
            }
            mouseEnterDelay={0.1}
            styles={{ root: { maxWidth: '600px' } }}
          >
            <div
              style={{
                width: '200px',
                maxWidth: '200px',
                minWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayText}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '变更后数据',
      dataIndex: 'after_data',
      hideInSearch: true,
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => {
        if (!record.after_data) return '';
        let displayText = '';
        let tooltipText = '';
        try {
          // 如果after_data是字符串，先尝试解析
          const afterData =
            typeof record.after_data === 'string'
              ? JSON.parse(record.after_data)
              : record.after_data;
          // 格式化JSON用于Tooltip显示
          tooltipText = JSON.stringify(afterData, null, 2);
          // 单行JSON用于单元格显示
          displayText = JSON.stringify(afterData);
        } catch (_e) {
          // 如果解析失败，直接返回原始值
          tooltipText =
            typeof record.after_data === 'string'
              ? record.after_data
              : JSON.stringify(record.after_data);
          displayText = tooltipText;
        }
        return (
          <Tooltip
            title={
              <pre
                style={{ margin: 0, whiteSpace: 'pre-wrap', maxWidth: '500px' }}
              >
                {tooltipText}
              </pre>
            }
            mouseEnterDelay={0.1}
            styles={{ root: { maxWidth: '600px' } }}
          >
            <div
              style={{
                width: '200px',
                maxWidth: '200px',
                minWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayText}
            </div>
          </Tooltip>
        );
      },
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
      title: 'User-Agent',
      dataIndex: 'user_agent',
      hideInSearch: true,
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => {
        if (!record.user_agent) return '';
        return (
          <Tooltip
            title={
              <pre
                style={{ margin: 0, whiteSpace: 'pre-wrap', maxWidth: '500px' }}
              >
                {record.user_agent}
              </pre>
            }
            mouseEnterDelay={0.1}
            styles={{ root: { maxWidth: '600px' } }}
          >
            <div
              style={{
                width: '250px',
                maxWidth: '250px',
                minWidth: '250px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.user_agent}
            </div>
          </Tooltip>
        );
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
        // 尝试格式化日期时间
        try {
          return dayjs(record.audited_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.audited_at;
        }
      },
    },
  ];

  // 登录日志列定义
  const loginLogColumns: ProColumns<any>[] = [
    {
      title: '序号',
      valueType: 'index',
      width: 80,
      hideInSearch: true,
      fixed: 'left',
    },
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '用户名、IP归属地、登录信息',
      },
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 150,
      fixed: 'left',
      hideInSearch: true,
      render: (_, record) => record.username || '',
    },
    {
      title: '账号',
      dataIndex: 'account_username',
      hideInSearch: true,
      width: 150,
      fixed: 'left',
      render: (_, record) => record.account_username || '',
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
        // 尝试格式化日期时间
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
      title: '浏览器版本',
      dataIndex: 'browser_version',
      hideInSearch: true,
      width: 120,
      render: (_, record) => record.browser_version || '',
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
    {
      title: 'User-Agent',
      dataIndex: 'user_agent',
      hideInSearch: true,
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => {
        if (!record.user_agent) return '';
        return (
          <Tooltip
            title={
              <pre
                style={{ margin: 0, whiteSpace: 'pre-wrap', maxWidth: '500px' }}
              >
                {record.user_agent}
              </pre>
            }
            mouseEnterDelay={0.1}
            styles={{ root: { maxWidth: '600px' } }}
          >
            <div
              style={{
                width: '250px',
                maxWidth: '250px',
                minWidth: '250px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.user_agent}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '登录信息',
      dataIndex: 'message',
      ellipsis: true,
      hideInSearch: true,
      width: 200,
      render: (_, record) => record.message || '',
    },
  ];

  // 根据Tab类型获取对应的列和请求函数
  const getConfigByTab = (tab: LogTabKey) => {
    switch (tab) {
      case 'general':
        return {
          columns: generalLogColumns,
          rowKey: 'log_id',
          request: async (params: any) => {
            // 处理时间范围参数
            const requestParams: any = {
              ...params,
              // 确保 pageSize 有值，优先使用 params.pageSize，否则使用默认值
              pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
            };

            // 处理时间范围 - 转换为字符串格式
            if (
              params.created_at &&
              Array.isArray(params.created_at) &&
              params.created_at.length === 2
            ) {
              requestParams.date_range = `${params.created_at[0]},${params.created_at[1]}`;
              delete requestParams.created_at;
            }

            const response = await getLogList(requestParams);
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
          },
        };
      case 'operation':
        return {
          columns: operationLogColumns,
          rowKey: 'id',
          request: async (params: any) => {
            // 处理时间范围参数
            const requestParams: any = {
              ...params,
              // 确保 pageSize 有值，优先使用 params.pageSize，否则使用默认值
              pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
            };

            // 处理时间范围 - 转换为字符串格式
            if (
              params.operated_at &&
              Array.isArray(params.operated_at) &&
              params.operated_at.length === 2
            ) {
              requestParams.date_range = `${params.operated_at[0]},${params.operated_at[1]}`;
              delete requestParams.operated_at;
            }

            const response = await getOperationLogList(requestParams);
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
          },
        };
      case 'audit':
        return {
          columns: auditLogColumns,
          rowKey: 'id',
          request: async (params: any) => {
            // 处理时间范围参数
            const requestParams: any = {
              ...params,
              // 确保 pageSize 有值，优先使用 params.pageSize，否则使用默认值
              pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
            };

            // 处理时间范围 - 转换为字符串格式
            if (
              params.audited_at &&
              Array.isArray(params.audited_at) &&
              params.audited_at.length === 2
            ) {
              requestParams.date_range = `${params.audited_at[0]},${params.audited_at[1]}`;
              delete requestParams.audited_at;
            }

            const response = await getAuditLogList(requestParams);
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
          },
        };
      case 'login':
        return {
          columns: loginLogColumns,
          rowKey: 'id',
          request: async (params: any) => {
            // 处理时间范围参数
            const requestParams: any = {
              ...params,
              // 确保 pageSize 有值，优先使用 params.pageSize，否则使用默认值
              pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
            };

            // 处理时间范围 - 转换为字符串格式
            if (
              params.login_at &&
              Array.isArray(params.login_at) &&
              params.login_at.length === 2
            ) {
              requestParams.date_range = `${params.login_at[0]},${params.login_at[1]}`;
              delete requestParams.login_at;
            }

            const response = await getLoginLogList(requestParams);
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
          },
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
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as LogTabKey);
          // 延迟调用 reload，确保新的 Tab 已经渲染完成
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
    </PageContainer>
  );
};

export default Log;
