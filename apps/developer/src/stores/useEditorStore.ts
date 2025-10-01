/**
 * 编辑器状态管理
 * 管理 IDE 编辑器的文件和终端状态
 */
import { create } from 'zustand'
import type { ProjectFile } from '@/services'

interface EditorState {
  // 状态
  files: Record<string, ProjectFile> // 文件路径 -> 文件内容
  openFiles: string[] // 打开的文件路径列表
  activeFile: string | null // 当前活动文件路径
  terminal: {
    output: string[]
    isRunning: boolean
  }
  hasUnsavedChanges: boolean

  // Actions
  loadFiles: (files: ProjectFile[]) => void
  openFile: (path: string) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  saveFile: (path: string) => void
  createFile: (file: ProjectFile) => void
  deleteFile: (path: string) => void
  addTerminalOutput: (output: string) => void
  clearTerminal: () => void
  setTerminalRunning: (isRunning: boolean) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  files: {},
  openFiles: [],
  activeFile: null,
  terminal: {
    output: ['Welcome to SKER Plugin IDE', 'Type "help" for available commands', ''],
    isRunning: false,
  },
  hasUnsavedChanges: false,

  // 加载文件
  loadFiles: (files: ProjectFile[]) => {
    const filesMap: Record<string, ProjectFile> = {}
    files.forEach((file) => {
      filesMap[file.path] = file
    })
    set({ files: filesMap })
  },

  // 打开文件
  openFile: (path: string) => {
    set((state) => {
      if (!state.openFiles.includes(path)) {
        return {
          openFiles: [...state.openFiles, path],
          activeFile: path,
        }
      }
      return { activeFile: path }
    })
  },

  // 关闭文件
  closeFile: (path: string) => {
    set((state) => {
      const newOpenFiles = state.openFiles.filter((p) => p !== path)
      const newActiveFile =
        state.activeFile === path
          ? newOpenFiles.length > 0
            ? newOpenFiles[newOpenFiles.length - 1]
            : null
          : state.activeFile

      return {
        openFiles: newOpenFiles,
        activeFile: newActiveFile,
      }
    })
  },

  // 设置活动文件
  setActiveFile: (path: string) => {
    set({ activeFile: path })
  },

  // 更新文件内容
  updateFileContent: (path: string, content: string) => {
    set((state) => ({
      files: {
        ...state.files,
        [path]: {
          ...state.files[path],
          content,
        },
      },
      hasUnsavedChanges: true,
    }))
  },

  // 保存文件
  saveFile: (path: string) => {
    // 实际保存逻辑应该调用 API
    // 这里只是标记为已保存
    set({ hasUnsavedChanges: false })
    get().addTerminalOutput(`✓ Saved: ${path}`)
  },

  // 创建文件
  createFile: (file: ProjectFile) => {
    set((state) => ({
      files: {
        ...state.files,
        [file.path]: file,
      },
    }))
  },

  // 删除文件
  deleteFile: (path: string) => {
    set((state) => {
      const newFiles = { ...state.files }
      delete newFiles[path]
      return {
        files: newFiles,
        openFiles: state.openFiles.filter((p) => p !== path),
        activeFile: state.activeFile === path ? null : state.activeFile,
      }
    })
  },

  // 添加终端输出
  addTerminalOutput: (output: string) => {
    set((state) => ({
      terminal: {
        ...state.terminal,
        output: [...state.terminal.output, output],
      },
    }))
  },

  // 清空终端
  clearTerminal: () => {
    set((state) => ({
      terminal: {
        ...state.terminal,
        output: [],
      },
    }))
  },

  // 设置终端运行状态
  setTerminalRunning: (isRunning: boolean) => {
    set((state) => ({
      terminal: {
        ...state.terminal,
        isRunning,
      },
    }))
  },

  // 设置未保存更改标志
  setHasUnsavedChanges: (hasChanges: boolean) => {
    set({ hasUnsavedChanges: hasChanges })
  },
}))

export default useEditorStore
