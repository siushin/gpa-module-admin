import { PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Button,
  Modal,
  message,
  Popconfirm,
  Radio,
  Segmented,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  addUser,
  auditUser,
  batchAuditUser,
  batchDeleteUser,
  deleteUser,
  getUserList,
  updateUser,
} from '@/modules/admin/services/user';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  processFormValues,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import { dateRangeFieldProps } from '@/modules/base/utils/datePresets';
import UserDetailDrawer from './UserDetailDrawer';
import UserForm from './UserForm';
import UserRoleDrawer from './UserRoleDrawer';

interface UserListProps {
  isPending?: boolean; // true: 待审核列表, false: 用户列表
}

const UserList: React.FC<UserListProps> = ({ isPending = false }) => {
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchAuditVisible, setBatchAuditVisible] = useState(false);
  const [batchAuditStatus, setBatchAuditStatus] = useState<number>(1); // 默认通过
  const [batchAuditLoading, setBatchAuditLoading] = useState(false);
  // tab 状态：'all' | 'pending' | 'rejected'，默认 'pending'
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'rejected'>(
    'pending',
  );
  // 用户列表状态筛选：'all' | 0 | 1，默认 'all'
  const [statusFilter, setStatusFilter] = useState<'all' | 0 | 1>('all');
  // 角色分配抽屉
  const [roleDrawerVisible, setRoleDrawerVisible] = useState(false);
  const [roleRecord, setRoleRecord] = useState<any>(null);

  const handleAdd = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormVisible(true);
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
      const res = await deleteUser({ account_id: record.account_id });
      if (res.code === 200) {
        message.success('删除成功');
        // 从选中列表中移除已删除的项
        setSelectedRowKeys((prev) =>
          prev.filter((key) => key !== record.account_id),
        );
        actionRef.current?.reload();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (_error) {
      message.error('删除失败');
    }
  };

  const handleAudit = async (record: any, status: number) => {
    try {
      const res = await auditUser({
        account_id: record.account_id,
        status,
      });
      if (res.code === 200) {
        message.success(status === 1 ? '审核通过' : '审核拒绝');
        actionRef.current?.reload();
      } else {
        message.error(res.message || '审核失败');
      }
    } catch (_error) {
      message.error('审核失败');
    }
  };

  const handleBatchAudit = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一个用户');
      return;
    }

    setBatchAuditLoading(true);
    try {
      const res = await batchAuditUser({
        account_ids: selectedRowKeys as number[],
        status: batchAuditStatus,
      });
      if (res.code === 200) {
        const data = res.data;
        if (data) {
          if (data.fail_count > 0) {
            message.warning(
              `${data.message}${data.fail_usernames.length > 0 ? `，失败用户：${data.fail_usernames.join('、')}` : ''}`,
            );
          } else {
            message.success(data.message || '批量审核成功');
          }
        } else {
          message.success('批量审核成功');
        }
        setBatchAuditVisible(false);
        setSelectedRowKeys([]);
        actionRef.current?.reload();
      } else {
        message.error(res.message || '批量审核失败');
      }
    } catch (_error) {
      message.error('批量审核失败');
    } finally {
      setBatchAuditLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一个用户');
      return;
    }

    try {
      const res = await batchDeleteUser({
        account_ids: selectedRowKeys as number[],
      });
      if (res.code === 200) {
        const data = res.data;
        if (data) {
          if (data.fail_count > 0) {
            message.warning(
              `${data.message}${data.fail_usernames.length > 0 ? `，失败用户：${data.fail_usernames.join('、')}` : ''}`,
            );
          } else {
            message.success(data.message || '批量删除成功');
          }
        } else {
          message.success('批量删除成功');
        }
        setSelectedRowKeys([]);
        actionRef.current?.reload();
      } else {
        message.error(res.message || '批量删除失败');
      }
    } catch (_error) {
      message.error('批量删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      // 将 undefined 转换为 null，确保清空的下拉框值也能传递到后端
      const processedValues = processFormValues(values);

      let res: { code: number; message: string; data?: any };
      if (editingRecord) {
        res = await updateUser({
          ...processedValues,
          account_id: editingRecord.account_id,
        });
      } else {
        res = await addUser(processedValues);
      }
      if (res.code === 200) {
        message.success(editingRecord ? '更新成功' : '新增成功');
        setFormVisible(false);
        setEditingRecord(null);
        actionRef.current?.reload();
      } else {
        message.error(res.message || (editingRecord ? '更新失败' : '新增失败'));
      }
    } catch (_error) {
      message.error(editingRecord ? '更新失败' : '新增失败');
    }
  };

  const columns: ProColumns<any>[] = [
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
      width: 150,
      fixed: 'left',
      hideInSearch: true,
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
      width: 120,
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
      title: '账号状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        '-2': { text: '已拒绝', status: 'Error' },
        '-1': { text: '待审核', status: 'Warning' },
        0: { text: '禁用', status: 'Error' },
        1: { text: '正常', status: 'Success' },
      },
      width: 100,
      hideInSearch: true, // 状态筛选使用 Segmented 组件
      render: (_, record) => {
        const statusMap: Record<
          number | string,
          { color: string; text: string }
        > = {
          '-2': { color: 'error', text: '已拒绝' },
          '-1': { color: 'warning', text: '待审核' },
          0: { color: 'error', text: '禁用' },
          1: { color: 'success', text: '正常' },
        };
        const statusInfo = statusMap[record.status] || statusMap[0];
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
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
      title: '操作',
      valueType: 'option',
      width: isPending ? 200 : 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleView(record)}>
            查看
          </Button>
          {!isPending &&
            (record.status === 0 ? (
              // 禁用状态，禁用按钮并显示 tooltip
              <>
                <Tooltip title="禁用的用户不能编辑">
                  <Button type="link" size="small" danger disabled>
                    编辑
                  </Button>
                </Tooltip>
                <Tooltip title="禁用的用户不能分配角色">
                  <Button type="link" size="small" disabled>
                    分配角色
                  </Button>
                </Tooltip>
                <Tooltip title="禁用的用户不能删除">
                  <Button type="link" size="small" danger disabled>
                    删除
                  </Button>
                </Tooltip>
              </>
            ) : (
              // 正常状态，正常显示按钮
              <>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleEdit(record)}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleAssignRole(record)}
                >
                  分配角色
                </Button>
                <Popconfirm
                  title="确定要删除这条数据吗？"
                  onConfirm={() => handleDelete(record)}
                >
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              </>
            ))}
          {isPending &&
            activeTab !== 'rejected' &&
            (record.status === -2 ? (
              // 已拒绝状态，禁用按钮并显示 tooltip
              <>
                <Tooltip title="已拒绝的用户不能再次审核">
                  <Button type="link" size="small" danger disabled>
                    通过
                  </Button>
                </Tooltip>
                <Tooltip title="已拒绝的用户不能再次审核">
                  <Button type="link" size="small" danger disabled>
                    拒绝
                  </Button>
                </Tooltip>
              </>
            ) : (
              // 待审核状态，正常显示按钮
              <>
                <Popconfirm
                  title="确定要通过审核吗？"
                  onConfirm={() => handleAudit(record, 1)}
                >
                  <Button type="link" size="small" style={{ color: '#52c41a' }}>
                    通过
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="确定要拒绝审核吗？"
                  onConfirm={() => handleAudit(record, -2)}
                >
                  <Button type="link" size="small" danger>
                    拒绝
                  </Button>
                </Popconfirm>
              </>
            ))}
        </Space>
      ),
    },
  ];

  // tab 切换处理
  const handleTabChange = (value: string | number) => {
    setActiveTab(value as 'all' | 'pending' | 'rejected');
    setSelectedRowKeys([]); // 切换 tab 时清空选择
    // 重置分页到第一页并重新加载数据（request函数中会自动获取表单当前值，包括关键字输入框的值）
    actionRef.current?.reloadAndRest?.();
  };

  // 状态筛选切换处理（仅用户列表）
  const handleStatusFilterChange = (value: string | number) => {
    setStatusFilter(value as 'all' | 0 | 1);
    setSelectedRowKeys([]); // 切换状态筛选时清空选择
    // 重置分页到第一页并重新加载数据（request函数中会自动获取表单当前值，包括关键字输入框的值）
    actionRef.current?.reloadAndRest?.();
  };

  return (
    <PageContainer>
      <ProTable<any>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="account_id"
        size={TABLE_SIZE}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        request={async (params) => {
          // 从表单获取所有搜索参数，确保切换tab时参数不丢失（包括关键字输入框的值）
          const formValues = formRef.current?.getFieldsValue() || {};

          const requestParams: any = {
            ...params,
            ...formValues, // 合并表单值，表单值优先级更高
            pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
          };

          // 根据isPending和activeTab设置status筛选条件（覆盖表单中的status值）
          if (isPending) {
            // 待审核列表：根据 tab 状态设置
            if (activeTab === 'pending') {
              // 待审核：status = -1
              requestParams.status = -1;
            } else if (activeTab === 'rejected') {
              // 已拒绝：status = -2
              requestParams.status = -2;
            } else {
              // 全部：status = -1 或 -2
              requestParams.status = [-1, -2];
            }
          } else {
            // 用户列表：根据 statusFilter 设置状态筛选（覆盖表单中的status值）
            if (statusFilter === 'all') {
              // 全部：显示 0（禁用）和 1（正常）
              requestParams.status = [0, 1];
            } else {
              // 根据 Segmented 选择的状态筛选
              requestParams.status = statusFilter;
            }
          }

          const response = await getUserList(requestParams);
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
        headerTitle={isPending ? '待审核用户列表' : '用户列表'}
        scroll={{ x: 'max-content' }}
        rowSelection={
          isPending && activeTab !== 'rejected'
            ? {
                selectedRowKeys,
                onChange: (keys) => {
                  setSelectedRowKeys(keys);
                },
                getCheckboxProps: (record: any) => ({
                  // 只允许选择待审核状态（-1）的用户
                  disabled: record.status !== -1,
                }),
              }
            : !isPending
              ? {
                  selectedRowKeys,
                  onChange: (keys) => {
                    setSelectedRowKeys(keys);
                  },
                }
              : undefined
        }
        toolBarRender={() =>
          [
            isPending && (
              <Segmented
                key="tabSegmented"
                value={activeTab}
                onChange={handleTabChange}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '待审核', value: 'pending' },
                  { label: '已拒绝', value: 'rejected' },
                ]}
              />
            ),
            !isPending && (
              <Segmented
                key="statusSegmented"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '正常', value: 1 },
                  { label: '禁用', value: 0 },
                ]}
              />
            ),
            !isPending ? (
              <>
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  新增
                </Button>
                <Button
                  key="batchDelete"
                  danger
                  disabled={selectedRowKeys.length === 0}
                  onClick={() => {
                    Modal.confirm({
                      title: '确定要批量删除选中的用户吗？',
                      content: `已选择 ${selectedRowKeys.length} 个用户，删除后无法恢复`,
                      okText: '确定',
                      cancelText: '取消',
                      onOk: handleBatchDelete,
                    });
                  }}
                >
                  批量删除
                </Button>
              </>
            ) : activeTab !== 'rejected' ? (
              <Button
                key="batchAudit"
                type="primary"
                disabled={selectedRowKeys.length === 0}
                onClick={() => {
                  setBatchAuditStatus(1); // 重置为默认值（通过）
                  setBatchAuditVisible(true);
                }}
              >
                批量审核
              </Button>
            ) : null,
          ].filter(Boolean)
        }
      />
      {!isPending && (
        <UserForm
          visible={formVisible}
          editingRecord={editingRecord}
          onCancel={() => {
            setFormVisible(false);
            setEditingRecord(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
      <UserDetailDrawer
        visible={detailVisible}
        record={viewingRecord}
        onClose={() => {
          setDetailVisible(false);
          setViewingRecord(null);
        }}
      />
      {isPending && (
        <Modal
          title="批量审核"
          open={batchAuditVisible}
          onOk={handleBatchAudit}
          onCancel={() => {
            setBatchAuditVisible(false);
            setBatchAuditStatus(1); // 重置为默认值
          }}
          confirmLoading={batchAuditLoading}
          okText="确认"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              已选择 <strong>{selectedRowKeys.length}</strong> 个用户
            </div>
            <div>
              <span style={{ marginRight: 8 }}>审核结果：</span>
              <Radio.Group
                value={batchAuditStatus}
                onChange={(e) => setBatchAuditStatus(e.target.value)}
              >
                <Radio value={1}>通过</Radio>
                <Radio value={-2}>拒绝</Radio>
              </Radio.Group>
            </div>
          </div>
        </Modal>
      )}
      <UserRoleDrawer
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
    </PageContainer>
  );
};

export default UserList;
