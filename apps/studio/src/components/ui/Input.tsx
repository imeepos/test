import React from 'react'
import { LucideIcon } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      flex h-9 rounded-lg border border-sidebar-border bg-sidebar-surface px-3 py-1
      text-sm text-sidebar-text placeholder:text-sidebar-text-muted
      file:border-0 file:bg-transparent file:text-sm file:font-medium
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent
      disabled:cursor-not-allowed disabled:opacity-50
      transition-colors
    `

    const errorClasses = error
      ? 'border-red-500 focus-visible:ring-red-500'
      : ''

    const iconClasses = Icon
      ? iconPosition === 'left'
        ? 'pl-9'
        : 'pr-9'
      : ''

    const classes = `
      ${baseClasses}
      ${errorClasses}
      ${iconClasses}
      ${fullWidth ? 'w-full' : ''}
      ${className || ''}
    `.replace(/\s+/g, ' ').trim()

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="text-sm font-medium text-sidebar-text mb-2 block">
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && (
            <Icon
              className={`
                absolute top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-text-muted
                ${iconPosition === 'left' ? 'left-3' : 'right-3'}
              `}
            />
          )}
          
          <input
            type={type}
            className={classes}
            ref={ref}
            disabled={disabled}
            {...props}
          />
        </div>
        
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// 搜索输入框组件
export interface SearchInputProps extends Omit<InputProps, 'icon' | 'iconPosition'> {
  onClear?: () => void
  showClear?: boolean
}

import { Search, X } from 'lucide-react'

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onClear,
      showClear = true,
      placeholder = '搜索...',
      ...props
    },
    ref
  ) => {
    const hasValue = value && String(value).length > 0

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-text-muted" />
        
        <Input
          ref={ref}
          value={value}
          placeholder={placeholder}
          className="pl-9 pr-9"
          {...props}
        />
        
        {showClear && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-text-muted hover:text-sidebar-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

export { Input, SearchInput }