import { App, Button, Checkbox, Drawer, Space, Spin } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import React, { useEffect, useState } from 'react';
import { getUserRoles, updateUserRoles } from '@/modules/admin/services/user';

interface RoleData {
  role_id: number;
  role_name: string;
  role_code: string;
  description?: string;
}

interface UserRoleDrawerProps {
  visible: boolean;
  record: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const UserRoleDrawer: React.FC<UserRoleDrawerProps> = ({
  visible,
  record,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allRoles, setAllRoles] = useState<RoleData[]>([]);
  const [checkedRoleIds, setCheckedRoleIds] = useState<number[]>([]);

  // 加载角色数据
  useEffect(() => {
    if (visible && record?.account_id) {
      loadRoles();
    }
  }, [visible, record?.account_id]);

  const loadRoles = async () => {
    if (!record?.account_id) return;

    setLoading(true);
    try {
      const res = await getUserRoles({ account_id: record.account_id });
      if (res.code === 200 && res.data) {
        setAllRoles(res.data.all_roles || []);
        setCheckedRoleIds(res.data.checked_role_ids || []);
      } else {
        message.error(res.message || '获取角色数据失败');
      }
    } catch (_error) {
      message.error('获取角色数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理单个角色勾选变化
  const handleRoleCheck = (roleId: number, checked: boolean) => {
    if (checked) {
      setCheckedRoleIds([...checkedRoleIds, roleId]);
    } else {
      setCheckedRoleIds(checkedRoleIds.filter((id) => id !== roleId));
    }
  };

  // 全选
  const handleSelectAll = () => {
    setCheckedRoleIds(allRoles.map((role) => role.role_id));
  };

  // 取消全选
  const handleDeselectAll = () => {
    setCheckedRoleIds([]);
  };

  // 保存角色
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateUserRoles({
        account_id: record.account_id,
        role_ids: checkedRoleIds,
      });
      if (res.code === 200) {
        message.success('保存成功');
        onSuccess?.();
        onClose();
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (_error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 检查是否全选
  const isAllChecked =
    allRoles.length > 0 && checkedRoleIds.length === allRoles.length;
  const isIndeterminate =
    checkedRoleIds.length > 0 && checkedRoleIds.length < allRoles.length;

  return (
    <Drawer
      title={`分配角色 - ${record?.nickname || record?.username || ''}`}
      open={visible}
      onClose={onClose}
      width={480}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={loading}>
        {allRoles.length > 0 ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Checkbox
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={(e: CheckboxChangeEvent) => {
                    if (e.target.checked) {
                      handleSelectAll();
                    } else {
                      handleDeselectAll();
                    }
                  }}
                >
                  全选
                </Checkbox>
              </Space>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allRoles.map((role) => (
                <Checkbox
                  key={role.role_id}
                  checked={checkedRoleIds.includes(role.role_id)}
                  onChange={(e: CheckboxChangeEvent) =>
                    handleRoleCheck(role.role_id, e.target.checked)
                  }
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{role.role_name}</span>
                    <span
                      style={{ color: '#999', marginLeft: 8, fontSize: 12 }}
                    >
                      ({role.role_code})
                    </span>
                    {role.description && (
                      <div style={{ color: '#666', fontSize: 12 }}>
                        {role.description}
                      </div>
                    )}
                  </div>
                </Checkbox>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}
          >
            暂无可分配的角色
          </div>
        )}
      </Spin>
    </Drawer>
  );
};

export default UserRoleDrawer;
