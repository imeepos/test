# 数据库迁移与种子数据指南

本文档介绍如何使用 SKER Store 的数据库迁移工具和种子数据系统。

## 目录

- [数据库迁移](#数据库迁移)
- [种子数据](#种子数据)
- [Docker 集成](#docker-集成)
- [最佳实践](#最佳实践)

## 数据库迁移

### 基本概念

数据库迁移是一种版本控制系统，用于管理数据库架构的变更。每个迁移文件代表数据库的一个版本变化。

### 可用命令

#### 执行迁移

```bash
# 执行所有待处理的迁移
pnpm --filter=@sker/store run migrate

# 自动发现并执行迁移文件
pnpm --filter=@sker/store run migrate:auto

# 强制执行（忽略错误）
pnpm --filter=@sker/store run migrate:force
```

#### 查看迁移状态

```bash
# 查看当前迁移状态
pnpm --filter=@sker/store run migrate:status

# 查看状态（自动发现模式）
pnpm --filter=@sker/store run migrate:status:auto
```

### 迁移文件管理

迁移文件位于 `packages/store/src/migrations/` 目录下，命名格式为 `XXX_description.sql`，例如：

- `001_initial_schema.sql` - 初始数据库架构
- `002_add_users_avatar.sql` - 添加用户头像字段
- `003_create_notifications.sql` - 创建通知表

### 迁移特性

1. **自动发现**：使用 `--auto` 标志可以自动发现 migrations 目录中的所有 `.sql` 文件
2. **校验和验证**：每个迁移文件都会计算 SHA-256 校验和，防止已执行的迁移被修改
3. **事务支持**：所有迁移在事务中执行，失败时自动回滚
4. **迁移记录**：已执行的迁移会记录在 `migrations` 表中

### 创建新迁移

1. 在 `packages/store/src/migrations/` 目录下创建新的 `.sql` 文件
2. 文件名使用递增的数字前缀，如 `002_add_feature.sql`
3. 编写 SQL 语句
4. 如果不使用自动发现模式，需要在 `migrate.ts` 的 `allMigrations` 数组中添加文件名

示例迁移文件：

```sql
-- 002_add_users_avatar.sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
CREATE INDEX idx_users_avatar ON users(avatar_url) WHERE avatar_url IS NOT NULL;
```

## 种子数据

### 基本概念

种子数据用于在开发和测试环境中快速填充数据库，包括示例用户、项目、节点等。

### 可用命令

#### 创建种子数据

```bash
# 创建所有种子数据
pnpm --filter=@sker/store run seed

# 强制创建（忽略已存在检查）
pnpm --filter=@sker/store run seed:force

# 仅创建用户
pnpm --filter=@sker/store run seed:users

# 仅创建项目
pnpm --filter=@sker/store run seed:projects

# 创建最小化数据集（无示例节点和AI任务）
pnpm --filter=@sker/store run seed:minimal
```

#### 清理数据

```bash
# 清理所有数据
pnpm --filter=@sker/store run seed:clear

# 查看数据统计
pnpm --filter=@sker/store run seed:stats
```

#### 数据库操作

```bash
# 初始化数据库（迁移 + 种子）
pnpm --filter=@sker/store run db:setup

# 初始化数据库（自动发现模式）
pnpm --filter=@sker/store run db:setup:auto

# 重置数据库（清理 + 迁移 + 种子）
pnpm --filter=@sker/store run db:reset

# 完全刷新数据库（清理 + 迁移 + 强制种子）
pnpm --filter=@sker/store run db:fresh
```

### 种子数据选项

可以通过命令行标志控制种子数据的行为：

| 选项 | 说明 |
|------|------|
| `--force` | 强制创建，忽略已存在检查 |
| `--clear` | 在种子前清理现有数据 |
| `--verbose`, `-v` | 详细输出 |
| `--users-only` | 仅创建用户数据 |
| `--projects-only` | 仅创建项目数据 |
| `--minimal` | 最小化数据集（无示例节点和AI任务） |

### 默认种子数据

系统会创建以下默认数据：

#### 用户

1. **管理员用户**
   - Email: `admin@sker.dev`
   - Username: `admin`
   - Password: `Admin123!@#`

2. **测试用户**
   - Email: `test@sker.dev`
   - Username: `testuser`
   - Password: `Test123!@#`

#### 项目

1. **AI助手开发计划** - 完整的示例项目，包含节点和连接
2. **产品功能规划** - 基础示例项目

#### 其他数据

- 示例节点（4个）
- 节点连接（3个）
- AI任务（2个）

## Docker 集成

### 自动迁移

Docker 容器启动时会自动运行数据库迁移。可以通过环境变量控制：

```yaml
environment:
  - AUTO_MIGRATE=true  # 默认为 true
```

### 自动种子

在开发环境中，可以启用自动种子功能：

```yaml
environment:
  - NODE_ENV=development
  - AUTO_SEED=true  # 默认为 false
```

### docker-entrypoint.sh

Docker 容器使用自定义入口脚本 `/usr/local/bin/docker-entrypoint.sh`，它会：

1. 等待 PostgreSQL 和 Redis 就绪
2. 执行数据库迁移（如果 `AUTO_MIGRATE=true`）
3. 执行种子数据（如果 `NODE_ENV=development` 且 `AUTO_SEED=true`）
4. 启动应用服务

### 手动执行

即使在 Docker 容器中，也可以手动执行迁移和种子：

```bash
# 进入容器
docker compose exec store sh

# 执行迁移
npm run migrate:status
npm run migrate

# 执行种子
npm run seed:stats
npm run seed

# 重置数据库
npm run db:reset
```

## 最佳实践

### 开发环境

1. **初始设置**
   ```bash
   pnpm --filter=@sker/store run db:setup
   ```

2. **数据损坏时重置**
   ```bash
   pnpm --filter=@sker/store run db:fresh
   ```

3. **快速测试**
   ```bash
   pnpm --filter=@sker/store run seed:minimal
   ```

### 生产环境

1. **仅运行迁移**
   ```bash
   pnpm --filter=@sker/store run migrate
   ```

2. **验证迁移状态**
   ```bash
   pnpm --filter=@sker/store run migrate:status
   ```

3. **不要在生产环境运行种子数据**

### 迁移文件编写

1. **保持迁移简单**：每个迁移文件只做一件事
2. **向后兼容**：避免删除列或表，考虑使用软删除
3. **添加索引**：在创建表时就添加必要的索引
4. **使用事务**：所有迁移自动在事务中执行
5. **测试迁移**：在应用到生产前先在开发环境测试

### 种子数据编写

1. **幂等性**：种子数据应该可以重复执行
2. **环境分离**：生产环境不应执行种子数据
3. **合理数据量**：保持种子数据量适中
4. **密码安全**：使用强密码，即使是测试账号

## 故障排除

### 迁移失败

**问题**：迁移执行失败
**解决方案**：
1. 检查错误日志
2. 验证 SQL 语法
3. 确保数据库连接正常
4. 使用 `migrate:force` 跳过失败的迁移（谨慎使用）

### 校验和不匹配

**问题**：`迁移文件已被修改，校验和不匹配`
**解决方案**：
1. 如果是已执行的迁移被修改，创建新的迁移文件而不是修改旧的
2. 如果确定要修改，手动删除 `migrations` 表中的记录

### 种子数据已存在

**问题**：`用户数据已存在，跳过创建示例用户`
**解决方案**：
1. 使用 `--force` 标志强制创建
2. 先执行 `seed:clear` 清理数据
3. 使用 `db:fresh` 完全刷新数据库

### Docker 容器启动失败

**问题**：容器因迁移失败而无法启动
**解决方案**：
1. 检查 Docker 日志：`docker compose logs store`
2. 临时禁用自动迁移：设置 `AUTO_MIGRATE=false`
3. 手动进入容器修复：`docker compose exec store sh`

## 相关文件

- `packages/store/src/migrations/migrate.ts` - 迁移管理器
- `packages/store/src/migrations/seed.ts` - 种子数据管理器
- `packages/store/src/migrations/*.sql` - SQL 迁移文件
- `packages/store/Dockerfile` - Docker 镜像定义
- `packages/store/docker-entrypoint.sh` - Docker 入口脚本
- `docker-compose.yml` - Docker Compose 配置

## 贡献指南

添加新迁移或修改种子数据时，请：

1. 遵循命名约定
2. 更新相关文档
3. 在开发环境测试
4. 提交前运行 `db:fresh` 验证

## 支持

如有问题，请：
1. 查看本文档
2. 检查日志文件
3. 提交 Issue 到 GitHub 仓库
