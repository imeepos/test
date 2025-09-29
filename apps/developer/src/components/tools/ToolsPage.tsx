import React from 'react'
import { Card, Row, Col, Typography, Button, Tag, Space } from 'antd'
import {
  BugOutlined,
  ToolOutlined,
  CodeOutlined,
  ShieldCheckOutlined,
  PlayCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export const ToolsPage: React.FC = () => {
  const toolCategories = [
    {
      key: 'debug',
      title: '调试工具',
      icon: <BugOutlined className="text-2xl text-red-500" />,
      description: '强大的调试工具集，帮助您快速定位和解决问题',
      tools: [
        {
          name: '沙箱环境',
          description: '安全隔离的运行环境',
          status: 'available',
        },
        {
          name: '性能分析器',
          description: '分析插件性能瓶颈',
          status: 'available',
        },
        {
          name: '日志查看器',
          description: '实时查看运行日志',
          status: 'available',
        },
        {
          name: '断点调试器',
          description: 'VS Code 级别的调试体验',
          status: 'beta',
        },
      ],
    },
    {
      key: 'testing',
      title: '测试工具',
      icon: <ToolOutlined className="text-2xl text-green-500" />,
      description: '全面的测试工具套件，确保插件质量',
      tools: [
        {
          name: '单元测试',
          description: 'Jest 测试框架集成',
          status: 'available',
        },
        {
          name: '集成测试',
          description: '端到端测试支持',
          status: 'available',
        },
        {
          name: 'UI 组件测试',
          description: 'React Testing Library',
          status: 'available',
        },
        {
          name: '性能测试',
          description: '基准测试和性能监控',
          status: 'coming-soon',
        },
      ],
    },
    {
      key: 'development',
      title: '开发工具',
      icon: <CodeOutlined className="text-2xl text-blue-500" />,
      description: '提升开发效率的实用工具',
      tools: [
        {
          name: '包管理器',
          description: '智能依赖管理',
          status: 'available',
        },
        {
          name: '构建工具',
          description: 'Webpack 和 Rollup 集成',
          status: 'available',
        },
        {
          name: '代码生成器',
          description: '快速生成样板代码',
          status: 'beta',
        },
        {
          name: '代码检查器',
          description: 'ESLint 和 Prettier',
          status: 'available',
        },
      ],
    },
    {
      key: 'security',
      title: '安全工具',
      icon: <ShieldCheckOutlined className="text-2xl text-purple-500" />,
      description: '全面的安全检查和保护机制',
      tools: [
        {
          name: '安全扫描器',
          description: '代码安全漏洞检测',
          status: 'available',
        },
        {
          name: '漏洞检测',
          description: '依赖项漏洞扫描',
          status: 'available',
        },
        {
          name: '恶意代码检查',
          description: 'AI 驱动的恶意代码识别',
          status: 'beta',
        },
        {
          name: '权限分析器',
          description: '插件权限合规检查',
          status: 'coming-soon',
        },
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success'
      case 'beta':
        return 'warning'
      case 'coming-soon':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '可用'
      case 'beta':
        return 'Beta'
      case 'coming-soon':
        return '即将推出'
      default:
        return status
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-8">
        <Title level={2}>开发工具</Title>
        <Paragraph className="text-gray-600">
          专业的开发工具集，为插件开发提供全方位支持，从代码编写到测试部署，一站式解决开发需求。
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {toolCategories.map((category) => (
          <Col xs={24} lg={12} key={category.key}>
            <Card
              className="h-full"
              title={
                <div className="flex items-center space-x-3">
                  {category.icon}
                  <span>{category.title}</span>
                </div>
              }
              extra={
                <Button type="primary" size="small">
                  查看全部
                </Button>
              }
            >
              <Paragraph className="text-gray-600 mb-4">
                {category.description}
              </Paragraph>

              <div className="space-y-3">
                {category.tools.map((tool, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Text strong>{tool.name}</Text>
                        <Tag
                          color={getStatusColor(tool.status)}
                          size="small"
                        >
                          {getStatusText(tool.status)}
                        </Tag>
                      </div>
                      <Text type="secondary" className="text-sm">
                        {tool.description}
                      </Text>
                    </div>
                    <Space>
                      {tool.status === 'available' && (
                        <Button
                          size="small"
                          icon={<PlayCircleOutlined />}
                          type="link"
                        >
                          启动
                        </Button>
                      )}
                      <Button
                        size="small"
                        icon={<SettingOutlined />}
                        type="link"
                      >
                        配置
                      </Button>
                    </Space>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快速操作面板 */}
      <Card title="快速操作" className="mt-8">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              className="text-center"
              bodyStyle={{ padding: '24px 16px' }}
            >
              <BugOutlined className="text-3xl text-red-500 mb-3" />
              <Title level={5} className="mb-2">
                启动调试
              </Title>
              <Text type="secondary" className="text-sm">
                快速启动调试环境
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              className="text-center"
              bodyStyle={{ padding: '24px 16px' }}
            >
              <ToolOutlined className="text-3xl text-green-500 mb-3" />
              <Title level={5} className="mb-2">
                运行测试
              </Title>
              <Text type="secondary" className="text-sm">
                执行完整测试套件
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              className="text-center"
              bodyStyle={{ padding: '24px 16px' }}
            >
              <CodeOutlined className="text-3xl text-blue-500 mb-3" />
              <Title level={5} className="mb-2">
                构建项目
              </Title>
              <Text type="secondary" className="text-sm">
                构建生产版本
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              className="text-center"
              bodyStyle={{ padding: '24px 16px' }}
            >
              <ShieldCheckOutlined className="text-3xl text-purple-500 mb-3" />
              <Title level={5} className="mb-2">
                安全扫描
              </Title>
              <Text type="secondary" className="text-sm">
                检查安全漏洞
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}