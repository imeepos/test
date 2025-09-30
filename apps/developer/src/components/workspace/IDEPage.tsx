import React, { useState } from 'react'
import { Layout, Tabs, Button, Space, Dropdown, Spin, Typography } from 'antd'
import {
  PlayCircleOutlined,
  SaveOutlined,
  SettingOutlined,
  FolderOutlined,
  BugOutlined,
  TeamOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import MonacoEditor from '@monaco-editor/react'
import type { MenuProps } from 'antd'

const { Content, Sider } = Layout
const { TabPane } = Tabs
const { Text } = Typography

export const IDEPage: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('src/index.ts')
  const [files, setFiles] = useState<Record<string, string>>({
    'src/index.ts': `// SKER Plugin Entry Point
import { PluginContext, PluginLifecycle } from '@sker/plugin-sdk'

export default class MyPlugin implements PluginLifecycle {
  private context?: PluginContext

  async onInstall(): Promise<void> {
    console.log('Plugin installed')
  }

  async onActivate(context: PluginContext): Promise<void> {
    this.context = context
    console.log('Plugin activated')

    // 注册事件监听器
    context.events.on('canvas.nodeCreated', this.handleNodeCreated)
  }

  async onDeactivate(): Promise<void> {
    if (this.context) {
      this.context.events.off('canvas.nodeCreated', this.handleNodeCreated)
    }
    console.log('Plugin deactivated')
  }

  async onUninstall(): Promise<void> {
    console.log('Plugin uninstalled')
  }

  private handleNodeCreated = (node: any) => {
    console.log('New node created:', node)
  }
}`,
    'package.json': `{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My awesome SKER plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "dependencies": {
    "@sker/plugin-sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0"
  }
}`,
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
    'README.md': `# My Plugin

This is an awesome plugin for SKER platform.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install my-plugin
\`\`\`

## Usage

\`\`\`typescript
import MyPlugin from 'my-plugin'
\`\`\`
`,
  })

  const [loading, setLoading] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'Welcome to SKER Plugin IDE',
    'Type "help" for available commands',
    '',
  ])

  // 文件树结构
  const fileTree = [
    { key: 'src', title: 'src', isFolder: true, children: [
      { key: 'src/index.ts', title: 'index.ts', isFolder: false },
    ]},
    { key: 'package.json', title: 'package.json', isFolder: false },
    { key: 'tsconfig.json', title: 'tsconfig.json', isFolder: false },
    { key: 'README.md', title: 'README.md', isFolder: false },
  ]

  const getFileLanguage = (filename: string) => {
    const ext = filename.split('.').pop()
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'js':
      case 'jsx':
        return 'javascript'
      case 'json':
        return 'json'
      case 'md':
        return 'markdown'
      case 'css':
        return 'css'
      case 'html':
        return 'html'
      default:
        return 'plaintext'
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFiles(prev => ({
        ...prev,
        [activeFile]: value
      }))
    }
  }

  const handleRunProject = async () => {
    setLoading(true)
    setTerminalOutput(prev => [...prev, '> npm run dev', 'Starting development server...'])

    // 模拟构建过程
    setTimeout(() => {
      setTerminalOutput(prev => [
        ...prev,
        'Build completed successfully!',
        'Plugin loaded and ready for testing',
        '',
      ])
      setLoading(false)
    }, 2000)
  }

  const handleSaveFile = () => {
    setTerminalOutput(prev => [...prev, `Saved: ${activeFile}`])
  }

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'format',
      label: '格式化代码',
    },
    {
      key: 'find',
      label: '查找替换',
    },
    {
      key: 'problems',
      label: '问题面板',
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      label: '编辑器设置',
    },
  ]

  const renderFileTree = (nodes: any[]) => {
    return (
      <div className="file-tree">
        {nodes.map((node) => (
          <div key={node.key} className="file-node">
            {node.isFolder ? (
              <div className="folder-node">
                <FolderOutlined className="mr-2" />
                <span>{node.title}</span>
                {node.children && (
                  <div className="ml-4">
                    {renderFileTree(node.children)}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`file-item cursor-pointer hover:bg-gray-100 p-1 rounded ${
                  activeFile === node.key ? 'bg-blue-50 text-blue-600' : ''
                }`}
                onClick={() => setActiveFile(node.key)}
              >
                <span className="ml-4">{node.title}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Text strong>My Plugin Project</Text>
          <Text type="secondary" className="text-sm">
            src/index.ts
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRunProject}
            loading={loading}
          >
            运行
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveFile}
          >
            保存
          </Button>
          <Button icon={<BugOutlined />}>
            调试
          </Button>
          <Dropdown menu={{ items: moreMenuItems }} placement="bottomRight">
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      </div>

      {/* 主要内容区域 */}
      <Layout className="flex-1">
        {/* 文件浏览器 */}
        <Sider width={250} className="bg-gray-50 border-r border-gray-200">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <Text strong className="text-sm">文件浏览器</Text>
              <Button size="small" type="text" icon={<SettingOutlined />} />
            </div>
            {renderFileTree(fileTree)}
          </div>
        </Sider>

        {/* 编辑器区域 */}
        <Layout>
          <Content>
            <Tabs
              type="editable-card"
              activeKey={activeFile}
              onChange={setActiveFile}
              className="h-full"
              tabBarStyle={{ margin: 0, padding: '0 16px' }}
            >
              {Object.keys(files).map((filename) => (
                <TabPane
                  tab={filename.split('/').pop()}
                  key={filename}
                  closable={filename !== 'src/index.ts'}
                >
                  <div className="h-full">
                    <MonacoEditor
                      height="calc(100vh - 200px)"
                      language={getFileLanguage(filename)}
                      value={files[filename]}
                      onChange={handleEditorChange}
                      theme="vs"
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        insertSpaces: true,
                        wordWrap: 'on',
                      }}
                    />
                  </div>
                </TabPane>
              ))}
            </Tabs>
          </Content>

          {/* 底部面板 */}
          <div className="h-48 border-t border-gray-200">
            <Tabs
              size="small"
              tabBarStyle={{ margin: 0, padding: '0 16px' }}
              className="h-full"
            >
              <TabPane
                tab={
                  <span>
                    <TeamOutlined />
                    终端
                  </span>
                }
                key="terminal"
              >
                <div className="p-4 bg-black text-green-400 font-mono text-sm h-full overflow-auto">
                  {terminalOutput.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                  {loading && (
                    <div className="flex items-center">
                      <Spin size="small" className="mr-2" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <BugOutlined />
                    调试控制台
                  </span>
                }
                key="debug"
              >
                <div className="p-4 text-sm">
                  调试信息将在这里显示
                </div>
              </TabPane>
              <TabPane
                tab="问题"
                key="problems"
              >
                <div className="p-4 text-sm">
                  代码问题和警告将在这里显示
                </div>
              </TabPane>
            </Tabs>
          </div>
        </Layout>
      </Layout>
    </div>
  )
}