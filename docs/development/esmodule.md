1. tsconfig.json 配置

  {
    "compilerOptions": {
      "module": "ESNext",           // 或 "ES2020", "ES2022"
      "target": "ES2020",          // 目标 JavaScript 版本
      "moduleResolution": "node",   // 或 "bundler"
      "esModuleInterop": true,     // 允许默认导入 CommonJS 模块
      "allowSyntheticDefaultImports": true,
      "strict": true,
      "declaration": true,         // 生成 .d.ts 文件
      "outDir": "./dist"
    }
  }

  2. package.json 配置

  {
    "type": "module",              // 声明为 ES module 项目
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
      ".": {
        "import": "./dist/index.js",
        "types": "./dist/index.d.ts"
      }
    }
  }

  3. 文件扩展名

  - .ts → .js (ES modules)
  - .mts → .mjs (强制 ES modules)
  - .cts → .cjs (强制 CommonJS)

  4. 导入语法

  // 命名导出/导入
  export const foo = 'bar';
  export type MyType = string;
  import { foo, type MyType } from './module.js';

  // 默认导出/导入
  export default class MyClass {}
  import MyClass from './MyClass.js';

  // 类型导入
  import type { SomeType } from './types.js';

  // 动态导入
  const module = await import('./module.js');

  5. 重要注意事项

  文件扩展名: 在 ES modules 中必须包含 .js 扩展名
  // ✅ 正确
  import { utils } from './utils.js';

  // ❌ 错误 (在 ES modules 中)
  import { utils } from './utils';

  Node.js 运行: 需要 Node.js 14+ 且配置正确的 type: "module"

  与 CommonJS 互操作:
  // 导入 CommonJS 模块
  import pkg from 'some-commonjs-package';
  const { someFunction } = pkg;

  这样配置后，TypeScript 就能完全支持现代 ES modules 语法和特性。
