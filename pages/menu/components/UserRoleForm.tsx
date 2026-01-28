import type { ProFormInstance } from '@ant-design/pro-components';
import { DrawerForm, ProFormSelect } from '@ant-design/pro-components';
import { App } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { addUserRole } from '@/modules/admin/services/system';
import { ensureAllFormFields } from '@/modules/base/utils/constants';

interface UserRoleFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  getAdminList: (params?: any) => Promise<any>;
  getRoleList: (params?: any) => Promise<any>;
}

const UserRoleForm: React.FC<UserRoleFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  getAdminList,
  getRoleList,
}) => {
  const { message } = App.useApp();
  const formRef = useRef<ProFormInstance>(undefined);
  const [userOptions, setUserOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [roleOptions, setRoleOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);

  useEffect(() => {
    if (visible) {
      loadOptions();
    }
  }, [visible]);

  const loadOptions = async () => {
    try {
      // 加载用户列表
      const userRes = await getAdminList({ page: 1, pageSize: 1000 });
      if (userRes.code === 200 && userRes.data?.data) {
        const options = userRes.data.data.map((item: any) => ({
          label: `${item.username} (ID: ${item.user_id || item.id})`,
          value: item.user_id || item.id,
        }));
        setUserOptions(options);
      }

      // 加载角色列表
      const roleRes = await getRoleList({ page: 1, pageSize: 1000 });
      if (roleRes.code === 200 && roleRes.data?.data) {
        const options = roleRes.data.data.map((item: any) => ({
          label: `${item.role_name} (${item.role_code})`,
          value: item.role_id,
        }));
        setRoleOptions(options);
      }
    } catch (error) {
      console.error('加载选项失败:', error);
    }
  };

  return (
    <DrawerForm
      formRef={formRef}
      title="新增用户角色关联"
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      onFinish={async (values) => {
        try {
          // 定义所有表单字段，确保它们都被包含
          const allFormFields = ['user_id', 'role_id'];
          // 确保所有字段都被包含
          const completeValues = ensureAllFormFields(
            formRef,
            values,
            allFormFields,
          );
          const res = await addUserRole(completeValues);
          if (res.code === 200) {
            message.success('新增成功');
            await onSubmit();
            return true;
          } else {
            message.error(res.message || '新增失败');
            return false;
          }
        } catch (error) {
          message.error('新增失败');
          return false;
        }
      }}
      width={600}
    >
      <ProFormSelect
        name="user_id"
        label="用户"
        options={userOptions}
        rules={[{ required: true, message: '请选择用户' }]}
        fieldProps={{
          placeholder: '请选择用户',
          showSearch: true,
        }}
      />
      <ProFormSelect
        name="role_id"
        label="角色"
        options={roleOptions}
        rules={[{ required: true, message: '请选择角色' }]}
        fieldProps={{
          placeholder: '请选择角色',
          showSearch: true,
        }}
      />
    </DrawerForm>
  );
};

export default UserRoleForm;
