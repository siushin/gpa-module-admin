import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { getDepartmentTreeDataForHtml } from '@/modules/admin/services/company';
import { getAdminRoles, getCompanyList } from '@/modules/admin/services/system';
import { ensureAllFormFields } from '@/modules/base/utils/constants';

interface AdminFormProps {
  visible: boolean;
  editingRecord: any;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const AdminForm: React.FC<AdminFormProps> = ({
  visible,
  editingRecord,
  onCancel,
  onSubmit,
}) => {
  const [companyOptions, setCompanyOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [roleOptions, setRoleOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    number | undefined
  >(undefined);
  const [formKey, setFormKey] = useState<string>(
    editingRecord?.id ||
      editingRecord?.user_id ||
      editingRecord?.account_id ||
      `new-${Date.now()}`,
  );
  const formRef = useRef<ProFormInstance>(undefined);

  // 加载公司列表
  useEffect(() => {
    if (visible) {
      getCompanyList().then((res) => {
        if (res.code === 200 && res.data) {
          setCompanyOptions(
            res.data.map((item) => ({
              label: item.company_name,
              value: item.company_id,
            })),
          );
        }
      });
    }
  }, [visible]);

  // 加载角色列表
  const loadRoleOptions = async (accountId?: number) => {
    setLoadingRoles(true);
    try {
      // 如果有 accountId，获取该账号的角色；否则获取所有可用角色
      const res = await getAdminRoles({ account_id: accountId || 0 });
      if (res.code === 200 && res.data) {
        setRoleOptions(
          res.data.all_roles.map((item) => ({
            label: item.role_name,
            value: item.role_id,
          })),
        );
        return res.data.checked_role_ids || [];
      }
    } catch (error) {
      console.error('加载角色列表失败:', error);
    } finally {
      setLoadingRoles(false);
    }
    return [];
  };

  // 加载角色选项
  useEffect(() => {
    if (visible) {
      if (editingRecord?.account_id) {
        // 编辑模式：加载角色并设置已选中的角色
        loadRoleOptions(editingRecord.account_id).then((checkedRoleIds) => {
          if (formRef.current && checkedRoleIds.length > 0) {
            setTimeout(() => {
              formRef.current?.setFieldsValue({ role_ids: checkedRoleIds });
            }, 100);
          }
        });
      } else {
        // 新增模式：只加载角色选项
        loadRoleOptions();
      }
    }
  }, [visible, editingRecord?.account_id]);

  // 加载部门列表（根据选择的公司）
  const loadDepartmentOptions = async (companyId?: number) => {
    if (!companyId) {
      setDepartmentOptions([]);
      setLoadingDepartments(false);
      return;
    }
    try {
      setLoadingDepartments(true);
      const params = { company_id: companyId };
      const res = await getDepartmentTreeDataForHtml(params);
      if (res.code === 200 && res.data) {
        setDepartmentOptions(
          res.data.map((item) => ({
            label: item.department_name,
            value: item.department_id,
          })),
        );
      } else {
        setDepartmentOptions([]);
      }
    } catch (error) {
      console.error('加载部门列表失败:', error);
      setDepartmentOptions([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // 监听公司选择变化，加载对应的部门列表
  useEffect(() => {
    if (visible) {
      if (editingRecord?.company_id) {
        // 编辑模式下，如果有公司ID，立即加载对应的部门列表
        setSelectedCompanyId(editingRecord.company_id);
        loadDepartmentOptions(editingRecord.company_id);
      } else if (!editingRecord) {
        // 新增模式下，清空部门列表和选中的公司
        setDepartmentOptions([]);
        setLoadingDepartments(false);
        setSelectedCompanyId(undefined);
      }
    }
  }, [visible, editingRecord]);

  // 初始化表单 key
  useEffect(() => {
    if (visible) {
      // 新增时，每次打开都生成新的 key，确保表单被重置
      if (!editingRecord) {
        setFormKey(`new-${Date.now()}`);
      } else {
        setFormKey(
          editingRecord.id ||
            editingRecord.user_id ||
            editingRecord.account_id ||
            `edit-${Date.now()}`,
        );
      }
    }
  }, [visible, editingRecord]);

  // 设置表单初始值（解决 initialValues 异步加载警告）
  useEffect(() => {
    if (visible && formRef.current) {
      // 先重置表单
      formRef.current.resetFields();

      if (editingRecord) {
        // 编辑模式：设置编辑记录的值
        const formValues: any = {
          ...editingRecord,
          // admin账号强制状态为正常
          status:
            editingRecord.username === 'admin'
              ? true
              : editingRecord.status === 1,
        };

        // 如果有部门ID列表，转换为数组格式
        if (editingRecord.department_ids) {
          formValues.department_ids = Array.isArray(
            editingRecord.department_ids,
          )
            ? editingRecord.department_ids
            : [editingRecord.department_ids];
        }

        // 延迟设置表单值，确保表单已经渲染完成
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.setFieldsValue(formValues);
          }
        }, 50);

        // 如果有公司ID，确保 selectedCompanyId 已设置（部门数据会在另一个 useEffect 中加载）
        if (editingRecord.company_id) {
          setSelectedCompanyId(editingRecord.company_id);
        }
      } else {
        // 新增模式：设置默认值
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.setFieldsValue({
              status: true,
              is_super: 0,
            });
          }
        }, 50);
      }
    }
  }, [visible, editingRecord]);

  return (
    <DrawerForm
      key={formKey}
      formRef={formRef}
      title={editingRecord ? '编辑管理员' : '新增管理员'}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          // 关闭表单时重置状态
          setDepartmentOptions([]);
          setLoadingDepartments(false);
          setSelectedCompanyId(undefined);
          setRoleOptions([]);
          setLoadingRoles(false);
          onCancel();
        }
      }}
      onFinish={async (values) => {
        // 定义所有表单字段，确保它们都被包含
        const allFormFields = [
          'username',
          'password',
          'nickname',
          'phone',
          'email',
          'company_id',
          'department_ids',
          'role_ids',
          'is_super',
          'status',
        ];
        // 确保所有字段都被包含
        const completeValues = ensureAllFormFields(
          formRef,
          values,
          allFormFields,
        );
        // 将 status 的 boolean 值转换为 1/0
        const submitValues: any = {
          ...completeValues,
          status: completeValues.status ? 1 : 0,
        };
        // admin账号不能修改状态和超级管理员设置，强制使用原始值
        if (editingRecord && editingRecord.username === 'admin') {
          submitValues.status = 1; // 强制为正常状态
          submitValues.is_super = editingRecord.is_super; // 保持原始超级管理员状态
        }
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
          suffix:
            editingRecord && editingRecord.username === 'admin' ? (
              <Tooltip title="admin账号的用户名不能修改">
                <ExclamationCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            ) : undefined,
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
      <ProFormText
        name="nickname"
        label="姓名"
        fieldProps={{
          placeholder: '请输入姓名',
          maxLength: 50,
          showCount: true,
        }}
      />
      <ProFormText
        name="phone"
        label="手机号"
        fieldProps={{
          placeholder: '请输入手机号',
          maxLength: 20,
          showCount: true,
        }}
      />
      <ProFormText
        name="email"
        label="邮箱"
        fieldProps={{
          placeholder: '请输入邮箱',
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormSelect
        name="company_id"
        label="所属公司"
        options={companyOptions}
        fieldProps={{
          id: 'admin_form_company_id',
          placeholder: '请选择所属公司',
          showSearch: true,
          filterOption: (input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          style: { minWidth: 200 },
          onChange: (value: number | undefined) => {
            // 公司变化时，重新加载部门列表并清空已选择的部门
            setSelectedCompanyId(value);
            if (formRef.current) {
              // 清空已选择的部门
              formRef.current.setFieldsValue({ department_ids: undefined });
              // 清空部门列表数据
              setDepartmentOptions([]);
              // 如果选择了公司，加载对应的部门列表
              if (value) {
                loadDepartmentOptions(value);
              } else {
                setLoadingDepartments(false);
              }
            }
          },
        }}
      />
      <ProFormSelect
        name="department_ids"
        label="所属部门"
        options={departmentOptions}
        fieldProps={{
          placeholder: loadingDepartments
            ? '正在加载部门数据...'
            : departmentOptions.length > 0
              ? '请选择所属部门'
              : '请先选择所属公司',
          mode: 'multiple',
          showSearch: true,
          filterOption: (input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          style: { minWidth: 200 },
          maxTagCount: 'responsive',
          loading: loadingDepartments,
          disabled: !selectedCompanyId && departmentOptions.length === 0,
        }}
        extra="支持多选，请先选择所属公司"
      />
      <ProFormRadio.Group
        name="is_super"
        label="是否超级管理员"
        initialValue={0}
        extra={
          editingRecord && editingRecord.username === 'admin' ? (
            <Tooltip title="admin账号的超级管理员状态不能修改">
              <span style={{ color: '#999', fontSize: '12px' }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                admin账号的超级管理员状态不能修改
              </span>
            </Tooltip>
          ) : undefined
        }
        options={[
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ]}
        rules={[{ required: true, message: '请选择是否超级管理员' }]}
        fieldProps={{
          disabled: editingRecord && editingRecord.username === 'admin',
          onChange: (e) => {
            // 切换为超管时，清空已选择的角色
            if (e.target.value === 1 && formRef.current) {
              formRef.current.setFieldsValue({ role_ids: [] });
            }
          },
        }}
      />
      <ProFormDependency name={['is_super']}>
        {({ is_super }) =>
          is_super !== 1 && (
            <ProFormSelect
              name="role_ids"
              label="分配角色"
              options={roleOptions}
              fieldProps={{
                placeholder: loadingRoles
                  ? '正在加载角色数据...'
                  : '请选择角色',
                mode: 'multiple',
                showSearch: true,
                filterOption: (input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase()),
                style: { minWidth: 200 },
                maxTagCount: 'responsive',
                loading: loadingRoles,
              }}
              extra="支持多选"
            />
          )
        }
      </ProFormDependency>
      <ProFormRadio.Group
        name="status"
        label="账号状态"
        initialValue={true}
        extra={
          editingRecord && editingRecord.username === 'admin' ? (
            <Tooltip title="admin账号不能禁用，状态固定为正常">
              <span style={{ color: '#999', fontSize: '12px' }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                admin账号不能禁用
              </span>
            </Tooltip>
          ) : undefined
        }
        options={[
          { label: '正常', value: true },
          { label: '禁用', value: false },
        ]}
        fieldProps={{
          disabled: editingRecord && editingRecord.username === 'admin',
        }}
      />
    </DrawerForm>
  );
};

export default AdminForm;
