import type { AINode, ImportanceLevel } from '@/types'

/**
 * 根据重要性等级获取颜色
 */
export function getImportanceColor(importance: ImportanceLevel): string {
  const colors = {
    1: 'text-gray-400',
    2: 'text-blue-400',
    3: 'text-green-400',
    4: 'text-yellow-400',
    5: 'text-red-400'
  }
  return colors[importance]
}

/**
 * 根据重要性等级获取背景色
 */
export function getImportanceBackground(importance: ImportanceLevel): string {
  const colors = {
    1: 'bg-gray-50',
    2: 'bg-blue-50',
    3: 'bg-green-50',
    4: 'bg-yellow-50',
    5: 'bg-red-50'
  }
  return colors[importance]
}

/**
 * 根据置信度获取颜色
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-500'
  if (confidence >= 0.6) return 'text-yellow-500'
  if (confidence >= 0.4) return 'text-orange-500'
  return 'text-red-500'
}

/**
 * 格式化置信度显示
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

/**
 * 生成节点摘要
 */
export function generateNodeSummary(node: AINode, maxLength: number = 100): string {
  if (!node.content) return node.title || '空节点'

  const text = node.content.replace(/[#*`\n]/g, ' ').trim()
  if (text.length <= maxLength) return text

  return text.slice(0, maxLength - 3) + '...'
}

/**
 * 验证节点数据完整性
 */
export function validateNodeData(node: Partial<AINode>): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // 必填字段验证
  if (!node.id) errors.push('节点ID不能为空')
  if (!node.position) errors.push('节点位置信息缺失')
  if (node.content === undefined) errors.push('节点内容不能为undefined')

  // 数据类型验证
  if (node.importance && (node.importance < 1 || node.importance > 5)) {
    errors.push('重要性等级必须在1-5之间')
  }
  if (node.confidence !== undefined && (node.confidence < 0 || node.confidence > 1)) {
    errors.push('置信度必须在0-1之间')
  }

  // 数据长度验证
  if (node.content && node.content.length > 10000) {
    errors.push('节点内容过长（最大10000字符）')
  }
  if (node.title && node.title.length > 100) {
    warnings.push('节点标题过长，建议控制在100字符以内')
  }

  // 标签验证
  if (node.tags && node.tags.length > 20) {
    warnings.push('标签数量过多，建议控制在20个以内')
  }

  // 内容质量警告
  if (node.content && node.content.trim().length === 0) {
    warnings.push('节点内容为空')
  }
  if (!node.title && node.content) {
    warnings.push('建议为节点添加标题')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 计算节点之间的相似度
 */
export function calculateNodeSimilarity(node1: AINode, node2: AINode): number {
  let similarity = 0
  let factors = 0

  // 标签相似度 (权重: 40%)
  if (node1.tags.length > 0 && node2.tags.length > 0) {
    const commonTags = node1.tags.filter(tag => node2.tags.includes(tag))
    const allTags = Array.from(new Set([...node1.tags, ...node2.tags]))
    similarity += (commonTags.length / allTags.length) * 0.4
    factors += 0.4
  }

  // 重要性相似度 (权重: 20%)
  const importanceDiff = Math.abs(node1.importance - node2.importance)
  similarity += (1 - importanceDiff / 4) * 0.2
  factors += 0.2

  // 置信度相似度 (权重: 20%)
  const confidenceDiff = Math.abs(node1.confidence - node2.confidence)
  similarity += (1 - confidenceDiff) * 0.2
  factors += 0.2

  // 内容相似度 (简单的关键词匹配) (权重: 20%)
  if (node1.content && node2.content) {
    const words1 = node1.content.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const words2 = node2.content.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const commonWords = words1.filter(word => words2.includes(word))
    const allWords = Array.from(new Set([...words1, ...words2]))

    if (allWords.length > 0) {
      similarity += (commonWords.length / allWords.length) * 0.2
      factors += 0.2
    }
  }

  return factors > 0 ? similarity / factors : 0
}

/**
 * 搜索节点
 */
export function searchNodes(nodes: AINode[], query: string): AINode[] {
  if (!query.trim()) return nodes

  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)

  return nodes.filter(node => {
    const searchText = [
      node.title || '',
      node.content,
      ...node.tags,
      ...node.metadata.semantic
    ].join(' ').toLowerCase()

    return searchTerms.every(term => searchText.includes(term))
  })
}

/**
 * 按多个条件筛选节点
 */
export function filterNodes(nodes: AINode[], filters: {
  importance?: ImportanceLevel[]
  tags?: string[]
  status?: string[]
  confidence?: { min?: number; max?: number }
  dateRange?: { start?: Date; end?: Date }
}): AINode[] {
  return nodes.filter(node => {
    // 重要性筛选
    if (filters.importance && !filters.importance.includes(node.importance)) {
      return false
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      const hasRequiredTag = filters.tags.some(tag => node.tags.includes(tag))
      if (!hasRequiredTag) return false
    }

    // 状态筛选
    if (filters.status && !filters.status.includes(node.status)) {
      return false
    }

    // 置信度筛选
    if (filters.confidence) {
      if (filters.confidence.min !== undefined && node.confidence < filters.confidence.min) {
        return false
      }
      if (filters.confidence.max !== undefined && node.confidence > filters.confidence.max) {
        return false
      }
    }

    // 日期范围筛选
    if (filters.dateRange) {
      const nodeDate = new Date(node.updatedAt)
      if (filters.dateRange.start && nodeDate < filters.dateRange.start) {
        return false
      }
      if (filters.dateRange.end && nodeDate > filters.dateRange.end) {
        return false
      }
    }

    return true
  })
}

/**
 * 排序节点
 */
export function sortNodes(
  nodes: AINode[],
  sortBy: 'importance' | 'confidence' | 'created' | 'updated' | 'title',
  order: 'asc' | 'desc' = 'desc'
): AINode[] {
  return [...nodes].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'importance':
        comparison = a.importance - b.importance
        break
      case 'confidence':
        comparison = a.confidence - b.confidence
        break
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'updated':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '')
        break
    }

    return order === 'desc' ? -comparison : comparison
  })
}

/**
 * 提取节点中的关键词
 */
export function extractKeywords(node: AINode, maxKeywords: number = 5): string[] {
  const text = `${node.title || ''} ${node.content}`.toLowerCase()

  // 简单的关键词提取（实际应用中可能需要更复杂的NLP算法）
  const words = text
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)

  // 统计词频
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 排序并返回前N个关键词
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word)
}