import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDateTimePicker,
  ProFormItem,
  ProFormRadio,
  ProFormText,
} from '@ant-design/pro-components';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import RichTextEditor from '@/modules/base/components/RichTextEditor';
import { ensureAllFormFields } from '@/modules/base/utils/constants';

interface SystemNotificationFormProps {
  visible: boolean;
  editingRecord: any;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const SystemNotificationForm: React.FC<SystemNotificationFormProps> = ({
  visible,
  editingRecord,
  onCancel,
  onSubmit,
}) => {
  const formRef = useRef<ProFormInstance>(undefined);
  const [contentValue, setContentValue] = useState<string>('');
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const lastContentValueRef = useRef<string>('');

  // 如果编辑的记录是禁用状态，不允许编辑
  const isReadOnly = editingRecord && editingRecord.status === 0;

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
      const values = {
        ...editingRecord,
        start_time: editingRecord.start_time
          ? dayjs(editingRecord.start_time)
          : null,
        end_time: editingRecord.end_time ? dayjs(editingRecord.end_time) : null,
        status: editingRecord.status === 1 ? true : false,
      };
      formRef.current?.setFieldsValue(values);
      const content = editingRecord.content || '';
      // 只有当内容真正改变时才更新，避免循环引用
      if (content !== lastContentValueRef.current) {
        setContentValue(content);
        lastContentValueRef.current = content;
      }
      setStartTime(
        editingRecord.start_time ? dayjs(editingRecord.start_time) : null,
      );
    } else if (visible && !editingRecord) {
      formRef.current?.resetFields();
      formRef.current?.setFieldsValue({
        status: true,
        type: 'system', // 默认选中第一个：系统通知
        target_platform: 'all', // 默认选中第一个：全平台
      });
      setContentValue('');
      lastContentValueRef.current = '';
      setStartTime(null);
    }
    // 使用 editingRecord?.id 作为依赖项，避免对象引用导致的循环
  }, [visible, editingRecord?.id]);

  return (
    <DrawerForm
      formRef={formRef}
      title={
        editingRecord
          ? isReadOnly
            ? '查看系统通知（已禁用）'
            : '编辑系统通知'
          : '新增系统通知'
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
        const allFormFields = [
          'title',
          'type',
          'target_platform',
          'start_time',
          'end_time',
          'status',
          'content',
        ];
        // 确保所有字段都被包含
        const completeValues = ensureAllFormFields(
          formRef,
          values,
          allFormFields,
        );
        // 将开关的布尔值转换为数字，将时间对象转换为字符串
        const submitValues = {
          ...completeValues,
          status: completeValues.status ? 1 : 0,
          start_time: completeValues.start_time
            ? dayjs(completeValues.start_time).format('YYYY-MM-DD HH:mm:ss')
            : '',
          end_time: completeValues.end_time
            ? dayjs(completeValues.end_time).format('YYYY-MM-DD HH:mm:ss')
            : '',
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
      <ProFormRadio.Group
        name="type"
        label="通知类型"
        initialValue="system"
        options={[
          { label: '系统通知', value: 'system' },
          { label: '业务通知', value: 'business' },
          { label: '活动通知', value: 'activity' },
          { label: '其他', value: 'other' },
        ]}
        disabled={isReadOnly}
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
      <ProFormDateTimePicker
        name="start_time"
        label="开始时间"
        fieldProps={{
          placeholder: '请选择开始时间',
          style: { width: '100%' },
          showTime: true,
          format: 'YYYY-MM-DD HH:mm:ss',
          disabledDate: (current: Dayjs) => {
            // 不能选择今天之前的日期
            return current && current.isBefore(dayjs(), 'day');
          },
          disabledTime: (current: Dayjs | null) => {
            if (!current) return {};
            const now = dayjs();
            // 如果是今天，不能选择当前时间之前的时间
            if (current.isSame(now, 'day')) {
              return {
                disabledHours: () => {
                  const hours = [];
                  for (let i = 0; i < now.hour(); i++) {
                    hours.push(i);
                  }
                  return hours;
                },
                disabledMinutes: (selectedHour: number) => {
                  if (selectedHour === now.hour()) {
                    const minutes = [];
                    for (let i = 0; i <= now.minute(); i++) {
                      minutes.push(i);
                    }
                    return minutes;
                  }
                  return [];
                },
                disabledSeconds: (
                  selectedHour: number,
                  selectedMinute: number,
                ) => {
                  if (
                    selectedHour === now.hour() &&
                    selectedMinute === now.minute()
                  ) {
                    const seconds = [];
                    for (let i = 0; i <= now.second(); i++) {
                      seconds.push(i);
                    }
                    return seconds;
                  }
                  return [];
                },
              };
            }
            return {};
          },
          onChange: (value: Dayjs | null) => {
            setStartTime(value);
            // 如果结束时间早于新的开始时间，清空结束时间
            const endTime = formRef.current?.getFieldValue('end_time');
            if (endTime && value && dayjs(endTime).isBefore(value)) {
              formRef.current?.setFieldValue('end_time', null);
            }
          },
        }}
        extra="留空则立即生效"
      />
      <ProFormDateTimePicker
        name="end_time"
        label="结束时间"
        fieldProps={{
          placeholder: '请选择结束时间',
          style: { width: '100%' },
          showTime: true,
          format: 'YYYY-MM-DD HH:mm:ss',
          disabled: isReadOnly,
          disabledDate: (current: Dayjs) => {
            // 不能选择今天之前的日期
            if (current && current.isBefore(dayjs(), 'day')) {
              return true;
            }
            // 如果选择了开始时间，不能选择开始时间之前的日期
            if (startTime && current && current.isBefore(startTime, 'day')) {
              return true;
            }
            return false;
          },
          disabledTime: (current: Dayjs | null) => {
            if (!current) return {};
            const now = dayjs();
            // 如果是今天，不能选择当前时间之前的时间
            if (current.isSame(now, 'day')) {
              return {
                disabledHours: () => {
                  const hours = [];
                  for (let i = 0; i < now.hour(); i++) {
                    hours.push(i);
                  }
                  return hours;
                },
                disabledMinutes: (selectedHour: number) => {
                  if (selectedHour === now.hour()) {
                    const minutes = [];
                    for (let i = 0; i <= now.minute(); i++) {
                      minutes.push(i);
                    }
                    return minutes;
                  }
                  return [];
                },
                disabledSeconds: (
                  selectedHour: number,
                  selectedMinute: number,
                ) => {
                  if (
                    selectedHour === now.hour() &&
                    selectedMinute === now.minute()
                  ) {
                    const seconds = [];
                    for (let i = 0; i <= now.second(); i++) {
                      seconds.push(i);
                    }
                    return seconds;
                  }
                  return [];
                },
              };
            }
            // 如果选择了开始时间，且是同一天，不能选择开始时间之前的时间
            if (startTime && current.isSame(startTime, 'day')) {
              return {
                disabledHours: () => {
                  const hours = [];
                  for (let i = 0; i < startTime.hour(); i++) {
                    hours.push(i);
                  }
                  return hours;
                },
                disabledMinutes: (selectedHour: number) => {
                  if (selectedHour === startTime.hour()) {
                    const minutes = [];
                    for (let i = 0; i <= startTime.minute(); i++) {
                      minutes.push(i);
                    }
                    return minutes;
                  }
                  return [];
                },
                disabledSeconds: (
                  selectedHour: number,
                  selectedMinute: number,
                ) => {
                  if (
                    selectedHour === startTime.hour() &&
                    selectedMinute === startTime.minute()
                  ) {
                    const seconds = [];
                    for (let i = 0; i <= startTime.second(); i++) {
                      seconds.push(i);
                    }
                    return seconds;
                  }
                  return [];
                },
              };
            }
            return {};
          },
        }}
        extra="留空则长期有效，必须晚于开始时间"
      />
      <ProFormRadio.Group
        name="status"
        label="状态"
        initialValue={true}
        options={[
          { label: '启用', value: true },
          { label: '禁用', value: false },
        ]}
        disabled={isReadOnly}
      />
      <ProFormItem
        name="content"
        label="内容"
        rules={[{ required: true, message: '请输入内容' }]}
      >
        <RichTextEditor
          value={contentValue}
          onChange={handleContentChange}
          placeholder="请输入通知内容..."
          maxLength={5000}
          disabled={isReadOnly}
        />
      </ProFormItem>
    </DrawerForm>
  );
};

export default SystemNotificationForm;
