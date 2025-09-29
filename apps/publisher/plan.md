# @sker/publisher 开发计划

## 📋 项目概述

@sker/publisher 是 SKER 系统中的导出服务应用，专门负责将AI协作画布内容导出为各种格式的专业工具。作为独立的微服务，它与核心系统通过API和消息队列进行集成，为用户提供强大的内容发布和分享能力。

### 项目定位
- **服务类型**: 独立微服务应用
- **主要职责**: 画布内容导出、格式转换、分享发布
- **技术架构**: Node.js + Express + 多种渲染引擎
- **部署方式**: 独立部署，支持横向扩展

### 核心价值
- 🎯 **多格式导出**: 支持PDF、PNG、SVG、Markdown等多种格式
- 🎨 **模板定制**: 提供丰富的导出模板和样式配置
- 📦 **批量处理**: 高效的批量导出和处理能力
- 🔗 **智能分享**: 生成分享链接和第三方平台发布
- 📊 **数据分析**: 导出使用统计和内容分析

## 🏗️ 技术架构设计

### 系统架构图

```mermaid
graph TB
    A[Frontend - @sker/studio] -->|HTTP API| B[@sker/publisher]
    C[@sker/gateway] -->|转发请求| B
    B -->|读取数据| D[@sker/store]
    B -->|消息通知| E[@sker/broker]
    B -->|文件存储| F[云存储 S3/OSS]
    B -->|缓存处理| G[Redis Cache]

    subgraph "Publisher 内部架构"
        B1[Export Controller] --> B2[Template Engine]
        B1 --> B3[Format Converter]
        B1 --> B4[Share Manager]
        B2 --> B5[PDF Renderer]
        B2 --> B6[Image Renderer]
        B2 --> B7[Markdown Parser]
        B3 --> B8[File Optimizer]
        B4 --> B9[Link Generator]
        B4 --> B10[Platform Publisher]
    end
```

### 技术栈选型

#### 核心框架
```yaml
运行时: Node.js 18+
Web框架: Express.js 4.18+
语言: TypeScript 5.0+
构建工具: Vite 4.0+
```

#### 渲染引擎
```yaml
PDF生成: Puppeteer 21+ (Chrome DevTools Protocol)
图像处理: Sharp 0.32+ (高性能图像处理)
矢量图: SVGO 3.0+ (SVG优化)
Canvas渲染: fabric.js 5.0+ (高级Canvas操作)
HTML渲染: Playwright 1.40+ (多浏览器支持)
```

#### 文件处理
```yaml
压缩: JSZip 3.10+ (ZIP文件处理)
格式转换: pandoc-node (文档格式转换)
字体支持: @font-face/fontkit (字体渲染)
图像优化: imagemin (图像压缩优化)
```

#### 云服务集成
```yaml
文件存储: AWS S3 SDK / 阿里云OSS SDK
CDN加速: CloudFront / 阿里云CDN
缓存: Redis 6+ (处理结果缓存)
消息队列: RabbitMQ (异步任务处理)
```

#### 开发工具
```yaml
测试框架: Jest 29+ (单元测试和集成测试)
代码质量: ESLint + Prettier
文档: TypeDoc (API文档生成)
监控: Winston (日志) + Prometheus (指标)
```

### 数据模型设计

#### 导出任务表 (export_tasks)
```sql
CREATE TABLE export_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 导出配置
  export_type VARCHAR(50) NOT NULL, -- 'pdf', 'png', 'svg', 'markdown', 'json'
  template_id UUID REFERENCES export_templates(id),
  format_options JSONB DEFAULT '{}', -- 格式特定选项

  -- 内容选择
  scope VARCHAR(20) DEFAULT 'full', -- 'full', 'selection', 'filtered'
  filter_config JSONB DEFAULT '{}', -- 筛选配置
  selected_nodes UUID[] DEFAULT '{}', -- 选中的节点ID

  -- 任务状态
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  error_message TEXT,

  -- 输出结果
  output_url TEXT, -- 生成文件的URL
  output_size INTEGER, -- 文件大小(字节)
  processing_time_ms INTEGER, -- 处理耗时

  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP -- 文件过期时间
);

CREATE INDEX idx_export_tasks_user ON export_tasks(user_id, created_at DESC);
CREATE INDEX idx_export_tasks_status ON export_tasks(status);
CREATE INDEX idx_export_tasks_project ON export_tasks(project_id);
```

#### 导出模板表 (export_templates)
```sql
CREATE TABLE export_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 模板信息
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'business', 'academic', 'personal', 'custom'
  is_public BOOLEAN DEFAULT false,
  is_builtin BOOLEAN DEFAULT false,

  -- 模板配置
  template_config JSONB NOT NULL, -- 完整模板配置
  style_config JSONB DEFAULT '{}', -- 样式配置
  layout_config JSONB DEFAULT '{}', -- 布局配置

  -- 预览和统计
  preview_image_url TEXT,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_export_templates_category ON export_templates(category, is_public);
CREATE INDEX idx_export_templates_user ON export_templates(user_id);
```

#### 分享链接表 (share_links)
```sql
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 链接信息
  share_token VARCHAR(255) UNIQUE NOT NULL, -- URL安全的分享token
  title VARCHAR(255),
  description TEXT,

  -- 访问控制
  access_type VARCHAR(20) DEFAULT 'public', -- 'public', 'password', 'private'
  access_password VARCHAR(255), -- 访问密码(加密存储)
  allowed_domains TEXT[], -- 允许的域名白名单

  -- 权限配置
  permissions JSONB DEFAULT '{"view": true, "comment": false, "download": false}',

  -- 有效期
  expires_at TIMESTAMP,
  max_views INTEGER, -- 最大访问次数
  current_views INTEGER DEFAULT 0,

  -- 统计信息
  last_accessed_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_share_links_token ON share_links(share_token);
CREATE INDEX idx_share_links_user ON share_links(user_id, created_at DESC);
CREATE INDEX idx_share_links_project ON share_links(project_id);
```

#### 发布记录表 (publish_records)
```sql
CREATE TABLE publish_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 发布平台
  platform VARCHAR(50) NOT NULL, -- 'wordpress', 'medium', 'notion', 'feishu'
  platform_config JSONB DEFAULT '{}', -- 平台特定配置

  -- 发布内容
  published_url TEXT, -- 发布后的URL
  published_title VARCHAR(255),
  content_format VARCHAR(20), -- 发布的格式

  -- 发布状态
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'published', 'failed'
  error_message TEXT,

  -- 统计信息
  view_count INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_publish_records_user ON publish_records(user_id, created_at DESC);
CREATE INDEX idx_publish_records_platform ON publish_records(platform);
```

## 🚀 开发路线图

### Phase 1: 基础架构搭建 (Week 1-2)

#### Week 1: 项目初始化和核心框架
**目标**: 建立完整的开发环境和基础架构

**Day 1-2: 项目脚手架**
- [ ] 创建 @sker/publisher 包结构
- [ ] 配置 TypeScript + Vite 构建环境
- [ ] 设置 Express.js 服务器框架
- [ ] 配置开发环境和热重载
- [ ] 建立代码规范 (ESLint + Prettier)
- [ ] 配置 Jest 测试环境

**Day 3-4: 数据库和存储**
- [ ] 设计和创建数据库表结构
- [ ] 实现数据库迁移脚本
- [ ] 配置 Redis 缓存连接
- [ ] 实现基础的 Repository 模式
- [ ] 设置云存储服务连接 (S3/OSS)
- [ ] 建立文件上传和下载机制

**Day 5-7: 核心服务架构**
- [ ] 设计服务层架构和接口
- [ ] 实现导出任务管理服务
- [ ] 建立消息队列集成 (@sker/broker)
- [ ] 实现与 @sker/store 的数据交互
- [ ] 建立基础的中间件系统
- [ ] 配置日志和监控基础设施

**Week 1 验收标准**:
- ✅ 服务器正常启动，基础API响应
- ✅ 数据库连接和基础CRUD操作正常
- ✅ 与其他微服务的基础通信建立
- ✅ 开发环境完全可用

#### Week 2: 渲染引擎集成
**目标**: 集成各种格式的渲染引擎和转换能力

**Day 8-9: PDF渲染引擎**
- [ ] 集成 Puppeteer 进行 PDF 生成
- [ ] 实现 HTML 到 PDF 的转换流程
- [ ] 支持自定义页面尺寸和样式
- [ ] 实现页眉页脚和页码功能
- [ ] 优化 PDF 生成性能和内存使用
- [ ] 添加 PDF 压缩和优化

**Day 10-11: 图像渲染引擎**
- [ ] 集成 Sharp 进行图像处理
- [ ] 实现画布截图功能 (PNG/JPG)
- [ ] 支持不同分辨率和DPI设置
- [ ] 实现 SVG 矢量图导出
- [ ] 添加图像压缩和优化
- [ ] 支持批量图像处理

**Day 12-14: 文档格式支持**
- [ ] 实现 Markdown 格式导出
- [ ] 支持结构化数据导出 (JSON/XML)
- [ ] 实现 HTML 格式导出
- [ ] 集成 Pandoc 进行格式转换
- [ ] 支持富文本和表格导出
- [ ] 实现文档压缩和打包

**Week 2 验收标准**:
- ✅ 支持 5+ 种主要导出格式
- ✅ 渲染质量达到生产级别要求
- ✅ 处理性能满足实时导出需求
- ✅ 支持大型画布的高效处理

### Phase 2: 核心功能实现 (Week 3-4)

#### Week 3: 模板系统和样式引擎
**目标**: 实现强大的模板系统和样式定制能力

**Day 15-16: 模板引擎架构**
- [ ] 设计模板系统架构和接口
- [ ] 实现模板解析和渲染引擎
- [ ] 建立模板版本管理机制
- [ ] 实现模板继承和组合功能
- [ ] 建立模板验证和错误处理
- [ ] 支持动态模板变量替换

**Day 17-18: 预设模板开发**
- [ ] 开发商业报告模板
- [ ] 创建学术论文模板
- [ ] 设计思维导图模板
- [ ] 实现项目汇报模板
- [ ] 建立产品需求模板
- [ ] 创建通用文档模板

**Day 19-21: 样式系统和定制**
- [ ] 实现 CSS-in-JS 样式系统
- [ ] 支持主题色彩和字体配置
- [ ] 实现响应式布局支持
- [ ] 建立组件级样式定制
- [ ] 支持品牌元素和LOGO集成
- [ ] 实现样式预览和实时编辑

**Week 3 验收标准**:
- ✅ 模板系统功能完整可用
- ✅ 提供 6+ 种高质量预设模板
- ✅ 样式定制功能灵活强大
- ✅ 模板渲染性能优异

#### Week 4: 分享和发布功能
**目标**: 实现完整的分享链接和第三方平台发布功能

**Day 22-23: 分享链接系统**
- [ ] 实现安全的分享链接生成
- [ ] 支持访问权限控制和密码保护
- [ ] 建立分享页面渲染系统
- [ ] 实现访问统计和分析功能
- [ ] 支持链接有效期和访问次数限制
- [ ] 建立分享链接管理界面

**Day 24-25: 第三方平台集成**
- [ ] 集成主要博客平台 API (WordPress, Medium)
- [ ] 支持文档平台发布 (Notion, 飞书)
- [ ] 实现社交媒体分享功能
- [ ] 集成云存储平台 (Google Drive, OneDrive)
- [ ] 建立平台认证和授权机制
- [ ] 实现发布状态监控和回调

**Day 26-28: 批量处理和优化**
- [ ] 实现批量导出任务调度
- [ ] 支持队列管理和优先级控制
- [ ] 建立异步任务状态跟踪
- [ ] 实现导出进度实时推送
- [ ] 优化大文件处理性能
- [ ] 建立错误恢复和重试机制

**Week 4 验收标准**:
- ✅ 分享功能完整可用，安全可靠
- ✅ 支持 5+ 个主要第三方平台
- ✅ 批量处理性能满足需求
- ✅ 系统稳定性达到生产级别

### Phase 3: 高级功能和优化 (Week 5-6)

#### Week 5: 智能功能和数据分析
**目标**: 集成 AI 能力和完善数据分析功能

**Day 29-30: AI智能功能**
- [ ] 集成 @sker/engine 进行智能排版
- [ ] 实现内容摘要和关键信息提取
- [ ] 支持智能模板推荐
- [ ] 建立内容质量评估机制
- [ ] 实现智能标签和分类
- [ ] 支持多语言内容识别和处理

**Day 31-32: 数据分析系统**
- [ ] 实现导出使用统计分析
- [ ] 建立用户行为分析
- [ ] 支持内容热度和趋势分析
- [ ] 实现性能监控和指标收集
- [ ] 建立数据可视化界面
- [ ] 支持自定义报表生成

**Day 33-35: 性能优化和缓存**
- [ ] 实现智能缓存策略
- [ ] 优化并发处理能力
- [ ] 建立CDN集成和加速
- [ ] 实现增量更新和差异对比
- [ ] 优化内存使用和垃圾回收
- [ ] 建立性能基准测试

**Week 5 验收标准**:
- ✅ AI功能显著提升用户体验
- ✅ 数据分析功能完整可用
- ✅ 系统性能达到生产级别要求
- ✅ 缓存策略有效提升响应速度

#### Week 6: 用户体验和生产准备
**目标**: 完善用户体验和准备生产环境部署

**Day 36-37: 用户界面优化**
- [ ] 实现响应式界面设计
- [ ] 建立直观的操作流程
- [ ] 支持拖拽和快捷操作
- [ ] 实现实时预览功能
- [ ] 建立友好的错误提示
- [ ] 支持键盘快捷键

**Day 38-39: 移动端适配**
- [ ] 实现移动端界面适配
- [ ] 支持触摸操作优化
- [ ] 建立移动端专用功能
- [ ] 实现离线缓存和同步
- [ ] 支持移动端分享集成
- [ ] 优化移动端性能

**Day 40-42: 生产环境准备**
- [ ] 配置生产环境部署脚本
- [ ] 建立监控和告警系统
- [ ] 实现日志收集和分析
- [ ] 配置自动备份和恢复
- [ ] 建立安全防护措施
- [ ] 完善文档和运维手册

**Week 6 验收标准**:
- ✅ 用户体验达到产品级别要求
- ✅ 移动端功能完整可用
- ✅ 生产环境配置完善
- ✅ 系统安全性和可靠性达标

## 📊 技术实现方案

### 导出引擎架构

#### 核心导出流程
```typescript
interface ExportPipeline {
  // 1. 数据收集
  dataCollector: DataCollector;
  // 2. 内容转换
  contentTransformer: ContentTransformer;
  // 3. 模板应用
  templateEngine: TemplateEngine;
  // 4. 格式渲染
  formatRenderer: FormatRenderer;
  // 5. 文件优化
  fileOptimizer: FileOptimizer;
  // 6. 存储上传
  storageUploader: StorageUploader;
}

class ExportService {
  async exportProject(params: ExportParams): Promise<ExportResult> {
    // 1. 验证和预处理
    const validatedParams = await this.validateParams(params);

    // 2. 创建导出任务
    const task = await this.createExportTask(validatedParams);

    // 3. 数据收集
    const projectData = await this.dataCollector.collect(params.projectId);

    // 4. 内容转换
    const transformedContent = await this.contentTransformer.transform(
      projectData,
      params.scope,
      params.filters
    );

    // 5. 模板应用
    const styledContent = await this.templateEngine.render(
      transformedContent,
      params.templateId,
      params.styleOptions
    );

    // 6. 格式渲染
    const renderedFile = await this.formatRenderer.render(
      styledContent,
      params.format,
      params.formatOptions
    );

    // 7. 文件优化
    const optimizedFile = await this.fileOptimizer.optimize(
      renderedFile,
      params.optimizationOptions
    );

    // 8. 存储上传
    const uploadResult = await this.storageUploader.upload(optimizedFile);

    // 9. 更新任务状态
    await this.updateTaskStatus(task.id, 'completed', uploadResult);

    return {
      taskId: task.id,
      downloadUrl: uploadResult.url,
      fileSize: uploadResult.size,
      processingTime: Date.now() - task.createdAt
    };
  }
}
```

#### PDF渲染实现
```typescript
class PDFRenderer implements FormatRenderer {
  private puppeteer: Browser;

  async render(content: StyledContent, options: PDFOptions): Promise<Buffer> {
    const page = await this.puppeteer.newPage();

    try {
      // 1. 设置页面配置
      await page.setViewport({
        width: options.width || 1200,
        height: options.height || 1600,
        deviceScaleFactor: options.scale || 2
      });

      // 2. 注入样式和内容
      const html = await this.buildHTML(content, options);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // 3. 等待动态内容加载
      await page.waitForSelector('.export-ready', { timeout: 30000 });

      // 4. 生成PDF
      const pdf = await page.pdf({
        format: options.pageFormat || 'A4',
        printBackground: true,
        margin: options.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: options.showHeaderFooter,
        headerTemplate: options.headerTemplate,
        footerTemplate: options.footerTemplate
      });

      return pdf;
    } finally {
      await page.close();
    }
  }

  private async buildHTML(content: StyledContent, options: PDFOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${content.title}</title>
          ${this.generateStyles(content.styles, options)}
        </head>
        <body>
          ${this.generateBody(content.components)}
          <script>
            // 标记页面渲染完成
            document.body.classList.add('export-ready');
          </script>
        </body>
      </html>
    `;
  }
}
```

#### 图像渲染实现
```typescript
class ImageRenderer implements FormatRenderer {
  private sharp: Sharp;

  async render(content: StyledContent, options: ImageOptions): Promise<Buffer> {
    const canvas = createCanvas(options.width, options.height);
    const ctx = canvas.getContext('2d');

    // 1. 设置背景
    this.renderBackground(ctx, content.background, options);

    // 2. 渲染组件
    for (const component of content.components) {
      await this.renderComponent(ctx, component, options);
    }

    // 3. 添加水印(如需要)
    if (options.watermark) {
      this.renderWatermark(ctx, options.watermark, options);
    }

    // 4. 转换为目标格式
    const buffer = canvas.toBuffer(options.format === 'png' ? 'image/png' : 'image/jpeg');

    // 5. 使用Sharp进行优化
    return await sharp(buffer)
      .resize(options.width, options.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: options.quality || 90 })
      .toBuffer();
  }

  private async renderComponent(
    ctx: CanvasRenderingContext2D,
    component: ContentComponent,
    options: ImageOptions
  ): Promise<void> {
    // 根据组件类型进行不同的渲染
    switch (component.type) {
      case 'node':
        await this.renderNode(ctx, component, options);
        break;
      case 'connection':
        await this.renderConnection(ctx, component, options);
        break;
      case 'text':
        await this.renderText(ctx, component, options);
        break;
      default:
        console.warn(`Unknown component type: ${component.type}`);
    }
  }
}
```

### 模板系统设计

#### 模板配置结构
```typescript
interface TemplateConfig {
  metadata: {
    name: string;
    version: string;
    author: string;
    description: string;
    category: TemplateCategory;
  };

  layout: {
    pageSize: PageSize;
    orientation: 'portrait' | 'landscape';
    margins: Margins;
    columns: number;
    spacing: Spacing;
  };

  styles: {
    theme: ThemeConfig;
    typography: TypographyConfig;
    colors: ColorPalette;
    components: ComponentStyles;
  };

  sections: {
    header?: SectionConfig;
    body: SectionConfig;
    footer?: SectionConfig;
    sidebar?: SectionConfig;
  };

  variables: Record<string, VariableDefinition>;
  hooks: TemplateHooks;
}

interface ComponentStyles {
  node: {
    default: NodeStyle;
    byImportance: Record<number, Partial<NodeStyle>>;
    byType: Record<string, Partial<NodeStyle>>;
  };
  connection: ConnectionStyle;
  container: ContainerStyle;
  text: TextStyle;
}

class TemplateEngine {
  async renderWithTemplate(
    content: ProjectContent,
    template: TemplateConfig,
    variables: Record<string, any> = {}
  ): Promise<StyledContent> {
    // 1. 变量替换
    const resolvedTemplate = this.resolveVariables(template, variables);

    // 2. 执行前置钩子
    await this.executeHooks(resolvedTemplate.hooks.beforeRender, { content, template });

    // 3. 应用布局
    const layout = this.applyLayout(content, resolvedTemplate.layout);

    // 4. 应用样式
    const styledComponents = this.applyStyles(layout.components, resolvedTemplate.styles);

    // 5. 构建最终结构
    const result = {
      title: content.title,
      layout: layout,
      components: styledComponents,
      styles: this.generateGlobalStyles(resolvedTemplate.styles),
      metadata: resolvedTemplate.metadata
    };

    // 6. 执行后置钩子
    await this.executeHooks(resolvedTemplate.hooks.afterRender, { result, template });

    return result;
  }

  private applyStyles(
    components: ContentComponent[],
    styles: ComponentStyles
  ): StyledComponent[] {
    return components.map(component => {
      let componentStyle = styles[component.type]?.default || {};

      // 按重要性应用样式
      if (component.importance && styles[component.type]?.byImportance) {
        componentStyle = {
          ...componentStyle,
          ...styles[component.type].byImportance[component.importance]
        };
      }

      // 按语义类型应用样式
      if (component.semanticType && styles[component.type]?.byType) {
        componentStyle = {
          ...componentStyle,
          ...styles[component.type].byType[component.semanticType]
        };
      }

      return {
        ...component,
        style: componentStyle
      };
    });
  }
}
```

### 分享系统架构

#### 分享链接生成
```typescript
class ShareService {
  async createShareLink(params: CreateShareParams): Promise<ShareLink> {
    // 1. 生成安全的分享token
    const shareToken = this.generateSecureToken();

    // 2. 创建分享记录
    const shareLink = await this.storeService.shareLinks.create({
      projectId: params.projectId,
      userId: params.userId,
      shareToken,
      title: params.title,
      description: params.description,
      accessType: params.accessType,
      permissions: params.permissions,
      expiresAt: params.expiresAt,
      maxViews: params.maxViews
    });

    // 3. 如果需要密码保护，加密存储
    if (params.accessPassword) {
      const hashedPassword = await bcrypt.hash(params.accessPassword, 12);
      await this.storeService.shareLinks.update(shareLink.id, {
        accessPassword: hashedPassword
      });
    }

    // 4. 生成分享URL
    const shareUrl = `${this.config.baseUrl}/share/${shareToken}`;

    return {
      ...shareLink,
      shareUrl
    };
  }

  async accessShareLink(token: string, options: AccessOptions = {}): Promise<ShareContent> {
    // 1. 验证分享链接
    const shareLink = await this.validateShareLink(token, options);

    // 2. 检查访问权限
    await this.checkAccessPermissions(shareLink, options);

    // 3. 更新访问统计
    await this.updateAccessStats(shareLink.id);

    // 4. 获取项目内容
    const projectContent = await this.getProjectContent(shareLink.projectId);

    // 5. 根据权限过滤内容
    const filteredContent = this.filterContentByPermissions(
      projectContent,
      shareLink.permissions
    );

    return {
      content: filteredContent,
      shareInfo: {
        title: shareLink.title,
        description: shareLink.description,
        permissions: shareLink.permissions
      }
    };
  }

  private async validateShareLink(token: string, options: AccessOptions): Promise<ShareLink> {
    const shareLink = await this.storeService.shareLinks.findByToken(token);

    if (!shareLink) {
      throw new Error('分享链接不存在');
    }

    // 检查是否过期
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      throw new Error('分享链接已过期');
    }

    // 检查访问次数限制
    if (shareLink.maxViews && shareLink.currentViews >= shareLink.maxViews) {
      throw new Error('分享链接访问次数已达上限');
    }

    // 检查密码保护
    if (shareLink.accessType === 'password') {
      if (!options.password) {
        throw new Error('需要访问密码');
      }

      const isValidPassword = await bcrypt.compare(
        options.password,
        shareLink.accessPassword
      );

      if (!isValidPassword) {
        throw new Error('访问密码错误');
      }
    }

    return shareLink;
  }
}
```

## 👥 团队分工和时间安排

### 团队配置
```yaml
团队规模: 3-4人
开发周期: 6周 (240工时)

角色分工:
  后端架构师 (1人):
    - 系统架构设计和实现
    - 核心服务开发
    - 数据库设计和优化
    - 性能调优和部署
    工时占比: 40% (96工时)

  前端工程师 (1人):
    - 用户界面设计和开发
    - 模板编辑器实现
    - 移动端适配
    - 用户体验优化
    工时占比: 30% (72工时)

  全栈工程师 (1人):
    - 渲染引擎集成
    - 第三方平台集成
    - 测试和质量保证
    - 文档和运维
    工时占比: 25% (60工时)

  产品经理 (0.5人):
    - 需求分析和产品设计
    - 用户体验测试
    - 项目协调和管理
    工时占比: 5% (12工时)
```

### 详细时间安排

#### Week 1-2: 基础架构 (后端架构师主导)
```yaml
Day 1-7: 项目初始化和核心框架
  - 后端架构师: 系统设计、框架搭建 (5天)
  - 全栈工程师: 环境配置、工具链设置 (2天)
  - 前端工程师: 界面原型设计 (3天)

Day 8-14: 渲染引擎和存储
  - 后端架构师: 数据模型、存储服务 (4天)
  - 全栈工程师: 渲染引擎集成 (6天)
  - 前端工程师: 基础组件开发 (4天)
```

#### Week 3-4: 核心功能 (全员协作)
```yaml
Day 15-21: 模板系统
  - 前端工程师: 模板编辑器界面 (5天)
  - 后端架构师: 模板引擎实现 (4天)
  - 全栈工程师: 预设模板开发 (4天)

Day 22-28: 分享和发布
  - 后端架构师: 分享链接系统 (4天)
  - 全栈工程师: 第三方平台集成 (5天)
  - 前端工程师: 分享界面开发 (3天)
```

#### Week 5-6: 高级功能和优化 (全员协作)
```yaml
Day 29-35: 智能功能和数据分析
  - 后端架构师: AI集成、数据分析 (5天)
  - 全栈工程师: 性能优化、缓存 (4天)
  - 前端工程师: 统计界面、用户体验 (4天)

Day 36-42: 生产准备
  - 后端架构师: 生产环境、监控 (4天)
  - 全栈工程师: 测试、文档 (5天)
  - 前端工程师: 移动端、最终优化 (4天)
```

### 关键里程碑

#### Milestone 1: 基础架构完成 (Week 2末)
- **交付物**:
  - 完整的服务架构和API设计
  - 基础的PDF/图像导出功能
  - 与核心系统的集成
- **验收标准**:
  - 能导出基本的PDF和图像格式
  - API响应时间 < 3秒
  - 系统稳定运行无重大bug

#### Milestone 2: 核心功能完成 (Week 4末)
- **交付物**:
  - 完整的模板系统
  - 分享链接功能
  - 基础的第三方平台发布
- **验收标准**:
  - 支持5+种导出格式
  - 提供6+种预设模板
  - 分享功能完整可用

#### Milestone 3: 产品发布就绪 (Week 6末)
- **交付物**:
  - 完整的产品功能
  - 生产环境部署
  - 用户文档和运维手册
- **验收标准**:
  - 所有功能测试通过
  - 性能指标达到要求
  - 生产环境稳定运行

## 🎯 风险评估和应对策略

### 技术风险

#### 高风险项
1. **渲染引擎性能**
   - 风险: 大型画布渲染性能不佳
   - 影响: 用户体验下降，系统负载过高
   - 应对: 分块渲染、增量更新、预渲染缓存

2. **文件存储成本**
   - 风险: 大量文件存储成本激增
   - 影响: 运营成本过高
   - 应对: 智能压缩、过期清理、CDN优化

#### 中等风险项
1. **第三方平台集成**
   - 风险: 第三方API变更或限制
   - 影响: 发布功能受限
   - 应对: 多平台支持、优雅降级、错误处理

2. **并发处理能力**
   - 风险: 高并发时系统性能下降
   - 影响: 用户等待时间过长
   - 应对: 队列管理、负载均衡、水平扩展

### 项目风险

#### 时间风险
- **风险**: 功能复杂度超出预期
- **应对**: 分阶段交付、核心功能优先、备选方案

#### 资源风险
- **风险**: 关键人员不可用
- **应对**: 知识共享、文档完善、交叉培训

#### 质量风险
- **风险**: 测试不充分导致线上问题
- **应对**: 自动化测试、灰度发布、快速回滚

## 📊 性能指标和监控

### 性能目标
```yaml
响应性能:
  - PDF导出: < 10秒 (标准画布)
  - 图像导出: < 5秒 (高清模式)
  - 模板渲染: < 2秒
  - 分享链接访问: < 1秒

吞吐量:
  - 并发导出任务: 50+ (单实例)
  - 每日导出量: 10,000+ 次
  - 存储容量: 1TB+ (可扩展)

可用性:
  - 系统可用性: 99.5%+
  - 错误率: < 1%
  - 数据丢失率: 0%
```

### 监控指标
```yaml
业务指标:
  - 导出成功率
  - 格式分布统计
  - 用户活跃度
  - 模板使用情况

技术指标:
  - API响应时间
  - 渲染性能
  - 存储使用率
  - 缓存命中率

资源指标:
  - CPU使用率
  - 内存使用率
  - 磁盘I/O
  - 网络带宽
```

## 🚀 部署和运维

### 部署架构
```yaml
生产环境:
  - 负载均衡器: Nginx + SSL
  - 应用服务器: Node.js 集群 (3实例)
  - 数据库: PostgreSQL 主从
  - 缓存: Redis 集群
  - 文件存储: AWS S3 + CloudFront
  - 消息队列: RabbitMQ 集群

开发环境:
  - Docker Compose 一键部署
  - 热重载开发服务器
  - 本地数据库和缓存
```

### 监控告警
```yaml
告警规则:
  - API响应时间 > 5秒
  - 错误率 > 2%
  - CPU使用率 > 80%
  - 磁盘使用率 > 85%
  - 队列积压 > 100

监控工具:
  - 应用监控: Prometheus + Grafana
  - 日志聚合: ELK Stack
  - 错误追踪: Sentry
  - 性能分析: APM工具
```

这个开发计划为 @sker/publisher 应用提供了完整的技术路线图，从基础架构到高级功能，确保项目能够按时、按质交付，并为后续的扩展和优化奠定坚实基础。