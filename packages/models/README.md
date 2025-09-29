# @sker/data-models - 数据模型与验证

> 扩展式AI协作画布系统的统一数据结构定义和验证体系

## 📋 概述

@sker/data-models 提供整个系统的数据模型定义、类型声明和验证逻辑。作为数据层的基础，它依赖 @sker/config 获取配置信息，为前后端提供一致的数据结构和类型安全保障。

## 🎯 设计原理

### 为什么需要独立的数据模型包？

1. **类型安全**: 前后端共享相同的TypeScript类型定义
2. **数据一致性**: 统一的数据结构避免不同模块间的数据不匹配
3. **验证集中**: 所有数据验证逻辑集中管理，确保数据完整性
4. **版本控制**: 数据模型的版本化管理，支持向后兼容
5. **文档生成**: 自动生成API文档和数据库Schema文档

### 架构设计思路

```mermaid
graph TD
    A[@sker/config] --> B[数据模型核心]
    B --> C[组件模型]
    B --> D[项目模型]
    B --> E[版本模型]
    B --> F[用户模型]
    B --> G[系统模型]
    
    C --> H[验证器]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[Schema生成器]
    H --> J[API文档生成]
    H --> K[数据库Schema]
    
    C --> L[前端使用]
    D --> L
    E --> L
    F --> L
    G --> L
    
    C --> M[后端使用]
    D --> M
    E --> M
    F --> M
    G --> M
```

## 🚀 核心功能

### 1. 数据模型定义
- 组件数据模型 (ComponentModel)
- 项目数据模型 (ProjectModel)
- 版本数据模型 (VersionModel)
- 用户数据模型 (UserModel)
- 系统配置模型 (SystemModel)

### 2. 数据验证体系
- Runtime验证 (使用Zod)
- 编译时类型检查
- 自定义验证规则
- 批量数据验证

### 3. 数据转换器
- 前端展示格式转换
- API请求格式转换
- 数据库存储格式转换
- 导入导出格式转换

### 4. Schema生成
- JSON Schema生成
- OpenAPI Schema生成
- 数据库Schema生成
- GraphQL Schema生成

### 5. 类型工具
- 联合类型工具
- 条件类型工具
- 映射类型工具
- 工具类型库

## 📦 安装使用

```bash
npm install @sker/data-models @sker/config
```

## 📖 API文档

### ComponentModel - 组件数据模型

```typescript
import { ComponentModel, componentSchema } from '@sker/data-models';

// 基础组件数据结构
interface ComponentData {
  id: string;
  title: string;
  content: string;
  semantic_type: 'text' | 'image' | 'video' | 'code' | 'table';
  importance_level: 1 | 2 | 3 | 4 | 5;
  confidence_score: number; // 0-100
  status: 'draft' | 'review' | 'approved' | 'published';
  version: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  metadata: ComponentMetadata;
  position: ComponentPosition;
  relationships: ComponentRelationship[];
}

// 组件元数据
interface ComponentMetadata {
  tags: string[];
  categories: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration: number; // 分钟
  complexity: 'simple' | 'medium' | 'complex';
  dependencies: string[]; // 依赖的组件ID
  ai_generated: boolean;
  ai_optimization_count: number;
  user_feedback: UserFeedback[];
  performance_metrics: PerformanceMetrics;
}

// 使用示例
const component: ComponentData = {
  id: 'comp_123',
  title: '用户认证组件',
  content: '实现用户登录、注册和密码重置功能...',
  semantic_type: 'text',
  importance_level: 4,
  confidence_score: 95,
  status: 'approved',
  version: 3,
  // ... 其他字段
};

// 数据验证
const validationResult = componentSchema.safeParse(component);
if (validationResult.success) {
  console.log('数据验证通过');
} else {
  console.error('验证错误:', validationResult.error.issues);
}

// 类型守卫
if (ComponentModel.isValidComponent(data)) {
  // data 现在被正确推断为 ComponentData 类型
}
```

### ProjectModel - 项目数据模型

```typescript
import { ProjectModel, projectSchema } from '@sker/data-models';

interface ProjectData {
  id: string;
  name: string;
  description: string;
  type: 'web' | 'mobile' | 'desktop' | 'api' | 'library';
  status: 'planning' | 'development' | 'testing' | 'deployed' | 'archived';
  visibility: 'public' | 'private' | 'team';
  
  // 项目配置
  config: ProjectConfig;
  
  // 组件管理
  components: string[]; // 组件ID列表
  component_tree: ComponentTree;
  
  // 协作信息
  owner: string;
  collaborators: ProjectCollaborator[];
  team_id?: string;
  
  // 版本管理
  current_version: string;
  versions: ProjectVersion[];
  
  // 元数据
  created_at: Date;
  updated_at: Date;
  last_accessed: Date;
  
  // 统计信息
  statistics: ProjectStatistics;
}

interface ProjectConfig {
  canvas_settings: CanvasSettings;
  ai_settings: AISettings;
  export_settings: ExportSettings;
  collaboration_settings: CollaborationSettings;
}

// 使用示例
const project: ProjectData = {
  id: 'proj_456',
  name: 'AI助手应用',
  description: '基于大语言模型的智能助手应用',
  type: 'web',
  status: 'development',
  visibility: 'team',
  // ... 其他字段
};

// 项目验证和操作
const isValidProject = projectSchema.safeParse(project).success;
const projectSummary = ProjectModel.getSummary(project);
const canEdit = ProjectModel.canUserEdit(project, userId);
```

### VersionModel - 版本数据模型

```typescript
import { VersionModel, versionSchema } from '@sker/data-models';

interface VersionData {
  id: string;
  project_id: string;
  component_id?: string; // 组件版本，可选
  
  // 版本信息
  version_number: string; // 语义化版本号
  version_name?: string;  // 版本别名
  version_type: 'major' | 'minor' | 'patch' | 'prerelease';
  
  // 变更信息
  change_type: 'created' | 'updated' | 'optimized' | 'refactored' | 'fixed';
  change_summary: string;
  change_details: ChangeDetail[];
  
  // 变更原因
  change_reason: 'user_request' | 'ai_optimization' | 'bug_fix' | 'feature_addition' | 'performance_improvement';
  trigger_source: 'manual' | 'ai_suggestion' | 'automated' | 'collaboration';
  
  // 数据快照
  data_snapshot: any; // 完整的数据快照
  data_diff: DataDiff; // 与上一版本的差异
  
  // 元数据
  created_by: string;
  created_at: Date;
  approved_by?: string;
  approved_at?: Date;
  
  // 质量评估
  quality_score: number; // 0-100
  validation_results: ValidationResult[];
  test_results?: TestResult[];
  
  // 关联信息
  parent_version?: string;
  child_versions: string[];
  merge_info?: MergeInfo;
}

interface ChangeDetail {
  field: string;
  old_value: any;
  new_value: any;
  change_type: 'added' | 'modified' | 'removed';
  impact_level: 'low' | 'medium' | 'high';
}

// 使用示例
const version: VersionData = {
  id: 'ver_789',
  project_id: 'proj_456',
  component_id: 'comp_123',
  version_number: '1.2.1',
  version_type: 'patch',
  change_type: 'optimized',
  change_summary: 'AI优化组件内容结构',
  change_reason: 'ai_optimization',
  trigger_source: 'ai_suggestion',
  // ... 其他字段
};

// 版本操作
const canRollback = VersionModel.canRollback(version);
const versionComparison = VersionModel.compare(version1, version2);
const versionHistory = VersionModel.getHistory(componentId);
```

### UserModel - 用户数据模型

```typescript
import { UserModel, userSchema } from '@sker/data-models';

interface UserData {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  
  // 身份信息
  role: 'admin' | 'manager' | 'developer' | 'viewer';
  permissions: Permission[];
  team_ids: string[];
  
  // 个人设置
  preferences: UserPreferences;
  settings: UserSettings;
  
  // 状态信息
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  last_login: Date;
  login_count: number;
  
  // 统计信息
  statistics: UserStatistics;
  
  // 元数据
  created_at: Date;
  updated_at: Date;
  verified_at?: Date;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  dashboard_layout: DashboardLayout;
  ai_assistance_level: 'minimal' | 'moderate' | 'aggressive';
}

interface UserStatistics {
  projects_created: number;
  components_created: number;
  ai_optimizations_used: number;
  collaboration_sessions: number;
  total_working_time: number; // 分钟
}

// 使用示例
const user: UserData = {
  id: 'user_101',
  email: 'developer@example.com',
  username: 'dev_user',
  display_name: '开发者用户',
  role: 'developer',
  status: 'active',
  // ... 其他字段
};

// 用户操作
const hasPermission = UserModel.hasPermission(user, 'project:create');
const userProjects = UserModel.getProjects(user);
const canAccess = UserModel.canAccessProject(user, projectId);
```

### SystemModel - 系统配置模型

```typescript
import { SystemModel, systemSchema } from '@sker/data-models';

interface SystemConfig {
  id: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  
  // AI配置
  ai_config: AIConfiguration;
  
  // 功能开关
  feature_flags: FeatureFlag[];
  
  // 限制配置
  limits: SystemLimits;
  
  // 安全配置
  security: SecurityConfig;
  
  // 监控配置
  monitoring: MonitoringConfig;
  
  // 更新时间
  updated_at: Date;
  updated_by: string;
}

interface SystemLimits {
  max_projects_per_user: number;
  max_components_per_project: number;
  max_file_size: number; // bytes
  max_ai_requests_per_hour: number;
  max_collaborators_per_project: number;
}

// 使用示例
const systemConfig = await SystemModel.getCurrentConfig();
const isFeatureEnabled = SystemModel.isFeatureEnabled('ai-optimization');
const userLimits = SystemModel.getUserLimits(userId);
```

## 🛠️ 开发指南

### 项目结构

```
data-models/
├── src/
│   ├── models/            # 数据模型定义
│   │   ├── ComponentModel.ts
│   │   ├── ProjectModel.ts
│   │   ├── VersionModel.ts
│   │   ├── UserModel.ts
│   │   └── SystemModel.ts
│   ├── schemas/           # Zod验证Schema
│   │   ├── component.ts
│   │   ├── project.ts
│   │   ├── version.ts
│   │   ├── user.ts
│   │   └── system.ts
│   ├── types/             # TypeScript类型定义
│   │   ├── component.ts
│   │   ├── project.ts
│   │   ├── version.ts
│   │   ├── user.ts
│   │   ├── system.ts
│   │   ├── common.ts
│   │   └── index.ts
│   ├── validators/        # 验证器
│   │   ├── runtime.ts
│   │   ├── schema.ts
│   │   └── custom.ts
│   ├── transformers/      # 数据转换器
│   │   ├── api.ts
│   │   ├── database.ts
│   │   ├── frontend.ts
│   │   └── export.ts
│   ├── generators/        # Schema生成器
│   │   ├── json-schema.ts
│   │   ├── openapi.ts
│   │   ├── database.ts
│   │   └── graphql.ts
│   ├── utils/             # 工具函数
│   │   ├── type-guards.ts
│   │   ├── helpers.ts
│   │   └── migrations.ts
│   └── index.ts           # 统一导出
├── schemas/               # 生成的Schema文件
│   ├── json-schema/
│   ├── openapi/
│   ├── database/
│   └── graphql/
├── tests/                 # 测试文件
│   ├── models.test.ts
│   ├── validation.test.ts
│   ├── transformers.test.ts
│   └── generators.test.ts
└── docs/                  # 详细文档
    ├── api.md
    ├── validation.md
    └── migrations.md
```

### 数据验证体系

```typescript
// schemas/component.ts
import { z } from 'zod';
import { EnvironmentConfig } from '@sker/config';

// 基础Schema定义
const componentBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  semantic_type: z.enum(['text', 'image', 'video', 'code', 'table']),
  importance_level: z.number().int().min(1).max(5),
  confidence_score: z.number().min(0).max(100),
  status: z.enum(['draft', 'review', 'approved', 'published']),
  version: z.number().int().positive(),
  created_at: z.date(),
  updated_at: z.date(),
});

// 根据环境配置调整验证规则
export const getComponentSchema = () => {
  const config = EnvironmentConfig.get();
  const baseSchema = componentBaseSchema;
  
  // 在开发环境中可能有更宽松的验证
  if (config.environment === 'development') {
    return baseSchema.extend({
      content: z.string().min(1), // 开发环境允许更短的内容
    });
  }
  
  // 生产环境的严格验证
  return baseSchema.extend({
    content: z.string().min(10).max(10000), // 生产环境内容长度限制
    title: z.string().min(5).max(100),      // 更严格的标题要求
  });
};

export const componentSchema = getComponentSchema();

// 自定义验证规则
export const customValidators = {
  // 验证组件内容质量
  validateContentQuality: (content: string): boolean => {
    const wordCount = content.split(/\s+/).length;
    const hasStructure = /^#{1,6}\s/.test(content); // 检查是否有标题结构
    return wordCount >= 10 && hasStructure;
  },
  
  // 验证语义类型与内容匹配
  validateSemanticType: (type: string, content: string): boolean => {
    switch (type) {
      case 'code':
        return /```[\s\S]*```/.test(content); // 检查代码块
      case 'image':
        return /!\[.*\]\(.*\)/.test(content); // 检查图片语法
      default:
        return true;
    }
  },
};
```

### 数据转换器

```typescript
// transformers/api.ts
export class APITransformer {
  // 前端到API格式转换
  static toAPIFormat(component: ComponentData): APIComponentData {
    return {
      ...component,
      created_at: component.created_at.toISOString(),
      updated_at: component.updated_at.toISOString(),
      metadata: JSON.stringify(component.metadata),
    };
  }
  
  // API到前端格式转换
  static fromAPIFormat(apiData: APIComponentData): ComponentData {
    return {
      ...apiData,
      created_at: new Date(apiData.created_at),
      updated_at: new Date(apiData.updated_at),
      metadata: JSON.parse(apiData.metadata),
    };
  }
  
  // 批量转换
  static transformArray<T, U>(
    items: T[],
    transformer: (item: T) => U
  ): U[] {
    return items.map(transformer);
  }
}

// transformers/database.ts
export class DatabaseTransformer {
  // 数据库存储格式转换
  static toDatabaseFormat(component: ComponentData): DatabaseComponentData {
    return {
      id: component.id,
      title: component.title,
      content: component.content,
      semantic_type: component.semantic_type,
      importance_level: component.importance_level,
      confidence_score: component.confidence_score,
      status: component.status,
      version: component.version,
      created_at: component.created_at,
      updated_at: component.updated_at,
      created_by: component.created_by,
      updated_by: component.updated_by,
      metadata_json: JSON.stringify(component.metadata),
      position_json: JSON.stringify(component.position),
      relationships_json: JSON.stringify(component.relationships),
    };
  }
  
  // 从数据库格式转换
  static fromDatabaseFormat(dbData: DatabaseComponentData): ComponentData {
    return {
      ...dbData,
      metadata: JSON.parse(dbData.metadata_json),
      position: JSON.parse(dbData.position_json),
      relationships: JSON.parse(dbData.relationships_json),
    };
  }
}
```

### Schema生成器

```typescript
// generators/json-schema.ts
export class JSONSchemaGenerator {
  static generateComponentSchema(): JSONSchema7 {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://schemas.sker.ai/component.json',
      title: 'Component',
      description: 'AI协作画布组件数据结构',
      type: 'object',
      required: [
        'id', 'title', 'content', 'semantic_type',
        'importance_level', 'confidence_score', 'status', 'version'
      ],
      properties: {
        id: {
          type: 'string',
          description: '组件唯一标识符',
          pattern: '^comp_[a-zA-Z0-9]+$'
        },
        title: {
          type: 'string',
          description: '组件标题',
          minLength: 1,
          maxLength: 200
        },
        // ... 其他属性定义
      },
      additionalProperties: false
    };
  }
  
  // 自动生成所有模型的JSON Schema
  static generateAllSchemas(): Record<string, JSONSchema7> {
    return {
      component: this.generateComponentSchema(),
      project: this.generateProjectSchema(),
      version: this.generateVersionSchema(),
      user: this.generateUserSchema(),
      system: this.generateSystemSchema(),
    };
  }
}

// generators/openapi.ts
export class OpenAPIGenerator {
  static generateComponentPaths(): OpenAPIV3.PathsObject {
    return {
      '/components': {
        get: {
          summary: '获取组件列表',
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Component' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: '创建新组件',
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Component' }
              }
            }
          }
        }
      }
    };
  }
}
```

## 🧪 测试策略

### 模型测试

```typescript
// tests/models.test.ts
describe('ComponentModel', () => {
  it('应该正确验证有效的组件数据', () => {
    const validComponent: ComponentData = {
      id: 'comp_test123',
      title: '测试组件',
      content: '# 测试内容\n这是一个测试组件的内容。',
      semantic_type: 'text',
      importance_level: 3,
      confidence_score: 85,
      status: 'draft',
      version: 1,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'user_test',
      updated_by: 'user_test',
      metadata: { tags: ['test'], categories: ['demo'] },
      position: { x: 0, y: 0 },
      relationships: []
    };
    
    const result = componentSchema.safeParse(validComponent);
    expect(result.success).toBe(true);
  });
  
  it('应该拒绝无效的组件数据', () => {
    const invalidComponent = {
      id: '', // 无效的ID
      title: 'a'.repeat(300), // 标题过长
      importance_level: 6, // 超出范围
    };
    
    const result = componentSchema.safeParse(invalidComponent);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toBeDefined();
  });
});
```

### 验证测试

```typescript
// tests/validation.test.ts
describe('数据验证', () => {
  it('应该根据环境调整验证规则', () => {
    // 模拟开发环境
    jest.mock('@sker/config', () => ({
      EnvironmentConfig: {
        get: () => ({ environment: 'development' })
      }
    }));
    
    const devSchema = getComponentSchema();
    const shortContent = { content: 'short' };
    
    expect(devSchema.shape.content.safeParse('short').success).toBe(true);
  });
  
  it('应该验证自定义规则', () => {
    const validContent = '# 标题\n这是有结构的内容，包含足够的文字。';
    const invalidContent = '太短';
    
    expect(customValidators.validateContentQuality(validContent)).toBe(true);
    expect(customValidators.validateContentQuality(invalidContent)).toBe(false);
  });
});
```

### 转换器测试

```typescript
// tests/transformers.test.ts
describe('数据转换器', () => {
  it('API转换器应该正确转换日期', () => {
    const component: ComponentData = createTestComponent();
    const apiFormat = APITransformer.toAPIFormat(component);
    const backToOriginal = APITransformer.fromAPIFormat(apiFormat);
    
    expect(backToOriginal.created_at).toEqual(component.created_at);
    expect(backToOriginal.metadata).toEqual(component.metadata);
  });
  
  it('数据库转换器应该处理JSON序列化', () => {
    const component: ComponentData = createTestComponent();
    const dbFormat = DatabaseTransformer.toDatabaseFormat(component);
    const backToOriginal = DatabaseTransformer.fromDatabaseFormat(dbFormat);
    
    expect(backToOriginal).toEqual(component);
  });
});
```

## 📊 性能考虑

1. **验证缓存**: 缓存验证结果，避免重复验证相同数据
2. **懒加载Schema**: 按需加载验证Schema，减少初始加载时间
3. **批量验证**: 提供批量数据验证接口，提高处理效率
4. **增量验证**: 只验证变更的字段，而不是整个对象

```typescript
// 示例：带缓存的验证器
class CachedValidator {
  private cache = new Map<string, ValidationResult>();
  
  validate(data: any, schema: ZodSchema): ValidationResult {
    const key = this.getCacheKey(data, schema);
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    const result = schema.safeParse(data);
    this.cache.set(key, result);
    
    return result;
  }
  
  private getCacheKey(data: any, schema: ZodSchema): string {
    return `${JSON.stringify(data)}_${schema._def.typeName}`;
  }
}
```

## 🔄 数据迁移

```typescript
// utils/migrations.ts
export class DataMigration {
  static migrateComponentV1ToV2(v1Data: ComponentDataV1): ComponentDataV2 {
    return {
      ...v1Data,
      semantic_type: v1Data.type, // 字段重命名
      metadata: {
        ...v1Data.metadata,
        ai_generated: false, // 添加新字段
      },
      version: v1Data.version || 1, // 默认版本
    };
  }
  
  static getMigrationPath(fromVersion: string, toVersion: string): Migration[] {
    // 返回从旧版本到新版本的迁移路径
    return [
      { from: '1.0', to: '1.1', migrate: this.migrateV1ToV1_1 },
      { from: '1.1', to: '2.0', migrate: this.migrateV1_1ToV2 },
    ];
  }
}
```

## 🎨 最佳实践

1. **类型先行**: 先定义TypeScript类型，再实现运行时验证
2. **渐进式验证**: 支持部分数据验证，便于表单逐步填写
3. **错误友好**: 提供清晰的验证错误信息
4. **版本兼容**: 保持向后兼容，提供数据迁移路径
5. **文档同步**: 自动生成并更新API文档

## 🚨 安全注意事项

1. **输入验证**: 严格验证所有外部输入数据
2. **SQL注入防护**: 使用参数化查询，避免SQL注入
3. **XSS防护**: 对用户输入进行适当的转义和清理
4. **敏感数据**: 标记和保护敏感数据字段

## 📈 版本历史

- **v1.0.0**: 初始版本，基础数据模型
- **v1.1.0**: 添加版本控制数据模型
- **v1.2.0**: 增强验证体系和自定义规则
- **v1.3.0**: 添加数据转换器和Schema生成器
- **v2.0.0**: 重构架构，支持多环境配置

## 🤝 贡献指南

1. 新增模型必须包含完整的类型定义和验证Schema
2. 提供数据迁移脚本（如果有破坏性变更）
3. 更新相关的JSON Schema和OpenAPI定义
4. 确保测试覆盖率达到90%以上

## 📄 许可证

MIT License