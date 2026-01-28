import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  addSystemNotification,
  deleteSystemNotification,
  getSystemNotificationList,
  updateSystemNotification,
} from '@/modules/admin/services/notification';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  PLATFORM_MAP,
  PLATFORM_SORT_ORDER,
  processFormValues,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import { dateRangeFieldProps } from '@/modules/base/utils/datePresets';
import NotificationDetailDrawer from './components/NotificationDetailDrawer';
import NotificationReadDrawer from './components/NotificationReadDrawer';
import SystemNotificationForm from './components/SystemNotificationForm';

const SystemNotification: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [readDrawerVisible, setReadDrawerVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);

  const handleAdd = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    // 如果状态是禁用，不允许编辑
    if (record.status === 0) {
      message.warning('禁用的通知不能编辑，请先启用');
      return;
    }
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleDelete = async (record: any) => {
    // 如果状态是禁用，不允许删除
    if (record.status === 0) {
      message.warning('禁用的通知不能删除，请先启用');
      return;
    }
    try {
      const res = await deleteSystemNotification({ id: record.id });
      if (res.code === 200) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (_error) {
      message.error('删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      // 将 undefined 转换为 null，确保清空的下拉框值也能传递到后端
      const processedValues = processFormValues(values);
      // 处理目标平台：单选框直接使用值
      const submitValues = {
        ...processedValues,
        target_platform: processedValues.target_platform || 'all',
      };

      let res: { code: number; message: string; data?: any };
      if (editingRecord) {
        res = await updateSystemNotification({
          ...submitValues,
          id: editingRecord.id,
        });
      } else {
        res = await addSystemNotification(submitValues);
      }
      if (res.code === 200) {
        message.success(editingRecord ? '更新成功' : '新增成功');
        setFormVisible(false);
        setEditingRecord(null);
        actionRef.current?.reload();
      } else {
        message.error(res.message || (editingRecord ? '更新失败' : '新增失败'));
      }
    } catch (_error) {
      message.error(editingRecord ? '更新失败' : '新增失败');
    }
  };

  const handleViewReads = (record: any) => {
    setViewingRecord(record);
    setReadDrawerVisible(true);
  };

  const handleViewDetail = (record: any) => {
    setDetailRecord(record);
    setDetailDrawerVisible(true);
  };

  const columns: ProColumns<any>[] = [
    {
      title: '序号',
      valueType: 'index',
      width: 80,
      hideInSearch: true,
      fixed: 'left',
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 150,
      fixed: 'left',
      fieldProps: {
        placeholder: '请输入标题',
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      hideInSearch: true,
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (text: any, record: any) => (
        <span
          style={{
            cursor: 'pointer',
            color: '#1890ff',
            display: 'block',
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          onClick={() => handleViewDetail(record)}
          title={text}
        >
          {text}
        </span>
      ),
    },
    {
      title: '目标平台',
      dataIndex: 'target_platform',
      width: 150,
      valueType: 'select',
      valueEnum: {
        all: { text: '全平台' },
        user: { text: '用户端' },
        admin: { text: '管理端' },
        miniapp: { text: '小程序' },
      },
      fieldProps: {
        mode: 'multiple',
        placeholder: '请选择目标平台',
      },
      render: (_, record) => {
        if (!record.target_platform) return '';
        const platforms = record.target_platform
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);
        if (platforms.length === 0) return '';

        // 排序并转换为中文名称
        const sortedPlatforms = platforms
          .sort((a: string, b: string) => {
            const orderA = PLATFORM_SORT_ORDER[a] ?? 999;
            const orderB = PLATFORM_SORT_ORDER[b] ?? 999;
            return orderA - orderB;
          })
          .map((p: string) => PLATFORM_MAP[p] || p);

        return sortedPlatforms.join('、');
      },
    },
    {
      title: '通知类型',
      dataIndex: 'type',
      width: 120,
      valueType: 'select',
      valueEnum: {
        system: { text: '系统通知' },
        business: { text: '业务通知' },
        activity: { text: '活动通知' },
        other: { text: '其他' },
      },
      fieldProps: {
        mode: 'multiple',
        placeholder: '请选择通知类型',
      },
      render: (_, record) => {
        if (!record.type) return '';
        const typeMap: Record<string, { text: string; color: string }> = {
          system: { text: '系统通知', color: 'blue' },
          business: { text: '业务通知', color: 'green' },
          activity: { text: '活动通知', color: 'orange' },
          other: { text: '其他', color: 'default' },
        };
        const typeInfo = typeMap[record.type] || {
          text: record.type,
          color: 'default',
        };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
      width: 80,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'error'}>
          {record.status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '生效时间',
      dataIndex: 'effective_time',
      hideInSearch: false,
      width: 200,
      valueType: 'select',
      valueEnum: {
        not_started: { text: '未开始' },
        in_progress: { text: '进行中' },
        ended: { text: '已结束' },
        effective: { text: '已生效' },
      },
      fieldProps: {
        mode: 'multiple',
        placeholder: '请选择生效状态',
      },
      render: (_, record) => {
        const now = dayjs();
        let startTime = null;
        let endTime = null;
        let status = '';
        let statusColor = '';
        let timeText = '';
        let displayText = '';

        if (record.start_time) {
          startTime = dayjs(record.start_time);
        }
        if (record.end_time) {
          endTime = dayjs(record.end_time);
        }

        // 如果都没有开始和结束时间，使用创建时间
        if (!startTime && !endTime) {
          if (!record.created_at) return '';
          const createdTime = dayjs(record.created_at);
          timeText = createdTime.format('YYYY-MM-DD HH:mm:ss');
          displayText = createdTime.format('YYYY-MM-DD');
          status = '已生效';
          statusColor = 'blue';
        } else if (startTime && endTime) {
          // 有开始和结束时间
          const startStr = startTime.format('YYYY-MM-DD HH:mm:ss');
          const endStr = endTime.format('YYYY-MM-DD HH:mm:ss');
          timeText = `${startStr} ~ ${endStr}`;
          displayText = `${startTime.format('YYYY-MM-DD')} ~ ${endTime.format('YYYY-MM-DD')}`;

          if (now.isBefore(startTime)) {
            status = '未开始';
            statusColor = 'orange';
          } else if (now.isAfter(endTime)) {
            status = '已结束';
            statusColor = 'red';
          } else {
            status = '进行中';
            statusColor = 'green';
          }
        } else if (startTime) {
          // 只有开始时间
          const startStr = startTime.format('YYYY-MM-DD HH:mm:ss');
          timeText = `${startStr} ~ 长期有效`;
          displayText = `${startTime.format('YYYY-MM-DD')} ~ 长期有效`;
          if (now.isBefore(startTime)) {
            status = '未开始';
            statusColor = 'orange';
          } else {
            status = '进行中';
            statusColor = 'green';
          }
        } else if (endTime) {
          // 只有结束时间
          const endStr = endTime.format('YYYY-MM-DD HH:mm:ss');
          timeText = `立即生效 ~ ${endStr}`;
          displayText = `立即生效 ~ ${endTime.format('YYYY-MM-DD')}`;
          if (now.isAfter(endTime)) {
            status = '已结束';
            statusColor = 'red';
          } else {
            status = '进行中';
            statusColor = 'green';
          }
        }

        return (
          <Space size={8} style={{ whiteSpace: 'nowrap' }}>
            <Tooltip title={timeText}>
              <span style={{ cursor: 'pointer' }}>{displayText}</span>
            </Tooltip>
            <Tag color={statusColor}>{status}</Tag>
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateRange',
      hideInTable: false,
      width: 180,
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
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const isDisabled = record.status === 0; // 禁用状态不能编辑和删除
        return (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => handleViewReads(record)}
            >
              查看记录
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => handleEdit(record)}
              disabled={isDisabled}
              title={isDisabled ? '禁用的通知不能编辑' : ''}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这条数据吗？"
              onConfirm={() => handleDelete(record)}
              disabled={isDisabled}
            >
              <Button
                type="link"
                size="small"
                danger
                disabled={isDisabled}
                title={isDisabled ? '禁用的通知不能删除' : ''}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<any>
        actionRef={actionRef}
        rowKey="id"
        size={TABLE_SIZE}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        request={async (params) => {
          const requestParams: any = {
            ...params,
            pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
          };
          // 将目标平台数组转换为逗号分隔的字符串
          if (Array.isArray(requestParams.target_platform)) {
            requestParams.target_platform =
              requestParams.target_platform.join(',');
          }
          // 将通知类型数组转换为逗号分隔的字符串
          if (Array.isArray(requestParams.type)) {
            requestParams.type = requestParams.type.join(',');
          }
          // 将生效状态数组转换为逗号分隔的字符串
          if (Array.isArray(requestParams.effective_time)) {
            requestParams.effective_time =
              requestParams.effective_time.join(',');
          }
          // 处理日期范围参数 - 转换为后端期望的 date_range 格式
          if (
            requestParams.created_at &&
            Array.isArray(requestParams.created_at) &&
            requestParams.created_at.length === 2
          ) {
            requestParams.date_range = `${requestParams.created_at[0]},${requestParams.created_at[1]}`;
            delete requestParams.created_at;
          }
          const response = await getSystemNotificationList(requestParams);
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
        }}
        columns={columns}
        pagination={{
          ...DEFAULT_PAGINATION,
          pageSize,
          onShowSizeChange: (_current, size) => {
            setPageSize(size);
          },
        }}
        dateFormatter="string"
        headerTitle="系统通知列表"
        scroll={{ x: 'max-content' }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增
          </Button>,
        ]}
      />
      <SystemNotificationForm
        visible={formVisible}
        editingRecord={editingRecord}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSubmit={handleFormSubmit}
      />
      <NotificationReadDrawer
        visible={readDrawerVisible}
        readType="system_notification"
        targetId={viewingRecord?.id}
        title={`系统通知查看记录 - ${viewingRecord?.title || ''}`}
        onClose={() => {
          setReadDrawerVisible(false);
          setViewingRecord(null);
        }}
      />
      <NotificationDetailDrawer
        visible={detailDrawerVisible}
        record={detailRecord}
        type="system_notification"
        onClose={() => {
          setDetailDrawerVisible(false);
          setDetailRecord(null);
        }}
      />
    </PageContainer>
  );
};

export default SystemNotification;
