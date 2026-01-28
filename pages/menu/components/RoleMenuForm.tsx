import type { ProFormInstance } from '@ant-design/pro-components';
import { DrawerForm, ProFormSelect } from '@ant-design/pro-components';
import { App } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { addRoleMenu } from '@/modules/admin/services/system';
import { ensureAllFormFields } from '@/modules/base/utils/constants';

interface RoleMenuFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  getRoleList: (params?: any) => Promise<any>;
}

const RoleMenuForm: React.FC<RoleMenuFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  getRoleList,
}) => {
  const { message } = App.useApp();
  const formRef = useRef<ProFormInstance>(undefined);
  const [roleOptions, setRoleOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [menuOptions, setMenuOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);

  useEffect(() => {
    if (visible) {
      loadOptions();
    }
  }, [visible]);

  const loadOptions = async () => {
    try {
      // 加载角色列表
      const roleRes = await getRoleList({ page: 1, pageSize: 1000 });
      if (roleRes.code === 200 && roleRes.data?.data) {
        const options = roleRes.data.data.map((item: any) => ({
          label: `${item.role_name} (${item.role_code})`,
          value: item.role_id,
        }));
        setRoleOptions(options);
      }

      // 暂时使用伪数据作为菜单选项
      setMenuOptions([
        { label: '菜单1', value: 1 },
        { label: '菜单2', value: 2 },
        { label: '  子菜单1', value: 3 },
        { label: '  子菜单2', value: 4 },
      ]);
    } catch (error) {
      console.error('加载选项失败:', error);
    }
  };

  return (
    <DrawerForm
      formRef={formRef}
      title="新增角色菜单关联"
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      onFinish={async (values) => {
        try {
          // 定义所有表单字段，确保它们都被包含
          const allFormFields = ['role_id', 'menu_id'];
          // 确保所有字段都被包含
          const completeValues = ensureAllFormFields(
            formRef,
            values,
            allFormFields,
          );
          const res = await addRoleMenu(completeValues);
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
        name="role_id"
        label="角色"
        options={roleOptions}
        rules={[{ required: true, message: '请选择角色' }]}
        fieldProps={{
          placeholder: '请选择角色',
          showSearch: true,
        }}
      />
      <ProFormSelect
        name="menu_id"
        label="菜单"
        options={menuOptions}
        rules={[{ required: true, message: '请选择菜单' }]}
        fieldProps={{
          placeholder: '请选择菜单',
          showSearch: true,
        }}
      />
    </DrawerForm>
  );
};

export default RoleMenuForm;
