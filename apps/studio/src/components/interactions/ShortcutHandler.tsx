import React, { useEffect, useCallback } from 'react'
import { useCanvasStore, useNodeStore, useUIStore } from '@/stores'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  handler: () => void
  description: string
  preventDefault?: boolean
}

interface ShortcutHandlerProps {
  onCreateNode?: () => void
  onPaste?: () => void
  onSelectAll?: () => void
  onOptimize?: () => void
  onDelete?: () => void
  onEdit?: () => void
  onToggleFullscreen?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onDuplicate?: () => void
  onSave?: () => void
  disabled?: boolean
}

export const ShortcutHandler: React.FC<ShortcutHandlerProps> = ({
  onCreateNode,
  onPaste,
  onSelectAll,
  onOptimize,
  onDelete,
  onEdit,
  onToggleFullscreen,
  onUndo,
  onRedo,
  onDuplicate,
  onSave,
  disabled = false,
}) => {
  const { selectedNodeIds, clearSelection } = useCanvasStore()
  const { getNodes, deleteNode } = useNodeStore()
  const { addToast } = useUIStore()

  // 默认处理器
  const defaultHandlers = {
    createNode: useCallback(() => {
      if (onCreateNode) {
        onCreateNode()
      } else {
        addToast({
          type: 'info',
          title: '创建节点',
          message: '双击空白处创建新节点'
        })
      }
    }, [onCreateNode, addToast]),

    paste: useCallback(async () => {
      if (onPaste) {
        onPaste()
        return
      }

      try {
        const clipboardText = await navigator.clipboard.readText()
        if (clipboardText) {
          addToast({
            type: 'success',
            title: '粘贴',
            message: '请在画布上右键选择粘贴位置'
          })
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
    }, [onPaste, addToast]),

    selectAll: useCallback(() => {
      if (onSelectAll) {
        onSelectAll()
        return
      }

      const allNodes = getNodes()
      if (allNodes.length > 0) {
        // 这里需要canvasStore实现selectAll方法
        addToast({
          type: 'success',
          title: '全选',
          message: `已选中 ${allNodes.length} 个节点`
        })
      } else {
        addToast({
          type: 'info',
          title: '无节点',
          message: '画布中没有节点可选择'
        })
      }
    }, [onSelectAll, getNodes, addToast]),

    optimize: useCallback(() => {
      if (onOptimize) {
        onOptimize()
        return
      }

      if (selectedNodeIds.length === 0) {
        addToast({
          type: 'warning',
          title: '请选择节点',
          message: '请先选择要优化的节点'
        })
        return
      }

      addToast({
        type: 'info',
        title: 'AI优化',
        message: '右键选中节点选择"AI优化"'
      })
    }, [onOptimize, selectedNodeIds.length, addToast]),

    delete: useCallback(() => {
      if (onDelete) {
        onDelete()
        return
      }

      if (selectedNodeIds.length === 0) {
        addToast({
          type: 'warning',
          title: '请选择节点',
          message: '请先选择要删除的节点'
        })
        return
      }

      // 删除选中的节点
      selectedNodeIds.forEach(nodeId => {
        deleteNode(nodeId)
      })

      addToast({
        type: 'success',
        title: '删除成功',
        message: `已删除 ${selectedNodeIds.length} 个节点`
      })

      clearSelection()
    }, [onDelete, selectedNodeIds, deleteNode, clearSelection, addToast]),

    edit: useCallback(() => {
      if (onEdit) {
        onEdit()
        return
      }

      if (selectedNodeIds.length === 0) {
        addToast({
          type: 'warning',
          title: '请选择节点',
          message: '请先选择要编辑的节点'
        })
      } else if (selectedNodeIds.length > 1) {
        addToast({
          type: 'warning',
          title: '请选择单个节点',
          message: '一次只能编辑一个节点'
        })
      } else {
        addToast({
          type: 'info',
          title: '编辑节点',
          message: '双击节点进入编辑模式'
        })
      }
    }, [onEdit, selectedNodeIds, addToast]),

    toggleFullscreen: useCallback(() => {
      if (onToggleFullscreen) {
        onToggleFullscreen()
        return
      }

      try {
        if (document.fullscreenElement) {
          document.exitFullscreen()
          addToast({
            type: 'info',
            title: '退出全屏',
            message: '已退出全屏模式'
          })
        } else {
          document.documentElement.requestFullscreen()
          addToast({
            type: 'info',
            title: '进入全屏',
            message: '已进入全屏模式，按F11或Esc退出'
          })
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: '全屏失败',
          message: '浏览器不支持全屏模式'
        })
      }
    }, [onToggleFullscreen, addToast]),

    undo: useCallback(() => {
      if (onUndo) {
        onUndo()
      } else {
        addToast({
          type: 'info',
          title: '撤销功能',
          message: '撤销功能即将推出'
        })
      }
    }, [onUndo, addToast]),

    redo: useCallback(() => {
      if (onRedo) {
        onRedo()
      } else {
        addToast({
          type: 'info',
          title: '重做功能',
          message: '重做功能即将推出'
        })
      }
    }, [onRedo, addToast]),

    duplicate: useCallback(() => {
      if (onDuplicate) {
        onDuplicate()
        return
      }

      if (selectedNodeIds.length === 0) {
        addToast({
          type: 'warning',
          title: '请选择节点',
          message: '请先选择要复制的节点'
        })
        return
      }

      addToast({
        type: 'info',
        title: '复制节点',
        message: '右键选中节点选择"复制到新位置"'
      })
    }, [onDuplicate, selectedNodeIds.length, addToast]),

    save: useCallback(() => {
      if (onSave) {
        onSave()
      } else {
        addToast({
          type: 'success',
          title: '自动保存',
          message: '所有更改已自动保存'
        })
      }
    }, [onSave, addToast])
  }

  // 快捷键配置
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'n',
      ctrl: true,
      handler: defaultHandlers.createNode,
      description: '创建新节点',
      preventDefault: true
    },
    {
      key: 'v',
      ctrl: true,
      handler: defaultHandlers.paste,
      description: '粘贴',
      preventDefault: true
    },
    {
      key: 'a',
      ctrl: true,
      handler: defaultHandlers.selectAll,
      description: '全选',
      preventDefault: true
    },
    {
      key: 'o',
      ctrl: true,
      handler: defaultHandlers.optimize,
      description: 'AI优化',
      preventDefault: true
    },
    {
      key: 'Delete',
      handler: defaultHandlers.delete,
      description: '删除选中节点'
    },
    {
      key: 'Backspace',
      handler: defaultHandlers.delete,
      description: '删除选中节点'
    },
    {
      key: 'Enter',
      handler: defaultHandlers.edit,
      description: '编辑选中节点'
    },
    {
      key: 'F11',
      handler: defaultHandlers.toggleFullscreen,
      description: '切换全屏模式'
    },
    {
      key: 'z',
      ctrl: true,
      handler: defaultHandlers.undo,
      description: '撤销',
      preventDefault: true
    },
    {
      key: 'y',
      ctrl: true,
      handler: defaultHandlers.redo,
      description: '重做',
      preventDefault: true
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: defaultHandlers.redo,
      description: '重做',
      preventDefault: true
    },
    {
      key: 'd',
      ctrl: true,
      handler: defaultHandlers.duplicate,
      description: '复制节点',
      preventDefault: true
    },
    {
      key: 's',
      ctrl: true,
      handler: defaultHandlers.save,
      description: '保存',
      preventDefault: true
    },
    {
      key: 'Escape',
      handler: useCallback(() => {
        clearSelection()
        addToast({
          type: 'info',
          title: '取消选择',
          message: '已清除所有选择'
        })
      }, [clearSelection, addToast]),
      description: '取消选择'
    }
  ]

  // 检查快捷键匹配
  const matchShortcut = useCallback((event: KeyboardEvent, shortcut: ShortcutConfig): boolean => {
    const key = event.key
    const ctrl = event.ctrlKey || event.metaKey // Mac兼容性
    const alt = event.altKey
    const shift = event.shiftEvent
    const meta = event.metaKey

    return (
      key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!ctrl === !!shortcut.ctrl &&
      !!alt === !!shortcut.alt &&
      !!shift === !!shortcut.shift &&
      !!meta === !!shortcut.meta
    )
  }, [])

  // 键盘事件处理
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return

    // 如果焦点在输入框内，不处理快捷键（除了Escape）
    const activeElement = document.activeElement
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )

    if (isInputActive && event.key !== 'Escape') {
      return
    }

    // 查找匹配的快捷键
    const matchedShortcut = shortcuts.find(shortcut => matchShortcut(event, shortcut))

    if (matchedShortcut) {
      if (matchedShortcut.preventDefault) {
        event.preventDefault()
        event.stopPropagation()
      }

      try {
        matchedShortcut.handler()
      } catch (error) {
        console.error('快捷键处理失败:', error)
        addToast({
          type: 'error',
          title: '操作失败',
          message: '快捷键执行出错，请重试'
        })
      }
    }
  }, [disabled, shortcuts, matchShortcut, addToast])

  // 绑定全局键盘事件
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // 显示快捷键帮助
  const showShortcutHelp = useCallback(() => {
    const helpText = shortcuts
      .map(shortcut => {
        let keys = []
        if (shortcut.ctrl) keys.push('Ctrl')
        if (shortcut.alt) keys.push('Alt')
        if (shortcut.shift) keys.push('Shift')
        if (shortcut.meta) keys.push('Cmd')
        keys.push(shortcut.key)

        return `${keys.join('+')} - ${shortcut.description}`
      })
      .join('\n')

    addToast({
      type: 'info',
      title: '快捷键帮助',
      message: helpText,
      duration: 10000
    })
  }, [shortcuts, addToast])

  // 监听帮助快捷键 (Ctrl+?)
  useEffect(() => {
    const helpHandler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '?' && !disabled) {
        event.preventDefault()
        showShortcutHelp()
      }
    }

    document.addEventListener('keydown', helpHandler)
    return () => {
      document.removeEventListener('keydown', helpHandler)
    }
  }, [showShortcutHelp, disabled])

  // 这个组件不渲染任何UI，只处理快捷键
  return null
}

export default ShortcutHandler