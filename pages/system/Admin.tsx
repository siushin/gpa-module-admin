import { PageContainer } from '@ant-design/pro-components';
import React from 'react';
import AdminTable from './components/AdminTable';

const Admin: React.FC = () => {
  return (
    <PageContainer>
      <AdminTable pageKey="system-admin" />
    </PageContainer>
  );
};

export default Admin;
