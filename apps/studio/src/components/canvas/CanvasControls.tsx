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
      className="fixed bottom-4 right-4 z-10 flex flex-col gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="toolbar"
      aria-label="画布控制工具栏"
    >
      {/* 缩放控制组 */}
      <div className="flex flex-col gap-1 p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg"
           role="group"
           aria-label="缩放控制">
        <Button
          variant="ghost"
          size="sm"
          icon={ZoomIn}
          onClick={handleZoomIn}
          disabled={(viewport?.zoom ?? 1) >= 2}
          className={`h-8 w-8 p-0 ${(viewport?.zoom ?? 1) >= 2 ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="放大 (Ctrl + +)"
          aria-label="放大画布"
        />
        
        <div className="text-xs text-center text-sidebar-text-muted py-1 min-w-[3rem]">
          {zoomPercentage}%
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          icon={ZoomOut}
          onClick={handleZoomOut}
          disabled={(viewport?.zoom ?? 1) <= 0.1}
          className={`h-8 w-8 p-0 ${(viewport?.zoom ?? 1) <= 0.1 ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="缩小 (Ctrl + -)"
          aria-label="缩小画布"
        />
      </div>

      {/* 视图控制组 */}
      <div className="flex flex-col gap-1 p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          onClick={handleResetZoom}
          className="h-8 w-8 p-0"
          title="重置缩放 (Ctrl + 0)"
        />
        
        <Button
          variant="ghost"
          size="sm"
          icon={MousePointer2}
          onClick={handleFitView}
          className="h-8 w-8 p-0"
          title="适应画布 (Ctrl + 1)"
        />
      </div>

      {/* 显示选项组 */}
      <div className="flex flex-col gap-1 p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          icon={Eye}
          onClick={handleViewModeToggle}
          className={`h-8 w-8 p-0 ${viewMode === 'detail' ? 'bg-sidebar-accent/20 text-sidebar-accent' : ''}`}
          title={`切换到${viewMode === 'preview' ? '详细' : '预览'}模式 (Tab)`}
        />
        
        <Button
          variant="ghost"
          size="sm"
          icon={Grid}
          onClick={handleGridToggle}
          className={`h-8 w-8 p-0 ${preferences.showGrid ? 'bg-sidebar-accent/20 text-sidebar-accent' : ''}`}
          title="显示/隐藏网格 (G)"
        />
        
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