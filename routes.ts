/**
 * Admin 模块路由配置
 * 包含所有后台管理业务路由
 */

import type { IRoute } from '@umijs/max';

const routes: IRoute[] = [
  // 工作台
  {
    path: '/workbench',
    name: 'workbench',
    component: '@/modules/admin/pages/dashboard/Workplace',
    access: 'canAdmin',
  },

  // 用户管理
  {
    path: '/user',
    name: 'user',
    redirect: '/user/list',
    access: 'canAdmin',
  },
  {
    path: '/user/list',
    name: 'user.list',
    component: '@/modules/admin/pages/user/User',
    access: 'canAdmin',
  },
  {
    path: '/user/pending',
    name: 'user.pending',
    component: '@/modules/admin/pages/user/Pending',
    access: 'canAdmin',
  },

  // 通知管理
  {
    path: '/notification',
    name: 'notif',
    redirect: '/notification/systemNotification',
    access: 'canAdmin',
  },
  {
    path: '/notification/systemNotification',
    name: 'notif.systemNotification',
    component: '@/modules/admin/pages/notification/SystemNotification',
    access: 'canAdmin',
  },
  {
    path: '/notification/message',
    name: 'notif.message',
    component: '@/modules/admin/pages/notification/Message',
    access: 'canAdmin',
  },
  {
    path: '/notification/announcement',
    name: 'notif.announcement',
    component: '@/modules/admin/pages/notification/Announcement',
    access: 'canAdmin',
  },

  // 应用管理
  {
    path: '/app',
    name: 'app',
    redirect: '/app/market',
    access: 'canAdmin',
  },
  {
    path: '/app/market',
    name: 'app.market',
    component: '@/modules/admin/pages/app/Market',
    access: 'canAdmin',
  },
  {
    path: '/app/my',
    name: 'app.my',
    component: '@/modules/admin/pages/app/My',
    access: 'canAdmin',
  },

  // 公司管理
  {
    path: '/company',
    name: 'org',
    redirect: '/company/company',
    access: 'canAdmin',
  },
  {
    path: '/company/company',
    name: 'org.company',
    component: '@/modules/admin/pages/company/Company',
    access: 'canAdmin',
  },
  {
    path: '/company/department',
    name: 'org.dept',
    component: '@/modules/admin/pages/company/Department',
    access: 'canAdmin',
  },

  // 菜单管理
  {
    path: '/menu',
    name: 'menu',
    redirect: '/menu/role',
    access: 'canAdmin',
  },
  {
    path: '/menu/role',
    name: 'menu.role',
    component: '@/modules/admin/pages/menu/Role',
    access: 'canAdmin',
  },
  {
    path: '/menu/menu',
    name: 'menu.menu',
    component: '@/modules/admin/pages/menu/Menu',
    access: 'canAdmin',
  },

  // 系统管理
  {
    path: '/system',
    name: 'system',
    redirect: '/system/admin',
    access: 'canAdmin',
  },
  {
    path: '/system/admin',
    name: 'system.admin',
    component: '@/modules/admin/pages/system/Admin',
    access: 'canAdmin',
  },
  {
    path: '/system/dict',
    name: 'system.dict',
    component: '@/modules/admin/pages/system/Dict',
    access: 'canAdmin',
  },
  {
    path: '/system/dictTree',
    name: 'system.dictTree',
    component: '@/modules/admin/pages/system/DictTree',
    access: 'canAdmin',
  },
  {
    path: '/system/log',
    name: 'system.log',
    component: '@/modules/admin/pages/system/Log',
    access: 'canAdmin',
  },
];

export default routes;
