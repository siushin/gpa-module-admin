import { PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProTableProps,
} from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Drawer, Popconfirm, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  addCompany,
  deleteCompany,
  getCompanyList,
  updateCompany,
} from '@/modules/admin/services/company';
import * as systemApi from '@/modules/admin/services/system';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  processFormValues,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import { dateRangeFieldProps } from '@/modules/base/utils/datePresets';
import { getMessage } from '@/modules/base/utils/notification';
import CompanyDetail from './components/CompanyDetail';
import CompanyForm from './components/CompanyForm';

const Company: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [employeeDrawerVisible, setEmployeeDrawerVisible] = useState(false);
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  const [currentCompanyName, setCurrentCompanyName] = useState<string>('');
  const employeeActionRef = useRef<ActionType>(null);
  const [employeePageSize, setEmployeePageSize] =
    useState<number>(DEFAULT_PAGE_SIZE);
  const [selectedEmployeeRows, setSelectedEmployeeRows] = useState<any[]>([]);

  const handleAdd = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleDetail = (record: any) => {
    setDetailRecord(record);
    setDetailVisible(true);
  };

  const handleEmployeeList = (record: any) => {
    setCurrentCompanyId(record.company_id);
    setCurrentCompanyName(record.company_name || '');
    setEmployeeDrawerVisible(true);
    setSelectedEmployeeRows([]); // 重置选中项
  };

  const handleBatchRemoveEmployees = async () => {
    const message = getMessage();
    if (!selectedEmployeeRows || selectedEmployeeRows.length === 0) {
      message.warning('请至少选择一条数据');
      return;
    }
    if (!currentCompanyId) {
      message.error('公司ID不存在');
      return;
    }

    try {
      const accountIds = selectedEmployeeRows.map((row) => row.account_id);
      const res = await systemApi.batchRemoveAdminFromCompany({
        account_ids: accountIds,
        company_id: currentCompanyId,
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
    const message = getMessage();
    try {
      const res = await deleteCompany({
        company_id: record.company_id,
      });
      if (res.code === 200) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error: any) {
      // 显示后端返回的具体错误信息
      const errorMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        '删除失败';
      message.error(errorMessage);
    }
  };

  const handleFormSubmit = async (values: any) => {
    const message = getMessage();
    try {
      // 将 undefined 转换为 null，确保清空的下拉框值也能传递到后端
      const processedValues = processFormValues(values);
      // 处理空字符串：将空字符串转换为 null，以便后端正确处理
      const optionalFields = [
        'company_code',
        'legal_person',
        'contact_phone',
        'contact_email',
        'company_address',
        'company_desc',
      ];
      optionalFields.forEach((field) => {
        if (processedValues[field] === '') {
          processedValues[field] = null;
        }
      });

      let res: { code: number; message: string; data?: any };
      if (editingRecord) {
        res = await updateCompany({
          ...processedValues,
          company_id: editingRecord.company_id,
        });
      } else {
        res = await addCompany(processedValues);
      }
      if (res.code === 200) {
        message.success(editingRecord ? '更新成功' : '新增成功');
        setFormVisible(false);
        setEditingRecord(null);
        actionRef.current?.reload();
      } else {
        message.error(res.message || (editingRecord ? '更新失败' : '新增失败'));
      }
    } catch (error: any) {
      // 更详细的错误处理
      const errorMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        (editingRecord ? '更新失败' : '新增失败');
      message.error(errorMessage);
    }
  };

  const columns: ProColumns<any>[] = [
    {
      title: '公司名称',
      dataIndex: 'company_name',
      width: 200,
      ellipsis: true,
      fixed: 'left',
      fieldProps: {
        placeholder: '请输入公司名称',
      },
      render: (_, record) => record.company_name || '',
    },
    {
      title: '公司编码',
      dataIndex: 'company_code',
      width: 150,
      fieldProps: {
        placeholder: '请输入公司编码',
      },
      render: (_, record) => record.company_code || '',
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'company_credit_code',
      width: 180,
      copyable: true,
      fieldProps: {
        placeholder: '请输入统一社会信用代码',
        maxLength: 18,
        showCount: true,
      },
      render: (_, record) => record.company_credit_code || '',
    },
    {
      title: '法人代表',
      dataIndex: 'legal_person',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.legal_person || '',
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      width: 130,
      hideInSearch: true,
      copyable: true,
      render: (_, record) => record.contact_phone || '',
    },
    {
      title: '联系邮箱',
      dataIndex: 'contact_email',
      width: 180,
      ellipsis: true,
      hideInSearch: true,
      copyable: true,
      render: (_, record) => record.contact_email || '',
    },
    {
      title: '公司地址',
      dataIndex: 'company_address',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => record.company_address || '',
    },
    {
      title: '公司描述',
      dataIndex: 'company_desc',
      width: 150,
      ellipsis: {
        showTitle: true,
      },
      hideInSearch: true,
      render: (_, record) => record.company_desc || '',
    },
    {
      title: '创建时间',
      dataIndex: 'date_range',
      valueType: 'dateRange',
      hideInTable: true,
      fieldProps: dateRangeFieldProps,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 180,
      hideInSearch: true,
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
      title: '更新时间',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      width: 180,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.updated_at) return '';
        try {
          return dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss');
        } catch (_e) {
          return record.updated_at;
        }
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
      fixed: 'right',
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
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleDetail(record)}>
            详情
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
        rowKey="company_id"
        size={TABLE_SIZE}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        request={async (params) => {
          const requestParams: any = {
            ...params,
            pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
          };
          const response = await getCompanyList(requestParams);
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
        columns={columns}
        dateFormatter="string"
        headerTitle="公司列表"
        scroll={{ x: 'max-content' }}
        pagination={{
          ...DEFAULT_PAGINATION,
          pageSize,
          onShowSizeChange: (_current, size) => {
            setPageSize(size);
          },
        }}
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
      <CompanyForm
        visible={formVisible}
        editingRecord={editingRecord}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSubmit={handleFormSubmit}
      />
      <CompanyDetail
        visible={detailVisible}
        record={detailRecord}
        onClose={() => {
          setDetailVisible(false);
          setDetailRecord(null);
        }}
      />
      <Drawer
        title={`${currentCompanyName} - 员工列表`}
        open={employeeDrawerVisible}
        onClose={() => {
          setEmployeeDrawerVisible(false);
          setCurrentCompanyId(null);
          setCurrentCompanyName('');
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
            if (!currentCompanyId) {
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
            const requestParams: any = {
              ...params,
              page: params.page || 1,
              pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
              company_id: currentCompanyId,
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

export default Company;
