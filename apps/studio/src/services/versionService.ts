import type {
  AINode,
  NodeVersion,
  VersionChangeType
} from '@/types'

/**
 * 版本变更信息
 */
export interface VersionChangeInfo {
  reason: string
  type: VersionChangeType
  description?: string
  isExperimental?: boolean
}

/**
 * 版本比较结果
 */
export interface VersionDiff {
  nodeId: string
  fromVersion: number
  toVersion: number
  changes: {
    content?: {
      added: string[]
      removed: string[]
      modified: string[]
    }
    title?: {
      from: string
      to: string
    }
    confidence?: {
      from: number
      to: number
    }
    tags?: {
      added: string[]
      removed: string[]
    }
    semanticType?: {
      from: string | undefined
      to: string | undefined
    }
    userRating?: {
      from: number | undefined
      to: number | undefined
    }
  }
  summary: string
}

/**
 * 版本恢复选项
 */
export interface RestoreOptions {
  preserveConnections?: boolean // 是否保持连接关系
  updateTimestamp?: boolean // 是否更新时间戳
  createBackup?: boolean // 是否先备份当前版本
}

/**
 * 版本管理服务
 * 处理节点的版本历史、比较、回滚等功能
 */
class VersionService {
  private versions: Map<string, NodeVersion[]> = new Map() // nodeId -> versions
  private maxVersionsPerNode = 50 // 每个节点最多保留的版本数

  /**
   * 创建新版本
   */
  createVersion(node: AINode, changeInfo: VersionChangeInfo): NodeVersion {
    const versions = this.getNodeVersions(node.id)
    const newVersionNumber = versions.length + 1

    const newVersion: NodeVersion = {
      id: this.generateVersionId(),
      nodeId: node.id,
      version: newVersionNumber,
      content: node.content,
      confidence: node.confidence,
      changeReason: changeInfo.reason,
      changeType: changeInfo.type,
      createdAt: new Date(),
      createdBy: 'user', // 实际应用中应该是当前用户ID
      metadata: {
        diffSummary: this.generateDiffSummary(versions[versions.length - 1], node),
        processingInfo: {
          description: changeInfo.description,
          isExperimental: changeInfo.isExperimental || false
        },
        rollbackPoint: !changeInfo.isExperimental
      }
    }

    // 添加到版本历史
    versions.push(newVersion)

    // 如果版本过多，删除最旧的版本（保留rollbackPoint的版本）
    this.cleanupOldVersions(node.id)

    this.versions.set(node.id, versions)
    return newVersion
  }

  /**
   * 获取节点的版本历史
   */
  getVersionHistory(nodeId: string): NodeVersion[] {
    return this.getNodeVersions(nodeId)
  }

  /**
   * 获取指定版本
   */
  getVersion(nodeId: string, version: number): NodeVersion | undefined {
    const versions = this.getNodeVersions(nodeId)
    return versions.find(v => v.version === version)
  }

  /**
   * 比较两个版本
   */
  compareVersions(nodeId: string, fromVersion: number, toVersion: number): VersionDiff | null {
    const versions = this.getNodeVersions(nodeId)
    const from = versions.find(v => v.version === fromVersion)
    const to = versions.find(v => v.version === toVersion)

    if (!from || !to) {
      return null
    }

    return this.generateVersionDiff(nodeId, from, to)
  }

  /**
   * 回滚到指定版本
   */
  rollbackToVersion(node: AINode, targetVersion: number, options: RestoreOptions = {}): AINode | null {
    const versions = this.getNodeVersions(node.id)
    const targetVersionData = versions.find(v => v.version === targetVersion)

    if (!targetVersionData) {
      return null
    }

    // 先创建当前版本的备份（如果开启）
    if (options.createBackup) {
      this.createVersion(node, {
        reason: `回滚到版本 ${targetVersion} 前的自动备份`,
        type: 'rollback',
        description: '自动创建的回滚前备份'
      })
    }

    // 创建回滚后的新节点
    const rolledBackNode: AINode = {
      ...node,
      content: targetVersionData.content,
      confidence: targetVersionData.confidence,
      version: node.version + 1,
      updatedAt: options.updateTimestamp ? new Date() : node.updatedAt,
      metadata: {
        ...node.metadata,
        editCount: node.metadata.editCount + 1,
        lastEditReason: `回滚到版本 ${targetVersion}`
      }
    }

    // 如果不保持连接关系，清空连接
    if (!options.preserveConnections) {
      rolledBackNode.connections = []
    }

    // 记录回滚操作
    this.createVersion(rolledBackNode, {
      reason: `回滚到版本 ${targetVersion}`,
      type: 'rollback',
      description: `从版本 ${node.version} 回滚到版本 ${targetVersion}`
    })

    return rolledBackNode
  }

  /**
   * 获取版本统计信息
   */
  getVersionStats(nodeId: string) {
    const versions = this.getNodeVersions(nodeId)

    if (versions.length === 0) {
      return null
    }

    const changeTypes = versions.reduce((acc, v) => {
      acc[v.changeType] = (acc[v.changeType] || 0) + 1
      return acc
    }, {} as Record<VersionChangeType, number>)

    const confidenceHistory = versions.map(v => ({
      version: v.version,
      confidence: v.confidence,
      date: v.createdAt
    }))

    return {
      totalVersions: versions.length,
      changeTypes,
      confidenceHistory,
      firstCreated: versions[0]?.createdAt,
      lastModified: versions[versions.length - 1]?.createdAt,
      rollbackPoints: versions.filter(v => v.metadata.rollbackPoint).length
    }
  }

  /**
   * 搜索版本历史
   */
  searchVersions(nodeId: string, query: string): NodeVersion[] {
    const versions = this.getNodeVersions(nodeId)
    const lowerQuery = query.toLowerCase()

    return versions.filter(version =>
      version.content.toLowerCase().includes(lowerQuery) ||
      version.changeReason?.toLowerCase().includes(lowerQuery) ||
      version.changeType.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 导出版本历史
   */
  exportVersionHistory(nodeId: string) {
    const versions = this.getVersionHistory(nodeId)
    const stats = this.getVersionStats(nodeId)

    return {
      nodeId,
      exportDate: new Date(),
      versions,
      statistics: stats,
      summary: {
        totalVersions: versions.length,
        timeSpan: stats?.lastModified && stats?.firstCreated
          ? stats.lastModified.getTime() - stats.firstCreated.getTime()
          : 0
      }
    }
  }

  /**
   * 清理版本历史
   */
  cleanupVersionHistory(nodeId: string, keepCount: number = this.maxVersionsPerNode): number {
    const versions = this.getNodeVersions(nodeId)
    if (versions.length <= keepCount) {
      return 0
    }

    // 按优先级排序：rollbackPoint > 最新版本 > 创建时间
    const sortedVersions = [...versions].sort((a, b) => {
      // rollbackPoint优先级最高
      if (a.metadata.rollbackPoint && !b.metadata.rollbackPoint) return -1
      if (!a.metadata.rollbackPoint && b.metadata.rollbackPoint) return 1

      // 按创建时间降序（最新的优先保留）
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    const versionsToKeep = sortedVersions.slice(0, keepCount)
    const removedCount = versions.length - keepCount

    this.versions.set(nodeId, versionsToKeep)
    return removedCount
  }

  // 私有方法

  /**
   * 获取节点的版本列表
   */
  private getNodeVersions(nodeId: string): NodeVersion[] {
    return this.versions.get(nodeId) || []
  }

  /**
   * 生成版本差异摘要
   */
  private generateDiffSummary(previousVersion: NodeVersion | undefined, currentNode: AINode): string {
    if (!previousVersion) {
      return '初始版本'
    }

    const changes: string[] = []

    // 内容变化
    if (previousVersion.content !== currentNode.content) {
      const prevLength = previousVersion.content.length
      const currLength = currentNode.content.length
      const diff = currLength - prevLength

      if (diff > 0) {
        changes.push(`内容增加${diff}字符`)
      } else if (diff < 0) {
        changes.push(`内容减少${Math.abs(diff)}字符`)
      } else {
        changes.push('内容修改')
      }
    }

    // 置信度变化
    if (previousVersion.confidence !== currentNode.confidence) {
      const confidenceDiff = currentNode.confidence - previousVersion.confidence
      changes.push(`置信度${confidenceDiff > 0 ? '提高' : '降低'}${Math.abs(confidenceDiff)}%`)
    }

    return changes.length > 0 ? changes.join('，') : '无明显变化'
  }

  /**
   * 生成详细的版本差异对比
   */
  private generateVersionDiff(nodeId: string, from: NodeVersion, to: NodeVersion): VersionDiff {
    const changes: VersionDiff['changes'] = {}

    // 内容差异
    if (from.content !== to.content) {
      changes.content = this.generateContentDiff(from.content, to.content)
    }

    // 置信度差异
    if (from.confidence !== to.confidence) {
      changes.confidence = {
        from: from.confidence,
        to: to.confidence
      }
    }

    const summary = this.generateDiffSummary(from, {
      content: to.content,
      confidence: to.confidence
    } as AINode)

    return {
      nodeId,
      fromVersion: from.version,
      toVersion: to.version,
      changes,
      summary
    }
  }

  /**
   * 生成内容文本差异
   */
  private generateContentDiff(from: string, to: string): {
    added: string[]
    removed: string[]
    modified: string[]
  } {
    // 简化的差异算法，实际应用中可以使用更精确的diff算法
    const fromLines = from.split('\n')
    const toLines = to.split('\n')

    const added: string[] = []
    const removed: string[] = []
    const modified: string[] = []

    // 简单的行级别比较
    const maxLines = Math.max(fromLines.length, toLines.length)

    for (let i = 0; i < maxLines; i++) {
      const fromLine = fromLines[i]
      const toLine = toLines[i]

      if (fromLine === undefined) {
        added.push(toLine)
      } else if (toLine === undefined) {
        removed.push(fromLine)
      } else if (fromLine !== toLine) {
        modified.push(`${fromLine} → ${toLine}`)
      }
    }

    return { added, removed, modified }
  }

  /**
   * 清理旧版本
   */
  private cleanupOldVersions(nodeId: string): void {
    const versions = this.getNodeVersions(nodeId)
    if (versions.length <= this.maxVersionsPerNode) {
      return
    }

    // 保留最近的版本和所有rollbackPoint
    const versionsToKeep = versions.filter((version, index) => {
      const isRecent = index >= versions.length - this.maxVersionsPerNode / 2
      const isRollbackPoint = version.metadata.rollbackPoint
      return isRecent || isRollbackPoint
    })

    this.versions.set(nodeId, versionsToKeep)
  }

  /**
   * 生成版本ID
   */
  private generateVersionId(): string {
    return `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 单例实例
export const versionService = new VersionService()

// 导出类型和服务
export { VersionService }
// export type { VersionChangeInfo, VersionDiff, RestoreOptions }