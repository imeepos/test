import React from 'react'
import { Layout, Space, Avatar, Dropdown, Button, Badge, Typography } from 'antd'
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  GithubOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Header } = Layout
const { Text } = Typography

export const AppHeader: React.FC = () => {
  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: '帮助中心',
    },
    {
      key: 'github',
      icon: <GithubOutlined />,
      label: 'GitHub',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'profile':
        // 跳转到个人资料页面
        break
      case 'settings':
        window.location.href = '/settings'
        break
      case 'help':
        // 打开帮助中心
        break
      case 'github':
        window.open('https://github.com/sker-developer', '_blank')
        break
      case 'logout':
        // 处理退出登录
        break
    }
  }

  const handleNotificationClick = () => {
    // 处理通知点击
    console.log('通知点击')
  }

  return (
    <Header className="flex items-center justify-between bg-white border-b border-gray-200 px-6">
      {/* 左侧 Logo 和标题 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SK</span>
          </div>
          <div>
            <Text className="text-lg font-semibold text-gray-900">
              SKER Developer
            </Text>
            <Text className="text-xs text-gray-500 ml-2">
              插件开发平台
            </Text>
          </div>
        </div>
      </div>

      {/* 中间搜索区域 - 未来扩展 */}
      <div className="flex-1 max-w-md mx-8">
        {/* 搜索框可以在后续版本中添加 */}
      </div>

      {/* 右侧操作区域 */}
      <Space size="middle">
        {/* 通知按钮 */}
        <Badge count={3} size="small">
          <Button
            type="text"
            shape="circle"
            icon={<BellOutlined />}
            onClick={handleNotificationClick}
            className="flex items-center justify-center"
          />
        </Badge>

        {/* 用户菜单 */}
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleUserMenuClick,
          }}
          placement="bottomRight"
          arrow
        >
          <Space className="cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
            <Avatar
              size="small"
              icon={<UserOutlined />}
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=developer"
            />
            <Text className="text-sm text-gray-700">开发者</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}