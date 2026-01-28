import { PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Drawer, message, Popconfirm, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  addDepartment,
  deleteDepartment,
  getCompanyList,
  getDepartmentList,
  updateDepartment,
} from '@/modules/admin/services/company';
import * as systemApi from '@/modules/admin/services/system';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  processFormValues,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import { dateRangeFieldProps } from '@/modules/base/utils/datePresets';
import DepartmentDetail from './components/DepartmentDetail';
import DepartmentForm from './components/DepartmentForm';

const Department: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const searchFormRef = useRef<ProFormInstance>(undefined);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [currentSearchCompanyId, setCurrentSearchCompanyId] = useState<
    number | undefined
  >(undefined);
  const [companyOptions, setCompanyOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [employeeDrawerVisible, setEmployeeDrawerVisible] = useState(false);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<number | null>(
    null,
  );
  const [currentDepartmentName, setCurrentDepartmentName] =
    useState<string>('');
  const [currentDepartmentCompanyId, setCurrentDepartmentCompanyId] = useState<
    number | null
  >(null);
  const employeeActionRef = useRef<ActionType>(null);
  const [employeePageSize, setEmployeePageSize] =
    useState<number>(DEFAULT_PAGE_SIZE);
  const [selectedEmployeeRows, setSelectedEmployeeRows] = useState<any[]>([]);

  const handleAdd = () => {
    // 检查是否有可用的公司
    if (!currentSearchCompanyId && companyOptions.length === 0) {
      message.warning('请先创建公司，然后再添加部门');
      return;
    }
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleAddChild = (record: any) => {
    // 验证记录是否有效
    if (!record || !record.department_id) {
      message.error('部门信息不完整，无法添加下级部门');
      return;
    }
    // 添加下级部门，设置父级部门为当前部门
    setEditingRecord({
      parent_id: record.department_id,
      company_id: record.company_id,
    });
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    // 验证记录是否有效
    if (!record || !record.department_id) {
      message.error('部门信息不完整，无法编辑');
      return;
    }
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleDetail = (record: any) => {
    // 验证记录是否有效
    if (!record || !record.department_id) {
      message.error('部门信息不完整，无法查看详情');
      return;
    }
    setDetailRecord(record);
    setDetailVisible(true);
  };

  const handleEmployeeList = (record: any) => {
    // 验证记录是否有效
    if (!record || !record.department_id) {
      message.error('部门信息不完整，无法查看员工列表');
      return;
    }
    setCurrentDepartmentId(record.department_id);
    setCurrentDepartmentName(record.department_name || '');
    setCurrentDepartmentCompanyId(record.company_id || null);
    setEmployeeDrawerVisible(true);
    setSelectedEmployeeRows([]); // 重置选中项
  };

  const handleBatchRemoveEmployees = async () => {
    if (!selectedEmployeeRows || selectedEmployeeRows.length === 0) {
      message.warning('请至少选择一条数据');
      return;
    }
    if (!currentDepartmentCompanyId) {
      message.error('部门所属公司ID不存在，无法移除员工');
      return;
    }

    try {
      const accountIds = selectedEmployeeRows.map((row) => row.account_id);
      // 使用批量移除公司员工的API，移除员工会同时清除部门关联
      const res = await systemApi.batchRemoveAdminFromCompany({
        account_ids: accountIds,
        company_id: currentDepartmentCompanyId,
      });
      if (res.code === 200) {
        message.success(
          `批量移除成功，共移除 ${res.data?.count || 0} 个员工，删除部门关联 ${res.data?.deleted_department_count || 0} 条`,
        );
        setSelectedEmployeeRows([]);
        employeeActionRef.current?.reload();
      } else {
        message.error(res.message || '批量移除失败');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        '批量移除失败';
      message.error(errorMessage);
    }
  };

  const handleDelete = async (record: any) => {
    try {
      // 验证记录是否存在
      if (!record || !record.department_id) {
        message.error('删除失败：部门信息不完整');
        return;
      }

      const res = await deleteDepartment({
        department_id: record.department_id,
      });
      if (res.code === 200) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error: any) {
      // 显示更详细的错误信息
      const errorMessage =
        error?.message || error?.response?.data?.message || '删除失败';
      message.error(errorMessage);
      console.error('删除部门失败:', error);
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      // 处理表单值：将 undefined 转换为空字符串，但某些字段需要特殊处理
      const processedValues = processFormValues(values);

      // 特殊处理：manager_id 空字符串应该转为 null（表示没有负责人）
      if (processedValues.manager_id === '') {
        processedValues.manager_id = null;
      }

      // 验证必填字段
      if (
        !processedValues.department_name ||
        processedValues.department_name.trim() === ''
      ) {
        message.error('部门名称不能为空');
        return;
      }

      // 验证部门名称长度（假设最大100字符）
      if (processedValues.department_name.length > 100) {
        message.error('部门名称不能超过100个字符');
        return;
      }

      // 验证部门编码长度（如果提供）
      if (
        processedValues.department_code &&
        processedValues.department_code.length > 50
      ) {
        message.error('部门编码不能超过50个字符');
        return;
      }

      // 验证描述长度（如果提供）
      if (
        processedValues.description &&
        processedValues.description.length > 500
      ) {
        message.error('部门描述不能超过500个字符');
        return;
      }

      // 验证 company_id（新增时必须提供）
      const isEditMode = editingRecord?.department_id;
      if (
        !isEditMode &&
        (!processedValues.company_id || processedValues.company_id === '')
      ) {
        message.error('请选择所属公司');
        return;
      }

      let res: { code: number; message: string; data?: any };
      if (isEditMode) {
        res = await updateDepartment({
          ...processedValues,
          department_id: editingRecord.department_id,
        });
      } else {
        res = await addDepartment(processedValues);
      }
      if (res.code === 200) {
        message.success(isEditMode ? '更新成功' : '新增成功');
        setFormVisible(false);
        setEditingRecord(null);
        actionRef.current?.reload();
      } else {
        message.error(res.message || (isEditMode ? '更新失败' : '新增失败'));
      }
    } catch (error: any) {
      const isEditMode = editingRecord?.department_id;
      // 显示更详细的错误信息
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        (isEditMode ? '更新失败' : '新增失败');
      message.error(errorMessage);
      console.error('提交表单失败:', error);
    }
  };

  // 加载公司列表选项
  useEffect(() => {
    const loadCompanyOptions = async () => {
      try {
        const res = await getCompanyList({
          page: 1,
          pageSize: 1000,
          status: 1, // 只加载正常状态的公司
        });
        if (res.code === 200 && res.data?.data) {
          const options = res.data.data.map((item: any) => ({
            label: item.company_name,
            value: item.company_id,
          }));
          setCompanyOptions(options);
          // 默认选中第一个公司
          if (options.length > 0) {
            const firstCompanyId = options[0].value;
            setCurrentSearchCompanyId(firstCompanyId);
            // 设置搜索表单的默认值
            if (searchFormRef.current) {
              searchFormRef.current.setFieldsValue({
                company_id: firstCompanyId,
              });
            }
          } else {
            // 如果没有公司选项，提示用户
            message.warning('暂无可用公司，请先创建公司');
            setCurrentSearchCompanyId(undefined);
          }
        } else {
          // API 返回错误
          message.error(res.message || '加载公司列表失败');
          setCompanyOptions([]);
          setCurrentSearchCompanyId(undefined);
        }
      } catch (error: any) {
        // 网络错误或其他异常
        const errorMessage = error?.message || '加载公司列表失败，请稍后重试';
        message.error(errorMessage);
        console.error('加载公司列表失败:', error);
        setCompanyOptions([]);
        setCurrentSearchCompanyId(undefined);
      }
    };
    loadCompanyOptions();
  }, []);

  const columns: ProColumns<any>[] = [
    {
      title: '所属公司',
      dataIndex: 'company_id',
      valueType: 'select',
      width: 200,
      fieldProps: {
        placeholder: '请选择公司（必选）',
        allowClear: false,
        options: companyOptions,
        showSearch: true,
        filterOption: (input: string, option: any) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
      },
      hideInTable: true,
    },
    {
      title: '部门名称',
      dataIndex: 'department_name',
      width: 300,
      fieldProps: {
        placeholder: '请输入部门名称',
      },
      render: (_, record) => record.department_name || '',
    },
    {
      title: '部门编码',
      dataIndex: 'department_code',
      width: 150,
      fieldProps: {
        placeholder: '请输入部门编码',
      },
      render: (_, record) => record.department_code || '',
    },
    {
      title: '部门负责人',
      dataIndex: 'manager_id',
      width: 200,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.manager_id) return '';
        if (record.manager_username) {
          const displayName = record.manager_name || record.manager_username;
          return `${displayName} (${record.manager_username})`;
        }
        return '';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '正常', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
      width: 100,
      fieldProps: {
        placeholder: '请选择状态',
        allowClear: true,
        options: [
          { label: '正常', value: 1 },
          { label: '禁用', value: 0 },
        ],
      },
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'error'}>
          {record.status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 350,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleDetail(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleAddChild(record)}
          >
            添加下级
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleEmployeeList(record)}
          >
            员工列表
          </Button>
          <Popconfirm
            title="确定要删除这条数据吗？"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<any>
        actionRef={actionRef}
        formRef={searchFormRef}
        rowKey="department_id"
        size={TABLE_SIZE}
        manualRequest={!currentSearchCompanyId || companyOptions.length === 0}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        request={async (params) => {
          try {
            // 如果没有选择公司，尝试使用当前选中的公司ID
            const companyId = params.company_id || currentSearchCompanyId;

            // 如果还是没有公司ID，返回空数据
            if (!companyId) {
              return {
                data: [],
                success: true,
                total: 0,
              };
            }

            // 保存当前的搜索条件中的公司ID
            if (companyId !== currentSearchCompanyId) {
              setCurrentSearchCompanyId(companyId);
            }

            // 清理和验证搜索参数
            const requestParams: any = {
              company_id: companyId,
            };

            // 处理部门名称搜索（去除首尾空格，限制长度）
            if (params.department_name && params.department_name.trim()) {
              const trimmedName = params.department_name.trim();
              if (trimmedName.length > 100) {
                message.warning('部门名称搜索条件过长，已截断');
                requestParams.department_name = trimmedName.substring(0, 100);
              } else {
                requestParams.department_name = trimmedName;
              }
            }

            // 处理部门编码搜索（去除首尾空格，限制长度）
            if (params.department_code && params.department_code.trim()) {
              const trimmedCode = params.department_code.trim();
              if (trimmedCode.length > 50) {
                message.warning('部门编码搜索条件过长，已截断');
                requestParams.department_code = trimmedCode.substring(0, 50);
              } else {
                requestParams.department_code = trimmedCode;
              }
            }

            // 处理状态搜索（只接受 0 或 1）
            if (
              params.status !== undefined &&
              params.status !== null &&
              params.status !== ''
            ) {
              const statusValue = Number(params.status);
              if (statusValue === 0 || statusValue === 1) {
                requestParams.status = statusValue;
              }
            }

            const response = await getDepartmentList(requestParams);
            if (response.code === 200) {
              // 后端返回的是树形结构
              return {
                data: response.data || [],
                success: true,
                total: Array.isArray(response.data) ? response.data.length : 0,
              };
            }
            // API 返回错误
            message.error(response.message || '获取部门列表失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          } catch (error: any) {
            // 网络错误或其他异常
            const errorMessage =
              error?.message || '获取部门列表失败，请稍后重试';
            message.error(errorMessage);
            console.error('获取部门列表失败:', error);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        params={{
          company_id: currentSearchCompanyId,
        }}
        columns={columns}
        dateFormatter="string"
        headerTitle="部门列表"
        scroll={{ x: 'max-content' }}
        pagination={false}
        defaultExpandAllRows
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增
          </Button>,
        ]}
      />
      <DepartmentForm
        visible={formVisible}
        editingRecord={editingRecord}
        searchCompanyId={currentSearchCompanyId}
        companyOptions={companyOptions}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSubmit={handleFormSubmit}
      />
      <DepartmentDetail
        visible={detailVisible}
        record={detailRecord}
        companyOptions={companyOptions}
        onClose={() => {
          setDetailVisible(false);
          setDetailRecord(null);
        }}
      />
      <Drawer
        title={`${currentDepartmentName} - 员工列表`}
        open={employeeDrawerVisible}
        onClose={() => {
          setEmployeeDrawerVisible(false);
          setCurrentDepartmentId(null);
          setCurrentDepartmentName('');
          setCurrentDepartmentCompanyId(null);
          setSelectedEmployeeRows([]); // 清空选中项
        }}
        width={1200}
        destroyOnClose
      >
        <ProTable<any>
          actionRef={employeeActionRef}
          rowKey="account_id"
          size={TABLE_SIZE}
          search={{
            labelWidth: 120,
            defaultCollapsed: false,
          }}
          request={async (params) => {
            if (!currentDepartmentId) {
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
            const requestParams: any = {
              ...params,
              pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
              department_id: currentDepartmentId,
            };

            // 处理状态筛选
            if (
              params.status !== undefined &&
              params.status !== null &&
              params.status !== ''
            ) {
              requestParams.status = params.status;
            }

            // 是否超级管理员筛选
            if (
              params.is_super !== undefined &&
              params.is_super !== null &&
              params.is_super !== ''
            ) {
              requestParams.is_super = params.is_super;
            }

            const response = await systemApi.getAdminList(requestParams);
            if (response.code === 200) {
              return {
                data: response.data?.data || [],
                success: true,
                total: response.data?.page?.total || 0,
              };
            }
            return {
              data: [],
              success: false,
              total: 0,
            };
          }}
          columns={[
            {
              title: '序号',
              valueType: 'index',
              width: 80,
              hideInSearch: true,
              fixed: 'left',
            },
            {
              title: '关键字',
              dataIndex: 'keyword',
              hideInTable: true,
              fieldProps: {
                placeholder: '用户名、姓名、手机号、邮箱',
              },
            },
            {
              title: '用户名',
              dataIndex: 'username',
              width: 120,
              fixed: 'left',
              hideInSearch: true,
              render: (_, record) => record.username || '',
            },
            {
              title: '姓名',
              dataIndex: 'nickname',
              width: 120,
              hideInSearch: true,
              render: (_, record) => record.nickname || '',
            },
            {
              title: '手机号',
              dataIndex: 'phone',
              hideInSearch: true,
              width: 130,
              copyable: true,
              render: (_, record) => record.phone || '',
            },
            {
              title: '邮箱',
              dataIndex: 'email',
              hideInSearch: true,
              width: 180,
              ellipsis: true,
              copyable: true,
              render: (_, record) => record.email || '',
            },
            {
              title: '最后登录IP',
              dataIndex: 'last_login_ip',
              hideInSearch: true,
              width: 130,
              render: (_, record) => record.last_login_ip || '',
            },
            {
              title: '最后登录时间',
              dataIndex: 'last_login_time',
              valueType: 'dateRange',
              hideInTable: false,
              width: 180,
              fieldProps: dateRangeFieldProps,
              render: (_, record) => {
                if (!record.last_login_time) return '';
                try {
                  return dayjs(record.last_login_time).format(
                    'YYYY-MM-DD HH:mm:ss',
                  );
                } catch (_e) {
                  return record.last_login_time;
                }
              },
            },
            {
              title: '创建时间',
              dataIndex: 'created_at',
              valueType: 'dateRange',
              hideInTable: false,
              width: 180,
              fieldProps: dateRangeFieldProps,
              render: (_, record) => {
                if (!record.created_at) return '';
                try {
                  return dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss');
                } catch (_e) {
                  return record.created_at;
                }
              },
            },
            {
              title: '账号状态',
              dataIndex: 'status',
              valueType: 'select',
              valueEnum: {
                1: { text: '正常', status: 'Success' },
                0: { text: '禁用', status: 'Error' },
              },
              width: 100,
              fieldProps: {
                placeholder: '请选择状态',
                allowClear: true,
                options: [
                  { label: '正常', value: 1 },
                  { label: '禁用', value: 0 },
                ],
              },
              render: (_, record) => (
                <Tag color={record.status === 1 ? 'success' : 'error'}>
                  {record.status === 1 ? '正常' : '禁用'}
                </Tag>
              ),
            },
            {
              title: '是否超级管理员',
              dataIndex: 'is_super',
              valueType: 'select',
              valueEnum: {
                1: { text: '是', status: 'Success' },
                0: { text: '否', status: 'Default' },
              },
              width: 120,
              fieldProps: {
                placeholder: '请选择',
                allowClear: true,
                options: [
                  { label: '是', value: 1 },
                  { label: '否', value: 0 },
                ],
              },
              render: (_, record) => (
                <Tag color={record.is_super === 1 ? 'success' : 'default'}>
                  {record.is_super === 1 ? '是' : '否'}
                </Tag>
              ),
            },
          ]}
          pagination={{
            ...DEFAULT_PAGINATION,
            pageSize: employeePageSize,
            onShowSizeChange: (_current, size) => {
              setEmployeePageSize(size);
            },
          }}
          dateFormatter="string"
          headerTitle="员工列表"
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selectedEmployeeRows.map((row) => row.account_id),
            onChange: (_, selectedRows) => {
              setSelectedEmployeeRows(selectedRows);
            },
          }}
          tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => {
            return (
              <Space>
                <Button size="small" onClick={onCleanSelected}>
                  取消选择
                </Button>
                <Popconfirm
                  title={`确定要批量移除选中的 ${selectedRowKeys.length} 个员工吗？移除后会将公司ID和部门关联清空。`}
                  onConfirm={async () => {
                    await handleBatchRemoveEmployees();
                    onCleanSelected();
                  }}
                >
                  <Button type="primary" size="small" danger>
                    批量移除员工
                  </Button>
                </Popconfirm>
              </Space>
            );
          }}
          toolBarRender={false}
        />
      </Drawer>
    </PageContainer>
  );
};

export default Department;
