import type { AINode, SemanticType, ProcessingRecord } from './node'

// 引用后端Node类型定义 - 保持与packages/store/src/models/index.ts一致
interface BackendNode {
  id: string
  project_id: string
  user_id: string
  content: string
  title?: string
  importance: 1 | 2 | 3 | 4 | 5
  confidence: number
  status: 'idle' | 'processing' | 'completed' | 'error'
  tags: string[]
  version: number
  position: { x: number; y: number }
  size?: { width: number; height: number }
  metadata: Record<string, any>
  parent_id?: string
  created_at: Date
  updated_at: Date
  ai_generated?: boolean // 改为可选
}

/**
 * 前后端数据转换器
 * 处理前端AINode与后端Node之间的数据格式转换
 */
export class NodeDataConverter {
  /**
   * 将前端AINode转换为后端Node格式
   */
  static toBackend(frontendNode: AINode): Partial<BackendNode> {
    return {
      id: frontendNode.id,
      content: frontendNode.content,
      title: frontendNode.title,
      importance: frontendNode.importance,
      confidence: this.convertConfidenceToBackend(frontendNode.confidence),
      status: frontendNode.status,
      tags: frontendNode.tags,
      version: frontendNode.version,
      position: frontendNode.position,
      size: frontendNode.size,
      metadata: {
        semantic_types: frontendNode.semantic_type ? [frontendNode.semantic_type] : frontendNode.metadata.semantic,
        user_rating: frontendNode.user_rating,
        edit_count: frontendNode.metadata.editCount,
        last_edit_reason: frontendNode.metadata.lastEditReason,
        processing_history: frontendNode.metadata.processingHistory?.map(record => ({
          timestamp: record.timestamp,
          operation: record.operation,
          model_used: record.modelUsed,
          token_count: record.tokenCount,
          processing_time: record.processingTime,
          confidence_before: record.confidenceBefore,
          confidence_after: record.confidenceAfter,
        })) || [],
        statistics: frontendNode.metadata.statistics ? {
          view_count: frontendNode.metadata.statistics.viewCount,
          edit_duration_total: frontendNode.metadata.statistics.editDurationTotal,
          ai_interactions: frontendNode.metadata.statistics.aiInteractions,
        } : {
          view_count: 0,
          edit_duration_total: 0,
          ai_interactions: 0,
        }
      },
      created_at: frontendNode.createdAt,
      updated_at: frontendNode.updatedAt,
      ai_generated: true // 假设所有节点都有AI参与
    }
  }

  /**
   * 将后端Node转换为前端AINode格式
   */
  static fromBackend(backendNode: BackendNode): AINode {
    // 安全地访问 metadata，提供默认值
    const metadata = backendNode.metadata || {}
    const semanticTypes = (metadata.semantic_types ?? metadata.semantic ?? []) as SemanticType[]
    const processingHistoryRaw = metadata.processing_history ?? metadata.processingHistory ?? []
    const statisticsRaw = metadata.statistics ?? (metadata as any).stats

    const editCountRaw = metadata.edit_count ?? metadata.editCount
    const lastEditReasonRaw = metadata.last_edit_reason ?? metadata.lastEditReason
    const userRatingRaw = metadata.user_rating ?? metadata.userRating
    const autoSavedRaw = metadata.auto_saved ?? metadata.autoSaved
    const lastModifiedRaw = metadata.last_modified ?? metadata.lastModified

    const normalizedProcessingHistory = Array.isArray(processingHistoryRaw)
      ? processingHistoryRaw.map((record: any) => {
          if (!record || typeof record !== 'object') {
            return record as ProcessingRecord
          }

          const timestampValue = record.timestamp ?? record.time
          const parsedTimestamp = timestampValue ? new Date(timestampValue) : undefined

          return {
            timestamp: parsedTimestamp && !isNaN(parsedTimestamp.getTime()) ? parsedTimestamp : new Date(),
            operation: record.operation,
            modelUsed: record.model_used ?? record.modelUsed,
            tokenCount: record.token_count ?? record.tokenCount,
            processingTime: record.processing_time ?? record.processingTime,
            confidenceBefore: record.confidence_before ?? record.confidenceBefore,
            confidenceAfter: record.confidence_after ?? record.confidenceAfter,
          }
        })
      : []

    const normalizedStatistics = statisticsRaw && typeof statisticsRaw === 'object'
      ? {
          viewCount: Number((statisticsRaw as any).view_count ?? (statisticsRaw as any).viewCount ?? 0),
          editDurationTotal: Number((statisticsRaw as any).edit_duration_total ?? (statisticsRaw as any).editDurationTotal ?? 0),
          aiInteractions: Number((statisticsRaw as any).ai_interactions ?? (statisticsRaw as any).aiInteractions ?? 0),
        }
      : undefined

    const normalizedUserRating = (() => {
      if (userRatingRaw === null || userRatingRaw === undefined || userRatingRaw === '') {
        return undefined
      }

      const value = typeof userRatingRaw === 'number' ? userRatingRaw : Number(userRatingRaw)
      return Number.isNaN(value) ? undefined : value
    })()

    const fallbackUpdatedAt = backendNode.updated_at ? new Date(backendNode.updated_at) : new Date()
    const lastModified = (() => {
      if (!lastModifiedRaw) return fallbackUpdatedAt

      if (lastModifiedRaw instanceof Date) {
        return lastModifiedRaw
      }

      if (typeof lastModifiedRaw === 'string') {
        const parsed = new Date(lastModifiedRaw)
        return isNaN(parsed.getTime()) ? fallbackUpdatedAt : parsed
      }

      if (typeof lastModifiedRaw === 'object') {
        const timestamp = (lastModifiedRaw as any).timestamp ?? (lastModifiedRaw as any).time ?? (lastModifiedRaw as any).date
        if (timestamp) {
          const parsed = new Date(timestamp)
          if (!isNaN(parsed.getTime())) {
            return parsed
          }
        }
      }

      return fallbackUpdatedAt
    })()

    // 确保 importance 是有效值
    const importance = this.normalizeImportance(backendNode.importance || 3)

    // 确保 confidence 是有效值
    const confidence = this.convertConfidenceFromBackend(
      typeof backendNode.confidence === 'number' && !isNaN(backendNode.confidence)
        ? backendNode.confidence
        : 50
    )

    // 确保 status 是有效值
    const validStatuses = ['idle', 'processing', 'completed', 'error'] as const
    const status = validStatuses.includes(backendNode.status as any)
      ? backendNode.status
      : 'idle'

    return {
      id: backendNode.id,
      content: backendNode.content || '',
      title: backendNode.title,
      importance,
      confidence,
      status,
      tags: Array.isArray(backendNode.tags) ? backendNode.tags : [],
      version: backendNode.version || 1,
      position: backendNode.position || { x: 0, y: 0 },
      size: backendNode.size,
      connections: [], // 连接关系需要单独处理
      semantic_type: Array.isArray(semanticTypes) && semanticTypes.length > 0 ? semanticTypes[0] : undefined,
      user_rating: normalizedUserRating,
      metadata: {
        semantic: Array.isArray(semanticTypes) ? semanticTypes : [],
        editCount: typeof editCountRaw === 'number' ? editCountRaw : Number(editCountRaw) || 0,
        lastEditReason: lastEditReasonRaw,
        userRating: normalizedUserRating,
        lastModified,
        autoSaved: Boolean(autoSavedRaw),
        processingHistory: normalizedProcessingHistory,
        statistics: normalizedStatistics
      },
      createdAt: backendNode.created_at ? new Date(backendNode.created_at) : new Date(),
      updatedAt: fallbackUpdatedAt
    }
  }

  /**
   * 转换置信度：前端0-1 → 后端0-100
   */
  private static convertConfidenceToBackend(confidence: number): number {
    // 如果值已经是0-100范围，直接返回
    if (confidence >= 0 && confidence <= 100 && confidence > 1) {
      return Math.round(confidence)
    }
    // 如果是0-1范围，转换为0-100
    return Math.round(confidence * 100)
  }

  /**
   * 转换置信度：后端0-100 → 前端0-100（保持一致）
   */
  private static convertConfidenceFromBackend(confidence: number): number {
    return Math.round(confidence)
  }

  /**
   * 验证语义类型是否有效
   */
  static isValidSemanticType(type: string): type is SemanticType {
    const validTypes: SemanticType[] = [
      'requirement', 'solution', 'plan', 'analysis', 'idea',
      'question', 'answer', 'decision', 'fusion', 'summary',
      'synthesis', 'comparison', 'fusion-error'
    ]
    return validTypes.includes(type as SemanticType)
  }

  /**
   * 规范化用户评分
   */
  static normalizeUserRating(rating: number | undefined): number | undefined {
    if (rating === undefined) return undefined
    return Math.max(0, Math.min(5, Math.round(rating)))
  }

  /**
   * 规范化重要性等级
   */
  static normalizeImportance(importance: number): 1 | 2 | 3 | 4 | 5 {
    const normalized = Math.max(1, Math.min(5, Math.round(importance)))
    return normalized as 1 | 2 | 3 | 4 | 5
  }

  /**
   * 批量转换前端节点数组
   */
  static batchToBackend(frontendNodes: AINode[]): Partial<BackendNode>[] {
    return frontendNodes.map(node => this.toBackend(node))
  }

  /**
   * 批量转换后端节点数组
   */
  static batchFromBackend(backendNodes: BackendNode[]): AINode[] {
    return backendNodes.map(node => this.fromBackend(node))
  }
}
