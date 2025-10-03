import type {
  AIProvider,
  SemanticOptions,
  SemanticAnalysis,
  GenerateRequest,
  ProcessingMetadata
} from '../types/index.js'
import { PromptBuilder } from '../templates/PromptBuilder.js'

/**
 * 语义分析器类
 * 负责对内容进行深度语义分析
 */
export class SemanticAnalyzer {
  private provider: AIProvider

  constructor(provider: AIProvider) {
    this.provider = provider
  }

  /**
   * 分析内容的语义信息
   */
  async analyze(content: string, options: SemanticOptions, customPrompt?: string): Promise<SemanticAnalysis> {
    // 使用自定义 prompt 或默认 prompt
    const analysisPrompt = customPrompt || PromptBuilder.buildAnalyze(content)

    // 调用 provider 的 analyze 方法
    return await this.provider.analyze(content, options, analysisPrompt)
  }

  /**
   * 批量分析多个内容
   */
  async analyzeBatch(contents: string[], options: SemanticOptions): Promise<SemanticAnalysis[]> {
    const promises = contents.map(content => this.analyze(content, options))
    return Promise.all(promises)
  }

  /**
   * 比较两个内容的语义相似性
   */
  async compareSemantics(content1: string, content2: string): Promise<{
    similarity: number
    commonTopics: string[]
    differences: string[]
    confidence: number
  }> {
    const [analysis1, analysis2] = await Promise.all([
      this.analyze(content1, { detectTopics: true, extractTags: true }),
      this.analyze(content2, { detectTopics: true, extractTags: true })
    ])

    // 计算相似性
    const tags1 = new Set(analysis1.tags)
    const tags2 = new Set(analysis2.tags)
    const commonTags = Array.from(tags1).filter(tag => tags2.has(tag))
    const allTags = new Set([...tags1, ...tags2])

    const similarity = allTags.size > 0 ? commonTags.length / allTags.size : 0

    // 提取共同主题
    const topics1 = analysis1.topics.map(t => t.name)
    const topics2 = analysis2.topics.map(t => t.name)
    const commonTopics = topics1.filter(topic => topics2.includes(topic))

    // 提取差异
    const uniqueTags1 = Array.from(tags1).filter(tag => !tags2.has(tag))
    const uniqueTags2 = Array.from(tags2).filter(tag => !tags1.has(tag))
    const differences = [...uniqueTags1, ...uniqueTags2]

    // 计算置信度
    const confidence = (analysis1.confidence + analysis2.confidence) / 2

    return {
      similarity,
      commonTopics,
      differences,
      confidence
    }
  }
}