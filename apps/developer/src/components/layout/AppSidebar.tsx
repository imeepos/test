import React, { useState } from 'react'
import { Layout, Menu, Typography } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  FolderOutlined,
  CodeOutlined,
  BookOutlined,
  ToolOutlined,
  ShopOutlined,
  TeamOutlined,
  SettingOutlined,
  RocketOutlined,
  ApiOutlined,
  BugOutlined,
  HeartOutlined,
  CrownOutlined,
  GiftOutlined,
} from '@ant-design/icons'
import type { MenuItem } from '@types/index'

const { Sider } = Layout
const { Text } = Typography

export const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/workspace/projects')) return ['projects']
    if (path.startsWith('/workspace/ide')) return ['ide']
    if (path.startsWith('/workspace')) return ['dashboard']
    if (path.startsWith('/docs')) return ['docs']
    if (path.startsWith('/tools')) return ['tools']
    if (path.startsWith('/marketplace')) return ['marketplace']
    if (path.startsWith('/community')) return ['community']
    if (path.startsWith('/settings')) return ['settings']
    return ['dashboard']
  }

  // 菜单项配置
  const menuItems: MenuItem[] = [
    {
      key: 'workspace',
      label: '工作台',
      icon: <DashboardOutlined />,
      children: [
        {
          key: 'dashboard',
          label: '仪表板',
          icon: <DashboardOutlined />,
          path: '/workspace/dashboard',
        },
        {
          key: 'projects',
          label: '我的项目',
          icon: <FolderOutlined />,
          path: '/workspace/projects',
        },
        {
          key: 'ide',
          label: '开发环境',
          icon: <CodeOutlined />,
          path: '/workspace/ide',
        },
      ],
    },
    {
      key: 'docs',
      label: '文档',
      icon: <BookOutlined />,
      children: [
        {
          key: 'quick-start',
          label: '快速开始',
          icon: <RocketOutlined />,
          path: '/docs/quick-start',
        },
        {
          key: 'api-reference',
          label: 'API参考',
          icon: <ApiOutlined />,
          path: '/docs/api-reference',
        },
        {
          key: 'guides',
          label: '指南教程',
          icon: <BookOutlined />,
          path: '/docs/guides',
        },
        {
          key: 'examples',
          label: 'API示例',
          icon: <CodeOutlined />,
          path: '/docs/examples',
        },
      ],
    },
    {
      key: 'tools',
      label: '工具',
      icon: <ToolOutlined />,
      children: [
        {
          key: 'debug-tools',
          label: '调试工具',
          icon: <BugOutlined />,
          path: '/tools/debug',
        },
        {
          key: 'testing-tools',
          label: '测试工具',
          icon: <ToolOutlined />,
          path: '/tools/testing',
        },
        {
          key: 'dev-tools',
          label: '开发工具',
          icon: <CodeOutlined />,
          path: '/tools/development',
        },
        {
          key: 'security-tools',
          label: '安全工具',
          icon: <CrownOutlined />,
          path: '/tools/security',
        },
      ],
    },
    {
      key: 'marketplace',
      label: '市场',
      icon: <ShopOutlined />,
      children: [
        {
          key: 'my-plugins',
          label: '我的插件',
          icon: <HeartOutlined />,
          path: '/marketplace/my-plugins',
        },
        {
          key: 'browse',
          label: '插件浏览',
          icon: <ShopOutlined />,
          path: '/marketplace/browse',
        },
        {
          key: 'publishing',
          label: '发布管理',
          icon: <RocketOutlined />,
          path: '/marketplace/publishing',
        },
        {
          key: 'revenue',
          label: '收益中心',
          icon: <GiftOutlined />,
          path: '/marketplace/revenue',
        },
      ],
    },
    {
      key: 'community',
      label: '社区',
      icon: <TeamOutlined />,
      children: [
        {
          key: 'forums',
          label: '论坛讨论',
          icon: <TeamOutlined />,
          path: '/community/forums',
        },
        {
          key: 'learning',
          label: '学习资源',
          icon: <BookOutlined />,
          path: '/community/learning',
        },
        {
          key: 'support',
          label: '开发者支持',
          icon: <HeartOutlined />,
          path: '/community/support',
        },
        {
          key: 'events',
          label: '社区活动',
          icon: <GiftOutlined />,
          path: '/community/events',
        },
      ],
    },
    {
      key: 'settings',
      label: '设置',
      icon: <SettingOutlined />,
      path: '/settings',
    },
  ]

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    const findMenuItem = (items: MenuItem[], targetKey: string): MenuItem | null => {
      for (const item of items) {
        if (item.key === targetKey) return item
        if (item.children) {
          const found = findMenuItem(item.children, targetKey)
          if (found) return found
        }
      }
      return null
    }

    const menuItem = findMenuItem(menuItems, key)
    if (menuItem?.path) {
      navigate(menuItem.path)
    }
  }

  // 转换菜单项格式给 Ant Design Menu 组件
  const transformMenuItems = (items: MenuItem[]) => {
    return items.map((item) => ({
      key: item.key,
      label: (
        <span className="flex items-center">
          {item.icon}
          <span className={collapsed ? 'opacity-0' : 'opacity-100 transition-opacity'}>
            {item.label}
          </span>
          {item.badge && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </span>
      ),
      icon: item.icon,
      children: item.children ? transformMenuItems(item.children) : undefined,
      disabled: item.disabled,
    }))
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={240}
      className="bg-white border-r border-gray-200"
      trigger={null}
    >
      {/* 侧边栏头部 */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        {!collapsed && (
          <Text className="text-lg font-semibold text-gray-900">
            开发者平台
          </Text>
        )}
      </div>

      {/* 菜单 */}
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        items={transformMenuItems(menuItems)}
        onClick={handleMenuClick}
        className="border-none h-full pt-4"
        inlineCollapsed={collapsed}
      />

      {/* 折叠按钮 */}
      <div
        className="absolute bottom-4 left-4 right-4 flex justify-center cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="w-6 h-1 bg-gray-400 rounded-full"></div>
      </div>
    </Sider>
  )
}