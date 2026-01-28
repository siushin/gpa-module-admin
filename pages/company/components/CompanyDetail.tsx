import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Tag } from 'antd';
import React from 'react';
import { MODAL_WIDTH } from '@/modules/base/utils/constants';

interface CompanyDetailProps {
  visible: boolean;
  record: any;
  onClose: () => void;
}

const CompanyDetail: React.FC<CompanyDetailProps> = ({
  visible,
  record,
  onClose,
}) => {
  if (!record) return null;

  return (
    <Drawer
      width={MODAL_WIDTH.LARGE}
      open={visible}
      onClose={onClose}
      title="公司详情"
      destroyOnClose
    >
      <ProDescriptions
        column={2}
        dataSource={record}
        columns={[
          {
            title: '公司ID',
            dataIndex: 'company_id',
            copyable: true,
          },
          {
            title: '公司名称',
            dataIndex: 'company_name',
            ellipsis: true,
            copyable: true,
          },
          {
            title: '公司编码',
            dataIndex: 'company_code',
            copyable: true,
          },
          {
            title: '统一社会信用代码',
            dataIndex: 'company_credit_code',
            copyable: true,
          },
          {
            title: '法人代表',
            dataIndex: 'legal_person',
            render: (text) => text || '',
          },
          {
            title: '联系电话',
            dataIndex: 'contact_phone',
            copyable: true,
            render: (text) => text || '',
          },
          {
            title: '联系邮箱',
            dataIndex: 'contact_email',
            copyable: true,
            render: (text) => text || '',
          },
          {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
              1: { text: '正常', status: 'Success' },
              0: { text: '禁用', status: 'Error' },
            },
            render: (text, record) => (
              <Tag color={record?.status === 1 ? 'success' : 'error'}>
                {record?.status === 1 ? '正常' : '禁用'}
              </Tag>
            ),
          },
          {
            title: '公司地址',
            dataIndex: 'company_address',
            span: 2,
            ellipsis: true,
            render: (text) => text || '',
          },
          {
            title: '公司描述',
            dataIndex: 'company_desc',
            span: 2,
            valueType: 'textarea',
            render: (text) => text || '',
          },
          {
            title: '创建时间',
            dataIndex: 'created_at',
            valueType: 'dateTime',
            render: (text) => text || '',
          },
          {
            title: '更新时间',
            dataIndex: 'updated_at',
            valueType: 'dateTime',
            render: (text) => text || '',
          },
        ]}
      />
    </Drawer>
  );
};

export default CompanyDetail;
