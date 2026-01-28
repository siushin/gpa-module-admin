import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { MODAL_WIDTH } from '@/modules/base/utils/constants';

interface DepartmentDetailProps {
  visible: boolean;
  record: any;
  onClose: () => void;
  companyOptions?: Array<{ label: string; value: number }>;
}

const DepartmentDetail: React.FC<DepartmentDetailProps> = ({
  visible,
  record,
  onClose,
  companyOptions = [],
}) => {
  if (!record) return null;

  const company = companyOptions.find((opt) => opt.value === record.company_id);

  return (
    <Drawer
      width={MODAL_WIDTH.LARGE}
      open={visible}
      onClose={onClose}
      title="部门详情"
      destroyOnClose
    >
      <ProDescriptions
        column={2}
        dataSource={record}
        columns={[
          {
            title: '部门ID',
            dataIndex: 'department_id',
            copyable: true,
          },
          {
            title: '所属公司',
            dataIndex: 'company_name',
            render: () => {
              const companyName = company?.label || record.company_name || '';
              return companyName ? (
                <Typography.Text copyable={{ tooltips: false }}>
                  {companyName}
                </Typography.Text>
              ) : (
                ''
              );
            },
          },
          {
            title: '部门名称',
            dataIndex: 'department_name',
            ellipsis: true,
            copyable: true,
          },
          {
            title: '部门编码',
            dataIndex: 'department_code',
            copyable: true,
            render: (text) => text || '',
          },
          {
            title: '上级部门',
            dataIndex: 'parent_id',
            render: (_, record) => {
              if (!record.parent_id || record.parent_id === 0) {
                return <Tag color="default">顶级部门</Tag>;
              }
              return record.parent_department_name || '';
            },
          },
          {
            title: '部门负责人',
            dataIndex: 'manager_id',
            render: (_, record) => {
              if (!record.manager_id) return '';
              if (record.manager_username) {
                const displayName =
                  record.manager_name || record.manager_username;
                return `${displayName} (${record.manager_username})`;
              }
              return '';
            },
          },
          {
            title: '部门描述',
            dataIndex: 'description',
            span: 2,
            valueType: 'textarea',
            render: (text) => text || '',
          },
          {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
              1: { text: '正常', status: 'Success' },
              0: { text: '禁用', status: 'Error' },
            },
            render: (_, record) => (
              <Tag color={record.status === 1 ? 'success' : 'error'}>
                {record.status === 1 ? '正常' : '禁用'}
              </Tag>
            ),
          },
          {
            title: '排序',
            dataIndex: 'sort',
            render: (text) => text ?? 0,
          },
          {
            title: '创建时间',
            dataIndex: 'created_at',
            valueType: 'dateTime',
            render: (_, record) => {
              if (!record.created_at) return '';
              try {
                return dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss');
              } catch {
                return record.created_at;
              }
            },
          },
          {
            title: '更新时间',
            dataIndex: 'updated_at',
            valueType: 'dateTime',
            render: (_, record) => {
              if (!record.updated_at) return '';
              try {
                return dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss');
              } catch {
                return record.updated_at;
              }
            },
          },
        ]}
      />
    </Drawer>
  );
};

export default DepartmentDetail;
