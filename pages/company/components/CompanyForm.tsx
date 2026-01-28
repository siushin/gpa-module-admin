import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useEffect, useRef, useState } from 'react';
import {
  ensureAllFormFields,
  MODAL_WIDTH,
} from '@/modules/base/utils/constants';

interface CompanyFormProps {
  visible: boolean;
  editingRecord: any;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  visible,
  editingRecord,
  onCancel,
  onSubmit,
}) => {
  const [formKey, setFormKey] = useState<string>(
    editingRecord?.company_id || `new-${Date.now()}`,
  );
  const formRef = useRef<ProFormInstance>(undefined);

  // 初始化表单 key，确保表单正确重置
  useEffect(() => {
    if (visible) {
      // 新增时，每次打开都生成新的 key，确保表单被重置
      if (!editingRecord) {
        setFormKey(`new-${Date.now()}`);
      } else {
        setFormKey(editingRecord.company_id || `edit-${Date.now()}`);
      }
    }
  }, [visible, editingRecord]);

  // 设置表单初始值（使用 setFieldsValue 避免 initialValues 警告）
  useEffect(() => {
    if (visible && formRef.current) {
      // 使用 setTimeout 确保在下一个事件循环中执行，此时表单已经渲染完成
      const timer = setTimeout(() => {
        if (formRef.current) {
          if (editingRecord) {
            // 编辑模式：设置编辑记录的值
            formRef.current.setFieldsValue({
              ...editingRecord,
              status: editingRecord.status ?? 1,
            });
          } else {
            // 新增模式：设置默认值
            formRef.current.setFieldsValue({
              status: 1,
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
      title={editingRecord ? '编辑公司' : '新增公司'}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      onFinish={async (values) => {
        // 定义所有表单字段，确保它们都被包含
        const allFormFields = [
          'company_name',
          'company_code',
          'company_credit_code',
          'legal_person',
          'contact_phone',
          'contact_email',
          'company_address',
          'company_desc',
          'status',
        ];
        // 确保所有字段都被包含
        const completeValues = ensureAllFormFields(
          formRef,
          values,
          allFormFields,
        );
        await onSubmit(completeValues);
        return true;
      }}
      width={MODAL_WIDTH.MEDIUM}
      layout="horizontal"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
    >
      <ProFormText
        name="company_name"
        label="公司名称"
        rules={[{ required: true, message: '请输入公司名称' }]}
        fieldProps={{
          placeholder: '请输入公司名称',
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormText
        name="company_code"
        label="公司编码"
        fieldProps={{
          placeholder: '请输入公司编码（可选）',
          maxLength: 50,
          showCount: true,
        }}
      />
      <ProFormText
        name="company_credit_code"
        label="统一社会信用代码"
        rules={[
          { required: true, message: '请输入统一社会信用代码' },
          { len: 18, message: '统一社会信用代码必须为18位' },
        ]}
        fieldProps={{
          placeholder: '请输入18位统一社会信用代码',
          maxLength: 18,
          showCount: true,
        }}
      />
      <ProFormText
        name="legal_person"
        label="法人代表"
        fieldProps={{
          placeholder: '请输入法人代表（可选）',
          maxLength: 50,
          showCount: true,
        }}
      />
      <ProFormText
        name="contact_phone"
        label="联系电话"
        rules={[
          {
            validator: (_rule, value) => {
              if (!value) {
                return Promise.resolve();
              }
              // 支持手机号和固定电话格式
              const phonePattern = /^1[3-9]\d{9}$/; // 手机号
              const landlinePattern = /^0\d{2,3}-?\d{7,8}$/; // 固定电话
              if (phonePattern.test(value) || landlinePattern.test(value)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error('请输入正确的联系电话（手机号或固定电话）'),
              );
            },
          },
        ]}
        fieldProps={{
          placeholder: '请输入联系电话（可选）',
        }}
      />
      <ProFormText
        name="contact_email"
        label="联系邮箱"
        rules={[
          {
            type: 'email',
            message: '请输入正确的邮箱地址',
          },
        ]}
        fieldProps={{
          placeholder: '请输入联系邮箱（可选）',
        }}
      />
      <ProFormText
        name="company_address"
        label="公司地址"
        fieldProps={{
          placeholder: '请输入公司地址（可选）',
          maxLength: 200,
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="company_desc"
        label="公司描述"
        fieldProps={{
          placeholder: '请输入公司描述（可选）',
          rows: 3,
          maxLength: 500,
          showCount: true,
        }}
      />
      <ProFormRadio.Group
        name="status"
        label="状态"
        options={[
          { label: '正常', value: 1 },
          { label: '禁用', value: 0 },
        ]}
        rules={[{ required: true, message: '请选择状态' }]}
      />
    </DrawerForm>
  );
};

export default CompanyForm;
