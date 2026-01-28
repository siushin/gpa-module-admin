import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Card, Descriptions, Divider, Spin, Tabs, Tag } from 'antd';
import React, { useState } from 'react';
import { TABLE_SIZE } from '@/modules/base/utils/constants';
import AdminLogsSection from './AdminLogsSection';

interface AdminDetailContentProps {
  detailData: {
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
      sort: number;
      created_at?: string;
      updated_at?: string;
    }>;
  };
  loading?: boolean;
  onRefresh?: () => void;
}

const AdminDetailContent: React.FC<AdminDetailContentProps> = ({
  detailData,
  loading,
  onRefresh,
}) => {
  const { account, profile, admin, social, departments = [] } = detailData;
  const [activeTabKey, setActiveTabKey] = useState<string>('account');

  // 性别映射
  const genderMap: Record<string, string> = {
    male: '男',
    female: '女',
    unknown: '未知',
  };

  // 账号状态映射
  const statusMap: Record<number, { text: string; color: string }> = {
    1: { text: '正常', color: 'success' },
    0: { text: '禁用', color: 'error' },
  };

  // 部门列表表格列定义
  const departmentColumns: ProColumns<any>[] = [
    {
      title: '序号',
      valueType: 'index',
      width: 80,
      fixed: 'left',
    },
    {
      title: '部门名称',
      dataIndex: 'department_name',
      width: 200,
      render: (_, record) => record.department_name || '',
    },
    {
      title: '部门编码',
      dataIndex: 'department_code',
      width: 150,
      render: (_, record) => record.department_code || '',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        items={[
          {
            key: 'account',
            label: '账号信息',
            children: (
              <Card>
                <Descriptions
                  column={2}
                  bordered
                  size="small"
                  styles={{ content: {}, label: {} }}
                >
                  <Descriptions.Item label="账号ID">
                    {account.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="用户名">
                    {account.username}
                  </Descriptions.Item>
                  <Descriptions.Item label="账号状态">
                    <Tag color={statusMap[account.status]?.color}>
                      {statusMap[account.status]?.text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="最后登录IP">
                    {account.last_login_ip || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后登录地">
                    {account.last_login_location || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后登录时间">
                    {account.last_login_time || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {account.created_at || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {account.updated_at || ''}
                  </Descriptions.Item>
                  {/* 管理员信息合并到账号信息 */}
                  {admin && (
                    <>
                      <Descriptions.Item label="是否超级管理员">
                        <Tag color={admin.is_super === 1 ? 'blue' : 'default'}>
                          {admin.is_super === 1 ? '是' : '否'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="所属公司">
                        {admin.company_name || ''}
                      </Descriptions.Item>
                      <Descriptions.Item label="所属部门">
                        {admin.department_name || ''}
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </Card>
            ),
          },
          {
            key: 'profile',
            label: '账号资料',
            children: profile ? (
              <Card>
                <Descriptions
                  column={2}
                  bordered
                  size="small"
                  styles={{ content: {}, label: {} }}
                >
                  <Descriptions.Item label="昵称">
                    {profile.nickname || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="性别">
                    {genderMap[profile.gender] || profile.gender || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="头像">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="头像"
                        style={{ width: 60, height: 60, objectFit: 'cover' }}
                      />
                    ) : (
                      ''
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="真实姓名">
                    {profile.real_name || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="身份证号">
                    {profile.id_card || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="认证方式">
                    {profile.verification_method || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="认证时间">
                    {profile.verified_at || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {profile.created_at || ''}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {profile.updated_at || ''}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ) : (
              <Card>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '50px',
                    color: '#999',
                  }}
                >
                  暂无账号资料信息
                </div>
              </Card>
            ),
          },
          {
            key: 'departments',
            label: '所属部门',
            children: (
              <Card>
                <ProTable<any>
                  rowKey="id"
                  size={TABLE_SIZE}
                  search={false}
                  pagination={false}
                  dateFormatter="string"
                  scroll={{ x: 'max-content' }}
                  columns={departmentColumns}
                  dataSource={departments}
                  toolBarRender={false}
                />
              </Card>
            ),
          },
          {
            key: 'social',
            label: '社交账号',
            children:
              social && social.length > 0 ? (
                <Card>
                  <Descriptions
                    column={1}
                    bordered
                    size="small"
                    styles={{ content: {}, label: {} }}
                  >
                    {social.map((item) => (
                      <Descriptions.Item key={item.id} label={item.social_type}>
                        <div>
                          <div>
                            <strong>账号：</strong>
                            {item.social_account}
                          </div>
                          {item.social_name && (
                            <div>
                              <strong>昵称：</strong>
                              {item.social_name}
                            </div>
                          )}
                          <div>
                            <strong>验证状态：</strong>
                            <Tag
                              color={
                                item.is_verified === 1 ? 'success' : 'default'
                              }
                            >
                              {item.is_verified === 1 ? '已验证' : '未验证'}
                            </Tag>
                          </div>
                          {item.verified_at && (
                            <div>
                              <strong>验证时间：</strong>
                              {item.verified_at}
                            </div>
                          )}
                          {item.avatar && (
                            <div style={{ marginTop: 8 }}>
                              <img
                                src={item.avatar}
                                alt="头像"
                                style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: 'cover',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              ) : (
                <Card>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '50px',
                      color: '#999',
                    }}
                  >
                    暂无社交账号信息
                  </div>
                </Card>
              ),
          },
        ]}
      />

      <Divider />

      {/* 日志模块 */}
      <div style={{ marginTop: 24 }}>
        <AdminLogsSection accountId={account.id} />
      </div>
    </div>
  );
};

export default AdminDetailContent;
