# Studio 后端API集成文档

本文档说明 @sker/studio 前端与后端服务的集成实现。

## 📋 集成概览

### 已完成的功能
- ✅ API配置和HTTP客户端
- ✅ 节点CRUD后端同步
- ✅ 项目管理集成
- ✅ 自动保存机制
- ✅ 同步状态管理
- ✅ 项目初始化流程

## 🏗️ 架构设计

### 数据流向
```
Frontend UI
    ↓
Zustand Stores (nodeStore/canvasStore)
    ↓
API Services (nodeAPIService/projectService)
    ↓
HTTP Client (apiClient)
    ↓
Gateway API (localhost:3000)
    ↓
Store Service (localhost:3001)
    ↓
PostgreSQL Database
```

## 📁 新增文件

### 配置层
- `src/config/api.ts` - API配置和端点定义
- `.env.example` - 环境变量示例

### 服务层
- `src/services/apiClient.ts` - HTTP客户端封装
- `src/services/nodeApiService.ts` - 节点API服务
- `src/services/projectService.ts` - 项目API服务

### 状态管理层
- `src/stores/nodeStore.ts` - 扩展:添加后端同步方法
- `src/stores/canvasStore.ts` - 扩展:添加项目管理功能
- `src/stores/syncStore.ts` - 新增:同步状态管理

### Hooks层
- `src/hooks/useAutoSave.ts` - 自动保存Hook
- `src/hooks/useProjectInit.ts` - 项目初始化Hook

### 组件层
- `src/components/project/ProjectSelector.tsx` - 项目选择器

## 🔧 使用方法

### 1. 环境配置

创建 `.env.local` 文件:

```env
# Gateway API网关地址
VITE_GATEWAY_URL=http://localhost:3000

# Store数据存储服务地址
VITE_STORE_URL=http://localhost:3001

# WebSocket服务地址
VITE_WS_URL=ws://localhost:3000/ws
```

### 2. 安装依赖

```bash
cd /workspace/test/apps/studio
pnpm install
```

### 3. 启动后端服务

```bash
# 启动Store服务
cd /workspace/test/packages/store
pnpm run dev

# 启动Gateway服务
cd /workspace/test/packages/gateway
pnpm run dev
```

### 4. 启动前端

```bash
cd /workspace/test/apps/studio
pnpm run dev
```

## 💡 核心API使用示例

### 节点操作

#### 创建节点(带后端同步)
```typescript
import { useNodeStore } from '@/stores/nodeStore'

const { createNodeWithSync } = useNodeStore()

// 创建节点
const node = await createNodeWithSync({
  project_id: 'project-123',
  content: '节点内容',
  title: '节点标题',
  importance: 3,
  position: { x: 100, y: 100 },
  tags: ['标签1', '标签2'],
})
```

#### 更新节点(带后端同步)
```typescript
import { useNodeStore } from '@/stores/nodeStore'

const { updateNodeWithSync } = useNodeStore()

// 更新节点
await updateNodeWithSync('node-id', {
  content: '更新后的内容',
  importance: 4,
})
```

#### 删除节点(带后端同步)
```typescript
import { useNodeStore } from '@/stores/nodeStore'

const { deleteNodeWithSync } = useNodeStore()

// 软删除(可恢复)
await deleteNodeWithSync('node-id', false)

// 永久删除
await deleteNodeWithSync('node-id', true)
```

#### 从后端同步数据
```typescript
import { useNodeStore } from '@/stores/nodeStore'

const { syncFromBackend } = useNodeStore()

// 加载项目的所有节点
await syncFromBackend('project-id')
```

### 项目操作

#### 创建项目
```typescript
import { useCanvasStore } from '@/stores/canvasStore'

const { createProject } = useCanvasStore()

const project = await createProject('项目名称', '项目描述')
```

#### 加载项目
```typescript
import { useCanvasStore } from '@/stores/canvasStore'

const { loadProject } = useCanvasStore()

await loadProject('project-id')
```

#### 保存画布状态
```typescript
import { useCanvasStore } from '@/stores/canvasStore'

const { saveCanvasState } = useCanvasStore()

await saveCanvasState()
```

### 自动保存

```typescript
import { useAutoSave } from '@/hooks/useAutoSave'

// 在组件中使用
function MyComponent() {
  // 启用自动保存(30秒间隔,3秒防抖)
  const { save, isSaving, enabled } = useAutoSave({
    interval: 30000,
    debounceDelay: 3000,
    enabled: true,
  })

  // 手动触发保存
  const handleSave = () => {
    save()
  }

  return (
    <div>
      {isSaving && <span>保存中...</span>}
      <button onClick={handleSave}>手动保存</button>
    </div>
  )
}
```

### 同步状态监控

```typescript
import { useSyncStore } from '@/stores/syncStore'

function SyncStatus() {
  const { status, lastSavedAt, currentError, isOnline } = useSyncStore()

  return (
    <div>
      <p>状态: {status}</p>
      {lastSavedAt && <p>最后保存: {lastSavedAt.toLocaleString()}</p>}
      {currentError && <p>错误: {currentError.message}</p>}
      <p>网络: {isOnline ? '在线' : '离线'}</p>
    </div>
  )
}
```

## 🎯 应用初始化流程

```typescript
import { useProjectInit } from '@/hooks/useProjectInit'
import { ProjectSelector } from '@/components/project/ProjectSelector'

function App() {
  // 初始化项目
  const { isReady, currentProject } = useProjectInit()

  return (
    <div>
      {/* 如果没有当前项目,显示项目选择器 */}
      {!currentProject && <ProjectSelector />}

      {/* 主应用内容 */}
      {currentProject && <MainApp />}
    </div>
  )
}
```

## 🔄 数据同步策略

### 乐观更新
1. 立即更新本地UI
2. 异步保存到后端
3. 失败时回滚并提示用户

### 自动保存
- 定时保存(默认30秒)
- 数据变更防抖保存(默认3秒)
- 保存状态实时反馈

### 错误处理
- 网络错误:保留本地数据,显示离线提示
- 冲突错误:记录冲突,提供解决界面
- 服务器错误:显示错误信息,支持重试

## 📊 性能优化

### 批量操作
- 使用批量API减少请求次数
- 并行处理独立操作

### 缓存策略
- localStorage持久化常用数据
- 内存缓存减少重复请求

### 防抖节流
- 搜索输入防抖
- 自动保存防抖
- 滚动事件节流

## 🧪 测试建议

### 单元测试
- API客户端请求/响应处理
- 数据格式转换正确性
- Store状态更新逻辑

### 集成测试
- 完整的CRUD流程
- 网络异常场景
- 并发操作处理

### E2E测试
- 用户创建项目流程
- 节点创建编辑流程
- 自动保存功能

## 🐛 故障排查

### 无法连接后端
1. 检查 `.env.local` 配置是否正确
2. 确认 Gateway 和 Store 服务已启动
3. 检查网络连接和CORS配置

### 数据同步失败
1. 查看浏览器控制台错误信息
2. 检查 syncStore 中的 currentError
3. 验证API响应格式是否正确

### 自动保存不工作
1. 确认 currentProject 不为空
2. 检查 useAutoSave 配置的 enabled 参数
3. 查看控制台日志确认保存触发

## 📚 相关文档

- [API参考文档](../../../docs/API_REFERENCE.md)
- [架构设计文档](./架构设计文档.md)
- [开发计划](./plan.md)

## 🤝 贡献指南

如需添加新的API集成:

1. 在 `src/services/` 中创建对应的 Service
2. 在 Store 中添加相关的 Actions
3. 更新类型定义
4. 添加使用示例到本文档
5. 编写测试用例

---

**维护者**: SKER Team
**最后更新**: 2025-10-01
