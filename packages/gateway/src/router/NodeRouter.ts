import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes'
import {
  NodeSearchQuery,
  NodeVersionQuery,
  NodeCreateData,
  NodeUpdateData,
  NodeRollbackRequest,
  QueryOptions
} from '../types/SpecificTypes'
import { ResponseMapper } from '../adapters/ResponseMapper'
import { BaseRouter, RouterDependencies } from './BaseRouter'
import type { ImportanceLevel } from '@sker/models'

/**
 * 节点管理路由器 - 处理节点的CRUD操作、搜索、优化和版本管理
 */
export class NodeRouter extends BaseRouter {
  constructor(dependencies?: RouterDependencies) {
    super(dependencies)
    this.setupRoutes()
  }

  protected setupRoutes(): void {
    // 创建节点
    this.router.post('/', this.createNode.bind(this))

    // 获取节点
    this.router.get('/:id', this.getNode.bind(this))

    // 更新节点
    this.router.put('/:id', this.updateNode.bind(this))

    // 删除节点
    this.router.delete('/:id', this.deleteNode.bind(this))

    // 搜索节点
    this.router.get('/', this.searchNodes.bind(this))

    // 优化节点内容
    this.router.post('/:id/optimize', this.optimizeNode.bind(this))

    // 节点版本管理
    this.router.get('/:id/versions', this.getNodeVersions.bind(this))
    this.router.post('/:id/rollback', this.rollbackNode.bind(this))
  }

  private async createNode(req: ApiRequest<NodeCreateData>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const {
        title,
        content,
        project_id,
        parent_id,
        type = 'text',
        position,
        importance = 50,
        tags,
        metadata
      } = req.body

      // 验证必需字段
      if (!title && !content) {
        res.error({
          code: 'MISSING_REQUIRED_FIELDS',
          message: '标题和内容至少需要提供一个',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      if (!project_id) {
        res.error({
          code: 'MISSING_PROJECT_ID',
          message: '缺少必需的 project_id 参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 创建节点数据
      const nodeData = {
        title: title || content?.substring(0, 50) + '...',
        content: content || '',
        project_id,
        user_id: req.user?.id || 'anonymous',
        parent_id: parent_id || null,
        type,
        position: position || { x: 0, y: 0 },
        importance: Math.max(1, Math.min(5, Math.round(importance / 20))) as ImportanceLevel,
        tags: tags || [],
        status: 'active',
        confidence: 100,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId,
          ...metadata
        }
      }

      // 使用存储服务创建节点
      const createdNode = await this.storeClient!.nodes.create(nodeData)

      // 发布节点创建事件
      await this.storeClient!.publishEntityChange({
        entityType: 'node',
        entityId: createdNode.id,
        operation: 'create',
        data: createdNode,
        userId: req.user?.id,
        projectId: project_id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId
        }
      })

      res.success({
        id: createdNode.id,
        title: createdNode.title,
        content: createdNode.content,
        type: createdNode.type,
        position: createdNode.position,
        importance: createdNode.importance,
        tags: createdNode.tags,
        confidence: createdNode.confidence,
        status: createdNode.status,
        project_id: createdNode.project_id,
        parent_id: createdNode.parent_id,
        created_at: createdNode.created_at,
        updated_at: createdNode.updated_at
      }, 'Node created successfully')
    } catch (error) {
      console.error('创建节点失败:', error)
      res.error({
        code: 'CREATE_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 从数据库获取节点
      const node = await this.storeClient!.nodes.findById(id)

      if (!node) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查用户访问权限（如果有用户信息）
      if (req.user?.id && node.user_id !== req.user.id) {
        // 可以在这里添加更复杂的权限检查逻辑
        // 比如检查项目协作者权限等
      }

      res.success({
        id: node.id,
        title: node.title,
        content: node.content,
        type: node.type,
        position: node.position,
        importance: node.importance,
        tags: node.tags,
        confidence: node.confidence,
        status: node.status,
        project_id: node.project_id,
        parent_id: node.parent_id,
        user_id: node.user_id,
        created_at: node.created_at,
        updated_at: node.updated_at,
        metadata: node.metadata
      })
    } catch (error) {
      console.error('获取节点失败:', error)
      res.error({
        code: 'GET_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async updateNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查节点是否存在
      const existingNode = await this.storeClient!.nodes.findById(id)
      if (!existingNode) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 准备更新数据
      const updateData: Partial<NodeUpdateData> = {}
      const {
        title,
        content,
        type,
        position,
        importance,
        tags,
        status,
        metadata
      } = req.body

      if (title !== undefined) updateData.title = title
      if (content !== undefined) updateData.content = content
      if (type !== undefined) updateData.type = type
      if (position !== undefined) updateData.position = position
      if (importance !== undefined) {
        updateData.importance = Math.max(0, Math.min(100, importance))
      }
      if (tags !== undefined) updateData.tags = tags
      if (status !== undefined) updateData.status = status
      if (metadata !== undefined) {
        updateData.metadata = {
          ...existingNode.metadata,
          ...metadata,
          lastModified: {
            source: 'gateway_api',
            requestId: req.requestId,
            timestamp: new Date()
          }
        }
      }

      // 更新时间戳
      updateData.updated_at = new Date()

      // 执行更新
      const updatedNode = await this.storeClient!.nodes.update(id, updateData)

      if (!updatedNode) {
        res.error({
          code: 'UPDATE_FAILED',
          message: '节点更新失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 发布节点更新事件
      await this.storeClient!.publishEntityChange({
        entityType: 'node',
        entityId: id,
        operation: 'update',
        data: updatedNode,
        oldData: existingNode,
        userId: req.user?.id,
        projectId: updatedNode.project_id,
        metadata: {
          source: 'gateway_api',
          requestId: req.requestId,
          changedFields: Object.keys(updateData)
        }
      })

      res.success({
        id: updatedNode.id,
        title: updatedNode.title,
        content: updatedNode.content,
        type: updatedNode.type,
        position: updatedNode.position,
        importance: updatedNode.importance,
        tags: updatedNode.tags,
        confidence: updatedNode.confidence,
        status: updatedNode.status,
        project_id: updatedNode.project_id,
        parent_id: updatedNode.parent_id,
        user_id: updatedNode.user_id,
        created_at: updatedNode.created_at,
        updated_at: updatedNode.updated_at,
        metadata: updatedNode.metadata
      }, 'Node updated successfully')
    } catch (error) {
      console.error('更新节点失败:', error)
      res.error({
        code: 'UPDATE_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async deleteNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params
      const { permanent = false } = req.query

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查节点是否存在
      const existingNode = await this.storeClient!.nodes.findById(id)
      if (!existingNode) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      let result: boolean
      let message: string

      if (permanent === 'true') {
        // 永久删除
        result = await this.storeClient!.nodes.delete(id)
        message = 'Node permanently deleted successfully'

        // 发布节点删除事件
        if (result) {
          await this.storeClient!.publishEntityChange({
            entityType: 'node',
            entityId: id,
            operation: 'delete',
            data: null,
            oldData: existingNode,
            userId: req.user?.id,
            projectId: existingNode.project_id,
            metadata: {
              source: 'gateway_api',
              requestId: req.requestId,
              permanent: true
            }
          })
        }
      } else {
        // 软删除（标记为删除状态）
        const updatedNode = await this.storeClient!.nodes.update(id, {
          status: 'deleted',
          updated_at: new Date(),
          metadata: {
            ...existingNode.metadata,
            deletedAt: new Date(),
            deletedBy: req.user?.id,
            deletedFrom: 'gateway_api',
            requestId: req.requestId
          }
        })

        result = !!updatedNode
        message = 'Node moved to trash successfully'

        // 发布节点软删除事件
        if (result) {
          await this.storeClient!.publishEntityChange({
            entityType: 'node',
            entityId: id,
            operation: 'soft_delete',
            data: updatedNode,
            oldData: existingNode,
            userId: req.user?.id,
            projectId: existingNode.project_id,
            metadata: {
              source: 'gateway_api',
              requestId: req.requestId,
              permanent: false
            }
          })
        }
      }

      if (!result) {
        res.error({
          code: 'DELETE_FAILED',
          message: '节点删除失败',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      res.success(null, message)
    } catch (error) {
      console.error('删除节点失败:', error)
      res.error({
        code: 'DELETE_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async searchNodes(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const {
        q: query = '',
        project_id,
        user_id,
        type,
        status,
        tags,
        importance_min,
        importance_max,
        page = 1,
        pageSize = 20,
        sortBy = 'updated_at',
        sortDirection = 'DESC'
      } = req.query as NodeSearchQuery

      // 构建查询选项
      const options: QueryOptions = {
        limit: Math.min(parseInt(pageSize as string), 100), // 限制最大页面大小
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string),
        orderBy: sortBy,
        orderDirection: (sortDirection as string).toUpperCase() as 'ASC' | 'DESC',
        filters: {}
      }

      // 添加过滤条件
      if (project_id) options.filters.project_id = project_id
      if (user_id) options.filters.user_id = user_id
      if (type) options.filters.type = type
      if (status) {
        options.filters.status = status
      } else {
        // 默认排除已删除的节点
        options.filters.status = ['active', 'draft', 'archived']
      }
      if (importance_min) options.filters.importance_min = parseInt(String(importance_min))
      if (importance_max) options.filters.importance_max = parseInt(String(importance_max))

      let results, totalCount

      if (query && query.trim()) {
        // 如果有搜索查询，使用搜索方法
        if (tags) {
          // 如果指定了标签，使用标签搜索
          const tagArray = Array.isArray(tags) ? tags : [tags]
          results = await this.storeClient!.nodes.findByTags(tagArray, options)
          // 对于标签搜索，需要单独查询总数
          const allResults = await this.storeClient!.nodes.findByTags(tagArray, {
            ...options,
            limit: undefined,
            offset: undefined
          })
          totalCount = allResults.length
        } else {
          // 全文搜索（需要实现搜索方法）
          // 这里使用通用查询，然后在应用层过滤
          const allNodes = await this.storeClient!.nodes.findMany({
            filters: options.filters,
            orderBy: options.orderBy,
            orderDirection: options.orderDirection
          })

          // 在应用层进行文本搜索
          const filteredNodes = allNodes.filter(node => {
            const searchText = query.toLowerCase()
            return (
              node.title?.toLowerCase().includes(searchText) ||
              node.content?.toLowerCase().includes(searchText) ||
              node.tags?.some(tag => tag.toLowerCase().includes(searchText))
            )
          })

          totalCount = filteredNodes.length
          results = filteredNodes.slice(options.offset, options.offset + options.limit)
        }
      } else {
        // 无搜索查询，使用分页查询
        if (tags) {
          const tagArray = Array.isArray(tags) ? tags : [tags]
          results = await this.storeClient!.nodes.findByTags(tagArray, options)
          const allResults = await this.storeClient!.nodes.findByTags(tagArray, {
            ...options,
            limit: undefined,
            offset: undefined
          })
          totalCount = allResults.length
        } else {
          const paginatedResult = await this.storeClient!.nodes.findWithPagination(options)
          results = paginatedResult.items
          totalCount = paginatedResult.total
        }
      }

      // 计算分页信息
      const totalPages = Math.ceil(totalCount / options.limit)
      const currentPage = parseInt(String(page))
      const hasNext = currentPage < totalPages
      const hasPrev = currentPage > 1

      // 格式化响应数据
      const formattedResults = results.map((node: any) => ({
        id: node.id,
        title: node.title,
        content: node.content,
        type: node.type,
        position: node.position,
        importance: node.importance,
        tags: node.tags,
        confidence: node.confidence,
        status: node.status,
        project_id: node.project_id,
        parent_id: node.parent_id,
        user_id: node.user_id,
        created_at: node.created_at,
        updated_at: node.updated_at
      }))

      res.success({
        items: formattedResults,
        pagination: {
          total: totalCount,
          page: currentPage,
          pageSize: options.limit,
          totalPages,
          hasNext,
          hasPrev
        },
        filters: {
          query,
          project_id,
          user_id,
          type,
          status,
          tags,
          importance_range: importance_min || importance_max ? {
            min: importance_min,
            max: importance_max
          } : null
        },
        sort: {
          by: options.orderBy,
          direction: options.orderDirection
        }
      })
    } catch (error) {
      console.error('搜索节点失败:', error)
      res.error({
        code: 'SEARCH_NODES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search nodes',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async optimizeNode(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const { id } = req.params
      const { instruction, model } = req.body

      if (!this.checkStoreService(req, res) || !this.checkAIEngine(req, res)) return

      // 获取节点数据
      const node = await this.storeClient!.nodes.findById(id)
      if (!node) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 使用AI引擎优化节点内容
      const result = await this.aiEngine!.optimizeContent({
        content: node.content,
        instruction: instruction || '请优化这个节点的内容，使其更清晰、准确和有条理',
        model: model || 'gpt-4',
        userId: req.user?.id,
        projectId: node.project_id,
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api',
          nodeId: id
        }
      })

      // 更新节点内容
      const updatedNode = await this.storeClient!.nodes.update(id, {
        content: result.content,
        title: result.title || node.title,
        updated_at: new Date()
      })

      // 发布节点变更事件
      await this.storeClient!.publishEntityChange({
        entityType: 'node',
        entityId: id,
        operation: 'update',
        data: updatedNode,
        oldData: node,
        userId: req.user?.id,
        projectId: node.project_id,
        metadata: {
          optimized: true,
          aiModel: result.metadata.model,
          improvements: result.improvements
        }
      })

      res.success({
        id,
        content: result.content,
        title: result.title,
        confidence: result.confidence,
        improvements: result.improvements,
        metadata: {
          requestId: req.requestId,
          model: result.metadata.model,
          processingTime: result.metadata.processingTime,
          tokenCount: result.metadata.tokenCount
        }
      }, 'Node optimized successfully')
    } catch (error) {
      console.error('优化节点失败:', error)
      res.error({
        code: 'OPTIMIZE_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to optimize node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getNodeVersions(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params
      const { limit = 10, offset = 0, include_content = false } = req.query as NodeVersionQuery

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查节点是否存在
      const node = await this.storeClient!.nodes.findById(id)
      if (!node) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 获取节点版本历史
      const versionsQuery = `
        SELECT
          id,
          version_number,
          title,
          ${include_content === 'true' ? 'content,' : ''}
          change_description,
          created_by,
          created_at,
          metadata
        FROM node_versions
        WHERE node_id = $1
        ORDER BY version_number DESC
        LIMIT $2 OFFSET $3
      `

      const totalQuery = `
        SELECT COUNT(*) as total
        FROM node_versions
        WHERE node_id = $1
      `

      try {
        // 通过存储服务的数据库连接执行查询
        const pool = (this.storeClient as any)?.nodeRepo?.pool
        if (!pool) {
          throw new Error('Database connection not available')
        }

        const [versionsResult, totalResult] = await Promise.all([
          pool.query(versionsQuery, [id, parseInt(String(limit)), parseInt(String(offset))]),
          pool.query(totalQuery, [id])
        ])

        const versions = versionsResult.rows
        const total = parseInt(totalResult.rows[0]?.total || '0')

        // 格式化版本数据
        const formattedVersions = versions.map((version: any) => ({
          id: version.id,
          version_number: version.version_number,
          title: version.title,
          content: version.content || undefined,
          change_description: version.change_description,
          created_by: version.created_by,
          created_at: version.created_at,
          metadata: version.metadata,
          is_current: version.version_number === 1 // 最新版本
        }))

        res.success({
          node_id: id,
          versions: formattedVersions,
          pagination: {
            total,
            limit: parseInt(String(limit)),
            offset: parseInt(String(offset)),
            has_more: total > parseInt(String(offset)) + formattedVersions.length
          },
          current_version: formattedVersions.find(v => v.is_current)?.version_number || 1
        })

      } catch (dbError) {
        // 如果版本表不存在或查询失败，返回空结果
        console.warn('Node versions table may not exist:', dbError)
        res.success({
          node_id: id,
          versions: [],
          pagination: {
            total: 0,
            limit: parseInt(String(limit)),
            offset: parseInt(String(offset)),
            has_more: false
          },
          current_version: 1,
          note: '版本管理功能暂未完全启用，当前显示基础信息'
        })
      }

    } catch (error) {
      console.error('获取节点版本失败:', error)
      res.error({
        code: 'GET_VERSIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get node versions',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async rollbackNode(req: ApiRequest<NodeRollbackRequest>, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkStoreService(req, res)) return

      const { id } = req.params
      const { version_number, change_description } = req.body

      if (!id) {
        res.error({
          code: 'MISSING_NODE_ID',
          message: '缺少必需的节点ID参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      if (!version_number) {
        res.error({
          code: 'MISSING_VERSION_NUMBER',
          message: '缺少必需的版本号参数',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      // 检查节点是否存在
      const currentNode = await this.storeClient!.nodes.findById(id)
      if (!currentNode) {
        res.error({
          code: 'NODE_NOT_FOUND',
          message: '节点不存在',
          timestamp: new Date(),
          requestId: req.requestId
        })
        return
      }

      try {
        // 获取指定版本的数据
        const pool = (this.storeClient as any)?.nodeRepo?.pool
        if (!pool) {
          throw new Error('Database connection not available')
        }

        const versionQuery = `
          SELECT
            title,
            content,
            type,
            position,
            importance,
            tags,
            metadata
          FROM node_versions
          WHERE node_id = $1 AND version_number = $2
        `

        const versionResult = await pool.query(versionQuery, [id, version_number])

        if (versionResult.rows.length === 0) {
          res.error({
            code: 'VERSION_NOT_FOUND',
            message: `版本 ${version_number} 不存在`,
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        const versionData = versionResult.rows[0]

        // 创建新版本记录（保存当前状态）
        const createVersionQuery = `
          INSERT INTO node_versions (
            node_id, version_number, title, content, type, position,
            importance, tags, change_description, created_by, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `

        // 获取下一个版本号
        const maxVersionQuery = `
          SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
          FROM node_versions
          WHERE node_id = $1
        `
        const maxVersionResult = await pool.query(maxVersionQuery, [id])
        const nextVersion = maxVersionResult.rows[0].next_version

        // 保存当前状态作为新版本
        await pool.query(createVersionQuery, [
          id,
          nextVersion,
          currentNode.title,
          currentNode.content,
          currentNode.type,
          JSON.stringify(currentNode.position),
          currentNode.importance,
          JSON.stringify(currentNode.tags),
          `Backup before rollback to version ${version_number}`,
          req.user?.id || 'system',
          JSON.stringify({
            ...currentNode.metadata,
            rollback_backup: true,
            rollback_target_version: version_number
          })
        ])

        // 更新节点为指定版本的数据
        const updateData = {
          title: versionData.title,
          content: versionData.content,
          type: versionData.type,
          position: JSON.parse(versionData.position || '{}'),
          importance: versionData.importance,
          tags: JSON.parse(versionData.tags || '[]'),
          updated_at: new Date(),
          metadata: {
            ...JSON.parse(versionData.metadata || '{}'),
            rollback: {
              from_version: nextVersion,
              to_version: version_number,
              rollback_date: new Date(),
              rollback_by: req.user?.id,
              change_description: change_description || `Rolled back to version ${version_number}`,
              requestId: req.requestId
            }
          }
        }

        const updatedNode = await this.storeClient!.nodes.update(id, updateData)

        if (!updatedNode) {
          res.error({
            code: 'ROLLBACK_FAILED',
            message: '节点回滚失败',
            timestamp: new Date(),
            requestId: req.requestId
          })
          return
        }

        // 发布节点回滚事件
        await this.storeClient!.publishEntityChange({
          entityType: 'node',
          entityId: id,
          operation: 'rollback',
          data: updatedNode,
          oldData: currentNode,
          userId: req.user?.id,
          projectId: currentNode.project_id,
          metadata: {
            source: 'gateway_api',
            requestId: req.requestId,
            rollback: {
              from_version: nextVersion,
              to_version: version_number,
              change_description
            }
          }
        })

        res.success({
          id,
          rollback: {
            from_version: nextVersion,
            to_version: version_number,
            change_description: change_description || `Rolled back to version ${version_number}`
          },
          node: {
            id: updatedNode.id,
            title: updatedNode.title,
            content: updatedNode.content,
            type: updatedNode.type,
            position: updatedNode.position,
            importance: updatedNode.importance,
            tags: updatedNode.tags,
            status: updatedNode.status,
            updated_at: updatedNode.updated_at
          }
        }, 'Node rolled back successfully')

      } catch (dbError) {
        console.error('Database operation failed:', dbError)
        res.error({
          code: 'DATABASE_ERROR',
          message: '版本管理功能不可用',
          timestamp: new Date(),
          requestId: req.requestId
        })
      }

    } catch (error) {
      console.error('回滚节点失败:', error)
      res.error({
        code: 'ROLLBACK_NODE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to rollback node',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }
}