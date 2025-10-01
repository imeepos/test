/**
 * 编辑器 Hook
 * 封装 IDE 编辑器相关的业务逻辑
 */
import { useCallback, useEffect } from 'react'
import { useEditorStore } from '@/stores'
import { ProjectService } from '@/services'
import { message } from 'antd'

export function useEditor(projectId?: string) {
  const {
    files,
    openFiles,
    activeFile,
    terminal,
    hasUnsavedChanges,
    loadFiles,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    saveFile,
    createFile,
    deleteFile,
    addTerminalOutput,
    clearTerminal,
    setTerminalRunning,
  } = useEditorStore()

  // 加载项目文件
  const loadProjectFiles = useCallback(async () => {
    if (!projectId) return

    try {
      const projectFiles = await ProjectService.getProjectFiles(projectId)
      loadFiles(projectFiles)
    } catch (error: any) {
      message.error('加载文件失败')
    }
  }, [projectId, loadFiles])

  // 自动加载文件
  useEffect(() => {
    if (projectId) {
      loadProjectFiles()
    }
  }, [projectId, loadProjectFiles])

  // 保存文件
  const handleSaveFile = useCallback(async (path: string) => {
    if (!projectId) return

    try {
      const file = files[path]
      if (file) {
        await ProjectService.saveFile(projectId, path, file.content)
        saveFile(path)
        message.success('文件保存成功')
      }
    } catch (error: any) {
      message.error('保存文件失败')
    }
  }, [projectId, files, saveFile])

  // 保存所有文件
  const handleSaveAllFiles = useCallback(async () => {
    for (const path of openFiles) {
      await handleSaveFile(path)
    }
  }, [openFiles, handleSaveFile])

  // 运行项目
  const handleRunProject = useCallback(async () => {
    if (!projectId) return

    setTerminalRunning(true)
    addTerminalOutput('> npm run dev')
    addTerminalOutput('Starting development server...')

    try {
      const result = await ProjectService.runProject(projectId)
      addTerminalOutput(`Build completed successfully!`)
      addTerminalOutput(`Server running at: ${result.url}`)
      addTerminalOutput('')
      message.success('项目运行成功')
    } catch (error: any) {
      addTerminalOutput('Error: Build failed')
      addTerminalOutput(error.response?.data?.message || error.message)
      addTerminalOutput('')
      message.error('运行项目失败')
    } finally {
      setTerminalRunning(false)
    }
  }, [projectId, setTerminalRunning, addTerminalOutput])

  // 构建项目
  const handleBuildProject = useCallback(async () => {
    if (!projectId) return

    setTerminalRunning(true)
    addTerminalOutput('> npm run build')
    addTerminalOutput('Building project...')

    try {
      const result = await ProjectService.buildProject(projectId)
      if (result.success) {
        addTerminalOutput('Build completed successfully!')
        addTerminalOutput(`Output: ${result.output}`)
        addTerminalOutput(`Duration: ${result.duration}ms`)
        addTerminalOutput(`Bundle size: ${result.bundleSize} bytes`)
        addTerminalOutput('')
        message.success('构建成功')
      } else {
        addTerminalOutput('Build failed with errors:')
        result.errors.forEach((error) => addTerminalOutput(`  ${error}`))
        addTerminalOutput('')
        message.error('构建失败')
      }
    } catch (error: any) {
      addTerminalOutput('Error: Build failed')
      addTerminalOutput(error.response?.data?.message || error.message)
      addTerminalOutput('')
      message.error('构建失败')
    } finally {
      setTerminalRunning(false)
    }
  }, [projectId, setTerminalRunning, addTerminalOutput])

  return {
    files,
    openFiles,
    activeFile,
    terminal,
    hasUnsavedChanges,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    saveFile: handleSaveFile,
    saveAllFiles: handleSaveAllFiles,
    createFile,
    deleteFile,
    runProject: handleRunProject,
    buildProject: handleBuildProject,
    addTerminalOutput,
    clearTerminal,
    loadProjectFiles,
  }
}
