import React from 'react';
import UserList from './components/UserList';

const Pending: React.FC = () => {
  return <UserList isPending={true} />;
};

export default Pending;
