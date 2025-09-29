import React, { forwardRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils'

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  loading?: boolean
  icon?: React.ComponentType<{ className?: string }>
  clearable?: boolean
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    className,
    value = '',
    onChange,
    onClear,
    loading = false,
    icon: Icon = Search,
    clearable = true,
    placeholder = '搜索...',
    disabled,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const handleClear = () => {
      onClear?.()
    }

    const showClearButton = clearable && value.length > 0 && !loading && !disabled

    return (
      <div
        className={cn(
          "relative flex items-center",
          "border border-sidebar-border rounded-md",
          "transition-colors duration-200",
          isFocused ? "border-sidebar-accent" : "border-sidebar-border",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {/* 搜索图标 */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          <Icon
            className={cn(
              "h-4 w-4 transition-colors",
              isFocused
                ? "text-sidebar-accent"
                : "text-sidebar-text-muted"
            )}
          />
        </div>

        {/* 输入框 */}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-10 py-2",
            "bg-transparent text-sidebar-text",
            "placeholder:text-sidebar-text-muted",
            "focus:outline-none",
            "disabled:cursor-not-allowed"
          )}
          {...props}
        />

        {/* 清除按钮 */}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute right-3 p-1 rounded",
              "text-sidebar-text-muted hover:text-sidebar-text",
              "transition-colors duration-200",
              "hover:bg-sidebar-hover"
            )}
            aria-label="清除搜索"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="absolute right-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-sidebar-text-muted border-t-sidebar-accent" />
          </div>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

export default SearchInput