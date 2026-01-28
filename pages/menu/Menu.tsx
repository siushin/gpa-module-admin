import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React, { useState } from 'react';
import MenuTable from './components/MenuTable';

const Menu: React.FC = () => {
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
            label: '管理员菜单',
            children: <MenuTable key="admin" accountType="admin" />,
          },
          {
            key: 'user',
            label: '用户菜单',
            children: <MenuTable key="user" accountType="user" />,
          },
        ]}
      />
    </PageContainer>
  );
};

export default Menu;
