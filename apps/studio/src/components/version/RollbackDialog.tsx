import React, { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { nodeAPIService } from '@/services/nodeApiService'
import { useNodeStore } from '@/stores'

interface RollbackDialogProps {
  nodeId: string
  targetVersion: number
  currentVersion: number
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}

export const RollbackDialog: React.FC<RollbackDialogProps> = ({
  nodeId,
  targetVersion,
  currentVersion,
  onConfirm,
  onClose,
}) => {
  const { getNode } = useNodeStore()
  const [reason, setReason] = useState('')
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentNode = getNode(nodeId)

  const handleRollback = async () => {
    if (!reason.trim()) {
      setError('请输入回滚原因')
      return
    }

    try {
      setIsRollingBack(true)
      setError(null)

      await onConfirm(reason.trim())

      // 成功后关闭对话框
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '回滚失败')
    } finally {
      setIsRollingBack(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">确认版本回滚</h2>
            <p className="text-sm text-gray-600 mt-1">
              版本 {currentVersion} → 版本 {targetVersion}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isRollingBack}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* 警告信息 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800 mb-1">回滚操作说明</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 回滚将把节点内容恢复到版本 {targetVersion}</li>
                  <li>• 当前版本 {currentVersion} 的内容将被保存为新版本</li>
                  <li>• 此操作可以再次回滚</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 当前内容预览 */}
          {currentNode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前内容 (版本 {currentVersion})
              </label>
              <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {currentNode.content.substring(0, 200)}
                  {currentNode.content.length > 200 && '...'}
                </p>
              </div>
            </div>
          )}

          {/* 回滚原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              回滚原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
              placeholder="请说明回滚原因，例如：恢复之前的版本，当前版本内容有误"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isRollingBack}
            />
            {reason.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {reason.length} / 200 字符
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isRollingBack}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleRollback}
            disabled={isRollingBack || !reason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRollingBack && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isRollingBack ? '回滚中...' : '确认回滚'}
          </button>
        </div>
      </div>
    </div>
  )
}
