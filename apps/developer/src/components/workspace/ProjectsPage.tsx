import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Avatar,
  Input,
  Select,
  Modal,
  Form,
  Row,
  Col,
  Typography,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CodeOutlined,
  SettingOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Project } from '../../types'

const { Title } = Typography
const { Option } = Select

export const ProjectsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()

  // 模拟项目数据
  const projects: Project[] = [
    {
      id: '1',
      name: 'AI Canvas Helper',
      description: '智能画布助手，提供AI驱动的设计建议',
      type: 'ai-processor',
      status: 'development',
      template: { id: 'ai-processor-template', name: 'AI处理器模板', description: '', category: 'ai-processor', files: [], dependencies: {} },
      ownerId: 'user1',
      collaborators: [],
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      config: {
        entry: 'src/index.ts',
        output: 'dist',
        dependencies: {},
        devDependencies: {},
        buildSettings: {
          target: 'es2020',
          format: 'esm',
          minify: false,
          sourcemap: true,
          externals: [],
        },
        debugSettings: {
          enabled: true,
          port: 3000,
          autoOpen: false,
          hot: true,
        },
      },
      stats: {
        linesOfCode: 2340,
        files: 15,
        dependencies: 8,
        buildTime: 1200,
        bundleSize: 156000,
        lastBuild: '2024-01-20T14:30:00Z',
      },
    },
    {
      id: '2',
      name: 'Export to PDF',
      description: '将画布内容导出为PDF文件',
      type: 'exporter',
      status: 'published',
      template: { id: 'exporter-template', name: '导出器模板', description: '', category: 'exporter', files: [], dependencies: {} },
      ownerId: 'user1',
      collaborators: ['user2'],
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-19T16:00:00Z',
      config: {
        entry: 'src/index.ts',
        output: 'dist',
        dependencies: {},
        devDependencies: {},
        buildSettings: {
          target: 'es2020',
          format: 'esm',
          minify: true,
          sourcemap: false,
          externals: [],
        },
        debugSettings: {
          enabled: false,
          port: 3001,
          autoOpen: false,
          hot: false,
        },
      },
      stats: {
        linesOfCode: 1850,
        files: 12,
        dependencies: 5,
        buildTime: 800,
        bundleSize: 89000,
        lastBuild: '2024-01-19T16:00:00Z',
      },
    },
    {
      id: '3',
      name: 'Theme Manager',
      description: '自定义主题管理器',
      type: 'theme',
      status: 'testing',
      template: { id: 'theme-template', name: '主题模板', description: '', category: 'theme', files: [], dependencies: {} },
      ownerId: 'user1',
      collaborators: [],
      createdAt: '2024-01-18T09:00:00Z',
      updatedAt: '2024-01-20T11:00:00Z',
      config: {
        entry: 'src/index.ts',
        output: 'dist',
        dependencies: {},
        devDependencies: {},
        buildSettings: {
          target: 'es2020',
          format: 'esm',
          minify: false,
          sourcemap: true,
          externals: [],
        },
        debugSettings: {
          enabled: true,
          port: 3002,
          autoOpen: false,
          hot: true,
        },
      },
      stats: {
        linesOfCode: 980,
        files: 8,
        dependencies: 3,
        buildTime: 500,
        bundleSize: 45000,
        lastBuild: '2024-01-20T11:00:00Z',
      },
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'development': return 'processing'
      case 'testing': return 'warning'
      case 'archived': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布'
      case 'development': return '开发中'
      case 'testing': return '测试中'
      case 'archived': return '已归档'
      default: return '草稿'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'component': return '组件'
      case 'ai-processor': return 'AI处理器'
      case 'exporter': return '导出器'
      case 'tool': return '工具'
      case 'theme': return '主题'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'component': return 'blue'
      case 'ai-processor': return 'purple'
      case 'exporter': return 'green'
      case 'tool': return 'orange'
      case 'theme': return 'pink'
      default: return 'default'
    }
  }

  const getProgressValue = (project: Project) => {
    if (project.status === 'published') return 100
    if (project.status === 'testing') return 85
    if (project.status === 'development') return 60
    return 20
  }

  const columns: ColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Project) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500 mt-1">{record.description}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{getTypeText(type)}</Tag>
      ),
      filters: [
        { text: '组件', value: 'component' },
        { text: 'AI处理器', value: 'ai-processor' },
        { text: '导出器', value: 'exporter' },
        { text: '工具', value: 'tool' },
        { text: '主题', value: 'theme' },
      ],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '开发中', value: 'development' },
        { text: '测试中', value: 'testing' },
        { text: '已发布', value: 'published' },
        { text: '已归档', value: 'archived' },
      ],
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (_, record: Project) => (
        <Progress
          percent={getProgressValue(record)}
          size="small"
          status={record.status === 'published' ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '协作者',
      dataIndex: 'collaborators',
      key: 'collaborators',
      render: (collaborators: string[]) => (
        <Avatar.Group size="small" maxCount={3}>
          <Avatar>U</Avatar>
          {collaborators.map((collaborator, index) => (
            <Avatar key={index}>
              {collaborator.slice(-1).toUpperCase()}
            </Avatar>
          ))}
        </Avatar.Group>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (updatedAt: string) => (
        <div className="text-sm text-gray-600">
          {new Date(updatedAt).toLocaleDateString('zh-CN')}
        </div>
      ),
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Project) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="编辑项目">
            <Button size="small" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title="打开IDE">
            <Button size="small" icon={<CodeOutlined />} />
          </Tooltip>
          {record.status === 'development' && (
            <Tooltip title="运行调试">
              <Button size="small" icon={<PlayCircleOutlined />} />
            </Tooltip>
          )}
          <Tooltip title="项目设置">
            <Button size="small" icon={<SettingOutlined />} />
          </Tooltip>
          <Tooltip title="删除项目">
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const handleCreateProject = (values: any) => {
    console.log('创建项目:', values)
    setCreateModalVisible(false)
    form.resetFields()
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesType = typeFilter === 'all' || project.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <Title level={2} className="mb-0">
          我的项目
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          创建新项目
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索项目名称或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
            >
              <Option value="all">全部状态</Option>
              <Option value="draft">草稿</Option>
              <Option value="development">开发中</Option>
              <Option value="testing">测试中</Option>
              <Option value="published">已发布</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="类型筛选"
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-full"
            >
              <Option value="all">全部类型</Option>
              <Option value="component">组件</Option>
              <Option value="ai-processor">AI处理器</Option>
              <Option value="exporter">导出器</Option>
              <Option value="tool">工具</Option>
              <Option value="theme">主题</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 项目列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 创建项目模态框 */}
      <Modal
        title="创建新项目"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
        >
          <Form.Item
            label="项目名称"
            name="name"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            label="项目描述"
            name="description"
            rules={[{ required: true, message: '请输入项目描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item
            label="项目类型"
            name="type"
            rules={[{ required: true, message: '请选择项目类型' }]}
          >
            <Select placeholder="请选择项目类型">
              <Option value="component">组件插件</Option>
              <Option value="ai-processor">AI处理器</Option>
              <Option value="exporter">导出器插件</Option>
              <Option value="tool">工具插件</Option>
              <Option value="theme">主题插件</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="项目模板"
            name="template"
            rules={[{ required: true, message: '请选择项目模板' }]}
          >
            <Select placeholder="请选择项目模板">
              <Option value="basic">基础模板</Option>
              <Option value="typescript">TypeScript模板</Option>
              <Option value="react">React组件模板</Option>
              <Option value="ai-processor">AI处理器模板</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}