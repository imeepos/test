import React, { useState } from 'react'
import type { VersionChangeInfo, VersionChangeType } from '@/services/versionService'

interface ChangeDialogProps {
  currentContent?: string
  onConfirm: (changeInfo: VersionChangeInfo) => void
  onCancel: () => void
  title?: string
  mode?: 'create' | 'edit' | 'optimize'
}

const ChangeDialog: React.FC<ChangeDialogProps> = ({
  currentContent,
  onConfirm,
  onCancel,
  title = '记录变更信息',
  mode = 'edit'
}) => {
  const [changeReason, setChangeReason] = useState('')
  const [changeType, setChangeType] = useState<VersionChangeType>(mode === 'create' ? 'create' : 'edit')
  const [description, setDescription] = useState('')
  const [isExperimental, setIsExperimental] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const changeTypes: { value: VersionChangeType; label: string; description: string }[] = [
    {
      value: 'create',
      label: '创建',
      description: '创建新的内容或功能'
    },
    {
      value: 'edit',
      label: '编辑',
      description: '修改现有内容'
    },
    {
      value: 'optimize',
      label: '优化',
      description: '改进内容质量或结构'
    },
    {
      value: 'ai_enhance',
      label: 'AI增强',
      description: 'AI辅助改进内容'
    },
    {
      value: 'merge',
      label: '合并',
      description: '合并多个内容或想法'
    },
    {
      value: 'rollback',
      label: '回滚',
      description: '恢复到之前的版本'
    }
  ]

  const handleSubmit = async () => {
    if (!changeReason.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const changeInfo: VersionChangeInfo = {
        reason: changeReason.trim(),
        type: changeType,
        description: description.trim() || undefined,
        isExperimental
      }

      await onConfirm(changeInfo)
    } catch (error) {
      console.error('提交变更信息失败:', error)
    } finally {
      setIsSubmitting(false)
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 变更类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              变更类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {changeTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setChangeType(type.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    changeType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{getChangeTypeIcon(type.value)}</span>
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs opacity-75">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 变更原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              变更原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="请简要说明此次变更的原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isSubmitting}
            />
            {changeReason.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {changeReason.length} / 200 字符
              </div>
            )}
          </div>

          {/* 详细描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描述 <span className="text-gray-400">(可选)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可以提供更详细的变更说明..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          {/* 实验性标记 */}
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isExperimental}
                onChange={(e) => setIsExperimental(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  实验性变更
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  标记此变更为实验性的，不会作为稳定的回滚点
                </p>
              </div>
            </label>
          </div>

          {/* 当前内容预览 */}
          {currentContent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前内容预览
              </label>
              <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {currentContent.length > 300
                    ? currentContent.slice(0, 300) + '...'
                    : currentContent
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!changeReason.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSubmitting ? '保存中...' : '确认变更'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { ChangeDialog }