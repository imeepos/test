/**
 * 项目列表页面 (重构版)
 * 使用新的架构: services + stores + hooks
 */
import React, { useState, useEffect } from 'react'
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
  Popconfirm,
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
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Project } from '@/types'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks'
import { useDebounce } from '@/hooks'
import { useNavigate } from 'react-router-dom'
import { formatRelativeTime } from '@/utils'

const { Title } = Typography
const { Option } = Select

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()

  // 使用防抖优化搜索
  const debouncedSearch = useDebounce(searchText, 500)

  // 使用新的 hooks
  const { projects, isLoading, refetch } = useProjects({
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    search: debouncedSearch || undefined,
  })

  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()

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

  const handleCreateProject = async (values: any) => {
    try {
      await createMutation.mutateAsync(values)
      setCreateModalVisible(false)
      form.resetFields()
    } catch (error) {
      // 错误已在 hook 中处理
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      // 错误已在 hook 中处理
    }
  }

  const handleOpenIDE = (projectId: string) => {
    navigate(`/workspace/ide/${projectId}`)
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
      onFilter: (value, record) => record.type === value,
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
      onFilter: (value, record) => record.status === value,
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
        <Tooltip title={new Date(updatedAt).toLocaleString('zh-CN')}>
          <div className="text-sm text-gray-600">
            {formatRelativeTime(updatedAt)}
          </div>
        </Tooltip>
      ),
      sorter: (a: Project, b: Project) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
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
            <Button
              size="small"
              icon={<CodeOutlined />}
              onClick={() => handleOpenIDE(record.id)}
            />
          </Tooltip>
          {record.status === 'development' && (
            <Tooltip title="运行调试">
              <Button size="small" icon={<PlayCircleOutlined />} />
            </Tooltip>
          )}
          <Tooltip title="项目设置">
            <Button size="small" icon={<SettingOutlined />} />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个项目吗?"
            description="此操作不可恢复"
            onConfirm={() => handleDeleteProject(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除项目">
              <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
                loading={deleteMutation.isPending}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <Title level={2} className="mb-0">
          我的项目
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建新项目
          </Button>
        </Space>
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
              allowClear
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
          dataSource={projects}
          rowKey="id"
          loading={isLoading}
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
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
        >
          <Form.Item
            label="项目名称"
            name="name"
            rules={[
              { required: true, message: '请输入项目名称' },
              { min: 3, message: '项目名称至少3个字符' },
            ]}
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

export default ProjectsPage
