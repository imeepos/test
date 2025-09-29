import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles, Zap, Brain, Bot } from 'lucide-react'
import { cn } from '@/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ai'
  text?: string
  className?: string
  color?: 'primary' | 'secondary' | 'accent' | 'white'
  center?: boolean
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  className,
  color = 'primary',
  center = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const colorClasses = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    accent: 'text-sidebar-accent',
    white: 'text-white',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  const renderSpinner = () => (
    <Loader2 className={cn(sizeClasses[size], colorClasses[color], 'animate-spin')} />
  )

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'rounded-full',
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4',
            colorClasses[color]
          )}
          style={{ backgroundColor: 'currentColor' }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )

  const renderPulse = () => (
    <motion.div
      className={cn(
        'rounded-full border-2',
        sizeClasses[size],
        colorClasses[color]
      )}
      style={{ borderColor: 'currentColor' }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.8, 0.3, 0.8],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )

  const renderBars = () => (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'rounded-sm',
            size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : size === 'lg' ? 'w-2' : 'w-3',
            colorClasses[color]
          )}
          style={{
            backgroundColor: 'currentColor',
            height: size === 'sm' ? '8px' : size === 'md' ? '12px' : size === 'lg' ? '16px' : '20px',
          }}
          animate={{
            scaleY: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )

  const renderAI = () => {
    const icons = [Brain, Sparkles, Zap, Bot]
    const IconComponent = icons[Math.floor(Date.now() / 1000) % icons.length]

    return (
      <div className="relative">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          className={cn(sizeClasses[size], colorClasses[color])}
        >
          <IconComponent className="w-full h-full" />
        </motion.div>

        {/* 环形效果 */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-dashed',
            colorClasses[color]
          )}
          style={{ borderColor: 'currentColor' }}
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      </div>
    )
  }

  const renderLoading = () => {
    switch (variant) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      case 'bars':
        return renderBars()
      case 'ai':
        return renderAI()
      default:
        return renderSpinner()
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2',
        center && 'justify-center min-h-[200px]',
        className
      )}
    >
      {renderLoading()}
      {text && (
        <motion.p
          className={cn(
            textSizes[size],
            colorClasses[color],
            'font-medium'
          )}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// AI专用Loading组件
interface AILoadingProps {
  stage?: 'connecting' | 'processing' | 'generating' | 'optimizing' | 'finalizing'
  progress?: number
  text?: string
  className?: string
}

export const AILoading: React.FC<AILoadingProps> = ({
  stage = 'processing',
  progress,
  text,
  className,
}) => {
  const stageConfig = {
    connecting: {
      icon: Zap,
      text: '连接AI服务...',
      color: 'text-blue-400',
    },
    processing: {
      icon: Brain,
      text: 'AI思考中...',
      color: 'text-purple-400',
    },
    generating: {
      icon: Sparkles,
      text: '生成内容中...',
      color: 'text-green-400',
    },
    optimizing: {
      icon: Zap,
      text: '优化内容中...',
      color: 'text-yellow-400',
    },
    finalizing: {
      icon: Bot,
      text: '完成处理...',
      color: 'text-blue-400',
    },
  }

  const config = stageConfig[stage]
  const IconComponent = config.icon

  return (
    <div className={cn('flex flex-col items-center space-y-4 p-6', className)}>
      {/* AI图标动画 */}
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={cn('w-12 h-12', config.color)}
        >
          <IconComponent className="w-full h-full" />
        </motion.div>

        {/* 环形进度指示器 */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed opacity-30"
          style={{ borderColor: 'currentColor' }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* 粒子效果 */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={cn('absolute w-1 h-1 rounded-full', config.color)}
            style={{
              top: '50%',
              left: '50%',
              backgroundColor: 'currentColor',
            }}
            animate={{
              x: [0, Math.cos(i * 120) * 30, 0],
              y: [0, Math.sin(i * 120) * 30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* 文本信息 */}
      <motion.div
        className="text-center"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className={cn('text-sm font-medium', config.color)}>
          {text || config.text}
        </p>
      </motion.div>

      {/* 进度条 */}
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', config.color.replace('text-', 'bg-'))}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* 可选的取消按钮或其他操作 */}
    </div>
  )
}

// 内联Loading组件
export const InlineLoading: React.FC<{
  size?: 'sm' | 'md'
  text?: string
  className?: string
}> = ({ size = 'sm', text, className }) => (
  <div className={cn('inline-flex items-center gap-2', className)}>
    <Loader2 className={cn(
      'animate-spin',
      size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
      'text-sidebar-accent'
    )} />
    {text && (
      <span className={cn(
        'font-medium',
        size === 'sm' ? 'text-sm' : 'text-base',
        'text-sidebar-text-muted'
      )}>
        {text}
      </span>
    )}
  </div>
)

// 骨架屏组件
export const Skeleton: React.FC<{
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gradient-to-r from-sidebar-hover via-sidebar-border to-sidebar-hover bg-[length:200%_100%]'

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[wave_2s_ease-in-out_infinite]',
    none: '',
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width,
        height: height,
        ...(animation === 'wave' && {
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'wave 2s ease-in-out infinite',
        })
      }}
    />
  )
}

export default Loading