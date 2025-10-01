import React from 'react'
import { motion } from 'framer-motion'
import { Canvas, CanvasControls } from '@/components/canvas'
import { Sidebar } from '@/components/sidebar'
import { ToastContainer } from '@/components/ui'
import { useCanvasStore, useNodeStore, useUIStore, useAIStore } from '@/stores'
import { useSyncStore } from '@/stores/syncStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { nodeService } from '@/services'
import type { Position } from '@/types'

const CanvasPage: React.FC = () => {
  const { sidebarCollapsed, sidebarWidth, addToast } = useUIStore()
  const { addNode, getNode, getNodes, createNodeWithSync, setCurrentProject } = useNodeStore()
  const { updateStats, selectedNodeIds, selectAll, currentProject } = useCanvasStore()
  const { startProcessing, connectionStatus } = useAIStore()
  const { status: syncStatus, lastSavedAt } = useSyncStore()

  // 启用自动保存(30秒间隔，3秒防抖)
  useAutoSave({
    enabled: !!currentProject,
    interval: 30000,
    debounceDelay: 3000,
  })

  // 同步当前项目ID到NodeStore
  React.useEffect(() => {
    if (currentProject?.id) {
      setCurrentProject(currentProject.id)
    }
  }, [currentProject?.id, setCurrentProject])

  // 处理画布双击创建节点
  const handleCanvasDoubleClick = React.useCallback(
    async (position: Position) => {
      console.log('CanvasPage: 处理画布双击创建节点, 位置:', position)

      if (!currentProject?.id) {
        addToast({
          type: 'error',
          title: '创建失败',
          message: '请先选择或创建项目',
          duration: 3000,
        })
        return
      }

      try {
        // 使用后端同步方法创建节点
        const newNode = await createNodeWithSync({
          project_id: currentProject.id,
          content: '请输入内容或描述你的想法...',
          importance: 3,
          position,
          tags: [],
        })

        console.log('CanvasPage: 创建节点成功:', newNode)

        // 显示创建成功提示
        addToast({
          type: 'success',
          title: '节点已创建',
          message: '双击节点开始编辑内容',
          duration: 3000,
        })
      } catch (error) {
        console.error('CanvasPage: 创建节点失败:', error)
        addToast({
          type: 'error',
          title: '创建失败',
          message: error instanceof Error ? error.message : '请稍后重试',
          duration: 3000,
        })
      }
    },
    [currentProject?.id, createNodeWithSync, addToast]
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
      if (!currentProject?.id) {
        addToast({
          type: 'error',
          title: '扩展失败',
          message: '请先选择或创建项目',
          duration: 3000,
        })
        return
      }

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

        // 使用nodeService创建扩展节点(本地AI生成)
        const newNode = await nodeService.dragExpandGenerate(sourceNode, position)

        // 使用后端同步方法保存
        await createNodeWithSync({
          project_id: currentProject.id,
          content: newNode.content,
          title: newNode.title,
          importance: newNode.importance,
          position: newNode.position,
          tags: newNode.tags,
          parent_id: sourceNodeId,
          metadata: newNode.metadata,
        })

        // 显示成功提示
        addToast({
          type: 'success',
          title: '扩展节点已创建',
          message: connectionStatus === 'connected' ? 'AI正在生成内容...' : '已创建扩展节点',
          duration: 3000,
        })

        console.log('拖拽扩展创建节点成功')
      } catch (error) {
        console.error('拖拽扩展失败:', error)
        addToast({
          type: 'error',
          title: '扩展失败',
          message: error instanceof Error ? error.message : '请稍后重试',
          duration: 3000,
        })
      }
    },
    [currentProject?.id, getNode, createNodeWithSync, addToast, startProcessing, connectionStatus]
  )

  // 处理多输入融合
  const handleFusionCreate = React.useCallback(
    async (selectedNodeIds: string[], fusionType: 'summary' | 'synthesis' | 'comparison', position: Position) => {
      if (!currentProject?.id) {
        addToast({
          type: 'error',
          title: '融合失败',
          message: '请先选择或创建项目',
          duration: 3000,
        })
        return
      }

      try {
        if (selectedNodeIds.length < 2) {
          addToast({
            type: 'warning',
            title: '融合失败',
            message: '请选择至少2个节点进行融合',
            duration: 3000,
          })
          return
        }

        // 获取选中的节点
        const inputNodes = selectedNodeIds.map(id => getNode(id)).filter((node): node is NonNullable<typeof node> => Boolean(node))
        if (inputNodes.length < 2) {
          addToast({
            type: 'error',
            title: '融合失败',
            message: '找不到足够的有效节点',
            duration: 3000,
          })
          return
        }

        const typeMap = {
          summary: '总结汇总',
          synthesis: '智能融合',
          comparison: '对比分析'
        }

        // 开始AI处理
        startProcessing('fusion', {
          inputs: inputNodes.map(node => node.content),
          type: 'fusion',
          context: `${typeMap[fusionType]} ${inputNodes.length} 个节点的内容`,
        })

        // 显示开始处理的提示
        addToast({
          type: 'info',
          title: `开始${typeMap[fusionType]}`,
          message: `正在处理 ${inputNodes.length} 个节点的内容，请稍候...`,
          duration: 3000,
        })

        // 使用nodeService创建融合节点(本地AI生成)
        const newNode = await nodeService.fusionGenerate(inputNodes, fusionType, position)

        // 使用后端同步方法保存
        await createNodeWithSync({
          project_id: currentProject.id,
          content: newNode.content,
          title: newNode.title,
          importance: newNode.importance,
          position: newNode.position,
          tags: newNode.tags,
          metadata: newNode.metadata,
        })

        // 显示成功提示
        const confidencePercent = Math.round((newNode.confidence || 0) * 100)
        addToast({
          type: 'success',
          title: `${typeMap[fusionType]}完成`,
          message: `已成功融合 ${inputNodes.length} 个节点（置信度: ${confidencePercent}%）`,
          duration: 4000,
        })

        console.log('融合节点创建成功, 类型:', fusionType, '源节点:', selectedNodeIds)
      } catch (error) {
        console.error('融合创建失败:', error)
        addToast({
          type: 'error',
          title: '融合失败',
          message: error instanceof Error ? error.message : '请稍后重试',
          duration: 3000,
        })
      }
    },
    [currentProject?.id, getNode, createNodeWithSync, addToast, startProcessing]
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
    const handleKeyDown = async (event: KeyboardEvent) => {
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
          case 'c':
            // 复制选中的节点
            if (selectedNodeIds.length > 0) {
              event.preventDefault()
              try {
                const selectedNodes = selectedNodeIds.map(id => getNode(id)).filter((node): node is NonNullable<typeof node> => Boolean(node))
                if (selectedNodes.length > 0) {
                  const clipboardData = {
                    type: 'sker-nodes',
                    timestamp: new Date().toISOString(),
                    nodes: selectedNodes.map(node => ({
                      id: node.id,
                      content: node.content,
                      title: node.title,
                      importance: node.importance,
                      confidence: node.confidence,
                      tags: [...node.tags],
                      metadata: node.metadata
                    }))
                  }

                  await navigator.clipboard.writeText(JSON.stringify(clipboardData, null, 2))

                  addToast({
                    type: 'success',
                    title: '复制成功',
                    message: `已复制 ${selectedNodes.length} 个节点`,
                    duration: 3000,
                  })
                }
              } catch (error) {
                addToast({
                  type: 'error',
                  title: '复制失败',
                  message: '无法访问剪贴板',
                  duration: 3000,
                })
              }
            }
            break
          case 'v':
            // 粘贴节点
            event.preventDefault()
            try {
              const clipboardText = await navigator.clipboard.readText()
              if (clipboardText) {
                try {
                  const clipboardData = JSON.parse(clipboardText)
                  if (clipboardData.type === 'sker-nodes' && clipboardData.nodes) {
                    // 粘贴多个节点
                    let pastedCount = 0
                    for (let i = 0; i < clipboardData.nodes.length; i++) {
                      const nodeData = clipboardData.nodes[i]
                      const position = { x: 100 + i * 50, y: 100 + i * 50 }

                      try {
                        const newNode = await nodeService.createNode({
                          position,
                          content: nodeData.content,
                          title: nodeData.title,
                          importance: nodeData.importance,
                          useAI: false,
                        })

                        addNode({
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
                        pastedCount++
                      } catch (error) {
                        console.error('粘贴节点失败:', error)
                      }
                    }

                    if (pastedCount > 0) {
                      addToast({
                        type: 'success',
                        title: '粘贴成功',
                        message: `已粘贴 ${pastedCount} 个节点`,
                        duration: 3000,
                      })
                    }
                  } else if (clipboardData.type === 'sker-node' && clipboardData.node) {
                    // 粘贴单个节点
                    const nodeData = clipboardData.node
                    const position = { x: 100, y: 100 }

                    const newNode = await nodeService.createNode({
                      position,
                      content: nodeData.content,
                      title: nodeData.title,
                      importance: nodeData.importance,
                      useAI: false,
                    })

                    addNode({
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

                    addToast({
                      type: 'success',
                      title: '粘贴成功',
                      message: `已粘贴节点: ${nodeData.title || '未命名'}`,
                      duration: 3000,
                    })
                  } else {
                    // 作为普通文本创建新节点
                    const newNode = await nodeService.createNode({
                      position: { x: 100, y: 100 },
                      content: clipboardText,
                      importance: 3,
                      useAI: false,
                    })

                    addNode({
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

                    addToast({
                      type: 'success',
                      title: '粘贴文本',
                      message: '已将文本内容创建为新节点',
                      duration: 3000,
                    })
                  }
                } catch {
                  // 作为普通文本处理
                  const newNode = await nodeService.createNode({
                    position: { x: 100, y: 100 },
                    content: clipboardText,
                    importance: 3,
                    useAI: false,
                  })

                  addNode({
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

                  addToast({
                    type: 'success',
                    title: '粘贴文本',
                    message: '已将文本内容创建为新节点',
                    duration: 3000,
                  })
                }
              } else {
                addToast({
                  type: 'warning',
                  title: '剪贴板为空',
                  message: '没有可粘贴的内容',
                  duration: 3000,
                })
              }
            } catch (error) {
              addToast({
                type: 'error',
                title: '粘贴失败',
                message: '无法访问剪贴板',
                duration: 3000,
              })
            }
            break
          case 'a':
            // 全选节点
            event.preventDefault()
            try {
              const getAllNodeIds = () => getNodes().map(node => node.id)
              selectAll(getAllNodeIds)

              const nodeCount = getNodes().length
              if (nodeCount > 0) {
                addToast({
                  type: 'success',
                  title: '全选成功',
                  message: `已选中 ${nodeCount} 个节点`,
                  duration: 3000,
                })
              } else {
                addToast({
                  type: 'info',
                  title: '画布为空',
                  message: '当前画布没有节点',
                  duration: 3000,
                })
              }
            } catch (error) {
              addToast({
                type: 'error',
                title: '全选失败',
                message: '操作失败，请重试',
                duration: 3000,
              })
            }
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
  }, [addToast, selectedNodeIds, getNode, getNodes, addNode, selectAll])

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
            onFusionCreate={handleFusionCreate}
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
            <li>• Ctrl+C/V 复制粘贴节点</li>
            <li>• Ctrl+A 全选所有节点</li>
            <li>• 悬停版本信息查看历史</li>
          </ul>
        </motion.div>

        {/* 同步状态指示器 */}
        {currentProject && (
          <motion.div
            className="absolute top-4 right-4 z-10 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg px-3 py-2 text-xs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              {syncStatus === 'saving' && (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500"></div>
                  <span className="text-sidebar-text">保存中...</span>
                </>
              )}
              {syncStatus === 'saved' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sidebar-text-muted">
                    已保存 {lastSavedAt && `(${new Date(lastSavedAt).toLocaleTimeString()})`}
                  </span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="text-red-500">保存失败</span>
                </>
              )}
              {syncStatus === 'idle' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                  <span className="text-sidebar-text-muted">就绪</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.main>

      {/* Toast 通知容器 */}
      <ToastContainer />
    </div>
  )
}

export { CanvasPage }