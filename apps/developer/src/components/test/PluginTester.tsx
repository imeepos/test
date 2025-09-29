import React, { useState, useRef } from 'react'
import {
  Card,
  Button,
  Space,
  Tabs,
  Table,
  Tag,
  Progress,
  Alert,
  Input,
  Select,
  Checkbox,
  Radio,
  Switch,
  Form,
  Modal,
  Statistic,
  Tree,
  Collapse,
  Timeline,
  Badge,
  Tooltip,
  message
} from 'antd'
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  BugOutlined,
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'

const { TabPane } = Tabs
const { Option } = Select
const { Panel } = Collapse
const { TextArea } = Input

/**
 * 测试用例状态
 */
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'

/**
 * 测试用例
 */
export interface TestCase {
  id: string
  name: string
  description: string
  category: string
  status: TestStatus
  duration?: number
  error?: string
  assertions: TestAssertion[]
  setup?: string
  teardown?: string
  enabled: boolean
}

/**
 * 测试断言
 */
export interface TestAssertion {
  id: string
  description: string
  type: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists'
  expected: any
  actual?: any
  passed?: boolean
}

/**
 * 测试套件
 */
export interface TestSuite {
  id: string
  name: string
  description: string
  testCases: TestCase[]
  status: TestStatus
  statistics: {
    total: number
    passed: number
    failed: number
    skipped: number
  }
}

/**
 * 测试报告
 */
export interface TestReport {
  id: string
  timestamp: number
  duration: number
  suites: TestSuite[]
  overall: {
    total: number
    passed: number
    failed: number
    skipped: number
    passRate: number
  }
}

/**
 * 插件测试器属性
 */
export interface PluginTesterProps {
  /** 插件代码 */
  pluginCode: string
  /** 测试开始回调 */
  onTestStart?: () => void
  /** 测试完成回调 */
  onTestComplete?: (report: TestReport) => void
}

/**
 * 插件测试器组件
 */
export const PluginTester: React.FC<PluginTesterProps> = ({
  pluginCode,
  onTestStart,
  onTestComplete
}) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>(getDefaultTestSuites())
  const [currentReport, setCurrentReport] = useState<TestReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('suites')
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null)
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [reportModalVisible, setReportModalVisible] = useState(false)

  const [form] = Form.useForm()

  /**
   * 获取默认测试套件
   */
  function getDefaultTestSuites(): TestSuite[] {
    return [
      {
        id: 'lifecycle',
        name: '生命周期测试',
        description: '测试插件生命周期方法',
        status: 'pending',
        statistics: { total: 4, passed: 0, failed: 0, skipped: 0 },
        testCases: [
          {
            id: 'lifecycle-install',
            name: '安装测试',
            description: '测试插件安装过程',
            category: 'lifecycle',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'install-success',
                description: '插件安装成功',
                type: 'exists',
                expected: true
              }
            ]
          },
          {
            id: 'lifecycle-activate',
            name: '激活测试',
            description: '测试插件激活过程',
            category: 'lifecycle',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'activate-success',
                description: '插件激活成功',
                type: 'exists',
                expected: true
              }
            ]
          },
          {
            id: 'lifecycle-deactivate',
            name: '停用测试',
            description: '测试插件停用过程',
            category: 'lifecycle',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'deactivate-success',
                description: '插件停用成功',
                type: 'exists',
                expected: true
              }
            ]
          },
          {
            id: 'lifecycle-uninstall',
            name: '卸载测试',
            description: '测试插件卸载过程',
            category: 'lifecycle',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'uninstall-success',
                description: '插件卸载成功',
                type: 'exists',
                expected: true
              }
            ]
          }
        ]
      },
      {
        id: 'api',
        name: 'API 测试',
        description: '测试插件API调用',
        status: 'pending',
        statistics: { total: 5, passed: 0, failed: 0, skipped: 0 },
        testCases: [
          {
            id: 'api-canvas',
            name: 'Canvas API 测试',
            description: '测试Canvas相关API调用',
            category: 'api',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'canvas-node-create',
                description: '创建节点成功',
                type: 'exists',
                expected: true
              }
            ]
          },
          {
            id: 'api-ai',
            name: 'AI API 测试',
            description: '测试AI服务API调用',
            category: 'api',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'ai-generate',
                description: 'AI生成内容成功',
                type: 'exists',
                expected: true
              }
            ]
          },
          {
            id: 'api-storage',
            name: 'Storage API 测试',
            description: '测试存储API调用',
            category: 'api',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'storage-set-get',
                description: '存储数据读写成功',
                type: 'equals',
                expected: 'test-value'
              }
            ]
          },
          {
            id: 'api-events',
            name: 'Events API 测试',
            description: '测试事件系统API调用',
            category: 'api',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'event-emit-listen',
                description: '事件发射和监听成功',
                type: 'exists',
                expected: true
              }
            ]
          },
          {
            id: 'api-ui',
            name: 'UI API 测试',
            description: '测试UI助手API调用',
            category: 'api',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'ui-notification',
                description: '显示通知成功',
                type: 'exists',
                expected: true
              }
            ]
          }
        ]
      },
      {
        id: 'permissions',
        name: '权限测试',
        description: '测试插件权限控制',
        status: 'pending',
        statistics: { total: 3, passed: 0, failed: 0, skipped: 0 },
        testCases: [
          {
            id: 'permission-allowed',
            name: '允许权限测试',
            description: '测试允许权限的API调用',
            category: 'permissions',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'allowed-api-success',
                description: '允许的API调用成功',
                type: 'exists',
                expected: true
              }
            ]
          },
          {
            id: 'permission-denied',
            name: '拒绝权限测试',
            description: '测试被拒绝权限的API调用',
            category: 'permissions',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'denied-api-error',
                description: '被拒绝的API调用返回错误',
                type: 'contains',
                expected: 'PERMISSION_DENIED'
              }
            ]
          },
          {
            id: 'permission-validation',
            name: '权限验证测试',
            description: '测试权限验证机制',
            category: 'permissions',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'permission-check',
                description: '权限检查正常工作',
                type: 'exists',
                expected: true
              }
            ]
          }
        ]
      },
      {
        id: 'performance',
        name: '性能测试',
        description: '测试插件性能表现',
        status: 'pending',
        statistics: { total: 3, passed: 0, failed: 0, skipped: 0 },
        testCases: [
          {
            id: 'performance-startup',
            name: '启动性能测试',
            description: '测试插件启动时间',
            category: 'performance',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'startup-time',
                description: '启动时间小于1秒',
                type: 'lessThan',
                expected: 1000
              }
            ]
          },
          {
            id: 'performance-memory',
            name: '内存使用测试',
            description: '测试插件内存占用',
            category: 'performance',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'memory-usage',
                description: '内存占用小于100MB',
                type: 'lessThan',
                expected: 100
              }
            ]
          },
          {
            id: 'performance-api',
            name: 'API 响应测试',
            description: '测试API调用响应时间',
            category: 'performance',
            status: 'pending',
            enabled: true,
            assertions: [
              {
                id: 'api-response-time',
                description: 'API响应时间小于500ms',
                type: 'lessThan',
                expected: 500
              }
            ]
          }
        ]
      }
    ]
  }

  /**
   * 运行所有测试
   */
  const runAllTests = async () => {
    setIsRunning(true)
    onTestStart?.()

    const startTime = Date.now()
    const updatedSuites: TestSuite[] = []

    for (const suite of testSuites) {
      const updatedSuite = await runTestSuite(suite)
      updatedSuites.push(updatedSuite)
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // 计算总体统计
    const overall = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0
    }

    updatedSuites.forEach(suite => {
      overall.total += suite.statistics.total
      overall.passed += suite.statistics.passed
      overall.failed += suite.statistics.failed
      overall.skipped += suite.statistics.skipped
    })

    overall.passRate = overall.total > 0 ? (overall.passed / overall.total) * 100 : 0

    const report: TestReport = {
      id: `report_${Date.now()}`,
      timestamp: startTime,
      duration,
      suites: updatedSuites,
      overall
    }

    setTestSuites(updatedSuites)
    setCurrentReport(report)
    setIsRunning(false)

    onTestComplete?.(report)

    message.success(`测试完成！通过率: ${overall.passRate.toFixed(1)}%`)
  }

  /**
   * 运行测试套件
   */
  const runTestSuite = async (suite: TestSuite): Promise<TestSuite> => {
    const updatedTestCases: TestCase[] = []
    const statistics = { total: 0, passed: 0, failed: 0, skipped: 0 }

    for (const testCase of suite.testCases) {
      if (!testCase.enabled) {
        updatedTestCases.push({ ...testCase, status: 'skipped' })
        statistics.skipped++
        statistics.total++
        continue
      }

      const updatedTestCase = await runTestCase(testCase)
      updatedTestCases.push(updatedTestCase)

      statistics.total++
      if (updatedTestCase.status === 'passed') {
        statistics.passed++
      } else if (updatedTestCase.status === 'failed') {
        statistics.failed++
      } else if (updatedTestCase.status === 'skipped') {
        statistics.skipped++
      }
    }

    const suiteStatus: TestStatus = statistics.failed > 0 ? 'failed' : 'passed'

    return {
      ...suite,
      testCases: updatedTestCases,
      statistics,
      status: suiteStatus
    }
  }

  /**
   * 运行单个测试用例
   */
  const runTestCase = async (testCase: TestCase): Promise<TestCase> => {
    const startTime = Date.now()

    // 模拟测试执行
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    const endTime = Date.now()
    const duration = endTime - startTime

    // 模拟测试结果
    const passed = Math.random() > 0.2 // 80% 通过率

    const updatedAssertions = testCase.assertions.map(assertion => ({
      ...assertion,
      actual: passed ? assertion.expected : 'unexpected-value',
      passed
    }))

    return {
      ...testCase,
      status: passed ? 'passed' : 'failed',
      duration,
      error: passed ? undefined : '测试断言失败',
      assertions: updatedAssertions
    }
  }

  /**
   * 运行单个测试套件
   */
  const runSingleSuite = async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId)
    if (!suite) return

    setIsRunning(true)

    const updatedSuite = await runTestSuite(suite)
    const updatedSuites = testSuites.map(s =>
      s.id === suiteId ? updatedSuite : s
    )

    setTestSuites(updatedSuites)
    setIsRunning(false)

    message.success(`测试套件"${suite.name}"执行完成`)
  }

  /**
   * 添加新测试用例
   */
  const addTestCase = () => {
    setSelectedTest(null)
    form.resetFields()
    setTestModalVisible(true)
  }

  /**
   * 编辑测试用例
   */
  const editTestCase = (testCase: TestCase) => {
    setSelectedTest(testCase)
    form.setFieldsValue(testCase)
    setTestModalVisible(true)
  }

  /**
   * 删除测试用例
   */
  const deleteTestCase = (suiteId: string, testCaseId: string) => {
    const updatedSuites = testSuites.map(suite => {
      if (suite.id === suiteId) {
        return {
          ...suite,
          testCases: suite.testCases.filter(tc => tc.id !== testCaseId)
        }
      }
      return suite
    })
    setTestSuites(updatedSuites)
    message.success('测试用例已删除')
  }

  /**
   * 保存测试用例
   */
  const saveTestCase = (values: any) => {
    const testCase: TestCase = {
      id: selectedTest?.id || `test_${Date.now()}`,
      name: values.name,
      description: values.description,
      category: values.category,
      status: 'pending',
      enabled: values.enabled ?? true,
      assertions: values.assertions || []
    }

    const suiteId = values.category
    const updatedSuites = testSuites.map(suite => {
      if (suite.id === suiteId) {
        const existingIndex = suite.testCases.findIndex(tc => tc.id === testCase.id)
        if (existingIndex >= 0) {
          // 更新现有测试用例
          const updatedTestCases = [...suite.testCases]
          updatedTestCases[existingIndex] = testCase
          return { ...suite, testCases: updatedTestCases }
        } else {
          // 添加新测试用例
          return {
            ...suite,
            testCases: [...suite.testCases, testCase]
          }
        }
      }
      return suite
    })

    setTestSuites(updatedSuites)
    setTestModalVisible(false)
    message.success('测试用例已保存')
  }

  /**
   * 导出测试报告
   */
  const exportReport = () => {
    if (!currentReport) {
      message.warning('没有可导出的测试报告')
      return
    }

    const reportData = {
      ...currentReport,
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `plugin-test-report-${currentReport.timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    message.success('测试报告已导出')
  }

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: TestStatus): string => {
    switch (status) {
      case 'passed': return 'green'
      case 'failed': return 'red'
      case 'running': return 'blue'
      case 'skipped': return 'orange'
      default: return 'default'
    }
  }

  /**
   * 获取状态图标
   */
  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed': return <CheckCircleOutlined />
      case 'failed': return <CloseCircleOutlined />
      case 'running': return <ClockCircleOutlined />
      case 'skipped': return <ExclamationCircleOutlined />
      default: return <ClockCircleOutlined />
    }
  }

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined />
          <span>插件测试器</span>
          {isRunning && <Badge status="processing" text="测试中" />}
        </Space>
      }
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={runAllTests}
            loading={isRunning}
          >
            运行全部测试
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={addTestCase}
          >
            添加测试
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => setReportModalVisible(true)}
            disabled={!currentReport}
          >
            查看报告
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={exportReport}
            disabled={!currentReport}
          >
            导出报告
          </Button>
        </Space>
      }
    >
      {/* 测试统计 */}
      {currentReport && (
        <div style={{ marginBottom: 24 }}>
          <Space size="large">
            <Statistic
              title="总测试数"
              value={currentReport.overall.total}
              prefix={<ThunderboltOutlined />}
            />
            <Statistic
              title="通过数"
              value={currentReport.overall.passed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
            <Statistic
              title="失败数"
              value={currentReport.overall.failed}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
            <Statistic
              title="通过率"
              value={currentReport.overall.passRate}
              precision={1}
              suffix="%"
              valueStyle={{
                color: currentReport.overall.passRate > 80 ? '#52c41a' : '#faad14'
              }}
            />
            <Statistic
              title="执行时间"
              value={currentReport.duration}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
            />
          </Space>
        </div>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 测试套件 */}
        <TabPane tab="测试套件" key="suites">
          <div style={{ marginBottom: 16 }}>
            {isRunning && (
              <Progress
                percent={0}
                status="active"
                format={() => '正在运行测试...'}
                style={{ marginBottom: 16 }}
              />
            )}
          </div>

          <Collapse>
            {testSuites.map(suite => (
              <Panel
                header={
                  <Space>
                    <Tag color={getStatusColor(suite.status)}>
                      {getStatusIcon(suite.status)}
                      {suite.status}
                    </Tag>
                    <span>{suite.name}</span>
                    <Text type="secondary">
                      ({suite.statistics.passed}/{suite.statistics.total})
                    </Text>
                  </Space>
                }
                key={suite.id}
                extra={
                  <Space onClick={e => e.stopPropagation()}>
                    <Button
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => runSingleSuite(suite.id)}
                      loading={isRunning}
                    >
                      运行
                    </Button>
                  </Space>
                }
              >
                <Table
                  dataSource={suite.testCases}
                  size="small"
                  pagination={false}
                  rowKey="id"
                >
                  <Table.Column
                    title="状态"
                    dataIndex="status"
                    key="status"
                    width={80}
                    render={(status) => (
                      <Tag color={getStatusColor(status)}>
                        {getStatusIcon(status)}
                      </Tag>
                    )}
                  />
                  <Table.Column title="名称" dataIndex="name" key="name" />
                  <Table.Column title="描述" dataIndex="description" key="description" />
                  <Table.Column
                    title="启用"
                    dataIndex="enabled"
                    key="enabled"
                    width={60}
                    render={(enabled) => (
                      <Switch
                        checked={enabled}
                        size="small"
                        onChange={(checked) => {
                          // 更新测试用例启用状态
                          const updatedSuites = testSuites.map(s => {
                            if (s.id === suite.id) {
                              return {
                                ...s,
                                testCases: s.testCases.map(tc =>
                                  tc.id === enabled ? { ...tc, enabled: checked } : tc
                                )
                              }
                            }
                            return s
                          })
                          setTestSuites(updatedSuites)
                        }}
                      />
                    )}
                  />
                  <Table.Column
                    title="耗时"
                    dataIndex="duration"
                    key="duration"
                    width={80}
                    render={(duration) => duration ? `${duration}ms` : '-'}
                  />
                  <Table.Column
                    title="操作"
                    key="actions"
                    width={120}
                    render={(_, record: TestCase) => (
                      <Space>
                        <Tooltip title="查看详情">
                          <Button
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => {
                              setSelectedTest(record)
                              // 这里可以打开详情对话框
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="编辑">
                          <Button
                            icon={<SettingOutlined />}
                            size="small"
                            onClick={() => editTestCase(record)}
                          />
                        </Tooltip>
                        <Tooltip title="删除">
                          <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            onClick={() => deleteTestCase(suite.id, record.id)}
                          />
                        </Tooltip>
                      </Space>
                    )}
                  />
                </Table>
              </Panel>
            ))}
          </Collapse>
        </TabPane>

        {/* 测试历史 */}
        <TabPane tab="测试历史" key="history">
          <Timeline>
            {currentReport && (
              <Timeline.Item
                color={currentReport.overall.passRate > 80 ? 'green' : 'red'}
                dot={
                  currentReport.overall.passRate > 80
                    ? <CheckCircleOutlined />
                    : <CloseCircleOutlined />
                }
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {new Date(currentReport.timestamp).toLocaleString()}
                  </div>
                  <div>
                    通过率: {currentReport.overall.passRate.toFixed(1)}%
                    ({currentReport.overall.passed}/{currentReport.overall.total})
                  </div>
                  <div>执行时间: {currentReport.duration}ms</div>
                </div>
              </Timeline.Item>
            )}
          </Timeline>
        </TabPane>

        {/* 配置 */}
        <TabPane tab="配置" key="settings">
          <Form layout="vertical">
            <Form.Item label="超时设置">
              <Input
                placeholder="测试超时时间（毫秒）"
                defaultValue="30000"
                addonAfter="ms"
              />
            </Form.Item>
            <Form.Item label="重试次数">
              <Select defaultValue="0">
                <Option value="0">不重试</Option>
                <Option value="1">1次</Option>
                <Option value="2">2次</Option>
                <Option value="3">3次</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Checkbox defaultChecked>失败时停止执行</Checkbox>
            </Form.Item>
            <Form.Item>
              <Checkbox defaultChecked>生成详细报告</Checkbox>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>

      {/* 测试用例编辑对话框 */}
      <Modal
        title={selectedTest ? '编辑测试用例' : '新建测试用例'}
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveTestCase}
        >
          <Form.Item
            name="name"
            label="测试名称"
            rules={[{ required: true, message: '请输入测试名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="测试描述"
          >
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="category"
            label="测试分类"
            rules={[{ required: true, message: '请选择测试分类' }]}
          >
            <Select>
              <Option value="lifecycle">生命周期测试</Option>
              <Option value="api">API测试</Option>
              <Option value="permissions">权限测试</Option>
              <Option value="performance">性能测试</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="enabled"
            valuePropName="checked"
            label="启用测试"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 测试报告对话框 */}
      <Modal
        title="测试报告"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={[
          <Button key="export" onClick={exportReport}>
            导出报告
          </Button>,
          <Button key="close" onClick={() => setReportModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {currentReport && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>测试时间:</strong> {new Date(currentReport.timestamp).toLocaleString()}
                </div>
                <div>
                  <strong>执行时长:</strong> {currentReport.duration}ms
                </div>
                <div>
                  <strong>总体通过率:</strong>{' '}
                  <Tag color={currentReport.overall.passRate > 80 ? 'green' : 'red'}>
                    {currentReport.overall.passRate.toFixed(1)}%
                  </Tag>
                </div>
              </Space>
            </div>

            {currentReport.suites.map(suite => (
              <Card key={suite.id} size="small" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                  {suite.name}
                </div>
                <Space>
                  <span>通过: {suite.statistics.passed}</span>
                  <span>失败: {suite.statistics.failed}</span>
                  <span>跳过: {suite.statistics.skipped}</span>
                  <span>总计: {suite.statistics.total}</span>
                </Space>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  )
}

export default PluginTester