import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Zap,
  History,
  Settings,
  Clipboard,
  MousePointer,
  Link,
  Unlink,
  Star,
  Tag,
  Eye,
  MoreHorizontal,
  Merge,
  FileText,
  GitMerge,
  BarChart3,
  Palette,
  Minus,
  Circle,
  Square,
} from 'lucide-react'
import { useCanvasStore, useNodeStore, useUIStore } from '@/stores'
import type { Position, AINode, EdgeStylePresetName } from '@/types'
import { VersionHistory } from '@/components/version/VersionHistory'

interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  disabled?: boolean
  divider?: boolean
  onClick: () => void
}

interface ContextMenuProps {
  isOpen: boolean
  position: Position
  onClose: () => void
  targetType: 'canvas' | 'node' | 'edge'
  targetId?: string
  onCreateNode?: (position: Position) => void
  onEditNode?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onCopyNode?: (nodeId: string) => void
  onOptimizeNode?: (nodeId: string) => void
  onFusionCreate?: (selectedNodeIds: string[], fusionType: 'summary' | 'synthesis' | 'comparison', position: Position) => void
  selectedNodeIds?: string[]
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  targetType,
  targetId,
  onCreateNode,
  onEditNode,
  onDeleteNode,
  onCopyNode,
  onOptimizeNode,
  onFusionCreate,
  selectedNodeIds = [],
}) => {
  const { addToast } = useUIStore()
  const { getNode, getNodes, duplicateNode, deleteNode, getEdge, updateEdgeStyle, setEdgeStylePreset, deleteEdge, updateNodeWithSync, deleteNodeWithSync, currentProjectId } = useNodeStore()
  const { clearSelection, selectAll } = useCanvasStore()

  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versionHistoryNodeId, setVersionHistoryNodeId] = useState<string | null>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // 智能边界检测定位
  useEffect(() => {
    if (!isOpen) return

    const MENU_WIDTH = 200
    const MENU_HEIGHT = 400 // 估算最大高度
    const PADDING = 8

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x
    let y = position.y

    // 右侧边界检测
    if (x + MENU_WIDTH > viewportWidth - PADDING) {
      x = Math.max(PADDING, viewportWidth - MENU_WIDTH - PADDING)
    }

    // 底部边界检测
    if (y + MENU_HEIGHT > viewportHeight - PADDING) {
      y = Math.max(PADDING, viewportHeight - MENU_HEIGHT - PADDING)
    }

    setAdjustedPosition({ x, y })
  }, [isOpen, position])

  // 监听全局版本历史事件
  useEffect(() => {
    const handleShowVersionHistory = (event: any) => {
      const { nodeId } = event.detail
      if (nodeId) {
        setVersionHistoryNodeId(nodeId)
        setShowVersionHistory(true)
      }
    }

    window.addEventListener('show-version-history', handleShowVersionHistory)
    return () => {
      window.removeEventListener('show-version-history', handleShowVersionHistory)
    }
  }, [])

  // 根据上下文类型生成菜单项
  const generateMenuItems = useCallback((): ContextMenuItem[] => {
    switch (targetType) {
      case 'canvas':
        const items: ContextMenuItem[] = [
          {
            id: 'create-node',
            label: '创建节点',
            icon: Plus,
            shortcut: 'Ctrl+N',
            onClick: () => {
              onCreateNode?.(position)
              onClose()
            }
          },
          {
            id: 'paste',
            label: '粘贴',
            icon: Clipboard,
            shortcut: 'Ctrl+V',
            onClick: async () => {
              try {
                const clipboardText = await navigator.clipboard.readText()
                if (clipboardText) {
                  // 尝试解析为节点数据
                  try {
                    const clipboardData = JSON.parse(clipboardText)
                    if (clipboardData.type === 'sker-node' && clipboardData.node) {
                      // 从剪贴板创建节点
                      onCreateNode?.({
                        x: position.x + 20,
                        y: position.y + 20
                      })
                      addToast({
                        type: 'success',
                        title: '粘贴成功',
                        message: `已粘贴节点: ${clipboardData.node.title || '未命名'}`
                      })
                    } else {
                      // 作为普通文本创建节点
                      onCreateNode?.(position)
                      addToast({
                        type: 'success',
                        title: '粘贴文本',
                        message: '已将文本内容创建为新节点'
                      })
                    }
                  } catch {
                    // 作为普通文本创建节点
                    onCreateNode?.(position)
                    addToast({
                      type: 'success',
                      title: '粘贴文本',
                      message: '已将文本内容创建为新节点'
                    })
                  }
                } else {
                  addToast({
                    type: 'warning',
                    title: '剪贴板为空',
                    message: '没有可粘贴的内容'
                  })
                }
              } catch (error) {
                addToast({
                  type: 'error',
                  title: '粘贴失败',
                  message: '无法访问剪贴板'
                })
              }
              onClose()
            }
          },
          {
            id: 'select-all',
            label: '全选',
            icon: MousePointer,
            shortcut: 'Ctrl+A',
            onClick: () => {
              try {
                const getAllNodeIds = () => getNodes().map(node => node.id)
                selectAll(getAllNodeIds)

                const nodeCount = getNodes().length
                addToast({
                  type: 'success',
                  title: '全选成功',
                  message: `已选中 ${nodeCount} 个节点`
                })
              } catch (error) {
                addToast({
                  type: 'error',
                  title: '全选失败',
                  message: '操作失败，请重试'
                })
              }
              onClose()
            }
          }
        ]

        // 如果有多个选中的节点，添加融合选项
        if (selectedNodeIds.length >= 2) {
          items.push(
            {
              id: 'divider-fusion',
              label: '',
              icon: MoreHorizontal,
              divider: true,
              onClick: () => {}
            },
            {
              id: 'fusion-synthesis',
              label: '智能融合',
              icon: Merge,
              shortcut: 'Ctrl+M',
              onClick: () => {
                onFusionCreate?.(selectedNodeIds, 'synthesis', position)
                onClose()
              }
            },
            {
              id: 'fusion-summary',
              label: '总结汇总',
              icon: FileText,
              onClick: () => {
                onFusionCreate?.(selectedNodeIds, 'summary', position)
                onClose()
              }
            },
            {
              id: 'fusion-comparison',
              label: '对比分析',
              icon: BarChart3,
              onClick: () => {
                onFusionCreate?.(selectedNodeIds, 'comparison', position)
                onClose()
              }
            }
          )
        }

        items.push(
          {
            id: 'divider-1',
            label: '',
            icon: MoreHorizontal,
            divider: true,
            onClick: () => {}
          },
          {
            id: 'canvas-settings',
            label: '画布设置',
            icon: Settings,
            onClick: () => {
              addToast({
                type: 'info',
                title: '功能开发中',
                message: '画布设置即将推出'
              })
              onClose()
            }
          }
        )

        return items

      case 'node':
        if (!targetId) return []
        
        const node = getNode(targetId)
        if (!node) return []

        return [
          {
            id: 'edit-node',
            label: '编辑节点',
            icon: Edit,
            shortcut: 'Enter',
            onClick: () => {
              onEditNode?.(targetId)
              onClose()
            }
          },
          {
            id: 'optimize-node',
            label: 'AI优化',
            icon: Zap,
            shortcut: 'Ctrl+O',
            onClick: () => {
              onOptimizeNode?.(targetId)
              onClose()
            }
          },
          {
            id: 'divider-1',
            label: '',
            icon: MoreHorizontal,
            divider: true,
            onClick: () => {}
          },
          {
            id: 'copy-node',
            label: '复制节点',
            icon: Copy,
            shortcut: 'Ctrl+C',
            onClick: async () => {
              try {
                const node = getNode(targetId)
                if (node) {
                  const clipboardData = {
                    type: 'sker-node',
                    timestamp: new Date().toISOString(),
                    node: {
                      id: node.id,
                      content: node.content,
                      title: node.title,
                      importance: node.importance,
                      confidence: node.confidence,
                      tags: [...node.tags],
                      metadata: node.metadata
                    }
                  }

                  await navigator.clipboard.writeText(JSON.stringify(clipboardData, null, 2))

                  addToast({
                    type: 'success',
                    title: '复制成功',
                    message: `节点 "${node.title || '未命名'}" 已复制到剪贴板`
                  })
                } else {
                  addToast({
                    type: 'error',
                    title: '复制失败',
                    message: '找不到要复制的节点'
                  })
                }
              } catch (error) {
                addToast({
                  type: 'error',
                  title: '复制失败',
                  message: '无法访问剪贴板'
                })
              }
              onClose()
            }
          },
          {
            id: 'duplicate-node',
            label: '复制到新位置',
            icon: Copy,
            shortcut: 'Ctrl+D',
            onClick: () => {
              const newPosition = {
                x: position.x + 50,
                y: position.y + 50
              }
              const newNodeId = duplicateNode(targetId)
              if (newNodeId) {
                addToast({
                  type: 'success',
                  title: '节点已复制',
                  message: '新节点已创建'
                })
              }
              onClose()
            }
          },
          {
            id: 'divider-2',
            label: '',
            icon: MoreHorizontal,
            divider: true,
            onClick: () => {}
          },
          {
            id: 'view-history',
            label: '查看历史',
            icon: History,
            shortcut: 'Ctrl+H',
            onClick: () => {
              const node = getNode(targetId)
              if (node) {
                setVersionHistoryNodeId(targetId)
                setShowVersionHistory(true)
              } else {
                addToast({
                  type: 'error',
                  title: '查看失败',
                  message: '找不到节点信息'
                })
              }
              onClose()
            }
          },
          {
            id: 'set-importance',
            label: '设置重要性',
            icon: Star,
            onClick: () => {
              addToast({
                type: 'info',
                title: '功能开发中',
                message: '快速设置重要性即将推出'
              })
              onClose()
            }
          },
          {
            id: 'manage-tags',
            label: '管理标签',
            icon: Tag,
            onClick: () => {
              addToast({
                type: 'info',
                title: '功能开发中',
                message: '快速标签管理即将推出'
              })
              onClose()
            }
          },
          {
            id: 'divider-3',
            label: '',
            icon: MoreHorizontal,
            divider: true,
            onClick: () => {}
          },
          {
            id: 'delete-node',
            label: '删除节点',
            icon: Trash2,
            shortcut: 'Delete',
            onClick: async () => {
              try {
                // 如果有项目ID,使用后端同步删除
                if (currentProjectId) {
                  await deleteNodeWithSync(targetId, false)
                } else {
                  // 否则只删除本地
                  deleteNode(targetId)
                }

                onDeleteNode?.(targetId)
                addToast({
                  type: 'success',
                  title: '节点已删除',
                  message: '节点已从画布中移除'
                })
              } catch (error) {
                addToast({
                  type: 'error',
                  title: '删除失败',
                  message: error instanceof Error ? error.message : '删除节点失败'
                })
              }
              onClose()
            }
          }
        ]

      case 'edge':
        if (!targetId) return []
        
        const edge = getEdge(targetId)
        if (!edge) return []

        return [
          {
            id: 'style-solid',
            label: '实线样式',
            icon: Minus,
            onClick: () => {
              setEdgeStylePreset(targetId, 'solid')
              addToast({
                type: 'success',
                title: '样式已更改',
                message: '连线已设置为实线样式'
              })
              onClose()
            }
          },
          {
            id: 'style-dashed',
            label: '虚线样式',
            icon: MoreHorizontal,
            onClick: () => {
              setEdgeStylePreset(targetId, 'dashed')
              addToast({
                type: 'success',
                title: '样式已更改',
                message: '连线已设置为虚线样式'
              })
              onClose()
            }
          },
          {
            id: 'style-dotted',
            label: '点线样式',
            icon: Circle,
            onClick: () => {
              setEdgeStylePreset(targetId, 'dotted')
              addToast({
                type: 'success',
                title: '样式已更改',
                message: '连线已设置为点线样式'
              })
              onClose()
            }
          },
          {
            id: 'divider-1',
            label: '',
            icon: MoreHorizontal,
            divider: true,
            onClick: () => {}
          },
          {
            id: 'style-thick',
            label: '粗线',
            icon: Square,
            onClick: () => {
              setEdgeStylePreset(targetId, 'thick')
              addToast({
                type: 'success',
                title: '样式已更改',
                message: '连线已设置为粗线样式'
              })
              onClose()
            }
          },
          {
            id: 'style-thin',
            label: '细线',
            icon: Minus,
            onClick: () => {
              setEdgeStylePreset(targetId, 'thin')
              addToast({
                type: 'success',
                title: '样式已更改',
                message: '连线已设置为细线样式'
              })
              onClose()
            }
          },
          {
            id: 'divider-2',
            label: '',
            icon: MoreHorizontal,
            divider: true,
            onClick: () => {}
          },
          {
            id: 'color-blue',
            label: '蓝色',
            icon: Palette,
            onClick: () => {
              updateEdgeStyle(targetId, { stroke: '#6366f1' })
              addToast({
                type: 'success',
                title: '颜色已更改',
                message: '连线已设置为蓝色'
              })
              onClose()
            }
          },
          {
            id: 'color-green',
            label: '绿色',
            icon: Palette,
            onClick: () => {
              updateEdgeStyle(targetId, { stroke: '#10b981' })
              addToast({
                type: 'success',
                title: '颜色已更改',
                message: '连线已设置为绿色'
              })
              onClose()
            }
          },
          {
            id: 'color-red',
            label: '红色',
            icon: Palette,
            onClick: () => {
              updateEdgeStyle(targetId, { stroke: '#ef4444' })
              addToast({
                type: 'success',
                title: '颜色已更改',
                message: '连线已设置为红色'
              })
              onClose()
            }
          },
          {
            id: 'color-yellow',
            label: '黄色',
            icon: Palette,
            onClick: () => {
              updateEdgeStyle(targetId, { stroke: '#f59e0b' })
              addToast({
                type: 'success',
                title: '颜色已更改',
                message: '连线已设置为黄色'
              })
              onClose()
            }
          },
          {
            id: 'divider-3',
            label: '',
            icon: MoreHorizontal,
            divider: true,
            onClick: () => {}
          },
          {
            id: 'delete-edge',
            label: '删除连接',
            icon: Unlink,
            shortcut: 'Delete',
            onClick: () => {
              deleteEdge(targetId)
              addToast({
                type: 'success',
                title: '连接已删除',
                message: '连线已从画布中移除'
              })
              onClose()
            }
          }
        ]

      default:
        return []
    }
  }, [targetType, targetId, position, onCreateNode, onEditNode, onDeleteNode, onCopyNode, onOptimizeNode, onClose, addToast, getNode, duplicateNode, deleteNode])

  // 更新菜单项
  useEffect(() => {
    if (isOpen) {
      setMenuItems(generateMenuItems())
    }
  }, [isOpen, generateMenuItems])

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      // 延迟添加事件监听器，避免立即触发
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  // 版本回滚回调
  const handleVersionRestore = async (version: number) => {
    if (!versionHistoryNodeId) return

    try {
      // 重新加载节点数据
      const node = getNode(versionHistoryNodeId)
      if (node) {
        addToast({
          type: 'success',
          title: '回滚成功',
          message: `节点已回滚到版本 ${version}`
        })

        // 关闭版本历史对话框
        setShowVersionHistory(false)
        setVersionHistoryNodeId(null)
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: '回滚失败',
        message: error instanceof Error ? error.message : '回滚失败，请重试'
      })
    }
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          role="menu"
          aria-label="上下文菜单"
          className="fixed z-50 min-w-[200px] bg-sidebar-surface border border-sidebar-border rounded-lg shadow-xl py-2"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.map((item, index) => {
          if (item.divider) {
            return (
              <div
                key={item.id || `divider-${index}`}
                className="h-px bg-sidebar-border my-1 mx-2"
              />
            )
          }

          return (
            <motion.button
              key={item.id}
              className={`
                w-full px-4 py-2 text-left flex items-center gap-3 text-sm
                transition-colors hover:bg-sidebar-hover
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'text-sidebar-text hover:text-sidebar-text'}
              `}
              disabled={item.disabled}
              onClick={item.onClick}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-sidebar-text-muted font-mono">
                  {item.shortcut}
                </span>
              )}
            </motion.button>
          )
        })}
      </motion.div>
    </AnimatePresence>

      {/* 版本历史对话框 */}
      {showVersionHistory && versionHistoryNodeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowVersionHistory(false)
          setVersionHistoryNodeId(null)
        }}>
          <div onClick={(e) => e.stopPropagation()}>
            <VersionHistory
              nodeId={versionHistoryNodeId}
              currentVersion={getNode(versionHistoryNodeId)?.version || 1}
              onVersionRestore={handleVersionRestore}
              onClose={() => {
                setShowVersionHistory(false)
                setVersionHistoryNodeId(null)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default ContextMenu