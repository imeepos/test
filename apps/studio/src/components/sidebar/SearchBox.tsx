import React, { useState } from 'react'
import { SearchInput } from '@/components/ui'
import { useCanvasStore, useNodeStore } from '@/stores'
import { Filter, X, ChevronDown, Star, Hash, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchNodes, filterNodes, sortNodes } from '@/utils/node'
import type { ImportanceLevel } from '@/types'

interface AdvancedFilters {
  importance: ImportanceLevel[]
  tags: string[]
  status: string[]
  confidence: { min?: number; max?: number }
  sortBy: 'importance' | 'confidence' | 'created' | 'updated' | 'title'
  sortOrder: 'asc' | 'desc'
}

const SearchBox: React.FC = () => {
  const {
    searchQuery,
    updateSearch,
    setFilteredNodeIds,
  } = useCanvasStore()

  const { getNodes } = useNodeStore()

  // 高级筛选状态
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<AdvancedFilters>({
    importance: [],
    tags: [],
    status: [],
    confidence: {},
    sortBy: 'updated',
    sortOrder: 'desc'
  })

  // 获取所有可用标签
  const allTags = React.useMemo(() => {
    const tags = new Set<string>()
    getNodes().forEach(node => {
      node.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [getNodes])

  // 执行搜索和筛选
  const performSearch = React.useCallback((query: string, currentFilters: AdvancedFilters) => {
    let nodes = getNodes()

    // 文本搜索
    if (query.trim()) {
      nodes = searchNodes(nodes, query)
    }

    // 高级筛选
    if (currentFilters.importance.length > 0 ||
        currentFilters.tags.length > 0 ||
        currentFilters.status.length > 0 ||
        currentFilters.confidence.min !== undefined ||
        currentFilters.confidence.max !== undefined) {
      nodes = filterNodes(nodes, {
        importance: currentFilters.importance.length > 0 ? currentFilters.importance : undefined,
        tags: currentFilters.tags.length > 0 ? currentFilters.tags : undefined,
        status: currentFilters.status.length > 0 ? currentFilters.status : undefined,
        confidence: Object.keys(currentFilters.confidence).length > 0 ? currentFilters.confidence : undefined
      })
    }

    // 排序
    nodes = sortNodes(nodes, currentFilters.sortBy, currentFilters.sortOrder)

    // 更新筛选结果
    setFilteredNodeIds(nodes.map(node => node.id))
  }, [getNodes, setFilteredNodeIds])

  // 处理搜索
  const handleSearchChange = React.useCallback(
    (value: string) => {
      updateSearch(value)
      performSearch(value, filters)
    },
    [updateSearch, performSearch, filters]
  )

  // 清空搜索
  const handleClear = React.useCallback(() => {
    handleSearchChange('')
  }, [handleSearchChange])

  // 清空所有筛选
  const handleClearAllFilters = React.useCallback(() => {
    const newFilters = {
      importance: [],
      tags: [],
      status: [],
      confidence: {},
      sortBy: 'updated' as const,
      sortOrder: 'desc' as const
    }
    setFilters(newFilters)
    performSearch(searchQuery, newFilters)
  }, [performSearch, searchQuery])

  // 更新筛选条件
  const updateFilter = React.useCallback((key: keyof AdvancedFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    performSearch(searchQuery, newFilters)
  }, [filters, performSearch, searchQuery])

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
        const searchInput = document.querySelector('input[placeholder*="检索"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 计算活跃筛选数量
  const activeFilterCount = filters.importance.length + filters.tags.length + filters.status.length +
    (filters.confidence.min !== undefined ? 1 : 0) + (filters.confidence.max !== undefined ? 1 : 0)

  return (
    <div className="space-y-3">
      {/* 搜索框容器 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchInput
            value={localValue}
            onChange={handleInputChange}
            onClear={handleClear}
            placeholder="检索"
            className="w-full"
            title="快捷键: Ctrl + F"
          />
        </div>

        {/* 筛选按钮 - 独立放置在搜索框右侧 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            relative flex-shrink-0 p-2 rounded-lg border
            transition-colors duration-200
            ${showFilters
              ? 'text-sidebar-accent bg-sidebar-accent/10 border-sidebar-accent'
              : 'text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-hover border-sidebar-border'
            }
          `}
          title="高级筛选"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-sidebar-accent text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 搜索状态 */}
      {searchQuery && (
        <div className="text-xs text-sidebar-text-muted">
          正在搜索 "<span className="text-sidebar-accent">{searchQuery}</span>"
        </div>
      )}

      {/* 高级筛选面板 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-sidebar-surface border border-sidebar-border rounded-lg"
          >
            <div className="p-3 space-y-4">
              {/* 筛选标题 */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-sidebar-text flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  高级筛选
                </h4>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearAllFilters}
                    className="text-xs text-sidebar-text-muted hover:text-sidebar-accent flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    清空
                  </button>
                )}
              </div>

              {/* 重要性筛选 */}
              <div>
                <label className="text-xs text-sidebar-text-muted mb-2 flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  重要性
                </label>
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        const newImportance = filters.importance.includes(level as ImportanceLevel)
                          ? filters.importance.filter(i => i !== level)
                          : [...filters.importance, level as ImportanceLevel]
                        updateFilter('importance', newImportance)
                      }}
                      className={`
                        px-2 py-1 text-xs rounded transition-colors
                        ${filters.importance.includes(level as ImportanceLevel)
                          ? 'bg-sidebar-accent text-white'
                          : 'bg-sidebar-hover text-sidebar-text hover:bg-sidebar-accent/20'
                        }
                      `}
                    >
                      {'★'.repeat(level)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标签筛选 */}
              {allTags.length > 0 && (
                <div>
                  <label className="text-xs text-sidebar-text-muted mb-2 flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    标签
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = filters.tags.includes(tag)
                            ? filters.tags.filter(t => t !== tag)
                            : [...filters.tags, tag]
                          updateFilter('tags', newTags)
                        }}
                        className={`
                          px-2 py-1 text-xs rounded transition-colors
                          ${filters.tags.includes(tag)
                            ? 'bg-sidebar-accent text-white'
                            : 'bg-sidebar-hover text-sidebar-text hover:bg-sidebar-accent/20'
                          }
                        `}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 排序 */}
              <div>
                <label className="text-xs text-sidebar-text-muted mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  排序方式
                </label>
                <div className="flex gap-1">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-sidebar-hover border border-sidebar-border rounded text-sidebar-text"
                  >
                    <option value="updated">更新时间</option>
                    <option value="created">创建时间</option>
                    <option value="importance">重要性</option>
                    <option value="confidence">置信度</option>
                    <option value="title">标题</option>
                  </select>
                  <button
                    onClick={() => updateFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
                    className={`
                      px-2 py-1 text-xs rounded transition-colors
                      ${filters.sortOrder === 'desc'
                        ? 'bg-sidebar-accent text-white'
                        : 'bg-sidebar-hover text-sidebar-text'
                      }
                    `}
                  >
                    {filters.sortOrder === 'desc' ? '↓' : '↑'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { SearchBox }