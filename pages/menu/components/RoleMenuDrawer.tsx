import {
  App,
  Button,
  Card,
  Checkbox,
  Drawer,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tabs,
  theme,
} from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getModuleList,
  getRoleMenus,
  moveAllBackByModule,
  moveMenuBackToOriginal,
  moveMenuToModule,
  updateRoleMenus,
} from '@/modules/admin/services/system';

interface RoleMenuDrawerProps {
  visible: boolean;
  roleRecord: any;
  accountType: 'admin' | 'user';
  onClose: () => void;
  onSuccess?: () => void;
}

interface ModuleData {
  module_id: number;
  module_name: string;
  module_alias: string;
  module_title?: string;
}

interface MenuData {
  menu_id: number;
  menu_name: string;
  menu_key: string;
  menu_type: string;
  parent_id: number;
  module_id?: number | null;
  is_required?: number;
  target_module_id?: number | null;
  children?: MenuData[];
}

interface MenusByModule {
  module: ModuleData;
  menus: MenuData[];
}

// 按目录分组的菜单结构
interface MenuGroup {
  dir: MenuData | null; // null 表示独立菜单（没有目录的顶级菜单）
  children: MenuData[];
  // 所有菜单ID（包括目录本身和所有子菜单）
  allMenuIds: number[];
  // 是否为独立菜单组（没有目录的顶级菜单）
  isStandalone?: boolean;
  // 原始模块ID（菜单本身所属的模块）
  originalModuleId?: number | null;
  // 目标模块ID（如果该组被移动到其他模块）
  targetModuleId?: number | null;
}

const RoleMenuDrawer: React.FC<RoleMenuDrawerProps> = ({
  visible,
  roleRecord,
  accountType,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [menusByModule, setMenusByModule] = useState<MenusByModule[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<number[]>([]);

  // 所有模块列表
  const [allModules, setAllModules] = useState<ModuleData[]>([]);

  // 菜单移动映射：menu_id => target_module_id
  const [menuMoveMap, setMenuMoveMap] = useState<Record<number, number>>({});

  // 移动弹窗状态
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [moveModalLoading, setMoveModalLoading] = useState(false);
  const [moveModalGroup, setMoveModalGroup] = useState<MenuGroup | null>(null);
  const [moveModalSourceModuleId, setMoveModalSourceModuleId] = useState<
    number | null
  >(null);
  const [moveModalTargetModuleId, setMoveModalTargetModuleId] = useState<
    number | null
  >(null);

  // 收集所有 is_required=1 的菜单ID
  const requiredMenuIds = useMemo(() => {
    const ids = new Set<number>();
    const collectRequired = (menus: MenuData[]) => {
      menus.forEach((menu) => {
        if (menu.is_required === 1) {
          ids.add(menu.menu_id);
        }
        if (menu.children) {
          collectRequired(menu.children);
        }
      });
    };
    for (const m of menusByModule) {
      collectRequired(m.menus);
    }
    return ids;
  }, [menusByModule]);

  // 加载角色菜单数据和模块列表
  useEffect(() => {
    if (visible && roleRecord?.role_id) {
      loadRoleMenus();
      loadModuleList();
    }
  }, [visible, roleRecord?.role_id]);

  const loadModuleList = async () => {
    try {
      const res = await getModuleList();
      if (res.code === 200 && res.data) {
        setAllModules(res.data);
      }
    } catch (_error) {
      console.error('获取模块列表失败');
    }
  };

  const loadRoleMenus = async () => {
    if (!roleRecord?.role_id) return;

    setLoading(true);
    try {
      const res = await getRoleMenus({
        role_id: roleRecord.role_id,
        account_type: accountType,
      });
      if (res.code === 200 && res.data) {
        const { modules_with_menus, checked_menu_ids, menu_move_map } =
          res.data;
        setMenusByModule(modules_with_menus || []);
        setMenuMoveMap(menu_move_map || {});

        // 收集所有 is_required=1 的菜单ID
        const requiredIds = new Set<number>();
        const collectRequired = (menus: MenuData[]) => {
          menus.forEach((menu) => {
            if (menu.is_required === 1) {
              requiredIds.add(menu.menu_id);
            }
            if (menu.children) {
              collectRequired(menu.children);
            }
          });
        };
        for (const m of modules_with_menus || []) {
          collectRequired(m.menus);
        }

        // 合并已选中的菜单ID和必选菜单ID
        const mergedIds = new Set([
          ...(checked_menu_ids || []),
          ...requiredIds,
        ]);
        setCheckedMenuIds(Array.from(mergedIds));

        // 设置默认激活的Tab
        if (modules_with_menus && modules_with_menus.length > 0) {
          setActiveModuleId(String(modules_with_menus[0].module.module_id));
        }
      } else {
        message.error(res.message || '获取角色菜单失败');
      }
    } catch (_error) {
      message.error('获取角色菜单失败');
    } finally {
      setLoading(false);
    }
  };

  // 将菜单树转换为按目录分组的结构
  const convertToMenuGroups = (
    menus: MenuData[],
    currentModuleId: number,
  ): MenuGroup[] => {
    const groups: MenuGroup[] = [];
    const standaloneMenus: MenuData[] = [];

    menus.forEach((menu) => {
      if (menu.menu_type === 'dir') {
        // 目录类型，收集其子菜单
        const children = collectAllChildren(menu.children || []);
        // 收集所有菜单ID（目录本身 + 所有子菜单）
        const allMenuIds = [menu.menu_id, ...children.map((c) => c.menu_id)];

        // 检查该菜单组是否被移动（以目录的 menu_id 为准）
        const targetModuleId = menuMoveMap[menu.menu_id] || null;

        groups.push({
          dir: menu,
          children: children,
          allMenuIds: allMenuIds,
          originalModuleId: menu.module_id,
          targetModuleId: targetModuleId,
        });
      } else {
        // 非目录类型的顶级菜单（如工作台），作为独立菜单
        standaloneMenus.push(menu);
        // 如果有子菜单也要收集
        if (menu.children && menu.children.length > 0) {
          standaloneMenus.push(...collectAllChildren(menu.children));
        }
      }
    });

    // 如果有独立菜单，添加到最前面
    if (standaloneMenus.length > 0) {
      const firstStandaloneModuleId = standaloneMenus[0]?.module_id;
      const firstStandaloneTargetModuleId =
        menuMoveMap[standaloneMenus[0]?.menu_id] || null;
      groups.unshift({
        dir: null,
        children: standaloneMenus,
        allMenuIds: standaloneMenus.map((m) => m.menu_id),
        isStandalone: true,
        originalModuleId: firstStandaloneModuleId,
        targetModuleId: firstStandaloneTargetModuleId,
      });
    }

    return groups;
  };

  // 递归收集所有子菜单（展平）
  const collectAllChildren = (menus: MenuData[]): MenuData[] => {
    const result: MenuData[] = [];
    menus.forEach((menu) => {
      result.push(menu);
      if (menu.children && menu.children.length > 0) {
        result.push(...collectAllChildren(menu.children));
      }
    });
    return result;
  };

  // 检查菜单组是否被移动到其他模块
  // 如果 targetModuleId 存在且与当前模块不同，且不等于原始模块，说明已被移动
  const isGroupMoved = (group: MenuGroup, currentModuleId: number): boolean => {
    return (
      group.targetModuleId !== null &&
      group.targetModuleId !== undefined &&
      group.targetModuleId !== currentModuleId &&
      group.targetModuleId !== group.originalModuleId
    );
  };

  // 检查菜单组是否是从其他模块移入的
  // 如果 targetModuleId 等于当前模块ID，且不等于原始模块ID，说明是移入的
  const isGroupMovedIn = (
    group: MenuGroup,
    currentModuleId: number,
  ): boolean => {
    return (
      group.targetModuleId !== null &&
      group.targetModuleId !== undefined &&
      group.targetModuleId === currentModuleId &&
      group.originalModuleId !== null &&
      group.originalModuleId !== undefined &&
      group.originalModuleId !== currentModuleId
    );
  };

  // 获取模块名称
  const getModuleName = (moduleId: number): string => {
    const module = menusByModule.find((m) => m.module.module_id === moduleId);
    if (module) {
      return module.module.module_title || module.module.module_name;
    }
    const allModule = allModules.find((m) => m.module_id === moduleId);
    return allModule?.module_title || allModule?.module_name || '未知模块';
  };

  // 处理单个菜单勾选变化
  const handleMenuCheck = (menu: MenuData, checked: boolean) => {
    // 如果是必选菜单，不允许取消
    if (menu.is_required === 1) {
      return;
    }
    if (checked) {
      setCheckedMenuIds([...checkedMenuIds, menu.menu_id]);
    } else {
      setCheckedMenuIds(checkedMenuIds.filter((id) => id !== menu.menu_id));
    }
  };

  // 处理目录全选/取消全选
  const handleDirCheckAll = (group: MenuGroup, checked: boolean) => {
    const dirMenuIds = group.allMenuIds;
    // 收集该分组中的必选菜单
    const requiredInDir = [
      ...(group.dir?.is_required === 1 ? [group.dir.menu_id] : []),
      ...group.children
        .filter((m) => m.is_required === 1)
        .map((m) => m.menu_id),
    ];

    if (checked) {
      const newIds = new Set([...checkedMenuIds, ...dirMenuIds]);
      setCheckedMenuIds(Array.from(newIds));
    } else {
      // 取消全选时，保留必选菜单
      setCheckedMenuIds(
        checkedMenuIds.filter(
          (id) => !dirMenuIds.includes(id) || requiredInDir.includes(id),
        ),
      );
    }
  };

  // 检查目录分组是否全选（只检查子菜单是否全选）
  const isGroupAllChecked = (group: MenuGroup): boolean => {
    // 对于目录类型，只检查 children 是否全选
    if (group.dir && !group.isStandalone) {
      return group.children.every((child) =>
        checkedMenuIds.includes(child.menu_id),
      );
    }
    // 对于独立菜单组，检查所有菜单
    return group.allMenuIds.every((id) => checkedMenuIds.includes(id));
  };

  // 检查目录分组是否部分选中（只检查子菜单）
  const isGroupIndeterminate = (group: MenuGroup): boolean => {
    // 对于目录类型，只检查 children
    if (group.dir && !group.isStandalone) {
      const checkedCount = group.children.filter((child) =>
        checkedMenuIds.includes(child.menu_id),
      ).length;
      return checkedCount > 0 && checkedCount < group.children.length;
    }
    // 对于独立菜单组，检查所有菜单
    const checkedCount = group.allMenuIds.filter((id) =>
      checkedMenuIds.includes(id),
    ).length;
    return checkedCount > 0 && checkedCount < group.allMenuIds.length;
  };

  // 检查目录分组是否全是必选菜单
  const isGroupAllRequired = (group: MenuGroup): boolean => {
    return group.allMenuIds.every((id) => requiredMenuIds.has(id));
  };

  // 获取分组的显示名称
  const getGroupTitle = (group: MenuGroup): string => {
    if (group.isStandalone) {
      return '独立菜单';
    }
    return group.dir?.menu_name || '';
  };

  // 获取模块的选中菜单数和总菜单数
  const getModuleMenuStats = (
    moduleId: number,
  ): {
    checked: number;
    total: number;
    movedInCount: number;
    movedOutCount: number;
  } => {
    const currentModule = menusByModule.find(
      (m) => m.module.module_id === moduleId,
    );
    if (!currentModule)
      return { checked: 0, total: 0, movedInCount: 0, movedOutCount: 0 };

    const groups = convertToMenuGroups(currentModule.menus, moduleId);

    let totalNative = 0;
    let checkedNative = 0;
    let movedInCount = 0;
    let movedOutCount = 0;

    groups.forEach((group) => {
      const isMoved = isGroupMoved(group, moduleId);
      const isMovedIn = isGroupMovedIn(group, moduleId);

      if (isMoved) {
        // 被移出的菜单组
        movedOutCount++;
      } else if (isMovedIn) {
        // 被移入的菜单组
        movedInCount++;
      } else {
        // 正常的菜单组
        totalNative += group.allMenuIds.length;

        if (group.dir && !group.isStandalone) {
          const childrenCheckedCount = group.children.filter((child) =>
            checkedMenuIds.includes(child.menu_id),
          ).length;
          checkedNative +=
            childrenCheckedCount + (childrenCheckedCount > 0 ? 1 : 0);
        } else {
          checkedNative += group.allMenuIds.filter((id) =>
            checkedMenuIds.includes(id),
          ).length;
        }
      }
    });

    return {
      checked: checkedNative,
      total: totalNative,
      movedInCount,
      movedOutCount,
    };
  };

  // 计算总统计数据
  const totalStats = useMemo(() => {
    let totalChecked = 0;
    let modulesWithChecked = 0;
    let totalMovedIn = 0;
    let totalMovedOut = 0;

    menusByModule.forEach((item) => {
      const groups = convertToMenuGroups(item.menus, item.module.module_id);
      let moduleHasChecked = false;

      groups.forEach((group) => {
        const isMoved = isGroupMoved(group, item.module.module_id);
        const isMovedIn = isGroupMovedIn(group, item.module.module_id);

        if (isMoved) {
          totalMovedOut++;
        } else if (isMovedIn) {
          totalMovedIn++;
        } else {
          if (group.dir && !group.isStandalone) {
            const childrenCheckedCount = group.children.filter((child) =>
              checkedMenuIds.includes(child.menu_id),
            ).length;
            const checkedInGroup =
              childrenCheckedCount + (childrenCheckedCount > 0 ? 1 : 0);
            totalChecked += checkedInGroup;
            if (checkedInGroup > 0) {
              moduleHasChecked = true;
            }
          } else {
            const checkedInGroup = group.allMenuIds.filter((id) =>
              checkedMenuIds.includes(id),
            ).length;
            totalChecked += checkedInGroup;
            if (checkedInGroup > 0) {
              moduleHasChecked = true;
            }
          }
        }
      });

      if (moduleHasChecked) {
        modulesWithChecked++;
      }
    });

    return {
      moduleCount: modulesWithChecked,
      menuCount: totalChecked,
      movedInCount: totalMovedIn,
      movedOutCount: totalMovedOut,
    };
  }, [menusByModule, checkedMenuIds, menuMoveMap]);

  // 全选当前模块（排除移动的菜单组）
  const handleSelectAll = (moduleId: number) => {
    const currentModule = menusByModule.find(
      (m) => m.module.module_id === moduleId,
    );
    if (!currentModule) return;

    const groups = convertToMenuGroups(currentModule.menus, moduleId);
    const nativeMenuIds: number[] = [];

    groups.forEach((group) => {
      const isMoved = isGroupMoved(group, moduleId);
      const isMovedIn = isGroupMovedIn(group, moduleId);
      if (!isMoved && !isMovedIn) {
        nativeMenuIds.push(...group.allMenuIds);
      }
    });

    const newIds = new Set([...checkedMenuIds, ...nativeMenuIds]);
    setCheckedMenuIds(Array.from(newIds));
  };

  // 取消全选当前模块（保留必选菜单，排除移动的菜单组）
  const handleDeselectAll = (moduleId: number) => {
    const currentModule = menusByModule.find(
      (m) => m.module.module_id === moduleId,
    );
    if (!currentModule) return;

    const groups = convertToMenuGroups(currentModule.menus, moduleId);
    const nativeMenuIdsSet = new Set<number>();

    groups.forEach((group) => {
      const isMoved = isGroupMoved(group, moduleId);
      const isMovedIn = isGroupMovedIn(group, moduleId);
      if (!isMoved && !isMovedIn) {
        group.allMenuIds.forEach((id) => {
          nativeMenuIdsSet.add(id);
        });
      }
    });

    // 保留必选菜单
    setCheckedMenuIds(
      checkedMenuIds.filter(
        (id) => !nativeMenuIdsSet.has(id) || requiredMenuIds.has(id),
      ),
    );
  };

  // 打开移动弹窗
  const handleOpenMoveModal = (group: MenuGroup, sourceModuleId: number) => {
    setMoveModalGroup(group);
    setMoveModalSourceModuleId(sourceModuleId);
    setMoveModalTargetModuleId(null);
    setMoveModalVisible(true);
  };

  // 确认移动
  const handleConfirmMove = async () => {
    if (
      !moveModalGroup ||
      moveModalSourceModuleId === null ||
      moveModalTargetModuleId === null
    ) {
      return;
    }

    const groupTitle = getGroupTitle(moveModalGroup);

    setMoveModalLoading(true);
    try {
      const res = await moveMenuToModule({
        role_id: roleRecord.role_id,
        menu_ids: moveModalGroup.allMenuIds,
        target_module_id: moveModalTargetModuleId,
      });

      if (res.code === 200) {
        message.success(`已将「${groupTitle}」移到新模块`);
        setMoveModalVisible(false);
        // 更新本地状态
        const newMenuMoveMap = { ...menuMoveMap };
        const originalModuleId = moveModalGroup.originalModuleId;
        moveModalGroup.allMenuIds.forEach((id) => {
          // 如果目标模块等于原始模块，则从map中移除（或保持null）
          if (
            moveModalTargetModuleId !== null &&
            moveModalTargetModuleId !== originalModuleId
          ) {
            newMenuMoveMap[id] = moveModalTargetModuleId;
          } else {
            // 如果移回原模块，则从map中移除
            delete newMenuMoveMap[id];
          }
        });
        setMenuMoveMap(newMenuMoveMap);
      } else {
        message.error(res.message || '移动失败');
      }
    } catch (_error) {
      message.error('移动失败');
    } finally {
      setMoveModalLoading(false);
    }
  };

  // 移回原处
  const handleMoveBack = async (menuIds: number[]) => {
    try {
      const res = await moveMenuBackToOriginal({
        role_id: roleRecord.role_id,
        menu_ids: menuIds,
      });

      if (res.code === 200) {
        message.success('已移回原处');
        // 更新本地状态
        const newMenuMoveMap = { ...menuMoveMap };
        menuIds.forEach((id) => {
          delete newMenuMoveMap[id];
        });
        setMenuMoveMap(newMenuMoveMap);
      } else {
        message.error(res.message || '移回失败');
      }
    } catch (_error) {
      message.error('移回失败');
    }
  };

  // 全部移回（将当前模块下所有已移入的菜单移回原处）
  const handleMoveAllBack = async (moduleId: number) => {
    try {
      const res = await moveAllBackByModule({
        role_id: roleRecord.role_id,
        module_id: moduleId,
      });

      if (res.code === 200) {
        message.success(res.message || '已全部移回原处');
        // 重新加载数据
        loadRoleMenus();
      } else {
        message.error(res.message || '移回失败');
      }
    } catch (_error) {
      message.error('移回失败');
    }
  };

  // 保存角色菜单
  const handleSave = async () => {
    // 构建菜单原始模块ID映射
    const menuOriginalModuleMap: Record<number, number | null> = {};
    menusByModule.forEach((item) => {
      const collectMenuModule = (menus: MenuData[]) => {
        menus.forEach((menu) => {
          menuOriginalModuleMap[menu.menu_id] = menu.module_id || null;
          if (menu.children) {
            collectMenuModule(menu.children);
          }
        });
      };
      collectMenuModule(item.menus);
    });

    // 过滤menu_move_map，只保留target_module_id不等于原始module_id的项
    const filteredMenuMoveMap: Record<number, number> = {};
    Object.keys(menuMoveMap).forEach((menuIdStr) => {
      const menuId = parseInt(menuIdStr);
      const targetModuleId = menuMoveMap[menuId];
      const originalModuleId = menuOriginalModuleMap[menuId];
      // 只有当目标模块不等于原始模块时，才包含在map中
      if (
        targetModuleId !== null &&
        targetModuleId !== undefined &&
        targetModuleId !== originalModuleId
      ) {
        filteredMenuMoveMap[menuId] = targetModuleId;
      }
    });

    // 收集所有被移动的菜单ID（这些不应该被保存在原模块）
    const movedMenuIds = new Set<number>(
      Object.keys(filteredMenuMoveMap).map((id) => parseInt(id)),
    );

    // 过滤掉已移动的菜单ID
    const effectiveMenuIds = checkedMenuIds.filter(
      (id) => !movedMenuIds.has(id),
    );

    setSaving(true);
    try {
      const res = await updateRoleMenus({
        role_id: roleRecord.role_id,
        menu_ids: effectiveMenuIds,
        menu_move_map: filteredMenuMoveMap,
      });
      if (res.code === 200) {
        message.success('保存成功');
        onSuccess?.();
        onClose();
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (_error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // Tab切换
  const handleTabChange = (key: string) => {
    setActiveModuleId(key);
  };

  // 渲染目录分组
  const renderMenuGroups = (menus: MenuData[], moduleId: number) => {
    const groups = convertToMenuGroups(menus, moduleId);

    if (groups.length === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '20px 0',
            color: token.colorTextTertiary,
          }}
        >
          暂无菜单数据
        </div>
      );
    }

    return (
      <div>
        {groups.map((group, index) => {
          const groupTitle = getGroupTitle(group);
          const isMoved = isGroupMoved(group, moduleId);
          const isMovedIn = isGroupMovedIn(group, moduleId);

          // 如果菜单组被移出到其他模块，显示禁用状态
          if (isMoved) {
            const targetModuleName = getModuleName(
              group.targetModuleId as number,
            );

            return (
              <Card
                key={group.dir?.menu_id || `standalone-${index}`}
                size="small"
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Checkbox
                      checked
                      disabled
                      style={{ textDecoration: 'line-through' }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          textDecoration: 'line-through',
                          color: token.colorTextDisabled,
                        }}
                      >
                        {groupTitle}
                      </span>
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: token.colorTextDescription,
                        }}
                      >
                        (已移到: {targetModuleName})
                      </span>
                    </Checkbox>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleMoveBack(group.allMenuIds)}
                    >
                      移回原处
                    </Button>
                  </div>
                }
                style={{
                  marginBottom: 12,
                  opacity: 0.6,
                  backgroundColor: token.colorFillAlter,
                }}
                styles={{
                  body: { padding: '12px 16px' },
                }}
              >
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}
                >
                  {group.children.map((menu) => (
                    <Checkbox
                      key={menu.menu_id}
                      checked={checkedMenuIds.includes(menu.menu_id)}
                      disabled
                      style={{ textDecoration: 'line-through' }}
                    >
                      <span style={{ textDecoration: 'line-through' }}>
                        {menu.menu_name}
                      </span>
                    </Checkbox>
                  ))}
                </div>
              </Card>
            );
          }

          // 如果是从其他模块移入的，显示禁用状态
          if (isMovedIn) {
            const originalModuleName = getModuleName(
              group.originalModuleId as number,
            );

            return (
              <Card
                key={group.dir?.menu_id || `standalone-${index}`}
                size="small"
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Checkbox
                      checked
                      disabled
                      style={{ textDecoration: 'line-through' }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          textDecoration: 'line-through',
                          color: token.colorTextDisabled,
                        }}
                      >
                        {groupTitle}
                      </span>
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: token.colorTextDescription,
                        }}
                      >
                        (来自: {originalModuleName})
                      </span>
                    </Checkbox>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleMoveBack(group.allMenuIds)}
                    >
                      移回原处
                    </Button>
                  </div>
                }
                style={{
                  marginBottom: 12,
                  opacity: 0.6,
                  backgroundColor: token.colorFillAlter,
                }}
                styles={{
                  body: { padding: '12px 16px' },
                }}
              >
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}
                >
                  {group.children.map((menu) => (
                    <Checkbox
                      key={menu.menu_id}
                      checked={checkedMenuIds.includes(menu.menu_id)}
                      disabled
                      style={{ textDecoration: 'line-through' }}
                    >
                      <span style={{ textDecoration: 'line-through' }}>
                        {menu.menu_name}
                      </span>
                    </Checkbox>
                  ))}
                </div>
              </Card>
            );
          }

          // 正常显示的菜单组
          return (
            <Card
              key={group.dir?.menu_id || `standalone-${index}`}
              size="small"
              title={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Checkbox
                    checked={isGroupAllChecked(group)}
                    indeterminate={isGroupIndeterminate(group)}
                    disabled={isGroupAllRequired(group)}
                    onChange={(e: CheckboxChangeEvent) =>
                      handleDirCheckAll(group, e.target.checked)
                    }
                  >
                    <span style={{ fontWeight: 500 }}>{groupTitle}</span>
                  </Checkbox>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleOpenMoveModal(group, moduleId)}
                  >
                    移到新模块
                  </Button>
                </div>
              }
              style={{ marginBottom: 12 }}
              styles={{
                body: { padding: '12px 16px' },
              }}
            >
              {group.children.length > 0 ? (
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}
                >
                  {group.children.map((menu) => (
                    <Checkbox
                      key={menu.menu_id}
                      checked={checkedMenuIds.includes(menu.menu_id)}
                      disabled={menu.is_required === 1}
                      onChange={(e: CheckboxChangeEvent) =>
                        handleMenuCheck(menu, e.target.checked)
                      }
                    >
                      {menu.menu_name}
                    </Checkbox>
                  ))}
                </div>
              ) : (
                <div style={{ color: token.colorTextTertiary }}>暂无子菜单</div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  // 获取可选的目标模块（排除当前模块）
  const getAvailableTargetModules = () => {
    if (moveModalSourceModuleId === null) return [];
    return allModules.filter((m) => m.module_id !== moveModalSourceModuleId);
  };

  return (
    <Drawer
      title={`角色菜单 - ${roleRecord?.role_name || ''}`}
      open={visible}
      onClose={onClose}
      width={720}
      styles={{
        body: {
          overflow: 'auto',
        },
      }}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: token.colorTextSecondary }}>
            共分配{' '}
            <span style={{ color: token.colorPrimary, fontWeight: 500 }}>
              {totalStats.moduleCount}
            </span>{' '}
            个模块， 共选择{' '}
            <span style={{ color: token.colorPrimary, fontWeight: 500 }}>
              {totalStats.menuCount}
            </span>{' '}
            个菜单
            {(totalStats.movedInCount > 0 || totalStats.movedOutCount > 0) && (
              <span style={{ marginLeft: 8, color: token.colorWarning }}>
                (移入: {totalStats.movedInCount}, 移出:{' '}
                {totalStats.movedOutCount})
              </span>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={loading}>
        {menusByModule.length > 0 ? (
          <Tabs
            activeKey={activeModuleId}
            onChange={handleTabChange}
            items={menusByModule.map((item) => {
              const stats = getModuleMenuStats(item.module.module_id);
              return {
                key: String(item.module.module_id),
                label: (
                  <span>
                    {item.module.module_title || item.module.module_name} (
                    {stats.checked}/{stats.total})
                    {(stats.movedInCount > 0 || stats.movedOutCount > 0) && (
                      <span style={{ color: token.colorWarning }}>
                        {' '}
                        +{stats.movedInCount}/-{stats.movedOutCount}
                      </span>
                    )}
                  </span>
                ),
                children: (
                  <div>
                    <div
                      style={{
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Space>
                        <Button
                          size="small"
                          onClick={() => handleSelectAll(item.module.module_id)}
                        >
                          全选
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            handleDeselectAll(item.module.module_id)
                          }
                        >
                          取消全选
                        </Button>
                      </Space>
                      {stats.movedInCount > 0 && (
                        <Popconfirm
                          title="全部移回"
                          description={`确定要将该模块下所有已移入的 ${stats.movedInCount} 个菜单组移回原处吗？`}
                          onConfirm={() =>
                            handleMoveAllBack(item.module.module_id)
                          }
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button size="small" danger>
                            全部移回
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                    {renderMenuGroups(item.menus, item.module.module_id)}
                  </div>
                ),
              };
            })}
          />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: token.colorTextTertiary,
            }}
          >
            暂无菜单数据
          </div>
        )}
      </Spin>

      {/* 移动弹窗 */}
      <Modal
        title="移到新模块"
        open={moveModalVisible}
        onOk={handleConfirmMove}
        onCancel={() => setMoveModalVisible(false)}
        okText="确认移动"
        cancelText="取消"
        confirmLoading={moveModalLoading}
        okButtonProps={{ disabled: moveModalTargetModuleId === null }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            将菜单组「
            <strong>
              {moveModalGroup ? getGroupTitle(moveModalGroup) : ''}
            </strong>
            」移到：
          </div>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择目标模块"
            value={moveModalTargetModuleId}
            onChange={(value) => setMoveModalTargetModuleId(value)}
            options={getAvailableTargetModules().map((m) => ({
              label: m.module_title || m.module_name,
              value: m.module_id,
            }))}
          />
        </div>
        <div style={{ color: token.colorTextDescription, fontSize: 12 }}>
          注意：移动后，该菜单组将在目标模块中显示为已移入状态（禁用且带删除线），可随时移回原处。
        </div>
      </Modal>
    </Drawer>
  );
};

export default RoleMenuDrawer;
