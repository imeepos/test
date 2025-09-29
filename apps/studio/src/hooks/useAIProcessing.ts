import { useState, useCallback, useRef, useEffect } from 'react'
import { useUIStore } from '@/stores'

export interface AIProcessingOptions {
  nodeId?: string
  type: 'create' | 'update' | 'optimize' | 'expand' | 'fusion'
  description: string
  estimatedDuration?: number
  canCancel?: boolean
  stages?: Array<{
    name: 'connecting' | 'processing' | 'generating' | 'optimizing' | 'finalizing'
    duration: number
    description: string
  }>
}

export interface AIProcessingState {
  isProcessing: boolean
  stage: 'connecting' | 'processing' | 'generating' | 'optimizing' | 'finalizing'
  progress: number
  currentStageIndex: number
  error: Error | null
  canCancel: boolean
  elapsedTime: number
}

export const useAIProcessing = () => {
  const { addToast, setLoading } = useUIStore()
  const [state, setState] = useState<AIProcessingState>({
    isProcessing: false,
    stage: 'connecting',
    progress: 0,
    currentStageIndex: 0,
    error: null,
    canCancel: true,
    elapsedTime: 0,
  })

  const processingRef = useRef<{
    startTime: Date
    options: AIProcessingOptions | null
    progressTimer: number | null
    elapsedTimer: number | null
    cancelled: boolean
  }>({
    startTime: new Date(),
    options: null,
    progressTimer: null,
    elapsedTimer: null,
    cancelled: false,
  })

  // 开始AI处理
  const startProcessing = useCallback(async (
    options: AIProcessingOptions,
    processingFunction: (updateProgress: (progress: number, stage?: string) => void) => Promise<any>
  ): Promise<any> => {
    // 重置状态
    processingRef.current.cancelled = false
    processingRef.current.options = options
    processingRef.current.startTime = new Date()

    setState({
      isProcessing: true,
      stage: 'connecting',
      progress: 0,
      currentStageIndex: 0,
      error: null,
      canCancel: options.canCancel ?? true,
      elapsedTime: 0,
    })

    // 设置全局loading状态
    const loadingKey = `ai-${options.type}-${options.nodeId || 'global'}`
    setLoading(loadingKey, true)

    // 启动计时器
    processingRef.current.elapsedTimer = window.setInterval(() => {
      const elapsed = Date.now() - processingRef.current.startTime.getTime()
      setState(prev => ({ ...prev, elapsedTime: elapsed }))
    }, 100)

    try {
      // 显示开始提示
      addToast({
        type: 'info',
        title: 'AI处理开始',
        message: options.description,
        duration: 2000,
      })

      // 进度更新函数
      const updateProgress = (progress: number, stage?: string) => {
        if (processingRef.current.cancelled) {
          throw new Error('Processing cancelled by user')
        }

        setState(prev => ({
          ...prev,
          progress: Math.max(0, Math.min(100, progress)),
          ...(stage && { stage: stage as any }),
        }))
      }

      // 模拟阶段性进度（如果有定义stages）
      if (options.stages && options.stages.length > 0) {
        let currentProgress = 0
        const progressPerStage = 100 / options.stages.length

        for (let i = 0; i < options.stages.length; i++) {
          if (processingRef.current.cancelled) break

          const currentStage = options.stages[i]
          setState(prev => ({
            ...prev,
            stage: currentStage.name,
            currentStageIndex: i,
          }))

          // 模拟该阶段的进度
          const stageStartProgress = currentProgress
          const stageEndProgress = stageStartProgress + progressPerStage

          const stageProgressTimer = setInterval(() => {
            currentProgress += progressPerStage / (currentStage.duration / 100)
            updateProgress(Math.min(stageEndProgress, currentProgress))

            if (currentProgress >= stageEndProgress) {
              clearInterval(stageProgressTimer)
            }
          }, 100)

          // 等待该阶段完成
          await new Promise(resolve => setTimeout(resolve, currentStage.duration))
          clearInterval(stageProgressTimer)
          currentProgress = stageEndProgress
        }
      }

      // 执行实际的处理函数
      const result = await processingFunction(updateProgress)

      // 完成处理
      setState(prev => ({
        ...prev,
        progress: 100,
        stage: 'finalizing',
      }))

      // 短暂延迟以显示完成状态
      await new Promise(resolve => setTimeout(resolve, 500))

      // 显示成功提示
      addToast({
        type: 'success',
        title: 'AI处理完成',
        message: `${options.description} 已完成`,
      })

      return result

    } catch (error: any) {
      console.error('AI processing failed:', error)

      setState(prev => ({
        ...prev,
        error,
        isProcessing: false,
      }))

      // 显示错误提示
      addToast({
        type: 'error',
        title: 'AI处理失败',
        message: error.message || '处理过程中发生错误',
        persistent: true,
        actions: [
          {
            label: '重试',
            onClick: () => {
              // 这里可以实现重试逻辑
            }
          }
        ]
      })

      throw error

    } finally {
      // 清理状态
      setState(prev => ({
        ...prev,
        isProcessing: false,
      }))

      setLoading(loadingKey, false)

      // 清理计时器
      if (processingRef.current.progressTimer) {
        clearInterval(processingRef.current.progressTimer)
      }
      if (processingRef.current.elapsedTimer) {
        clearInterval(processingRef.current.elapsedTimer)
      }
    }
  }, [addToast, setLoading])

  // 取消处理
  const cancelProcessing = useCallback(() => {
    processingRef.current.cancelled = true

    setState(prev => ({
      ...prev,
      isProcessing: false,
      error: new Error('Processing cancelled by user'),
    }))

    addToast({
      type: 'warning',
      title: '处理已取消',
      message: '用户取消了AI处理操作',
    })
  }, [addToast])

  // 清理错误状态
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (processingRef.current.progressTimer) {
        clearInterval(processingRef.current.progressTimer)
      }
      if (processingRef.current.elapsedTimer) {
        clearInterval(processingRef.current.elapsedTimer)
      }
    }
  }, [])

  return {
    ...state,
    startProcessing,
    cancelProcessing,
    clearError,
  }
}

// 便捷的AI处理包装器Hook
export const useAICall = () => {
  const processing = useAIProcessing()

  const callAI = useCallback(async <T>(
    description: string,
    aiFunction: () => Promise<T>,
    options?: Partial<AIProcessingOptions>
  ): Promise<T> => {
    return processing.startProcessing(
      {
        type: 'update',
        description,
        canCancel: true,
        ...options,
      },
      async (updateProgress) => {
        // 简单的进度模拟
        updateProgress(10, 'connecting')
        await new Promise(resolve => setTimeout(resolve, 200))

        updateProgress(30, 'processing')
        const result = await aiFunction()

        updateProgress(90, 'finalizing')
        await new Promise(resolve => setTimeout(resolve, 100))

        return result
      }
    )
  }, [processing])

  return {
    ...processing,
    callAI,
  }
}

export default useAIProcessing