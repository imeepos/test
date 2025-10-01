/**
 * 项目选择器组件
 * 显示项目列表,支持创建、打开项目
 */

import React, { useEffect, useState } from 'react'
import { useCanvasStore } from '@/stores/canvasStore'
import { useNodeStore } from '@/stores/nodeStore'
import { Plus, FolderOpen, Clock, Loader2 } from 'lucide-react'

export const ProjectSelector: React.FC = () => {
  const {
    projects,
    currentProject,
    isLoadingProject,
    projectError,
    loadProjects,
    loadProject,
    createProject,
  } = useCanvasStore()

  const { syncFromBackend, setCurrentProject } = useNodeStore()

  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  // 加载项目列表
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 打开项目
  const handleOpenProject = async (projectId: string) => {
    try {
      await loadProject(projectId)
      setCurrentProject(projectId)
      await syncFromBackend(projectId)
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
    } catch (error) {
      console.error('创建项目失败:', error)
      alert('创建项目失败')
    }
  }

  // 如果已经有当前项目,不显示选择器
  if (currentProject) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-canvas-bg flex items-center justify-center z-50">
      <div className="bg-sidebar-surface rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col border border-sidebar-border">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-sidebar-border">
          <h2 className="text-2xl font-bold text-sidebar-text">选择或创建项目</h2>
          <p className="text-sm text-sidebar-text-muted mt-1">从现有项目中选择,或创建新的AI协作画布项目</p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 错误提示 */}
          {projectError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">❌ {projectError}</p>
            </div>
          )}

          {/* 加载状态 */}
          {isLoadingProject && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          )}

          {/* 项目列表 */}
          {!isLoadingProject && !isCreating && (
            <>
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-sidebar-text-muted mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-sidebar-text mb-2">还没有项目</h3>
                  <p className="text-sidebar-text-muted mb-6">创建您的第一个AI协作画布项目</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    创建项目
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 创建新项目卡片 */}
                  <button
                    onClick={() => setIsCreating(true)}
                    className="border-2 border-dashed border-sidebar-border rounded-lg p-6 hover:border-primary-500 hover:bg-primary-500/10 transition-colors flex flex-col items-center justify-center min-h-[160px] group"
                  >
                    <Plus className="w-12 h-12 text-sidebar-text-muted group-hover:text-primary-500 mb-2" />
                    <span className="text-sm font-medium text-sidebar-text-muted group-hover:text-sidebar-text">
                      创建新项目
                    </span>
                  </button>

                  {/* 现有项目卡片 */}
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleOpenProject(project.id)}
                      className="border border-sidebar-border rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all text-left bg-canvas-bg/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <FolderOpen className="w-6 h-6 text-primary-500" />
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 rounded-full">
                          {project.status}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sidebar-text mb-2 truncate">{project.name}</h3>

                      {project.description && (
                        <p className="text-sm text-sidebar-text-muted line-clamp-2 mb-3">{project.description}</p>
                      )}

                      <div className="flex items-center text-xs text-sidebar-text-muted mt-auto">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(project.last_accessed_at).toLocaleDateString('zh-CN')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 创建项目表单 */}
          {!isLoadingProject && isCreating && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-sidebar-text mb-4">创建新项目</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="project-name" className="block text-sm font-medium text-sidebar-text mb-1">
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
                    className="w-full px-4 py-2 bg-canvas-bg border border-sidebar-border text-sidebar-text rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="project-desc" className="block text-sm font-medium text-sidebar-text mb-1">
                    项目描述(可选)
                  </label>
                  <textarea
                    id="project-desc"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="简要描述项目内容..."
                    rows={3}
                    className="w-full px-4 py-2 bg-canvas-bg border border-sidebar-border text-sidebar-text rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    创建项目
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setNewProjectName('')
                      setNewProjectDescription('')
                    }}
                    className="px-4 py-2 border border-sidebar-border text-sidebar-text rounded-lg hover:bg-canvas-bg transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
