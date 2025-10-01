/**
 * Mock 数据
 * 用于开发测试
 */
import type { Project, Plugin, User } from '@/types'

// Mock 用户数据
export const mockUser: User = {
  id: 'user-1',
  username: 'developer',
  email: 'developer@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer',
  role: 'developer',
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: new Date().toISOString(),
  profile: {
    displayName: '开发者',
    bio: '全栈开发者，热爱编程',
    website: 'https://example.com',
    location: '中国',
    skills: ['TypeScript', 'React', 'Node.js', 'Docker'],
    github: 'developer',
    twitter: 'developer',
  },
}

// Mock 项目数据
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'AI Canvas Helper',
    description: '智能画布助手，提供AI驱动的设计建议',
    type: 'ai-processor',
    status: 'development',
    template: {
      id: 'ai-processor-template',
      name: 'AI处理器模板',
      description: '',
      category: 'ai-processor',
      files: [],
      dependencies: {},
    },
    ownerId: 'user-1',
    collaborators: [],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    config: {
      entry: 'src/index.ts',
      output: 'dist',
      dependencies: {
        '@sker/plugin-sdk': '^1.0.0',
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/node': '^18.0.0',
      },
      buildSettings: {
        target: 'es2020',
        format: 'esm',
        minify: false,
        sourcemap: true,
        externals: [],
      },
      debugSettings: {
        enabled: true,
        port: 3000,
        autoOpen: false,
        hot: true,
      },
    },
    stats: {
      linesOfCode: 2340,
      files: 15,
      dependencies: 8,
      buildTime: 1200,
      bundleSize: 156000,
      lastBuild: new Date().toISOString(),
    },
  },
  {
    id: 'project-2',
    name: 'Export to PDF',
    description: '将画布内容导出为PDF文件',
    type: 'exporter',
    status: 'published',
    template: {
      id: 'exporter-template',
      name: '导出器模板',
      description: '',
      category: 'exporter',
      files: [],
      dependencies: {},
    },
    ownerId: 'user-1',
    collaborators: ['user-2'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-19T16:00:00Z',
    config: {
      entry: 'src/index.ts',
      output: 'dist',
      dependencies: {
        '@sker/plugin-sdk': '^1.0.0',
        'jspdf': '^2.5.1',
      },
      devDependencies: {
        'typescript': '^5.0.0',
      },
      buildSettings: {
        target: 'es2020',
        format: 'esm',
        minify: true,
        sourcemap: false,
        externals: [],
      },
      debugSettings: {
        enabled: false,
        port: 3001,
        autoOpen: false,
        hot: false,
      },
    },
    stats: {
      linesOfCode: 1850,
      files: 12,
      dependencies: 5,
      buildTime: 800,
      bundleSize: 89000,
      lastBuild: '2024-01-19T16:00:00Z',
    },
  },
  {
    id: 'project-3',
    name: 'Theme Manager',
    description: '自定义主题管理器',
    type: 'theme',
    status: 'testing',
    template: {
      id: 'theme-template',
      name: '主题模板',
      description: '',
      category: 'theme',
      files: [],
      dependencies: {},
    },
    ownerId: 'user-1',
    collaborators: [],
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z',
    config: {
      entry: 'src/index.ts',
      output: 'dist',
      dependencies: {
        '@sker/plugin-sdk': '^1.0.0',
      },
      devDependencies: {
        'typescript': '^5.0.0',
      },
      buildSettings: {
        target: 'es2020',
        format: 'esm',
        minify: false,
        sourcemap: true,
        externals: [],
      },
      debugSettings: {
        enabled: true,
        port: 3002,
        autoOpen: false,
        hot: true,
      },
    },
    stats: {
      linesOfCode: 980,
      files: 8,
      dependencies: 3,
      buildTime: 500,
      bundleSize: 45000,
      lastBuild: '2024-01-20T11:00:00Z',
    },
  },
]

// Mock 插件数据
export const mockPlugins: Plugin[] = [
  {
    id: 'plugin-1',
    name: 'AI Canvas Helper',
    version: '1.2.0',
    description: '智能画布助手，提供AI驱动的设计建议和自动布局功能',
    author: mockUser,
    category: 'ai-processor',
    tags: ['AI', '智能助手', '布局'],
    downloads: 15420,
    rating: 4.8,
    reviews: 256,
    price: 0,
    status: 'approved',
    repository: 'https://github.com/example/ai-canvas-helper',
    homepage: 'https://example.com/plugins/ai-canvas-helper',
    changelog: [
      {
        version: '1.2.0',
        changes: '添加自动布局功能\n修复若干 bug',
        publishedAt: '2024-01-20T08:00:00Z',
        downloadUrl: 'https://example.com/downloads/ai-canvas-helper-1.2.0.zip',
        checksum: 'abc123',
      },
    ],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-20T08:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'plugin-2',
    name: 'PDF Export Pro',
    version: '2.1.3',
    description: '专业的PDF导出工具，支持高质量矢量导出和批量处理',
    author: {
      ...mockUser,
      id: 'user-2',
      username: 'exportmaster',
      profile: {
        ...mockUser.profile,
        displayName: '导出大师',
      },
    },
    category: 'exporter',
    tags: ['PDF', '导出', '矢量'],
    downloads: 8932,
    rating: 4.6,
    reviews: 189,
    price: 29.99,
    status: 'approved',
    repository: 'https://github.com/example/pdf-export-pro',
    homepage: 'https://example.com/plugins/pdf-export-pro',
    changelog: [
      {
        version: '2.1.3',
        changes: '优化导出性能\n支持更多字体',
        publishedAt: '2024-01-18T10:00:00Z',
        downloadUrl: 'https://example.com/downloads/pdf-export-pro-2.1.3.zip',
        checksum: 'def456',
      },
    ],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z',
    publishedAt: '2024-01-10T12:00:00Z',
  },
  {
    id: 'plugin-3',
    name: 'Dark Theme Pack',
    version: '1.0.5',
    description: '精美的暗色主题包，包含多种风格和配色方案',
    author: {
      ...mockUser,
      id: 'user-3',
      username: 'themecrafter',
      profile: {
        ...mockUser.profile,
        displayName: '主题工匠',
      },
    },
    category: 'theme',
    tags: ['主题', '暗色', '美化'],
    downloads: 12567,
    rating: 4.9,
    reviews: 342,
    price: 9.99,
    status: 'approved',
    repository: 'https://github.com/example/dark-theme-pack',
    homepage: 'https://example.com/plugins/dark-theme-pack',
    changelog: [
      {
        version: '1.0.5',
        changes: '新增 3 种主题\n修复兼容性问题',
        publishedAt: '2024-01-16T14:00:00Z',
        downloadUrl: 'https://example.com/downloads/dark-theme-pack-1.0.5.zip',
        checksum: 'ghi789',
      },
    ],
    createdAt: '2024-01-05T09:00:00Z',
    updatedAt: '2024-01-16T14:00:00Z',
    publishedAt: '2024-01-05T11:00:00Z',
  },
]

// Mock 项目文件
export const mockProjectFiles = {
  'project-1': [
    {
      path: 'src/index.ts',
      content: `// SKER Plugin Entry Point
import { PluginContext, PluginLifecycle } from '@sker/plugin-sdk'

export default class MyPlugin implements PluginLifecycle {
  private context?: PluginContext

  async onInstall(): Promise<void> {
    console.log('Plugin installed')
  }

  async onActivate(context: PluginContext): Promise<void> {
    this.context = context
    console.log('Plugin activated')

    // 注册事件监听器
    context.events.on('canvas.nodeCreated', this.handleNodeCreated)
  }

  async onDeactivate(): Promise<void> {
    if (this.context) {
      this.context.events.off('canvas.nodeCreated', this.handleNodeCreated)
    }
    console.log('Plugin deactivated')
  }

  async onUninstall(): Promise<void> {
    console.log('Plugin uninstalled')
  }

  private handleNodeCreated = (node: any) => {
    console.log('New node created:', node)
  }
}`,
      type: 'typescript' as const,
      size: 800,
      lastModified: new Date().toISOString(),
    },
    {
      path: 'package.json',
      content: `{
  "name": "ai-canvas-helper",
  "version": "1.2.0",
  "description": "AI Canvas Helper Plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "dependencies": {
    "@sker/plugin-sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0"
  }
}`,
      type: 'json' as const,
      size: 400,
      lastModified: new Date().toISOString(),
    },
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
      type: 'json' as const,
      size: 350,
      lastModified: new Date().toISOString(),
    },
    {
      path: 'README.md',
      content: `# AI Canvas Helper

智能画布助手插件

## 功能

- AI 驱动的设计建议
- 自动布局优化
- 智能组件推荐

## 使用方法

\`\`\`typescript
import AICanvasHelper from 'ai-canvas-helper'

const helper = new AICanvasHelper()
await helper.activate(context)
\`\`\`

## License

MIT
`,
      type: 'markdown' as const,
      size: 250,
      lastModified: new Date().toISOString(),
    },
  ],
}
