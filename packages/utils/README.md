# @sker/utils - 通用工具库

> 扩展式AI协作画布系统的通用工具函数集合

## 📋 概述

@sker/utils 提供整个 packages 工具库共享的通用工具函数、常量定义和帮助方法。作为基础设施包，它依赖 @sker/config 获取配置信息，为上层包提供稳定可靠的工具支撑。

## 🎯 设计原理

### 为什么需要独立的工具包？

1. **代码复用**: 避免在各个包中重复实现相同的工具函数
2. **标准化**: 提供一致的数据处理和格式化标准
3. **类型安全**: 所有工具函数都提供完整的TypeScript类型支持
4. **性能优化**: 经过优化的高性能工具函数实现
5. **测试覆盖**: 全面的单元测试确保工具函数的可靠性

### 架构设计思路

```mermaid
graph TD
    A[@sker/config] --> B[Utils Core]
    B --> C[Date Utils]
    B --> D[String Utils] 
    B --> E[Validation Utils]
    B --> F[Format Utils]
    B --> G[Array Utils]
    B --> H[Object Utils]
    B --> I[File Utils]
    B --> J[Constants]
    
    C --> K[其他包使用]
    D --> K
    E --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
```

## 🚀 核心功能

### 1. 日期时间工具 (DateUtils)
- 相对时间格式化
- 时区转换处理
- 日期范围计算
- 国际化日期支持

### 2. 字符串处理 (StringUtils)
- 文本截断和省略
- 驼峰/下划线转换
- 文本高亮和搜索
- 多语言字符处理

### 3. 数据验证 (ValidationUtils)
- 邮箱/电话验证
- URL格式验证
- 文件类型验证
- 自定义规则验证

### 4. 格式化工具 (FormatUtils)
- 数字格式化
- 文件大小格式化
- 货币格式化
- 百分比格式化

### 5. 数组操作 (ArrayUtils)
- 数组去重和排序
- 分页和分组
- 数组差集/交集
- 深度对比

### 6. 对象操作 (ObjectUtils)
- 深拷贝/浅拷贝
- 对象合并
- 属性路径访问
- 对象扁平化

### 7. 文件处理 (FileUtils)
- 文件类型检测
- 文件大小计算
- Base64编解码
- 文件下载/上传

### 8. 常量定义 (Constants)
- 业务常量
- 配置常量
- 错误码定义
- 正则表达式

## 📦 安装使用

```bash
npm install @sker/utils @sker/config
```

## 📖 API文档

### DateUtils - 日期时间工具

```typescript
import { DateUtils } from '@sker/utils';

// 相对时间格式化
const relativeTime = DateUtils.formatRelative(new Date('2024-01-01'));
// "3个月前"

// 格式化日期
const formatted = DateUtils.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
// "2024-04-15 14:30:25"

// 时间差计算
const duration = DateUtils.getDuration(startDate, endDate);
// { days: 5, hours: 3, minutes: 30 }

// 时区转换
const utcTime = DateUtils.toUTC(localTime);
const localTime = DateUtils.fromUTC(utcTime, 'Asia/Shanghai');

// 日期范围检查
const isInRange = DateUtils.isInRange(date, startDate, endDate);

// 工作日计算
const workDays = DateUtils.getWorkDays(startDate, endDate);
```

### StringUtils - 字符串处理

```typescript
import { StringUtils } from '@sker/utils';

// 文本截断
const truncated = StringUtils.truncate('很长的文本内容', 10);
// "很长的文本..."

// 驼峰转换
const camelCase = StringUtils.toCamelCase('hello_world_test');
// "helloWorldTest"

const snakeCase = StringUtils.toSnakeCase('helloWorldTest');
// "hello_world_test"

// 文本高亮
const highlighted = StringUtils.highlight('搜索文本内容', '文本');
// "搜索<mark>文本</mark>内容"

// 随机字符串生成
const randomId = StringUtils.generateId(8);
// "a7b9c3d1"

// 文本相似度
const similarity = StringUtils.similarity('文本A', '文本B');
// 0.75

// 字符串模板
const template = StringUtils.template('Hello {name}', { name: 'World' });
// "Hello World"
```

### ValidationUtils - 数据验证

```typescript
import { ValidationUtils } from '@sker/utils';

// 邮箱验证
const isEmail = ValidationUtils.isValidEmail('user@example.com');
// true

// 手机号验证
const isPhone = ValidationUtils.isValidPhone('13812345678');
// true

// URL验证
const isUrl = ValidationUtils.isValidUrl('https://example.com');
// true

// 身份证验证
const isIdCard = ValidationUtils.isValidIdCard('110101199001011234');
// true

// 密码强度检查
const passwordStrength = ValidationUtils.getPasswordStrength('P@ssw0rd123');
// { level: 'strong', score: 85 }

// 自定义规则验证
const isValid = ValidationUtils.validate(value, {
  required: true,
  minLength: 6,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9]+$/
});

// 表单验证
const errors = ValidationUtils.validateForm({
  email: 'invalid-email',
  password: '123'
}, {
  email: { required: true, email: true },
  password: { required: true, minLength: 6 }
});
```

### FormatUtils - 格式化工具

```typescript
import { FormatUtils } from '@sker/utils';

// 数字格式化
const formattedNumber = FormatUtils.formatNumber(1234567.89);
// "1,234,567.89"

// 文件大小格式化
const fileSize = FormatUtils.formatFileSize(1024 * 1024 * 2.5);
// "2.5 MB"

// 货币格式化
const currency = FormatUtils.formatCurrency(1234.56, 'CNY');
// "¥1,234.56"

// 百分比格式化
const percentage = FormatUtils.formatPercentage(0.1234);
// "12.34%"

// 时长格式化
const duration = FormatUtils.formatDuration(3665); // 秒
// "1小时1分5秒"

// 银行卡号格式化
const cardNumber = FormatUtils.formatCardNumber('1234567890123456');
// "1234 **** **** 3456"

// JSON格式化
const prettyJson = FormatUtils.formatJSON({ name: 'test', value: 123 });
```

### ArrayUtils - 数组操作

```typescript
import { ArrayUtils } from '@sker/utils';

// 数组去重
const unique = ArrayUtils.unique([1, 2, 2, 3, 3, 4]);
// [1, 2, 3, 4]

// 对象数组去重
const uniqueObjects = ArrayUtils.uniqueBy(users, 'id');

// 数组分组
const grouped = ArrayUtils.groupBy(users, 'department');
// { 'IT': [...], 'HR': [...] }

// 数组分页
const paginated = ArrayUtils.paginate(largeArray, 1, 10);
// { data: [...], total: 100, page: 1, pageSize: 10 }

// 数组排序
const sorted = ArrayUtils.sortBy(users, 'name', 'asc');

// 数组交集
const intersection = ArrayUtils.intersection([1, 2, 3], [2, 3, 4]);
// [2, 3]

// 数组差集
const difference = ArrayUtils.difference([1, 2, 3], [2, 3, 4]);
// [1]

// 数组随机打乱
const shuffled = ArrayUtils.shuffle([1, 2, 3, 4, 5]);

// 数组分块
const chunks = ArrayUtils.chunk([1, 2, 3, 4, 5, 6], 2);
// [[1, 2], [3, 4], [5, 6]]
```

### ObjectUtils - 对象操作

```typescript
import { ObjectUtils } from '@sker/utils';

// 深拷贝
const cloned = ObjectUtils.deepClone(originalObject);

// 对象合并
const merged = ObjectUtils.merge(obj1, obj2, obj3);

// 属性路径访问
const value = ObjectUtils.get(obj, 'user.profile.name');
ObjectUtils.set(obj, 'user.profile.age', 25);

// 对象扁平化
const flattened = ObjectUtils.flatten({
  user: { name: 'John', profile: { age: 25 } }
});
// { 'user.name': 'John', 'user.profile.age': 25 }

// 对象反扁平化
const nested = ObjectUtils.unflatten(flattened);

// 对象过滤
const filtered = ObjectUtils.pick(obj, ['name', 'age']);
const omitted = ObjectUtils.omit(obj, ['password', 'secret']);

// 对象比较
const isEqual = ObjectUtils.deepEqual(obj1, obj2);

// 空值检查
const isEmpty = ObjectUtils.isEmpty(obj);
const hasValue = ObjectUtils.hasValue(obj, 'user.name');
```

### FileUtils - 文件处理

```typescript
import { FileUtils } from '@sker/utils';

// 文件类型检测
const fileType = FileUtils.getFileType('document.pdf');
// 'pdf'

const mimeType = FileUtils.getMimeType('image.jpg');
// 'image/jpeg'

// 文件大小验证
const isValidSize = FileUtils.validateSize(file, 5 * 1024 * 1024); // 5MB

// Base64转换
const base64 = await FileUtils.toBase64(file);
const file = FileUtils.fromBase64(base64String, 'image.jpg');

// 文件下载
FileUtils.download(data, 'filename.txt', 'text/plain');

// 图片压缩
const compressed = await FileUtils.compressImage(imageFile, {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.8
});

// 文件读取
const content = await FileUtils.readAsText(file);
const arrayBuffer = await FileUtils.readAsArrayBuffer(file);

// 批量文件处理
const results = await FileUtils.processBatch(files, (file) => {
  return FileUtils.compressImage(file);
});
```

### Constants - 常量定义

```typescript
import { Constants } from '@sker/utils';

// 业务常量
Constants.COMPONENT_TYPES.TEXT;        // 'text'
Constants.COMPONENT_TYPES.IMAGE;       // 'image'
Constants.COMPONENT_TYPES.VIDEO;       // 'video'

// 状态常量
Constants.STATUS.PENDING;              // 'pending'
Constants.STATUS.PROCESSING;           // 'processing'
Constants.STATUS.COMPLETED;            // 'completed'
Constants.STATUS.FAILED;               // 'failed'

// 错误码
Constants.ERROR_CODES.INVALID_INPUT;   // 'E001'
Constants.ERROR_CODES.NETWORK_ERROR;   // 'E002'
Constants.ERROR_CODES.AUTH_FAILED;     // 'E003'

// 正则表达式
Constants.REGEX.EMAIL;                 // 邮箱正则
Constants.REGEX.PHONE;                 // 手机号正则
Constants.REGEX.URL;                   // URL正则
Constants.REGEX.PASSWORD;              // 密码强度正则

// 配置常量
Constants.CONFIG.MAX_FILE_SIZE;        // 最大文件大小
Constants.CONFIG.SUPPORTED_FORMATS;    // 支持的文件格式
Constants.CONFIG.DEFAULT_PAGE_SIZE;    // 默认分页大小

// 时间常量
Constants.TIME.SECOND;                 // 1000
Constants.TIME.MINUTE;                 // 60 * 1000
Constants.TIME.HOUR;                   // 60 * 60 * 1000
Constants.TIME.DAY;                    // 24 * 60 * 60 * 1000
```

## 🛠️ 开发指南

### 项目结构

```
utils/
├── src/
│   ├── date/              # 日期时间工具
│   │   ├── DateUtils.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── string/            # 字符串工具
│   │   ├── StringUtils.ts
│   │   ├── converters.ts
│   │   └── generators.ts
│   ├── validation/        # 验证工具
│   │   ├── ValidationUtils.ts
│   │   ├── rules.ts
│   │   └── schemas.ts
│   ├── format/            # 格式化工具
│   │   ├── FormatUtils.ts
│   │   ├── number.ts
│   │   ├── currency.ts
│   │   └── file.ts
│   ├── array/             # 数组工具
│   │   ├── ArrayUtils.ts
│   │   ├── operations.ts
│   │   └── algorithms.ts
│   ├── object/            # 对象工具
│   │   ├── ObjectUtils.ts
│   │   ├── manipulation.ts
│   │   └── comparison.ts
│   ├── file/              # 文件工具
│   │   ├── FileUtils.ts
│   │   ├── processors.ts
│   │   └── validators.ts
│   ├── constants/         # 常量定义
│   │   ├── business.ts
│   │   ├── errors.ts
│   │   ├── regex.ts
│   │   └── config.ts
│   ├── types/             # 类型定义
│   │   ├── common.ts
│   │   ├── validation.ts
│   │   └── formatting.ts
│   └── index.ts           # 统一导出
├── tests/                 # 测试文件
│   ├── date.test.ts
│   ├── string.test.ts
│   ├── validation.test.ts
│   ├── format.test.ts
│   ├── array.test.ts
│   ├── object.test.ts
│   ├── file.test.ts
│   └── integration.test.ts
└── docs/                  # 详细文档
    ├── api.md
    ├── examples.md
    └── migration.md
```

### 类型定义示例

```typescript
// types/common.ts
export interface PaginationOptions {
  page: number;
  pageSize: number;
  total?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FileProcessOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}
```

### 依赖 @sker/config 的使用

```typescript
// 获取配置进行格式化
import { EnvironmentConfig } from '@sker/config';

export class FormatUtils {
  static formatCurrency(amount: number, currency?: string): string {
    const config = EnvironmentConfig.get();
    const defaultCurrency = config.locale?.currency || 'CNY';
    const locale = config.locale?.name || 'zh-CN';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || defaultCurrency,
    }).format(amount);
  }
  
  static formatDate(date: Date, format?: string): string {
    const config = EnvironmentConfig.get();
    const locale = config.locale?.name || 'zh-CN';
    const timezone = config.locale?.timezone || 'Asia/Shanghai';
    
    // 使用配置的本地化设置
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      // ... 其他格式选项
    }).format(date);
  }
}

// 根据环境配置调整工具行为
export class ValidationUtils {
  static isValidPhone(phone: string): boolean {
    const config = EnvironmentConfig.get();
    const region = config.locale?.region || 'CN';
    
    // 根据地区使用不同的验证规则
    switch (region) {
      case 'CN':
        return Constants.REGEX.PHONE_CN.test(phone);
      case 'US':
        return Constants.REGEX.PHONE_US.test(phone);
      default:
        return Constants.REGEX.PHONE_INTERNATIONAL.test(phone);
    }
  }
}
```

## 🧪 测试策略

### 单元测试

```typescript
// tests/string.test.ts
describe('StringUtils', () => {
  describe('truncate', () => {
    it('应该正确截断英文文本', () => {
      const result = StringUtils.truncate('Hello World', 5);
      expect(result).toBe('Hello...');
    });

    it('应该正确截断中文文本', () => {
      const result = StringUtils.truncate('你好世界测试', 4);
      expect(result).toBe('你好世界...');
    });

    it('短文本不应该被截断', () => {
      const result = StringUtils.truncate('短文本', 10);
      expect(result).toBe('短文本');
    });
  });

  describe('toCamelCase', () => {
    it('应该正确转换下划线命名', () => {
      expect(StringUtils.toCamelCase('hello_world')).toBe('helloWorld');
      expect(StringUtils.toCamelCase('user_name_test')).toBe('userNameTest');
    });
  });
});
```

### 性能测试

```typescript
// tests/performance.test.ts
describe('工具函数性能测试', () => {
  it('ArrayUtils.unique 应该在合理时间内处理大数组', () => {
    const largeArray = Array.from({ length: 100000 }, (_, i) => i % 1000);
    
    const start = performance.now();
    const result = ArrayUtils.unique(largeArray);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100); // 应该在100ms内完成
    expect(result.length).toBe(1000);
  });
});
```

### 集成测试

```typescript
// tests/integration.test.ts
describe('Utils 集成测试', () => {
  it('应该能够与 @sker/config 正常集成', () => {
    // 模拟配置
    jest.mock('@sker/config', () => ({
      EnvironmentConfig: {
        get: () => ({
          locale: { name: 'zh-CN', currency: 'CNY', region: 'CN' }
        })
      }
    }));

    const formatted = FormatUtils.formatCurrency(1234.56);
    expect(formatted).toMatch(/¥.*1,234.56/);
  });
});
```

## 📊 性能优化

1. **懒加载**: 大型工具函数按需导入
2. **缓存机制**: 计算结果缓存，避免重复计算
3. **算法优化**: 使用高效算法实现常用操作
4. **内存管理**: 及时清理临时对象，避免内存泄漏
5. **批量处理**: 提供批量操作接口，减少函数调用开销

```typescript
// 示例：带缓存的计算函数
const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const expensiveCalculation = memoize((input: string): number => {
  // 复杂计算逻辑
  return input.length * Math.random();
});
```

## 🎨 最佳实践

1. **纯函数优先**: 所有工具函数都应该是纯函数，无副作用
2. **类型安全**: 提供完整的TypeScript类型定义
3. **错误处理**: 优雅处理边界情况和异常
4. **文档完善**: 每个函数都有详细的JSDoc注释
5. **测试覆盖**: 保持95%以上的测试覆盖率

## 🚨 注意事项

1. **浏览器兼容性**: 确保工具函数在目标浏览器中正常工作
2. **性能考虑**: 大数据量处理时注意性能优化
3. **安全性**: 避免XSS和注入攻击，特别是字符串处理函数
4. **国际化**: 考虑多语言和不同地区的处理差异

## 📈 版本历史

- **v1.0.0**: 初始版本，基础工具函数
- **v1.1.0**: 添加文件处理工具
- **v1.2.0**: 增强验证和格式化功能
- **v1.3.0**: 性能优化和错误处理改进
- **v1.4.0**: 添加批量处理和缓存机制

## 🤝 贡献指南

1. 所有新增工具函数必须包含完整的单元测试
2. 提交前运行性能测试确保无性能回退
3. 更新文档和示例代码
4. 遵循现有的代码风格和命名规范

## 📄 许可证

MIT License