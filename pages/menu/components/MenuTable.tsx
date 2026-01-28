import { PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { IconDisplay } from '@/components';
import {
  addMenu,
  deleteMenu,
  getMenuDirTree,
  getMenuList,
  getMenuListSearchData,
  getMenuTree,
  updateMenu,
} from '@/modules/admin/services/system';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  processFormValues,
  SysParamFlag,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import MenuForm from './MenuForm';

interface MenuTableProps {
  accountType: 'admin' | 'user';
}

const MenuTable: React.FC<MenuTableProps> = ({ accountType }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const searchFormRef = useRef<ProFormInstance>(null);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [parentMenuOptions, setParentMenuOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [dirTreeOptions, setDirTreeOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [moduleOptions, setModuleOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | undefined>(
    undefined,
  );

  // 加载搜索数据选项（模块列表）
  const loadSearchDataOptions = async () => {
    try {
      const res = await getMenuListSearchData();
      if (res.code === 200 && res.data) {
        setModuleOptions(
          res.data.module?.map((item: any) => ({
            label: item.label || item.value,
            value: item.value,
          })) || [],
        );
      }
    } catch (error) {
      console.error('加载搜索数据选项失败:', error);
    }
  };

  // 加载目录树选项（用于筛选）
  const loadDirTreeOptions = async () => {
    try {
      const res = await getMenuDirTree({ account_type: accountType });
      if (res.code === 200 && res.data) {
        // 递归扁平化目录树
        const flattenDirs = (
          dirs: any[],
          level = 0,
        ): Array<{ label: string; value: number }> => {
          const result: Array<{ label: string; value: number }> = [];
          dirs.forEach((dir) => {
            const prefix = level > 0 ? `${'　'.repeat(level)}├ ` : '';
            result.push({
              label: `${prefix}${dir.menu_name}`,
              value: dir.menu_id,
            });
            if (dir.children && dir.children.length > 0) {
              result.push(...flattenDirs(dir.children, level + 1));
            }
          });
          return result;
        };
        setDirTreeOptions(flattenDirs(res.data));
      }
    } catch (error) {
      console.error('加载目录树选项失败:', error);
    }
  };

  // 加载父菜单选项
  const loadParentMenuOptions = async () => {
    try {
      const res = await getMenuTree({ account_type: accountType });
      if (res.code === 200 && res.data) {
        // 递归扁平化菜单树，生成父菜单选项
        const flattenMenus = (
          menus: any[],
          level = 0,
        ): Array<{ label: string; value: number }> => {
          const result: Array<{ label: string; value: number }> = [];
          menus.forEach((menu) => {
            // 目录和菜单类型都可以作为父级
            if (menu.menu_type === 'dir' || menu.menu_type === 'menu') {
              const prefix = level > 0 ? `${'　'.repeat(level)}├ ` : '';
              const typeTag = menu.menu_type === 'dir' ? '[目录] ' : '';
              result.push({
                label: `${prefix}${typeTag}${menu.menu_name}`,
                value: menu.menu_id,
              });
              if (menu.children && menu.children.length > 0) {
                result.push(...flattenMenus(menu.children, level + 1));
              }
            }
          });
          return result;
        };
        const flattened = flattenMenus(res.data);
        // 根据 menu_id 去重，保留第一次出现的项
        const uniqueOptions = Array.from(
          new Map(flattened.map((item) => [item.value, item])).values(),
        );
        setParentMenuOptions(uniqueOptions);
      }
    } catch (error) {
      console.error('加载父菜单选项失败:', error);
    }
  };

  // 组件挂载时加载搜索数据（模块列表不依赖 accountType）
  useEffect(() => {
    loadSearchDataOptions();
  }, []);

  // 当 accountType 变化时，重新加载表格数据和父菜单选项
  useEffect(() => {
    actionRef.current?.reload();
    loadParentMenuOptions();
    loadDirTreeOptions();
  }, [accountType]);

  const handleAdd = () => {
    // 获取搜索表单中选中的模块ID
    const moduleId = searchFormRef.current?.getFieldValue('module_id');
    setSelectedModuleId(moduleId);
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleDelete = async (record: any) => {
    try {
      const res = await deleteMenu({ menu_id: record.menu_id });
      if (res.code === 200) {
        message.success('删除成功');
        actionRef.current?.reload();
        // 刷新父菜单选项和目录树选项
        loadParentMenuOptions();
        loadDirTreeOptions();
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
        res = await updateMenu({
          ...processedValues,
          menu_id: editingRecord.menu_id,
        });
      } else {
        res = await addMenu(processedValues);
      }
      if (res.code === 200) {
        message.success(editingRecord ? '更新成功' : '新增成功');
        setFormVisible(false);
        setEditingRecord(null);
        actionRef.current?.reload();
        // 刷新父菜单选项和目录树选项
        loadParentMenuOptions();
        loadDirTreeOptions();
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
      title: '模块',
      dataIndex: 'module_id',
      width: 150,
      valueType: 'select',
      fieldProps: {
        placeholder: '请选择模块',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          (option?.label ?? '')
            .toString()
            .toLowerCase()
            .includes(input.toLowerCase()),
        options: moduleOptions,
      },
      render: (_, record) => {
        return record.module_name || '-';
      },
    },
    {
      title: '父级目录',
      dataIndex: 'parent_id',
      width: 150,
      valueType: 'select',
      fieldProps: {
        placeholder: '请选择父级目录',
        showSearch: true,
        filterOption: (input: string, option: any) =>
          (option?.label ?? '')
            .toString()
            .toLowerCase()
            .includes(input.toLowerCase()),
        options: dirTreeOptions,
      },
      render: (_, record) => {
        if (!record.parent_id || record.parent_id === 0) {
          return '-';
        }
        // 从 parentMenuOptions 中查找父级菜单名称
        const parent = parentMenuOptions.find(
          (item) => item.value === record.parent_id,
        );
        // 去除前缀标记，只显示纯名称
        if (parent) {
          return parent.label.replace(/^[　├\s]*(\[目录\]\s*)?/, '');
        }
        return record.parent_id;
      },
    },
    {
      title: '名称',
      dataIndex: 'menu_name',
      fieldProps: {
        placeholder: '请输入名称',
      },
      render: (_, record) => (
        <>
          {record.sys_param_flag === SysParamFlag.Yes && (
            <Tag
              color="default"
              style={{ marginRight: 0, fontSize: 12, lineHeight: '16px' }}
            >
              系统
            </Tag>
          )}
          {record.menu_name}
        </>
      ),
    },
    {
      title: 'Key',
      dataIndex: 'menu_key',
      width: 200,
      fieldProps: {
        placeholder: '请输入Key',
      },
    },
    {
      title: '路由路径',
      dataIndex: 'menu_path',
      width: 200,
      fieldProps: {
        placeholder: '请输入路由路径',
      },
    },
    {
      title: '类型',
      dataIndex: 'menu_type',
      valueType: 'select',
      valueEnum: {
        dir: { text: '目录', status: 'Processing' },
        menu: { text: '菜单', status: 'Success' },
        button: { text: '按钮', status: 'Default' },
        link: { text: '链接', status: 'Warning' },
      },
      width: 100,
    },
    {
      title: '图标',
      dataIndex: 'menu_icon',
      hideInSearch: true,
      width: 60,
      render: (_, record) => <IconDisplay iconName={record.menu_icon} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
      width: 60,
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
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const canDelete = record.sys_param_flag !== SysParamFlag.Yes;
        return (
          <Space>
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
            {canDelete && (
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
        formRef={searchFormRef}
        rowKey="menu_id"
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
          const response = await getMenuList(requestParams);
          if (response.code === 200) {
            const data = response.data?.data || [];
            // 图标组件会在 render 函数中动态获取并显示
            return {
              data,
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
        headerTitle="菜单管理"
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
      <MenuForm
        visible={formVisible}
        editingRecord={editingRecord}
        parentMenuOptions={parentMenuOptions}
        moduleOptions={moduleOptions}
        selectedModuleId={!editingRecord ? selectedModuleId : undefined}
        accountType={accountType}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
          setSelectedModuleId(undefined);
        }}
        onSubmit={handleFormSubmit}
      />
    </>
  );
};

export default MenuTable;
