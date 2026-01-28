import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  message,
  Popconfirm,
  Segmented,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import React, { type ReactNode, useRef, useState } from 'react';
import {
  addAdmin,
  deleteAdmin,
  getAdminDetail,
  getAdminList,
  getCompanyList,
  updateAdmin,
} from '@/modules/admin/services/system';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  processFormValues,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import { dateRangeFieldProps } from '@/modules/base/utils/datePresets';
import AccountRoleDrawer from './AccountRoleDrawer';
import AdminDetailDrawer from './AdminDetailDrawer';
import AdminForm from './AdminForm';

interface AdminTableProps {
  /** 页面标识，用于区分不同页面的调用 */
  pageKey?: string;
  /** 自定义标题 */
  headerTitle?: string;
  /** 是否显示新增按钮 */
  showAddButton?: boolean;
  /** 是否显示状态筛选 */
  showStatusFilter?: boolean;
}

const AdminTable: React.FC<AdminTableProps> = ({
  pageKey = 'default',
  headerTitle = '管理员列表',
  showAddButton = true,
  showStatusFilter = true,
}) => {
  const actionRef = useRef<ActionType>(null);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  // 账号状态筛选：'all' | 0 | 1，默认 'all'
  const [statusFilter, setStatusFilter] = useState<'all' | 0 | 1>('all');
  // 角色分配抽屉
  const [roleDrawerVisible, setRoleDrawerVisible] = useState(false);
  const [roleRecord, setRoleRecord] = useState<any>(null);

  const handleAdd = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = async (record: any) => {
    try {
      // 获取完整的管理员详情数据
      const res = await getAdminDetail({ account_id: record.account_id });
      if (res.code === 200 && res.data) {
        // 将详情数据转换为表单需要的格式
        const detailData = res.data;
        const formData: any = {
          account_id: detailData.account?.id,
          username: detailData.account?.username,
          nickname: detailData.profile?.nickname,
          phone: detailData.social?.find((s: any) => s.social_type === 'phone')
            ?.social_account,
          email: detailData.social?.find((s: any) => s.social_type === 'email')
            ?.social_account,
          company_id: detailData.admin?.company_id,
          is_super: detailData.admin?.is_super,
          status: detailData.account?.status,
          department_ids:
            detailData.departments?.map((d: any) => d.department_id) || [],
        };
        setEditingRecord(formData);
        setFormVisible(true);
      } else {
        message.error(res.message || '获取管理员详情失败');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        '获取管理员详情失败';
      message.error(errorMessage);
    }
  };

  const handleView = (record: any) => {
    setViewingRecord(record);
    setDetailVisible(true);
  };

  const handleAssignRole = (record: any) => {
    setRoleRecord(record);
    setRoleDrawerVisible(true);
  };

  const handleDelete = async (record: any) => {
    try {
      const res = await deleteAdmin({ account_id: record.account_id });
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
    try {
      // 将 undefined 转换为 null，确保清空的下拉框值也能传递到后端
      const processedValues = processFormValues(values);

      let res: { code: number; message: string; data?: any };
      if (editingRecord) {
        res = await updateAdmin({
          ...processedValues,
          account_id: editingRecord.account_id,
        });
      } else {
        res = await addAdmin(processedValues);
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
      // 显示后端返回的具体错误信息
      const errorMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        (editingRecord ? '更新失败' : '新增失败');
      message.error(errorMessage);
    }
  };

  // 状态筛选切换处理
  const handleStatusFilterChange = (value: string | number) => {
    setStatusFilter(value as 'all' | 0 | 1);
    // 重置分页到第一页并重新加载数据
    actionRef.current?.reloadAndRest?.();
  };

  const columns: ProColumns<any>[] = [
    {
      title: '所属公司',
      dataIndex: 'company_id',
      valueType: 'select',
      width: 180,
      hideInTable: true,
      fieldProps: {
        placeholder: '请选择所属公司',
        allowClear: true,
        showSearch: true,
        filterOption: false,
      },
      request: async () => {
        try {
          const response = await getCompanyList();
          if (response.code === 200 && response.data) {
            return (response.data as any[]).map((item) => ({
              label: item.company_name || '',
              value: item.company_id,
            }));
          }
          return [];
        } catch (error) {
          console.error('获取公司列表失败:', error);
          return [];
        }
      },
    },
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
      fixed: 'left',
      hideInSearch: true,
      render: (_, record) => record.nickname || '',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      hideInSearch: true,
      width: 130,
      render: (_, record) => record.phone || '',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      hideInSearch: true,
      width: 180,
      render: (_, record) => record.email || '',
    },
    {
      title: '所属公司',
      dataIndex: 'company_name',
      hideInSearch: true,
      width: 150,
      render: (_, record) => record.company_name || '',
    },
    {
      title: '最后登录IP',
      dataIndex: 'last_login_ip',
      hideInSearch: true,
      width: 130,
      render: (_, record) => record.last_login_ip || '',
    },
    {
      title: '最后登录地',
      dataIndex: 'last_login_location',
      hideInSearch: true,
      width: 150,
      render: (_, record) => record.last_login_location || '',
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
          return dayjs(record.last_login_time).format('YYYY-MM-DD HH:mm:ss');
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
      fixed: 'right',
      hideInSearch: true, // 状态筛选使用 Segmented 组件
      render: (_, record) => {
        const statusTag = (
          <Tag color={record.status === 1 ? 'success' : 'error'}>
            {record.status === 1 ? '正常' : '禁用'}
          </Tag>
        );
        if (record.username === 'admin') {
          return <Tooltip title="admin账号不能禁用">{statusTag}</Tooltip>;
        }
        return statusTag;
      },
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
      fixed: 'right',
      hideInTable: false,
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
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const isAdmin = record.username === 'admin';
        const deleteButton = (
          <Popconfirm
            title="确定要删除这条数据吗？"
            onConfirm={() => handleDelete(record)}
            disabled={isAdmin}
          >
            <Button type="link" size="small" danger disabled={isAdmin}>
              删除
            </Button>
          </Popconfirm>
        );
        return (
          <Space>
            <Button type="link" size="small" onClick={() => handleView(record)}>
              查看
            </Button>
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
            {record.is_super !== 1 && (
              <Button
                type="link"
                size="small"
                onClick={() => handleAssignRole(record)}
              >
                分配角色
              </Button>
            )}
            {isAdmin ? (
              <Tooltip title="admin账号不能删除">{deleteButton}</Tooltip>
            ) : (
              deleteButton
            )}
          </Space>
        );
      },
    },
  ];

  const toolBarItems: ReactNode[] = [];

  // 状态筛选
  if (showStatusFilter) {
    toolBarItems.push(
      <Segmented
        key="statusSegmented"
        value={statusFilter}
        onChange={handleStatusFilterChange}
        options={[
          { label: '全部', value: 'all' },
          { label: '正常', value: 1 },
          { label: '禁用', value: 0 },
        ]}
      />,
    );
  }

  // 新增按钮
  if (showAddButton) {
    toolBarItems.push(
      <Button
        key="add"
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
      >
        新增
      </Button>,
    );
  }

  return (
    <>
      <ProTable<any>
        key={pageKey}
        actionRef={actionRef}
        rowKey="account_id"
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

          // 根据 statusFilter 设置状态筛选（覆盖表单中的status值）
          if (showStatusFilter) {
            if (statusFilter === 'all') {
              // 全部：显示 0（禁用）和 1（正常）
              requestParams.status = [0, 1];
            } else {
              // 根据 Segmented 选择的状态筛选
              requestParams.status = statusFilter;
            }
          }

          // 是否超级管理员筛选从搜索表单中获取（如果未选择则不传该参数）
          if (
            params.is_super !== undefined &&
            params.is_super !== null &&
            params.is_super !== ''
          ) {
            requestParams.is_super = params.is_super;
          }

          // 所属公司筛选从搜索表单中获取（如果未选择则不传该参数）
          if (
            params.company_id !== undefined &&
            params.company_id !== null &&
            params.company_id !== ''
          ) {
            requestParams.company_id = params.company_id;
          }

          const response = await getAdminList(requestParams);
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
        pagination={{
          ...DEFAULT_PAGINATION,
          pageSize,
          onShowSizeChange: (_current, size) => {
            setPageSize(size);
          },
        }}
        dateFormatter="string"
        headerTitle={headerTitle}
        scroll={{ x: 'max-content' }}
        toolBarRender={() => toolBarItems}
      />
      <AdminForm
        visible={formVisible}
        editingRecord={editingRecord}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSubmit={handleFormSubmit}
      />
      <AdminDetailDrawer
        visible={detailVisible}
        record={viewingRecord}
        onClose={() => {
          setDetailVisible(false);
          setViewingRecord(null);
        }}
      />
      <AccountRoleDrawer
        visible={roleDrawerVisible}
        record={roleRecord}
        onClose={() => {
          setRoleDrawerVisible(false);
          setRoleRecord(null);
        }}
        onSuccess={() => {
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default AdminTable;
