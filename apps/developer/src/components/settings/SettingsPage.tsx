import React from 'react'
import { Card, Typography, Button, Empty } from 'antd'
import {
  SettingOutlined,
  UserOutlined,
  SecurityScanOutlined,
  CreditCardOutlined,
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          设置
        </Title>
        <Paragraph className="text-gray-600">
          管理您的账户设置、开发环境配置和安全选项
        </Paragraph>
      </div>

      <div className="text-center py-20">
        <SettingOutlined className="text-6xl text-gray-400 mb-6" />
        <Title level={3} type="secondary" className="mb-4">
          设置页面正在开发中
        </Title>
        <Paragraph type="secondary" className="mb-8 max-w-md mx-auto">
          我们正在开发完整的设置管理界面，包括个人资料、开发环境配置、
          账户管理和安全设置。敬请期待！
        </Paragraph>
        <Button type="primary" size="large">
          查看基础设置
        </Button>
      </div>
    </div>
  )
}