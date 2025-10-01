/**
 * 快捷键帮助Hook
 * 管理快捷键帮助模态框的显示状态
 */

import { useEffect, useState } from 'react'

export const useShortcutHelp = () => {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  // 监听 Ctrl+? 快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '?') {
        event.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
