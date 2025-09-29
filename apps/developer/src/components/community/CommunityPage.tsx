import React from 'react'
import { Card, Typography, Button, Empty } from 'antd'
import {
  TeamOutlined,
  BookOutlined,
  HeartOutlined,
  GiftOutlined,
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

export const CommunityPage: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          开发者社区
        </Title>
        <Paragraph className="text-gray-600">
          与全球开发者交流学习，分享经验和最佳实践
        </Paragraph>
      </div>

      <div className="text-center py-20">
        <TeamOutlined className="text-6xl text-gray-400 mb-6" />
        <Title level={3} type="secondary" className="mb-4">
          社区功能正在开发中
        </Title>
        <Paragraph type="secondary" className="mb-8 max-w-md mx-auto">
          我们正在构建一个活跃的开发者社区，包括论坛讨论、学习资源、技术支持和社区活动。
          敬请期待！
        </Paragraph>
        <Button type="primary" size="large">
          加入等待列表
        </Button>
      </div>
    </div>
  )
}