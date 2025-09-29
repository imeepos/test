import React from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Eye, Grid } from 'lucide-react'
import { Button } from '@/components/ui'
import { useCanvasStore, useUIStore } from '@/stores'

const ZoomIndicator: React.FC = () => {
  const {
    viewport,
    viewMode,
    setViewMode,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvasStore()

  const { 
    preferences, 
    updatePreferences 
  } = useUIStore()

  // 格式化缩放百分比
  const zoomPercentage = Math.round(viewport.zoom * 100)

  // 获取缩放等级描述
  const getZoomLevel = () => {
    if (viewport.zoom <= 0.25) return '很远'
    if (viewport.zoom <= 0.5) return '远'
    if (viewport.zoom <= 0.75) return '中远'
    if (viewport.zoom <= 1.25) return '正常'
    if (viewport.zoom <= 1.5) return '近'
    return '很近'
  }

  // 缩放条的位置
  const zoomBarPosition = React.useMemo(() => {
    // 将缩放范围 0.1-2 映射到 0-100%
    const minZoom = 0.1
    const maxZoom = 2
    const normalizedZoom = (viewport.zoom - minZoom) / (maxZoom - minZoom)
    return Math.max(0, Math.min(100, normalizedZoom * 100))
  }, [viewport.zoom])

  const handleViewModeToggle = () => {
    setViewMode(viewMode === 'preview' ? 'detail' : 'preview')
  }

  const handleGridToggle = () => {
    updatePreferences({ showGrid: !preferences.showGrid })
  }

  return (
    <div className="space-y-3">
      {/* 缩放控制 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={ZoomOut}
          onClick={zoomOut}
          disabled={viewport.zoom <= 0.1}
          className="h-7 w-7 p-0"
          title="缩小"
        />
        
        <div className="flex-1 min-w-0">
          {/* 缩放条 */}
          <div className="relative h-2 bg-sidebar-border rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-sidebar-accent rounded-full"
              style={{ width: `${zoomBarPosition}%` }}
              transition={{ duration: 0.2 }}
            />
            {/* 1倍缩放标记 */}
            <div
              className="absolute top-0 h-full w-0.5 bg-sidebar-text-muted"
              style={{ left: '50%' }}
            />
          </div>
          
          {/* 缩放信息 */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-sidebar-text-muted">10%</span>
            <button
              onClick={resetZoom}
              className="text-xs font-medium text-sidebar-accent hover:text-sidebar-accent/80 transition-colors"
              title="重置缩放"
            >
              {zoomPercentage}%
            </button>
            <span className="text-xs text-sidebar-text-muted">200%</span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          icon={ZoomIn}
          onClick={zoomIn}
          disabled={viewport.zoom >= 2}
          className="h-7 w-7 p-0"
          title="放大"
        />
      </div>

      {/* 视图信息 */}
      <div className="flex items-center justify-between text-xs text-sidebar-text-muted">
        <span>视图: {getZoomLevel()}</span>
        <span>模式: {viewMode === 'preview' ? '预览' : '详细'}</span>
      </div>

      {/* 视图选项 */}
      <div className="flex gap-1">
        <Button
          variant={viewMode === 'detail' ? 'secondary' : 'ghost'}
          size="sm"
          icon={Eye}
          onClick={handleViewModeToggle}
          className="flex-1 h-8 text-xs"
        >
          {viewMode === 'preview' ? '详细模式' : '预览模式'}
        </Button>
        
        <Button
          variant={preferences.showGrid ? 'secondary' : 'ghost'}
          size="sm"
          icon={Grid}
          onClick={handleGridToggle}
          className="h-8 w-8 p-0"
          title={preferences.showGrid ? '隐藏网格' : '显示网格'}
        />
      </div>

      {/* 快捷键提示 */}
      <div className="p-2 bg-sidebar-surface/50 rounded text-xs text-sidebar-text-muted">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>放大:</span>
            <code className="text-sidebar-accent">Ctrl + +</code>
          </div>
          <div className="flex justify-between">
            <span>缩小:</span>
            <code className="text-sidebar-accent">Ctrl + -</code>
          </div>
          <div className="flex justify-between">
            <span>重置:</span>
            <code className="text-sidebar-accent">Ctrl + 0</code>
          </div>
          <div className="flex justify-between">
            <span>切换模式:</span>
            <code className="text-sidebar-accent">Tab</code>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ZoomIndicator }