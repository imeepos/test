import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, LogOut, User, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUIStore, useAuthStore } from '@/stores'
import { useToast } from '@/components/ui/Toast'
import { useShortcutHelp } from '@/hooks/useShortcutHelp'
import { SearchBox } from './SearchBox'
import { CanvasStats } from './CanvasStats'
import { ZoomIndicator } from './ZoomIndicator'
import { ShortcutHelp } from '@/components/help/ShortcutHelp'

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

  const { user, logout } = useAuthStore()
  const toast = useToast()

  // 快捷键帮助
  const { isOpen: showShortcutHelp, open: openShortcutHelp, close: closeShortcutHelp } = useShortcutHelp()

  // 拖拽调整宽度
  const [isResizing, setIsResizing] = React.useState(false)
  const sidebarRef = React.useRef<HTMLDivElement>(null)

  // 处理登出
  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      try {
        await logout()
        toast.info('已退出登录', '期待您的再次光临')
      } catch (error) {
        toast.error('登出失败', '请稍后重试')
      }
    }
  }

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

          {/* 快捷键帮助 */}
          <div>
            <h3 className="text-sm font-medium text-sidebar-text mb-2">
              帮助
            </h3>
            <Button
              variant="secondary"
              size="sm"
              icon={Keyboard}
              onClick={openShortcutHelp}
              className="w-full justify-start"
            >
              快捷键帮助 <kbd className="ml-auto text-xs opacity-60">Ctrl+?</kbd>
            </Button>
          </div>

          {/* 用户信息和登出 */}
          {user && (
            <div className="pt-4 border-t border-sidebar-border">
              <h3 className="text-sm font-medium text-sidebar-text mb-3">
                用户信息
              </h3>
              <div className="space-y-3">
                {/* 用户资料 */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-bg-secondary">
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-text truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-sidebar-text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* 登出按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={LogOut}
                  onClick={handleLogout}
                  className="w-full justify-start text-red-500 hover:bg-red-500/10"
                >
                  退出登录
                </Button>
              </div>
            </div>
          )}
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

      {/* 快捷键帮助模态框 */}
      <ShortcutHelp
        isOpen={showShortcutHelp}
        onClose={closeShortcutHelp}
      />
    </motion.div>
  )
}

export { Sidebar }