import React, { useState } from 'react'
import { Layout, Menu, Card, Typography, Anchor, Button, Space, Input, Tag } from 'antd'
import {
  BookOutlined,
  RocketOutlined,
  ApiOutlined,
  CodeOutlined,
  SearchOutlined,
  LinkOutlined,
} from '@ant-design/icons'

const { Sider, Content } = Layout
const { Title, Paragraph, Text } = Typography
const { Link } = Anchor

export const DocumentationPage: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<string>('quick-start')
  const [searchText, setSearchText] = useState('')

  // 文档导航菜单
  const docMenuItems = [
    {
      key: 'quick-start',
      icon: <RocketOutlined />,
      label: '快速开始',
      children: [
        { key: 'overview', label: '插件开发概述' },
        { key: 'setup', label: '环境配置指南' },
        { key: 'first-plugin', label: '创建第一个插件' },
        { key: 'hello-world', label: 'Hello World示例' },
      ],
    },
    {
      key: 'api-reference',
      icon: <ApiOutlined />,
      label: 'API参考',
      children: [
        { key: 'canvas-api', label: 'Canvas API' },
        { key: 'component-api', label: 'Component API' },
        { key: 'ai-service-api', label: 'AI Service API' },
        { key: 'event-system', label: 'Event System API' },
        { key: 'lifecycle-hooks', label: 'Lifecycle Hooks' },
        { key: 'plugin-api', label: 'Plugin API' },
      ],
    },
    {
      key: 'guides',
      icon: <BookOutlined />,
      label: '指南教程',
      children: [
        { key: 'ui-components', label: 'UI组件开发' },
        { key: 'ai-processors', label: 'AI处理器插件' },
        { key: 'exporters', label: '导出器插件' },
        { key: 'debugging', label: '调试最佳实践' },
        { key: 'performance', label: '性能优化指南' },
        { key: 'security', label: '安全开发规范' },
      ],
    },
    {
      key: 'examples',
      icon: <CodeOutlined />,
      label: 'API示例',
      children: [
        { key: 'basic-component', label: '基础组件示例' },
        { key: 'connector', label: '连接器示例' },
        { key: 'ai-extension', label: 'AI扩展示例' },
        { key: 'data-visualization', label: '数据可视化示例' },
        { key: 'tool-plugin', label: '工具类插件示例' },
      ],
    },
  ]

  // 文档内容
  const getDocumentContent = (section: string) => {
    switch (section) {
      case 'overview':
        return (
          <div>
            <Title level={1}>插件开发概述</Title>
            <Paragraph>
              SKER Developer 平台为第三方开发者提供了强大的插件开发能力，让您可以扩展 @sker/studio 画布的功能。
              通过我们的 SDK，您可以创建各种类型的插件，包括 UI 组件、AI 处理器、导出器、工具和主题。
            </Paragraph>

            <Title level={2}>插件类型</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card size="small">
                <div className="flex items-center mb-2">
                  <Tag color="blue">组件插件</Tag>
                </div>
                <Text>创建可重用的 UI 组件，丰富画布的视觉元素</Text>
              </Card>
              <Card size="small">
                <div className="flex items-center mb-2">
                  <Tag color="purple">AI 处理器</Tag>
                </div>
                <Text>集成 AI 能力，提供智能内容生成和分析功能</Text>
              </Card>
              <Card size="small">
                <div className="flex items-center mb-2">
                  <Tag color="green">导出器</Tag>
                </div>
                <Text>支持多种格式的内容导出，如 PDF、图片、文档等</Text>
              </Card>
              <Card size="small">
                <div className="flex items-center mb-2">
                  <Tag color="orange">工具插件</Tag>
                </div>
                <Text>提供实用工具功能，提升用户的工作效率</Text>
              </Card>
            </div>

            <Title level={2}>开发流程</Title>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <ol className="list-decimal list-inside space-y-2">
                <li>环境配置和 SDK 安装</li>
                <li>选择合适的插件模板</li>
                <li>实现插件核心逻辑</li>
                <li>本地测试和调试</li>
                <li>性能优化和安全检查</li>
                <li>发布到插件市场</li>
              </ol>
            </div>

            <Title level={2}>核心概念</Title>
            <Paragraph>
              <Text strong>插件生命周期：</Text>
              每个插件都有明确的生命周期，包括安装、激活、停用和卸载阶段。
            </Paragraph>
            <Paragraph>
              <Text strong>事件系统：</Text>
              通过事件系统，插件可以监听画布上的各种操作和变化。
            </Paragraph>
            <Paragraph>
              <Text strong>API 接口：</Text>
              丰富的 API 接口让插件能够与画布、组件和 AI 服务进行深度集成。
            </Paragraph>
          </div>
        )

      case 'setup':
        return (
          <div>
            <Title level={1}>环境配置指南</Title>

            <Title level={2}>系统要求</Title>
            <ul className="list-disc list-inside mb-6 space-y-1">
              <li>Node.js 18.0 或更高版本</li>
              <li>npm 8.0 或 pnpm 7.0 或更高版本</li>
              <li>TypeScript 4.5 或更高版本</li>
              <li>现代浏览器（Chrome、Firefox、Safari、Edge）</li>
            </ul>

            <Title level={2}>安装 SKER Plugin SDK</Title>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6">
              <code>
                # 使用 npm<br/>
                npm install @sker/plugin-sdk<br/><br/>
                # 使用 pnpm<br/>
                pnpm add @sker/plugin-sdk
              </code>
            </div>

            <Title level={2}>创建开发环境</Title>
            <Paragraph>
              我们推荐使用 SKER Developer 平台的在线 IDE，它已经预配置了所有必要的工具和依赖。
              您也可以在本地环境中开发，然后上传到平台进行测试和发布。
            </Paragraph>

            <Title level={2}>TypeScript 配置</Title>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6">
              <pre>{`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`}</pre>
            </div>
          </div>
        )

      case 'canvas-api':
        return (
          <div>
            <Title level={1}>Canvas API</Title>
            <Paragraph>
              Canvas API 提供了与画布交互的核心接口，让插件能够创建、修改和删除画布上的节点和连接。
            </Paragraph>

            <Title level={2}>主要接口</Title>

            <Title level={3}>节点操作</Title>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <Title level={4}>createNode()</Title>
              <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm mb-2">
                <code>
                  canvas.createNode(nodeData: NodeData): Promise&lt;Node&gt;
                </code>
              </div>
              <Paragraph>在画布上创建新节点</Paragraph>

              <Title level={5}>参数</Title>
              <ul className="list-disc list-inside mb-4">
                <li><code>nodeData</code> - 节点数据对象</li>
              </ul>

              <Title level={5}>示例</Title>
              <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                <pre>{`const node = await context.canvas.createNode({
  type: 'text',
  position: { x: 100, y: 100 },
  content: 'Hello World',
  title: 'My Node'
})`}</pre>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <Title level={4}>updateNode()</Title>
              <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm mb-2">
                <code>
                  canvas.updateNode(nodeId: string, updates: Partial&lt;NodeData&gt;): Promise&lt;Node&gt;
                </code>
              </div>
              <Paragraph>更新现有节点</Paragraph>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <Title level={4}>deleteNode()</Title>
              <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm mb-2">
                <code>
                  canvas.deleteNode(nodeId: string): Promise&lt;void&gt;
                </code>
              </div>
              <Paragraph>删除指定节点</Paragraph>
            </div>
          </div>
        )

      default:
        return (
          <div>
            <Title level={1}>文档</Title>
            <Paragraph>
              请从左侧菜单选择要查看的文档内容。
            </Paragraph>
          </div>
        )
    }
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedSection(key)
  }

  // 生成锚点
  const getAnchorItems = () => {
    const content = getDocumentContent(selectedSection)
    // 这里应该解析内容中的标题来生成锚点
    // 简化版本，直接返回一些示例锚点
    return [
      { key: 'overview', href: '#overview', title: '概述' },
      { key: 'api', href: '#api', title: 'API' },
      { key: 'examples', href: '#examples', title: '示例' },
    ]
  }

  return (
    <div className="h-screen bg-gray-50">
      <Layout className="h-full">
        {/* 左侧导航 */}
        <Sider width={280} className="bg-white border-r border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Title level={4} className="mb-0">
                开发文档
              </Title>
            </div>
            <Input
              placeholder="搜索文档..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mb-4"
            />
            <Menu
              mode="inline"
              selectedKeys={[selectedSection]}
              items={docMenuItems}
              onClick={handleMenuClick}
              className="border-none"
            />
          </div>
        </Sider>

        {/* 主要内容 */}
        <Layout>
          <Content className="flex">
            {/* 文档内容 */}
            <div className="flex-1 p-8 overflow-auto">
              <Card className="min-h-full">
                <div className="prose max-w-none">
                  {getDocumentContent(selectedSection)}
                </div>
              </Card>
            </div>

            {/* 右侧锚点导航 */}
            <div className="w-64 p-4 border-l border-gray-200 bg-white">
              <div className="sticky top-4">
                <Text strong className="block mb-3">
                  页面导航
                </Text>
                <Anchor
                  items={getAnchorItems()}
                  offsetTop={100}
                />

                <div className="mt-8">
                  <Text strong className="block mb-3">
                    相关链接
                  </Text>
                  <Space direction="vertical" size="small">
                    <Button
                      type="link"
                      icon={<CodeOutlined />}
                      className="p-0 h-auto text-left"
                    >
                      查看示例代码
                    </Button>
                    <Button
                      type="link"
                      icon={<LinkOutlined />}
                      className="p-0 h-auto text-left"
                    >
                      GitHub 仓库
                    </Button>
                    <Button
                      type="link"
                      icon={<BookOutlined />}
                      className="p-0 h-auto text-left"
                    >
                      API 参考
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}