import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Menu, Popconfirm, Space, Tooltip } from 'antd';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  addOrganization,
  addOrganizationType,
  deleteOrganization,
  deleteOrganizationType,
  getOrganizationList,
  getOrganizationTypeList,
  moveOrganization,
  updateOrganization,
  updateOrganizationType,
} from '@/modules/admin/services/system';
import { SysParamFlag, TABLE_SIZE } from '@/modules/base/utils/constants';
import DictionaryTypeForm from './components/DictionaryTypeForm';
import DictTreeForm from './components/DictTreeForm';
import useStyles from './DictTree.style';

const DictTree: React.FC = () => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const [selectedType, setSelectedType] = useState<number>(0);
  const [typeList, setTypeList] = useState<
    Array<{
      dictionary_id: number;
      dictionary_name: string;
      dictionary_value: string;
      dictionary_desc?: string;
      sys_param_flag?: number;
    }>
  >([]);
  const actionRef = useRef<ActionType | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [moveFormVisible, setMoveFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isAddChild, setIsAddChild] = useState(false);
  const [movingRecord, setMovingRecord] = useState<any>(null);
  const [typeFormVisible, setTypeFormVisible] = useState(false);
  const [editingTypeRecord, setEditingTypeRecord] = useState<{
    dictionary_id: number;
    dictionary_name: string;
    dictionary_value: string;
    dictionary_desc?: string;
    sys_param_flag?: number;
  } | null>(null);
  const dom = useRef<HTMLDivElement>(null);
  const [initConfig, setInitConfig] = useState<{
    mode: 'inline' | 'horizontal';
  }>({
    mode: 'inline',
  });

  // 加载组织架构类型列表
  const loadTypes = async () => {
    try {
      const res = await getOrganizationTypeList();
      if (res.code === 200 && res.data) {
        setTypeList(res.data);
        // 默认选中第一个
        if (res.data.length > 0 && selectedType === 0) {
          setSelectedType(res.data[0].dictionary_id);
        }
      }
    } catch (error) {
      console.error('加载组织架构类型失败:', error);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  // 响应式处理
  useLayoutEffect(() => {
    const resize = () => {
      requestAnimationFrame(() => {
        if (!dom.current) {
          return;
        }
        let mode: 'inline' | 'horizontal' = 'inline';
        const { offsetWidth } = dom.current;
        if (dom.current.offsetWidth < 641 && offsetWidth > 400) {
          mode = 'horizontal';
        }
        if (window.innerWidth < 768 && offsetWidth > 400) {
          mode = 'horizontal';
        }
        setInitConfig({
          mode: mode as 'inline' | 'horizontal',
        });
      });
    };
    if (dom.current) {
      window.addEventListener('resize', resize);
      resize();
    }
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleTypeSelect = (typeKey: string) => {
    setSelectedType(Number(typeKey));
    // dictionary_id 的变化会自动导致 ProTable 重新挂载并请求数据，同时清空搜索表单
  };

  const handleAdd = () => {
    if (!selectedType || selectedType === 0) {
      message.warning('请先选择组织架构类型');
      return;
    }
    setEditingRecord(null);
    setIsAddChild(false);
    setFormVisible(true);
  };

  const handleAddChild = (record: any) => {
    setEditingRecord(record);
    setIsAddChild(true);
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsAddChild(false);
    setFormVisible(true);
  };

  const handleMove = (record: any) => {
    setMovingRecord(record);
    setMoveFormVisible(true);
  };

  const handleDelete = async (record: any) => {
    try {
      const res = await deleteOrganization({
        organization_id: record.organization_id,
      });
      if (res.code === 200) {
        message.success('删除成功');
        // 删除后清空搜索条件并重新加载
        actionRef.current?.reloadAndRest?.();
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
      if (editingRecord && !isAddChild) {
        // 编辑
        const submitValues: any = {
          ...processedValues,
          organization_id: editingRecord.organization_id,
        };
        // 如果 organization_pid 未定义或为空，默认为 0（顶级组织架构）
        submitValues.organization_pid = processedValues.organization_pid ?? 0;
        res = await updateOrganization(submitValues);
      } else {
        // 新增或添加下级
        const submitValues: any = { ...processedValues };
        if (isAddChild) {
          // 添加下级时，使用当前记录的ID作为上级
          submitValues.organization_pid = editingRecord?.organization_id || 0;
        } else {
          // 新增时，如果未选择上级组织架构，传递 0（表示顶级）
          // 但前端表单不显示默认值 0，让用户明确选择或不选择
          submitValues.organization_pid = processedValues.organization_pid ?? 0;
        }
        res = await addOrganization({
          ...submitValues,
          organization_tid: selectedType,
        });
      }
      if (res.code === 200) {
        message.success(editingRecord && !isAddChild ? '更新成功' : '新增成功');
        setFormVisible(false);
        setEditingRecord(null);
        setIsAddChild(false);
        // 操作后清空搜索条件并重新加载
        actionRef.current?.reloadAndRest?.();
      } else {
        message.error(
          res.message ||
            (editingRecord && !isAddChild ? '更新失败' : '新增失败'),
        );
      }
    } catch (_error) {
      message.error(editingRecord && !isAddChild ? '更新失败' : '新增失败');
    }
  };

  const handleMoveSubmit = async (values: any) => {
    try {
      // 将 undefined 转换为 null，确保清空的下拉框值也能传递到后端
      const processedValues = processFormValues(values);

      const res = await moveOrganization({
        organization_id: movingRecord.organization_id,
        belong_organization_id: processedValues.belong_organization_id ?? 0,
      });
      if (res.code === 200) {
        message.success('移动成功');
        setMoveFormVisible(false);
        setMovingRecord(null);
        // 移动后清空搜索条件并重新加载
        actionRef.current?.reloadAndRest?.();
      } else {
        message.error(res.message || '移动失败');
      }
    } catch (_error) {
      message.error('移动失败');
    }
  };

  // 处理字典类型新增
  const handleTypeAdd = () => {
    setEditingTypeRecord(null);
    setTypeFormVisible(true);
  };

  // 处理字典类型编辑
  const handleTypeEdit = (record: {
    dictionary_id: number;
    dictionary_name: string;
    dictionary_value: string;
    dictionary_desc?: string;
    sys_param_flag?: number;
  }) => {
    setEditingTypeRecord(record);
    setTypeFormVisible(true);
  };

  // 处理字典类型删除
  const handleTypeDelete = async (record: {
    dictionary_id: number;
    dictionary_name: string;
    dictionary_value: string;
  }) => {
    try {
      const res = await deleteOrganizationType({
        dictionary_id: record.dictionary_id,
      });
      if (res.code === 200) {
        message.success('删除成功');
        // 如果删除的是当前选中的类型，找到最近的那个类型并选中
        if (selectedType === record.dictionary_id) {
          // 先计算删除后的列表
          const filteredList = typeList.filter(
            (item) => item.dictionary_id !== record.dictionary_id,
          );
          // 如果还有剩余的类型，选中最近的那个
          if (filteredList.length > 0) {
            // 找到被删除项在原列表中的索引
            const deletedIndex = typeList.findIndex(
              (item) => item.dictionary_id === record.dictionary_id,
            );
            // 优先选择前一个，如果删除的是第一个，则选择后一个（即原列表中的下一个）
            let targetIndex = deletedIndex > 0 ? deletedIndex - 1 : 0;
            // 确保索引在过滤后的列表中有效
            if (targetIndex >= filteredList.length) {
              targetIndex = filteredList.length - 1;
            }
            setSelectedType(filteredList[targetIndex].dictionary_id);
          } else {
            // 如果没有剩余类型，清空选中状态
            setSelectedType(0);
          }
          // 更新列表
          setTypeList(filteredList);
        } else {
          // 如果删除的不是当前选中的类型，直接移除
          setTypeList((prevList) =>
            prevList.filter(
              (item) => item.dictionary_id !== record.dictionary_id,
            ),
          );
        }
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (_error) {
      message.error('删除失败');
    }
  };

  // 处理字典类型表单提交
  const handleTypeFormSubmit = async (values: {
    dictionary_name: string;
    dictionary_value: string;
    dictionary_desc?: string;
    dictionary_id?: number;
  }) => {
    let res: { code: number; message: string; data?: any };
    if (editingTypeRecord) {
      // 编辑
      res = await updateOrganizationType({
        dictionary_id: editingTypeRecord.dictionary_id,
        dictionary_name: values.dictionary_name,
        dictionary_value: values.dictionary_value,
        dictionary_desc: values.dictionary_desc || '',
      });
      if (res.code === 200) {
        message.success('更新成功');
        setTypeFormVisible(false);
        setEditingTypeRecord(null);
        // 直接根据表单数据更新 typeList
        setTypeList((prevList) =>
          prevList.map((item) =>
            item.dictionary_id === editingTypeRecord.dictionary_id
              ? {
                  ...item,
                  dictionary_name: values.dictionary_name,
                  dictionary_value: values.dictionary_value,
                  dictionary_desc: values.dictionary_desc,
                  sys_param_flag: editingTypeRecord.sys_param_flag,
                }
              : item,
          ),
        );
      } else {
        // 报错时，不清空表单，不关闭弹窗，抛出错误让表单组件处理
        message.error(res.message || '更新失败');
        throw new Error(res.message || '更新失败');
      }
    } else {
      // 新增
      res = await addOrganizationType({
        dictionary_name: values.dictionary_name,
        dictionary_value: values.dictionary_value,
        dictionary_desc: values.dictionary_desc || '',
      });
      if (res.code === 200) {
        message.success('新增成功');
        setTypeFormVisible(false);
        setEditingTypeRecord(null);
        // 使用返回的数据追加到 typeList
        if (res.data) {
          setTypeList((prevList) => [
            ...prevList,
            {
              dictionary_id: Number(res.data.dictionary_id),
              dictionary_name: res.data.dictionary_name,
              dictionary_value: res.data.dictionary_value,
              dictionary_desc: res.data.dictionary_desc,
              sys_param_flag: res.data.sys_param_flag ?? SysParamFlag.No,
            },
          ]);
          // 如果当前没有选中类型，自动选中新增的类型
          if (selectedType === 0 && res.data.dictionary_id) {
            setSelectedType(Number(res.data.dictionary_id));
          }
        }
      } else {
        // 报错时，不清空表单，不关闭弹窗，抛出错误让表单组件处理
        message.error(res.message || '新增失败');
        throw new Error(res.message || '新增失败');
      }
    }
  };

  const menuItems = typeList.map((type) => ({
    key: String(type.dictionary_id),
    label: (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
        onClick={(e) => {
          // 如果点击的是按钮区域，不触发菜单选中
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('.ant-popconfirm')) {
            e.stopPropagation();
          }
        }}
      >
        <span style={{ flex: 1 }}>{type.dictionary_value}</span>
        <Space
          size="small"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleTypeEdit(type);
            }}
            style={{ padding: '0 4px' }}
          />
          {type.sys_param_flag === SysParamFlag.Yes ? (
            <Tooltip title="系统支撑数据，禁止删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{ padding: '0 4px' }}
              />
            </Tooltip>
          ) : (
            <Popconfirm
              title="确定要删除这个字典类型吗？"
              onConfirm={() => handleTypeDelete(type)}
              onCancel={() => {
                // Popconfirm 的 onCancel 不需要事件参数
              }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{ padding: '0 4px' }}
              />
            </Popconfirm>
          )}
        </Space>
      </div>
    ),
  }));

  const columns: ProColumns<any>[] = [
    {
      title: '字典名称',
      dataIndex: 'organization_name',
      width: 300,
      fieldProps: {
        placeholder: '请输入字典名称',
      },
      render: (_, record) => record.organization_name || '',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 280,
      fixed: 'right',
      render: (_, record) => {
        return (
          <Space>
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => handleAddChild(record)}
            >
              添加下级
            </Button>
            <Button type="link" size="small" onClick={() => handleMove(record)}>
              移动
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
        );
      },
    },
  ];

  return (
    <PageContainer>
      <div
        className={styles.main}
        ref={(ref) => {
          if (ref) {
            dom.current = ref;
          }
        }}
      >
        <div className={styles.leftMenu}>
          <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleTypeAdd}
            >
              新增
            </Button>
          </div>
          <Menu
            mode={initConfig.mode}
            selectedKeys={selectedType ? [String(selectedType)] : []}
            onClick={({ key }) => {
              handleTypeSelect(key as string);
            }}
            items={menuItems}
          />
        </div>
        <div className={styles.right}>
          <ProTable<any>
            key={String(selectedType)}
            actionRef={actionRef}
            rowKey="organization_id"
            size={TABLE_SIZE}
            search={{
              labelWidth: 120,
              defaultCollapsed: false,
            }}
            request={async (params) => {
              if (!selectedType || selectedType === 0) {
                return {
                  data: [],
                  success: true,
                  total: 0,
                };
              }
              const requestParams: any = {
                ...params,
                organization_tid: selectedType,
                organization_name: params.organization_name,
              };
              const response = await getOrganizationList(requestParams);
              if (response.code === 200) {
                return {
                  data: response.data || [],
                  success: true,
                  total: response.data?.length || 0,
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
            headerTitle={
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  disabled={!selectedType || selectedType === 0}
                >
                  新增
                </Button>
                {(() => {
                  const selectedTypeItem = typeList.find(
                    (item) => item.dictionary_id === selectedType,
                  );
                  const dictionaryDesc = selectedTypeItem?.dictionary_desc;
                  return dictionaryDesc ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        maxWidth: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'rgba(0, 0, 0, 0.65)',
                        fontSize: 14,
                        fontWeight: 'normal',
                        gap: 4,
                      }}
                    >
                      <Tooltip title={dictionaryDesc}>
                        <InfoCircleOutlined
                          style={{
                            color: '#1890ff',
                            fontSize: 14,
                            cursor: 'pointer',
                          }}
                        />
                      </Tooltip>
                      {dictionaryDesc}
                    </span>
                  ) : null;
                })()}
              </Space>
            }
            scroll={{ x: 'max-content' }}
            pagination={false}
            expandable={{
              defaultExpandAllRows: true,
            }}
          />
        </div>
      </div>

      <DictTreeForm
        visible={formVisible}
        editingRecord={editingRecord}
        isAddChild={isAddChild}
        selectedType={String(selectedType)}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
          setIsAddChild(false);
        }}
        onSubmit={handleFormSubmit}
        getOrganizationList={getOrganizationList}
        selectedTypeForFilter={String(selectedType)}
      />

      {moveFormVisible && (
        <DictTreeForm
          visible={moveFormVisible}
          editingRecord={movingRecord}
          isMove={true}
          selectedType={String(selectedType)}
          onCancel={() => {
            setMoveFormVisible(false);
            setMovingRecord(null);
          }}
          onSubmit={handleMoveSubmit}
          getOrganizationList={getOrganizationList}
          selectedTypeForFilter={String(selectedType)}
        />
      )}

      <DictionaryTypeForm
        visible={typeFormVisible}
        editingRecord={editingTypeRecord}
        sysParamFlag={editingTypeRecord?.sys_param_flag}
        onCancel={() => {
          setTypeFormVisible(false);
          setEditingTypeRecord(null);
        }}
        onSubmit={handleTypeFormSubmit}
      />
    </PageContainer>
  );
};

export default DictTree;
