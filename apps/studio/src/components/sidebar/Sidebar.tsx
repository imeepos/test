import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUIStore } from '@/stores'
import { SearchBox } from './SearchBox'
import { CanvasStats } from './CanvasStats'
import { ZoomIndicator } from './ZoomIndicator'

export interface SidebarProps {
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const {
    sidebarCollapsed,
    sidebarWidth,
    toggleSidebar,
    setSidebarWidth,
  } = useUIStore()

  // 拖拽调整宽度
  const [isResizing, setIsResizing] = React.useState(false)
  const sidebarRef = React.useRef<HTMLDivElement>(null)

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = e.clientX
      const minWidth = 200
      const maxWidth = 400

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setSidebarWidth])

  const sidebarVariants = {
    expanded: {
      width: sidebarWidth,
      opacity: 1,
    },
    collapsed: {
      width: 48,
      opacity: 1,
    },
  }

  return (
    <motion.div
      ref={sidebarRef}
      className={`
        relative h-full bg-sidebar-bg border-r border-sidebar-border
        flex flex-col overflow-hidden
        ${className || ''}
      `}
      variants={sidebarVariants}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* 品牌标识 */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 bg-sidebar-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-text">SKER</h1>
              <p className="text-xs text-sidebar-text-muted -mt-1">Studio</p>
            </div>
          </motion.div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          icon={sidebarCollapsed ? ChevronRight : ChevronLeft}
          onClick={toggleSidebar}
          className="h-8 w-8 p-0 flex-shrink-0"
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        />
      </div>

      {/* 内容区域 */}
      {!sidebarCollapsed && (
        <motion.div
          className="flex-1 overflow-y-auto p-4 space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* 搜索框 */}
          <div>
            <h3 className="text-sm font-medium text-sidebar-text mb-2">
              搜索组件
            </h3>
            <SearchBox />
          </div>

          {/* 缩放指示器 */}
          <div>
            <h3 className="text-sm font-medium text-sidebar-text mb-2">
              视图控制
            </h3>
            <ZoomIndicator />
          </div>

          {/* 画布统计 */}
          <div>
            <h3 className="text-sm font-medium text-sidebar-text mb-2">
              画布状态
            </h3>
            <CanvasStats />
          </div>
        </motion.div>
      )}

      {/* 收起状态的简化内容 */}
      {sidebarCollapsed && (
        <motion.div
          className="flex-1 overflow-y-auto p-2 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* 简化的品牌标识 */}
          <div className="h-8 w-8 bg-sidebar-accent rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">S</span>
          </div>

          {/* 简化的状态指示器 */}
          <div className="space-y-2">
            <div className="h-2 w-8 bg-sidebar-surface rounded mx-auto" />
            <div className="h-2 w-6 bg-sidebar-accent/50 rounded mx-auto" />
          </div>
        </motion.div>
      )}

      {/* 调整手柄 */}
      {!sidebarCollapsed && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-sidebar-accent/20 transition-colors"
          onMouseDown={handleMouseDown}
          title="拖拽调整宽度"
        >
          <div className="h-full w-full" />
        </div>
      )}

      {/* 调整手柄拖拽时的视觉反馈 */}
      {isResizing && (
        <div className="fixed inset-0 cursor-col-resize z-50" />
      )}
    </motion.div>
  )
}

export { Sidebar }