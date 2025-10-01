import { databaseManager } from '../config/database.js'
import { storeService } from '../services/StoreService.js'

/**
 * 种子数据配置选项
 */
export interface SeedOptions {
  skipIfExists?: boolean // 如果数据已存在则跳过
  clearBeforeSeed?: boolean // 在种子前清理数据
  verbose?: boolean // 详细输出
  usersOnly?: boolean // 仅创建用户
  projectsOnly?: boolean // 仅创建项目
  minimalData?: boolean // 最小化数据集
}

/**
 * 数据库种子数据管理器
 */
export class SeedManager {
  private options: SeedOptions

  constructor(options: SeedOptions = {}) {
    this.options = {
      skipIfExists: true,
      clearBeforeSeed: false,
      verbose: false,
      usersOnly: false,
      projectsOnly: false,
      minimalData: false,
      ...options
    }
  }

  /**
   * 日志输出
   */
  private log(message: string, force = false): void {
    if (this.options.verbose || force) {
      console.log(message)
    }
  }

  /**
   * 创建示例用户
   */
  private async createDemoUsers(): Promise<{ adminUser: any; testUser: any } | undefined> {
    try {
      // 检查是否已有用户
      const existingUsers = await storeService.users.count()
      if (existingUsers > 0 && this.options.skipIfExists) {
        this.log('ℹ️ 用户数据已存在，跳过创建示例用户', true)
        return
      }

      this.log('👤 创建示例用户...', true)

      // 创建管理员用户
      const adminUser = await storeService.users.createUser({
        email: 'admin@sker.dev',
        username: 'admin',
        password: 'Admin123!@#',
        settings: {
          theme: 'dark',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: true,
            task_completion: true,
            collaboration: true
          },
          ai_preferences: {
            default_model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 2000
          }
        }
      })

      // 创建测试用户
      const testUser = await storeService.users.createUser({
        email: 'test@sker.dev',
        username: 'testuser',
        password: 'Test123!@#',
        settings: {
          theme: 'light',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: false,
            task_completion: true,
            collaboration: true
          },
          ai_preferences: {
            default_model: 'gpt-3.5-turbo',
            temperature: 0.8,
            max_tokens: 1500
          }
        }
      })

      this.log(`✅ 创建用户成功: ${adminUser.username}, ${testUser.username}`, true)

      return { adminUser, testUser }
    } catch (error) {
      if ((error as any).code === 'EMAIL_ALREADY_EXISTS' || (error as any).code === 'USERNAME_ALREADY_EXISTS') {
        this.log('ℹ️ 用户已存在，跳过创建', true)
        return undefined
      }
      console.error('❌ 创建示例用户失败:', error)
      throw error
    }
  }

  /**
   * 创建示例项目
   */
  private async createDemoProjects(userId?: string): Promise<{ aiProject: any; productProject: any } | undefined> {
    try {
      // 获取测试用户
      let testUser
      if (userId) {
        testUser = await storeService.users.findById(userId)
      } else {
        testUser = await storeService.users.findByUsername('testuser')
      }

      if (!testUser) {
        this.log('⚠️ 未找到测试用户，跳过创建示例项目', true)
        return
      }

      this.log('📁 创建示例项目...', true)

      // 创建示例项目1: AI助手开发计划
      const aiProject = await storeService.projects.create({
        user_id: testUser.id,
        name: 'AI助手开发计划',
        description: '一个智能AI助手的完整开发规划项目，包含需求分析、技术架构、开发计划等内容。',
        status: 'active',
        canvas_data: {
          viewport: { x: 0, y: 0, zoom: 1 },
          config: {
            maxZoom: 3,
            minZoom: 0.1,
            gridSize: 20,
            snapToGrid: true,
            showGrid: true
          }
        },
        settings: {
          collaboration: {
            enabled: true,
            permissions: 'edit'
          },
          ai_assistance: {
            enabled: true,
            auto_optimize: true,
            suggestion_level: 'moderate'
          },
          version_control: {
            enabled: true,
            auto_save_interval: 30
          }
        },
        is_archived: false
      })

      // 创建示例项目2: 产品功能规划
      const productProject = await storeService.projects.create({
        user_id: testUser.id,
        name: '产品功能规划',
        description: '新产品的功能规划和需求分析，包含用户画像、功能点、优先级排序等。',
        status: 'active',
        canvas_data: {
          viewport: { x: 0, y: 0, zoom: 1 },
          config: {
            maxZoom: 3,
            minZoom: 0.1,
            gridSize: 20,
            snapToGrid: true,
            showGrid: true
          }
        },
        settings: {
          collaboration: {
            enabled: false,
            permissions: 'view'
          },
          ai_assistance: {
            enabled: true,
            auto_optimize: false,
            suggestion_level: 'minimal'
          },
          version_control: {
            enabled: true,
            auto_save_interval: 60
          }
        },
        is_archived: false
      })

      this.log(`✅ 创建项目成功: ${aiProject.name}, ${productProject.name}`, true)

      // 为AI项目创建示例节点（除非是最小化数据）
      if (!this.options.minimalData) {
        await this.createDemoNodes(aiProject.id, testUser.id)
      }

      return { aiProject, productProject }
    } catch (error) {
      console.error('❌ 创建示例项目失败:', error)
      throw error
    }
  }

  /**
   * 创建示例节点
   */
  private async createDemoNodes(projectId: string, userId: string): Promise<void> {
    try {
      this.log('📝 创建示例节点...', true)

      // 根节点：项目概述
      const rootNode = await storeService.nodes.create({
        project_id: projectId,
        user_id: userId,
        content: '构建一个智能AI助手系统，能够理解用户意图，提供准确的回答和建议，并具备学习能力。',
        title: 'AI助手项目概述',
        importance: 5,
        confidence: 0.9,
        status: 'completed',
        tags: ['overview', 'ai', 'assistant'],
        version: 1,
        position: { x: 400, y: 100 },
        size: { width: 300, height: 120 },
        metadata: {
          semantic_types: ['plan'],
          user_rating: 5,
          edit_count: 3,
          processing_history: [],
          statistics: {
            view_count: 15,
            edit_duration_total: 1800,
            ai_interactions: 2
          }
        },
        ai_generated: false
      })

      // 需求分析节点
      const requirementNode = await storeService.nodes.create({
        project_id: projectId,
        user_id: userId,
        content: '分析用户需求：多语言支持、自然语言理解、上下文记忆、个性化推荐、实时响应。',
        title: '用户需求分析',
        importance: 4,
        confidence: 0.85,
        status: 'completed',
        tags: ['requirements', 'analysis', 'users'],
        version: 1,
        position: { x: 100, y: 300 },
        size: { width: 280, height: 100 },
        metadata: {
          semantic_types: ['requirement', 'analysis'],
          user_rating: 4,
          edit_count: 2,
          processing_history: [],
          statistics: {
            view_count: 12,
            edit_duration_total: 1200,
            ai_interactions: 1
          }
        },
        parent_id: rootNode.id,
        ai_generated: false
      })

      // 技术架构节点
      const architectureNode = await storeService.nodes.create({
        project_id: projectId,
        user_id: userId,
        content: '采用微服务架构：API网关、NLP处理服务、知识库服务、对话管理服务、用户管理服务。',
        title: '技术架构设计',
        importance: 5,
        confidence: 0.8,
        status: 'processing',
        tags: ['architecture', 'microservices', 'design'],
        version: 1,
        position: { x: 700, y: 300 },
        size: { width: 280, height: 100 },
        metadata: {
          semantic_types: ['solution', 'plan'],
          user_rating: 5,
          edit_count: 5,
          processing_history: [],
          statistics: {
            view_count: 20,
            edit_duration_total: 3600,
            ai_interactions: 3
          }
        },
        parent_id: rootNode.id,
        ai_generated: false
      })

      // AI模型选择节点
      const modelNode = await storeService.nodes.create({
        project_id: projectId,
        user_id: userId,
        content: '评估不同AI模型：GPT系列用于对话生成，BERT用于理解，embedding模型用于语义匹配。',
        title: 'AI模型选择',
        importance: 4,
        confidence: 0.75,
        status: 'idle',
        tags: ['ai', 'models', 'evaluation'],
        version: 1,
        position: { x: 400, y: 500 },
        size: { width: 280, height: 100 },
        metadata: {
          semantic_types: ['analysis', 'decision'],
          edit_count: 1,
          processing_history: [],
          statistics: {
            view_count: 8,
            edit_duration_total: 900,
            ai_interactions: 1
          }
        },
        parent_id: architectureNode.id,
        ai_generated: true
      })

      this.log('✅ 创建节点成功', true)

      // 创建节点间的连接
      await this.createDemoConnections(projectId, [rootNode, requirementNode, architectureNode, modelNode])
    } catch (error) {
      console.error('❌ 创建示例节点失败:', error)
      throw error
    }
  }

  /**
   * 创建示例连接
   */
  private async createDemoConnections(projectId: string, nodes: any[]): Promise<void> {
    try {
      this.log('🔗 创建示例连接...', true)

      const [rootNode, requirementNode, architectureNode, modelNode] = nodes

      // 创建依赖连接
      await storeService.connections.createConnection({
        project_id: projectId,
        source_node_id: requirementNode.id,
        target_node_id: rootNode.id,
        type: 'dependency',
        label: '需求输入',
        weight: 0.8,
        metadata: {
          ai_suggested: false,
          confidence: 0.9,
          reasoning: '需求分析为项目提供基础输入',
          validation_status: 'accepted'
        },
        created_by_user: true
      })

      await storeService.connections.createConnection({
        project_id: projectId,
        source_node_id: architectureNode.id,
        target_node_id: rootNode.id,
        type: 'dependency',
        label: '技术实现',
        weight: 0.9,
        metadata: {
          ai_suggested: false,
          confidence: 0.85,
          reasoning: '技术架构是项目实现的核心',
          validation_status: 'accepted'
        },
        created_by_user: true
      })

      await storeService.connections.createConnection({
        project_id: projectId,
        source_node_id: modelNode.id,
        target_node_id: architectureNode.id,
        type: 'input',
        label: '模型选择',
        weight: 0.7,
        metadata: {
          ai_suggested: true,
          confidence: 0.75,
          reasoning: 'AI模型选择影响架构设计',
          validation_status: 'pending'
        },
        created_by_user: false
      })

      this.log('✅ 创建连接成功', true)
    } catch (error) {
      console.error('❌ 创建示例连接失败:', error)
      throw error
    }
  }

  /**
   * 创建示例AI任务
   */
  private async createDemoAITasks(projectId: string, userId: string): Promise<void> {
    try {
      this.log('🤖 创建示例AI任务...', true)

      // 内容生成任务
      await storeService.aiTasks.createTask({
        project_id: projectId,
        user_id: userId,
        type: 'content_generation',
        input_data: {
          prompt: '为AI助手项目生成详细的开发计划',
          context: '智能AI助手系统开发',
          requirements: ['技术栈选择', '开发时间线', '团队分工']
        },
        estimated_cost: 0.05,
        metadata: {
          model_used: 'gpt-4',
          token_count_input: 150,
          processing_time: 0,
          confidence: 0,
          quality_score: 0,
          retry_count: 0,
          priority: 3
        }
      })

      // 语义分析任务
      await storeService.aiTasks.createTask({
        project_id: projectId,
        user_id: userId,
        type: 'semantic_analysis',
        input_data: {
          content: '构建一个智能AI助手系统，能够理解用户意图...',
          analysis_type: 'deep',
          extract_entities: true
        },
        estimated_cost: 0.02,
        metadata: {
          model_used: 'gpt-3.5-turbo',
          token_count_input: 80,
          processing_time: 0,
          confidence: 0,
          quality_score: 0,
          retry_count: 0,
          priority: 2
        }
      })

      this.log('✅ 创建AI任务成功', true)
    } catch (error) {
      console.error('❌ 创建示例AI任务失败:', error)
      throw error
    }
  }

  /**
   * 执行所有种子数据创建
   */
  async seedAll(): Promise<void> {
    try {
      console.log('🌱 开始创建种子数据...')
      console.log('━'.repeat(50))

      // 初始化服务
      await storeService.initialize()

      // 清理数据（如果需要）
      if (this.options.clearBeforeSeed) {
        this.log('🧹 清理现有数据...', true)
        await this.clearAll()
      }

      let userId: string | undefined

      // 创建用户
      if (!this.options.projectsOnly) {
        const userResult = await this.createDemoUsers()
        if (userResult) {
          userId = userResult.testUser.id
        }
      }

      // 创建项目
      if (!this.options.usersOnly) {
        await this.createDemoProjects(userId)

        // 获取项目和用户信息创建AI任务（仅在非最小化模式）
        if (!this.options.minimalData) {
          const testUser = await storeService.users.findByUsername('testuser')
          if (testUser) {
            const projects = await storeService.projects.findByUser(testUser.id, { limit: 1 })
            if (projects.length > 0) {
              await this.createDemoAITasks(projects[0].id, testUser.id)
            }
          }
        }
      }

      console.log('━'.repeat(50))
      console.log('🎉 种子数据创建完成!')
    } catch (error) {
      console.error('❌ 种子数据创建失败:', error)
      throw error
    } finally {
      await storeService.close()
    }
  }

  /**
   * 清理所有数据
   */
  async clearAll(): Promise<void> {
    try {
      console.log('🧹 开始清理所有数据...')
      console.log('━'.repeat(50))

      await storeService.initialize()

      // 按依赖顺序删除数据
      const tables = [
        'activity_logs',
        'ai_tasks',
        'node_versions',
        'connections',
        'nodes',
        'project_collaborators',
        'projects',
        'users'
      ]

      let totalDeleted = 0
      for (const table of tables) {
        const result = await databaseManager.query(`DELETE FROM ${table}`)
        const rowCount = (result as any).rowCount || 0
        this.log(`清理 ${table}: ${rowCount} 条记录`, true)
        totalDeleted += rowCount
      }

      console.log('━'.repeat(50))
      console.log(`🎉 数据清理完成! 共删除 ${totalDeleted} 条记录`)
    } catch (error) {
      console.error('❌ 数据清理失败:', error)
      throw error
    } finally {
      await storeService.close()
    }
  }

  /**
   * 获取数据统计
   */
  async getStats(): Promise<Record<string, number>> {
    try {
      await storeService.initialize()

      const tables = [
        'users',
        'projects',
        'nodes',
        'connections',
        'ai_tasks',
        'activity_logs'
      ]

      const stats: Record<string, number> = {}
      for (const table of tables) {
        const result = await databaseManager.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table}`)
        stats[table] = parseInt(result[0].count) || 0
      }

      return stats
    } finally {
      await storeService.close()
    }
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'seed'

  // 解析选项
  const options: SeedOptions = {
    skipIfExists: !process.argv.includes('--force'),
    clearBeforeSeed: process.argv.includes('--clear'),
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
    usersOnly: process.argv.includes('--users-only'),
    projectsOnly: process.argv.includes('--projects-only'),
    minimalData: process.argv.includes('--minimal')
  }

  const seedManager = new SeedManager(options)

  switch (command) {
    case 'seed':
      seedManager.seedAll()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'clear':
      seedManager.clearAll()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    case 'stats':
      seedManager.getStats()
        .then(stats => {
          console.log('\n📊 数据库统计:')
          console.log('━'.repeat(50))
          Object.entries(stats).forEach(([table, count]) => {
            console.log(`  ${table.padEnd(20)} ${count}`)
          })
          console.log('━'.repeat(50) + '\n')
        })
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error)
          process.exit(1)
        })
      break

    default:
      console.log('用法:')
      console.log('  npm run seed              - 创建种子数据')
      console.log('  npm run seed clear        - 清理所有数据')
      console.log('  npm run seed stats        - 查看数据统计')
      console.log('')
      console.log('选项:')
      console.log('  --force          - 强制创建（忽略已存在检查）')
      console.log('  --clear          - 在种子前清理数据')
      console.log('  --verbose, -v    - 详细输出')
      console.log('  --users-only     - 仅创建用户')
      console.log('  --projects-only  - 仅创建项目')
      console.log('  --minimal        - 最小化数据集')
      process.exit(1)
  }
}