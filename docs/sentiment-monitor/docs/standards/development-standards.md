# 开发规范与编码标准

## 1. 项目结构规范

### 1.1 Monorepo 工作空间结构

```
sentiment-monitor/
├── .git/                        # Git版本控制
├── .github/                     # GitHub配置
│   ├── workflows/               # CI/CD工作流
│   ├── ISSUE_TEMPLATE/         # Issue模板
│   └── PULL_REQUEST_TEMPLATE.md # PR模板
├── .vscode/                     # VS Code配置
│   ├── settings.json           # 编辑器设置
│   ├── extensions.json         # 推荐扩展
│   └── launch.json             # 调试配置
├── docs/                        # 项目文档
│   ├── standards/              # 开发规范
│   ├── architecture.md         # 架构文档
│   ├── api.md                  # API文档
│   └── deployment.md           # 部署文档
├── scripts/                     # 构建脚本
│   ├── build.sh               # 构建脚本
│   ├── test.sh                # 测试脚本
│   ├── lint.sh                # 代码检查
│   └── deploy.sh              # 部署脚本
├── tools/                       # 开发工具
│   ├── generators/            # 代码生成器
│   ├── migrators/             # 数据迁移工具
│   └── analyzers/             # 代码分析工具
├── config/                      # 配置文件
│   ├── eslint.config.js       # ESLint配置
│   ├── prettier.config.js     # Prettier配置
│   ├── jest.config.js         # Jest配置
│   └── docker/                # Docker配置
├── apps/                        # 应用程序
│   ├── gateway/               # API网关
│   ├── services/              # 微服务
│   │   ├── user/             # 用户服务
│   │   ├── collector/        # 采集服务
│   │   ├── processor/        # 处理服务
│   │   ├── sentiment/        # 情感分析服务
│   │   ├── alert/            # 告警服务
│   │   └── dashboard/        # 仪表板服务
│   ├── web/                   # Web应用
│   │   ├── admin/            # 管理后台
│   │   ├── portal/           # 用户门户
│   │   └── mobile/           # 移动应用
│   └── workers/               # 后台任务
│       ├── scheduler/        # 任务调度器
│       └── processor/        # 数据处理器
├── packages/                    # 共享包
│   ├── types/                 # 类型定义
│   ├── utils/                 # 工具函数
│   ├── config/               # 配置管理
│   ├── database/             # 数据库相关
│   ├── auth/                 # 认证授权
│   ├── events/               # 事件系统
│   ├── cache/                # 缓存系统
│   ├── logger/               # 日志系统
│   ├── metrics/              # 监控指标
│   └── ui/                   # UI组件库
├── tests/                       # 测试目录
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   ├── e2e/                  # 端到端测试
│   ├── fixtures/             # 测试数据
│   └── helpers/              # 测试辅助
├── deployment/                  # 部署配置
│   ├── docker/               # Docker配置
│   ├── k8s/                  # Kubernetes配置
│   ├── terraform/            # 基础设施代码
│   └── helm/                 # Helm图表
├── package.json                 # 根包配置
├── pnpm-workspace.yaml         # PNPM工作空间
├── turbo.json                  # Turbo配置
├── README.md                   # 项目说明
├── CHANGELOG.md                # 更新日志
├── CONTRIBUTING.md             # 贡献指南
└── LICENSE                     # 许可证
```

### 1.2 单一服务结构规范

```
service-name/
├── src/                         # 源代码目录
│   ├── controllers/            # 控制器层
│   │   ├── base.controller.ts  # 基础控制器
│   │   ├── user.controller.ts  # 用户控制器
│   │   └── index.ts            # 导出文件
│   ├── services/               # 业务逻辑层
│   │   ├── interfaces/         # 服务接口
│   │   ├── implementations/    # 服务实现
│   │   └── index.ts            # 导出文件
│   ├── repositories/           # 数据访问层
│   │   ├── interfaces/         # 仓储接口
│   │   ├── implementations/    # 仓储实现
│   │   └── index.ts            # 导出文件
│   ├── models/                 # 数据模型
│   │   ├── entities/           # 实体模型
│   │   ├── dtos/               # 数据传输对象
│   │   ├── requests/           # 请求模型
│   │   ├── responses/          # 响应模型
│   │   └── index.ts            # 导出文件
│   ├── middleware/             # 中间件
│   │   ├── auth.middleware.ts  # 认证中间件
│   │   ├── cors.middleware.ts  # CORS中间件
│   │   ├── logger.middleware.ts # 日志中间件
│   │   └── index.ts            # 导出文件
│   ├── validators/             # 数据验证
│   │   ├── schemas/            # 验证模式
│   │   ├── rules/              # 验证规则
│   │   └── index.ts            # 导出文件
│   ├── utils/                  # 工具函数
│   │   ├── helpers/            # 辅助函数
│   │   ├── constants/          # 常量定义
│   │   └── index.ts            # 导出文件
│   ├── events/                 # 事件处理
│   │   ├── handlers/           # 事件处理器
│   │   ├── publishers/         # 事件发布器
│   │   └── index.ts            # 导出文件
│   ├── jobs/                   # 后台任务
│   │   ├── processors/         # 任务处理器
│   │   ├── schedulers/         # 任务调度器
│   │   └── index.ts            # 导出文件
│   ├── config/                 # 配置文件
│   │   ├── database.config.ts  # 数据库配置
│   │   ├── redis.config.ts     # Redis配置
│   │   ├── app.config.ts       # 应用配置
│   │   └── index.ts            # 导出文件
│   ├── types/                  # 类型定义
│   │   ├── global.d.ts         # 全局类型
│   │   ├── express.d.ts        # Express扩展
│   │   └── index.ts            # 导出文件
│   ├── database/               # 数据库相关
│   │   ├── migrations/         # 数据库迁移
│   │   ├── seeders/            # 数据填充
│   │   ├── connection.ts       # 数据库连接
│   │   └── index.ts            # 导出文件
│   ├── tests/                  # 测试文件
│   │   ├── unit/               # 单元测试
│   │   ├── integration/        # 集成测试
│   │   ├── fixtures/           # 测试数据
│   │   └── helpers/            # 测试辅助
│   ├── app.ts                  # 应用入口
│   └── server.ts               # 服务器启动
├── dist/                       # 编译输出
├── docs/                       # 服务文档
├── tests/                      # 额外测试
├── .env.example               # 环境变量示例
├── .gitignore                 # Git忽略文件
├── package.json               # 包配置
├── tsconfig.json              # TypeScript配置
├── jest.config.js             # Jest配置
├── Dockerfile                 # Docker配置
└── README.md                  # 服务说明
```

### 1.3 前端应用结构规范

```
web-app/
├── public/                     # 静态资源
│   ├── icons/                 # 图标文件
│   ├── images/                # 图片资源
│   └── manifest.json          # PWA配置
├── src/                        # 源代码
│   ├── components/            # 通用组件
│   │   ├── ui/                # 基础UI组件
│   │   ├── layout/            # 布局组件
│   │   ├── forms/             # 表单组件
│   │   ├── charts/            # 图表组件
│   │   └── index.ts           # 导出文件
│   ├── pages/                 # 页面组件
│   │   ├── dashboard/         # 仪表板页面
│   │   ├── users/             # 用户管理页面
│   │   ├── settings/          # 设置页面
│   │   └── index.ts           # 导出文件
│   ├── hooks/                 # 自定义Hook
│   │   ├── useAuth.ts         # 认证Hook
│   │   ├── useApi.ts          # API调用Hook
│   │   └── index.ts           # 导出文件
│   ├── stores/                # 状态管理
│   │   ├── auth.store.ts      # 认证状态
│   │   ├── user.store.ts      # 用户状态
│   │   └── index.ts           # 导出文件
│   ├── services/              # API服务
│   │   ├── api/               # API调用
│   │   ├── auth/              # 认证服务
│   │   └── index.ts           # 导出文件
│   ├── utils/                 # 工具函数
│   │   ├── helpers/           # 辅助函数
│   │   ├── constants/         # 常量定义
│   │   ├── formatters/        # 格式化函数
│   │   └── index.ts           # 导出文件
│   ├── types/                 # 类型定义
│   │   ├── api.types.ts       # API类型
│   │   ├── ui.types.ts        # UI类型
│   │   └── index.ts           # 导出文件
│   ├── styles/                # 样式文件
│   │   ├── globals.css        # 全局样式
│   │   ├── components.css     # 组件样式
│   │   └── utilities.css      # 工具样式
│   ├── assets/                # 资源文件
│   │   ├── fonts/             # 字体文件
│   │   ├── icons/             # 图标
│   │   └── images/            # 图片
│   ├── locales/               # 国际化
│   │   ├── en.json            # 英文
│   │   ├── zh-CN.json         # 中文
│   │   └── index.ts           # 导出文件
│   ├── App.tsx                # 应用根组件
│   ├── main.tsx               # 应用入口
│   └── vite-env.d.ts          # Vite类型定义
├── tests/                      # 测试文件
├── .env.example               # 环境变量示例
├── package.json               # 包配置
├── tsconfig.json              # TypeScript配置
├── vite.config.ts             # Vite配置
├── tailwind.config.js         # Tailwind配置
├── vitest.config.ts           # Vitest配置
└── README.md                  # 应用说明
```

## 2. 编码规范

### 2.1 TypeScript编码标准

#### 2.1.1 基础规范

```typescript
// 1. 使用 const 断言
const API_ENDPOINTS = {
  USERS: '/api/v1/users',
  POSTS: '/api/v1/posts'
} as const;

// 2. 优先使用接口而非类型别名定义对象结构
interface User {
  readonly id: string;
  username: string;
  email: string;
  profile: UserProfile;
}

// 3. 使用类型别名定义联合类型和基础类型
type Status = 'pending' | 'active' | 'inactive';
type ID = string;

// 4. 使用泛型提高代码复用性
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 5. 使用严格的类型检查
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### 2.1.2 命名规范

```typescript
// 变量和函数：camelCase
const userName = 'john_doe';
const fetchUserData = async () => {};

// 常量：SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// 类和接口：PascalCase
class UserService {}
interface UserProfile {}

// 枚举：PascalCase，成员：SCREAMING_SNAKE_CASE
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// 类型别名：PascalCase
type APIResponse<T> = {
  data: T;
  success: boolean;
};

// 文件名：kebab-case
// user-service.ts
// api-client.ts
// data-models.ts

// 目录名：kebab-case
// user-management/
// data-processing/
// api-gateway/
```

#### 2.1.3 函数定义规范

```typescript
// 1. 使用箭头函数定义简单函数
const add = (a: number, b: number): number => a + b;

// 2. 使用函数声明定义复杂函数
function processUserData(
  userData: UserData,
  options: ProcessingOptions = {}
): Promise<ProcessedUser> {
  // 实现逻辑
}

// 3. 使用函数重载处理多种调用方式
function createUser(userData: CreateUserRequest): Promise<User>;
function createUser(
  username: string,
  email: string,
  options?: CreateUserOptions
): Promise<User>;
function createUser(
  userDataOrUsername: CreateUserRequest | string,
  email?: string,
  options?: CreateUserOptions
): Promise<User> {
  // 实现逻辑
}

// 4. 使用工厂函数创建对象
const createApiClient = (config: ApiConfig): ApiClient => ({
  baseURL: config.baseURL,
  timeout: config.timeout || 5000,
  request: async (endpoint: string) => {
    // 实现逻辑
  }
});

// 5. 使用高阶函数增强功能
const withRetry = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3
): T => {
  return (async (...args: Parameters<T>) => {
    // 重试逻辑
  }) as T;
};
```

#### 2.1.4 类定义规范

```typescript
// 1. 类属性和方法的可见性标识
class UserService {
  private readonly repository: UserRepository;
  private readonly logger: Logger;
  protected config: ServiceConfig;

  constructor(
    repository: UserRepository,
    logger: Logger,
    config: ServiceConfig
  ) {
    this.repository = repository;
    this.logger = logger;
    this.config = config;
  }

  // 公开方法
  public async createUser(userData: CreateUserRequest): Promise<User> {
    this.logger.info('Creating user', { userData });
    return this.repository.create(userData);
  }

  // 受保护方法
  protected validateUserData(userData: CreateUserRequest): boolean {
    // 验证逻辑
    return true;
  }

  // 私有方法
  private async sendWelcomeEmail(user: User): Promise<void> {
    // 发送邮件逻辑
  }
}

// 2. 抽象类定义
abstract class BaseRepository<T, ID> {
  protected abstract tableName: string;

  abstract findById(id: ID): Promise<T | null>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: ID, data: Partial<T>): Promise<T>;
  abstract delete(id: ID): Promise<void>;

  // 通用方法实现
  protected buildQuery(conditions: Record<string, any>): string {
    // 构建查询逻辑
    return '';
  }
}

// 3. 实现类
class UserRepository extends BaseRepository<User, string> {
  protected tableName = 'users';

  async findById(id: string): Promise<User | null> {
    // 实现逻辑
    return null;
  }

  async create(userData: Partial<User>): Promise<User> {
    // 实现逻辑
    return {} as User;
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    // 实现逻辑
    return {} as User;
  }

  async delete(id: string): Promise<void> {
    // 实现逻辑
  }
}
```

### 2.2 React/Frontend编码规范

#### 2.2.1 组件定义规范

```tsx
// 1. 函数组件定义
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  className
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(user);
  }, [user, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(user.id);
  }, [user.id, onDelete]);

  return (
    <div className={cn('user-card', className)}>
      <h3>{user.username}</h3>
      <p>{user.email}</p>
      <div className="actions">
        <Button onClick={handleEdit}>编辑</Button>
        <Button variant="destructive" onClick={handleDelete}>
          删除
        </Button>
      </div>
    </div>
  );
};

// 2. 自定义Hook定义
interface UseUserDataResult {
  users: User[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const useUserData = (filters?: UserFilters): UseUserDataResult => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getUsers(filters);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
};

// 3. 状态管理（Zustand）
interface UserStore {
  users: User[];
  currentUser: User | null;
  loading: boolean;

  // Actions
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;

  // Async actions
  fetchUsers: () => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<User>;
}

const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  currentUser: null,
  loading: false,

  setUsers: (users) => set({ users }),
  setCurrentUser: (currentUser) => set({ currentUser }),

  addUser: (user) => set((state) => ({
    users: [...state.users, user]
  })),

  updateUser: (id, updates) => set((state) => ({
    users: state.users.map(user =>
      user.id === id ? { ...user, ...updates } : user
    )
  })),

  removeUser: (id) => set((state) => ({
    users: state.users.filter(user => user.id !== id)
  })),

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const users = await userApi.getUsers();
      set({ users, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createUser: async (userData) => {
    const user = await userApi.createUser(userData);
    get().addUser(user);
    return user;
  }
}));
```

#### 2.2.2 样式规范

```tsx
// 1. Tailwind CSS类名规范
const UserCard = ({ user, className }: UserCardProps) => {
  return (
    <div className={cn(
      // 布局
      'flex flex-col gap-4 p-6',
      // 外观
      'bg-white rounded-lg shadow-md border',
      // 交互
      'hover:shadow-lg transition-shadow duration-200',
      // 响应式
      'w-full md:w-1/2 lg:w-1/3',
      // 自定义类名
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {user.username}
        </h3>
        <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
          {user.status}
        </Badge>
      </div>

      <p className="text-sm text-gray-600">
        {user.email}
      </p>

      <div className="flex gap-2 mt-auto">
        <Button size="sm" variant="outline">
          编辑
        </Button>
        <Button size="sm" variant="destructive">
          删除
        </Button>
      </div>
    </div>
  );
};

// 2. CSS Module规范（如果使用）
// user-card.module.css
.userCard {
  @apply flex flex-col gap-4 p-6;
  @apply bg-white rounded-lg shadow-md border;
  @apply hover:shadow-lg transition-shadow duration-200;
}

.userCard__header {
  @apply flex items-center justify-between;
}

.userCard__title {
  @apply text-lg font-semibold text-gray-900;
}

// 3. CSS-in-JS规范（如果使用styled-components）
const StyledUserCard = styled.div<{ variant?: 'default' | 'compact' }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  ${({ variant }) => variant === 'compact' && `
    padding: 1rem;
    gap: 0.5rem;
  `}
`;
```

### 2.3 Node.js后端编码规范

#### 2.3.1 Express应用结构

```typescript
// 1. 应用入口文件 (app.ts)
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limiter';
import { routes } from './routes';
import { config } from './config';

const createApp = (): express.Application => {
  const app = express();

  // 安全中间件
  app.use(helmet());
  app.use(cors(config.cors));

  // 通用中间件
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 自定义中间件
  app.use(requestLogger);
  app.use(rateLimiter);

  // API路由
  app.use('/api', routes);

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // 错误处理
  app.use(errorHandler);

  return app;
};

export { createApp };

// 2. 控制器规范 (controllers/user.controller.ts)
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { UserService } from '../services/user.service';
import { CreateUserRequest, UpdateUserRequest } from '../models/requests';
import { UserResponse } from '../models/responses';
import { validateRequest } from '../utils/validation';
import { createUserSchema, updateUserSchema } from '../validators/user.schemas';

@injectable()
export class UserController {
  constructor(
    @inject('UserService') private userService: UserService
  ) {}

  public createUser = async (
    req: Request<{}, UserResponse, CreateUserRequest>,
    res: Response<UserResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 验证请求数据
      const validatedData = validateRequest(createUserSchema, req.body);

      // 调用业务逻辑
      const user = await this.userService.createUser(validatedData);

      // 返回响应
      res.status(201).json({
        success: true,
        data: user,
        message: '用户创建成功'
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (
    req: Request<{ id: string }>,
    res: Response<UserResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (
    req: Request<{ id: string }, UserResponse, UpdateUserRequest>,
    res: Response<UserResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = validateRequest(updateUserSchema, req.body);

      const user = await this.userService.updateUser(id, validatedData);

      res.json({
        success: true,
        data: user,
        message: '用户更新成功'
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

// 3. 服务层规范 (services/user.service.ts)
import { injectable, inject } from 'inversify';
import { UserRepository } from '../repositories/user.repository';
import { EventBus } from '../events/event-bus';
import { CacheService } from '../services/cache.service';
import { User } from '../models/entities/user';
import { CreateUserRequest, UpdateUserRequest } from '../models/requests';
import { UserCreatedEvent, UserUpdatedEvent } from '../events/user.events';
import { hashPassword, validatePassword } from '../utils/auth';

@injectable()
export class UserService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('EventBus') private eventBus: EventBus,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async createUser(userData: CreateUserRequest): Promise<User> {
    // 检查用户是否已存在
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('用户已存在');
    }

    // 加密密码
    const hashedPassword = await hashPassword(userData.password);

    // 创建用户
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    });

    // 发布事件
    await this.eventBus.publish(new UserCreatedEvent(user));

    // 清除相关缓存
    await this.cacheService.delete(`users:*`);

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    // 尝试从缓存获取
    const cacheKey = `user:${id}`;
    let user = await this.cacheService.get<User>(cacheKey);

    if (!user) {
      // 从数据库获取
      user = await this.userRepository.findById(id);

      if (user) {
        // 缓存用户数据
        await this.cacheService.set(cacheKey, user, 3600); // 1小时
      }
    }

    return user;
  }

  async updateUser(id: string, updateData: UpdateUserRequest): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果更新密码，需要加密
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    const updatedUser = await this.userRepository.update(id, updateData);

    // 发布事件
    await this.eventBus.publish(new UserUpdatedEvent(updatedUser, user));

    // 清除缓存
    await this.cacheService.delete(`user:${id}`);
    await this.cacheService.delete(`users:*`);

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    await this.userRepository.delete(id);

    // 清除缓存
    await this.cacheService.delete(`user:${id}`);
    await this.cacheService.delete(`users:*`);
  }
}
```

### 2.4 错误处理规范

#### 2.4.1 自定义错误类

```typescript
// 1. 基础错误类
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;

    if (cause) {
      this.stack = cause.stack;
    }
  }
}

// 2. 具体错误类型
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
  readonly isOperational = true;

  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';
  readonly isOperational = true;

  constructor(message: string = 'Unauthorized access') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';
  readonly isOperational = true;

  constructor(message: string = 'Access forbidden') {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
  readonly isOperational = true;

  constructor(message: string, public readonly conflictField?: string) {
    super(message);
  }
}

// 3. 错误处理中间件
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 记录错误日志
  if (error instanceof AppError && error.isOperational) {
    logger.warn('Operational error occurred', {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id
    });
  } else {
    logger.error('Unexpected error occurred', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id
    });
  }

  // 返回错误响应
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && {
          field: error.field,
          details: error.details
        })
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  } else {
    // 未知错误，返回通用错误信息
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
};
```

### 2.5 测试编码规范

#### 2.5.1 单元测试规范

```typescript
// 1. 测试文件命名：*.test.ts 或 *.spec.ts
// user.service.test.ts

import { UserService } from '../user.service';
import { UserRepository } from '../repositories/user.repository';
import { EventBus } from '../events/event-bus';
import { CacheService } from '../services/cache.service';
import { createMockUser, createMockCreateUserRequest } from '../__mocks__/user.mocks';

// 2. 测试套件结构
describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    // 创建模拟对象
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<UserRepository>;

    mockEventBus = {
      publish: jest.fn()
    } as jest.Mocked<EventBus>;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<CacheService>;

    // 创建服务实例
    userService = new UserService(
      mockUserRepository,
      mockEventBus,
      mockCacheService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const createUserRequest = createMockCreateUserRequest();
      const expectedUser = createMockUser();

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(createUserRequest);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        createUserRequest.email
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: createUserRequest.username,
          email: createUserRequest.email
        })
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserCreatedEvent)
      );
      expect(mockCacheService.delete).toHaveBeenCalledWith('users:*');
    });

    it('should throw error when user already exists', async () => {
      // Arrange
      const createUserRequest = createMockCreateUserRequest();
      const existingUser = createMockUser();

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.createUser(createUserRequest))
        .rejects.toThrow('用户已存在');

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user from cache when available', async () => {
      // Arrange
      const userId = 'user-123';
      const cachedUser = createMockUser({ id: userId });

      mockCacheService.get.mockResolvedValue(cachedUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(cachedUser);
      expect(mockCacheService.get).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch user from database when not in cache', async () => {
      // Arrange
      const userId = 'user-123';
      const dbUser = createMockUser({ id: userId });

      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(dbUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(dbUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `user:${userId}`,
        dbUser,
        3600
      );
    });
  });
});

// 3. 模拟数据工厂
// __mocks__/user.mocks.ts
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: UserRole.ANALYST,
  status: UserStatus.ACTIVE,
  profile: {
    firstName: 'Test',
    lastName: 'User',
    preferences: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      theme: 'light',
      notifications: {}
    }
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

export const createMockCreateUserRequest = (
  overrides: Partial<CreateUserRequest> = {}
): CreateUserRequest => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  profile: {
    firstName: 'Test',
    lastName: 'User'
  },
  role: UserRole.ANALYST,
  ...overrides
});
```

#### 2.5.2 集成测试规范

```typescript
// integration/user.integration.test.ts
import request from 'supertest';
import { createApp } from '../app';
import { setupTestDatabase, teardownTestDatabase } from '../test-helpers/database';
import { createTestUser, getAuthToken } from '../test-helpers/auth';

describe('User API Integration Tests', () => {
  let app: Express.Application;
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    const testUser = await createTestUser();
    authToken = await getAuthToken(testUser);
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        profile: {
          firstName: 'New',
          lastName: 'User'
        },
        role: 'analyst'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          username: userData.username,
          email: userData.email,
          role: userData.role
        }
      });
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidUserData = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR'
        }
      });
    });
  });
});
```

## 3. 代码质量工具配置

### 3.1 ESLint配置

```javascript
// eslint.config.js
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'import', 'security'],
  rules: {
    // TypeScript规则
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',

    // 导入规则
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always'
      }
    ],
    'import/no-duplicates': 'error',

    // 安全规则
    'security/detect-sql-injection': 'error',
    'security/detect-object-injection': 'warn',

    // 通用规则
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
```

### 3.2 Prettier配置

```javascript
// prettier.config.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',

  // 特定文件类型配置
  overrides: [
    {
      files: '*.json',
      options: {
        parser: 'json',
        trailingComma: 'none'
      }
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'preserve'
      }
    }
  ]
};
```

### 3.3 Git Hooks配置

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-push": "npm run test:ci"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md,yaml,yml}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### 3.4 提交信息规范

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式修改
        'refactor', // 代码重构
        'test',     // 测试用例修改
        'chore',    // 构建过程或辅助工具的变动
        'perf',     // 性能优化
        'ci',       // CI/CD配置修改
        'build',    // 构建系统修改
        'revert'    // 代码回滚
      ]
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case']],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100]
  }
};

// 提交信息示例
// feat(user): 添加用户注册功能
// fix(api): 修复用户查询接口的权限验证问题
// docs(readme): 更新API文档和使用说明
// refactor(service): 重构用户服务的数据处理逻辑
// test(user): 增加用户服务的单元测试覆盖
```

以上是舆情监测系统的开发规范与编码标准文档，涵盖了项目结构、TypeScript编码规范、React前端规范、Node.js后端规范、错误处理、测试规范以及代码质量工具配置等方面，为团队提供统一的开发标准。