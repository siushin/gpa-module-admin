import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  addMessage,
  deleteMessage,
  getMessageList,
  updateMessage,
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
import MessageForm from './components/MessageForm';
import NotificationDetailDrawer from './components/NotificationDetailDrawer';
import NotificationReadDrawer from './components/NotificationReadDrawer';

const Message: React.FC = () => {
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
    // 如果状态是已读，不允许编辑
    if (record.status === 1) {
      message.warning('已读的站内信不能编辑');
      return;
    }
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleDelete = async (record: any) => {
    // 如果状态是已读，不允许删除
    if (record.status === 1) {
      message.warning('已读的站内信不能删除');
      return;
    }
    try {
      const res = await deleteMessage({ id: record.id });
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
        res = await updateMessage({
          ...submitValues,
          id: editingRecord.id,
        });
      } else {
        res = await addMessage(submitValues);
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
      title: '发送者',
      dataIndex: 'sender_name',
      hideInSearch: true,
      width: 150,
      render: (_text: any, record: any) => {
        return record.sender_name || record.sender_id || '-';
      },
    },
    {
      title: '接收者',
      dataIndex: 'receiver_name',
      width: 150,
      fieldProps: {
        placeholder: '请输入接收者ID',
      },
      render: (_text: any, record: any) => {
        return record.receiver_name || record.receiver_id || '-';
      },
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
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '已读', status: 'Success' },
        0: { text: '未读', status: 'Default' },
      },
      width: 80,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '已读' : '未读'}
        </Tag>
      ),
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
        const isRead = record.status === 1; // 已读状态不能编辑和删除
        return (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => handleViewReads(record)}
            >
              查看记录
            </Button>
            {isRead ? (
              <Tooltip title="已读的站内信不能编辑">
                <Button type="link" size="small" disabled>
                  编辑
                </Button>
              </Tooltip>
            ) : (
              <Button
                type="link"
                size="small"
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
            <Popconfirm
              title="确定要删除这条数据吗？"
              onConfirm={() => handleDelete(record)}
              disabled={isRead}
            >
              <Tooltip title={isRead ? '已读的站内信不能删除' : ''}>
                <Button type="link" size="small" danger disabled={isRead}>
                  删除
                </Button>
              </Tooltip>
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
          // 处理日期范围参数 - 转换为后端期望的 date_range 格式
          if (
            requestParams.created_at &&
            Array.isArray(requestParams.created_at) &&
            requestParams.created_at.length === 2
          ) {
            requestParams.date_range = `${requestParams.created_at[0]},${requestParams.created_at[1]}`;
            delete requestParams.created_at;
          }
          const response = await getMessageList(requestParams);
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
        headerTitle="站内信列表"
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
      <MessageForm
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
        readType="message"
        targetId={viewingRecord?.id}
        title={`站内信查看记录 - ${viewingRecord?.title || ''}`}
        onClose={() => {
          setReadDrawerVisible(false);
          setViewingRecord(null);
        }}
      />
      <NotificationDetailDrawer
        visible={detailDrawerVisible}
        record={detailRecord}
        type="message"
        onClose={() => {
          setDetailDrawerVisible(false);
          setDetailRecord(null);
        }}
      />
    </PageContainer>
  );
};

export default Message;
