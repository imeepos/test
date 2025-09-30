import React, { useState } from 'react'
import {
  Button,
  Select,
  Divider,
  Tooltip,
  Space,
  Dropdown,
  Modal,
  message
} from 'antd'
import {
  SaveOutlined,
  PlayCircleOutlined,
  BugOutlined,
  FormatPainterOutlined,
  SearchOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
  CopyOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
  ReloadOutlined,
  FileTextOutlined
} from '@ant-design/icons'

const { Option } = Select

/**
 * 编辑器工具栏配置
 */
export interface EditorToolbarProps {
  /** 当前语言 */
  language: string
  /** 语言变更回调 */
  onLanguageChange: (language: string) => void
  /** 当前主题 */
  theme: string
  /** 主题变更回调 */
  onThemeChange: (theme: string) => void
  /** 保存回调 */
  onSave?: () => void
  /** 运行回调 */
  onRun?: () => void
  /** 调试回调 */
  onDebug?: () => void
  /** 格式化回调 */
  onFormat?: () => void
  /** 查找回调 */
  onFind?: () => void
  /** 下载回调 */
  onDownload?: () => void
  /** 上传回调 */
  onUpload?: (file: File) => void
  /** 复制回调 */
  onCopy?: () => void
  /** 全屏切换回调 */
  onToggleFullscreen?: (fullscreen: boolean) => void
  /** 重置编辑器回调 */
  onReset?: () => void
  /** 获取代码内容 */
  getContent?: () => string
  /** 是否只读模式 */
  readOnly?: boolean
  /** 是否显示运行按钮 */
  showRunButton?: boolean
  /** 是否显示调试按钮 */
  showDebugButton?: boolean
  /** 是否全屏 */
  isFullscreen?: boolean
}

/**
 * 支持的编程语言
 */
const SUPPORTED_LANGUAGES = [
  { value: 'typescript', label: 'TypeScript', icon: '🟦' },
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'json', label: 'JSON', icon: '📄' },
  { value: 'markdown', label: 'Markdown', icon: '📝' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'html', label: 'HTML', icon: '🌐' },
  { value: 'xml', label: 'XML', icon: '📋' },
  { value: 'yaml', label: 'YAML', icon: '⚙️' },
  { value: 'sql', label: 'SQL', icon: '🗃️' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'csharp', label: 'C#', icon: '🔷' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'php', label: 'PHP', icon: '🐘' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
  { value: 'shell', label: 'Shell', icon: '🐚' }
]

/**
 * 支持的主题
 */
const SUPPORTED_THEMES = [
  { value: 'vs', label: '浅色主题', icon: '☀️' },
  { value: 'vs-dark', label: '深色主题', icon: '🌙' },
  { value: 'hc-black', label: '高对比度', icon: '⚫' }
]

/**
 * 编辑器工具栏组件
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  onSave,
  onRun,
  onDebug,
  onFormat,
  onFind,
  onDownload,
  onUpload,
  onCopy,
  onToggleFullscreen,
  onReset,
  getContent,
  readOnly = false,
  showRunButton = true,
  showDebugButton = true,
  isFullscreen = false
}) => {
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [templateVisible, setTemplateVisible] = useState(false)

  /**
   * 处理文件上传
   */
  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.js,.ts,.json,.md,.css,.html,.xml,.yml,.yaml,.sql,.py,.java,.cs,.cpp,.go,.rs,.php,.rb,.sh'
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        onUpload?.(file)
      }
    }
    input.click()
  }

  /**
   * 复制代码到剪贴板
   */
  const handleCopy = async () => {
    try {
      const content = getContent?.()
      if (content) {
        await navigator.clipboard.writeText(content)
        message.success('代码已复制到剪贴板')
        onCopy?.()
      } else {
        message.warning('没有可复制的内容')
      }
    } catch (error) {
      message.error('复制失败')
    }
  }

  /**
   * 插件模板菜单
   */
  const templateMenu = {
    items: [
      {
        key: 'basic',
        label: '基础插件模板',
        icon: <FileTextOutlined />,
        onClick: () => insertTemplate('basic')
      },
      {
        key: 'component',
        label: '组件插件模板',
        icon: <FileTextOutlined />,
        onClick: () => insertTemplate('component')
      },
      {
        key: 'ai-processor',
        label: 'AI处理器模板',
        icon: <FileTextOutlined />,
        onClick: () => insertTemplate('ai-processor')
      },
      {
        key: 'exporter',
        label: '导出器模板',
        icon: <FileTextOutlined />,
        onClick: () => insertTemplate('exporter')
      },
      {
        key: 'tool',
        label: '工具插件模板',
        icon: <FileTextOutlined />,
        onClick: () => insertTemplate('tool')
      }
    ]
  }

  /**
   * 插入插件模板
   */
  const insertTemplate = (templateType: string) => {
    // 这里可以根据模板类型生成对应的代码
    let template = ''

    switch (templateType) {
      case 'basic':
        template = `import { BasePlugin, Plugin, PluginContext } from '@sker/plugin-sdk'

@Plugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: '我的第一个SKER插件',
  type: 'component',
  permissions: ['canvas.read', 'canvas.write']
})
export default class MyPlugin extends BasePlugin {
  async onActivate(context: PluginContext): Promise<void> {
    await super.onActivate(context)

    // 插件激活逻辑
    context.ui.showNotification('插件已激活！', 'success')
  }

  async onDeactivate(): Promise<void> {
    // 清理资源
    await super.onDeactivate()
  }
}`
        break

      case 'component':
        template = `import { BasePlugin, Plugin, PluginContext, ComponentDefinition } from '@sker/plugin-sdk'

@Plugin({
  id: 'custom-component',
  name: 'Custom Component',
  version: '1.0.0',
  type: 'component'
})
export default class CustomComponentPlugin extends BasePlugin {
  async onActivate(context: PluginContext): Promise<void> {
    await super.onActivate(context)

    const component: ComponentDefinition = {
      name: 'Custom Component',
      description: '自定义组件',
      category: 'Custom',
      icon: '🔧',
      props: [
        {
          name: 'text',
          type: 'string',
          label: '文本内容',
          defaultValue: 'Hello World',
          required: true
        }
      ],
      defaultProps: {
        text: 'Hello World'
      },
      render: (props) => {
        const div = document.createElement('div')
        div.textContent = props.text
        div.style.padding = '10px'
        div.style.border = '1px solid #ccc'
        div.style.borderRadius = '4px'
        return div
      }
    }

    await context.components.registerComponent('custom-component', component)
  }
}`
        break

      case 'ai-processor':
        template = `import { BasePlugin, Plugin, PluginContext } from '@sker/plugin-sdk'

@Plugin({
  id: 'ai-processor',
  name: 'AI Processor',
  version: '1.0.0',
  type: 'ai-processor',
  permissions: ['ai.request', 'canvas.read', 'canvas.write']
})
export default class AIProcessorPlugin extends BasePlugin {
  async onActivate(context: PluginContext): Promise<void> {
    await super.onActivate(context)

    // 监听右键菜单事件
    context.events.on('canvas.node.rightclick', this.handleContextMenu)
  }

  private handleContextMenu = async (data: any) => {
    const context = this.getContext()

    const choice = await context.ui.showContextMenu(
      { x: data.x, y: data.y },
      [
        { id: 'enhance', label: '增强内容', icon: '✨' },
        { id: 'summarize', label: '生成摘要', icon: '📝' }
      ]
    )

    if (choice === 'enhance') {
      await this.enhanceContent(data.nodeId)
    } else if (choice === 'summarize') {
      await this.summarizeContent(data.nodeId)
    }
  }

  private async enhanceContent(nodeId: string) {
    const context = this.getContext()

    try {
      const node = await context.canvas.getNode(nodeId)
      if (!node) return

      const enhanced = await context.ai.optimizeText(node.content, 'clarity')

      await context.canvas.updateNode(nodeId, {
        content: enhanced
      })

      context.ui.showSuccess('内容已增强！')
    } catch (error) {
      context.ui.showError('增强失败：' + error.message)
    }
  }

  private async summarizeContent(nodeId: string) {
    // 实现摘要功能
  }

  async onDeactivate(): Promise<void> {
    const context = this.getContext()
    context.events.off('canvas.node.rightclick', this.handleContextMenu)
    await super.onDeactivate()
  }
}`
        break

      default:
        template = '// 选择一个模板开始开发'
    }

    setTemplateVisible(false)
    // 这里应该调用编辑器的插入文本方法
    console.log('插入模板:', template)
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa'
        }}
      >
        {/* 语言选择 */}
        <Select
          value={language}
          onChange={onLanguageChange}
          style={{ width: 140 }}
          size="small"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <Option key={lang.value} value={lang.value}>
              <span style={{ marginRight: 8 }}>{lang.icon}</span>
              {lang.label}
            </Option>
          ))}
        </Select>

        {/* 主题选择 */}
        <Select
          value={theme}
          onChange={onThemeChange}
          style={{ width: 120 }}
          size="small"
        >
          {SUPPORTED_THEMES.map(th => (
            <Option key={th.value} value={th.value}>
              <span style={{ marginRight: 8 }}>{th.icon}</span>
              {th.label}
            </Option>
          ))}
        </Select>

        <Divider type="vertical" />

        {/* 文件操作 */}
        <Space size="small">
          <Tooltip title="保存 (Ctrl+S)">
            <Button
              icon={<SaveOutlined />}
              size="small"
              onClick={onSave}
              disabled={readOnly}
            />
          </Tooltip>

          <Tooltip title="上传文件">
            <Button
              icon={<UploadOutlined />}
              size="small"
              onClick={handleUpload}
              disabled={readOnly}
            />
          </Tooltip>

          <Tooltip title="下载文件">
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={onDownload}
            />
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        {/* 编辑操作 */}
        <Space size="small">
          <Tooltip title="格式化代码 (Ctrl+Shift+F)">
            <Button
              icon={<FormatPainterOutlined />}
              size="small"
              onClick={onFormat}
              disabled={readOnly}
            />
          </Tooltip>

          <Tooltip title="查找 (Ctrl+F)">
            <Button
              icon={<SearchOutlined />}
              size="small"
              onClick={onFind}
            />
          </Tooltip>

          <Tooltip title="复制代码">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={handleCopy}
            />
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        {/* 运行和调试 */}
        {(showRunButton || showDebugButton) && (
          <>
            <Space size="small">
              {showRunButton && (
                <Tooltip title="运行代码">
                  <Button
                    icon={<PlayCircleOutlined />}
                    size="small"
                    type="primary"
                    onClick={onRun}
                  >
                    运行
                  </Button>
                </Tooltip>
              )}

              {showDebugButton && (
                <Tooltip title="调试代码">
                  <Button
                    icon={<BugOutlined />}
                    size="small"
                    onClick={onDebug}
                  >
                    调试
                  </Button>
                </Tooltip>
              )}
            </Space>
            <Divider type="vertical" />
          </>
        )}

        {/* 模板插入 */}
        <Dropdown menu={templateMenu} placement="bottomLeft">
          <Button size="small" icon={<FileTextOutlined />}>
            插入模板
          </Button>
        </Dropdown>

        <div style={{ flex: 1 }} />

        {/* 右侧操作 */}
        <Space size="small">
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              icon={isFullscreen ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
              size="small"
              onClick={() => onToggleFullscreen?.(!isFullscreen)}
            />
          </Tooltip>

          <Tooltip title="重置编辑器">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={onReset}
              danger
            />
          </Tooltip>

          <Tooltip title="编辑器设置">
            <Button
              icon={<SettingOutlined />}
              size="small"
              onClick={() => setSettingsVisible(true)}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 设置对话框 */}
      <Modal
        title="编辑器设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <label>字体大小：</label>
              <Select defaultValue="14" style={{ width: 100, marginLeft: 8 }}>
                <Option value="12">12px</Option>
                <Option value="13">13px</Option>
                <Option value="14">14px</Option>
                <Option value="16">16px</Option>
                <Option value="18">18px</Option>
              </Select>
            </div>

            <div>
              <label>字体族：</label>
              <Select
                defaultValue="Consolas"
                style={{ width: 200, marginLeft: 8 }}
              >
                <Option value="Consolas">Consolas</Option>
                <Option value="Monaco">Monaco</Option>
                <Option value="Menlo">Menlo</Option>
                <Option value="Source Code Pro">Source Code Pro</Option>
              </Select>
            </div>

            <div>
              <label>制表符大小：</label>
              <Select defaultValue="2" style={{ width: 100, marginLeft: 8 }}>
                <Option value="2">2</Option>
                <Option value="4">4</Option>
                <Option value="8">8</Option>
              </Select>
            </div>
          </Space>
        </div>
      </Modal>

      {/* 模板对话框 */}
      <Modal
        title="选择插件模板"
        open={templateVisible}
        onCancel={() => setTemplateVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {[
              { key: 'basic', title: '基础插件模板', desc: '包含基本生命周期方法的简单插件' },
              { key: 'component', title: '组件插件模板', desc: '创建自定义UI组件的插件' },
              { key: 'ai-processor', title: 'AI处理器模板', desc: '集成AI功能处理内容的插件' },
              { key: 'exporter', title: '导出器模板', desc: '导出内容到不同格式的插件' },
              { key: 'tool', title: '工具插件模板', desc: '提供实用工具功能的插件' }
            ].map(template => (
              <div
                key={template.key}
                style={{
                  padding: '12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => insertTemplate(template.key)}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {template.title}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {template.desc}
                </div>
              </div>
            ))}
          </Space>
        </div>
      </Modal>
    </>
  )
}

export default EditorToolbar