import { describe, it, expect } from 'vitest'
import { PromptTemplate } from '../../core/PromptTemplate.js'
import type { TemplateConfig } from '../../types/index.js'

describe('@sker/engine - PromptTemplate', () => {
  describe('Basic Template Rendering', () => {
    it('应该正确编译简单模板', () => {
      const config: TemplateConfig = {
        name: 'simple-template',
        template: 'Hello {name}!',
        variables: ['name'],
      }
      const template = new PromptTemplate(config)
      const result = template.compile({ name: 'World' })
      expect(result).toBe('Hello World!')
    })

    it('应该正确编译多个变量', () => {
      const config: TemplateConfig = {
        name: 'multi-var-template',
        template: '{greeting} {name}, welcome to {place}!',
        variables: ['greeting', 'name', 'place'],
      }
      const template = new PromptTemplate(config)
      const result = template.compile({
        greeting: 'Hello',
        name: 'Alice',
        place: 'SKER',
      })
      expect(result).toBe('Hello Alice, welcome to SKER!')
    })

    it('应该保留未提供变量的占位符', () => {
      const config: TemplateConfig = {
        name: 'partial-template',
        template: 'Hello {name}, you are {age} years old',
        variables: ['name'], // 只有 name 是必需的
      }
      const template = new PromptTemplate(config)
      const result = template.compile({ name: 'Bob' })
      expect(result).toContain('{age}') // age 未提供,保留占位符
    })
  })

  describe('Template Configuration', () => {
    it('应该正确解析模板变量', () => {
      const config: TemplateConfig = {
        name: 'var-parse-template',
        template: 'User: {username}, Email: {email}',
        variables: ['username', 'email'],
      }
      const template = new PromptTemplate(config)

      expect(template.variables.length).toBeGreaterThanOrEqual(2)
      expect(template.variables.some(v => v.name === 'username')).toBe(true)
      expect(template.variables.some(v => v.name === 'email')).toBe(true)
    })

    it('应该支持获取模板元信息', () => {
      const config: TemplateConfig = {
        name: 'meta-template',
        template: 'Template content',
        variables: [],
        description: 'Test template description',
        category: 'test',
        version: '2.0.0',
        author: 'Test Author',
      }
      const template = new PromptTemplate(config)

      expect(template.getName()).toBe('meta-template')
      expect(template.getDescription()).toBe('Test template description')
      expect(template.getCategory()).toBe('test')
      expect(template.getVersion()).toBe('2.0.0')
      expect(template.getAuthor()).toBe('Test Author')
    })
  })

  describe('Variable Type Inference', () => {
    it('应该推断数组类型变量', () => {
      const config: TemplateConfig = {
        name: 'array-template',
        template: 'Items: {items}',
        variables: ['items'],
      }
      const template = new PromptTemplate(config)
      const itemsVar = template.variables.find(v => v.name === 'items')

      expect(itemsVar).toBeDefined()
      expect(itemsVar?.type).toBe('array')
    })

    it('应该推断对象类型变量', () => {
      const config: TemplateConfig = {
        name: 'object-template',
        template: 'Config: {config}',
        variables: ['config'],
      }
      const template = new PromptTemplate(config)
      const configVar = template.variables.find(v => v.name === 'config')

      expect(configVar).toBeDefined()
      expect(configVar?.type).toBe('object')
    })

    it('应该推断字符串类型变量', () => {
      const config: TemplateConfig = {
        name: 'string-template',
        template: 'Name: {name}',
        variables: ['name'],
      }
      const template = new PromptTemplate(config)
      const nameVar = template.variables.find(v => v.name === 'name')

      expect(nameVar).toBeDefined()
      expect(nameVar?.type).toBe('string')
    })
  })

  describe('Variable Formatting', () => {
    it('应该正确格式化数组变量', () => {
      const config: TemplateConfig = {
        name: 'array-format-template',
        template: 'Items:\n{items}',
        variables: ['items'],
      }
      const template = new PromptTemplate(config)
      const result = template.compile({
        items: ['apple', 'banana', 'cherry'],
      })
      expect(result).toContain('apple')
      expect(result).toContain('banana')
      expect(result).toContain('cherry')
    })

    it('应该正确格式化对象变量', () => {
      const config: TemplateConfig = {
        name: 'object-format-template',
        template: 'Config: {config}',
        variables: ['config'],
      }
      const template = new PromptTemplate(config)
      const result = template.compile({
        config: { key1: 'value1', key2: 'value2' },
      })
      expect(result).toContain('key1')
      expect(result).toContain('value1')
    })
  })

  describe('Validation', () => {
    it('应该验证必需变量', () => {
      const config: TemplateConfig = {
        name: 'validation-template',
        template: 'Hello {name}!',
        variables: ['name'],
      }
      const template = new PromptTemplate(config)

      expect(template.validate({})).toBe(false)
      expect(template.validate({ name: 'Alice' })).toBe(true)
    })

    it('应该验证变量类型', () => {
      const config: TemplateConfig = {
        name: 'type-validation-template',
        template: 'Items: {items}',
        variables: ['items'],
      }
      const template = new PromptTemplate(config)

      // items 被推断为 array 类型
      expect(template.validate({ items: ['a', 'b'] })).toBe(true)
      expect(template.validate({ items: 'not-an-array' })).toBe(false)
    })

    it('应该验证模板配置', () => {
      const validConfig: TemplateConfig = {
        name: 'valid',
        template: 'test',
        variables: [],
      }
      expect(PromptTemplate.validateConfig(validConfig)).toBe(true)

      const invalidConfig1 = {
        name: '',
        template: 'test',
        variables: [],
      }
      expect(PromptTemplate.validateConfig(invalidConfig1 as TemplateConfig)).toBe(false)

      const invalidConfig2 = {
        name: 'test',
        template: '',
        variables: [],
      }
      expect(PromptTemplate.validateConfig(invalidConfig2 as TemplateConfig)).toBe(false)
    })
  })

  describe('Template Management', () => {
    it('应该支持克隆模板', () => {
      const config: TemplateConfig = {
        name: 'clone-template',
        template: 'Original {content}',
        variables: ['content'],
      }
      const template = new PromptTemplate(config)
      const cloned = template.clone()

      expect(cloned.getName()).toBe(template.getName())
      expect(cloned.getTemplate()).toBe(template.getTemplate())
      expect(cloned).not.toBe(template)
    })

    it('应该支持更新模板内容', () => {
      const config: TemplateConfig = {
        name: 'update-template',
        template: 'Original {content}',
        variables: ['content'],
      }
      const template = new PromptTemplate(config)

      template.updateTemplate('Updated {content} with {extra}')

      expect(template.getTemplate()).toBe('Updated {content} with {extra}')
      expect(template.variables.some(v => v.name === 'extra')).toBe(true)
    })

    it('应该支持添加变量定义', () => {
      const config: TemplateConfig = {
        name: 'add-var-template',
        template: 'Template',
        variables: [],
      }
      const template = new PromptTemplate(config)

      template.addVariable({
        name: 'newVar',
        type: 'string',
        required: true,
        description: 'New variable',
      })

      expect(template.variables.some(v => v.name === 'newVar')).toBe(true)
    })
  })

  describe('Template Preview', () => {
    it('应该生成模板预览', () => {
      const config: TemplateConfig = {
        name: 'preview-template',
        template: 'Hello {name}, you have {count} items',
        variables: ['name', 'count'], // 两个都是必需的
      }
      const template = new PromptTemplate(config)

      const preview = template.getPreview({ name: 'User', count: '5' }) // count 作为字符串传递
      expect(preview).toContain('User')
      expect(preview).toContain('5')
    })
  })

  describe('AI Prompt Templates', () => {
    it('应该正确构建内容生成提示词', () => {
      const config: TemplateConfig = {
        name: 'content-generation',
        template: `基于以下输入生成内容：

输入内容: {inputs}

{instruction}

请生成高质量的内容。`,
        variables: ['inputs', 'instruction'],
      }
      const template = new PromptTemplate(config)

      const result = template.compile({
        inputs: ['需求分析', '技术方案'],
        instruction: '综合生成产品规划',
      })

      expect(result).toContain('需求分析')
      expect(result).toContain('技术方案')
      expect(result).toContain('综合生成产品规划')
    })

    it('应该正确构建内容优化提示词', () => {
      const config: TemplateConfig = {
        name: 'content-optimization',
        template: `请优化以下内容：

原内容:
{content}

优化要求:
{requirements}`,
        variables: ['content', 'requirements'],
      }
      const template = new PromptTemplate(config)

      const result = template.compile({
        content: '产品需求文档初稿',
        requirements: '增加更多技术细节',
      })

      expect(result).toContain('原内容:')
      expect(result).toContain('产品需求文档初稿')
      expect(result).toContain('优化要求:')
      expect(result).toContain('增加更多技术细节')
    })
  })
})
