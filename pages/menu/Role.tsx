import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React, { useState } from 'react';
import RoleTable from './components/RoleTable';

const Role: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin');

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'admin' | 'user')}
        destroyOnHidden
        items={[
          {
            key: 'admin',
            label: '管理员角色',
            children: <RoleTable key="admin" accountType="admin" />,
          },
          {
            key: 'user',
            label: '用户角色',
            children: <RoleTable key="user" accountType="user" />,
          },
        ]}
      />
    </PageContainer>
  );
};

export default Role;
