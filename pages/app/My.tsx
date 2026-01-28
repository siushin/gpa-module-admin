import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  HolderOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Modal,
  message,
  Pagination,
  Popconfirm,
  Radio,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getModulesSort,
  getMyApps,
  type ModuleSortItem,
  uninstallModule,
  updateModules,
  updateModulesSort,
} from '@/modules/admin/services/app';
import StandardFormRow from './components/StandardFormRow';
import TagSelect from './components/TagSelect';
import type { ExtendedAppItem as AppItem } from './Market';

const { Title, Paragraph } = Typography;
const FormItem = Form.Item;

// 来源显示映射
const sourceLabels: Record<string, string> = {
  official: '官方',
  third_party: '第三方',
  custom: '自定义',
};

const My: React.FC = () => {
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateType, setUpdateType] = useState<'all' | 'specified'>('all');

  // 排序相关状态
  const [sortDrawerVisible, setSortDrawerVisible] = useState<boolean>(false);
  const [sortLoading, setSortLoading] = useState<boolean>(false);
  const [sortSaving, setSortSaving] = useState<boolean>(false);
  const [sortList, setSortList] = useState<ModuleSortItem[]>([]);
  const [originalSortList, setOriginalSortList] = useState<ModuleSortItem[]>(
    [],
  );
  const [dragItem, setDragItem] = useState<ModuleSortItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async (keyword?: string) => {
    try {
      setLoading(true);
      const params: { [key: string]: any } = {};
      if (keyword !== undefined && keyword !== '') {
        params.keyword = keyword;
      }
      const response = await getMyApps({
        data: params,
      });
      if (response.code === 200 && response.data) {
        setApps(response.data);
      }
    } catch (error) {
      console.error('获取应用列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
    fetchApps(value);
  };

  // 获取所有可用的来源
  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    apps.forEach((app) => {
      if (app.module_source) {
        sources.add(app.module_source);
      }
    });
    return Array.from(sources);
  }, [apps]);

  // 根据筛选条件过滤应用
  const filteredApps = useMemo(() => {
    let result = apps;
    if (selectedSources.length > 0) {
      result = apps.filter((app) =>
        selectedSources.includes(app.module_source),
      );
    }
    return result;
  }, [apps, selectedSources]);

  // 分页后的应用列表
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredApps.slice(start, end);
  }, [filteredApps, currentPage, pageSize]);

  const handleSourceChange = (values: (string | number)[]) => {
    setSelectedSources(values as string[]);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
  };

  const handleUpdateModules = async () => {
    try {
      const values = await updateForm.validateFields();
      setUpdateLoading(true);

      const params: { [key: string]: any } = {};
      if (values.update_type === 'specified' && values.module_path) {
        params.module_path = values.module_path.trim();
      } else {
        // 全部更新时，不传 module_path 或传空字符串
        params.module_path = '';
      }

      const response = await updateModules({
        data: params,
      });

      if (response.code === 200) {
        const { success = [], failed = [] } = response.data || {};
        let successMsg = '';
        if (success.length > 0) {
          successMsg = `成功更新 ${success.length} 个模块`;
          if (success.length <= 5) {
            successMsg += `: ${success.map((s) => s.module_name).join(', ')}`;
          }
        }
        if (failed.length > 0) {
          const failMsg = `失败 ${failed.length} 个模块`;
          message.warning(`${successMsg || '更新完成'}，${failMsg}`);
        } else {
          message.success(successMsg || '更新完成');
        }
        setUpdateModalVisible(false);
        updateForm.resetFields();
        setUpdateType('all');
        // 刷新应用列表
        fetchApps(searchKeyword);
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error: any) {
      if (error?.errorFields) {
        // 表单验证错误
        return;
      }
      console.error('更新模块失败:', error);
      message.error(error?.message || '更新模块失败');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateModalCancel = () => {
    setUpdateModalVisible(false);
    updateForm.resetFields();
    setUpdateType('all');
  };

  const handleUninstall = async (app: AppItem) => {
    try {
      const response = await uninstallModule({
        data: { module_id: app.module_id },
      });

      if (response.code === 200) {
        message.success('卸载模块成功');
        // 刷新应用列表
        fetchApps(searchKeyword);
      } else {
        message.error(response.message || '卸载模块失败');
      }
    } catch (error: any) {
      console.error('卸载模块失败:', error);
      message.error(error?.message || '卸载模块失败');
    }
  };

  // 打开排序抽屉
  const handleOpenSortDrawer = async () => {
    setSortDrawerVisible(true);
    setSortLoading(true);
    try {
      const response = await getModulesSort();
      if (response.code === 200 && response.data) {
        setSortList(response.data);
        setOriginalSortList([...response.data]);
      } else {
        message.error(response.message || '获取模块排序失败');
      }
    } catch (error: any) {
      console.error('获取模块排序失败:', error);
      message.error(error?.message || '获取模块排序失败');
    } finally {
      setSortLoading(false);
    }
  };

  // 关闭排序抽屉
  const handleCloseSortDrawer = () => {
    setSortDrawerVisible(false);
    setSortList([]);
    setOriginalSortList([]);
    setDragItem(null);
    setDragOverIndex(null);
  };

  // 重置排序
  const handleResetSort = () => {
    setSortList([...originalSortList]);
  };

  // 保存排序
  const handleSaveSort = async () => {
    setSortSaving(true);
    try {
      const response = await updateModulesSort({
        data: {
          sort_list: sortList.map((item) => ({ module_id: item.module_id })),
        },
      });
      if (response.code === 200) {
        message.success(
          response.message || '排序保存成功，请退出登录后重新登录以使排序生效',
        );
        setOriginalSortList([...sortList]);
      } else {
        message.error(response.message || '保存排序失败');
      }
    } catch (error: any) {
      console.error('保存排序失败:', error);
      message.error(error?.message || '保存排序失败');
    } finally {
      setSortSaving(false);
    }
  };

  // 拖拽开始
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, item: ModuleSortItem) => {
      setDragItem(item);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(item.module_id));
    },
    [],
  );

  // 拖拽经过
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    [],
  );

  // 拖拽离开
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  // 放下
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
      e.preventDefault();
      if (!dragItem) return;

      const currentIndex = sortList.findIndex(
        (item) => item.module_id === dragItem.module_id,
      );
      if (currentIndex === -1 || currentIndex === targetIndex) {
        setDragItem(null);
        setDragOverIndex(null);
        return;
      }

      const newList = [...sortList];
      const [removed] = newList.splice(currentIndex, 1);
      newList.splice(targetIndex, 0, removed);
      setSortList(newList);
      setDragItem(null);
      setDragOverIndex(null);
    },
    [dragItem, sortList],
  );

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setDragItem(null);
    setDragOverIndex(null);
  }, []);

  return (
    <PageContainer
      title="我的应用"
      extra={[
        <Button
          key="update"
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => setUpdateModalVisible(true)}
        >
          更新本地模块
        </Button>,
        <Button
          key="sort"
          icon={<SortAscendingOutlined />}
          onClick={handleOpenSortDrawer}
        >
          排序
        </Button>,
      ]}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Input.Search
          placeholder="请输入"
          enterButton="搜索"
          size="large"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={handleFormSubmit}
          style={{ maxWidth: 522, width: '100%' }}
        />
      </div>
      <Card variant="borderless">
        <Form
          layout="inline"
          form={form}
          onValuesChange={(_changedValues, allValues) => {
            handleSourceChange(allValues.source || []);
          }}
        >
          <StandardFormRow title="应用来源" block style={{ paddingBottom: 11 }}>
            <FormItem name="source">
              <TagSelect defaultAllChecked>
                {availableSources.map((source) => (
                  <TagSelect.Option value={source} key={source}>
                    {sourceLabels[source] || source}
                  </TagSelect.Option>
                ))}
              </TagSelect>
            </FormItem>
          </StandardFormRow>
        </Form>
      </Card>
      <Card
        style={{ marginTop: 24 }}
        variant="borderless"
        styles={{ body: { padding: '8px 32px 32px 32px' } }}
      >
        <Spin spinning={loading}>
          {filteredApps.length === 0 && !loading ? (
            <Empty description="暂无应用" />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {paginatedApps.map((app) => (
                  <Col
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    xl={6}
                    key={app.module_name}
                  >
                    <Card
                      hoverable
                      style={{
                        height: '100%',
                        borderRadius: 8,
                      }}
                      styles={{
                        body: {
                          padding: 20,
                        },
                      }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}
                        >
                          <AppstoreOutlined
                            style={{
                              fontSize: 24,
                              color:
                                app.module_status === 1 ? '#52c41a' : '#d9d9d9',
                              marginRight: 8,
                            }}
                          />
                          <Title level={5} style={{ margin: 0, flex: 1 }}>
                            {app.module_title}
                          </Title>
                          {app.module_status === 1 ? (
                            <Tag icon={<CheckCircleOutlined />} color="success">
                              已启用
                            </Tag>
                          ) : (
                            <Tag icon={<CloseCircleOutlined />} color="default">
                              未启用
                            </Tag>
                          )}
                        </div>
                        <Paragraph
                          ellipsis={{ rows: 2, expandable: false }}
                          style={{ margin: 0, color: '#666', fontSize: 14 }}
                        >
                          {app.module_desc || '暂无描述'}
                        </Paragraph>
                      </div>
                      {app.module_keywords &&
                        app.module_keywords.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            {app.module_keywords.map((keyword) => (
                              <Tag
                                key={`${app.module_name}-${keyword}`}
                                style={{ marginBottom: 4 }}
                              >
                                {keyword}
                              </Tag>
                            ))}
                          </div>
                        )}
                      <div
                        style={{ marginTop: 12, fontSize: 12, color: '#999' }}
                      >
                        模块名: {app.module_name}
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        {app.module_source && (
                          <Tag
                            color={
                              app.module_source === 'official'
                                ? 'blue'
                                : 'orange'
                            }
                          >
                            {sourceLabels[app.module_source] ||
                              app.module_source}
                          </Tag>
                        )}
                        {!app.module_source && <div />}
                        {app.module_is_core !== 1 && (
                          <Popconfirm
                            title="确定要卸载此模块吗？"
                            description="卸载后将删除模块代码、菜单数据和账号关联，此操作不可恢复！"
                            onConfirm={() => handleUninstall(app)}
                            okText="确定"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="link"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                            >
                              卸载
                            </Button>
                          </Popconfirm>
                        )}
                        {app.module_is_core === 1 && <div />}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
              {filteredApps.length > 0 && (
                <div style={{ marginTop: 24, textAlign: 'right' }}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredApps.length}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 个应用`}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    pageSizeOptions={['12', '24', '48', '96']}
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </Card>

      <Modal
        title="更新本地模块"
        open={updateModalVisible}
        onOk={handleUpdateModules}
        onCancel={handleUpdateModalCancel}
        confirmLoading={updateLoading}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={updateForm}
          layout="vertical"
          initialValues={{ update_type: 'all' }}
        >
          <Form.Item
            name="update_type"
            label="更新方式"
            rules={[{ required: true, message: '请选择更新方式' }]}
          >
            <Radio.Group
              onChange={(e) => {
                setUpdateType(e.target.value);
                if (e.target.value === 'all') {
                  updateForm.setFieldsValue({ module_path: undefined });
                }
              }}
            >
              <Radio value="all">全部（扫描所有模块）</Radio>
              <Radio value="specified">指定模块路径</Radio>
            </Radio.Group>
          </Form.Item>

          {updateType === 'specified' && (
            <Form.Item
              name="module_path"
              label="模块路径"
              rules={[
                { required: true, message: '请输入模块路径' },
                {
                  validator: (_rule, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.reject(new Error('请输入模块路径'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              help="支持相对路径（如：Base、Sms）或绝对路径（如：/path/to/Modules/Base）"
            >
              <Input
                placeholder="请输入模块路径，如：Base 或 /path/to/Modules/Base"
                allowClear
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer
        title="模块排序"
        placement="right"
        width={400}
        open={sortDrawerVisible}
        onClose={handleCloseSortDrawer}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              onClick={handleResetSort}
              disabled={sortLoading || sortSaving}
            >
              重置
            </Button>
            <Button
              type="primary"
              onClick={handleSaveSort}
              loading={sortSaving}
              disabled={sortLoading}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Spin spinning={sortLoading}>
          {sortList.length === 0 && !sortLoading ? (
            <Empty description="暂无模块数据" />
          ) : (
            <List
              dataSource={sortList}
              renderItem={(item, index) => (
                <div
                  key={item.module_id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 4,
                    background:
                      dragOverIndex === index
                        ? '#e6f4ff'
                        : dragItem?.module_id === item.module_id
                          ? '#f5f5f5'
                          : '#fff',
                    border:
                      dragOverIndex === index
                        ? '2px dashed #1890ff'
                        : '1px solid #f0f0f0',
                    borderRadius: 6,
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    opacity: dragItem?.module_id === item.module_id ? 0.5 : 1,
                  }}
                >
                  <HolderOutlined
                    style={{
                      marginRight: 8,
                      color: '#999',
                      fontSize: 16,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{item.module_title}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {item.module_name}
                    </div>
                  </div>
                </div>
              )}
            />
          )}
        </Spin>
      </Drawer>
    </PageContainer>
  );
};

export default My;
