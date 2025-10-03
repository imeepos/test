// AI处理引擎主入口文件

export { AIEngine } from './core/AIEngine.js'
export { ContentGenerator } from './core/ContentGenerator.js'
export { SemanticAnalyzer } from './core/SemanticAnalyzer.js'
export { PromptTemplate } from './core/PromptTemplate.js'
export { BatchProcessor } from './core/BatchProcessor.js'

// 提示词模板工具
export { PromptBuilder } from './templates/PromptBuilder.js'
export { DEFAULT_PROMPTS } from './templates/DefaultPrompts.js'
export type { PromptTemplateOptions } from './templates/DefaultPrompts.js'

export { OpenAIProvider } from './providers/OpenAIProvider.js'

export { TokenCounter } from './utils/TokenCounter.js'

// Studio API 服务器相关
export { StudioAPIServer, createAndStartStudioAPIServer } from './server/StudioAPIServer.js'
export { StudioAPIAdapter, createStudioAPIAdapter } from './adapters/StudioAPIAdapter.js'
export { createStudioAPIRouter } from './server/StudioAPIRouter.js'

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
} from './types/index.js'

// Studio API 类型导出
export type {
  StudioAIGenerateRequest,
  StudioAIGenerateOptions,
  StudioAIModel,
  StudioAIGenerateResponse,
  StudioAIOptimizeRequest,
  StudioOptimizationFocus,
  StudioAIProcessingState
} from './adapters/StudioAPIAdapter.js'

export type {
  StudioAPIServerConfig
} from './server/StudioAPIServer.js'

// 便利函数导出
export { createEngine } from './factory/EngineFactory.js'
export { validateConfig } from './utils/ConfigValidator.js'