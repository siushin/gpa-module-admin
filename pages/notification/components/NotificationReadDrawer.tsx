import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Drawer } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { getNotificationReadList } from '@/modules/admin/services/notification';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import { dateRangeFieldProps } from '@/modules/base/utils/datePresets';

interface NotificationReadDrawerProps {
  visible: boolean;
  readType: 'system_notification' | 'message' | 'announcement';
  targetId: number;
  title?: string;
  onClose: () => void;
}

const NotificationReadDrawer: React.FC<NotificationReadDrawerProps> = ({
  visible,
  readType,
  targetId,
  title,
  onClose,
}) => {
  const actionRef = useRef<ActionType>(null);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const getReadTypeText = () => {
    const map: Record<string, string> = {
      system_notification: '系统通知',
      message: '站内信',
      announcement: '公告',
    };
    return map[readType] || '通知';
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
      title: '查看人账号ID',
      dataIndex: 'account_id',
      width: 150,
      fieldProps: {
        placeholder: '请输入账号ID',
      },
    },
    {
      title: '查看人用户名',
      dataIndex: 'account_username',
      hideInSearch: true,
      width: 150,
      render: (_, record) => record.account?.username || '',
    },
    {
      title: '查看人姓名',
      dataIndex: 'account_nickname',
      hideInSearch: true,
      width: 150,
      render: (_, record) => record.account?.profile?.nickname || '',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      width: 150,
      fieldProps: {
        placeholder: '请输入IP地址',
      },
    },
    {
      title: 'IP归属地',
      dataIndex: 'ip_location',
      width: 150,
      fieldProps: {
        placeholder: '请输入IP归属地',
      },
    },
    {
      title: '查看时间',
      dataIndex: 'read_at',
      valueType: 'dateRange',
      hideInTable: false,
      width: 180,
      fieldProps: dateRangeFieldProps,
      render: (_, record) => {
        if (!record.read_at) return '';
        try {
          return dayjs(record.read_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.read_at;
        }
      },
    },
  ];

  return (
    <Drawer
      title={title || `${getReadTypeText()}查看记录`}
      width={1200}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
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
            read_type: readType,
            target_id: targetId,
            pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
          };
          const response = await getNotificationReadList(requestParams);
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
        headerTitle="查看记录列表"
        scroll={{ x: 'max-content' }}
        toolBarRender={false}
      />
    </Drawer>
  );
};

export default NotificationReadDrawer;
