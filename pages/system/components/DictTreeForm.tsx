import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import React, { useEffect, useRef, useState } from 'react';
import { getFullTreeDataForHtml } from '@/modules/admin/services/system';
import { ensureAllFormFields } from '@/modules/base/utils/constants';

interface DictTreeFormProps {
  visible: boolean;
  editingRecord: any;
  isAddChild?: boolean;
  isMove?: boolean;
  selectedType: string;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
  getOrganizationList: (params?: any) => Promise<any>;
  selectedTypeForFilter: string;
}

const DictTreeForm: React.FC<DictTreeFormProps> = ({
  visible,
  editingRecord,
  isAddChild = false,
  isMove = false,
  selectedType,
  onCancel,
  onSubmit,
  getOrganizationList,
  selectedTypeForFilter,
}) => {
  const formRef = useRef<ProFormInstance>(undefined);
  const [parentOptions, setParentOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);

  useEffect(() => {
    if (visible) {
      loadParentOptions();
    }
  }, [visible, selectedTypeForFilter]);

  const loadParentOptions = async () => {
    try {
      // 使用新的接口获取扁平化的组织架构数据（带占位符）
      const res = await getFullTreeDataForHtml({
        organization_tid: Number(selectedTypeForFilter),
        fields: 'organization_id,organization_name',
      });
      if (res.code === 200 && res.data) {
        // 新接口返回的数据已经是扁平化的，直接处理
        let options = res.data.map((item: any) => ({
          label: item.organization_name,
          // 兼容 organization_id 和 organization_pid 两种字段名
          value: item.organization_id ?? item.organization_pid,
        }));

        // 如果是移动操作，排除自己（无法排除子级，因为新接口没有提供层级信息）
        if (isMove && editingRecord) {
          options = options.filter(
            (option) => option.value !== editingRecord.organization_id,
          );
        }
        // 如果是编辑操作，排除自己
        if (!isMove && !isAddChild && editingRecord) {
          options = options.filter(
            (option) => option.value !== editingRecord.organization_id,
          );
        }
        // 如果是添加下级，排除自己
        if (isAddChild && editingRecord) {
          options = options.filter(
            (option) => option.value !== editingRecord.organization_id,
          );
        }

        setParentOptions(options);
      }
    } catch (error) {
      console.error('加载父级选项失败:', error);
    }
  };

  const getTitle = () => {
    if (isMove) {
      return '移动组织架构';
    }
    if (isAddChild) {
      return '添加下级组织架构';
    }
    return editingRecord ? '编辑组织架构' : '新增组织架构';
  };

  const getInitialValues = () => {
    if (isMove) {
      const initialValues: any = {};
      // 只有当 organization_pid 有值（非0）时，才设置初始值
      if (
        editingRecord?.organization_pid &&
        editingRecord.organization_pid !== 0
      ) {
        initialValues.belong_organization_id = editingRecord.organization_pid;
      }
      return initialValues;
    }
    if (isAddChild) {
      // 添加下级时，默认上级为当前记录的ID
      return {
        organization_pid: editingRecord?.organization_id || 0,
      };
    }
    if (editingRecord) {
      // 编辑时
      const initialValues: any = {
        organization_name: editingRecord.organization_name,
      };
      // 只有当 organization_pid 有值（非0）时，才设置初始值
      if (
        editingRecord.organization_pid &&
        editingRecord.organization_pid !== 0
      ) {
        initialValues.organization_pid = editingRecord.organization_pid;
      }
      return initialValues;
    }
    // 新增时，不设置默认值
    return {};
  };

  return (
    <ModalForm
      formRef={formRef}
      title={getTitle()}
      open={visible}
      modalProps={{
        onCancel: () => {
          onCancel();
        },
        destroyOnHidden: true,
      }}
      onFinish={async (values) => {
        // 定义所有表单字段，确保它们都被包含
        const allFormFields = isMove
          ? ['belong_organization_id']
          : ['organization_name', 'organization_pid'];
        // 确保所有字段都被包含
        const completeValues = ensureAllFormFields(
          formRef,
          values,
          allFormFields,
        );
        // 如果是添加下级，确保 organization_pid 被正确设置
        if (isAddChild && editingRecord) {
          completeValues.organization_pid = editingRecord.organization_id;
        }
        await onSubmit(completeValues);
        return true;
      }}
      initialValues={getInitialValues()}
      width={600}
    >
      {isMove ? (
        <ProFormSelect
          name="belong_organization_id"
          label="目标组织架构"
          options={parentOptions}
          fieldProps={{
            placeholder: '请选择目标组织架构（不选则移动到顶级）',
            showSearch: true,
            allowClear: true,
            filterOption: (input, option) => {
              // 支持搜索，移除占位符后进行匹配
              const label = option?.label as string;
              if (!label) return false;
              // 移除占位符符号（├─、└─、│等）和空格，只保留实际的组织名称
              const cleanLabel = label.replace(/[├└│─\s]/g, '').toLowerCase();
              const cleanInput = input.trim().toLowerCase();
              return cleanLabel.includes(cleanInput);
            },
          }}
          extra="选择要将此组织架构移动到的目标组织架构，不选择则移动到顶级"
        />
      ) : (
        <div>
          <ProFormText
            name="organization_name"
            label="组织名称"
            rules={[{ required: true, message: '请输入组织名称' }]}
            fieldProps={{
              placeholder: '请输入组织名称',
              autoFocus: true,
              maxLength: 100,
              showCount: true,
            }}
          />
          {isAddChild ? (
            <ProFormText
              name="organization_pid_display"
              label="上级组织架构"
              fieldProps={{
                value: editingRecord?.organization_name || '',
                disabled: true,
              }}
              extra="将在当前组织架构下创建子级组织架构"
            />
          ) : (
            <ProFormSelect
              name="organization_pid"
              label="上级组织架构"
              options={parentOptions}
              fieldProps={{
                placeholder: '请选择上级组织架构（不选则为顶级）',
                showSearch: true,
                filterOption: (input, option) => {
                  // 支持搜索，移除占位符后进行匹配
                  const label = option?.label as string;
                  if (!label) return false;
                  // 移除占位符符号（├─、└─、│等）和空格，只保留实际的组织名称
                  const cleanLabel = label
                    .replace(/[├└│─\s]/g, '')
                    .toLowerCase();
                  const cleanInput = input.trim().toLowerCase();
                  return cleanLabel.includes(cleanInput);
                },
              }}
              extra="不选择则作为顶级组织架构创建"
            />
          )}
        </div>
      )}
    </ModalForm>
  );
};

export default DictTreeForm;
