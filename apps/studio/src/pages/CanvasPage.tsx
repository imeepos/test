import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Canvas, CanvasControls } from '@/components/canvas'
import { Sidebar } from '@/components/sidebar'
import { PromptDialog } from '@/components/ui'
import { useCanvasStore, useNodeStore, useUIStore, useAIStore } from '@/stores'
import { useSyncStore } from '@/stores/syncStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useProjectFromUrl } from '@/hooks/useProjectFromUrl'
import { nodeService } from '@/services'
import type { Position } from '@/types'

const CanvasPage: React.FC = () => {
  const navigate = useNavigate()

  // 从 URL 加载项目
  const { projectIdFromUrl, hasProjectInUrl } = useProjectFromUrl()

  const { sidebarCollapsed, sidebarWidth, addToast } = useUIStore()
  const { addNode, getNode, getNodes, updateNode, updateNodeWithSync, createNodeWithSync, setCurrentProject, syncFromBackend } = useNodeStore()
  const { updateStats, selectedNodeIds, selectAll, currentProject } = useCanvasStore()
  const { startProcessing, connectionStatus } = useAIStore()
  const { status: syncStatus, lastSavedAt } = useSyncStore()

  // 如果 URL 中没有 projectId，重定向到项目选择页
  React.useEffect(() => {
    if (!hasProjectInUrl) {
      console.log('Canvas 页面缺少 projectId，重定向到 /projects')
      navigate('/projects', { replace: true })
    }
  }, [hasProjectInUrl, navigate])

  // 提示词对话框状态
  const [promptDialogOpen, setPromptDialogOpen] = React.useState(false)
  const [promptDialogPosition, setPromptDialogPosition] = React.useState<Position>({ x: 0, y: 0 })
  const [isCreatingNode, setIsCreatingNode] = React.useState(false)

  // 编辑节点对话框状态
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingNodeId, setEditingNodeId] = React.useState<string | null>(null)
  const [editingNodeContent, setEditingNodeContent] = React.useState('')

  // 启用自动保存(30秒间隔)
  useAutoSave({
    enabled: !!currentProject,
    interval: 30000,
  })

  // 同步当前项目ID到NodeStore并加载节点
  React.useEffect(() => {
    if (currentProject?.id) {
      setCurrentProject(currentProject.id)

      // 从后端静默加载节点数据
      syncFromBackend(currentProject.id, { silent: true }).catch((error) => {
        console.error('❌ 加载节点数据失败:', error)
        // 不显示错误提示，避免打扰用户
      })
    }
  }, [currentProject?.id, setCurrentProject, syncFromBackend])

  // 处理画布双击 - 打开提示词对话框
  const handleCanvasDoubleClick = React.useCallback(
    (position: Position) => {
      console.log('CanvasPage: 画布双击, 位置:', position)

      if (!currentProject?.id) {
        addToast({
          type: 'error',
          title: '创建失败',
          message: '请先选择或创建项目',
          duration: 3000,
        })
        return
      }

      // 保存位置并打开提示词对话框
      setPromptDialogPosition(position)
      setPromptDialogOpen(true)
    },
    [currentProject?.id, addToast]
  )

  // 处理提示词提交 - AI生成节点
  const handlePromptSubmit = React.useCallback(
    async (prompt: string) => {
      if (!currentProject?.id) {
        addToast({
          type: 'error',
          title: '创建失败',
          message: '请先选择或创建项目',
        })
        setPromptDialogOpen(false)
        return
      }

      try {
        console.log('CanvasPage: 开始AI生成节点, 提示词:', prompt)

        // 1. 立即创建一个processing状态的节点
        const processingNode = await nodeService.createNode({
          position: promptDialogPosition,
          content: '正在生成中...',
          title: '生成中',
          useAI: false,
        })

        // 设置为processing状态
        processingNode.status = 'processing'
        processingNode.tags = ['AI生成中']

        // 保存到后端和本地store
        const savedNode = await createNodeWithSync({
          project_id: currentProject.id,
          content: processingNode.content,
          title: processingNode.title,
          importance: processingNode.importance,
          position: processingNode.position,
          tags: processingNode.tags,
          metadata: { ...processingNode.metadata, status: 'processing', originalPrompt: prompt },
        })

        // 关闭对话框
        setPromptDialogOpen(false)
        setIsCreatingNode(false)

        console.log('CanvasPage: Processing节点已创建:', savedNode)

        // 2. 发送AI请求（带上nodeId，后端会自动更新节点）
        nodeService.createNode({
          position: promptDialogPosition,
          content: prompt,
          useAI: true,
          context: [prompt],
          nodeId: savedNode.id, // ✅ 传递 nodeId 给后端
        }).then(() => {
          // ✅ 后端会自动更新节点，前端只需要显示成功提示
          addToast({
            type: 'success',
            title: '节点创建成功',
            message: 'AI已为你生成内容',
            duration: 2000,
          })
        }).catch(async (error) => {
          console.error('CanvasPage: AI生成节点失败:', error)

          // ❌ AI失败时仍需前端更新节点为error状态
          await updateNodeWithSync(savedNode.id, {
            status: 'error',
            content: 'AI生成失败，请点击重试按钮',
            tags: ['生成失败'],
          })

          addToast({
            type: 'error',
            title: 'AI生成失败',
            message: error instanceof Error ? error.message : '请点击节点上的重试按钮',
            duration: 3000,
          })
        })

      } catch (error) {
        console.error('CanvasPage: 创建节点失败:', error)
        addToast({
          type: 'error',
          title: '创建失败',
          message: error instanceof Error ? error.message : '请稍后重试',
          duration: 3000,
        })
        setPromptDialogOpen(false)
        setIsCreatingNode(false)
      }
    },
    [currentProject?.id, promptDialogPosition, createNodeWithSync, addToast, updateNode]
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

        // 成功时不显示toast，静默创建

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

        // 开始处理时不显示toast

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

        // 成功时不显示toast，静默创建

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
            // 不显示保存提示，静默保存
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

                  // 成功时不显示toast
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

                    // 成功时不显示toast
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

                    // 成功时不显示toast
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

                    // 成功时不显示toast
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

                  // 成功时不显示toast
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

              // 成功时不显示toast
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
            event.preventDefault()
            // 撤销/重做功能静默处理
            break
          case 'h':
            // Ctrl+H 查看版本历史
            event.preventDefault()
            if (selectedNodeIds.length === 1) {
              // 触发查看历史的自定义事件
              const historyEvent = new CustomEvent('show-version-history', {
                detail: { nodeId: selectedNodeIds[0] }
              })
              window.dispatchEvent(historyEvent)
            } else if (selectedNodeIds.length === 0) {
              addToast({
                type: 'warning',
                title: '未选中节点',
                message: '请先选中一个节点查看其版本历史',
                duration: 3000,
              })
            } else {
              addToast({
                type: 'warning',
                title: '选中过多',
                message: '请只选中一个节点查看版本历史',
                duration: 3000,
              })
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [addToast, selectedNodeIds, getNode, getNodes, addNode, selectAll])

  // 监听编辑节点事件
  React.useEffect(() => {
    const handleEditNode = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string; currentContent: string; currentTitle: string }>
      const { nodeId, currentContent } = customEvent.detail
      console.log('CanvasPage: 收到编辑节点请求, nodeId:', nodeId)

      setEditingNodeId(nodeId)
      setEditingNodeContent(currentContent)
      setEditDialogOpen(true)
    }

    window.addEventListener('edit-node', handleEditNode)
    return () => {
      window.removeEventListener('edit-node', handleEditNode)
    }
  }, [])

  // 处理编辑节点提示词提交
  const handleEditSubmit = React.useCallback(
    async (instruction: string) => {
      if (!editingNodeId || !currentProject?.id) {
        addToast({
          type: 'error',
          title: '修改失败',
          message: '请先选择或创建项目',
          duration: 3000,
        })
        setEditDialogOpen(false)
        return
      }

      const node = getNode(editingNodeId)
      if (!node) {
        addToast({
          type: 'error',
          title: '修改失败',
          message: '找不到节点',
          duration: 3000,
        })
        setEditDialogOpen(false)
        return
      }

      try {
        // 设置为processing状态并同步到数据库
        await updateNodeWithSync(editingNodeId, {
          status: 'processing',
          tags: ['AI修改中'],
        })

        // 关闭对话框
        setEditDialogOpen(false)

        // 使用AI生成新内容
        const aiNode = await nodeService.createNode({
          position: node.position,
          content: `${editingNodeContent}\n\n修改意见: ${instruction}`,
          useAI: true,
          context: [`当前内容: ${editingNodeContent}`, `修改意见: ${instruction}`],
        })

        // 更新节点并同步到数据库
        await updateNodeWithSync(editingNodeId, {
          content: aiNode.content,
          title: aiNode.title,
          tags: aiNode.tags,
          confidence: aiNode.confidence,
          status: 'completed',
          metadata: {
            ...aiNode.metadata,
            editCount: (node.metadata?.editCount || 0) + 1,
          },
        })

        addToast({
          type: 'success',
          title: '节点修改成功',
          message: 'AI已根据你的意见修改内容',
          duration: 2000,
        })
      } catch (error) {
        console.error('CanvasPage: AI修改节点失败:', error)

        // 更新节点为错误状态并同步到数据库
        await updateNodeWithSync(editingNodeId, {
          status: 'error',
          tags: ['修改失败'],
        })

        addToast({
          type: 'error',
          title: 'AI修改失败',
          message: error instanceof Error ? error.message : '请稍后重试',
          duration: 3000,
        })
      }
    },
    [editingNodeId, editingNodeContent, currentProject?.id, getNode, updateNode, addToast]
  )

  // 监听重试AI生成事件
  React.useEffect(() => {
    const handleRetryAI = async (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string }>
      const { nodeId } = customEvent.detail
      console.log('CanvasPage: 收到重试AI生成请求, nodeId:', nodeId)

      if (!currentProject?.id) {
        addToast({
          type: 'error',
          title: '重试失败',
          message: '请先选择或创建项目',
          duration: 3000,
        })
        return
      }

      const node = getNode(nodeId)
      if (!node) {
        addToast({
          type: 'error',
          title: '重试失败',
          message: '找不到节点',
          duration: 3000,
        })
        return
      }

      try {
        // 设置为processing状态并同步到数据库
        await updateNodeWithSync(nodeId, {
          status: 'processing',
          content: '正在重新生成...',
          tags: ['AI生成中'],
        })

        // 使用原始提示词或节点内容重新生成
        const prompt = (node.metadata as any)?.originalPrompt || node.content
        const aiNode = await nodeService.createNode({
          position: node.position,
          content: prompt,
          useAI: true,
          context: [prompt],
        })

        // 更新节点并同步到数据库
        await updateNodeWithSync(nodeId, {
          content: aiNode.content,
          title: aiNode.title,
          tags: aiNode.tags,
          confidence: aiNode.confidence,
          status: 'completed',
          metadata: aiNode.metadata,
        })

        addToast({
          type: 'success',
          title: '重新生成成功',
          message: 'AI已为你重新生成内容',
          duration: 2000,
        })
      } catch (error) {
        console.error('CanvasPage: 重试AI生成失败:', error)

        await updateNodeWithSync(nodeId, {
          status: 'error',
          content: 'AI生成失败，请点击重试按钮',
          tags: ['生成失败'],
        })

        addToast({
          type: 'error',
          title: 'AI生成失败',
          message: error instanceof Error ? error.message : '请稍后重试',
          duration: 3000,
        })
      }
    }

    window.addEventListener('retry-ai-generation', handleRetryAI)
    return () => {
      window.removeEventListener('retry-ai-generation', handleRetryAI)
    }
  }, [currentProject?.id, getNode, updateNode, addToast])

  // 移除初始化提示

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

        {/* 同步状态指示器 */}
        {currentProject && (
          <motion.div
            className="absolute top-4 right-20 z-10 bg-sidebar-surface/90 backdrop-blur-sm border border-sidebar-border rounded-lg px-3 py-2 text-xs"
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

      {/* 提示词输入对话框 */}
      <PromptDialog
        isOpen={promptDialogOpen}
        onClose={() => setPromptDialogOpen(false)}
        onSubmit={handlePromptSubmit}
        title="创建新节点"
        placeholder="在此输入你的想法...&#10;例如: 分析电商平台的技术架构"
        isLoading={isCreatingNode}
      />

      {/* 编辑节点对话框 */}
      <PromptDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        title="AI修改节点"
        placeholder="请输入修改意见...&#10;例如: 添加更多技术细节&#10;例如: 简化表述&#10;例如: 补充安全性考虑"
        isLoading={false}
      />
    </div>
  )
}

export { CanvasPage }