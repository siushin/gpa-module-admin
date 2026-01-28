import { useModel } from '@umijs/max';
import { Drawer, Watermark } from 'antd';
import React, { useEffect, useState } from 'react';
import { getAdminDetail } from '@/modules/admin/services/system';
import AdminDetailContent from './AdminDetailContent';

interface AdminDetailDrawerProps {
  visible: boolean;
  record: any;
  onClose: () => void;
}

const AdminDetailDrawer: React.FC<AdminDetailDrawerProps> = ({
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
    admin: any;
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
      const res = await getAdminDetail({ account_id: record.account_id });
      if (res.code === 200 && res.data) {
        setDetailData(res.data);
      }
    } catch (error) {
      console.error('加载管理员详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="管理员详情"
      width={1200}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      <Watermark content={currentUser?.name || '管理员详情'}>
        {detailData ? (
          <AdminDetailContent
            detailData={detailData}
            loading={loading}
            onRefresh={loadDetailData}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            {loading ? '加载中...' : '暂无数据'}
          </div>
        )}
      </Watermark>
    </Drawer>
  );
};

export default AdminDetailDrawer;
