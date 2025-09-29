# @sker/state-management - 状态管理

> 扩展式AI协作画布系统的统一状态管理解决方案

## 📋 概述

@sker/state-management 基于 Zustand 提供整个前端应用的状态管理解决方案，包括画布状态、组件状态、用户界面状态等。它依赖 @sker/data-models 获取数据结构定义，为React应用提供高效、类型安全的状态管理能力。

## 🎯 设计原理

### 为什么需要专门的状态管理包？

1. **状态集中管理**: 避免组件间复杂的状态传递和管理
2. **类型安全**: 基于数据模型提供完整的TypeScript类型支持
3. **持久化支持**: 自动同步状态到本地存储和服务端
4. **性能优化**: 细粒度的状态更新，避免不必要的重渲染
5. **开发工具**: 集成Redux DevTools，便于状态调试
6. **中间件扩展**: 支持自定义中间件扩展功能

### 架构设计思路

```mermaid
graph TD
    A[@sker/data-models] --> B[State Management Core]
    
    B --> C[Canvas Store]
    B --> D[Component Store]
    B --> E[Project Store]
    B --> F[User Store]
    B --> G[UI Store]
    B --> H[Settings Store]
    
    C --> I[节点管理]
    C --> J[连线管理]
    C --> K[视口控制]
    C --> L[选择状态]
    
    D --> M[组件CRUD]
    D --> N[版本管理]
    D --> O[AI优化状态]
    D --> P[协作状态]
    
    E --> Q[项目信息]
    E --> R[协作者管理]
    E --> S[权限控制]
    
    F --> T[用户信息]
    F --> U[偏好设置]
    F --> V[认证状态]
    
    G --> W[界面主题]
    G --> X[模态框状态]
    G --> Y[通知系统]
    G --> Z[加载状态]
    
    H --> AA[应用配置]
    H --> BB[功能开关]
    H --> CC[本地设置]
    
    B --> DD[持久化层]
    DD --> EE[LocalStorage]
    DD --> FF[IndexedDB]
    DD --> GG[服务端同步]
    
    B --> HH[中间件系统]
    HH --> II[日志中间件]
    HH --> JJ[持久化中间件]
    HH --> KK[同步中间件]
    HH --> LL[开发工具中间件]
```

## 🚀 核心功能

### 1. 画布状态管理 (CanvasStore)
- 节点和连线管理
- 视口变换控制
- 选择和焦点状态
- 画布操作历史
- 实时协作状态

### 2. 组件状态管理 (ComponentStore)
- 组件CRUD操作
- 版本历史管理
- AI优化进度跟踪
- 组件关系维护
- 搜索和过滤状态

### 3. 项目状态管理 (ProjectStore)
- 项目基本信息
- 协作者和权限
- 项目设置配置
- 统计和分析数据

### 4. 用户状态管理 (UserStore)
- 用户认证状态
- 个人偏好设置
- 操作历史记录
- 通知和消息

### 5. UI状态管理 (UIStore)
- 主题和样式设置
- 模态框和弹窗状态
- 侧边栏和面板状态
- 加载和错误状态

### 6. 设置状态管理 (SettingsStore)
- 应用配置选项
- 功能开关状态
- 键盘快捷键配置
- 实验性功能设置

## 📦 安装使用

```bash
npm install @sker/state-management @sker/data-models zustand
```

## 📖 API文档

### CanvasStore - 画布状态管理

```typescript
import { useCanvasStore } from '@sker/state-management';
import { ComponentData } from '@sker/data-models';

// 在React组件中使用
function CanvasComponent() {
  const {
    // 状态
    nodes,
    edges,
    viewport,
    selectedNodes,
    displayMode,
    isLoading,
    
    // 操作方法
    addNode,
    updateNode,
    deleteNode,
    connectNodes,
    setViewport,
    setDisplayMode,
    selectNodes,
    clearSelection,
    
    // 协作状态
    collaborators,
    cursors,
    updateCursor,
    
    // 历史操作
    undo,
    redo,
    canUndo,
    canRedo
  } = useCanvasStore();
  
  // 添加新节点
  const handleAddComponent = (componentData: ComponentData) => {
    addNode({
      id: componentData.id,
      type: 'component',
      position: { x: 100, y: 100 },
      data: componentData
    });
  };
  
  // 更新节点位置
  const handleNodeDrag = (nodeId: string, position: { x: number; y: number }) => {
    updateNode(nodeId, { position });
  };
  
  // 连接节点
  const handleConnect = (source: string, target: string) => {
    connectNodes({
      id: `edge_${source}_${target}`,
      source,
      target,
      type: 'default'
    });
  };
  
  return (
    <div>
      {/* 画布内容 */}
    </div>
  );
}

// Store定义
interface CanvasState {
  // 基础状态
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: Viewport;
  selectedNodes: string[];
  displayMode: 'edit' | 'preview' | 'present';
  isLoading: boolean;
  
  // 协作状态
  collaborators: Collaborator[];
  cursors: Record<string, CursorPosition>;
  
  // 历史状态
  history: HistoryEntry[];
  historyIndex: number;
  
  // 操作方法
  addNode: (node: Omit<CanvasNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  connectNodes: (edge: CanvasEdge) => void;
  disconnectNodes: (edgeId: string) => void;
  
  setViewport: (viewport: Partial<Viewport>) => void;
  setDisplayMode: (mode: 'edit' | 'preview' | 'present') => void;
  
  selectNodes: (nodeIds: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // 协作方法
  updateCursor: (userId: string, position: CursorPosition) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (userId: string) => void;
  
  // 历史方法
  undo: () => void;
  redo: () => void;
  pushHistory: (entry: HistoryEntry) => void;
  
  // 工具方法
  getNodeById: (id: string) => CanvasNode | undefined;
  getConnectedNodes: (nodeId: string) => CanvasNode[];
  exportCanvas: () => CanvasSnapshot;
  importCanvas: (snapshot: CanvasSnapshot) => void;
}

export const useCanvasStore = create<CanvasState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 初始状态
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodes: [],
        displayMode: 'edit',
        isLoading: false,
        collaborators: [],
        cursors: {},
        history: [],
        historyIndex: -1,
        
        // 节点操作
        addNode: (nodeData) => {
          set((state) => {
            const node: CanvasNode = {
              id: generateId('node'),
              ...nodeData,
              selected: false,
              dragging: false
            };
            
            state.nodes.push(node);
            
            // 记录历史
            state.history.push({
              type: 'add_node',
              data: node,
              timestamp: Date.now()
            });
            state.historyIndex = state.history.length - 1;
          });
        },
        
        updateNode: (id, updates) => {
          set((state) => {
            const nodeIndex = state.nodes.findIndex(n => n.id === id);
            if (nodeIndex !== -1) {
              const oldNode = { ...state.nodes[nodeIndex] };
              Object.assign(state.nodes[nodeIndex], updates);
              
              // 记录历史
              state.history.push({
                type: 'update_node',
                data: { id, oldData: oldNode, newData: updates },
                timestamp: Date.now()
              });
              state.historyIndex = state.history.length - 1;
            }
          });
        },
        
        deleteNode: (id) => {
          set((state) => {
            const nodeIndex = state.nodes.findIndex(n => n.id === id);
            if (nodeIndex !== -1) {
              const deletedNode = state.nodes[nodeIndex];
              state.nodes.splice(nodeIndex, 1);
              
              // 删除相关连线
              state.edges = state.edges.filter(
                edge => edge.source !== id && edge.target !== id
              );
              
              // 从选择中移除
              state.selectedNodes = state.selectedNodes.filter(nId => nId !== id);
              
              // 记录历史
              state.history.push({
                type: 'delete_node',
                data: deletedNode,
                timestamp: Date.now()
              });
              state.historyIndex = state.history.length - 1;
            }
          });
        },
        
        // 连线操作
        connectNodes: (edge) => {
          set((state) => {
            // 检查连线是否已存在
            const exists = state.edges.some(
              e => e.source === edge.source && e.target === edge.target
            );
            
            if (!exists) {
              state.edges.push(edge);
              
              // 记录历史
              state.history.push({
                type: 'add_edge',
                data: edge,
                timestamp: Date.now()
              });
              state.historyIndex = state.history.length - 1;
            }
          });
        },
        
        // 视口操作
        setViewport: (viewport) => {
          set((state) => {
            Object.assign(state.viewport, viewport);
          });
        },
        
        // 选择操作
        selectNodes: (nodeIds) => {
          set((state) => {
            state.selectedNodes = nodeIds;
            // 更新节点选中状态
            state.nodes.forEach(node => {
              node.selected = nodeIds.includes(node.id);
            });
          });
        },
        
        clearSelection: () => {
          set((state) => {
            state.selectedNodes = [];
            state.nodes.forEach(node => {
              node.selected = false;
            });
          });
        },
        
        // 历史操作
        undo: () => {
          set((state) => {
            if (state.historyIndex >= 0) {
              const entry = state.history[state.historyIndex];
              // 执行撤销逻辑
              undoHistoryEntry(state, entry);
              state.historyIndex--;
            }
          });
        },
        
        redo: () => {
          set((state) => {
            if (state.historyIndex < state.history.length - 1) {
              state.historyIndex++;
              const entry = state.history[state.historyIndex];
              // 执行重做逻辑
              redoHistoryEntry(state, entry);
            }
          });
        },
        
        // 工具方法
        getNodeById: (id) => {
          return get().nodes.find(node => node.id === id);
        },
        
        getConnectedNodes: (nodeId) => {
          const { nodes, edges } = get();
          const connectedNodeIds = edges
            .filter(edge => edge.source === nodeId || edge.target === nodeId)
            .map(edge => edge.source === nodeId ? edge.target : edge.source);
          
          return nodes.filter(node => connectedNodeIds.includes(node.id));
        }
      })),
      {
        name: 'canvas-store',
        partialize: (state) => ({
          viewport: state.viewport,
          displayMode: state.displayMode,
          // 不持久化协作状态和历史
        })
      }
    ),
    {
      name: 'canvas-store'
    }
  )
);
```

### ComponentStore - 组件状态管理

```typescript
import { useComponentStore } from '@sker/state-management';
import { ComponentData } from '@sker/data-models';

interface ComponentState {
  // 组件数据
  components: Record<string, ComponentData>;
  currentComponent: string | null;
  
  // 列表状态
  listState: {
    loading: boolean;
    error: string | null;
    filters: ComponentFilters;
    sort: SortOptions;
    pagination: PaginationState;
  };
  
  // AI优化状态
  aiOptimization: Record<string, AIOptimizationStatus>;
  
  // 版本管理
  versions: Record<string, VersionData[]>;
  
  // 搜索状态
  searchState: {
    query: string;
    results: string[];
    suggestions: string[];
    loading: boolean;
  };
  
  // 操作方法
  loadComponents: (projectId: string) => Promise<void>;
  createComponent: (data: Partial<ComponentData>) => Promise<ComponentData>;
  updateComponent: (id: string, updates: Partial<ComponentData>) => Promise<void>;
  deleteComponent: (id: string) => Promise<void>;
  
  setCurrentComponent: (id: string | null) => void;
  
  // 搜索方法
  searchComponents: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // AI优化方法
  optimizeComponent: (id: string, prompt: string) => Promise<void>;
  cancelOptimization: (id: string) => void;
  
  // 版本方法
  loadVersions: (componentId: string) => Promise<void>;
  revertToVersion: (componentId: string, versionId: string) => Promise<void>;
  
  // 过滤和排序
  setFilters: (filters: Partial<ComponentFilters>) => void;
  setSort: (sort: SortOptions) => void;
  
  // 批量操作
  bulkUpdate: (ids: string[], updates: Partial<ComponentData>) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

export const useComponentStore = create<ComponentState>()(
  devtools(
    persist(
      immer((set, get) => ({
        components: {},
        currentComponent: null,
        listState: {
          loading: false,
          error: null,
          filters: {},
          sort: { field: 'updated_at', order: 'desc' },
          pagination: { page: 1, pageSize: 20, total: 0 }
        },
        aiOptimization: {},
        versions: {},
        searchState: {
          query: '',
          results: [],
          suggestions: [],
          loading: false
        },
        
        loadComponents: async (projectId) => {
          set((state) => {
            state.listState.loading = true;
            state.listState.error = null;
          });
          
          try {
            const result = await componentAPI.list({
              projectId,
              ...get().listState.filters,
              ...get().listState.sort,
              ...get().listState.pagination
            });
            
            set((state) => {
              // 更新组件数据
              result.data.forEach(component => {
                state.components[component.id] = component;
              });
              
              // 更新分页信息
              state.listState.pagination.total = result.total;
              state.listState.loading = false;
            });
          } catch (error) {
            set((state) => {
              state.listState.error = error.message;
              state.listState.loading = false;
            });
          }
        },
        
        createComponent: async (data) => {
          const component = await componentAPI.create(data);
          
          set((state) => {
            state.components[component.id] = component;
          });
          
          return component;
        },
        
        updateComponent: async (id, updates) => {
          const updated = await componentAPI.update(id, updates);
          
          set((state) => {
            state.components[id] = updated;
          });
        },
        
        searchComponents: async (query) => {
          set((state) => {
            state.searchState.query = query;
            state.searchState.loading = true;
          });
          
          try {
            const results = await componentAPI.search(query);
            
            set((state) => {
              state.searchState.results = results.map(r => r.id);
              state.searchState.suggestions = results
                .slice(0, 5)
                .map(r => r.title);
              state.searchState.loading = false;
            });
          } catch (error) {
            set((state) => {
              state.searchState.loading = false;
            });
          }
        },
        
        optimizeComponent: async (id, prompt) => {
          set((state) => {
            state.aiOptimization[id] = {
              status: 'processing',
              progress: 0,
              prompt,
              startTime: Date.now()
            };
          });
          
          try {
            // 启动AI优化
            const result = await aiAPI.optimizeComponent(id, prompt);
            
            set((state) => {
              state.aiOptimization[id].status = 'completed';
              state.aiOptimization[id].progress = 100;
              state.components[id] = result.component;
            });
          } catch (error) {
            set((state) => {
              state.aiOptimization[id].status = 'failed';
              state.aiOptimization[id].error = error.message;
            });
          }
        }
      })),
      {
        name: 'component-store',
        partialize: (state) => ({
          listState: {
            filters: state.listState.filters,
            sort: state.listState.sort
          },
          searchState: {
            query: state.searchState.query
          }
        })
      }
    )
  )
);
```

### UIStore - 界面状态管理

```typescript
import { useUIStore } from '@sker/state-management';

interface UIState {
  // 主题设置
  theme: 'light' | 'dark' | 'auto';
  colorScheme: ColorScheme;
  
  // 布局状态
  layout: {
    sidebarCollapsed: boolean;
    rightPanelOpen: boolean;
    bottomPanelHeight: number;
    canvasFullscreen: boolean;
  };
  
  // 模态框状态
  modals: Record<string, ModalState>;
  
  // 通知系统
  notifications: Notification[];
  
  // 加载状态
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // 错误状态
  errors: Record<string, ErrorState>;
  
  // 快捷键配置
  shortcuts: Record<string, string>;
  
  // 操作方法
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setBottomPanelHeight: (height: number) => void;
  
  // 模态框方法
  openModal: (modalId: string, props?: any) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  
  // 通知方法
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // 加载状态方法
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  
  // 错误处理方法
  setError: (key: string, error: string | null) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'auto',
        colorScheme: getDefaultColorScheme(),
        layout: {
          sidebarCollapsed: false,
          rightPanelOpen: true,
          bottomPanelHeight: 200,
          canvasFullscreen: false
        },
        modals: {},
        notifications: [],
        globalLoading: false,
        loadingStates: {},
        errors: {},
        shortcuts: getDefaultShortcuts(),
        
        setTheme: (theme) => {
          set({ theme });
          // 应用主题到DOM
          applyThemeToDOM(theme);
        },
        
        toggleSidebar: () => {
          set((state) => ({
            layout: {
              ...state.layout,
              sidebarCollapsed: !state.layout.sidebarCollapsed
            }
          }));
        },
        
        openModal: (modalId, props) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modalId]: {
                open: true,
                props: props || {},
                timestamp: Date.now()
              }
            }
          }));
        },
        
        closeModal: (modalId) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modalId]: {
                ...state.modals[modalId],
                open: false
              }
            }
          }));
        },
        
        addNotification: (notification) => {
          const id = generateId('notification');
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now()
          };
          
          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }));
          
          // 自动移除通知
          if (notification.autoClose !== false) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration || 5000);
          }
        },
        
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        },
        
        setLoading: (key, loading) => {
          set((state) => ({
            loadingStates: {
              ...state.loadingStates,
              [key]: loading
            }
          }));
        },
        
        setError: (key, error) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [key]: error ? {
                message: error,
                timestamp: Date.now()
              } : undefined
            }
          }));
        }
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          layout: state.layout,
          shortcuts: state.shortcuts
        })
      }
    )
  )
);

// 使用示例
function App() {
  const {
    theme,
    layout,
    notifications,
    setTheme,
    toggleSidebar,
    addNotification
  } = useUIStore();
  
  const handleNotifySuccess = () => {
    addNotification({
      type: 'success',
      title: '操作成功',
      message: '组件已成功创建',
      icon: 'check'
    });
  };
  
  return (
    <div className={`app theme-${theme}`}>
      {/* 应用内容 */}
    </div>
  );
}
```

### 中间件系统

```typescript
// middleware/logger.ts
export const loggerMiddleware: StateCreator<any, [], [], any> = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('State change:', args);
      set(...args);
    },
    get,
    api
  );

// middleware/persistence.ts
export const persistenceMiddleware = <T>(
  config: StateCreator<T>,
  options: PersistOptions<T>
) => persist(config, options);

// middleware/sync.ts
export const syncMiddleware: StateCreator<any, [], [], any> = (config) => (set, get, api) => {
  const store = config(set, get, api);
  
  // 监听状态变化并同步到服务端
  api.subscribe((state, prevState) => {
    const changes = getDiff(prevState, state);
    if (changes.length > 0) {
      syncToServer(changes);
    }
  });
  
  return store;
};

// 组合中间件
export const createStore = <T>(
  config: StateCreator<T>,
  options?: {
    persist?: PersistOptions<T>;
    logger?: boolean;
    sync?: boolean;
  }
) => {
  let enhancedConfig = config;
  
  if (options?.logger) {
    enhancedConfig = loggerMiddleware(enhancedConfig);
  }
  
  if (options?.sync) {
    enhancedConfig = syncMiddleware(enhancedConfig);
  }
  
  if (options?.persist) {
    enhancedConfig = persistenceMiddleware(enhancedConfig, options.persist);
  }
  
  return create(enhancedConfig);
};
```

### 状态同步和协作

```typescript
// collaboration/StateSync.ts
export class StateSync {
  private wsClient: WebSocketClient;
  private stores: Map<string, any> = new Map();
  
  constructor(wsClient: WebSocketClient) {
    this.wsClient = wsClient;
    this.setupEventHandlers();
  }
  
  // 注册需要同步的store
  registerStore(name: string, store: any): void {
    this.stores.set(name, store);
    
    // 监听store变化
    store.subscribe((state: any, prevState: any) => {
      const changes = this.calculateChanges(prevState, state);
      if (changes.length > 0) {
        this.broadcastChanges(name, changes);
      }
    });
  }
  
  // 广播状态变化
  private broadcastChanges(storeName: string, changes: StateChange[]): void {
    this.wsClient.send('state:changes', {
      store: storeName,
      changes,
      timestamp: Date.now(),
      userId: getCurrentUserId()
    });
  }
  
  // 处理远程状态变化
  private handleRemoteChanges(data: {
    store: string;
    changes: StateChange[];
    userId: string;
    timestamp: number;
  }): void {
    const store = this.stores.get(data.store);
    if (!store) return;
    
    // 应用远程变化，但避免循环同步
    store.setState((state: any) => {
      return this.applyChanges(state, data.changes);
    }, false); // false 表示不触发订阅者
  }
  
  private setupEventHandlers(): void {
    this.wsClient.on('state:changes', this.handleRemoteChanges.bind(this));
    
    this.wsClient.on('user:cursor', (data) => {
      const canvasStore = this.stores.get('canvas');
      if (canvasStore) {
        canvasStore.getState().updateCursor(data.userId, data.position);
      }
    });
  }
}

// 使用示例
const stateSync = new StateSync(wsClient);
stateSync.registerStore('canvas', useCanvasStore);
stateSync.registerStore('component', useComponentStore);
```

## 🛠️ 开发指南

### 项目结构

```
state-management/
├── src/
│   ├── stores/            # 状态存储定义
│   │   ├── CanvasStore.ts
│   │   ├── ComponentStore.ts
│   │   ├── ProjectStore.ts
│   │   ├── UserStore.ts
│   │   ├── UIStore.ts
│   │   └── SettingsStore.ts
│   ├── middleware/        # 中间件
│   │   ├── logger.ts
│   │   ├── persistence.ts
│   │   ├── sync.ts
│   │   └── devtools.ts
│   ├── hooks/             # 自定义hooks
│   │   ├── useUndo.ts
│   │   ├── useSelection.ts
│   │   ├── useCollaboration.ts
│   │   └── useOptimisticUI.ts
│   ├── utils/             # 工具函数
│   │   ├── stateUtils.ts
│   │   ├── historyUtils.ts
│   │   ├── diffUtils.ts
│   │   └── syncUtils.ts
│   ├── types/             # 类型定义
│   │   ├── store.ts
│   │   ├── middleware.ts
│   │   ├── history.ts
│   │   └── collaboration.ts
│   ├── selectors/         # 状态选择器
│   │   ├── canvasSelectors.ts
│   │   ├── componentSelectors.ts
│   │   └── commonSelectors.ts
│   └── index.ts           # 统一导出
├── tests/                 # 测试文件
│   ├── stores.test.ts
│   ├── middleware.test.ts
│   ├── hooks.test.ts
│   └── integration.test.ts
└── docs/                  # 详细文档
    ├── stores.md
    ├── middleware.md
    └── best-practices.md
```

### 状态选择器

```typescript
// selectors/canvasSelectors.ts
export const canvasSelectors = {
  // 基础选择器
  getNodes: (state: CanvasState) => state.nodes,
  getEdges: (state: CanvasState) => state.edges,
  getSelectedNodes: (state: CanvasState) => state.selectedNodes,
  
  // 计算选择器
  getSelectedNodeData: (state: CanvasState) => 
    state.nodes.filter(node => state.selectedNodes.includes(node.id)),
  
  getNodesByType: (state: CanvasState, type: string) =>
    state.nodes.filter(node => node.type === type),
  
  getConnectedNodes: (state: CanvasState, nodeId: string) => {
    const connectedEdges = state.edges.filter(
      edge => edge.source === nodeId || edge.target === nodeId
    );
    const connectedNodeIds = connectedEdges.map(edge => 
      edge.source === nodeId ? edge.target : edge.source
    );
    return state.nodes.filter(node => connectedNodeIds.includes(node.id));
  },
  
  // 复杂选择器
  getCanvasStatistics: (state: CanvasState) => ({
    totalNodes: state.nodes.length,
    totalEdges: state.edges.length,
    selectedCount: state.selectedNodes.length,
    nodesByType: state.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }),
  
  canUndo: (state: CanvasState) => state.historyIndex >= 0,
  canRedo: (state: CanvasState) => state.historyIndex < state.history.length - 1
};

// 使用选择器
function CanvasStatistics() {
  const stats = useCanvasStore(canvasSelectors.getCanvasStatistics);
  const canUndo = useCanvasStore(canvasSelectors.canUndo);
  
  return (
    <div>
      <p>节点数量: {stats.totalNodes}</p>
      <p>连线数量: {stats.totalEdges}</p>
      <button disabled={!canUndo}>撤销</button>
    </div>
  );
}
```

### 自定义Hooks

```typescript
// hooks/useUndo.ts
export function useUndo<T>(store: UseBoundStore<StoreApi<T>>) {
  const undo = store(state => state.undo);
  const redo = store(state => state.redo);
  const canUndo = store(state => state.canUndo);
  const canRedo = store(state => state.canRedo);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) undo();
      } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
        event.preventDefault();
        if (canRedo) redo();
      }
    }
  }, [undo, redo, canUndo, canRedo]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return { undo, redo, canUndo, canRedo };
}

// hooks/useSelection.ts
export function useSelection() {
  const selectedNodes = useCanvasStore(state => state.selectedNodes);
  const selectNodes = useCanvasStore(state => state.selectNodes);
  const clearSelection = useCanvasStore(state => state.clearSelection);
  
  const selectAll = useCallback(() => {
    const allNodes = useCanvasStore.getState().nodes;
    selectNodes(allNodes.map(node => node.id));
  }, [selectNodes]);
  
  const toggleNodeSelection = useCallback((nodeId: string) => {
    const currentSelection = useCanvasStore.getState().selectedNodes;
    if (currentSelection.includes(nodeId)) {
      selectNodes(currentSelection.filter(id => id !== nodeId));
    } else {
      selectNodes([...currentSelection, nodeId]);
    }
  }, [selectNodes]);
  
  return {
    selectedNodes,
    selectNodes,
    clearSelection,
    selectAll,
    toggleNodeSelection,
    hasSelection: selectedNodes.length > 0
  };
}

// hooks/useOptimisticUI.ts
export function useOptimisticUI<T, U>(
  store: UseBoundStore<StoreApi<T>>,
  action: (data: U) => Promise<void>,
  optimisticUpdate: (state: T, data: U) => T
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const execute = useCallback(async (data: U) => {
    setIsLoading(true);
    setError(null);
    
    // 乐观更新
    const originalState = store.getState();
    store.setState(optimisticUpdate(originalState, data));
    
    try {
      await action(data);
    } catch (err) {
      // 失败时回滚
      store.setState(originalState);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [store, action, optimisticUpdate]);
  
  return { execute, isLoading, error };
}
```

## 🧪 测试策略

### Store测试

```typescript
// tests/stores.test.ts
describe('CanvasStore', () => {
  let store: ReturnType<typeof useCanvasStore>;
  
  beforeEach(() => {
    store = useCanvasStore.getState();
    // 重置store状态
    store.reset?.();
  });
  
  it('应该能够添加节点', () => {
    const nodeData = {
      type: 'component',
      position: { x: 100, y: 100 },
      data: { title: 'Test Node' }
    };
    
    store.addNode(nodeData);
    
    const nodes = store.nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].position).toEqual({ x: 100, y: 100 });
  });
  
  it('应该能够连接节点', () => {
    // 添加两个节点
    store.addNode({ type: 'component', position: { x: 0, y: 0 } });
    store.addNode({ type: 'component', position: { x: 100, y: 0 } });
    
    const nodes = store.nodes;
    const edge = {
      id: 'edge1',
      source: nodes[0].id,
      target: nodes[1].id,
      type: 'default'
    };
    
    store.connectNodes(edge);
    
    expect(store.edges).toHaveLength(1);
    expect(store.edges[0].source).toBe(nodes[0].id);
  });
  
  it('应该能够撤销操作', () => {
    store.addNode({ type: 'component', position: { x: 0, y: 0 } });
    expect(store.nodes).toHaveLength(1);
    
    store.undo();
    expect(store.nodes).toHaveLength(0);
  });
});
```

### 中间件测试

```typescript
// tests/middleware.test.ts
describe('State Middleware', () => {
  it('logger中间件应该记录状态变化', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const testStore = create(
      loggerMiddleware((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 }))
      }))
    );
    
    testStore.getState().increment();
    
    expect(consoleSpy).toHaveBeenCalledWith('State change:', expect.any(Array));
    consoleSpy.mockRestore();
  });
  
  it('persistence中间件应该保存状态', async () => {
    const testStore = create(
      persist(
        (set) => ({
          value: 'initial',
          setValue: (value: string) => set({ value })
        }),
        { name: 'test-store' }
      )
    );
    
    testStore.getState().setValue('updated');
    
    // 等待异步保存完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const saved = localStorage.getItem('test-store');
    expect(saved).toContain('updated');
  });
});
```

### 集成测试

```typescript
// tests/integration.test.ts
describe('State Management Integration', () => {
  it('多个store应该能够协同工作', () => {
    // 创建组件
    const componentStore = useComponentStore.getState();
    const canvasStore = useCanvasStore.getState();
    
    const component = componentStore.createComponent({
      title: 'Test Component',
      content: 'Test content'
    });
    
    // 在画布上添加节点
    canvasStore.addNode({
      type: 'component',
      position: { x: 100, y: 100 },
      data: component
    });
    
    expect(canvasStore.nodes).toHaveLength(1);
    expect(canvasStore.nodes[0].data.title).toBe('Test Component');
  });
  
  it('UI状态应该正确反映操作', () => {
    const uiStore = useUIStore.getState();
    
    uiStore.setLoading('components', true);
    expect(uiStore.loadingStates.components).toBe(true);
    
    uiStore.addNotification({
      type: 'success',
      title: 'Success',
      message: 'Operation completed'
    });
    
    expect(uiStore.notifications).toHaveLength(1);
  });
});
```

## 📊 性能优化

### 状态分片

```typescript
// 使用状态分片避免不必要的重渲染
const useCanvasNodes = () => useCanvasStore(state => state.nodes);
const useCanvasEdges = () => useCanvasStore(state => state.edges);
const useSelectedNodes = () => useCanvasStore(state => state.selectedNodes);

// 使用选择器缓存计算结果
const useSelectedNodeCount = () => useCanvasStore(
  state => state.selectedNodes.length,
  shallow // 浅比较优化
);
```

### 批量更新

```typescript
// 使用批量更新减少渲染次数
export const useBatchedUpdates = () => {
  const [updates, setUpdates] = useState<Array<() => void>>([]);
  
  const batchUpdate = useCallback((update: () => void) => {
    setUpdates(prev => [...prev, update]);
  }, []);
  
  useEffect(() => {
    if (updates.length > 0) {
      const batchedUpdate = () => {
        updates.forEach(update => update());
        setUpdates([]);
      };
      
      // 使用 React 的批处理
      unstable_batchedUpdates(batchedUpdate);
    }
  }, [updates]);
  
  return batchUpdate;
};
```

## 🎨 最佳实践

1. **状态规范化**: 使用扁平化的状态结构，避免深层嵌套
2. **选择器优化**: 使用记忆化选择器避免不必要的计算
3. **批量更新**: 合并多个状态更新，减少重渲染
4. **持久化策略**: 选择性持久化，不要保存所有状态
5. **类型安全**: 充分利用TypeScript的类型检查

## 🚨 注意事项

1. **状态同步**: 注意协作环境下的状态同步和冲突解决
2. **内存管理**: 及时清理不需要的状态和监听器
3. **循环依赖**: 避免store之间的循环依赖
4. **性能监控**: 监控状态更新频率和渲染性能

## 📈 版本历史

- **v1.0.0**: 初始版本，基础状态管理
- **v1.1.0**: 添加协作状态同步
- **v1.2.0**: 增强中间件系统
- **v1.3.0**: 实现撤销重做功能
- **v1.4.0**: 优化性能和内存使用
- **v2.0.0**: 重构架构，支持微前端

## 🤝 贡献指南

1. 新增store需要完整的测试覆盖
2. 确保状态更新的原子性
3. 提供详细的选择器和hooks文档
4. 遵循状态管理的最佳实践

## 📄 许可证

MIT License