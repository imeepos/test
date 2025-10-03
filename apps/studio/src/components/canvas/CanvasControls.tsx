import React from 'react'
import { motion } from 'framer-motion'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Eye,
  Grid,
  RotateCcw,
  MousePointer2,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useCanvasStore, useUIStore, useNodeStore } from '@/stores'
import type { ViewMode } from '@/types'

export interface CanvasControlsProps {
  onFitView?: () => void
  onResetZoom?: () => void
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  onFitView,
  onResetZoom,
}) => {
  const {
    viewport,
    viewMode,
    setViewMode,
    isFullscreen,
    setFullscreen,
    zoomIn,
    zoomOut,
    resetZoom,
    fitView,
  } = useCanvasStore()

  const {
    preferences,
    updatePreferences,
    addToast,
  } = useUIStore()

  const { deleteErrorNodes, getNodeStats } = useNodeStore()

  // 视图模式切换
  const handleViewModeToggle = () => {
    const newMode: ViewMode = viewMode === 'preview' ? 'detail' : 'preview'
    setViewMode(newMode)
  }

  // 网格显示切换
  const handleGridToggle = () => {
    updatePreferences({ showGrid: !preferences.showGrid })
  }

  // 全屏切换
  const handleFullscreenToggle = () => {
    setFullscreen(!isFullscreen)
    
    if (!isFullscreen) {
      // 进入全屏
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // 缩放处理
  const handleZoomIn = () => {
    zoomIn()
  }

  const handleZoomOut = () => {
    zoomOut()
  }

  const handleResetZoom = () => {
    if (onResetZoom) {
      onResetZoom()
    } else {
      resetZoom()
    }
  }

  const handleFitView = () => {
    if (onFitView) {
      onFitView()
    } else {
      fitView()
    }
  }

  // 删除失败节点
  const handleDeleteErrorNodes = async () => {
    const stats = getNodeStats()
    const errorCount = stats.byStatus['error'] || 0

    if (errorCount === 0) {
      addToast({
        title: '无失败节点',
        message: '当前没有失败的节点',
        type: 'info'
      })
      return
    }

    try {
      await deleteErrorNodes()
      addToast({
        title: '删除成功',
        message: `已删除 ${errorCount} 个失败节点`,
        type: 'success'
      })
    } catch (error) {
      addToast({
        title: '删除失败',
        message: '删除失败节点时出错',
        type: 'error'
      })
    }
  }

  // 格式化缩放显示
  const zoomPercentage = Math.round((viewport?.zoom ?? 1) * 100)

  return (
    <motion.div
      className="fixed top-4 right-4 z-10 flex gap-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="toolbar"
      aria-label="画布控制工具栏"
    >
      {/* 删除失败节点按钮 */}
      <div className="p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          onClick={handleDeleteErrorNodes}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          title="删除所有失败的节点"
        />
      </div>

      {/* 全屏按钮 */}
      <div className="p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          icon={isFullscreen ? Minimize : Maximize}
          onClick={handleFullscreenToggle}
          className="h-8 w-8 p-0"
          title={`${isFullscreen ? '退出' : '进入'}全屏 (F11)`}
        />
      </div>
    </motion.div>
  )
}

export { CanvasControls }