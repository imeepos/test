import React, { useState, useRef } from 'react'
import {
  Card,
  Button,
  Space,
  Tabs,
  List,
  Tag,
  Typography,
  Alert,
  Collapse,
  Input,
  Select,
  Switch,
  Progress,
  Badge,
  Drawer,
  Table,
  message
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  BugOutlined,
  ClearOutlined,
  DownloadOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons'

const { TabPane } = Tabs
const { Text, Title } = Typography
const { Panel } = Collapse
const { Option } = Select

/**
 * 调试日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 调试日志条目
 */
export interface DebugLog {
  id: string
  timestamp: number
  level: LogLevel
  source: string
  message: string
  data?: any
  stack?: string
}

/**
 * 插件调试状态
 */
export interface DebugState {
  isRunning: boolean
  isPaused: boolean
  currentStep?: number
  totalSteps?: number
  performance: {
    startTime?: number
    endTime?: number
    executionTime?: number
    memoryUsage?: number
  }
  errors: Array<{
    message: string
    line?: number
    column?: number
    stack?: string
  }>
}

/**
 * 断点信息
 */
export interface Breakpoint {
  line: number
  condition?: string
  enabled: boolean
  hitCount: number
}

/**
 * 变量监控
 */
export interface VariableWatch {
  name: string
  value: any
  type: string
  scope: 'local' | 'global' | 'plugin'
}

/**
 * 插件调试器组件属性
 */
export interface PluginDebuggerProps {
  /** 插件代码 */
  pluginCode: string
  /** 调试开始回调 */
  onDebugStart?: () => void
  /** 调试停止回调 */
  onDebugStop?: () => void
  /** 调试暂停回调 */
  onDebugPause?: () => void
  /** 调试恢复回调 */
  onDebugResume?: () => void
  /** 断点设置回调 */
  onSetBreakpoint?: (line: number, condition?: string) => void
  /** 断点移除回调 */
  onRemoveBreakpoint?: (line: number) => void
}

/**
 * 插件调试器组件
 */
export const PluginDebugger: React.FC<PluginDebuggerProps> = ({
  onDebugStart,
  onDebugStop,
  onDebugPause,
  onDebugResume,
  onSetBreakpoint,
  onRemoveBreakpoint
}) => {
  const [debugState, setDebugState] = useState<DebugState>({
    isRunning: false,
    isPaused: false,
    performance: {},
    errors: []
  })

  const [logs, setLogs] = useState<DebugLog[]>([])
  const [breakpoints, setBreakpoints] = useState<Map<number, Breakpoint>>(new Map())
  const [watchedVariables, setWatchedVariables] = useState<VariableWatch[]>([])
  const [activeTab, setActiveTab] = useState<string>('logs')
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [logFilter, setLogFilter] = useState<LogLevel[]>(['debug', 'info', 'warn', 'error'])
  const [autoScroll, setAutoScroll] = useState(true)

  const logsRef = useRef<HTMLDivElement>(null)

  /**
   * 添加调试日志
   */
  const addLog = (level: LogLevel, source: string, message: string, data?: any) => {
    const logEntry: DebugLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      level,
      source,
      message,
      data,
      ...(level === 'error' && new Error().stack ? { stack: new Error().stack } : {})
    }

    setLogs(prev => [...prev, logEntry])

    // 自动滚动到底部
    if (autoScroll && logsRef.current) {
      setTimeout(() => {
        logsRef.current?.scrollTo({
          top: logsRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }

  /**
   * 开始调试
   */
  const startDebugging = async () => {
    try {
      addLog('info', 'Debugger', '开始调试插件...')

      setDebugState(prev => ({
        ...prev,
        isRunning: true,
        isPaused: false,
        performance: {
          startTime: Date.now()
        },
        errors: []
      }))

      onDebugStart?.()

      // 模拟插件执行和调试
      await simulatePluginExecution()

      addLog('info', 'Debugger', '插件调试完成')
    } catch (error) {
      addLog('error', 'Debugger', `调试失败: ${(error as Error).message}`)
      setDebugState(prev => ({
        ...prev,
        isRunning: false,
        errors: [
          ...prev.errors,
          {
            message: (error as Error).message,
            ...((error as Error).stack ? { stack: (error as Error).stack } : {})
          }
        ]
      }))
    }
  }

  /**
   * 停止调试
   */
  const stopDebugging = () => {
    addLog('info', 'Debugger', '停止调试')

    setDebugState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      performance: {
        ...prev.performance,
        endTime: Date.now(),
        executionTime: prev.performance.startTime
          ? Date.now() - prev.performance.startTime
          : 0
      }
    }))

    onDebugStop?.()
  }

  /**
   * 暂停/恢复调试
   */
  const togglePauseResume = () => {
    const newPausedState = !debugState.isPaused

    addLog(
      'info',
      'Debugger',
      newPausedState ? '调试已暂停' : '调试已恢复'
    )

    setDebugState(prev => ({
      ...prev,
      isPaused: newPausedState
    }))

    if (newPausedState) {
      onDebugPause?.()
    } else {
      onDebugResume?.()
    }
  }

  /**
   * 清空日志
   */
  const clearLogs = () => {
    setLogs([])
    addLog('info', 'Debugger', '日志已清空')
  }

  /**
   * 导出日志
   */
  const exportLogs = () => {
    const logData = logs.map(log => ({
      timestamp: new Date(log.timestamp).toISOString(),
      level: log.level,
      source: log.source,
      message: log.message,
      data: log.data
    }))

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `plugin-debug-logs-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    message.success('日志已导出')
  }

  /**
   * 设置断点
   */
  const setBreakpoint = (line: number, condition?: string) => {
    const breakpoint: Breakpoint = {
      line,
      ...(condition ? { condition } : {}),
      enabled: true,
      hitCount: 0
    }

    setBreakpoints(prev => new Map(prev.set(line, breakpoint)))
    addLog('debug', 'Breakpoint', `断点已设置在第 ${line} 行`, { condition })
    onSetBreakpoint?.(line, condition)
  }

  /**
   * 移除断点
   */
  const removeBreakpoint = (line: number) => {
    setBreakpoints(prev => {
      const newMap = new Map(prev)
      newMap.delete(line)
      return newMap
    })
    addLog('debug', 'Breakpoint', `断点已移除，第 ${line} 行`)
    onRemoveBreakpoint?.(line)
  }

  /**
   * 添加变量监控
   */
  const addVariableWatch = (name: string) => {
    const watch: VariableWatch = {
      name,
      value: undefined,
      type: 'unknown',
      scope: 'local'
    }

    setWatchedVariables(prev => [...prev, watch])
    addLog('debug', 'Watch', `添加变量监控: ${name}`)
  }

  /**
   * 模拟插件执行
   */
  const simulatePluginExecution = async (): Promise<void> => {
    return new Promise((resolve) => {
      let step = 0
      const totalSteps = 10

      const executeStep = () => {
        if (!debugState.isRunning) {
          resolve()
          return
        }

        if (debugState.isPaused) {
          setTimeout(executeStep, 100)
          return
        }

        step++
        setDebugState(prev => ({
          ...prev,
          currentStep: step,
          totalSteps
        }))

        // 模拟执行步骤
        switch (step) {
          case 1:
            addLog('debug', 'Plugin', '插件初始化...')
            break
          case 2:
            addLog('debug', 'Plugin', '加载插件配置')
            break
          case 3:
            addLog('debug', 'Plugin', '注册插件组件')
            break
          case 4:
            addLog('debug', 'Plugin', '设置事件监听器')
            break
          case 5:
            addLog('debug', 'Plugin', '初始化UI组件')
            break
          case 6:
            addLog('info', 'Plugin', '插件激活成功')
            // 模拟变量值
            setWatchedVariables([
              { name: 'context', value: { pluginId: 'test-plugin' }, type: 'object', scope: 'plugin' },
              { name: 'isActive', value: true, type: 'boolean', scope: 'local' },
              { name: 'nodeCount', value: 5, type: 'number', scope: 'global' }
            ])
            break
          case 7:
            addLog('debug', 'Plugin', '处理画布事件')
            break
          case 8:
            addLog('debug', 'Plugin', '更新插件状态')
            break
          case 9:
            addLog('debug', 'Plugin', '清理临时资源')
            break
          case 10:
            addLog('info', 'Plugin', '插件执行完成')
            resolve()
            return
        }

        // 随机添加一些警告或错误
        if (Math.random() < 0.1) {
          addLog('warn', 'Plugin', '检测到潜在的性能问题')
        }

        setTimeout(executeStep, 500)
      }

      executeStep()
    })
  }

  /**
   * 过滤日志
   */
  const filteredLogs = logs.filter(log => logFilter.includes(log.level))

  /**
   * 获取日志级别样式
   */
  const getLogLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'error': return '#ff4d4f'
      case 'warn': return '#faad14'
      case 'info': return '#1677ff'
      case 'debug': return '#52c41a'
      default: return '#666'
    }
  }

  /**
   * 获取日志级别图标
   */
  const getLogLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'error': return <ExclamationCircleOutlined />
      case 'warn': return <ExclamationCircleOutlined />
      case 'info': return <CheckCircleOutlined />
      case 'debug': return <BugOutlined />
      default: return <ClockCircleOutlined />
    }
  }

  return (
    <Card
      title={
        <Space>
          <BugOutlined />
          <span>插件调试器</span>
          <Badge
            status={debugState.isRunning ? 'processing' : 'default'}
            text={debugState.isRunning ? '运行中' : '已停止'}
          />
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<PlayCircleOutlined />}
            type="primary"
            onClick={startDebugging}
            disabled={debugState.isRunning}
            size="small"
          >
            开始调试
          </Button>

          <Button
            icon={debugState.isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            onClick={togglePauseResume}
            disabled={!debugState.isRunning}
            size="small"
          >
            {debugState.isPaused ? '恢复' : '暂停'}
          </Button>

          <Button
            icon={<StopOutlined />}
            onClick={stopDebugging}
            disabled={!debugState.isRunning}
            danger
            size="small"
          >
            停止
          </Button>

          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
            size="small"
          />
        </Space>
      }
    >
      {/* 执行进度 */}
      {debugState.isRunning && debugState.currentStep && debugState.totalSteps && (
        <div style={{ marginBottom: 16 }}>
          <Progress
            percent={Math.round((debugState.currentStep / debugState.totalSteps) * 100)}
            status={debugState.isPaused ? 'normal' : 'active'}
            format={() => `${debugState.currentStep}/${debugState.totalSteps}`}
          />
        </div>
      )}

      {/* 错误提示 */}
      {debugState.errors.length > 0 && (
        <Alert
          message={`发现 ${debugState.errors.length} 个错误`}
          description={
            <ul>
              {debugState.errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 调试面板 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 日志面板 */}
        <TabPane
          tab={
            <Badge count={filteredLogs.length} size="small">
              <span>调试日志</span>
            </Badge>
          }
          key="logs"
        >
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Select
                mode="multiple"
                placeholder="选择日志级别"
                value={logFilter}
                onChange={setLogFilter}
                style={{ width: 200 }}
                size="small"
              >
                <Option value="debug">Debug</Option>
                <Option value="info">Info</Option>
                <Option value="warn">Warn</Option>
                <Option value="error">Error</Option>
              </Select>

              <Switch
                checked={autoScroll}
                onChange={setAutoScroll}
                checkedChildren="自动滚动"
                unCheckedChildren="停止滚动"
                size="small"
              />

              <Button
                icon={<ClearOutlined />}
                onClick={clearLogs}
                size="small"
              >
                清空
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={exportLogs}
                size="small"
              >
                导出
              </Button>
            </Space>
          </div>

          <div
            ref={logsRef}
            style={{
              height: 400,
              overflow: 'auto',
              border: '1px solid #f0f0f0',
              padding: 8,
              backgroundColor: '#fafafa'
            }}
          >
            <List
              dataSource={filteredLogs}
              size="small"
              renderItem={(log) => (
                <List.Item
                  style={{
                    padding: '4px 8px',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <Space>
                    <Text
                      style={{
                        color: getLogLevelColor(log.level),
                        fontSize: 12,
                        fontFamily: 'monospace'
                      }}
                    >
                      {getLogLevelIcon(log.level)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#666',
                        fontFamily: 'monospace'
                      }}
                    >
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                    <Tag>{log.source}</Tag>
                    <Text style={{ fontFamily: 'monospace' }}>
                      {log.message}
                    </Text>
                  </Space>
                  {log.data && (
                    <Collapse ghost size="small">
                      <Panel header="查看数据" key="data">
                        <pre style={{ fontSize: 12 }}>
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </Panel>
                    </Collapse>
                  )}
                </List.Item>
              )}
            />
          </div>
        </TabPane>

        {/* 断点面板 */}
        <TabPane
          tab={
            <Badge count={breakpoints.size} size="small">
              <span>断点</span>
            </Badge>
          }
          key="breakpoints"
        >
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                // 这里应该打开断点设置对话框
                const line = Math.floor(Math.random() * 100) + 1
                setBreakpoint(line)
              }}
            >
              添加断点
            </Button>
          </div>

          <Table
            dataSource={Array.from(breakpoints.entries()).map(([lineNum, bp]) => ({
              key: lineNum,
              ...bp
            }))}
            size="small"
            pagination={false}
          >
            <Table.Column title="行号" dataIndex="line" key="lineNumber" width={80} />
            <Table.Column
              title="状态"
              dataIndex="enabled"
              key="enabled"
              render={(enabled) => (
                <Tag color={enabled ? 'green' : 'red'}>
                  {enabled ? '启用' : '禁用'}
                </Tag>
              )}
            />
            <Table.Column title="条件" dataIndex="condition" key="condition" />
            <Table.Column title="命中次数" dataIndex="hitCount" key="hitCount" />
            <Table.Column
              title="操作"
              key="actions"
              render={(_, record: any) => (
                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    title="查看"
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    onClick={() => removeBreakpoint(record.line)}
                    title="删除"
                  />
                </Space>
              )}
            />
          </Table>
        </TabPane>

        {/* 变量监控面板 */}
        <TabPane
          tab={
            <Badge count={watchedVariables.length} size="small">
              <span>变量监控</span>
            </Badge>
          }
          key="variables"
        >
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Input
                placeholder="输入变量名"
                style={{ width: 200 }}
                onPressEnter={(e) => {
                  const value = (e.target as HTMLInputElement).value
                  if (value) {
                    addVariableWatch(value)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
                size="small"
              />
              <Button
                type="primary"
                onClick={() => addVariableWatch('newVar')}
                size="small"
              >
                添加监控
              </Button>
            </Space>
          </div>

          <Table
            dataSource={watchedVariables}
            size="small"
            pagination={false}
            rowKey="name"
          >
            <Table.Column title="变量名" dataIndex="name" key="name" />
            <Table.Column
              title="值"
              dataIndex="value"
              key="value"
              render={(value) => (
                <Text code style={{ fontSize: 12 }}>
                  {typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)
                  }
                </Text>
              )}
            />
            <Table.Column title="类型" dataIndex="type" key="type" />
            <Table.Column
              title="作用域"
              dataIndex="scope"
              key="scope"
              render={(scope) => (
                <Tag color={
                  scope === 'global' ? 'red' :
                  scope === 'plugin' ? 'blue' : 'green'
                }>
                  {scope}
                </Tag>
              )}
            />
          </Table>
        </TabPane>

        {/* 性能面板 */}
        <TabPane tab="性能分析" key="performance">
          <div style={{ padding: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card size="small" title="执行时间">
                <div>
                  开始时间: {debugState.performance.startTime
                    ? new Date(debugState.performance.startTime).toLocaleTimeString()
                    : '-'
                  }
                </div>
                <div>
                  结束时间: {debugState.performance.endTime
                    ? new Date(debugState.performance.endTime).toLocaleTimeString()
                    : '-'
                  }
                </div>
                <div>
                  执行时长: {debugState.performance.executionTime
                    ? `${debugState.performance.executionTime}ms`
                    : '-'
                  }
                </div>
              </Card>

              <Card size="small" title="内存使用">
                <div>内存占用: {debugState.performance.memoryUsage || 0} MB</div>
              </Card>
            </Space>
          </div>
        </TabPane>
      </Tabs>

      {/* 设置抽屉 */}
      <Drawer
        title="调试器设置"
        placement="right"
        closable={false}
        onClose={() => setSettingsVisible(false)}
        open={settingsVisible}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Title level={5}>日志设置</Title>
            <Space direction="vertical">
              <Switch
                checked={autoScroll}
                onChange={setAutoScroll}
                checkedChildren="自动滚动"
                unCheckedChildren="停止滚动"
              />
              <div>
                <Text>最大日志条数: </Text>
                <Select defaultValue="1000" style={{ width: 100 }}>
                  <Option value="500">500</Option>
                  <Option value="1000">1000</Option>
                  <Option value="5000">5000</Option>
                </Select>
              </div>
            </Space>
          </div>

          <div>
            <Title level={5}>断点设置</Title>
            <Switch
              defaultChecked
              checkedChildren="启用断点"
              unCheckedChildren="禁用断点"
            />
          </div>

          <div>
            <Title level={5}>性能监控</Title>
            <Switch
              defaultChecked
              checkedChildren="启用性能监控"
              unCheckedChildren="禁用性能监控"
            />
          </div>
        </Space>
      </Drawer>
    </Card>
  )
}

export default PluginDebugger