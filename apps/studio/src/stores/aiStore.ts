import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { websocketService } from '@/services'
import { useNodeStore } from './nodeStore'
import type {
  AIProcessingState,
  AIGenerateRequest,
  AIGenerateResponse,
  AIModel,
  ProcessingRecord,
  WebSocketStatus,
  NodeMetadata
} from '@/types'

export interface AIState {
  // AI处理状态
  processingNodes: Map<string, AIProcessingState>
  recentResults: Map<string, AIGenerateResponse>
  
  // WebSocket连接状态
  connectionStatus: WebSocketStatus
  lastConnectionTime?: Date
  reconnectAttempts: number
  
  // AI配置
  currentModel: AIModel
  isAvailable: boolean
  
  // 性能指标
  metrics: {
    requestCount: number
    successCount: number
    errorCount: number
    averageResponseTime: number
    totalResponseTime: number
  }
  
  // 请求队列
  requestQueue: Array<{
    id: string
    request: AIGenerateRequest
    priority: number
    createdAt: Date
  }>
  
  // Actions
  startProcessing: (nodeId: string, request: AIGenerateRequest) => void
  updateProcessingStatus: (nodeId: string, status: Partial<AIProcessingState>) => void
  completeProcessing: (nodeId: string, result: AIGenerateResponse) => void
  failProcessing: (nodeId: string, error: string) => void
  
  // WebSocket管理
  setConnectionStatus: (status: WebSocketStatus) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  connectWebSocket: () => Promise<void>
  disconnectWebSocket: () => void
  initializeWebSocket: () => Promise<(() => void) | void>
  
  // 配置管理
  setModel: (model: AIModel) => void
  setAvailable: (available: boolean) => void
  
  // 指标更新
  recordRequest: () => void
  recordSuccess: (responseTime: number) => void
  recordError: () => void
  
  // 队列管理
  addToQueue: (request: AIGenerateRequest, priority?: number) => string
  removeFromQueue: (id: string) => void
  getNextInQueue: () => { id: string; request: AIGenerateRequest } | undefined
  clearQueue: () => void
  
  // 结果缓存
  cacheResult: (inputs: string[], result: AIGenerateResponse) => void
  getCachedResult: (inputs: string[]) => AIGenerateResponse | undefined
  clearCache: () => void

  // 队列请求处理
  processQueuedRequests: () => Promise<void>
}

const generateRequestId = () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const DEFAULT_CONFIDENCE = 0.8
const FALLBACK_TITLE = 'AI生成结果'
const VALID_AI_MODELS: AIModel[] = ['gpt-3.5-turbo', 'gpt-4', 'claude-3', 'local']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
  }

  return []
}

const normalizeConfidence = (value: unknown): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    const normalized = value > 1 ? value / 100 : value
    return Math.max(0, Math.min(1, normalized))
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed)) {
      const normalized = parsed > 1 ? parsed / 100 : parsed
      return Math.max(0, Math.min(1, normalized))
    }
  }

  return DEFAULT_CONFIDENCE
}

const normalizeMetadata = (value: unknown): AIGenerateResponse['metadata'] | undefined => {
  if (!isRecord(value)) {
    return undefined
  }

  const modelValue = value.model
  const model =
    typeof modelValue === 'string' && VALID_AI_MODELS.includes(modelValue as AIModel)
      ? (modelValue as AIModel)
      : undefined

  const requestId = typeof value.requestId === 'string' ? value.requestId : undefined
  const processingTime = typeof value.processingTime === 'number' ? value.processingTime : undefined
  const tokenCount = typeof value.tokenCount === 'number' ? value.tokenCount : undefined

  const metadata: AIGenerateResponse['metadata'] = {}

  if (requestId) metadata.requestId = requestId
  if (model) metadata.model = model
  if (processingTime !== undefined) metadata.processingTime = processingTime
  if (tokenCount !== undefined) metadata.tokenCount = tokenCount
  if ('error' in value) metadata.error = value.error

  return Object.keys(metadata).length > 0 ? metadata : undefined
}

const normalizeSuggestions = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined
  }

  const suggestions = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return suggestions.length > 0 ? suggestions : undefined
}

const normalizeAIGenerateResponse = (input: unknown): AIGenerateResponse => {
  const sources: Record<string, unknown>[] = []

  if (isRecord(input)) {
    sources.push(input)

    if (isRecord(input.result)) {
      sources.push(input.result as Record<string, unknown>)
    }

    if (isRecord(input.payload)) {
      sources.push(input.payload as Record<string, unknown>)
    }
  }

  const pickString = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      for (const source of sources) {
        const value = source[key]
        if (typeof value === 'string' && value.trim().length > 0) {
          return value
        }
      }
    }
    return undefined
  }

  const pickArray = (key: string): unknown[] | undefined => {
    for (const source of sources) {
      const value = source[key]
      if (Array.isArray(value) && value.length > 0) {
        return value
      }
    }
    return undefined
  }

  const rawContent = (() => {
    const prioritizedContent = pickString('content', 'expandedContent', 'expanded_content', 'text', 'message', 'output')
    if (prioritizedContent) {
      return prioritizedContent
    }

    const contentArray = pickArray('content')
    if (contentArray) {
      return contentArray
        .filter((item): item is string => typeof item === 'string')
        .join('\n')
    }

    const expandedContentArray = pickArray('expandedContent') || pickArray('expanded_content')
    if (expandedContentArray) {
      return expandedContentArray
        .filter((item): item is string => typeof item === 'string')
        .join('\n')
    }

    if (typeof input === 'string') {
      return input
    }

    return ''
  })()

  const content = rawContent || ''

  const titleCandidate = pickString('title') || ''
  const title = titleCandidate.length > 0 ? titleCandidate : (content ? content.slice(0, 50) : FALLBACK_TITLE)

  const reasoning = pickString('reasoning')
  const semanticType = pickString('semantic_type')

  const importance = (() => {
    for (const source of sources) {
      const value = source.importance
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value
      }
    }
    return undefined
  })()

  const userRating = (() => {
    for (const source of sources) {
      const value = source.user_rating
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value
      }
    }
    return undefined
  })()

  const confidenceSource = (() => {
    for (const source of sources) {
      if ('confidence' in source) {
        return source.confidence
      }
    }
    return undefined
  })()

  const tagsSource = (() => {
    const arrayValue = pickArray('tags')
    if (arrayValue) {
      return arrayValue
    }

    const stringValue = pickString('tags')
    if (stringValue) {
      return stringValue
    }

    return undefined
  })()

  const suggestionsSource = (() => {
    const arrayValue = pickArray('suggestions')
    if (arrayValue) {
      return arrayValue
    }

    return undefined
  })()

  const metadataSource = (() => {
    for (const source of sources) {
      if (isRecord(source.metadata)) {
        return source.metadata
      }
    }
    return undefined
  })()

  return {
    content,
    title,
    confidence: normalizeConfidence(confidenceSource),
    tags: normalizeTags(tagsSource),
    reasoning: reasoning ?? undefined,
    suggestions: normalizeSuggestions(suggestionsSource),
    importance,
    semantic_type: semanticType,
    user_rating: userRating,
    metadata: normalizeMetadata(metadataSource)
  }
}

export const useAIStore = create<AIState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      processingNodes: new Map(),
      recentResults: new Map(),
      connectionStatus: 'disconnected',
      reconnectAttempts: 0,
      currentModel: 'gpt-3.5-turbo',
      isAvailable: false,
      metrics: {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        totalResponseTime: 0,
      },
      requestQueue: [],
      
      // AI处理管理
      startProcessing: (nodeId, request) => {
        console.log('🚀 startProcessing called:', { nodeId, request })

        const processingState: AIProcessingState = {
          nodeId,
          status: 'queued',
          startTime: new Date(),
        }

        set((state) => {
          const newProcessingNodes = new Map(state.processingNodes)
          newProcessingNodes.set(nodeId, processingState)
          return { processingNodes: newProcessingNodes }
        })

        // 将请求添加到队列，确保断线重连后可以继续处理
        const queueId = get().addToQueue(request, 1)
        console.log('📥 Request added to queue:', { queueId, queueLength: get().requestQueue.length })

        // 如果已连接，立即处理队列
        const connectionStatus = get().connectionStatus
        console.log('🔌 Connection status:', connectionStatus)

        if (connectionStatus === 'connected') {
          console.log('✅ Connection is ready, processing queue immediately')
          get().processQueuedRequests()
        } else {
          console.warn('⚠️ Connection not ready, request queued until connection is established')
        }
      },
      
      updateProcessingStatus: (nodeId, updates) => {
        set((state) => {
          const newProcessingNodes = new Map(state.processingNodes)
          const current = newProcessingNodes.get(nodeId)
          if (current) {
            newProcessingNodes.set(nodeId, { ...current, ...updates })
          }
          return { processingNodes: newProcessingNodes }
        })
      },
      
      completeProcessing: (nodeId, result) => {
        const normalizedResult = normalizeAIGenerateResponse(result)

        set((state) => {
          const newProcessingNodes = new Map(state.processingNodes)
          const newRecentResults = new Map(state.recentResults)

          const processingState = newProcessingNodes.get(nodeId)
          if (processingState) {
            const responseTime = Date.now() - processingState.startTime.getTime()
            get().recordSuccess(responseTime)

            newProcessingNodes.set(nodeId, {
              ...processingState,
              status: 'completed',
              endTime: new Date(),
            })
          }

          newRecentResults.set(nodeId, normalizedResult)

          // 限制缓存大小
          if (newRecentResults.size > 50) {
            const firstKey = newRecentResults.keys().next().value
            if (firstKey) {
              newRecentResults.delete(firstKey)
            }
          }

          return {
            processingNodes: newProcessingNodes,
            recentResults: newRecentResults,
          }
        })

        // ✅ 后端已更新数据库，前端同步更新nodeStore以立即刷新UI
        console.log('✅ AI生成完成，结果已由后端更新到数据库:', nodeId)
        console.log('🔄 同步更新前端nodeStore:', normalizedResult)

        const nodeStore = useNodeStore.getState()
        const currentNode = nodeStore.getNode(nodeId)

        if (!currentNode) {
          console.warn('⚠️ 无法在nodeStore中找到对应节点，跳过前端同步:', nodeId)
          return
        }

        const placeholderTags = new Set(['AI生成中', 'AI修改中'])
        const sanitizedTags = normalizedResult.tags.length > 0
          ? normalizedResult.tags
          : currentNode.tags.filter(tag => !placeholderTags.has(tag))

        const aiMetadata = normalizedResult.metadata
        const existingMetadata = currentNode.metadata || { semantic: [], editCount: 0 }

        const processingRecord: ProcessingRecord = {
          timestamp: new Date(),
          operation: 'ai-generate',
          modelUsed: aiMetadata?.model,
          tokenCount: typeof aiMetadata?.tokenCount === 'number' ? aiMetadata.tokenCount : undefined,
          processingTime: typeof aiMetadata?.processingTime === 'number' ? aiMetadata.processingTime : 0,
          confidenceBefore: currentNode.confidence,
          confidenceAfter: normalizedResult.confidence,
        }

        const processingHistory = existingMetadata.processingHistory ?? []
        const nextProcessingHistory = [...processingHistory.slice(-9), processingRecord]

        const metadataUpdates: NodeMetadata = {
          ...existingMetadata,
          editCount: (existingMetadata.editCount ?? 0) + 1,
          lastModified: new Date(),
          processingHistory: nextProcessingHistory,
          error: typeof aiMetadata?.error === 'string' ? aiMetadata.error : undefined,
        }

        nodeStore.updateNode(nodeId, {
          status: 'completed',
          content: normalizedResult.content,
          title: normalizedResult.title ?? currentNode.title,
          tags: sanitizedTags,
          confidence: normalizedResult.confidence,
          metadata: metadataUpdates,
        })
      },
      
      failProcessing: (nodeId, error) => {
        set((state) => {
          const newProcessingNodes = new Map(state.processingNodes)
          const processingState = newProcessingNodes.get(nodeId)

          if (processingState) {
            newProcessingNodes.set(nodeId, {
              ...processingState,
              status: 'failed',
              endTime: new Date(),
              error,
            })
          }

          return { processingNodes: newProcessingNodes }
        })

        get().recordError()

        // ✅ 不更新节点！失败由调用方(CanvasPage)处理
        // aiStore 只负责记录统计信息
        console.log('❌ AI生成失败:', nodeId, error)
      },
      
      // WebSocket连接管理
      setConnectionStatus: (connectionStatus) => {
        set({
          connectionStatus,
          lastConnectionTime: connectionStatus === 'connected' ? new Date() : get().lastConnectionTime,
          isAvailable: connectionStatus === 'connected',
        })

        if (connectionStatus === 'connected') {
          get().resetReconnectAttempts()
          // 连接恢复后，处理队列中的请求
          get().processQueuedRequests()
        } else if (connectionStatus === 'disconnected') {
          // 断线时，将处理中的任务标记为等待重连
          const state = get()
          state.processingNodes.forEach((node, nodeId) => {
            if (node.status === 'processing') {
              get().updateProcessingStatus(nodeId, { status: 'queued' })
            }
          })
        }
      },
      
      incrementReconnectAttempts: () => {
        set((state) => ({
          reconnectAttempts: state.reconnectAttempts + 1,
        }))
      },
      
      resetReconnectAttempts: () => {
        set({ reconnectAttempts: 0 })
      },

      // WebSocket服务集成
      connectWebSocket: async () => {
        try {
          get().setConnectionStatus('connecting')
          await websocketService.connect()
          get().setConnectionStatus('connected')
        } catch (error) {
          console.error('WebSocket连接失败:', error)
          get().setConnectionStatus('disconnected')
          get().incrementReconnectAttempts()
          throw error
        }
      },

      disconnectWebSocket: () => {
        websocketService.disconnect()
        get().setConnectionStatus('disconnected')
      },

      initializeWebSocket: async () => {
        // 监听WebSocket状态变化
        const statusUnsubscribe = websocketService.onStatusChange((status) => {
          get().setConnectionStatus(status)
        })

        // 监听AI生成响应
        const responseUnsubscribe = websocketService.subscribe('AI_GENERATE_RESPONSE', (message) => {
          console.log('📥 收到AI_GENERATE_RESPONSE:', message)
          const { nodeId, result, taskId, requestId, content, title, tags, confidence } = message.payload

          // 尝试多种方式获取nodeId
          const effectiveNodeId = nodeId || taskId || requestId

          const rawResult =
            typeof result === 'string'
              ? result
              : {
                  ...(isRecord(result) ? result : {}),
                  ...(content !== undefined ? { content } : {}),
                  ...(title !== undefined ? { title } : {}),
                  ...(tags !== undefined ? { tags } : {}),
                  ...(confidence !== undefined ? { confidence } : {}),
                }

          const processedResult = normalizeAIGenerateResponse(rawResult)

          if (effectiveNodeId) {
            console.log('✅ 完成AI生成，nodeId:', effectiveNodeId, 'result:', processedResult)
            get().completeProcessing(effectiveNodeId, processedResult)
          } else {
            console.warn('⚠️ AI_GENERATE_RESPONSE缺少必要字段:', { nodeId, taskId, requestId, result, content })
          }
        })

        // 监听AI任务结果（从Gateway发送的消息）
        const taskResultUnsubscribe = websocketService.subscribe('ai_task_result', (message) => {
          console.log('📥 收到ai_task_result:', message)
          const { taskId, requestId, status, result, error } = message.payload
          const effectiveNodeId = taskId || requestId

          if (!effectiveNodeId) {
            console.warn('⚠️ ai_task_result缺少taskId/requestId')
            return
          }

          if (status === 'completed' && result) {
            get().completeProcessing(effectiveNodeId, result)
          } else if (status === 'error' && error) {
            get().failProcessing(effectiveNodeId, error.message || error)
          } else if (status === 'processing') {
            get().updateProcessingStatus(effectiveNodeId, { status: 'processing' })
          }
        })

        // 监听AI生成错误
        const errorUnsubscribe = websocketService.subscribe('AI_GENERATE_ERROR', (message) => {
          console.log('📥 收到AI_GENERATE_ERROR:', message)
          const { nodeId, error, taskId, requestId } = message.payload
          const effectiveNodeId = nodeId || taskId || requestId
          if (effectiveNodeId && error) {
            get().failProcessing(effectiveNodeId, error)
          }
        })

        // 监听节点状态更新
        const updateUnsubscribe = websocketService.subscribe('NODE_UPDATE', (message) => {
          const { nodeId, status } = message.payload
          if (nodeId && status) {
            get().updateProcessingStatus(nodeId, status)
          }
        })

        // 尝试连接
        try {
          await get().connectWebSocket()
        } catch (error) {
          console.warn('初始WebSocket连接失败，将在后台重试')
        }

        // 返回清理函数
        return () => {
          statusUnsubscribe()
          responseUnsubscribe()
          taskResultUnsubscribe()
          errorUnsubscribe()
          updateUnsubscribe()
          get().disconnectWebSocket()
        }
      },
      
      // 配置管理
      setModel: (currentModel) => {
        set({ currentModel })
      },
      
      setAvailable: (isAvailable) => {
        set({ isAvailable })
      },
      
      // 指标记录
      recordRequest: () => {
        set((state) => ({
          metrics: {
            ...state.metrics,
            requestCount: state.metrics.requestCount + 1,
          },
        }))
      },
      
      recordSuccess: (responseTime) => {
        set((state) => {
          const newTotalTime = state.metrics.totalResponseTime + responseTime
          const newSuccessCount = state.metrics.successCount + 1
          
          return {
            metrics: {
              ...state.metrics,
              successCount: newSuccessCount,
              totalResponseTime: newTotalTime,
              averageResponseTime: newTotalTime / newSuccessCount,
            },
          }
        })
      },
      
      recordError: () => {
        set((state) => ({
          metrics: {
            ...state.metrics,
            errorCount: state.metrics.errorCount + 1,
          },
        }))
      },
      
      // 队列管理
      addToQueue: (request, priority = 0) => {
        const id = generateRequestId()
        
        set((state) => ({
          requestQueue: [
            ...state.requestQueue,
            {
              id,
              request,
              priority,
              createdAt: new Date(),
            },
          ].sort((a, b) => b.priority - a.priority), // 高优先级在前
        }))
        
        return id
      },
      
      removeFromQueue: (id) => {
        set((state) => ({
          requestQueue: state.requestQueue.filter(item => item.id !== id),
        }))
      },
      
      getNextInQueue: () => {
        const queue = get().requestQueue
        return queue.length > 0 ? queue[0] : undefined
      },
      
      clearQueue: () => {
        set({ requestQueue: [] })
      },
      
      // 结果缓存
      cacheResult: (inputs, result) => {
        // 简单的基于输入的缓存key
        const cacheKey = inputs.join('|')
        const normalizedResult = normalizeAIGenerateResponse(result)

        set((state) => {
          const newRecentResults = new Map(state.recentResults)
          newRecentResults.set(cacheKey, normalizedResult)
          return { recentResults: newRecentResults }
        })
      },
      
      getCachedResult: (inputs) => {
        const cacheKey = inputs.join('|')
        return get().recentResults.get(cacheKey)
      },
      
      clearCache: () => {
        set({
          recentResults: new Map(),
          processingNodes: new Map(),
        })
      },

      // 处理队列中的请求
      processQueuedRequests: async () => {
        const queue = get().requestQueue
        console.log(`🔄 processQueuedRequests called, queue length: ${queue.length}`)

        if (queue.length === 0) {
          console.log('📭 Queue is empty, nothing to process')
          return
        }

        console.log(`🔄 处理队列中的 ${queue.length} 个AI请求`)

        // 逐个处理队列中的请求
        for (const item of queue) {
          const nodeId = item.request.nodeId
          console.log(`📤 Processing queued request:`, { id: item.id, nodeId, request: item.request })

          if (!nodeId) {
            console.warn('队列请求缺少 nodeId，跳过')
            get().removeFromQueue(item.id)
            continue
          }

          try {
            get().updateProcessingStatus(nodeId, { status: 'processing' })
            console.log(`🚀 Calling websocketService.generateContent for nodeId: ${nodeId}`)
            const result = await websocketService.generateContent(item.request)
            console.log(`✅ generateContent completed:`, result)
            get().completeProcessing(nodeId, result)
            get().removeFromQueue(item.id)
          } catch (error) {
            console.error(`❌ 处理队列请求失败 (${nodeId}):`, error)
            get().failProcessing(nodeId, error instanceof Error ? error.message : '请求失败')
            get().removeFromQueue(item.id)
          }
        }
      },
    }),
    {
      name: 'ai-store',
    }
  )
)
