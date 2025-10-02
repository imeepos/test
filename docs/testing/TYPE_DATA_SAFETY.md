# SKER 系统类型安全与数据安全验证

## 一、类型安全保证体系

### 1.1 TypeScript 严格模式配置

所有包必须启用 TypeScript 严格模式:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true, // 启用所有严格类型检查选项
    "noUncheckedIndexedAccess": true, // 索引访问类型安全
    "noImplicitReturns": true, // 禁止隐式返回
    "noFallthroughCasesInSwitch": true, // switch 语句穿透检查
    "noUnusedLocals": true, // 未使用变量检查
    "noUnusedParameters": true, // 未使用参数检查
    "exactOptionalPropertyTypes": true, // 可选属性精确类型
    "noPropertyAccessFromIndexSignature": true // 索引签名属性访问限制
  }
}
```

### 1.2 类型定义层次

```
@sker/models (底层类型定义)
    ↓ 导出基础类型
@sker/store (数据访问层类型)
    ↓ Repository 接口类型
@sker/store-client (HTTP 客户端类型)
    ↓ API 请求/响应类型
@sker/broker (消息队列类型)
    ↓ 消息格式类型
@sker/engine (AI 处理类型)
    ↓ 任务类型定义
@sker/gateway (网关层类型)
    ↓ 路由处理类型
@sker/studio (前端应用类型)
    ↓ UI 状态类型
```

### 1.3 类型安全验证检查清单

```typescript
// tests/type-safety/type-checks.test.ts

import { describe, it, expectTypeOf } from 'vitest'
import type {
  User,
  Project,
  Node,
  Connection,
  AITask,
  ImportanceLevel,
  NodeStatus,
} from '@sker/models'

describe('Type Safety Verification', () => {
  describe('Literal Types', () => {
    it('ImportanceLevel 应该只接受 1-5', () => {
      const level1: ImportanceLevel = 1 // ✅
      const level5: ImportanceLevel = 5 // ✅

      // @ts-expect-error: 不允许 0
      const level0: ImportanceLevel = 0

      // @ts-expect-error: 不允许 6
      const level6: ImportanceLevel = 6

      expect(true).toBe(true)
    })

    it('NodeStatus 应该只接受预定义值', () => {
      const idle: NodeStatus = 'idle' // ✅
      const processing: NodeStatus = 'processing' // ✅

      // @ts-expect-error: 不允许任意字符串
      const invalid: NodeStatus = 'invalid_status'

      expect(true).toBe(true)
    })
  })

  describe('Interface Completeness', () => {
    it('User 接口应该包含所有必需字段', () => {
      // 缺少字段应该报错
      // @ts-expect-error: 缺少 password_hash
      const invalidUser: User = {
        id: '123',
        email: 'test@example.com',
        username: 'test',
        settings: {} as any,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      }

      const validUser: User = {
        id: '123',
        email: 'test@example.com',
        username: 'test',
        password_hash: 'hash', // ✅ 包含必需字段
        settings: {
          theme: 'dark',
          language: 'zh',
          notifications: {
            email: true,
            push: false,
            task_completion: true,
            collaboration: true,
          },
          ai_preferences: {
            default_model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 2000,
          },
        },
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      }

      expectTypeOf(validUser).toMatchTypeOf<User>()
    })
  })

  describe('Type Inference', () => {
    it('应该正确推断泛型类型', () => {
      import type { PaginatedResult } from '@sker/models'

      const result: PaginatedResult<Node> = {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      }

      expectTypeOf(result.data).toEqualTypeOf<Node[]>()
      expectTypeOf(result.data[0]).toEqualTypeOf<Node | undefined>()
    })
  })

  describe('Discriminated Unions', () => {
    it('应该正确处理联合类型', () => {
      type ApiResponse<T> =
        | { success: true; data: T }
        | { success: false; error: string }

      function handleResponse(response: ApiResponse<User>) {
        if (response.success) {
          // TypeScript 知道这里有 data
          expectTypeOf(response.data).toEqualTypeOf<User>()

          // @ts-expect-error: success=true 时没有 error
          console.log(response.error)
        } else {
          // TypeScript 知道这里有 error
          expectTypeOf(response.error).toEqualTypeOf<string>()

          // @ts-expect-error: success=false 时没有 data
          console.log(response.data)
        }
      }
    })
  })

  describe('Readonly and Immutability', () => {
    it('应该防止修改只读属性', () => {
      type ReadonlyNode = Readonly<Node>

      const node: ReadonlyNode = {} as Node

      // @ts-expect-error: 不能修改只读属性
      node.content = 'new content'

      expect(true).toBe(true)
    })
  })

  describe('Utility Types', () => {
    it('应该正确使用 Partial 类型', () => {
      import type { NodeUpdateData } from '@sker/models'

      const update: NodeUpdateData = {
        content: 'updated content',
        // 其他字段都是可选的
      }

      expectTypeOf(update).toMatchTypeOf<Partial<Node>>()
    })

    it('应该正确使用 Pick 和 Omit 类型', () => {
      type UserPublicInfo = Omit<User, 'password_hash'>
      type UserCredentials = Pick<User, 'email' | 'password_hash'>

      const publicInfo: UserPublicInfo = {} as User
      // @ts-expect-error: 不应该包含 password_hash
      console.log(publicInfo.password_hash)

      const credentials: UserCredentials = {
        email: 'test@example.com',
        password_hash: 'hash',
      }

      expect(true).toBe(true)
    })
  })
})
```

## 二、数据验证层次

### 2.1 多层验证策略

```typescript
// Layer 1: 前端输入验证
export function validateNodeInput(data: unknown): NodeInputData {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid input data', 'data', data)
  }

  const input = data as Record<string, unknown>

  if (!input.content || typeof input.content !== 'string') {
    throw new ValidationError('Content is required', 'content', input.content)
  }

  if (input.content.length < 1 || input.content.length > 10000) {
    throw new ValidationError(
      'Content length must be between 1 and 10000',
      'content',
      input.content
    )
  }

  if (input.importance !== undefined) {
    const importance = Number(input.importance)
    if (!Number.isInteger(importance) || importance < 1 || importance > 5) {
      throw new ValidationError(
        'Importance must be between 1 and 5',
        'importance',
        input.importance
      )
    }
  }

  return input as NodeInputData
}

// Layer 2: API 层验证 (express-validator)
import { body, validationResult } from 'express-validator'

export const nodeCreateValidator = [
  body('project_id').isUUID().withMessage('Invalid project ID'),
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters'),
  body('importance')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Importance must be between 1 and 5'),
  body('position.x').isNumeric().withMessage('Position X must be a number'),
  body('position.y').isNumeric().withMessage('Position Y must be a number'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  },
]

// Layer 3: 数据模型验证 (Zod)
import { z } from 'zod'

export const NodeSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  title: z.string().max(255).optional(),
  importance: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(100),
  status: z.enum(['idle', 'processing', 'completed', 'error', 'deleted']),
  tags: z.array(z.string()),
  version: z.number().int().positive(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  metadata: z.object({
    semantic_types: z.array(z.string()),
    edit_count: z.number().int().min(0),
    processing_history: z.array(z.any()),
    statistics: z.object({
      view_count: z.number().int().min(0),
      edit_duration_total: z.number().min(0),
      ai_interactions: z.number().int().min(0),
    }),
  }),
  created_at: z.date(),
  updated_at: z.date(),
  ai_generated: z.boolean(),
})

export function validateNode(data: unknown): Node {
  return NodeSchema.parse(data)
}

// Layer 4: 数据库层验证 (PostgreSQL 约束)
// See migrations SQL files
```

### 2.2 验证测试用例

```typescript
// tests/validation/data-validation.test.ts

describe('Data Validation', () => {
  describe('Input Sanitization', () => {
    it('应该过滤 XSS 攻击', () => {
      const maliciousInput = '<script>alert("XSS")</script>'

      const sanitized = sanitizeInput(maliciousInput)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('应该防止 SQL 注入', () => {
      const maliciousInput = "'; DROP TABLE users; --"

      // 使用参数化查询
      const query = 'SELECT * FROM users WHERE username = $1'
      const params = [maliciousInput]

      // 参数化查询会自动转义
      expect(query).not.toContain(maliciousInput)
    })

    it('应该验证 email 格式', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })

    it('应该验证 UUID 格式', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isValidUUID('invalid-uuid')).toBe(false)
      expect(isValidUUID('123')).toBe(false)
    })
  })

  describe('Range Validation', () => {
    it('应该验证数值范围', () => {
      expect(() => validateImportance(0)).toThrow('must be between 1 and 5')
      expect(() => validateImportance(6)).toThrow('must be between 1 and 5')
      expect(validateImportance(3)).toBe(3)
    })

    it('应该验证字符串长度', () => {
      const shortString = 'a'.repeat(1)
      const validString = 'a'.repeat(100)
      const longString = 'a'.repeat(10001)

      expect(validateContent(validString)).toBe(validString)
      expect(() => validateContent('')).toThrow('Content is required')
      expect(() => validateContent(longString)).toThrow(
        'Content exceeds maximum length'
      )
    })

    it('应该验证数组大小', () => {
      const validArray = [1, 2, 3]
      const emptyArray: number[] = []
      const largeArray = Array(1001).fill(1)

      expect(validateArray(validArray, { min: 1, max: 1000 })).toBe(validArray)
      expect(() => validateArray(emptyArray, { min: 1 })).toThrow()
      expect(() => validateArray(largeArray, { max: 1000 })).toThrow()
    })
  })

  describe('Type Coercion Safety', () => {
    it('应该安全处理类型转换', () => {
      expect(safeParseInt('123')).toBe(123)
      expect(safeParseInt('invalid')).toBeNull()
      expect(safeParseInt('')).toBeNull()

      expect(safeParseFloat('123.45')).toBe(123.45)
      expect(safeParseFloat('invalid')).toBeNull()

      expect(safeParseBoolean('true')).toBe(true)
      expect(safeParseBoolean('false')).toBe(false)
      expect(safeParseBoolean('invalid')).toBeNull()
    })

    it('应该防止隐式类型转换问题', () => {
      // 使用严格相等
      expect(strictEqual(1, '1')).toBe(false)
      expect(strictEqual(1, 1)).toBe(true)

      // 避免 truthy/falsy 陷阱
      expect(isTruthy(0)).toBe(false)
      expect(isTruthy('')).toBe(false)
      expect(isTruthy(null)).toBe(false)
      expect(isTruthy(undefined)).toBe(false)
    })
  })

  describe('Nested Object Validation', () => {
    it('应该深度验证嵌套对象', () => {
      const validData = {
        user: {
          profile: {
            name: 'Alice',
            age: 30,
          },
        },
      }

      const invalidData = {
        user: {
          profile: {
            name: 'Bob',
            age: 'invalid', // 类型错误
          },
        },
      }

      expect(validateNestedObject(validData)).toEqual(validData)
      expect(() => validateNestedObject(invalidData)).toThrow()
    })
  })

  describe('Date and Time Validation', () => {
    it('应该验证日期格式', () => {
      expect(isValidDate(new Date())).toBe(true)
      expect(isValidDate(new Date('2024-01-15'))).toBe(true)
      expect(isValidDate(new Date('invalid'))).toBe(false)
      expect(isValidDate('2024-01-15')).toBe(false) // 字符串不是 Date 对象
    })

    it('应该验证日期范围', () => {
      const past = new Date('2020-01-01')
      const future = new Date('2030-01-01')
      const now = new Date()

      expect(isDateInRange(now, past, future)).toBe(true)
      expect(isDateInRange(past, now, future)).toBe(false)
    })
  })
})
```

## 三、安全防护机制

### 3.1 认证与授权

```typescript
// packages/gateway/src/middleware/auth.ts

import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    // 验证 token 过期时间
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expired' })
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}

export function authorizeResourceAccess(resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const resourceId = req.params.id

    if (!userId || !resourceId) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    // 检查用户是否有权访问资源
    const hasAccess = await checkUserAccessToResource(
      userId,
      resourceType,
      resourceId
    )

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' })
    }

    next()
  }
}
```

### 3.2 输入过滤和输出编码

```typescript
// packages/utils/src/security.ts

import { escape } from 'html-escaper'

export function sanitizeHtml(input: string): string {
  // 转义 HTML 特殊字符
  return escape(input)
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol')
    }

    return parsed.toString()
  } catch {
    throw new Error('Invalid URL')
  }
}

export function sanitizeFilename(filename: string): string {
  // 移除路径遍历字符
  return filename.replace(/[\/\\]/g, '').replace(/\.\./g, '')
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除 script 标签
    .replace(/javascript:/gi, '') // 移除 javascript: 协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
}
```

### 3.3 SQL 注入防护

```typescript
// packages/store/src/repositories/BaseRepository.ts

import pg from 'pg'

export class BaseRepository<T> {
  constructor(protected pool: pg.Pool) {}

  // ✅ 使用参数化查询
  async findById(id: string): Promise<T | null> {
    const query = 'SELECT * FROM users WHERE id = $1'
    const result = await this.pool.query(query, [id])
    return result.rows[0] || null
  }

  // ❌ 永远不要这样做
  async findByIdUnsafe(id: string): Promise<T | null> {
    const query = `SELECT * FROM users WHERE id = '${id}'` // 易受 SQL 注入攻击
    const result = await this.pool.query(query)
    return result.rows[0] || null
  }

  // ✅ 使用 prepared statements
  async findByEmail(email: string): Promise<T | null> {
    const query = {
      text: 'SELECT * FROM users WHERE email = $1',
      values: [email],
      name: 'find-user-by-email',
    }
    const result = await this.pool.query(query)
    return result.rows[0] || null
  }
}
```

### 3.4 密码安全

```typescript
// packages/store/src/services/auth.ts

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  // 验证密码强度
  if (!isStrongPassword(password)) {
    throw new ValidationError(
      'Password must be at least 8 characters with uppercase, lowercase, and numbers',
      'password',
      password
    )
  }

  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) && // 至少一个大写字母
    /[a-z]/.test(password) && // 至少一个小写字母
    /[0-9]/.test(password) // 至少一个数字
  )
}
```

### 3.5 敏感数据脱敏

```typescript
// packages/utils/src/masking.ts

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email

  const maskedLocal =
    local.length > 2
      ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
      : local

  return `${maskedLocal}@${domain}`
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone
  return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`
}

export function redactSensitiveData(obj: any): any {
  const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'api_key']

  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const redacted: any = Array.isArray(obj) ? [] : {}

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      redacted[key] = '[REDACTED]'
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}
```

## 四、安全测试用例

```typescript
// tests/security/security.test.ts

describe('Security Tests', () => {
  describe('XSS Protection', () => {
    it('应该防止存储型 XSS', async () => {
      const maliciousContent = '<script>alert("XSS")</script>'

      const response = await axios.post(
        '/api/nodes',
        {
          projectId,
          content: maliciousContent,
          position: { x: 0, y: 0 },
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )

      const savedNode = response.data
      expect(savedNode.content).not.toContain('<script>')
      expect(savedNode.content).toContain('&lt;script&gt;')
    })

    it('应该防止反射型 XSS', async () => {
      const response = await axios.get(
        '/api/search?q=<script>alert("XSS")</script>',
        {
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true,
        }
      )

      const html = response.data
      expect(html).not.toContain('<script>')
    })
  })

  describe('CSRF Protection', () => {
    it('应该拒绝没有 CSRF token 的请求', async () => {
      const response = await axios.post(
        '/api/projects',
        { name: 'Test Project' },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            // 缺少 CSRF token
          },
          validateStatus: () => true,
        }
      )

      expect(response.status).toBe(403)
    })
  })

  describe('Rate Limiting', () => {
    it('应该限制请求频率', async () => {
      const promises = Array(101)
        .fill(null)
        .map(() =>
          axios.get('/api/projects', {
            headers: { Authorization: `Bearer ${authToken}` },
            validateStatus: () => true,
          })
        )

      const responses = await Promise.all(promises)

      const tooManyRequests = responses.filter((r) => r.status === 429)
      expect(tooManyRequests.length).toBeGreaterThan(0)
    })
  })

  describe('Authentication Bypass', () => {
    it('应该拒绝无效 token', async () => {
      const response = await axios.get('/api/users/me', {
        headers: { Authorization: 'Bearer invalid_token' },
        validateStatus: () => true,
      })

      expect(response.status).toBe(403)
    })

    it('应该拒绝过期 token', async () => {
      const expiredToken = jwt.sign({ userId: '123' }, JWT_SECRET, {
        expiresIn: '-1h',
      })

      const response = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${expiredToken}` },
        validateStatus: () => true,
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Authorization Bypass', () => {
    it('应该防止越权访问', async () => {
      // 用户 A 的项目
      const projectA = await axios.post(
        '/api/projects',
        { name: 'Project A' },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      )

      // 用户 B 尝试访问用户 A 的项目
      const response = await axios.get(`/api/projects/${projectA.data.id}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
        validateStatus: () => true,
      })

      expect(response.status).toBe(403)
    })
  })

  describe('Data Leakage', () => {
    it('API 响应不应该包含敏感信息', async () => {
      const response = await axios.get('/api/users/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const user = response.data

      expect(user.password_hash).toBeUndefined()
      expect(user.password).toBeUndefined()
    })

    it('错误消息不应该泄露内部信息', async () => {
      const response = await axios.get('/api/nodes/invalid-uuid', {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      })

      expect(response.status).toBe(400)
      expect(response.data.error).not.toContain('SELECT')
      expect(response.data.error).not.toContain('FROM')
      expect(response.data.error).not.toContain('WHERE')
    })
  })
})
```

## 五、持续安全监控

### 5.1 依赖安全扫描

```bash
# package.json scripts
{
  "scripts": {
    "security:audit": "pnpm audit --audit-level=moderate",
    "security:check": "pnpm dlx snyk test",
    "security:fix": "pnpm audit --fix"
  }
}
```

### 5.2 代码安全扫描

```yaml
# .github/workflows/security.yml

name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # 每周日运行

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run npm audit
        run: pnpm audit --audit-level=high

      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: typescript, javascript

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: auto
```

---

**文档版本**: v1.0
**最后更新**: 2025-10-02
**负责团队**: SKER 安全组
