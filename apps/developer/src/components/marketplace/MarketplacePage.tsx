import React, { useState } from 'react'
import { Card, Row, Col, Typography, Button, Tag, Rate, Avatar, Statistic, Input, Select, Space, Tabs } from 'antd'
import {
  ShopOutlined,
  DownloadOutlined,
  StarOutlined,
  EyeOutlined,
  HeartOutlined,
  RocketOutlined,
  GiftOutlined,
  TrophyOutlined,
  SearchOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TabPane } = Tabs

export const MarketplacePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse')
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // 模拟插件数据
  const plugins = [
    {
      id: '1',
      name: 'AI Canvas Helper',
      description: '智能画布助手，提供AI驱动的设计建议和自动布局功能',
      author: {
        id: 'user1',
        username: 'developer1',
        displayName: '张开发',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer1',
      },
      category: 'ai-processor',
      version: '1.2.0',
      downloads: 15420,
      rating: 4.8,
      reviews: 256,
      price: 0,
      featured: true,
      trending: true,
      tags: ['AI', '智能助手', '布局'],
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: '2',
      name: 'PDF Export Pro',
      description: '专业的PDF导出工具，支持高质量矢量导出和批量处理',
      author: {
        id: 'user2',
        username: 'exportmaster',
        displayName: '导出大师',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=exportmaster',
      },
      category: 'exporter',
      version: '2.1.3',
      downloads: 8932,
      rating: 4.6,
      reviews: 189,
      price: 29.99,
      featured: false,
      trending: true,
      tags: ['PDF', '导出', '矢量'],
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
    },
    {
      id: '3',
      name: 'Dark Theme Pack',
      description: '精美的暗色主题包，包含多种风格和配色方案',
      author: {
        id: 'user3',
        username: 'themecrafter',
        displayName: '主题工匠',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=themecrafter',
      },
      category: 'theme',
      version: '1.0.5',
      downloads: 12567,
      rating: 4.9,
      reviews: 342,
      price: 9.99,
      featured: true,
      trending: false,
      tags: ['主题', '暗色', '美化'],
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-16',
    },
  ]

  const myPlugins = [
    {
      id: '1',
      name: 'AI Canvas Helper',
      status: 'published',
      downloads: 15420,
      revenue: 0,
      rating: 4.8,
      lastUpdate: '2024-01-20',
    },
    {
      id: '4',
      name: 'Code Snippet Manager',
      status: 'under-review',
      downloads: 0,
      revenue: 0,
      rating: 0,
      lastUpdate: '2024-01-22',
    },
  ]

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'component': return '组件'
      case 'ai-processor': return 'AI处理器'
      case 'exporter': return '导出器'
      case 'tool': return '工具'
      case 'theme': return '主题'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'component': return 'blue'
      case 'ai-processor': return 'purple'
      case 'exporter': return 'green'
      case 'tool': return 'orange'
      case 'theme': return 'pink'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布'
      case 'under-review': return '审核中'
      case 'draft': return '草稿'
      case 'rejected': return '被拒绝'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'under-review': return 'processing'
      case 'draft': return 'default'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const renderBrowsePage = () => (
    <div>
      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索插件..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="分类筛选"
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="w-full"
            >
              <Option value="all">全部分类</Option>
              <Option value="component">组件</Option>
              <Option value="ai-processor">AI处理器</Option>
              <Option value="exporter">导出器</Option>
              <Option value="tool">工具</Option>
              <Option value="theme">主题</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select placeholder="排序方式" defaultValue="popular" className="w-full">
              <Option value="popular">最受欢迎</Option>
              <Option value="newest">最新发布</Option>
              <Option value="rating">评分最高</Option>
              <Option value="downloads">下载最多</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 精选插件 */}
      <div className="mb-8">
        <Title level={3} className="mb-4">
          <TrophyOutlined className="mr-2" />
          精选插件
        </Title>
        <Row gutter={[24, 24]}>
          {plugins.filter(p => p.featured).map((plugin) => (
            <Col xs={24} sm={12} lg={8} key={plugin.id}>
              <Card
                hoverable
                cover={
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <Text className="text-white text-lg font-semibold">
                      {plugin.name}
                    </Text>
                  </div>
                }
                actions={[
                  <Button
                    key="install"
                    type="primary"
                    icon={<DownloadOutlined />}
                    size="small"
                  >
                    {plugin.price > 0 ? `¥${plugin.price}` : '免费安装'}
                  </Button>,
                  <Button key="view" icon={<EyeOutlined />} size="small">
                    查看详情
                  </Button>,
                ]}
              >
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Title level={5} className="mb-0">
                      {plugin.name}
                    </Title>
                    {plugin.trending && (
                      <Tag color="red" size="small">
                        热门
                      </Tag>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar src={plugin.author.avatar} size="small" />
                    <Text type="secondary" className="text-sm">
                      {plugin.author.displayName}
                    </Text>
                    <Tag color={getCategoryColor(plugin.category)} size="small">
                      {getCategoryText(plugin.category)}
                    </Tag>
                  </div>
                </div>
                <Paragraph
                  ellipsis={{ rows: 2 }}
                  className="text-sm text-gray-600 mb-3"
                >
                  {plugin.description}
                </Paragraph>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Rate disabled defaultValue={plugin.rating} className="text-xs" />
                      <Text className="text-xs text-gray-500 ml-1">
                        ({plugin.reviews})
                      </Text>
                    </div>
                  </div>
                  <Text type="secondary" className="text-xs">
                    {plugin.downloads.toLocaleString()} 下载
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 全部插件 */}
      <div>
        <Title level={3} className="mb-4">
          全部插件
        </Title>
        <Row gutter={[24, 24]}>
          {plugins.map((plugin) => (
            <Col xs={24} sm={12} lg={8} key={plugin.id}>
              <Card
                hoverable
                cover={
                  <div className="h-32 bg-gray-100 flex items-center justify-center">
                    <Text className="text-gray-400">
                      {plugin.name}
                    </Text>
                  </div>
                }
                size="small"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Title level={5} className="mb-0">
                      {plugin.name}
                    </Title>
                    <Text className="text-sm">
                      {plugin.price > 0 ? `¥${plugin.price}` : '免费'}
                    </Text>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Rate disabled defaultValue={plugin.rating} className="text-xs" />
                    <Text className="text-xs">
                      {plugin.downloads.toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Tag color={getCategoryColor(plugin.category)} size="small">
                      {getCategoryText(plugin.category)}
                    </Tag>
                    <Space size="small">
                      <Button size="small" type="text" icon={<HeartOutlined />} />
                      <Button size="small" type="primary">
                        安装
                      </Button>
                    </Space>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )

  const renderMyPluginsPage = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Title level={3} className="mb-0">
          我的插件
        </Title>
        <Button type="primary" icon={<RocketOutlined />}>
          发布新插件
        </Button>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="总插件数"
              value={myPlugins.length}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="总下载量"
              value={myPlugins.reduce((sum, p) => sum + p.downloads, 0)}
              prefix={<DownloadOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="总收益"
              value={myPlugins.reduce((sum, p) => sum + p.revenue, 0)}
              prefix="¥"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="平均评分"
              value={4.8}
              prefix={<StarOutlined />}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* 插件列表 */}
      <Card>
        <div className="space-y-4">
          {myPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Title level={5} className="mb-0">
                    {plugin.name}
                  </Title>
                  <Tag color={getStatusColor(plugin.status)}>
                    {getStatusText(plugin.status)}
                  </Tag>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span>下载量: {plugin.downloads.toLocaleString()}</span>
                  <span>收益: ¥{plugin.revenue}</span>
                  <span>评分: {plugin.rating || '暂无'}</span>
                  <span>更新: {plugin.lastUpdate}</span>
                </div>
              </div>
              <Space>
                <Button size="small">编辑</Button>
                <Button size="small">统计</Button>
                <Button size="small" type="primary">
                  管理
                </Button>
              </Space>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-6">
        <Title level={2} className="mb-2">
          插件市场
        </Title>
        <Paragraph className="text-gray-600">
          发现和分享优质插件，扩展您的创作能力
        </Paragraph>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="bg-white rounded-lg">
        <TabPane
          tab={
            <span>
              <ShopOutlined />
              插件浏览
            </span>
          }
          key="browse"
        >
          {renderBrowsePage()}
        </TabPane>
        <TabPane
          tab={
            <span>
              <HeartOutlined />
              我的插件
            </span>
          }
          key="my-plugins"
        >
          {renderMyPluginsPage()}
        </TabPane>
        <TabPane
          tab={
            <span>
              <RocketOutlined />
              发布管理
            </span>
          }
          key="publishing"
        >
          <div className="text-center py-12">
            <RocketOutlined className="text-4xl text-gray-400 mb-4" />
            <Title level={4} type="secondary">
              发布管理
            </Title>
            <Paragraph type="secondary">
              此功能正在开发中...
            </Paragraph>
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <GiftOutlined />
              收益中心
            </span>
          }
          key="revenue"
        >
          <div className="text-center py-12">
            <GiftOutlined className="text-4xl text-gray-400 mb-4" />
            <Title level={4} type="secondary">
              收益中心
            </Title>
            <Paragraph type="secondary">
              此功能正在开发中...
            </Paragraph>
          </div>
        </TabPane>
      </Tabs>
    </div>
  )
}