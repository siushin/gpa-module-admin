import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getDepartmentList,
  getDepartmentTreeDataForHtml,
} from '@/modules/admin/services/company';
import { getAdminListAll } from '@/modules/admin/services/system';
import { MODAL_WIDTH } from '@/modules/base/utils/constants';

interface DepartmentFormProps {
  visible: boolean;
  editingRecord: any;
  searchCompanyId?: number; // 搜索条件中的公司ID（用于新增模式）
  companyOptions?: Array<{ label: string; value: number }>; // 从搜索栏传入的公司选项
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  visible,
  editingRecord,
  searchCompanyId,
  companyOptions: propCompanyOptions = [],
  onCancel,
  onSubmit,
}) => {
  const formRef = useRef<ProFormInstance>(undefined);
  const [formKey, setFormKey] = useState<string>(
    editingRecord?.department_id || `new-${Date.now()}`,
  );
  const [parentOptions, setParentOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [managerOptions, setManagerOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [isManagerOptionsReady, setIsManagerOptionsReady] = useState(false);

  // 初始化表单 key，确保表单正确重置
  useEffect(() => {
    if (visible) {
      if (!editingRecord) {
        setFormKey(`new-${Date.now()}`);
      } else {
        setFormKey(editingRecord.department_id || `edit-${Date.now()}`);
      }
    }
  }, [visible, editingRecord]);

  useEffect(() => {
    if (visible) {
      setIsManagerOptionsReady(false);
      // 判断是否为编辑模式（有 department_id）
      const isEditMode = editingRecord?.department_id;
      // 如果编辑模式或有 company_id（包括添加下级模式），加载对应公司的部门列表和管理员列表
      if (editingRecord?.company_id) {
        // 先加载管理员列表，确保选项已准备好
        loadManagerOptions(editingRecord.company_id);
        // 加载部门列表
        loadParentOptionsByCompany(editingRecord.company_id);
      } else {
        // 新增模式
        // 如果搜索条件中有公司ID，使用搜索条件中的公司ID
        const companyId = searchCompanyId;
        if (companyId) {
          // 有公司ID，先加载管理员列表，再加载部门列表
          loadManagerOptions(companyId);
          loadParentOptionsByCompany(companyId);
        } else {
          // 没有公司ID，加载所有部门和管理员
          loadParentOptions();
          loadManagerOptions();
        }
      }
    }
  }, [visible, editingRecord]);

  // 当管理员选项准备好后，设置表单初始值
  useEffect(() => {
    if (!visible || !isManagerOptionsReady || !formRef.current) {
      return;
    }

    const isEditMode = editingRecord?.department_id;

    // 如果编辑模式且有 manager_id，确保对应的选项在 managerOptions 中
    if (isEditMode && editingRecord?.manager_id) {
      const managerId = Number(editingRecord.manager_id);
      const hasManagerOption = managerOptions.some(
        (opt) => Number(opt.value) === managerId,
      );
      // 如果选项不存在，说明可能还没有加载完成，等待一下
      if (!hasManagerOption && managerOptions.length > 0) {
        // 选项已加载但不存在对应的选项，可能是数据问题，继续设置
      } else if (!hasManagerOption) {
        // 选项还没有加载完成，等待
        return;
      }
    }

    if (editingRecord?.company_id) {
      // 编辑模式或添加下级模式
      if (isEditMode) {
        // 编辑模式：设置所有字段
        // 使用双重 requestAnimationFrame 确保 ProFormSelect 已经渲染完成并且 options 已经更新
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (formRef.current) {
              formRef.current.setFieldsValue({
                ...editingRecord,
                company_id: editingRecord.company_id,
                parent_id: editingRecord.parent_id ?? 0,
                manager_id: editingRecord.manager_id,
                status: editingRecord.status ?? 1,
                sort: editingRecord.sort ?? 0,
              });
            }
          });
        });
      } else {
        // 添加下级模式：只设置父级部门和公司
        formRef.current.setFieldsValue({
          company_id: editingRecord.company_id,
          parent_id: editingRecord.parent_id ?? 0,
          status: 1,
          sort: 0,
        });
      }
    } else {
      // 新增模式
      const companyId = searchCompanyId;
      if (companyId) {
        formRef.current.setFieldsValue({
          company_id: companyId,
          parent_id: 0,
          status: 1,
          sort: 0,
        });
      }
    }
  }, [
    visible,
    isManagerOptionsReady,
    managerOptions,
    editingRecord,
    searchCompanyId,
  ]);

  const loadParentOptions = async () => {
    try {
      const res = await getDepartmentList();
      if (res.code === 200 && res.data) {
        // 将树形数据转换为扁平列表
        const flattenData = (data: any[]): any[] => {
          const result: any[] = [];
          data.forEach((item) => {
            result.push({
              label: item.department_name,
              value: item.department_id,
            });
            if (item.children && item.children.length > 0) {
              result.push(...flattenData(item.children));
            }
          });
          return result;
        };
        const options = flattenData(res.data);
        // 编辑时，排除自己和子级
        if (editingRecord?.department_id) {
          const excludeIds = [editingRecord.department_id];
          // 递归获取所有子部门ID
          const getAllChildIds = (data: any[], parentId: number): number[] => {
            const childIds: number[] = [];
            data.forEach((item) => {
              if (item.parent_id === parentId) {
                childIds.push(item.department_id);
                childIds.push(...getAllChildIds(data, item.department_id));
              }
            });
            return childIds;
          };
          const allData = flattenData(res.data);
          const childIds = getAllChildIds(allData, editingRecord.department_id);
          excludeIds.push(...childIds);
          setParentOptions(
            options.filter((opt) => !excludeIds.includes(opt.value)),
          );
        } else {
          setParentOptions(options);
        }
      } else {
        // API 返回错误，但不显示错误提示（因为这是后台加载）
        console.warn('加载父级选项失败:', res.message);
        setParentOptions([]);
      }
    } catch (error: any) {
      // 网络错误或其他异常，但不显示错误提示（因为这是后台加载）
      console.error('加载父级选项失败:', error);
      setParentOptions([]);
    }
  };

  const loadParentOptionsByCompany = async (
    companyId: number,
  ): Promise<void> => {
    try {
      // 验证 companyId
      if (!companyId || companyId <= 0) {
        console.warn('无效的公司ID:', companyId);
        setParentOptions([]);
        return;
      }

      // 先获取树形数据用于排除子级
      const treeRes = await getDepartmentList({
        company_id: companyId,
      });

      // 获取格式化后的数据用于显示
      const res = await getDepartmentTreeDataForHtml({
        company_id: companyId,
      });

      if (res.code === 200 && res.data) {
        // TreeHtmlFormatter 返回的数据已经是扁平化的，包含格式化后的名称
        const options = res.data.map((item: any) => ({
          label: item.department_name, // 已经包含层级缩进
          value: item.department_id,
        }));

        // 编辑时，排除自己和子级（只有编辑模式才需要排除）
        if (editingRecord?.department_id) {
          const excludeIds = [editingRecord.department_id];

          // 从树形数据中递归获取所有子部门ID
          if (treeRes.code === 200 && treeRes.data) {
            const flattenData = (data: any[]): any[] => {
              const result: any[] = [];
              data.forEach((item) => {
                result.push(item);
                if (item.children && item.children.length > 0) {
                  result.push(...flattenData(item.children));
                }
              });
              return result;
            };

            const getAllChildIds = (
              data: any[],
              parentId: number,
            ): number[] => {
              const childIds: number[] = [];
              data.forEach((item) => {
                if (item.parent_id === parentId) {
                  childIds.push(item.department_id);
                  childIds.push(...getAllChildIds(data, item.department_id));
                }
              });
              return childIds;
            };

            const allData = flattenData(treeRes.data);
            const childIds = getAllChildIds(
              allData,
              editingRecord.department_id,
            );
            excludeIds.push(...childIds);
          }

          setParentOptions(
            options.filter((opt) => !excludeIds.includes(opt.value)),
          );
        } else {
          setParentOptions(options);
        }
      } else {
        // API 返回错误，但不显示错误提示（因为这是后台加载）
        console.warn('加载父级选项失败:', res.message);
        setParentOptions([]);
      }
    } catch (error: any) {
      // 网络错误或其他异常，但不显示错误提示（因为这是后台加载）
      console.error('根据公司加载父级选项失败:', error);
      setParentOptions([]);
    }
  };

  const loadManagerOptions = async (
    companyId?: number,
  ): Promise<Array<{ label: string; value: number }>> => {
    try {
      const params: any = {
        status: 1, // 只加载正常状态的管理员
      };
      // 如果传入了公司ID，则根据公司ID过滤管理员
      if (companyId) {
        params.company_id = companyId;
      }
      const res = await getAdminListAll(params);
      if (res.code === 200 && res.data) {
        const options = res.data.map((item: any) => {
          const displayName = item.name || item.nickname || item.username;
          return {
            label: `${displayName} (${item.username})`,
            value: Number(item.account_id), // 确保类型为 number
          };
        });
        setManagerOptions(options);
        setIsManagerOptionsReady(true);
        return options;
      } else {
        // API 返回错误，但不显示错误提示（因为这是后台加载）
        console.warn('加载管理员选项失败:', res.message);
        setManagerOptions([]);
        setIsManagerOptionsReady(true);
        return [];
      }
    } catch (error: any) {
      // 网络错误或其他异常，但不显示错误提示（因为这是后台加载）
      console.error('加载管理员选项失败:', error);
      setManagerOptions([]);
      setIsManagerOptionsReady(true);
      return [];
    }
  };

  // 设置表单初始值（使用 setFieldsValue 避免 initialValues 警告）
  useEffect(() => {
    if (visible && formRef.current) {
      // 如果是新增模式，直接设置默认值
      if (!editingRecord) {
        const timer = setTimeout(() => {
          if (formRef.current) {
            formRef.current.setFieldsValue({
              parent_id: 0,
              status: 1,
              sort: 0,
            });
          }
        }, 100);
        return () => clearTimeout(timer);
      }
      // 编辑模式下的表单值设置已经在 loadParentOptionsByCompany 的回调中处理
      // 这里只处理没有 company_id 的情况
      if (editingRecord && !editingRecord.company_id) {
        const timer = setTimeout(() => {
          if (formRef.current) {
            formRef.current.setFieldsValue({
              ...editingRecord,
              parent_id: editingRecord.parent_id ?? 0,
              status: editingRecord.status ?? 1,
              sort: editingRecord.sort ?? 0,
            });
          }
        }, 100);
        return () => clearTimeout(timer);
      }
      // 如果有 company_id，表单值会在 loadParentOptionsByCompany 完成后设置
      return undefined;
    }
    return undefined;
  }, [visible, editingRecord]);

  return (
    <DrawerForm
      key={formKey}
      formRef={formRef}
      title={
        editingRecord?.department_id
          ? '编辑部门'
          : editingRecord?.parent_id
            ? '添加下级部门'
            : '新增部门'
      }
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      onFinish={async (values) => {
        // 获取表单所有字段的值，确保所有字段都被包含（包括空值）
        const allValues = formRef.current?.getFieldsValue() || {};
        // 定义所有表单字段，确保它们都被包含
        const allFormFields = [
          'company_id',
          'department_name',
          'department_code',
          'parent_id',
          'manager_id',
          'description',
          'status',
          'sort',
        ];
        // 构建完整的表单值，确保所有字段都被包含
        const completeValues: any = {};
        allFormFields.forEach((field) => {
          // 优先使用 values 中的值，如果没有则使用 allValues 中的值，都没有则使用空字符串
          let fieldValue =
            values[field] !== undefined
              ? values[field]
              : allValues[field] !== undefined
                ? allValues[field]
                : '';

          // 特殊处理：manager_id 空字符串应该转为 null
          if (field === 'manager_id' && fieldValue === '') {
            fieldValue = null;
          }

          // 特殊处理：parent_id 空字符串或 null 应该转为 0（顶级部门）
          if (
            field === 'parent_id' &&
            (fieldValue === '' ||
              fieldValue === null ||
              fieldValue === undefined)
          ) {
            fieldValue = 0;
          }

          // 特殊处理：sort 空字符串或 null 应该转为 0
          if (
            field === 'sort' &&
            (fieldValue === '' ||
              fieldValue === null ||
              fieldValue === undefined)
          ) {
            fieldValue = 0;
          }

          // 特殊处理：status 必须为 0 或 1
          if (
            field === 'status' &&
            (fieldValue === '' ||
              fieldValue === null ||
              fieldValue === undefined)
          ) {
            fieldValue = 1; // 默认为正常状态
          }

          completeValues[field] = fieldValue;
        });

        // 验证必填字段
        if (
          !completeValues.department_name ||
          completeValues.department_name.trim() === ''
        ) {
          message.error('部门名称不能为空');
          return false;
        }

        // 验证部门名称长度
        if (completeValues.department_name.length > 100) {
          message.error('部门名称不能超过100个字符');
          return false;
        }

        // 验证部门编码长度（如果提供）
        if (
          completeValues.department_code &&
          completeValues.department_code.length > 50
        ) {
          message.error('部门编码不能超过50个字符');
          return false;
        }

        // 验证描述长度（如果提供）
        if (
          completeValues.description &&
          completeValues.description.length > 500
        ) {
          message.error('部门描述不能超过500个字符');
          return false;
        }

        // 验证 company_id（新增时必须提供）
        const isEditMode = editingRecord?.department_id;
        if (
          !isEditMode &&
          (!completeValues.company_id || completeValues.company_id === '')
        ) {
          message.error('请选择所属公司');
          return false;
        }

        // 验证 sort 范围（0-999999）
        if (completeValues.sort !== null && completeValues.sort !== undefined) {
          const sortValue = Number(completeValues.sort);
          if (isNaN(sortValue) || sortValue < 0 || sortValue > 999999) {
            message.error('排序值必须在0-999999之间');
            return false;
          }
          completeValues.sort = Math.floor(sortValue); // 确保是整数
        }

        await onSubmit(completeValues);
        return true;
      }}
      width={MODAL_WIDTH.MEDIUM}
      layout="horizontal"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
    >
      <ProFormSelect
        name="company_id"
        label="所属公司"
        options={propCompanyOptions}
        disabled
        fieldProps={{
          placeholder: '请选择所属公司（可选）',
          showSearch: true,
          allowClear: false,
          filterOption: (input: string, option: any) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
        }}
      />
      <ProFormText
        name="department_name"
        label="部门名称"
        rules={[
          { required: true, message: '请输入部门名称' },
          { max: 100, message: '部门名称不能超过100个字符' },
          {
            validator: (_, value) => {
              if (value && value.trim() === '') {
                return Promise.reject(new Error('部门名称不能为空格'));
              }
              return Promise.resolve();
            },
          },
        ]}
        fieldProps={{
          placeholder: '请输入部门名称（最多100个字符）',
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormText
        name="department_code"
        label="部门编码"
        rules={[{ max: 50, message: '部门编码不能超过50个字符' }]}
        fieldProps={{
          placeholder: '请输入部门编码（可选，最多50个字符）',
          maxLength: 50,
          showCount: true,
        }}
      />
      <ProFormSelect
        name="parent_id"
        label="上级部门"
        options={[{ label: '顶级部门', value: 0 }, ...parentOptions]}
        disabled={!!(editingRecord?.parent_id && !editingRecord?.department_id)}
        fieldProps={{
          placeholder: '请选择上级部门（不选则为顶级）',
          showSearch: true,
        }}
      />
      <ProFormSelect
        name="manager_id"
        label="部门负责人"
        options={managerOptions}
        fieldProps={{
          placeholder: '请选择部门负责人（可选）',
          showSearch: true,
          allowClear: true,
          filterOption: (input: string, option: any) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
        }}
      />
      <ProFormTextArea
        name="description"
        label="部门描述"
        rules={[{ max: 500, message: '部门描述不能超过500个字符' }]}
        fieldProps={{
          placeholder: '请输入部门描述（可选，最多500个字符）',
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
      <ProFormDigit
        name="sort"
        label="排序"
        rules={[
          {
            validator: (_, value) => {
              if (value !== undefined && value !== null && value !== '') {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 999999) {
                  return Promise.reject(new Error('排序值必须在0-999999之间'));
                }
              }
              return Promise.resolve();
            },
          },
        ]}
        fieldProps={{
          placeholder: '请输入排序值（0-999999）',
          min: 0,
          max: 999999,
          precision: 0,
        }}
      />
    </DrawerForm>
  );
};

export default DepartmentForm;
