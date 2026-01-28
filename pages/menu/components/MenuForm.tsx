import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormDigit,
  ProFormItem,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Col, Form, Input, Row, Space, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getIconComponent, IconDisplay } from '@/components';
import { ensureAllFormFields } from '@/modules/base/utils/constants';

// 菜单类型枚举
const MENU_TYPE_OPTIONS = [
  { label: '目录', value: 'dir' },
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
  { label: '链接', value: 'link' },
];

interface MenuFormProps {
  visible: boolean;
  editingRecord: any;
  parentMenuOptions: Array<{ label: string; value: number }>;
  moduleOptions: Array<{ label: string; value: number }>;
  selectedModuleId?: number;
  accountType?: 'admin' | 'user';
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const MenuForm: React.FC<MenuFormProps> = ({
  visible,
  editingRecord,
  parentMenuOptions,
  moduleOptions,
  selectedModuleId,
  accountType = 'admin',
  onCancel,
  onSubmit,
}) => {
  const [formKey, setFormKey] = useState<string>(
    editingRecord?.menu_id || `new-${Date.now()}`,
  );
  const formRef = useRef<ProFormInstance>(undefined);

  // 初始化表单 key，确保表单正确重置
  useEffect(() => {
    if (visible) {
      if (!editingRecord) {
        setFormKey(`new-${Date.now()}`);
      } else {
        setFormKey(editingRecord.menu_id || `edit-${Date.now()}`);
      }
    }
  }, [visible, editingRecord]);

  // 设置表单初始值（使用 setFieldsValue 避免 initialValues 警告）
  useEffect(() => {
    if (visible && formRef.current) {
      const timer = setTimeout(() => {
        if (formRef.current) {
          if (editingRecord) {
            formRef.current.setFieldsValue({
              ...editingRecord,
              parent_id: editingRecord.parent_id ?? 0,
              module_id: editingRecord.module_id ?? null,
              menu_type: editingRecord.menu_type || 'menu',
              status: editingRecord.status ?? 1,
              sort: editingRecord.sort ?? 0,
              is_required: editingRecord.is_required ?? 0,
            });
          } else {
            formRef.current.setFieldsValue({
              parent_id: 0,
              module_id: selectedModuleId ?? null,
              menu_type: 'menu',
              status: 1,
              sort: 0,
              is_required: 0,
            });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [visible, editingRecord, selectedModuleId]);

  // 获取表单标题
  const getFormTitle = () => {
    if (editingRecord) {
      const typeLabel =
        MENU_TYPE_OPTIONS.find((opt) => opt.value === editingRecord.menu_type)
          ?.label || '菜单';
      return `编辑${typeLabel}`;
    }
    return '新增菜单';
  };

  // 解析图标名称，支持 <IconName /> 格式
  const parseIconName = (value: string): string => {
    if (!value) return '';
    // 匹配 <IconName /> 或 <IconName/> 格式
    const match = value.match(/<\s*(\w+)\s*\/?\s*>/);
    if (match) {
      return match[1];
    }
    // 去除首尾空格
    return value.trim();
  };

  const IconPreview: React.FC = () => {
    const iconValue = Form.useWatch('menu_icon');
    const parsedIconName = parseIconName(iconValue);
    const IconComponent = getIconComponent(parsedIconName);

    if (!parsedIconName) {
      return null;
    }

    return IconComponent ? (
      <IconDisplay iconName={parsedIconName} fontSize={20} />
    ) : (
      <span style={{ color: '#ff4d4f' }}>图标不存在</span>
    );
  };

  return (
    <DrawerForm
      key={formKey}
      formRef={formRef}
      title={getFormTitle()}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      onFinish={async (values) => {
        // 定义所有表单字段，确保它们都被包含
        const allFormFields = [
          'menu_name',
          'menu_key',
          'menu_path',
          'menu_type',
          'parent_id',
          'module_id',
          'menu_icon',
          'component',
          'redirect',
          'status',
          'sort',
          'is_required',
          'account_type',
        ];
        // 确保所有字段都被包含
        const completeValues = ensureAllFormFields(
          formRef,
          values,
          allFormFields,
        );

        // 解析图标名称，去除 <> 标签
        if (completeValues.menu_icon) {
          completeValues.menu_icon = parseIconName(completeValues.menu_icon);
        }

        // 根据菜单类型清理不需要的字段
        const menuType = completeValues.menu_type;
        if (menuType === 'dir') {
          // 目录类型：只做分组展开/收起，不需要组件路径和重定向
          completeValues.component = '';
          completeValues.redirect = '';
        } else if (menuType === 'button') {
          // 按钮类型：不需要路由路径、图标、组件路径、重定向
          completeValues.menu_path = '';
          completeValues.menu_icon = '';
          completeValues.component = '';
          completeValues.redirect = '';
        } else if (menuType === 'link') {
          // 链接类型：不需要组件路径和重定向
          completeValues.component = '';
          completeValues.redirect = '';
        }

        // 如果是新增菜单，追加 account_type
        const submitValues = editingRecord
          ? completeValues
          : { ...completeValues, account_type: accountType };
        await onSubmit(submitValues);
        // 不返回 true，让父组件通过 visible 控制关闭
      }}
      width={800}
    >
      <Row gutter={16}>
        <Col span={12}>
          <ProFormSelect
            name="module_id"
            label="模块"
            options={moduleOptions}
            fieldProps={{
              placeholder: '请选择模块',
              showSearch: true,
              filterOption: (input, option) =>
                (option?.label ?? '')
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase()),
              disabled: !!editingRecord, // 编辑时禁用
            }}
          />
        </Col>
        <Col span={12}>
          <ProFormSelect
            name="menu_type"
            label="类型"
            options={MENU_TYPE_OPTIONS}
            rules={[{ required: true, message: '请选择类型' }]}
            fieldProps={{
              placeholder: '请选择类型',
            }}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <ProFormSelect
            name="parent_id"
            label="父级"
            options={[{ label: '顶级', value: 0 }, ...parentMenuOptions]}
            fieldProps={{
              placeholder: '请选择父级',
              showSearch: true,
              filterOption: (input, option) =>
                (option?.label ?? '')
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase()),
            }}
          />
        </Col>
      </Row>

      <ProFormDependency name={['menu_type']}>
        {({ menu_type }) => (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <ProFormText
                  name="menu_name"
                  label={
                    menu_type === 'dir'
                      ? '目录名称'
                      : menu_type === 'button'
                        ? '按钮名称'
                        : menu_type === 'link'
                          ? '链接名称'
                          : '菜单名称'
                  }
                  rules={[{ required: true, message: '请输入名称' }]}
                  fieldProps={{
                    placeholder: '请输入名称',
                    maxLength: 50,
                    showCount: true,
                  }}
                />
              </Col>
              <Col span={12}>
                <ProFormText
                  name="menu_key"
                  label={
                    <span>
                      Key（国际化）
                      <Tooltip title="用于国际化，如：workbench">
                        <ExclamationCircleOutlined style={{ marginLeft: 4 }} />
                      </Tooltip>
                    </span>
                  }
                  fieldProps={{
                    placeholder: '请输入Key',
                    maxLength: 100,
                    showCount: true,
                  }}
                />
              </Col>
            </Row>

            {/* 目录、菜单、链接 需要路由路径 */}
            {menu_type !== 'button' && (
              <Row gutter={16}>
                <Col span={12}>
                  <ProFormText
                    name="menu_path"
                    label={menu_type === 'link' ? '链接地址' : '路由路径'}
                    rules={
                      menu_type === 'link'
                        ? [{ required: true, message: '请输入链接地址' }]
                        : undefined
                    }
                    fieldProps={{
                      placeholder:
                        menu_type === 'link'
                          ? '请输入链接地址（如：https://example.com）'
                          : '请输入路由路径（如：/dashboard）',
                      maxLength: 200,
                      showCount: true,
                    }}
                  />
                </Col>
                <Col span={12}>
                  <ProFormItem
                    name="menu_icon"
                    label={
                      <span>
                        图标
                        <Tooltip
                          title={
                            <span>
                              点击查看{' '}
                              <a
                                href="https://ant.design/components/icon-cn"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1890ff' }}
                              >
                                Ant Design 图标列表
                              </a>
                            </span>
                          }
                        >
                          <ExclamationCircleOutlined
                            style={{ marginLeft: 4 }}
                          />
                        </Tooltip>
                      </span>
                    }
                  >
                    <Space align="center" style={{ width: '100%' }}>
                      <Form.Item name="menu_icon" noStyle>
                        <Input
                          placeholder="请输入图标名称"
                          style={{ width: 200 }}
                        />
                      </Form.Item>
                      <IconPreview />
                    </Space>
                  </ProFormItem>
                </Col>
              </Row>
            )}

            {/* 菜单类型 需要组件路径 */}
            {menu_type === 'menu' && (
              <Row gutter={16}>
                <Col span={12}>
                  <ProFormText
                    name="component"
                    label={
                      <span>
                        组件路径
                        <Tooltip title="相对路径，如：./Dashboard/Workplace">
                          <ExclamationCircleOutlined
                            style={{ marginLeft: 4 }}
                          />
                        </Tooltip>
                      </span>
                    }
                    fieldProps={{
                      placeholder: '请输入组件路径',
                      maxLength: 200,
                      showCount: true,
                    }}
                  />
                </Col>
                <Col span={12}>
                  <ProFormText
                    name="redirect"
                    label="重定向路径"
                    fieldProps={{
                      placeholder: '请输入重定向路径',
                      maxLength: 200,
                      showCount: true,
                    }}
                  />
                </Col>
              </Row>
            )}
          </>
        )}
      </ProFormDependency>

      <Row gutter={16}>
        <Col span={12}>
          <ProFormRadio.Group
            name="status"
            label="状态"
            options={[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]}
            rules={[{ required: true, message: '请选择状态' }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDigit
            name="sort"
            label={
              <span>
                排序
                <Tooltip title="数值越小越靠前">
                  <ExclamationCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            fieldProps={{
              placeholder: '请输入排序值',
              style: { width: '100%' },
              min: 0,
            }}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <ProFormRadio.Group
            name="is_required"
            label={
              <span>
                是否必须选中
                <Tooltip title="一般用于工作台、用户配置等必选菜单，勾选后会自动分配给所有用户">
                  <ExclamationCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            options={[
              { label: '是', value: 1 },
              { label: '否', value: 0 },
            ]}
          />
        </Col>
      </Row>
    </DrawerForm>
  );
};

export default MenuForm;
