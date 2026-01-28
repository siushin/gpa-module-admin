import { MenuOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  addRole,
  deleteRole,
  getRoleList,
  updateRole,
} from '@/modules/admin/services/system';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  isProtectedRole,
  processFormValues,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import RoleForm from './RoleForm';
import RoleMenuDrawer from './RoleMenuDrawer';

interface RoleTableProps {
  accountType: 'admin' | 'user';
}

const RoleTable: React.FC<RoleTableProps> = ({ accountType }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [menuDrawerVisible, setMenuDrawerVisible] = useState(false);
  const [currentRoleForMenu, setCurrentRoleForMenu] = useState<any>(null);

  // 当 accountType 变化时，重新加载表格数据
  useEffect(() => {
    actionRef.current?.reload();
  }, [accountType]);

  const handleAdd = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleMenuClick = (record: any) => {
    setCurrentRoleForMenu(record);
    setMenuDrawerVisible(true);
  };

  const handleDelete = async (record: any) => {
    try {
      const res = await deleteRole({ role_id: record.role_id });
      if (res.code === 200) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (_error) {
      message.error('删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      // 将 undefined 转换为 null，确保清空的下拉框值也能传递到后端
      const processedValues = processFormValues(values);

      let res: { code: number; message: string; data?: any };
      if (editingRecord) {
        res = await updateRole({
          ...processedValues,
          role_id: editingRecord.role_id,
        });
      } else {
        res = await addRole(processedValues);
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
      title: '角色名称',
      dataIndex: 'role_name',
      width: 150,
      fieldProps: {
        placeholder: '请输入角色名称',
      },
    },
    {
      title: '角色编码',
      dataIndex: 'role_code',
      width: 150,
      fieldProps: {
        placeholder: '请输入角色编码',
      },
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      hideInSearch: true,
      width: 200,
      ellipsis: true,
      render: (_, record) => record.description || '',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
      width: 100,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'error'}>
          {record.status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      hideInSearch: true,
      width: 80,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const isProtected = isProtectedRole(record.role_code);
        return (
          <Space>
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
            {/* 超级管理员不显示菜单按钮 */}
            {record.role_code !== 'super_admin' && (
              <Button
                type="link"
                size="small"
                icon={<MenuOutlined />}
                onClick={() => handleMenuClick(record)}
              >
                菜单
              </Button>
            )}
            {isProtected ? (
              <Tooltip title="系统默认角色，禁止删除">
                <Button type="link" size="small" danger disabled>
                  删除
                </Button>
              </Tooltip>
            ) : (
              <Popconfirm
                title="确定要删除这条数据吗？"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <ProTable<any>
        actionRef={actionRef}
        rowKey="role_id"
        size={TABLE_SIZE}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        request={async (params) => {
          const requestParams: any = {
            ...params,
            pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
            account_type: accountType,
          };
          const response = await getRoleList(requestParams);
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
        headerTitle="角色列表"
        scroll={{ x: 'max-content' }}
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
      <RoleForm
        visible={formVisible}
        editingRecord={editingRecord}
        accountType={accountType}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSubmit={handleFormSubmit}
      />
      <RoleMenuDrawer
        visible={menuDrawerVisible}
        roleRecord={currentRoleForMenu}
        accountType={accountType}
        onClose={() => {
          setMenuDrawerVisible(false);
          setCurrentRoleForMenu(null);
        }}
      />
    </>
  );
};

export default RoleTable;
