import type { TemplateConfig, TemplateVariable, CompiledTemplate } from '@/types'

/**
 * 提示词模板类
 * 支持动态变量替换和模板验证
 */
export class PromptTemplate implements CompiledTemplate {
  private config: TemplateConfig
  public variables: TemplateVariable[]
  public name: string

  constructor(config: TemplateConfig) {
    this.config = config
    this.name = config.name
    this.variables = this.parseVariables()
  }

  /**
   * 编译模板，替换变量
   */
  compile(variables: Record<string, any>): string {
    // 验证变量
    if (!this.validate(variables)) {
      throw new Error(`模板 ${this.name} 的变量验证失败`)
    }

    let compiled = this.config.template

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      compiled = compiled.replace(regex, this.formatValue(value))
    }

    // 检查是否还有未替换的变量
    const unreplacedVars = compiled.match(/\{[^}]+\}/g)
    if (unreplacedVars) {
      console.warn(`模板 ${this.name} 中存在未替换的变量:`, unreplacedVars)
    }

    return compiled
  }

  /**
   * 验证变量
   */
  validate(variables: Record<string, any>): boolean {
    // 检查必需变量
    for (const variable of this.variables) {
      if (variable.required && !(variable.name in variables)) {
        console.error(`缺少必需变量: ${variable.name}`)
        return false
      }

      // 检查变量类型
      if (variable.name in variables) {
        const value = variables[variable.name]
        if (!this.validateVariableType(value, variable.type)) {
          console.error(`变量 ${variable.name} 类型不匹配，期望: ${variable.type}`)
          return false
        }
      }
    }

    return true
  }

  /**
   * 获取模板名称
   */
  getName(): string {
    return this.name
  }

  /**
   * 获取模板描述
   */
  getDescription(): string {
    return this.config.description || ''
  }

  /**
   * 获取模板类别
   */
  getCategory(): string {
    return this.config.category || 'general'
  }

  /**
   * 获取模板版本
   */
  getVersion(): string {
    return this.config.version || '1.0.0'
  }

  /**
   * 获取模板作者
   */
  getAuthor(): string {
    return this.config.author || 'unknown'
  }

  /**
   * 获取原始模板内容
   */
  getTemplate(): string {
    return this.config.template
  }

  /**
   * 解析模板中的变量
   */
  private parseVariables(): TemplateVariable[] {
    const variableNames = this.config.variables || []
    const templateVars = this.extractVariablesFromTemplate()

    // 合并配置中的变量和模板中发现的变量
    const allVarNames = new Set([...variableNames, ...templateVars])

    return Array.from(allVarNames).map(name => {
      // 检查是否在配置的变量列表中
      const isConfigured = variableNames.includes(name)

      return {
        name,
        type: this.inferVariableType(name),
        required: isConfigured, // 配置中明确指定的变量为必需
        description: this.generateVariableDescription(name)
      }
    })
  }

  /**
   * 从模板中提取变量名
   */
  private extractVariablesFromTemplate(): string[] {
    const matches = this.config.template.match(/\{([^}]+)\}/g)
    if (!matches) return []

    return matches.map(match => match.slice(1, -1).trim())
  }

  /**
   * 推断变量类型
   */
  private inferVariableType(name: string): 'string' | 'array' | 'object' {
    // 基于变量名推断类型
    const arrayIndicators = ['inputs', 'items', 'list', 'tags', 'examples']
    const objectIndicators = ['config', 'options', 'settings', 'metadata']

    const lowerName = name.toLowerCase()

    if (arrayIndicators.some(indicator => lowerName.includes(indicator))) {
      return 'array'
    }

    if (objectIndicators.some(indicator => lowerName.includes(indicator))) {
      return 'object'
    }

    return 'string'
  }

  /**
   * 生成变量描述
   */
  private generateVariableDescription(name: string): string {
    const descriptions: Record<string, string> = {
      inputs: '输入内容数组',
      context: '上下文信息',
      instruction: '处理指令',
      style: '输出风格',
      length: '内容长度要求',
      format: '输出格式',
      examples: '示例内容',
      requirements: '具体要求',
      constraints: '约束条件'
    }

    return descriptions[name.toLowerCase()] || `${name}参数`
  }

  /**
   * 验证变量类型
   */
  private validateVariableType(value: any, expectedType: 'string' | 'array' | 'object'): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      default:
        return true
    }
  }

  /**
   * 格式化变量值
   */
  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return value
    }

    if (Array.isArray(value)) {
      return value.join('\n')
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }

    return String(value)
  }

  /**
   * 克隆模板
   */
  clone(): PromptTemplate {
    return new PromptTemplate({ ...this.config })
  }

  /**
   * 更新模板内容
   */
  updateTemplate(newTemplate: string): void {
    this.config.template = newTemplate
    this.variables = this.parseVariables()
  }

  /**
   * 添加变量定义
   */
  addVariable(variable: TemplateVariable): void {
    const existingIndex = this.variables.findIndex(v => v.name === variable.name)
    if (existingIndex >= 0) {
      this.variables[existingIndex] = variable
    } else {
      this.variables.push(variable)
      if (!this.config.variables.includes(variable.name)) {
        this.config.variables.push(variable.name)
      }
    }
  }

  /**
   * 移除变量定义
   */
  removeVariable(name: string): void {
    this.variables = this.variables.filter(v => v.name !== name)
    this.config.variables = this.config.variables.filter(v => v !== name)
  }

  /**
   * 获取模板预览
   */
  getPreview(sampleVariables?: Record<string, any>): string {
    const variables = sampleVariables || this.getSampleVariables()
    try {
      return this.compile(variables)
    } catch (error) {
      return `模板预览失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  /**
   * 生成示例变量
   */
  private getSampleVariables(): Record<string, any> {
    const sampleData: Record<string, any> = {}

    for (const variable of this.variables) {
      switch (variable.type) {
        case 'string':
          sampleData[variable.name] = `[${variable.name}示例]`
          break
        case 'array':
          sampleData[variable.name] = [`[${variable.name}示例1]`, `[${variable.name}示例2]`]
          break
        case 'object':
          sampleData[variable.name] = { example: `[${variable.name}示例]` }
          break
      }

      // 使用默认值（如果有）
      if (variable.defaultValue !== undefined) {
        sampleData[variable.name] = variable.defaultValue
      }
    }

    return sampleData
  }

  /**
   * 转换为JSON配置
   */
  toConfig(): TemplateConfig {
    return { ...this.config }
  }

  /**
   * 从JSON配置创建模板
   */
  static fromConfig(config: TemplateConfig): PromptTemplate {
    return new PromptTemplate(config)
  }

  /**
   * 验证模板配置
   */
  static validateConfig(config: TemplateConfig): boolean {
    if (!config.name || !config.template) {
      return false
    }

    if (!Array.isArray(config.variables)) {
      return false
    }

    return true
  }
}

/**
 * 模板管理器类
 * 管理多个模板的注册、查找和使用
 */
export class TemplateManager {
  private templates: Map<string, PromptTemplate> = new Map()
  private categories: Map<string, string[]> = new Map()

  /**
   * 注册模板
   */
  register(template: PromptTemplate): void {
    this.templates.set(template.getName(), template)

    // 更新类别索引
    const category = template.getCategory()
    if (!this.categories.has(category)) {
      this.categories.set(category, [])
    }
    this.categories.get(category)!.push(template.getName())
  }

  /**
   * 注册多个模板
   */
  registerBatch(templates: PromptTemplate[]): void {
    templates.forEach(template => this.register(template))
  }

  /**
   * 获取模板
   */
  get(name: string): PromptTemplate | undefined {
    return this.templates.get(name)
  }

  /**
   * 获取所有模板名称
   */
  getAllNames(): string[] {
    return Array.from(this.templates.keys())
  }

  /**
   * 按类别获取模板
   */
  getByCategory(category: string): PromptTemplate[] {
    const names = this.categories.get(category) || []
    return names.map(name => this.templates.get(name)!).filter(Boolean)
  }

  /**
   * 获取所有类别
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  /**
   * 搜索模板
   */
  search(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.templates.values()).filter(template =>
      template.getName().toLowerCase().includes(lowerQuery) ||
      template.getDescription().toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 移除模板
   */
  remove(name: string): boolean {
    const template = this.templates.get(name)
    if (template) {
      this.templates.delete(name)

      // 从类别索引中移除
      const category = template.getCategory()
      const categoryTemplates = this.categories.get(category)
      if (categoryTemplates) {
        const index = categoryTemplates.indexOf(name)
        if (index >= 0) {
          categoryTemplates.splice(index, 1)
        }
        if (categoryTemplates.length === 0) {
          this.categories.delete(category)
        }
      }

      return true
    }
    return false
  }

  /**
   * 清空所有模板
   */
  clear(): void {
    this.templates.clear()
    this.categories.clear()
  }

  /**
   * 获取模板统计
   */
  getStats(): {
    totalTemplates: number
    categoriesCount: number
    categories: Record<string, number>
  } {
    const categories: Record<string, number> = {}
    for (const [category, templates] of this.categories.entries()) {
      categories[category] = templates.length
    }

    return {
      totalTemplates: this.templates.size,
      categoriesCount: this.categories.size,
      categories
    }
  }
}