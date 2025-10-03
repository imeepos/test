import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Eye,
  Grid,
  RotateCcw,
  MousePointer2,
  Trash2,
  Search,
  X
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
    addSelectedNode,
    clearSelection,
  } = useCanvasStore()

  const {
    preferences,
    updatePreferences,
    addToast,
  } = useUIStore()

  const { deleteErrorNodes, getNodeStats, getNodes } = useNodeStore()

  // 搜索状态
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const searchInputRef = React.useRef<HTMLInputElement>(null)

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

  // 搜索处理
  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen)
    if (!isSearchOpen) {
      // 打开搜索框时自动聚焦
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      // 关闭时清空搜索
      setSearchQuery('')
      clearSelection()
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (!query.trim()) {
      clearSelection()
      return
    }

    // 搜索匹配的节点
    const nodes = getNodes()
    const matchedNodeIds: string[] = []

    nodes.forEach(node => {
      const searchText = query.toLowerCase()
      const nodeTitle = (node.title || '').toLowerCase()
      const nodeContent = (node.content || '').toLowerCase()
      const nodeTags = (node.tags || []).join(' ').toLowerCase()

      if (
        nodeTitle.includes(searchText) ||
        nodeContent.includes(searchText) ||
        nodeTags.includes(searchText)
      ) {
        matchedNodeIds.push(node.id)
      }
    })

    // 高亮匹配的节点
    clearSelection()
    matchedNodeIds.forEach(id => addSelectedNode(id))

    // 显示搜索结果
    if (matchedNodeIds.length > 0) {
      addToast({
        title: '搜索结果',
        message: `找到 ${matchedNodeIds.length} 个匹配的节点`,
        type: 'success',
        duration: 2000
      })
    } else {
      addToast({
        title: '无匹配结果',
        message: '未找到匹配的节点',
        type: 'info',
        duration: 2000
      })
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    clearSelection()
    searchInputRef.current?.focus()
  }

  // 监听 Ctrl+F / Cmd+F 快捷键
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setIsSearchOpen(true)
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
      }

      // ESC 关闭搜索
      if (e.key === 'Escape' && isSearchOpen) {
        handleSearchToggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen])

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
      {/* 搜索框 */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="flex items-center gap-2 p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="搜索节点..."
                className="w-64 h-8 px-3 pr-8 bg-sidebar-bg border border-sidebar-border rounded text-sm text-sidebar-text placeholder:text-sidebar-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 text-sidebar-text-muted hover:text-sidebar-text"
                  title="清空搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 搜索图标按钮 */}
      <div className="p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg">
        <button
          onClick={handleSearchToggle}
          className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-hover rounded text-sidebar-text-muted hover:text-sidebar-text transition-colors"
          title="搜索节点 (Ctrl+F)"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* 删除失败节点按钮 */}
      <div className="p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg">
        <button
          onClick={handleDeleteErrorNodes}
          className="h-8 w-8 flex items-center justify-center hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors"
          title="删除所有失败的节点"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* 全屏按钮 */}
      <div className="p-2 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg shadow-lg">
        <button
          onClick={handleFullscreenToggle}
          className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-hover rounded text-sidebar-text-muted hover:text-sidebar-text transition-colors"
          title={`${isFullscreen ? '退出' : '进入'}全屏 (F11)`}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </motion.div>
  )
}

export { CanvasControls }