import { describe, it, expect, beforeEach } from 'vitest'
import { PromptTemplate } from '../../core/PromptTemplate.js'

describe('@sker/engine - PromptTemplate', () => {
  describe('Basic Template Rendering', () => {
    it('应该正确渲染简单模板', () => {
      const template = new PromptTemplate('Hello {{name}}!')
      const result = template.render({ name: 'World' })
      expect(result).toBe('Hello World!')
    })

    it('应该正确渲染多个变量', () => {
      const template = new PromptTemplate('{{greeting}} {{name}}, welcome to {{place}}!')
      const result = template.render({
        greeting: 'Hello',
        name: 'Alice',
        place: 'SKER',
      })
      expect(result).toBe('Hello Alice, welcome to SKER!')
    })

    it('应该保留未提供变量的占位符', () => {
      const template = new PromptTemplate('Hello {{name}}, you are {{age}} years old')
      const result = template.render({ name: 'Bob' })
      expect(result).toContain('{{age}}')
    })
  })

  describe('Nested Variables', () => {
    it('应该支持嵌套对象访问', () => {
      const template = new PromptTemplate('User: {{user.name}}, Email: {{user.email}}')
      const result = template.render({
        user: {
          name: 'Alice',
          email: 'alice@example.com',
        },
      })
      expect(result).toBe('User: Alice, Email: alice@example.com')
    })

    it('应该处理深层嵌套', () => {
      const template = new PromptTemplate('{{data.user.profile.name}}')
      const result = template.render({
        data: {
          user: {
            profile: {
              name: 'Deep Nested Value',
            },
          },
        },
      })
      expect(result).toBe('Deep Nested Value')
    })
  })

  describe('Array Handling', () => {
    it('应该支持数组索引访问', () => {
      const template = new PromptTemplate('First: {{items.0}}, Second: {{items.1}}')
      const result = template.render({
        items: ['apple', 'banana', 'cherry'],
      })
      expect(result).toBe('First: apple, Second: banana')
    })

    it('应该支持数组迭代', () => {
      const template = new PromptTemplate(
        'Items:\n{{#each items}}- {{this}}\n{{/each}}'
      )
      const result = template.render({
        items: ['apple', 'banana', 'cherry'],
      })
      expect(result).toContain('- apple')
      expect(result).toContain('- banana')
      expect(result).toContain('- cherry')
    })
  })

  describe('Conditional Rendering', () => {
    it('应该支持简单条件判断', () => {
      const template = new PromptTemplate(
        '{{#if premium}}Premium User{{/if}}{{#unless premium}}Regular User{{/unless}}'
      )

      const premiumResult = template.render({ premium: true })
      expect(premiumResult).toContain('Premium User')
      expect(premiumResult).not.toContain('Regular User')

      const regularResult = template.render({ premium: false })
      expect(regularResult).toContain('Regular User')
      expect(regularResult).not.toContain('Premium User')
    })

    it('应该支持else分支', () => {
      const template = new PromptTemplate(
        '{{#if admin}}Admin Access{{else}}Limited Access{{/if}}'
      )

      expect(template.render({ admin: true })).toBe('Admin Access')
      expect(template.render({ admin: false })).toBe('Limited Access')
    })
  })

  describe('Helper Functions', () => {
    it('应该支持自定义helper', () => {
      const template = new PromptTemplate('{{uppercase name}}')
      template.registerHelper('uppercase', (str: string) => str.toUpperCase())

      const result = template.render({ name: 'alice' })
      expect(result).toBe('ALICE')
    })

    it('应该支持多参数helper', () => {
      const template = new PromptTemplate('{{join items separator}}')
      template.registerHelper('join', (arr: string[], sep: string) => arr.join(sep))

      const result = template.render({
        items: ['a', 'b', 'c'],
        separator: ', ',
      })
      expect(result).toBe('a, b, c')
    })

    it('应该支持内置helper - format', () => {
      const template = new PromptTemplate('{{format date "YYYY-MM-DD"}}')
      const result = template.render({ date: new Date('2024-01-15') })
      expect(result).toMatch(/2024-01-15/)
    })

    it('应该支持内置helper - default', () => {
      const template = new PromptTemplate('{{default name "Anonymous"}}')

      expect(template.render({ name: 'Alice' })).toBe('Alice')
      expect(template.render({})).toBe('Anonymous')
    })
  })

  describe('Whitespace Control', () => {
    it('应该正确处理空白字符', () => {
      const template = new PromptTemplate(
        'Start\n  {{~ name ~}}\nEnd'
      )
      const result = template.render({ name: 'Value' })
      expect(result).toBe('StartValueEnd')
    })

    it('应该保留必要的空白', () => {
      const template = new PromptTemplate('Hello {{name}} !')
      const result = template.render({ name: 'World' })
      expect(result).toBe('Hello World !')
    })
  })

  describe('Escaping and Safety', () => {
    it('应该转义HTML特殊字符', () => {
      const template = new PromptTemplate('Content: {{content}}')
      const result = template.render({ content: '<script>alert("xss")</script>' })
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('应该支持不转义的输出', () => {
      const template = new PromptTemplate('Raw: {{{raw}}}')
      const result = template.render({ raw: '<b>bold</b>' })
      expect(result).toBe('Raw: <b>bold</b>')
    })

    it('应该防止代码注入', () => {
      const template = new PromptTemplate('{{input}}')
      const maliciousInput = '"; console.log("hacked"); "'
      const result = template.render({ input: maliciousInput })
      expect(result).not.toContain('console.log')
    })
  })

  describe('Error Handling', () => {
    it('应该处理缺失变量', () => {
      const template = new PromptTemplate('{{missing}}')
      expect(() => template.render({})).not.toThrow()
    })

    it('应该处理无效的变量路径', () => {
      const template = new PromptTemplate('{{user.profile.name}}')
      expect(() => template.render({ user: null })).not.toThrow()
    })

    it('应该在helper错误时提供有用的错误信息', () => {
      const template = new PromptTemplate('{{uppercase name}}')
      template.registerHelper('uppercase', (str: string) => {
        if (typeof str !== 'string') throw new Error('Expected string')
        return str.toUpperCase()
      })

      expect(() => template.render({ name: 123 })).toThrow('Expected string')
    })
  })

  describe('Template Composition', () => {
    it('应该支持部分模板', () => {
      const main = new PromptTemplate('{{> header}}\nBody\n{{> footer}}')
      main.registerPartial('header', 'Header Content')
      main.registerPartial('footer', 'Footer Content')

      const result = main.render({})
      expect(result).toContain('Header Content')
      expect(result).toContain('Body')
      expect(result).toContain('Footer Content')
    })

    it('应该支持部分模板传递上下文', () => {
      const main = new PromptTemplate('{{> userInfo user}}')
      main.registerPartial('userInfo', 'Name: {{name}}, Age: {{age}}')

      const result = main.render({
        user: { name: 'Alice', age: 30 },
      })
      expect(result).toBe('Name: Alice, Age: 30')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('应该处理空模板', () => {
      const template = new PromptTemplate('')
      expect(template.render({})).toBe('')
    })

    it('应该处理纯文本模板', () => {
      const template = new PromptTemplate('This is plain text')
      expect(template.render({})).toBe('This is plain text')
    })

    it('应该高效处理大量变量', () => {
      const vars: Record<string, string> = {}
      let templateStr = ''
      for (let i = 0; i < 100; i++) {
        vars[`var${i}`] = `value${i}`
        templateStr += `{{var${i}}} `
      }

      const template = new PromptTemplate(templateStr)
      const start = Date.now()
      const result = template.render(vars)
      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(100) // 应该在100ms内完成
    })

    it('应该支持Unicode字符', () => {
      const template = new PromptTemplate('你好 {{name}}! 🎉')
      const result = template.render({ name: '世界' })
      expect(result).toBe('你好 世界! 🎉')
    })
  })

  describe('Validation', () => {
    it('应该验证模板语法', () => {
      expect(() => new PromptTemplate('{{#if}}')).toThrow()
      expect(() => new PromptTemplate('{{/if}}')).toThrow()
      expect(() => new PromptTemplate('{{#if test}}content')).toThrow() // 缺少闭合
    })

    it('应该检测未闭合的标签', () => {
      expect(() => new PromptTemplate('{{#each items}}item{{/if}}')).toThrow()
    })

    it('应该允许合法的嵌套', () => {
      const template = new PromptTemplate(
        '{{#if outer}}{{#each items}}{{this}}{{/each}}{{/if}}'
      )
      expect(template).toBeDefined()
    })
  })

  describe('Caching and Reusability', () => {
    it('应该缓存编译结果', () => {
      const template = new PromptTemplate('{{name}}')

      const result1 = template.render({ name: 'First' })
      const result2 = template.render({ name: 'Second' })

      expect(result1).toBe('First')
      expect(result2).toBe('Second')
    })

    it('应该允许重复使用同一模板', () => {
      const template = new PromptTemplate('Hello {{name}}!')

      for (let i = 0; i < 10; i++) {
        const result = template.render({ name: `User${i}` })
        expect(result).toBe(`Hello User${i}!`)
      }
    })
  })
})

describe('@sker/engine - AI Prompt Templates', () => {
  describe('Content Generation Prompts', () => {
    it('应该正确构建内容生成提示词', () => {
      const template = new PromptTemplate(`
基于以下输入生成内容：

{{#each inputs}}
输入 {{@index}}: {{this}}
{{/each}}

{{#if instruction}}
指令: {{instruction}}
{{/if}}

{{#if context}}
上下文: {{context}}
{{/if}}

请生成高质量的内容。
      `.trim())

      const result = template.render({
        inputs: ['需求分析', '技术方案'],
        instruction: '综合生成产品规划',
        context: '这是一个电商项目',
      })

      expect(result).toContain('输入 0: 需求分析')
      expect(result).toContain('输入 1: 技术方案')
      expect(result).toContain('指令: 综合生成产品规划')
      expect(result).toContain('上下文: 这是一个电商项目')
    })
  })

  describe('Optimization Prompts', () => {
    it('应该正确构建内容优化提示词', () => {
      const template = new PromptTemplate(`
请优化以下内容：

原内容:
{{content}}

优化要求:
{{requirements}}

{{#if focus}}
关注点: {{focus}}
{{/if}}
      `.trim())

      const result = template.render({
        content: '产品需求文档初稿',
        requirements: '增加更多技术细节',
        focus: '架构设计',
      })

      expect(result).toContain('原内容:')
      expect(result).toContain('产品需求文档初稿')
      expect(result).toContain('优化要求:')
      expect(result).toContain('增加更多技术细节')
      expect(result).toContain('关注点: 架构设计')
    })
  })

  describe('Semantic Analysis Prompts', () => {
    it('应该正确构建语义分析提示词', () => {
      const template = new PromptTemplate(`
分析以下内容的语义类型：

内容: {{content}}

可选类型: {{types}}

请返回最合适的语义类型及其置信度。
      `.trim())

      const result = template.render({
        content: '我们需要实现用户登录功能',
        types: 'requirement, solution, plan, analysis',
      })

      expect(result).toContain('分析以下内容的语义类型')
      expect(result).toContain('我们需要实现用户登录功能')
      expect(result).toContain('requirement, solution, plan, analysis')
    })
  })
})
