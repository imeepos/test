import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2 rounded-lg font-medium
      transition-colors focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-sidebar-accent focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
    `

    const variants = {
      primary: `
        bg-sidebar-accent hover:bg-sidebar-accent/90 
        text-white shadow-sm
      `,
      secondary: `
        bg-sidebar-surface hover:bg-sidebar-hover 
        text-sidebar-text border border-sidebar-border
      `,
      ghost: `
        hover:bg-sidebar-hover hover:text-sidebar-text
        text-sidebar-text-muted
      `,
      danger: `
        bg-red-600 hover:bg-red-700 
        text-white shadow-sm
      `,
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-9 px-4 py-2',
      lg: 'h-10 px-6 text-lg',
    }

    const classes = `
      ${baseClasses}
      ${variants[variant]}
      ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className || ''}
    `.replace(/\s+/g, ' ').trim()

    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

    const { 
      onAnimationStart, 
      onDragStart, 
      onDrag, 
      onDragEnd,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      ...restProps 
    } = props

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        {...restProps}
      >
        {loading && (
          <motion.div
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
        
        {!loading && Icon && iconPosition === 'left' && (
          <Icon size={iconSize} />
        )}
        
        {children}
        
        {!loading && Icon && iconPosition === 'right' && (
          <Icon size={iconSize} />
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }