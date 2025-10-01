/**
 * 快捷键帮助模态框
 * 显示所有可用的键盘快捷键
 */

import React from 'react'
import { Modal } from '@/components/ui'
import { X, Keyboard } from 'lucide-react'

interface ShortcutItem {
  keys: string[]
  description: string
  category: string
}

interface ShortcutHelpProps {
  isOpen: boolean
  onClose: () => void
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose }) => {
  const shortcuts: ShortcutItem[] = [
    // 节点操作
    { keys: ['Ctrl', 'N'], description: '创建新节点', category: '节点操作' },
    { keys: ['Enter'], description: '编辑选中节点', category: '节点操作' },
    { keys: ['Delete'], description: '删除选中节点', category: '节点操作' },
    { keys: ['Backspace'], description: '删除选中节点', category: '节点操作' },
    { keys: ['Ctrl', 'D'], description: '复制节点', category: '节点操作' },
    { keys: ['Ctrl', 'O'], description: 'AI优化节点', category: '节点操作' },

    // 编辑操作
    { keys: ['Ctrl', 'A'], description: '全选节点', category: '编辑操作' },
    { keys: ['Ctrl', 'V'], description: '粘贴', category: '编辑操作' },
    { keys: ['Ctrl', 'Z'], description: '撤销（开发中）', category: '编辑操作' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: '重做（开发中）', category: '编辑操作' },
    { keys: ['Ctrl', 'Y'], description: '重做（开发中）', category: '编辑操作' },
    { keys: ['Esc'], description: '取消选择', category: '编辑操作' },

    // 视图操作
    { keys: ['F11'], description: '切换全屏模式', category: '视图操作' },
    { keys: ['Ctrl', 'F'], description: '聚焦搜索', category: '视图操作' },
    { keys: ['Tab'], description: '切换视图模式', category: '视图操作' },

    // 系统操作
    { keys: ['Ctrl', 'S'], description: '保存（自动保存已启用）', category: '系统操作' },
    { keys: ['Ctrl', '?'], description: '显示快捷键帮助', category: '系统操作' },
  ]

  // 按类别分组
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, ShortcutItem[]>)

  const renderKey = (key: string) => {
    // 检测操作系统，Mac使用Cmd图标
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const displayKey = key === 'Ctrl' && isMac ? '⌘' : key

    return (
      <kbd
        key={key}
        className="
          px-2 py-1
          text-xs font-semibold
          bg-sidebar-bg border border-sidebar-border
          rounded
          shadow-sm
          text-sidebar-text
        "
      >
        {displayKey}
      </kbd>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="max-w-3xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Keyboard className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-sidebar-text">快捷键帮助</h2>
              <p className="text-sm text-sidebar-text-muted mt-1">
                使用键盘快捷键提高工作效率
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="
              p-2
              text-sidebar-text-muted hover:text-sidebar-text
              hover:bg-sidebar-bg rounded-lg
              transition-colors
            "
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-sidebar-text mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary-500 rounded"></div>
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="
                      flex items-center justify-between
                      p-3
                      bg-canvas-bg hover:bg-sidebar-bg
                      rounded-lg
                      transition-colors
                      group
                    "
                  >
                    <span className="text-sidebar-text group-hover:text-primary-500 transition-colors">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-sidebar-text-muted mx-1">+</span>
                          )}
                          {renderKey(key)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 提示信息 */}
        <div className="mt-6 pt-4 border-t border-sidebar-border">
          <div className="flex items-start gap-2 text-sm text-sidebar-text-muted">
            <div className="flex-shrink-0 mt-0.5">💡</div>
            <div>
              <p className="mb-1">
                <strong className="text-sidebar-text">提示：</strong>
                在Mac系统上，Ctrl键对应Command键（⌘）
              </p>
              <p>
                按 <kbd className="px-1.5 py-0.5 bg-sidebar-bg border border-sidebar-border rounded text-xs">Ctrl+?</kbd> 随时打开此帮助窗口
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ShortcutHelp
