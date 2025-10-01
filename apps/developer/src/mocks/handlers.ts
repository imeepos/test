/**
 * Mock API 处理器
 * 模拟后端 API 响应
 */
import { mockUser, mockProjects, mockPlugins, mockProjectFiles } from './data'
import type { CreateProjectDTO, UpdateProjectDTO } from '@/services'

// 模拟延迟
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock 项目 API
 */
export const mockProjectApi = {
  // 获取项目列表
  async getProjects(params?: any) {
    await delay(300)
    let filteredProjects = [...mockProjects]

    // 筛选
    if (params?.status) {
      filteredProjects = filteredProjects.filter(p => p.status === params.status)
    }
    if (params?.type) {
      filteredProjects = filteredProjects.filter(p => p.type === params.type)
    }
    if (params?.search) {
      const search = params.search.toLowerCase()
      filteredProjects = filteredProjects.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      )
    }

    return {
      data: filteredProjects,
      total: filteredProjects.length,
    }
  },

  // 获取单个项目
  async getProject(id: string) {
    await delay(200)
    const project = mockProjects.find(p => p.id === id)
    if (!project) {
      throw new Error('项目不存在')
    }
    return project
  },

  // 创建项目
  async createProject(data: CreateProjectDTO) {
    await delay(500)
    const newProject = {
      id: `project-${Date.now()}`,
      ...data,
      status: 'draft' as const,
      template: {
        id: data.template,
        name: data.template,
        description: '',
        category: data.type,
        files: [],
        dependencies: {},
      },
      ownerId: mockUser.id,
      collaborators: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {
        entry: 'src/index.ts',
        output: 'dist',
        dependencies: {
          '@sker/plugin-sdk': '^1.0.0',
        },
        devDependencies: {
          'typescript': '^5.0.0',
        },
        buildSettings: {
          target: 'es2020' as const,
          format: 'esm' as const,
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
        linesOfCode: 0,
        files: 0,
        dependencies: 1,
        buildTime: 0,
        bundleSize: 0,
        lastBuild: new Date().toISOString(),
      },
    }
    mockProjects.unshift(newProject)
    return newProject
  },

  // 更新项目
  async updateProject(id: string, data: UpdateProjectDTO) {
    await delay(300)
    const index = mockProjects.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error('项目不存在')
    }
    mockProjects[index] = {
      ...mockProjects[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    return mockProjects[index]
  },

  // 删除项目
  async deleteProject(id: string) {
    await delay(300)
    const index = mockProjects.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error('项目不存在')
    }
    mockProjects.splice(index, 1)
  },

  // 获取项目文件
  async getProjectFiles(id: string) {
    await delay(300)
    const files = mockProjectFiles[id as keyof typeof mockProjectFiles]
    if (!files) {
      return []
    }
    return files
  },

  // 构建项目
  async buildProject(id: string) {
    await delay(2000)
    return {
      success: true,
      output: 'dist',
      errors: [],
      warnings: [],
      duration: 1200,
      bundleSize: 156000,
    }
  },

  // 运行项目
  async runProject(id: string) {
    await delay(1500)
    return {
      success: true,
      url: 'http://localhost:3000',
    }
  },
}

/**
 * Mock 插件 API
 */
export const mockPluginApi = {
  // 获取插件列表
  async getPlugins(params?: any) {
    await delay(300)
    let filteredPlugins = [...mockPlugins]

    if (params?.category) {
      filteredPlugins = filteredPlugins.filter(p => p.category === params.category)
    }

    return {
      data: filteredPlugins,
      total: filteredPlugins.length,
    }
  },

  // 搜索插件
  async searchPlugins(params: any) {
    await delay(400)
    let filteredPlugins = [...mockPlugins]

    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredPlugins = filteredPlugins.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
      )
    }

    if (params.category) {
      filteredPlugins = filteredPlugins.filter(p => p.category === params.category)
    }

    return {
      data: filteredPlugins,
      total: filteredPlugins.length,
    }
  },

  // 获取单个插件
  async getPlugin(id: string) {
    await delay(200)
    const plugin = mockPlugins.find(p => p.id === id)
    if (!plugin) {
      throw new Error('插件不存在')
    }
    return plugin
  },

  // 安装插件
  async installPlugin(id: string) {
    await delay(1000)
    return {
      success: true,
      message: '插件安装成功',
    }
  },

  // 卸载插件
  async uninstallPlugin(id: string) {
    await delay(800)
    return {
      success: true,
      message: '插件卸载成功',
    }
  },
}

/**
 * Mock 用户 API
 */
export const mockUserApi = {
  // 登录
  async login(data: { email: string; password: string }) {
    await delay(500)
    // 简单验证
    if (data.email === 'developer@example.com' && data.password === '123456') {
      return {
        user: mockUser,
        token: 'mock-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      }
    }
    throw new Error('邮箱或密码错误')
  },

  // 获取当前用户
  async getCurrentUser() {
    await delay(200)
    return mockUser
  },
}

// 是否启用 Mock
export const ENABLE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL?.includes('localhost:4000')
