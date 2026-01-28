import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  message,
  Pagination,
  Row,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type AppItem,
  getMarketApps,
  installModule,
} from '@/modules/admin/services/app';
import StandardFormRow from './components/StandardFormRow';
import TagSelect from './components/TagSelect';

// 扩展的 AppItem 类型（添加页面使用的额外字段）
export interface ExtendedAppItem extends AppItem {
  module_title?: string;
  module_desc?: string;
  module_priority?: number;
  module_source?: 'official' | 'third_party' | 'custom';
  module_is_core?: 0 | 1;
  module_is_installed?: 0 | 1;
  module_installed_at?: string;
  module_author_email?: string;
  module_homepage?: string;
  module_keywords?: string[];
  module_providers?: string[];
  module_dependencies?: string[];
  is_account_installed?: 0 | 1;
}

const { Title, Paragraph } = Typography;
const FormItem = Form.Item;

// 来源显示映射
const sourceLabels: Record<string, string> = {
  official: '官方',
  third_party: '第三方',
  custom: '自定义',
};

const Market: React.FC = () => {
  const [form] = Form.useForm();
  const [apps, setApps] = useState<ExtendedAppItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  useEffect(() => {
    fetchApps(searchKeyword, selectedSources);
  }, []);

  const fetchApps = async (keyword?: string, sources?: string[]) => {
    try {
      setLoading(true);
      // 请求后端接口
      const response = await getMarketApps({
        keyword: keyword || '',
        source: sources && sources.length > 0 ? sources : undefined,
      });

      if (response && (response as any).code === 200) {
        const data = (response as any).data || [];
        setApps(data);
      } else {
        console.error('获取应用列表失败:', response);
        setApps([]);
      }
    } catch (error) {
      console.error('获取应用列表失败:', error);
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
    fetchApps(value, selectedSources);
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
    const sources = values as string[];
    setSelectedSources(sources);
    setCurrentPage(1);
    fetchApps(searchKeyword, sources);
  };

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
  };

  const handleInstall = async (app: AppItem) => {
    if (!app.module_id) {
      message.error('模块ID不存在');
      return;
    }

    try {
      const response = await installModule({
        data: { module_id: app.module_id },
      });

      if (response.code === 200) {
        message.success('安装成功');
        // 刷新应用列表
        fetchApps(searchKeyword, selectedSources);
      } else {
        message.error(response.message || '安装失败');
      }
    } catch (error: any) {
      console.error('安装模块失败:', error);
      message.error(error?.message || '安装模块失败');
    }
  };

  return (
    <PageContainer>
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
                        {app.is_account_installed === 1 ? (
                          <span style={{ color: '#999', fontSize: 12 }}>
                            已安装
                          </span>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleInstall(app)}
                          >
                            安装
                          </Button>
                        )}
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
    </PageContainer>
  );
};

export default Market;
