import React, { useState, useEffect } from 'react'
import { versionService, type VersionDiff } from '@/services/versionService'

interface DiffViewerProps {
  nodeId: string
  fromVersion: number
  toVersion: number
  onClose: () => void
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  nodeId,
  fromVersion,
  toVersion,
  onClose
}) => {
  const [diff, setDiff] = useState<VersionDiff | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side')

  useEffect(() => {
    loadDiff()
  }, [nodeId, fromVersion, toVersion])

  const loadDiff = async () => {
    try {
      setLoading(true)
      const diffResult = versionService.compareVersions(nodeId, fromVersion, toVersion)
      setDiff(diffResult)
    } catch (error) {
      console.error('加载版本差异失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderContentDiff = () => {
    if (!diff?.changes.content) {
      return <div className="text-gray-500">内容无变化</div>
    }

    const { added, removed, modified } = diff.changes.content

    return (
      <div className="space-y-4">
        {/* 新增内容 */}
        {added.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">
              ✅ 新增内容 ({added.length} 行)
            </h4>
            <div className="space-y-1">
              {added.map((line, index) => (
                <div key={index} className="text-green-700 text-sm font-mono bg-green-100 px-2 py-1 rounded">
                  + {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 删除内容 */}
        {removed.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">
              ❌ 删除内容 ({removed.length} 行)
            </h4>
            <div className="space-y-1">
              {removed.map((line, index) => (
                <div key={index} className="text-red-700 text-sm font-mono bg-red-100 px-2 py-1 rounded">
                  - {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 修改内容 */}
        {modified.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">
              🔄 修改内容 ({modified.length} 行)
            </h4>
            <div className="space-y-1">
              {modified.map((line, index) => (
                <div key={index} className="text-blue-700 text-sm font-mono bg-blue-100 px-2 py-1 rounded">
                  ~ {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMetadataDiff = () => {
    if (!diff?.changes) return null

    const changes = diff.changes
    const hasMetadataChanges = changes.title || changes.confidence || changes.tags || changes.semanticType || changes.userRating

    if (!hasMetadataChanges) {
      return <div className="text-gray-500">元数据无变化</div>
    }

    return (
      <div className="space-y-3">
        {/* 标题变化 */}
        {changes.title && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">标题:</span>
            <div className="flex items-center gap-2">
              <span className="text-red-600 line-through">{changes.title.from}</span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600">{changes.title.to}</span>
            </div>
          </div>
        )}

        {/* 置信度变化 */}
        {changes.confidence && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">置信度:</span>
            <div className="flex items-center gap-2">
              <span className="text-red-600">{changes.confidence.from}%</span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600">{changes.confidence.to}%</span>
              <span className={`text-sm ${
                changes.confidence.to > changes.confidence.from
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                ({changes.confidence.to > changes.confidence.from ? '+' : ''}
                {changes.confidence.to - changes.confidence.from}%)
              </span>
            </div>
          </div>
        )}

        {/* 标签变化 */}
        {changes.tags && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700 block mb-2">标签变化:</span>
            <div className="space-y-2">
              {changes.tags.added.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm text-green-600">新增:</span>
                  {changes.tags.added.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      + {tag}
                    </span>
                  ))}
                </div>
              )}
              {changes.tags.removed.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm text-red-600">删除:</span>
                  {changes.tags.removed.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      - {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 语义类型变化 */}
        {changes.semanticType && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">语义类型:</span>
            <div className="flex items-center gap-2">
              <span className="text-red-600">{changes.semanticType.from || '无'}</span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600">{changes.semanticType.to || '无'}</span>
            </div>
          </div>
        )}

        {/* 用户评分变化 */}
        {changes.userRating && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">用户评分:</span>
            <div className="flex items-center gap-2">
              <span className="text-red-600">{changes.userRating.from || '无评分'}</span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600">{changes.userRating.to || '无评分'}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="text-gray-500">加载版本差异中...</div>
        </div>
      </div>
    )
  }

  if (!diff) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="text-gray-500 mb-4">无法加载版本差异</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            关闭
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">版本差异对比</h2>
            <p className="text-sm text-gray-600 mt-1">
              版本 {fromVersion} → 版本 {toVersion}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="side-by-side">并排对比</option>
              <option value="unified">统一视图</option>
            </select>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-auto p-6">
          {/* 摘要 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">变更摘要</h3>
            <p className="text-blue-700">{diff.summary}</p>
          </div>

          {/* 标签页切换 */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button className="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
                  内容变化
                </button>
                <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  元数据变化
                </button>
              </nav>
            </div>
          </div>

          {/* 具体差异内容 */}
          <div className="space-y-6">
            {/* 内容差异 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">内容差异</h3>
              {renderContentDiff()}
            </div>

            {/* 元数据差异 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">元数据差异</h3>
              {renderMetadataDiff()}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            关闭
          </button>
          <button
            onClick={() => {
              // 导出差异报告的逻辑
              const report = {
                nodeId: diff.nodeId,
                comparison: `${fromVersion} → ${toVersion}`,
                summary: diff.summary,
                changes: diff.changes,
                exportTime: new Date()
              }

              const blob = new Blob([JSON.stringify(report, null, 2)], {
                type: 'application/json'
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `version-diff-${fromVersion}-${toVersion}.json`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            导出差异报告
          </button>
        </div>
      </div>
    </div>
  )
}

export { DiffViewer }