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
  MousePointer2 
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useCanvasStore, useUIStore } from '@/stores'
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
  } = useUIStore()

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

  // 格式化缩放显示
  const zoomPercentage = Math.round((viewport?.zoom ?? 1) * 100)

  return (
    <motion.div
      className="fixed top-4 right-4 z-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="toolbar"
      aria-label="画布控制工具栏"
    >
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