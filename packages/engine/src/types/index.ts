// AI引擎相关类型定义

// 引擎配置
export interface EngineConfig {
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseURL?: string
  organization?: string
  models: ModelConfig
  defaultModel: string
  temperature: number
  maxTokens: number
  timeout: number
  retryConfig: RetryConfig
  costOptimization?: CostOptimization
}

export interface ModelConfig {
  generation?: string
  optimization?: string
  analysis?: string
  fusion?: string
}

export interface RetryConfig {
  maxRetries: number
  backoffMultiplier: number
  retryableErrors: string[]
}

export interface CostOptimization {
  enabled: boolean
  maxCostPerRequest: number
  preferredModels: string[]
}

// 任务处理相关
export interface AITaskRequest {
  type: 'generate' | 'optimize' | 'fusion' | 'expand' | 'analyze'
  inputs: string[]
  instruction?: string
  context?: string
  options?: TaskOptions
}

export interface TaskOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  style?: string
  length?: 'short' | 'medium' | 'long'
  priority?: number
}

export interface AITaskResult {
  success: boolean
  content: string
  title?: string
  confidence: number
  tags: string[]
  reasoning?: string
  metadata: ProcessingMetadata
  error?: ErrorDetails
}

export interface ProcessingMetadata {
  model: string
  tokenCount: number
  processingTime: number
  temperature: number
  cost?: number
  requestId: string
  timestamp: Date
  error?: any
}

// 内容生成相关
export interface GenerateRequest {
  prompt?: string
  inputs: string[]
  context?: string
  instruction?: string
  style?: string
  length?: 'short' | 'medium' | 'long'
  model?: string
  temperature?: number
  options?: TaskOptions
}

export interface GenerateResult {
  content: string
  title?: string
  confidence: number
  tags: string[]
  reasoning?: string
  suggestions?: string[]
  importance?: number
  metadata: ProcessingMetadata
}

export interface OptimizeRequest {
  content: string
  instruction: string
  context?: string
  targetStyle?: string
  targetLength?: 'shorter' | 'longer' | 'same'
  model?: string
}

export interface OptimizeResult {
  optimizedContent: string
  improvementSummary: string
  confidence: number
  changes: string[]
  metadata: ProcessingMetadata
}

export interface FusionRequest {
  inputs: string[]
  instruction: string
  context?: string
  fusionType: 'synthesis' | 'comparison' | 'integration' | 'summary'
  model?: string
}

export interface FusionResult {
  fusedContent: string
  keyInsights: string[]
  confidence: number
  sourceMapping: Record<string, number>
  metadata: ProcessingMetadata
}

export interface ExpandRequest {
  baseContent: string
  instruction: string
  context?: string
  expansionType: 'detail' | 'examples' | 'analysis' | 'implications'
  targetLength?: number
  model?: string
}

export interface ExpandResult {
  expandedContent: string
  addedSections: string[]
  confidence: number
  expansionRatio: number
  metadata: ProcessingMetadata
}

// 语义分析相关
export interface SemanticOptions {
  extractTags?: boolean
  assessImportance?: boolean
  calculateConfidence?: boolean
  analyzeSentiment?: boolean
  detectTopics?: boolean
  evaluateComplexity?: boolean
}

export interface SemanticAnalysis {
  semanticType: string
  importanceLevel: number
  keyTerms: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  complexity: 'low' | 'medium' | 'high'
  complexityScore: number
  readability: number
  topics: Array<{
    name: string
    relevance: number
    confidence: number
  }>
  entities: Array<{
    text: string
    type: string
    confidence: number
  }>
  tags: string[]
  confidence: number
  metadata: ProcessingMetadata
}

// 提示词模板相关
export interface TemplateConfig {
  name: string
  description?: string
  template: string
  variables: string[]
  category?: string
  version?: string
  author?: string
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'array' | 'object'
  required: boolean
  description?: string
  defaultValue?: any
}

export interface CompiledTemplate {
  name: string
  compile: (variables: Record<string, any>) => string
  validate: (variables: Record<string, any>) => boolean
  variables: TemplateVariable[]
}

// 批处理相关
export interface BatchRequest {
  tasks: AITaskRequest[]
  options?: BatchOptions
}

export interface BatchOptions {
  concurrency?: number
  failFast?: boolean
  retryFailedTasks?: boolean
  progressCallback?: (progress: BatchProgress) => void
}

export interface BatchResult {
  results: Array<AITaskResult | null>
  summary: BatchSummary
  errors: Array<{
    index: number
    error: ErrorDetails
  }>
}

export interface BatchProgress {
  total: number
  completed: number
  failed: number
  inProgress: number
  percentage: number
}

export interface BatchSummary {
  totalTasks: number
  successful: number
  failed: number
  totalProcessingTime: number
  totalTokens: number
  totalCost?: number
}

// 错误处理
export interface AIEngineError extends Error {
  code: string
  details?: any
  retryable: boolean
  statusCode?: number
}

export interface ErrorDetails {
  code: string
  message: string
  details?: any
  timestamp: Date
  requestId?: string
}

// 提供者接口
export interface AIProvider {
  name: string
  generate(request: GenerateRequest): Promise<GenerateResult>
  optimize(request: OptimizeRequest): Promise<OptimizeResult>
  analyze(content: string, options: SemanticOptions): Promise<SemanticAnalysis>
  countTokens(text: string): Promise<number>
  validateRequest(request: any): boolean
  getAvailableModels(): string[]
}

// 监控和统计
export interface UsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageProcessingTime: number
  totalTokensUsed: number
  totalCost?: number
  modelUsage: Record<string, number>
  errorDistribution: Record<string, number>
  lastResetAt: Date
}

// 缓存相关
export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: 'lru' | 'fifo'
}

export interface CacheEntry {
  key: string
  value: any
  timestamp: Date
  ttl: number
  hits: number
}

// 批处理请求接口（StudioAPIAdapter中使用）
export interface BatchProcessRequest {
  tasks: Array<{
    id: string
    type: string
    data: any
  }>
  concurrency?: number
  failFast?: boolean
}

// 语义分析请求接口（StudioAPIAdapter中使用）
export interface SemanticAnalysisRequest {
  content: string
  options: {
    extractEntities?: boolean
    extractRelations?: boolean
    analyzeSentiment?: boolean
    analysisDepth?: 'basic' | 'deep'
    includeEmbeddings?: boolean
  }
}

// 语义分析结果接口（StudioAPIAdapter中使用）
export interface SemanticAnalysisResult {
  semanticTypes: string[]
  entities: Array<{
    text: string
    type: string
    confidence: number
  }>
  relations: Array<{
    source: string
    target: string
    relation: string
  }>
  sentiment: {
    score: number
    label: string
  }
  summary: string
}

// 增强GenerateResult，添加缺失字段
export interface EnhancedGenerateResult extends GenerateResult {
  reasoning?: string
  suggestions?: string[]
  importance?: number
}

// 批处理结果接口
export interface BatchProcessResult {
  results: Array<{
    success: boolean
    data?: any
    error?: string
  }>
  summary?: {
    total: number
    successful: number
    failed: number
  }
}