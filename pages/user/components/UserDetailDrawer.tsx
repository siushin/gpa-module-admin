import { useModel } from '@umijs/max';
import { Drawer, Watermark } from 'antd';
import React, { useEffect, useState } from 'react';
import { getUserDetail } from '@/modules/admin/services/user';
import UserDetailContent from './UserDetailContent';

interface UserDetailDrawerProps {
  visible: boolean;
  record: any;
  onClose: () => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  visible,
  record,
  onClose,
}) => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    account: any;
    profile: any;
    user: any;
    social: Array<any>;
  } | null>(null);

  useEffect(() => {
    if (visible && record?.account_id) {
      loadDetailData();
    } else {
      setDetailData(null);
    }
  }, [visible, record]);

  const loadDetailData = async () => {
    if (!record?.account_id) return;

    setLoading(true);
    try {
      const res = await getUserDetail({ account_id: record.account_id });
      if (res.code === 200 && res.data) {
        setDetailData(res.data);
      }
    } catch (error) {
      console.error('加载用户详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="用户详情"
      width={1200}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      <Watermark content={currentUser?.name || '用户详情'}>
        {detailData ? (
          <UserDetailContent detailData={detailData} loading={loading} />
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            {loading ? '加载中...' : '暂无数据'}
          </div>
        )}
      </Watermark>
    </Drawer>
  );
};

export default UserDetailDrawer;
