/**
 * Admin 模块
 * 后台管理业务模块，包含所有管理页面和服务
 */

import type { ModuleMeta } from '../types';
import menuLocales from './locales/zh-CN/menu';
import routes from './routes';

// 导出 services
export * as services from './services';

/**
 * Admin 模块元数据
 */
const adminMeta: ModuleMeta = {
  name: 'admin',
  description: '后台管理模块 - 包含所有管理页面和服务',
  routes,
  access: {
    // Admin 模块权限：已登录用户即可访问（后端会做细粒度权限控制）
    canAdmin: true,
  },
  locales: {
    'zh-CN': menuLocales,
  },
};

export default adminMeta;
