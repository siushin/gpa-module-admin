import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import React, { useEffect, useRef, useState } from 'react';
import {
  ensureAllFormFields,
  MODAL_WIDTH,
} from '@/modules/base/utils/constants';

// 自动生成值配置（与后端保持一致）
// 自动生成值（按照序号自增）
const AUTO_INS_GENERATE_VALUE: Record<string, number> = {};

// 自动生成值（值跟键相同）
const AUTO_INS_SAME_KEY_VALUE: string[] = [];

interface DictionaryFormProps {
  visible: boolean;
  editingRecord: any;
  defaultCategoryId?: number;
  categoryCode?: string;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const DictionaryForm: React.FC<DictionaryFormProps> = ({
  visible,
  editingRecord,
  defaultCategoryId,
  categoryCode,
  onCancel,
  onSubmit,
}) => {
  const formRef = useRef<ProFormInstance>(undefined);
  const [valueGenerateType, setValueGenerateType] = useState<
    'auto_increment' | 'same_as_name' | 'manual'
  >('manual');

  // 根据 category_code 判断值生成类型
  useEffect(() => {
    if (!editingRecord && categoryCode) {
      if (categoryCode in AUTO_INS_GENERATE_VALUE) {
        setValueGenerateType('auto_increment');
      } else if (AUTO_INS_SAME_KEY_VALUE.includes(categoryCode)) {
        setValueGenerateType('same_as_name');
      } else {
        setValueGenerateType('manual');
      }
    } else {
      setValueGenerateType('manual');
    }
  }, [categoryCode, editingRecord]);

  // 获取字典值的提示文本
  const getValueExtra = () => {
    if (editingRecord) {
      return undefined;
    }
    if (valueGenerateType === 'auto_increment') {
      return '系统将自动生成值（取当前最大值+1）';
    }
    if (valueGenerateType === 'same_as_name') {
      return '系统将自动将值设置为与字典名称相同';
    }
    return undefined;
  };

  // 获取字典值的占位符
  const getValuePlaceholder = () => {
    if (editingRecord) {
      return '请输入字典值';
    }
    if (valueGenerateType === 'auto_increment') {
      return '系统自动生成';
    }
    if (valueGenerateType === 'same_as_name') {
      return '系统自动设置为字典名称';
    }
    return '请输入字典值';
  };
  return (
    <ModalForm
      key={editingRecord ? `edit-${editingRecord.dictionary_id}` : 'add'}
      title={editingRecord ? '编辑数据字典' : '新增数据字典'}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      onFinish={async (values) => {
        // 定义所有表单字段，确保它们都被包含
        const allFormFields = [
          'dictionary_name',
          'dictionary_value',
          'dictionary_desc',
          'sort',
        ];
        // 确保所有字段都被包含
        const completeValues = ensureAllFormFields(
          formRef,
          values,
          allFormFields,
        );
        // 自动添加 category_id（从编辑记录或默认值）
        const submitValues: any = {
          ...completeValues,
          category_id:
            editingRecord?.category_id || defaultCategoryId || undefined,
        };
        // 新增时，如果没有 category_id，不允许提交
        if (!editingRecord && !submitValues.category_id) {
          return false;
        }
        // 如果是自动生成值的情况，不传递 dictionary_value，让后端自动处理
        if (
          !editingRecord &&
          (valueGenerateType === 'auto_increment' ||
            valueGenerateType === 'same_as_name')
        ) {
          delete submitValues.dictionary_value;
        }
        await onSubmit(submitValues);
      }}
      request={async () => {
        if (editingRecord) {
          return {
            dictionary_name: editingRecord.dictionary_name,
            dictionary_value: editingRecord.dictionary_value,
            dictionary_desc: editingRecord.dictionary_desc,
            sort: editingRecord.sort ?? 0,
          };
        }
        return {
          sort: 0,
        };
      }}
      modalProps={{
        destroyOnHidden: true,
      }}
      width={MODAL_WIDTH.SMALL_MEDIUM}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      layout="horizontal"
      labelAlign="right"
    >
      <ProFormText
        name="dictionary_name"
        label="字典名称"
        rules={[{ required: true, message: '请输入字典名称' }]}
        fieldProps={{
          placeholder: '请输入字典名称',
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormText
        name="dictionary_value"
        label="字典值"
        rules={
          valueGenerateType === 'manual' && !editingRecord
            ? [{ required: true, message: '请输入字典值' }]
            : []
        }
        fieldProps={{
          placeholder: getValuePlaceholder(),
          disabled:
            !editingRecord &&
            (valueGenerateType === 'auto_increment' ||
              valueGenerateType === 'same_as_name'),
          maxLength: 100,
          showCount: true,
        }}
        extra={getValueExtra()}
      />
      <ProFormTextArea
        name="dictionary_desc"
        label="字典描述"
        fieldProps={{
          placeholder: '请输入字典描述',
          rows: 3,
          maxLength: 500,
          showCount: true,
        }}
      />
      <ProFormDigit
        name="sort"
        label="排序"
        fieldProps={{
          placeholder: '请输入排序值',
          min: 0,
          style: { width: 100 },
        }}
        extra="数字越小越靠前，默认为0"
      />
    </ModalForm>
  );
};

export default DictionaryForm;
