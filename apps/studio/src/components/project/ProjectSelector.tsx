/**
 * 项目选择器组件
 * 显示项目列表,支持创建、打开项目
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCanvasStore } from '@/stores/canvasStore'
import { useNodeStore } from '@/stores/nodeStore'
import { Plus, FolderOpen, Clock, Loader2 } from 'lucide-react'

export const ProjectSelector: React.FC = () => {
  const navigate = useNavigate()

  // 使用 selector 避免不必要的重新渲染
  const projects = useCanvasStore((state) => state.projects)
  const currentProject = useCanvasStore((state) => state.currentProject)
  const isLoadingProject = useCanvasStore((state) => state.isLoadingProject)
  const projectError = useCanvasStore((state) => state.projectError)
  const loadProject = useCanvasStore((state) => state.loadProject)
  const createProject = useCanvasStore((state) => state.createProject)

  const { syncFromBackend, setCurrentProject } = useNodeStore()

  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  // ❌ 不要在这里加载项目列表！
  // 项目列表已经在 useProjectInit 中加载
  // 这里重复加载会导致死循环

  // 当项目加载完成后，自动导航到 canvas 并传递 projectId
  useEffect(() => {
    if (currentProject && !isLoadingProject) {
      console.log('项目已选择，导航到 /canvas:', currentProject.id)
      navigate(`/canvas?projectId=${currentProject.id}`, { replace: true })
    }
  }, [currentProject, isLoadingProject, navigate])

  // 打开项目
  const handleOpenProject = async (projectId: string) => {
    try {
      await loadProject(projectId)
      setCurrentProject(projectId)
      await syncFromBackend(projectId)
      // 导航由 useEffect 处理
    } catch (error) {
      console.error('打开项目失败:', error)
    }
  }

  // 创建新项目
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('请输入项目名称')
      return
    }

    try {
      const project = await createProject(newProjectName.trim(), newProjectDescription.trim())
      setCurrentProject(project.id)

      // 清空输入
      setNewProjectName('')
      setNewProjectDescription('')
      setIsCreating(false)
      // 导航由 useEffect 处理
    } catch (error) {
      console.error('创建项目失败:', error)
      alert('创建项目失败')
    }
  }

  return (
    <div className="min-h-screen bg-canvas-bg text-sidebar-text">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
        {/* 顶部信息区域 */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-sidebar-text-muted">Workspace</p>
            <h1 className="text-3xl font-bold">项目中心</h1>
            <p className="mt-2 text-sm text-sidebar-text-muted">
              管理您的协作画布项目，快速创建、继续或切换工作进度
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsCreating((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              <Plus className="h-5 w-5" />
              {isCreating ? '关闭创建面板' : '新建项目'}
            </button>
            {projects.length > 0 && (
              <div className="rounded-lg border border-sidebar-border bg-sidebar-surface/60 px-4 py-2 text-sm text-sidebar-text-muted">
                共 {projects.length} 个项目
              </div>
            )}
          </div>
        </header>

        {/* 错误提示 */}
        {projectError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ❌ {projectError}
          </div>
        )}

        {/* 创建面板 */}
        {!isLoadingProject && isCreating && (
          <section className="rounded-2xl border border-sidebar-border bg-sidebar-surface/80 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">创建新项目</h2>
                <p className="mt-1 text-sm text-sidebar-text-muted">为团队协作准备一个新的画布空间</p>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewProjectName('')
                  setNewProjectDescription('')
                }}
                className="text-sm text-sidebar-text-muted transition-colors hover:text-sidebar-text"
              >
                取消
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="project-name" className="mb-2 block text-sm font-medium">
                  项目名称 *
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      handleCreateProject()
                    }
                  }}
                  placeholder="输入项目名称"
                  className="w-full rounded-lg border border-sidebar-border bg-canvas-bg px-4 py-2 text-sidebar-text shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="project-desc" className="mb-2 block text-sm font-medium">
                  项目描述 (可选)
                </label>
                <textarea
                  id="project-desc"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="简要描述项目内容..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-sidebar-border bg-canvas-bg px-4 py-2 text-sidebar-text shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                创建项目
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewProjectName('')
                  setNewProjectDescription('')
                }}
                className="inline-flex items-center justify-center rounded-lg border border-sidebar-border px-4 py-2 text-sm font-medium text-sidebar-text transition-colors hover:bg-canvas-bg"
              >
                返回列表
              </button>
            </div>
          </section>
        )}

        {/* 加载状态 */}
        {isLoadingProject && (
          <div className="flex min-h-[40vh] w-full items-center justify-center rounded-2xl border border-dashed border-sidebar-border/80 bg-sidebar-surface/40">
            <div className="flex items-center gap-3 text-sidebar-text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              <span>正在加载项目...</span>
            </div>
          </div>
        )}

        {/* 项目列表 */}
        {!isLoadingProject && !isCreating && (
          <section className="flex flex-col gap-6">
            {projects.length === 0 ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-sidebar-border/70 bg-sidebar-surface/40 text-center">
                <FolderOpen className="mb-4 h-14 w-14 text-sidebar-text-muted" />
                <h3 className="text-lg font-semibold">还没有项目</h3>
                <p className="mt-2 max-w-md text-sm text-sidebar-text-muted">
                  创建您的第一个协作画布项目，开始构建工作流与AI智能助手
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                >
                  <Plus className="h-5 w-5" />
                  创建项目
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleOpenProject(project.id)}
                    className="group flex h-full flex-col rounded-2xl border border-transparent bg-sidebar-surface/80 p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary-500 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                          <FolderOpen className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-sidebar-text line-clamp-1">{project.name}</h3>
                          <span className="text-xs text-sidebar-text-muted">最近访问：{new Date(project.last_accessed_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-500">
                        {project.status}
                      </span>
                    </div>

                    {project.description && (
                      <p className="mt-4 flex-1 text-sm text-sidebar-text-muted line-clamp-3">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between text-xs text-sidebar-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(project.updated_at || project.last_accessed_at).toLocaleString('zh-CN')}
                      </span>
                      <span className="text-primary-500 transition-colors group-hover:text-primary-400">
                        点击打开
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
