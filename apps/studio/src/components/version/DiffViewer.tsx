import React, { useState, useEffect } from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { nodeAPIService } from '@/services/nodeApiService'
import { Spinner } from '@/components/ui'

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
  const [fromVersionData, setFromVersionData] = useState<any | null>(null)
  const [toVersionData, setToVersionData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [splitView, setSplitView] = useState(true)

  useEffect(() => {
    loadVersions()
  }, [nodeId, fromVersion, toVersion])

  const loadVersions = async () => {
    try {
      setLoading(true)
      setError(null)

      // 并行加载两个版本
      const versions = await nodeAPIService.getNodeVersions(nodeId, 100)
      const fromVer = versions.find((v: any) => v.version_number === fromVersion)
      const toVer = versions.find((v: any) => v.version_number === toVersion)

      if (!fromVer || !toVer) {
        throw new Error('无法找到指定版本')
      }

      setFromVersionData(fromVer)
      setToVersionData(toVer)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载版本失败')
      console.error('加载版本差异失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 计算统计信息
  const stats = React.useMemo(() => {
    if (!fromVersionData || !toVersionData) return null

    const oldLines = fromVersionData.content?.split('\n') || []
    const newLines = toVersionData.content?.split('\n') || []
    const added = Math.max(0, newLines.length - oldLines.length)
    const removed = Math.max(0, oldLines.length - newLines.length)

    return { added, removed, total: Math.abs(added + removed) }
  }, [fromVersionData, toVersionData])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg flex items-center gap-3">
          <Spinner size="lg" />
          <span className="text-gray-500">加载版本差异中...</span>
        </div>
      </div>
    )
  }

  if (error || !fromVersionData || !toVersionData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md">
          <div className="text-red-500 mb-4">❌ {error || '无法加载版本数据'}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full"
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
            {stats && (
              <div className="flex gap-3 text-sm">
                {stats.added > 0 && (
                  <span className="text-green-600">+{stats.added} 行</span>
                )}
                {stats.removed > 0 && (
                  <span className="text-red-600">-{stats.removed} 行</span>
                )}
              </div>
            )}
            <button
              onClick={() => setSplitView(!splitView)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {splitView ? '并排对比' : '内联对比'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容差异 */}
        <div className="flex-1 overflow-auto">
          <ReactDiffViewer
            oldValue={fromVersionData.content || ''}
            newValue={toVersionData.content || ''}
            splitView={splitView}
            compareMethod={DiffMethod.WORDS}
            leftTitle={`版本 ${fromVersion}${fromVersionData.change_description ? ` (${fromVersionData.change_description})` : ''}`}
            rightTitle={`版本 ${toVersion}${toVersionData.change_description ? ` (${toVersionData.change_description})` : ''}`}
            useDarkTheme={false}
            showDiffOnly={false}
            styles={{
              variables: {
                light: {
                  diffViewerBackground: '#ffffff',
                  diffViewerColor: '#1f2937',
                  addedBackground: '#d1fae5',
                  addedColor: '#065f46',
                  removedBackground: '#fee2e2',
                  removedColor: '#991b1b',
                  wordAddedBackground: '#86efac',
                  wordRemovedBackground: '#fca5a5',
                  addedGutterBackground: '#bbf7d0',
                  removedGutterBackground: '#fecaca',
                  gutterBackground: '#f9fafb',
                  gutterBackgroundDark: '#f3f4f6',
                  highlightBackground: '#fef3c7',
                  highlightGutterBackground: '#fde68a',
                  codeFoldGutterBackground: '#e5e7eb',
                  codeFoldBackground: '#f3f4f6',
                  emptyLineBackground: '#fafafa',
                  gutterColor: '#6b7280',
                  addedGutterColor: '#065f46',
                  removedGutterColor: '#991b1b',
                  codeFoldContentColor: '#6b7280',
                  diffViewerTitleBackground: '#f9fafb',
                  diffViewerTitleColor: '#1f2937',
                  diffViewerTitleBorderColor: '#e5e7eb',
                },
              },
              line: {
                padding: '10px',
                fontSize: '14px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              },
            }}
          />
        </div>

        {/* 底部操作栏 */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export { DiffViewer }