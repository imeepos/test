import React from 'react'
import { SearchInput } from '@/components/ui'
import { useCanvasStore, useNodeStore } from '@/stores'

const SearchBox: React.FC = () => {
  const {
    searchQuery,
    updateSearch,
    setFilteredNodeIds,
  } = useCanvasStore()

  const { searchNodes } = useNodeStore()

  // 处理搜索
  const handleSearchChange = React.useCallback(
    (value: string) => {
      updateSearch(value)
      
      // 实时搜索并更新筛选结果
      const filteredNodes = searchNodes(value)
      const filteredIds = filteredNodes.map(node => node.id)
      setFilteredNodeIds(filteredIds)
    },
    [updateSearch, searchNodes, setFilteredNodeIds]
  )

  // 清空搜索
  const handleClear = React.useCallback(() => {
    handleSearchChange('')
  }, [handleSearchChange])

  // 防抖处理
  const [localValue, setLocalValue] = React.useState(searchQuery)
  const debounceTimerRef = React.useRef<number>()

  React.useEffect(() => {
    setLocalValue(searchQuery)
  }, [searchQuery])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalValue(value)

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 设置新的防抖定时器
    debounceTimerRef.current = window.setTimeout(() => {
      handleSearchChange(value)
    }, 300)
  }

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // 快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + F 聚焦搜索框
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="space-y-2">
      <SearchInput
        value={localValue}
        onChange={handleInputChange}
        onClear={handleClear}
        placeholder="搜索组件内容、标题、标签..."
        className="w-full"
        title="快捷键: Ctrl + F"
      />
      
      {searchQuery && (
        <div className="text-xs text-sidebar-text-muted">
          {searchQuery ? (
            <>
              正在搜索 "<span className="text-sidebar-accent">{searchQuery}</span>"
            </>
          ) : (
            '输入关键词搜索组件'
          )}
        </div>
      )}
    </div>
  )
}

export { SearchBox }