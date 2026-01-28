import { PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Modal, Popconfirm, Space, Tooltip, theme } from 'antd';
import React, { useRef, useState } from 'react';
import {
  addDictionary,
  batchDeleteDictionary,
  deleteDictionary,
  getDictionaryCategoryList,
  getDictionaryList,
  updateDictionary,
} from '@/modules/admin/services/system';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION,
  processFormValues,
  SysParamFlag,
  TABLE_SIZE,
} from '@/modules/base/utils/constants';
import DictionaryForm from './components/DictionaryForm';

const Dict: React.FC = () => {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(undefined);

  // 加载数据字典分类选项
  const [categoryOptions, setCategoryOptions] = useState<
    Array<{ label: string; value: number; category_code: string }>
  >([]);
  const [categoryCodeMap, setCategoryCodeMap] = useState<
    Record<number, string>
  >({});

  React.useEffect(() => {
    const loadCategoryOptions = async () => {
      try {
        const res = await getDictionaryCategoryList();
        if (res.code === 200 && res.data && res.data.length > 0) {
          const options = res.data.map((item: any) => ({
            label: item.category_name,
            value: item.category_id,
            category_code: item.category_code,
          }));
          setCategoryOptions(options);
          // 建立 category_id 到 category_code 的映射
          const codeMap: Record<number, string> = {};
          res.data.forEach((item: any) => {
            codeMap[item.category_id] = item.category_code;
          });
          setCategoryCodeMap(codeMap);
        }
      } catch (error) {
        console.error('加载数据字典分类失败:', error);
      }
    };
    loadCategoryOptions();
  }, []);

  // 当分类选项加载完成后，设置默认值并触发查询
  React.useEffect(() => {
    if (categoryOptions.length > 0 && formRef.current) {
      const firstCategoryId = categoryOptions[0].value;
      // 使用 setTimeout 确保表单已经渲染完成
      setTimeout(() => {
        formRef.current?.setFieldsValue({ category_id: firstCategoryId });
        setSelectedCategoryId(firstCategoryId);
        // 触发查询
        actionRef.current?.reload();
      }, 0);
    }
  }, [categoryOptions]);

  const handleAdd = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleDelete = async (record: any) => {
    try {
      const res = await deleteDictionary({
        dictionary_id: record.dictionary_id,
      });
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

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的数据');
      return;
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条数据吗？删除后无法恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await batchDeleteDictionary({
            dictionary_ids: selectedRowKeys.join(','),
          });
          if (res.code === 200) {
            message.success('批量删除成功');
            setSelectedRowKeys([]);
            actionRef.current?.reload();
          } else {
            message.error(res.message || '批量删除失败');
          }
        } catch (_error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleFormSubmit = async (values: any) => {
    try {
      // 从搜索框获取当前选中的分类ID
      const categoryId = formRef.current?.getFieldValue('category_id');
      // 根据 category_id 获取对应的 category_code
      const categoryCode = categoryId ? categoryCodeMap[categoryId] : undefined;

      // 将 undefined 转换为 null，确保清空的下拉框值也能传递到后端
      const processedValues = processFormValues(values);

      // 构建提交参数，使用 category_code 而不是 category_id
      const submitValues: any = {
        ...processedValues,
      };

      // 如果有 category_code，添加到提交参数中
      if (categoryCode) {
        submitValues.category_code = categoryCode;
      }

      // 移除 category_id（如果存在）
      delete submitValues.category_id;

      let res: { code: number; message: string; data?: any };
      if (editingRecord) {
        res = await updateDictionary({
          ...submitValues,
          dictionary_id: editingRecord.dictionary_id,
        });
      } else {
        res = await addDictionary(submitValues);
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
      title: '字典分类',
      dataIndex: 'category_id',
      valueType: 'select',
      hideInTable: true,
      fieldProps: {
        placeholder: '请选择字典分类',
        options: categoryOptions,
        allowClear: true,
        onChange: (value: number | undefined) => {
          setSelectedCategoryId(value);
          // 如果取消选择，清空表格数据；如果选中，触发查询并重置页码为1
          actionRef.current?.reloadAndRest?.();
        },
      },
      valueEnum: categoryOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<number, { text: string }>,
      ),
      formItemProps: {
        preserve: true,
      },
    },
    {
      title: '字典名称',
      dataIndex: 'dictionary_name',
      width: 150,
      fieldProps: {
        placeholder: '请输入字典名称',
      },
    },
    {
      title: '字典值',
      dataIndex: 'dictionary_value',
      width: 150,
      fieldProps: {
        placeholder: '请输入字典值',
      },
    },
    {
      title: '字典描述',
      dataIndex: 'dictionary_desc',
      width: 200,
      ellipsis: true,
      fieldProps: {
        placeholder: '请输入字典描述',
      },
      render: (_, record) => record.dictionary_desc || '',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      hideInSearch: true,
      width: 100,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const canDelete = record.sys_param_flag === SysParamFlag.No;
        return (
          <Space>
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
            {canDelete ? (
              <Popconfirm
                title="确定要删除这条数据吗？"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            ) : (
              <Tooltip title="系统支撑数据，禁止删除">
                <Button type="link" size="small" danger disabled>
                  删除
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<any>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="dictionary_id"
        size={TABLE_SIZE}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        beforeSearchSubmit={(params) => {
          // 在提交搜索前，如果字典分类为空，不设置默认值，让用户明确选择
          return params;
        }}
        request={async (params, sort, filter) => {
          try {
            // 从表单获取所有搜索参数，确保分页切换时参数不丢失
            const formValues = formRef.current?.getFieldsValue() || {};

            // 合并表单值和 params，表单值优先级更高
            const allParams = {
              ...params,
              ...formValues,
            };

            // 根据 category_id 获取对应的 category_code
            const categoryId = allParams.category_id;
            const categoryCode = categoryId
              ? categoryCodeMap[categoryId]
              : undefined;

            // 如果没有获取到 category_code，直接返回空数据，不发起请求
            if (!categoryCode) {
              return {
                data: [],
                success: true,
                total: 0,
              };
            }

            const requestParams: any = {
              pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
              // 传递搜索表单的参数
              dictionary_name: allParams.dictionary_name,
              dictionary_value: allParams.dictionary_value,
              dictionary_desc: allParams.dictionary_desc,
              category_code: categoryCode,
            };

            // 移除空值参数
            Object.keys(requestParams).forEach((key) => {
              if (
                requestParams[key] === undefined ||
                requestParams[key] === null ||
                requestParams[key] === ''
              ) {
                delete requestParams[key];
              }
            });

            const response = await getDictionaryList(requestParams);
            if (response.code === 200) {
              return {
                data: response.data?.data || [],
                success: true,
                total: response.data?.page?.total || 0,
              };
            }
            // 接口返回错误时显示错误信息
            message.error(response.message || '查询失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          } catch (error: any) {
            // 捕获异常并显示错误信息
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              '查询失败，请稍后重试';
            message.error(errorMessage);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
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
        headerTitle="数据字典列表"
        scroll={{ x: 'max-content' }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        toolBarRender={() => [
          <Button
            key="batchDelete"
            danger
            disabled={selectedRowKeys.length === 0}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={!selectedCategoryId}
          >
            新增
          </Button>,
        ]}
      />
      <DictionaryForm
        visible={formVisible}
        editingRecord={editingRecord}
        defaultCategoryId={
          editingRecord
            ? editingRecord.category_id
            : formRef.current?.getFieldValue('category_id')
        }
        categoryCode={
          editingRecord
            ? categoryCodeMap[editingRecord.category_id]
            : formRef.current?.getFieldValue('category_id')
              ? categoryCodeMap[formRef.current.getFieldValue('category_id')]
              : undefined
        }
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </PageContainer>
  );
};

export default Dict;
