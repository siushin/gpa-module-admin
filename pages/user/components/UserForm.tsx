import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormRadio,
  ProFormText,
} from '@ant-design/pro-components';
import { useEffect, useRef, useState } from 'react';
import { ensureAllFormFields } from '@/modules/base/utils/constants';

interface UserFormProps {
  visible: boolean;
  editingRecord: any;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const UserForm: React.FC<UserFormProps> = ({
  visible,
  editingRecord,
  onCancel,
  onSubmit,
}) => {
  const [formKey, setFormKey] = useState<string>(
    editingRecord?.id || editingRecord?.user_id || `new-${Date.now()}`,
  );
  const formRef = useRef<ProFormInstance>(undefined);

  // 初始化表单 key，确保表单正确重置
  useEffect(() => {
    if (visible) {
      if (!editingRecord) {
        setFormKey(`new-${Date.now()}`);
      } else {
        setFormKey(
          editingRecord.id || editingRecord.user_id || `edit-${Date.now()}`,
        );
      }
    }
  }, [visible, editingRecord]);

  // 设置表单初始值（使用 setFieldsValue 避免 initialValues 警告）
  useEffect(() => {
    if (visible && formRef.current) {
      const timer = setTimeout(() => {
        if (formRef.current) {
          if (editingRecord) {
            formRef.current.setFieldsValue({
              ...editingRecord,
              status: editingRecord.status === 1,
            });
          } else {
            formRef.current.setFieldsValue({
              status: true,
            });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [visible, editingRecord]);

  return (
    <DrawerForm
      key={formKey}
      formRef={formRef}
      title={editingRecord ? '编辑用户' : '新增用户'}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      onFinish={async (values) => {
        // 定义所有表单字段，确保它们都被包含
        const allFormFields = ['username', 'password', 'status'];
        // 确保所有字段都被包含
        const completeValues = ensureAllFormFields(
          formRef,
          values,
          allFormFields,
        );
        // 将 status 的 boolean 值转换为 1/0
        const submitValues = {
          ...completeValues,
          status: completeValues.status ? 1 : 0,
        };
        await onSubmit(submitValues);
        return true;
      }}
      width={800}
      layout="horizontal"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
    >
      <ProFormText
        name="username"
        label="用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
        fieldProps={{
          placeholder: '请输入用户名',
          disabled: !!editingRecord,
          maxLength: 50,
          showCount: true,
        }}
      />
      {!editingRecord && (
        <ProFormText.Password
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
          fieldProps={{
            placeholder: '请输入密码',
            maxLength: 50,
          }}
        />
      )}
      {editingRecord && (
        <ProFormText.Password
          name="password"
          label="密码"
          fieldProps={{
            placeholder: '留空则不修改密码',
            maxLength: 50,
          }}
        />
      )}
      <ProFormRadio.Group
        name="status"
        label="账号状态"
        options={[
          { label: '正常', value: true },
          { label: '禁用', value: false },
        ]}
      />
    </DrawerForm>
  );
};

export default UserForm;
