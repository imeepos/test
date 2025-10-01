import React, { useState, useEffect } from 'react'
import type { NodeVersion, VersionChangeType } from '@/types'
import { nodeAPIService } from '@/services/nodeApiService'
import { DiffViewer } from './DiffViewer'
import { RollbackDialog } from './RollbackDialog'
import { Spinner } from '@/components/ui'

interface VersionHistoryProps {
  nodeId: string
  currentVersion: number
  onVersionRestore?: (version: number) => void
  onClose?: () => void
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  nodeId,
  currentVersion,
  onVersionRestore,
  onClose
}) => {
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null)
  const [showDiffViewer, setShowDiffViewer] = useState(false)
  const [rollbackTarget, setRollbackTarget] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const limit = 10

  useEffect(() => {
    loadVersionHistory()
  }, [nodeId])

  const loadVersionHistory = async (append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      }

      const loadedVersions = await nodeAPIService.getNodeVersions(nodeId, append ? page * limit : limit)

      if (append) {
        setVersions(prev => [...prev, ...loadedVersions])
      } else {
        setVersions(loadedVersions)
      }

      setHasMore(loadedVersions.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载版本历史失败')
      console.error('加载版本历史失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    loadVersionHistory(true)
  }

  const handleVersionCompare = (fromVersion: number, toVersion: number) => {
    setSelectedVersions([fromVersion, toVersion])
    setShowDiffViewer(true)
  }

  const handleVersionRestore = (version: number) => {
    setRollbackTarget(version)
  }

  const handleConfirmRollback = async (reason: string) => {
    if (!rollbackTarget) return

    try {
      await nodeAPIService.rollbackNode(nodeId, rollbackTarget, reason)

      // 刷新版本历史
      await loadVersionHistory()

      // 通知父组件
      if (onVersionRestore) {
        onVersionRestore(rollbackTarget)
      }

      setRollbackTarget(null)
    } catch (err) {
      console.error('回滚失败:', err)
      throw err
    }
  }

  const getChangeTypeIcon = (type: VersionChangeType): string => {
    const icons: Record<VersionChangeType, string> = {
      create: '✨',
      edit: '✏️',
      optimize: '🔧',
      ai_enhance: '🤖',
      merge: '🔀',
      rollback: '↩️'
    }
    return icons[type] || '📝'
  }

  const getChangeTypeColor = (type: VersionChangeType): string => {
    const colors: Record<VersionChangeType, string> = {
      create: 'text-green-600',
      edit: 'text-blue-600',
      optimize: 'text-purple-600',
      ai_enhance: 'text-orange-600',
      merge: 'text-teal-600',
      rollback: 'text-red-600'
    }
    return colors[type] || 'text-gray-600'
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date))
  }

  const filteredVersions = versions.filter(version =>
    searchQuery === '' ||
    version.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    version.changeReason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    version.changeType.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && versions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">加载版本历史中...</span>
      </div>
    )
  }

  if (error && versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-500 mb-4">❌ {error}</div>
        <button
          onClick={() => loadVersionHistory()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="version-history bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">版本历史</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="搜索版本..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 版本列表 */}
      <div className="p-6">
        {filteredVersions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchQuery ? '没有找到匹配的版本' : '暂无版本历史'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVersions.map((version, index) => (
              <div
                key={version.id}
                className={`border rounded-lg p-4 ${
                  version.version === currentVersion
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                } transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 版本信息 */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">
                        {getChangeTypeIcon(version.changeType)}
                      </span>
                      <div>
                        <span className="font-medium text-gray-900">
                          版本 {version.version}
                        </span>
                        {version.version === currentVersion && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            当前版本
                          </span>
                        )}
                        {version.metadata.rollbackPoint && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            回滚点
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 变更信息 */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className={getChangeTypeColor(version.changeType)}>
                          {version.changeType}
                        </span>
                        <span>•</span>
                        <span>{formatDate(version.createdAt)}</span>
                        <span>•</span>
                        <span>置信度: {version.confidence}%</span>
                      </div>
                      {version.changeReason && (
                        <div className="mt-2 text-sm text-gray-700">
                          📝 {version.changeReason}
                        </div>
                      )}
                      {version.metadata.diffSummary && (
                        <div className="mt-1 text-xs text-gray-500">
                          {version.metadata.diffSummary}
                        </div>
                      )}
                    </div>

                    {/* 内容预览 */}
                    <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                      <div className="line-clamp-3">
                        {version.content.slice(0, 200)}
                        {version.content.length > 200 && '...'}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-2 ml-4">
                    {version.version !== currentVersion && (
                      <button
                        onClick={() => handleVersionRestore(version.version)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        回滚到此版本
                      </button>
                    )}

                    {index < filteredVersions.length - 1 && (
                      <button
                        onClick={() =>
                          handleVersionCompare(
                            filteredVersions[index + 1].version,
                            version.version
                          )
                        }
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        与上版本对比
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 加载更多按钮 */}
      {hasMore && filteredVersions.length > 0 && (
        <div className="px-6 pb-6">
          <button
            onClick={handleLoadMore}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            加载更多版本...
          </button>
        </div>
      )}

      {/* 版本统计 */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>共 {versions.length} 个版本{hasMore ? '+' : ''}</span>
          <div className="flex gap-4">
            <span>创建: {versions.filter(v => v.change_type === 'create' || v.changeType === 'create').length}</span>
            <span>编辑: {versions.filter(v => v.change_type === 'edit' || v.changeType === 'edit').length}</span>
            <span>优化: {versions.filter(v => v.change_type === 'optimize' || v.changeType === 'optimize').length}</span>
            <span>回滚: {versions.filter(v => v.change_type === 'rollback' || v.changeType === 'rollback').length}</span>
          </div>
        </div>
      </div>

      {/* 差异查看器 */}
      {showDiffViewer && selectedVersions && (
        <DiffViewer
          nodeId={nodeId}
          fromVersion={selectedVersions[0]}
          toVersion={selectedVersions[1]}
          onClose={() => setShowDiffViewer(false)}
        />
      )}

      {/* 回滚确认对话框 */}
      {rollbackTarget !== null && (
        <RollbackDialog
          nodeId={nodeId}
          targetVersion={rollbackTarget}
          currentVersion={currentVersion}
          onConfirm={handleConfirmRollback}
          onClose={() => setRollbackTarget(null)}
        />
      )}
    </div>
  )
}

export { VersionHistory }