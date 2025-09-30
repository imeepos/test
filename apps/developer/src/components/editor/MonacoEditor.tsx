import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Spin } from 'antd'
import * as monaco from 'monaco-editor'

/**
 * Monaco Editor 配置选项
 */
export interface MonacoEditorProps {
  /** 编辑器语言 */
  language: string
  /** 编辑器内容 */
  value: string
  /** 内容变化回调 */
  onChange?: (value: string) => void
  /** 编辑器主题 */
  theme?: 'vs' | 'vs-dark' | 'hc-black'
  /** 编辑器选项 */
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  /** 编辑器高度 */
  height?: number | string
  /** 编辑器宽度 */
  width?: number | string
  /** 是否只读 */
  readOnly?: boolean
  /** 是否显示小地图 */
  minimap?: boolean
  /** 是否自动格式化 */
  formatOnPaste?: boolean
  /** 是否自动保存 */
  autoSave?: boolean
  /** 自动保存延迟（毫秒） */
  autoSaveDelay?: number
  /** 加载完成回调 */
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void
  /** 获取焦点回调 */
  onFocus?: () => void
  /** 失去焦点回调 */
  onBlur?: () => void
}

/**
 * Monaco Editor 组件
 * 集成VS Code编辑器内核，支持语法高亮、代码补全、错误检查等功能
 */
export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  language,
  value,
  onChange,
  theme = 'vs',
  options = {},
  height = '400px',
  width = '100%',
  readOnly = false,
  minimap = true,
  formatOnPaste = true,
  autoSave = false,
  autoSaveDelay = 1000,
  onMount,
  onFocus,
  onBlur
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  /**
   * 初始化Monaco Editor
   */
  const initializeEditor = useCallback(async () => {
    if (!editorRef.current) return

    try {
      setLoading(true)
      setError(null)

      // 配置Monaco Editor
      await configureMonaco()

      // 创建编辑器实例
      const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        value,
        language,
        theme,
        readOnly,
        minimap: { enabled: minimap },
        formatOnPaste,
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        cursorStyle: 'line',
        cursorBlinking: 'blink',
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        unfoldOnClickAfterEndOfLine: false,
        contextmenu: true,
        mouseWheelZoom: true,
        multiCursorModifier: 'ctrlCmd',
        accessibilitySupport: 'auto',
        ...options
      }

      const editor = monaco.editor.create(editorRef.current, editorOptions)
      editorInstanceRef.current = editor

      // 设置编辑器事件监听
      setupEditorListeners(editor)

      // 调用挂载回调
      onMount?.(editor)

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize editor')
      setLoading(false)
    }
  }, [
    value,
    language,
    theme,
    readOnly,
    minimap,
    formatOnPaste,
    options,
    onMount
  ])

  /**
   * 配置Monaco环境
   */
  const configureMonaco = async (): Promise<void> => {
    // 设置TypeScript编译选项
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    })

    // 设置JavaScript诊断选项
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })

    // 添加SKER插件SDK类型定义
    await addSKERTypes()
  }

  /**
   * 添加SKER插件SDK类型定义
   */
  const addSKERTypes = async (): Promise<void> => {
    const skerTypes = `
declare module '@sker/plugin-sdk' {
  export interface PluginContext {
    canvas: CanvasAPI;
    components: ComponentAPI;
    ai: AIServiceAPI;
    storage: StorageAPI;
    ui: UIHelperAPI;
    events: EventSystemAPI;
    log: (level: string, message: string, data?: any) => void;
    getConfig: (key: string, defaultValue?: any) => Promise<any>;
    setConfig: (key: string, value: any) => Promise<void>;
    destroy: () => void;
  }

  export interface PluginLifecycle {
    onInstall(): Promise<void>;
    onActivate(context: PluginContext): Promise<void>;
    onDeactivate(): Promise<void>;
    onUninstall(): Promise<void>;
  }

  export class BasePlugin implements PluginLifecycle {
    onInstall(): Promise<void>;
    onActivate(context: PluginContext): Promise<void>;
    onDeactivate(): Promise<void>;
    onUninstall(): Promise<void>;
  }

  export function Plugin(metadata: any): ClassDecorator;
}
`

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      skerTypes,
      'file:///node_modules/@sker/plugin-sdk/index.d.ts'
    )
  }

  /**
   * 设置编辑器事件监听
   */
  const setupEditorListeners = (editor: monaco.editor.IStandaloneCodeEditor): void => {
    // 内容变化监听
    editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue()
      onChange?.(currentValue)

      // 自动保存
      if (autoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          // 触发自动保存逻辑
          console.log('Auto save triggered')
        }, autoSaveDelay)
      }
    })

    // 焦点事件
    editor.onDidFocusEditorText(() => {
      onFocus?.()
    })

    editor.onDidBlurEditorText(() => {
      onBlur?.()
    })

    // 键盘快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Ctrl+S / Cmd+S 保存
      console.log('Save triggered')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      // Ctrl+F / Cmd+F 查找
      editor.trigger('keyboard', 'actions.find', {})
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      // Ctrl+Shift+F / Cmd+Shift+F 格式化代码
      editor.trigger('keyboard', 'editor.action.formatDocument', {})
    })
  }

  /**
   * 更新编辑器内容
   */
  const updateValue = useCallback((newValue: string) => {
    if (editorInstanceRef.current && newValue !== editorInstanceRef.current.getValue()) {
      editorInstanceRef.current.setValue(newValue)
    }
  }, [])

  /**
   * 更新编辑器语言
   */
  const updateLanguage = useCallback((newLanguage: string) => {
    if (editorInstanceRef.current) {
      const model = editorInstanceRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage)
      }
    }
  }, [])

  /**
   * 更新编辑器主题
   */
  const updateTheme = useCallback((newTheme: string) => {
    monaco.editor.setTheme(newTheme)
  }, [])

  // 初始化编辑器
  useEffect(() => {
    initializeEditor()

    return () => {
      // 清理编辑器实例
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose()
        editorInstanceRef.current = null
      }

      // 清理自动保存定时器
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [initializeEditor])

  // 更新值
  useEffect(() => {
    updateValue(value)
  }, [value, updateValue])

  // 更新语言
  useEffect(() => {
    updateLanguage(language)
  }, [language, updateLanguage])

  // 更新主题
  useEffect(() => {
    updateTheme(theme)
  }, [theme, updateTheme])

  /**
   * 获取编辑器实例（暴露给外部使用）
   */
  const getEditor = useCallback((): monaco.editor.IStandaloneCodeEditor | null => {
    return editorInstanceRef.current
  }, [])


  // 将方法暴露给父组件使用
  React.useImperativeHandle(onMount, () => getEditor() as any, [getEditor])

  if (error) {
    return (
      <div
        style={{
          height,
          width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          color: '#ff4d4f'
        }}
      >
        编辑器加载失败: {error}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height, width }}>
      <div
        ref={editorRef}
        style={{
          height: '100%',
          width: '100%',
          border: '1px solid #d9d9d9',
          borderRadius: '6px'
        }}
      />
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000
          }}
        >
          <Spin size="large" tip="加载编辑器..." />
        </div>
      )}
    </div>
  )
}

export default MonacoEditor