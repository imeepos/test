// AI处理引擎主入口文件

export { AIEngine } from '@/core/AIEngine'
export { ContentGenerator } from '@/core/ContentGenerator'
export { SemanticAnalyzer } from '@/core/SemanticAnalyzer'
export { PromptTemplate } from '@/core/PromptTemplate'
export { BatchProcessor } from '@/core/BatchProcessor'

export { OpenAIProvider } from '@/providers/OpenAIProvider'

export { TokenCounter } from '@/utils/TokenCounter'

// Studio API 服务器相关
export { StudioAPIServer, createAndStartStudioAPIServer } from '@/server/StudioAPIServer'
export { StudioAPIAdapter, createStudioAPIAdapter } from '@/adapters/StudioAPIAdapter'
export { createStudioAPIRouter } from '@/server/StudioAPIRouter'

// 类型定义导出
export type {
  // 引擎配置
  EngineConfig,
  ModelConfig,
  RetryConfig,
  CostOptimization,

  // 任务相关
  AITaskRequest,
  AITaskResult,
  ProcessingMetadata,

  // 内容生成
  GenerateRequest,
  GenerateResult,
  OptimizeRequest,
  OptimizeResult,
  FusionRequest,
  FusionResult,
  ExpandRequest,
  ExpandResult,

  // 语义分析
  SemanticAnalysis,
  SemanticOptions,

  // 提示词模板
  TemplateConfig,
  TemplateVariable,

  // 批处理
  BatchRequest,
  BatchResult,
  BatchOptions,

  // 错误处理
  AIEngineError,
  ErrorDetails
} from '@/types'

// Studio API 类型导出
export type {
  StudioAIGenerateRequest,
  StudioAIGenerateOptions,
  StudioAIModel,
  StudioAIGenerateResponse,
  StudioAIOptimizeRequest,
  StudioOptimizationFocus,
  StudioAIProcessingState
} from '@/adapters/StudioAPIAdapter'

export type {
  StudioAPIServerConfig
} from '@/server/StudioAPIServer'

// 便利函数导出
export { createEngine } from '@/factory/EngineFactory'
export { validateConfig } from '@/utils/ConfigValidator'