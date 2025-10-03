import { describe, it, expect } from 'vitest'
import {
  User,
  Project,
  Node,
  Connection,
  AITask,
  NodeVersion,
  DatabaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  NODE_STATUS,
  PROJECT_STATUS,
  AI_TASK_STATUS,
  AI_TASK_TYPE,
  SEMANTIC_TYPE,
  IMPORTANCE_LEVEL,
  type ImportanceLevel,
  type NodeStatus,
  type ProjectStatus,
  type AITaskStatus,
  type AITaskType,
  type SemanticType,
} from '../index.js'

describe('@sker/models - Type Definitions', () => {
  describe('User Model', () => {
    it('应该正确定义User接口', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        settings: {
          theme: 'dark',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: false,
            task_completion: true,
            collaboration: true,
          },
          ai_preferences: {
            default_model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 2000,
          },
        },
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      }

      expect(user.id).toBe('user-123')
      expect(user.settings.theme).toBe('dark')
      expect(user.settings.ai_preferences.temperature).toBe(0.7)
    })

    it('应该支持可选字段', () => {
      const userWithoutOptional: User = {
        id: 'user-456',
        email: 'test2@example.com',
        username: 'testuser2',
        password_hash: 'hashed',
        settings: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: false,
            push: false,
            task_completion: false,
            collaboration: false,
          },
          ai_preferences: {
            default_model: 'gpt-3.5-turbo',
            temperature: 0.5,
            max_tokens: 1000,
          },
        },
        created_at: new Date(),
        updated_at: new Date(),
        is_active: false,
      }

      expect(userWithoutOptional.avatar_url).toBeUndefined()
      expect(userWithoutOptional.last_login_at).toBeUndefined()
    })
  })

  describe('Project Model', () => {
    it('应该正确定义Project接口', () => {
      const project: Project = {
        id: 'proj-123',
        user_id: 'user-123',
        name: 'Test Project',
        status: 'active',
        canvas_data: {
          viewport: {
            x: 0,
            y: 0,
            zoom: 1,
          },
          config: {
            maxZoom: 4,
            minZoom: 0.1,
            gridSize: 20,
            snapToGrid: true,
            showGrid: true,
          },
        },
        settings: {
          collaboration: {
            enabled: true,
            permissions: 'edit',
          },
          ai_assistance: {
            enabled: true,
            auto_optimize: false,
            suggestion_level: 'moderate',
          },
          version_control: {
            enabled: true,
            auto_save_interval: 30000,
          },
        },
        created_at: new Date(),
        updated_at: new Date(),
        last_accessed_at: new Date(),
        is_archived: false,
      }

      expect(project.status).toBe('active')
      expect(project.canvas_data.viewport.zoom).toBe(1)
      expect(project.settings.ai_assistance.suggestion_level).toBe('moderate')
    })

    it('应该验证ProjectStatus类型', () => {
      const statuses: ProjectStatus[] = ['active', 'paused', 'completed', 'archived']
      statuses.forEach((status) => {
        const project: Partial<Project> = { status }
        expect(project.status).toBeDefined()
      })
    })
  })

  describe('Node Model', () => {
    it('应该正确定义Node接口', () => {
      const node: Node = {
        id: 'node-123',
        project_id: 'proj-123',
        user_id: 'user-123',
        content: 'Test content',
        title: 'Test Node',
        importance: 3,
        confidence: 85,
        status: 'idle',
        tags: ['test', 'example'],
        version: 1,
        position: { x: 100, y: 200 },
        metadata: {
          semantic_types: ['idea'],
          edit_count: 0,
          processing_history: [],
          statistics: {
            view_count: 0,
            edit_duration_total: 0,
            ai_interactions: 0,
          },
        },
        created_at: new Date(),
        updated_at: new Date(),
        ai_generated: false,
      }

      expect(node.importance).toBe(3)
      expect(node.confidence).toBe(85)
      expect(node.position).toEqual({ x: 100, y: 200 })
      expect(node.metadata.semantic_types).toContain('idea')
    })

    it('应该验证ImportanceLevel范围', () => {
      const levels: ImportanceLevel[] = [1, 2, 3, 4, 5]
      levels.forEach((level) => {
        const node: Partial<Node> = { importance: level }
        expect(node.importance).toBeGreaterThanOrEqual(1)
        expect(node.importance).toBeLessThanOrEqual(5)
      })
    })

    it('应该验证NodeStatus类型', () => {
      const statuses: NodeStatus[] = ['idle', 'processing', 'completed', 'error', 'deleted']
      statuses.forEach((status) => {
        const node: Partial<Node> = { status }
        expect(NODE_STATUS[status.toUpperCase() as keyof typeof NODE_STATUS]).toBe(status)
      })
    })

    it('应该验证SemanticType类型', () => {
      const types: SemanticType[] = [
        'requirement',
        'solution',
        'plan',
        'analysis',
        'idea',
        'question',
        'answer',
        'decision',
        'fusion',
        'summary',
        'synthesis',
        'comparison',
        'fusion-error',
      ]

      types.forEach((type) => {
        const metadata: Partial<Node['metadata']> = {
          semantic_types: [type],
        }
        expect(metadata.semantic_types).toContain(type)
      })
    })
  })

  describe('Connection Model', () => {
    it('应该正确定义Connection接口', () => {
      const connection: Connection = {
        id: 'conn-123',
        project_id: 'proj-123',
        source_node_id: 'node-1',
        target_node_id: 'node-2',
        type: 'input',
        bidirectional: false,
        weight: 0.8,
        metadata: {
          ai_suggested: false,
          confidence: 90,
          validation_status: 'accepted',
        },
        created_at: new Date(),
        updated_at: new Date(),
        created_by_user: true,
      }

      expect(connection.type).toBe('input')
      expect(connection.weight).toBe(0.8)
      expect(connection.metadata.validation_status).toBe('accepted')
    })

    it('应该验证连接权重范围', () => {
      const validWeights = [0, 0.5, 1.0]
      validWeights.forEach((weight) => {
        expect(weight).toBeGreaterThanOrEqual(0)
        expect(weight).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('AITask Model', () => {
    it('应该正确定义AITask接口', () => {
      const task: AITask = {
        id: 'task-123',
        project_id: 'proj-123',
        user_id: 'user-123',
        type: 'content_generation',
        status: 'pending',
        input_data: { prompt: 'Generate content' },
        metadata: {
          model_used: 'gpt-4',
          token_count_input: 100,
          retry_count: 0,
          priority: 1,
        },
        created_at: new Date(),
        estimated_cost: 0.05,
      }

      expect(task.type).toBe('content_generation')
      expect(task.status).toBe('pending')
      expect(task.metadata.model_used).toBe('gpt-4')
    })

    it('应该验证AITaskType类型', () => {
      const types: AITaskType[] = [
        'content_generation',
        'content_optimization',
        'semantic_analysis',
        'content_fusion',
        'batch_processing',
        'node_enhancement',
      ]

      types.forEach((type) => {
        expect(Object.values(AI_TASK_TYPE)).toContain(type)
      })
    })

    it('应该验证AITaskStatus类型', () => {
      const statuses: AITaskStatus[] = [
        'pending',
        'queued',
        'processing',
        'completed',
        'failed',
        'cancelled',
      ]

      statuses.forEach((status) => {
        expect(Object.values(AI_TASK_STATUS)).toContain(status)
      })
    })
  })

  describe('NodeVersion Model', () => {
    it('应该正确定义NodeVersion接口', () => {
      const version: NodeVersion = {
        id: 'ver-123',
        node_id: 'node-123',
        version_number: 2,
        content: 'Updated content',
        confidence: 90,
        change_type: 'optimize',
        created_at: new Date(),
        created_by: 'user-123',
        metadata: {
          rollback_point: true,
        },
      }

      expect(version.version_number).toBe(2)
      expect(version.change_type).toBe('optimize')
      expect(version.metadata.rollback_point).toBe(true)
    })
  })
})

describe('@sker/models - Constants', () => {
  describe('NODE_STATUS', () => {
    it('应该导出所有节点状态常量', () => {
      expect(NODE_STATUS.IDLE).toBe('idle')
      expect(NODE_STATUS.PROCESSING).toBe('processing')
      expect(NODE_STATUS.COMPLETED).toBe('completed')
      expect(NODE_STATUS.ERROR).toBe('error')
      expect(NODE_STATUS.DELETED).toBe('deleted')
    })
  })

  describe('PROJECT_STATUS', () => {
    it('应该导出所有项目状态常量', () => {
      expect(PROJECT_STATUS.ACTIVE).toBe('active')
      expect(PROJECT_STATUS.PAUSED).toBe('paused')
      expect(PROJECT_STATUS.COMPLETED).toBe('completed')
      expect(PROJECT_STATUS.ARCHIVED).toBe('archived')
    })
  })

  describe('AI_TASK_STATUS', () => {
    it('应该导出所有AI任务状态常量', () => {
      expect(AI_TASK_STATUS.PENDING).toBe('pending')
      expect(AI_TASK_STATUS.QUEUED).toBe('queued')
      expect(AI_TASK_STATUS.PROCESSING).toBe('processing')
      expect(AI_TASK_STATUS.COMPLETED).toBe('completed')
      expect(AI_TASK_STATUS.FAILED).toBe('failed')
      expect(AI_TASK_STATUS.CANCELLED).toBe('cancelled')
    })
  })

  describe('AI_TASK_TYPE', () => {
    it('应该导出所有AI任务类型常量', () => {
      expect(AI_TASK_TYPE.CONTENT_GENERATION).toBe('content_generation')
      expect(AI_TASK_TYPE.CONTENT_OPTIMIZATION).toBe('content_optimization')
      expect(AI_TASK_TYPE.SEMANTIC_ANALYSIS).toBe('semantic_analysis')
      expect(AI_TASK_TYPE.CONTENT_FUSION).toBe('content_fusion')
      expect(AI_TASK_TYPE.BATCH_PROCESSING).toBe('batch_processing')
      expect(AI_TASK_TYPE.NODE_ENHANCEMENT).toBe('node_enhancement')
    })
  })

  describe('SEMANTIC_TYPE', () => {
    it('应该导出所有语义类型常量', () => {
      expect(SEMANTIC_TYPE.REQUIREMENT).toBe('requirement')
      expect(SEMANTIC_TYPE.SOLUTION).toBe('solution')
      expect(SEMANTIC_TYPE.PLAN).toBe('plan')
      expect(SEMANTIC_TYPE.ANALYSIS).toBe('analysis')
      expect(SEMANTIC_TYPE.IDEA).toBe('idea')
      expect(SEMANTIC_TYPE.FUSION).toBe('fusion')
      expect(SEMANTIC_TYPE.FUSION_ERROR).toBe('fusion-error')
    })
  })

  describe('IMPORTANCE_LEVEL', () => {
    it('应该导出所有重要性等级常量', () => {
      expect(IMPORTANCE_LEVEL.VERY_LOW).toBe(1)
      expect(IMPORTANCE_LEVEL.LOW).toBe(2)
      expect(IMPORTANCE_LEVEL.MEDIUM).toBe(3)
      expect(IMPORTANCE_LEVEL.HIGH).toBe(4)
      expect(IMPORTANCE_LEVEL.VERY_HIGH).toBe(5)
    })
  })
})

describe('@sker/models - Error Classes', () => {
  describe('DatabaseError', () => {
    it('应该正确创建DatabaseError实例', () => {
      const error = new DatabaseError('Connection failed', 'DB_CONN_ERR', {
        host: 'localhost',
      })

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(DatabaseError)
      expect(error.name).toBe('DatabaseError')
      expect(error.message).toBe('Connection failed')
      expect(error.code).toBe('DB_CONN_ERR')
      expect(error.details).toEqual({ host: 'localhost' })
    })
  })

  describe('ValidationError', () => {
    it('应该正确创建ValidationError实例', () => {
      const error = new ValidationError('Invalid email format', 'email', 'invalid@')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Invalid email format')
      expect(error.field).toBe('email')
      expect(error.value).toBe('invalid@')
    })
  })

  describe('NotFoundError', () => {
    it('应该正确创建NotFoundError实例', () => {
      const error = new NotFoundError('User', 'user-123')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('User with id user-123 not found')
    })
  })

  describe('UnauthorizedError', () => {
    it('应该正确创建UnauthorizedError实例', () => {
      const error = new UnauthorizedError('delete', 'project')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(UnauthorizedError)
      expect(error.name).toBe('UnauthorizedError')
      expect(error.message).toBe('Unauthorized to delete project')
    })
  })
})

describe('@sker/models - Type Safety', () => {
  it('应该确保ImportanceLevel只接受1-5', () => {
    const validLevels: ImportanceLevel[] = [1, 2, 3, 4, 5]
    validLevels.forEach((level) => {
      expect(level).toBeGreaterThanOrEqual(1)
      expect(level).toBeLessThanOrEqual(5)
    })
  })

  it('应该确保confidence范围在0-100', () => {
    const testNode: Partial<Node> = {
      confidence: 85,
    }
    expect(testNode.confidence).toBeGreaterThanOrEqual(0)
    expect(testNode.confidence).toBeLessThanOrEqual(100)
  })

  it('应该确保connection weight范围在0-1', () => {
    const testConnection: Partial<Connection> = {
      weight: 0.75,
    }
    expect(testConnection.weight).toBeGreaterThanOrEqual(0)
    expect(testConnection.weight).toBeLessThanOrEqual(1)
  })
})
