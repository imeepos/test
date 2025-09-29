import React from 'react'
import { motion } from 'framer-motion'
import { Canvas, CanvasControls } from '@/components/canvas'
import { Sidebar } from '@/components/sidebar'
import { ToastContainer } from '@/components/ui'
import { useCanvasStore, useNodeStore, useUIStore, useAIStore } from '@/stores'
import { nodeService } from '@/services'
import type { Position } from '@/types'

const CanvasPage: React.FC = () => {
  const { sidebarCollapsed, sidebarWidth, addToast } = useUIStore()
  const { addNode, getNode } = useNodeStore()
  const { updateStats } = useCanvasStore()
  const { startProcessing, connectionStatus } = useAIStore()

  // 处理画布双击创建节点
  const handleCanvasDoubleClick = React.useCallback(
    async (position: Position) => {
      try {
        // 使用nodeService创建空节点
        const newNode = await nodeService.createNode({
          position,
          content: '请输入内容或描述你的想法...',
          importance: 3,
          useAI: false, // 双击创建空节点，不使用AI
        })

        // 添加到store
        const nodeId = addNode({
          content: newNode.content,
          title: newNode.title,
          importance: newNode.importance,
          confidence: newNode.confidence,
          status: newNode.status,
          tags: newNode.tags,
          position: newNode.position,
          connections: newNode.connections,
          version: newNode.version,
          metadata: newNode.metadata,
        })

        // 显示创建成功提示
        addToast({
          type: 'success',
          title: '节点已创建',
          message: '双击节点开始编辑内容',
          duration: 3000,
        })

        console.log('新建节点:', nodeId, '位置:', position)
      } catch (error) {
        console.error('创建节点失败:', error)
        addToast({
          type: 'error',
          title: '创建失败',
          message: '请稍后重试',
          duration: 3000,
        })
      }
    },
    [addNode, addToast]
  )

  // 处理节点双击编辑
  const handleNodeDoubleClick = React.useCallback(
    (nodeId: string) => {
      console.log('编辑节点:', nodeId)
      // 节点双击编辑现在由AINode组件内部处理
    },
    []
  )

  // 处理拖拽扩展
  const handleDragExpand = React.useCallback(
    async (sourceNodeId: string, position: Position) => {
      try {
        // 获取源节点
        const sourceNode = getNode(sourceNodeId)
        if (!sourceNode) {
          addToast({
            type: 'error',
            title: '扩展失败',
            message: '找不到源节点',
          })
          return
        }

        // 开始AI处理
        startProcessing(sourceNodeId, {
          inputs: [sourceNode.content],
          type: 'expand',
          context: `基于节点"${sourceNode.title || '未命名'}"的内容进行扩展`,
        })

        // 使用nodeService创建扩展节点
        const newNode = await nodeService.dragExpandGenerate(sourceNode, position)

        // 添加到store
        const nodeId = addNode({
          content: newNode.content,
          title: newNode.title,
          importance: newNode.importance,
          confidence: newNode.confidence,
          status: newNode.status,
          tags: newNode.tags,
          position: newNode.position,
          connections: newNode.connections,
          version: newNode.version,
          metadata: newNode.metadata,
        })

        // 显示成功提示
        addToast({
          type: 'success',
          title: '扩展节点已创建',
          message: connectionStatus === 'connected' ? 'AI正在生成内容...' : '已创建空白扩展节点',
          duration: 3000,
        })

        console.log('拖拽扩展创建节点:', nodeId)
      } catch (error) {
        console.error('拖拽扩展失败:', error)
        addToast({
          type: 'error',
          title: '扩展失败',
          message: '请稍后重试',
          duration: 3000,
        })
      }
    },
    [getNode, addNode, addToast, startProcessing, connectionStatus]
  )

  // 计算主内容区域的样式
  const mainContentStyle = React.useMemo(() => {
    const sidebarWidthValue = sidebarCollapsed ? 48 : sidebarWidth
    return {
      marginLeft: `${sidebarWidthValue}px`,
      width: `calc(100% - ${sidebarWidthValue}px)`,
    }
  }, [sidebarCollapsed, sidebarWidth])

  // 键盘快捷键处理
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 阻止一些默认行为
      if (event.target === document.body) {
        // 阻止空格键滚动页面
        if (event.code === 'Space') {
          event.preventDefault()
        }
      }

      // 全局快捷键
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            addToast({
              type: 'info',
              title: '保存功能',
              message: '自动保存已启用，无需手动保存',
              duration: 3000,
            })
            break
          case 'z':
            if (event.shiftKey) {
              // Ctrl+Shift+Z 重做
              event.preventDefault()
              addToast({
                type: 'info',
                title: '重做',
                message: '重做功能正在开发中...',
                duration: 2000,
              })
            } else {
              // Ctrl+Z 撤销
              event.preventDefault()
              addToast({
                type: 'info',
                title: '撤销',
                message: '撤销功能正在开发中...',
                duration: 2000,
              })
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [addToast])

  // 初始化提示
  React.useEffect(() => {
    const timer = setTimeout(() => {
      addToast({
        type: 'info',
        title: '欢迎使用 SKER Studio',
        message: '双击画布空白处创建第一个AI组件',
        duration: 5000,
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [addToast])

  return (
    <div className="h-screen bg-canvas-bg overflow-hidden">
      {/* 侧边栏 */}
      <div className="fixed left-0 top-0 bottom-0 z-20">
        <Sidebar />
      </div>

      {/* 主内容区域 */}
      <motion.main
        className="relative h-full"
        style={mainContentStyle}
        animate={{ 
          marginLeft: sidebarCollapsed ? 48 : sidebarWidth,
          width: `calc(100% - ${sidebarCollapsed ? 48 : sidebarWidth}px)`,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* 画布容器 */}
        <div className="relative h-full">
          <Canvas
            onCanvasDoubleClick={handleCanvasDoubleClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onDragExpand={handleDragExpand}
          />

          {/* 画布控制器 */}
          <CanvasControls />
        </div>

        {/* 快捷操作提示 */}
        <motion.div
          className="absolute top-4 left-4 z-10 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg p-3 text-xs text-sidebar-text-muted max-w-xs"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <h4 className="text-sidebar-text font-medium mb-2">快速开始</h4>
          <ul className="space-y-1">
            <li>• 双击空白处创建组件</li>
            <li>• 拖拽连线扩展思维</li>
            <li>• 右键获取更多操作</li>
            <li>• 使用侧边栏搜索组件</li>
          </ul>
        </motion.div>
      </motion.main>

      {/* Toast 通知容器 */}
      <ToastContainer />
    </div>
  )
}

export { CanvasPage }