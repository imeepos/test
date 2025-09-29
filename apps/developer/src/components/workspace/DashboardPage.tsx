import React from 'react'
import { Row, Col, Card, Statistic, Progress, Timeline, Avatar, Button, Space, Typography } from 'antd'
import {
  ProjectOutlined,
  CodeOutlined,
  DownloadOutlined,
  StarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  RocketOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

export const DashboardPage: React.FC = () => {
  // 模拟数据
  const stats = {
    projects: 12,
    published: 8,
    downloads: 15420,
    rating: 4.8,
  }

  const recentProjects = [
    {
      id: '1',
      name: 'AI Canvas Helper',
      type: 'AI处理器',
      status: 'development',
      progress: 75,
      lastModified: '2小时前',
    },
    {
      id: '2',
      name: 'Export to PDF',
      type: '导出器',
      status: 'published',
      progress: 100,
      lastModified: '1天前',
    },
    {
      id: '3',
      name: 'Theme Manager',
      type: '主题',
      status: 'testing',
      progress: 90,
      lastModified: '3天前',
    },
  ]

  const recentActivity = [
    {
      time: '刚刚',
      content: '发布了插件 "Export to PDF" v1.2.0',
      type: 'publish',
    },
    {
      time: '2小时前',
      content: '完成了 "AI Canvas Helper" 的单元测试',
      type: 'test',
    },
    {
      time: '昨天',
      content: '创建了新项目 "Theme Manager"',
      type: 'create',
    },
    {
      time: '2天前',
      content: '收到了用户对 "Export to PDF" 的 5星评价',
      type: 'review',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'development': return 'processing'
      case 'testing': return 'warning'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布'
      case 'development': return '开发中'
      case 'testing': return '测试中'
      default: return '草稿'
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* 欢迎区域 */}
      <div className="mb-8">
        <Title level={2} className="mb-2">
          欢迎回来，开发者！
        </Title>
        <Paragraph className="text-gray-600 mb-4">
          在这里管理您的插件项目，跟踪开发进度，查看社区反馈。
        </Paragraph>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            创建新项目
          </Button>
          <Button icon={<RocketOutlined />} size="large">
            发布插件
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={stats.projects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已发布插件"
              value={stats.published}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总下载量"
              value={stats.downloads}
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={stats.rating}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="/ 5.0"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 最近项目 */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <ProjectOutlined />
                <span>最近项目</span>
              </Space>
            }
            extra={<Button type="link">查看全部</Button>}
          >
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Title level={5} className="mb-1">
                        {project.name}
                      </Title>
                      <Text type="secondary">{project.type}</Text>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-2 py-1 rounded text-xs bg-${getStatusColor(project.status)}-100 text-${getStatusColor(project.status)}-600`}>
                        {getStatusText(project.status)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.lastModified}
                      </div>
                    </div>
                  </div>
                  <Progress
                    percent={project.progress}
                    size="small"
                    status={project.status === 'published' ? 'success' : 'active'}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 最近活动 */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>最近活动</span>
              </Space>
            }
            extra={<Button type="link">查看全部</Button>}
          >
            <Timeline
              items={recentActivity.map((activity) => ({
                children: (
                  <div>
                    <Text className="text-sm">{activity.content}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {activity.time}
                    </Text>
                  </div>
                ),
                color: activity.type === 'publish' ? 'green' :
                       activity.type === 'test' ? 'blue' :
                       activity.type === 'create' ? 'purple' : 'orange',
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作区域 */}
      <Row gutter={[24, 24]} className="mt-8">
        <Col span={24}>
          <Card title="快速操作" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  className="text-center"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <PlusOutlined className="text-2xl text-blue-500 mb-2" />
                  <div className="font-medium">创建项目</div>
                  <div className="text-xs text-gray-500">从模板开始新项目</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  className="text-center"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <CodeOutlined className="text-2xl text-green-500 mb-2" />
                  <div className="font-medium">打开 IDE</div>
                  <div className="text-xs text-gray-500">在线代码编辑器</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  className="text-center"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <TrophyOutlined className="text-2xl text-yellow-500 mb-2" />
                  <div className="font-medium">插件市场</div>
                  <div className="text-xs text-gray-500">浏览和发布插件</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  className="text-center"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <Avatar.Group size="small">
                    <Avatar>A</Avatar>
                    <Avatar>B</Avatar>
                    <Avatar>C</Avatar>
                  </Avatar.Group>
                  <div className="font-medium mt-2">开发者社区</div>
                  <div className="text-xs text-gray-500">交流学习经验</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}