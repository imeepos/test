# 构建规范文档

## 概述

本文档定义了SKER项目的统一构建标准，基于最新的重构实践，规范了packages和apps的构建工具选择、配置方式和输出格式。

## 设计理念

### 为什么选择tsup用于packages？

- **简单高效**: 零配置即可使用，配置简洁
- **双格式输出**: 同时支持ESM和CJS，兼容性强
- **类型声明**: 自动生成.d.ts文件
- **Tree-shaking**: 内置优化，减小包体积
- **快速构建**: 基于esbuild，构建速度极快

### 为什么apps保留Vite？

- **开发体验**: HMR热更新，开发效率高
- **插件生态**: React、SWC等插件成熟
- **代码分包**: 精细的chunk拆分控制
- **资源处理**: 完善的静态资源处理能力

---

## 一、Packages构建规范

### 1.1 适用范围

所有位于`packages/`目录下的共享库和工具包，包括但不限于：
- 数据模型包（models、types）
- 工具包（utils、config）
- 业务逻辑包（engine、broker、store）
- 后端服务包（backend、gateway、api）

### 1.2 构建工具

**统一使用tsup**

### 1.3 标准配置

#### 基础配置模板

**文件位置**: `packages/[package-name]/tsup.config.ts`

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: [
    // 根据实际情况添加外部依赖
  ]
})
```

#### 配置项说明

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `entry` | `['src/index.ts']` | 入口文件，支持多入口 |
| `format` | `['esm', 'cjs']` | 输出ESM和CJS双格式 |
| `dts` | `true` | 生成TypeScript类型声明文件 |
| `clean` | `true` | 构建前清理dist目录 |
| `sourcemap` | `true` | 生成sourcemap便于调试 |
| `treeshake` | `true` | 启用tree-shaking优化 |
| `external` | `[...]` | 排除的外部依赖，避免打包 |

#### Node.js后端包配置

对于纯Node.js运行的包（如backend、gateway），额外添加：

```typescript
export default defineConfig({
  // ... 基础配置
  target: 'node18',
  format: ['esm'], // 后端可只输出ESM
  external: [
    'express',
    'pg',
    'redis',
    'winston',
    // 其他runtime依赖
  ]
})
```

### 1.4 package.json配置

#### 标准字段

```json
{
  "name": "@sker/package-name",
  "version": "1.0.0",
  "description": "包描述",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "types"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "clean": "rimraf dist"
  }
}
```

#### 字段说明

- **type**: 设置为`"module"`支持ESM
- **main**: CJS入口（向后兼容）
- **module**: ESM入口
- **types**: 类型声明文件入口
- **exports**: 现代化的导出定义（优先级最高）
- **files**: 发布到npm时包含的文件

### 1.5 输出目录结构

```
packages/[package-name]/
├── dist/
│   ├── index.cjs        # CommonJS格式
│   ├── index.esm.js     # ES Module格式
│   ├── index.d.ts       # 类型声明
│   ├── index.cjs.map    # CJS sourcemap
│   └── index.esm.js.map # ESM sourcemap
├── src/
│   └── index.ts
├── tsup.config.ts
└── package.json
```

---

## 二、Apps构建规范

### 2.1 适用范围

所有位于`apps/`目录下的前端应用，包括：
- studio - AI协作画布应用
- developer - 开发者工具
- 其他未来的前端应用

### 2.2 构建工具

**统一使用Vite**

### 2.3 标准配置

#### Vite配置模板

**文件位置**: `apps/[app-name]/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // CSS配置
  css: {
    postcss: './postcss.config.js',
  },

  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/constants': path.resolve(__dirname, './src/constants'),
    },
  },

  // 开发服务器
  server: {
    port: 3000, // 根据应用调整端口
    host: true,
  },

  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // 提高到1000KB
    rollupOptions: {
      output: {
        manualChunks: {
          // 根据应用实际依赖配置
          'react-vendor': ['react', 'react-dom'],
          'state-management': ['zustand', '@tanstack/react-query'],
          // 其他分包策略见下文
        },
      },
    },
  },

  // 依赖优化
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
```

### 2.4 代码分包策略

#### 分包原则

1. **vendor分包**: 将框架核心库单独打包
2. **功能模块分包**: 按功能域拆分大型库
3. **按需加载**: 路由级别的代码分割
4. **避免重复**: 共享模块提取到common chunk

#### Studio应用分包示例

```typescript
manualChunks: {
  // React核心
  'react-vendor': ['react', 'react-dom'],

  // ReactFlow图形库
  'reactflow': ['reactflow'],

  // 状态管理
  'state-management': ['zustand', '@tanstack/react-query'],

  // UI图标
  'ui-icons': ['lucide-react'],

  // 动画库
  'framer': ['framer-motion']
}
```

#### Developer应用分包示例

```typescript
manualChunks: {
  // React核心
  'react-vendor': ['react', 'react-dom'],

  // Ant Design核心
  'antd-core': ['antd'],

  // Ant Design图标
  'antd-icons': ['@ant-design/icons'],

  // Monaco编辑器
  'monaco-editor': ['monaco-editor', '@monaco-editor/react'],
}
```

#### 分包大小控制

- **单个chunk建议大小**: 100KB - 500KB
- **告警阈值**: 1000KB（已在配置中设置）
- **超大依赖处理**: 考虑CDN引入或动态加载

### 2.5 package.json配置

```json
{
  "name": "@sker/app-name",
  "version": "1.0.0",
  "description": "应用描述",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    // 运行时依赖
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.5.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}
```

---

## 三、Turbo构建配置

### 3.1 Turbo配置

**文件位置**: `/turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "outputs": []
    },
    "test": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 3.2 构建命令

#### 全量构建

```bash
# 构建所有包和应用
pnpm build

# 只构建packages
pnpm run build --filter="./packages/*"

# 只构建apps
pnpm run build --filter="./apps/*"
```

#### 单包构建

```bash
# 构建指定package
pnpm run --filter=@sker/models build

# 构建指定app
pnpm run --filter=@sker/studio build
```

#### 开发模式

```bash
# 启动所有开发服务器
pnpm dev

# 启动指定应用
pnpm run --filter=@sker/studio dev
```

---

## 四、依赖管理规范

### 4.1 全局依赖

在根目录`package.json`中统一管理构建相关的全局依赖：

```json
{
  "devDependencies": {
    "tsup": "^8.5.0",
    "turbo": "^2.0.0",
    "@types/node": "^24.5.2"
  }
}
```

### 4.2 子包依赖原则

- **避免重复**: 相同版本的依赖提升到workspace根
- **精确版本**: 使用`workspace:*`引用内部包
- **external配置**: 构建时排除不应打包的依赖

### 4.3 安装依赖命令

```bash
# 为指定包安装依赖
pnpm i --filter=@sker/package-name dependency-name

# 安装开发依赖
pnpm i --filter=@sker/package-name -D dev-dependency-name

# 安装workspace内部包
pnpm i --filter=@sker/package-name @sker/another-package
```

---

## 五、最佳实践

### 5.1 构建性能优化

1. **使用tsup watch模式**: 开发时自动重新构建
   ```bash
   pnpm run --filter=@sker/models dev
   ```

2. **合理配置external**: 避免打包不必要的依赖
   ```typescript
   external: ['react', 'react-dom', 'express', /^@sker\/.*/]
   ```

3. **启用增量构建**: Turbo会自动缓存构建结果

### 5.2 类型检查

- **构建前检查**: `tsc && vite build` 确保类型安全
- **独立type-check**: 不影响构建速度
- **IDE集成**: 使用VSCode的TypeScript插件实时检查

### 5.3 代码质量

1. **Lint检查**: 统一使用ESLint
2. **格式化**: 使用Prettier（如已配置）
3. **测试**: 使用Vitest进行单元测试

### 5.4 版本管理

- **语义化版本**: 遵循semver规范
- **changesets**: 考虑使用changeset管理版本发布
- **锁定依赖**: 使用pnpm-lock.yaml确保一致性

---

## 六、故障排查

### 6.1 常见问题

#### 问题1: "Cannot find module" 错误

**原因**: 依赖未正确安装或external配置错误

**解决方案**:
```bash
# 重新安装依赖
pnpm install

# 检查tsup.config.ts的external配置
# 确保运行时依赖未被标记为external
```

#### 问题2: 类型声明未生成

**原因**: tsup配置中dts未启用

**解决方案**:
```typescript
// tsup.config.ts
export default defineConfig({
  dts: true, // 确保启用
})
```

#### 问题3: Vite构建chunk过大警告

**原因**: 单个chunk超过500KB默认阈值

**解决方案**:
```typescript
// vite.config.ts
build: {
  chunkSizeWarningLimit: 1000, // 提高阈值
  rollupOptions: {
    output: {
      manualChunks: {
        // 进一步拆分大型依赖
      }
    }
  }
}
```

#### 问题4: 循环依赖警告

**原因**: packages之间存在循环引用

**解决方案**:
1. 检查packages之间的依赖关系
2. 重构代码消除循环依赖
3. 考虑提取公共代码到新的package

### 6.2 调试技巧

#### 查看构建输出

```bash
# tsup详细输出
pnpm run --filter=@sker/models build -- --verbose

# Vite构建分析
pnpm run --filter=@sker/studio build -- --mode production --debug
```

#### 分析包大小

```bash
# 安装分析工具
pnpm i -D rollup-plugin-visualizer

# 在vite.config.ts中添加
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
})
```

---

## 七、新建包/应用检查清单

### 新建Package检查清单

- [ ] 创建`tsup.config.ts`（使用标准模板）
- [ ] 配置`package.json`（name、type、exports等）
- [ ] 添加`src/index.ts`入口文件
- [ ] 配置external排除runtime依赖
- [ ] 运行`pnpm build`验证构建
- [ ] 检查`dist/`输出是否正确
- [ ] 在其他包中测试引用

### 新建App检查清单

- [ ] 创建`vite.config.ts`（使用标准模板）
- [ ] 配置`package.json`（scripts、dependencies）
- [ ] 配置路径别名（@/xxx）
- [ ] 配置代码分包策略
- [ ] 创建`.env.example`环境变量模板
- [ ] 运行`pnpm dev`验证开发服务器
- [ ] 运行`pnpm build`验证生产构建
- [ ] 检查构建产物大小

---

## 八、参考资料

- [tsup官方文档](https://tsup.egoist.dev/)
- [Vite官方文档](https://vitejs.dev/)
- [Turbo官方文档](https://turbo.build/)
- [pnpm Workspace](https://pnpm.io/workspaces)

---

**文档版本**: v1.0.0
**最后更新**: 2025-10-01
**维护者**: SKER Team
