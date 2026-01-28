import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDigit,
  ProFormItem,
  ProFormRadio,
  ProFormText,
} from '@ant-design/pro-components';
import { useCallback, useEffect, useRef, useState } from 'react';
import RichTextEditor from '@/modules/base/components/RichTextEditor';
import { ensureAllFormFields } from '@/modules/base/utils/constants';

interface MessageFormProps {
  visible: boolean;
  editingRecord: any;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const MessageForm: React.FC<MessageFormProps> = ({
  visible,
  editingRecord,
  onCancel,
  onSubmit,
}) => {
  const formRef = useRef<ProFormInstance>(undefined);
  const [contentValue, setContentValue] = useState<string>('');
  const lastContentValueRef = useRef<string>('');

  // 如果编辑的记录是已读状态，不允许编辑
  const isReadOnly = editingRecord && editingRecord.status === 1;

  // 使用 useCallback 稳定 onChange 回调，避免循环引用
  const handleContentChange = useCallback(
    (value: string) => {
      // 只有当值真正改变时才更新，避免循环引用
      if (value !== lastContentValueRef.current && value !== contentValue) {
        lastContentValueRef.current = value;
        setContentValue(value);
        // 使用 setTimeout 延迟更新表单字段，避免循环引用
        setTimeout(() => {
          formRef.current?.setFieldValue('content', value);
        }, 0);
      }
    },
    [contentValue],
  );

  useEffect(() => {
    if (visible && editingRecord) {
      formRef.current?.setFieldsValue({
        ...editingRecord,
        status: editingRecord.status === 1,
      });
      const content = editingRecord.content || '';
      // 只有当内容真正改变时才更新，避免循环引用
      if (content !== lastContentValueRef.current) {
        setContentValue(content);
        lastContentValueRef.current = content;
      }
    } else if (visible && !editingRecord) {
      formRef.current?.resetFields();
      formRef.current?.setFieldsValue({
        target_platform: 'all', // 默认选中第一个：全平台
        // 新增时不需要设置 status，默认未读（在提交时处理）
      });
      setContentValue('');
      lastContentValueRef.current = '';
    }
    // 使用 editingRecord?.id 作为依赖项，避免对象引用导致的循环
  }, [visible, editingRecord?.id]);

  return (
    <DrawerForm
      formRef={formRef}
      title={
        editingRecord
          ? isReadOnly
            ? '查看站内信（已读）'
            : '编辑站内信'
          : '新增站内信'
      }
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      submitter={isReadOnly ? false : undefined}
      onFinish={async (values) => {
        // 定义所有表单字段，确保它们都被包含
        const allFormFields = editingRecord
          ? ['title', 'receiver_id', 'target_platform', 'status', 'content']
          : ['title', 'receiver_id', 'target_platform', 'content'];
        // 确保所有字段都被包含
        const completeValues = ensureAllFormFields(
          formRef,
          values,
          allFormFields,
        );
        // 将开关的布尔值转换为数字
        const submitValues = {
          ...completeValues,
          // 新增时默认未读（status = 0），编辑时使用表单值
          status: editingRecord ? (completeValues.status ? 1 : 0) : 0,
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
        name="title"
        label="标题"
        rules={[{ required: true, message: '请输入标题' }]}
        fieldProps={{
          placeholder: '请输入标题',
          disabled: isReadOnly,
        }}
      />
      <ProFormDigit
        name="receiver_id"
        label="接收者ID"
        rules={[{ required: true, message: '请输入接收者ID' }]}
        fieldProps={{
          placeholder: '请输入接收者ID',
          disabled: isReadOnly,
        }}
      />
      <ProFormRadio.Group
        name="target_platform"
        label="目标平台"
        initialValue="all"
        options={[
          { label: '全平台', value: 'all' },
          { label: '用户端', value: 'user' },
          { label: '管理端', value: 'admin' },
          { label: '小程序', value: 'miniapp' },
        ]}
        disabled={isReadOnly}
      />
      {editingRecord && (
        <ProFormRadio.Group
          name="status"
          label="状态"
          initialValue={false}
          options={[
            { label: '已读', value: true },
            { label: '未读', value: false },
          ]}
          disabled={isReadOnly}
        />
      )}
      <ProFormItem
        name="content"
        label="内容"
        rules={[{ required: true, message: '请输入内容' }]}
      >
        <RichTextEditor
          value={contentValue}
          onChange={handleContentChange}
          placeholder="请输入站内信内容..."
          maxLength={5000}
          disabled={isReadOnly}
        />
      </ProFormItem>
    </DrawerForm>
  );
};

export default MessageForm;
