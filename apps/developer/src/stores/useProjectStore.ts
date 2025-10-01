/**
 * 项目状态管理
 * 管理项目列表和当前项目
 */
import { create } from 'zustand'
import type { Project } from '@/types'
import { ProjectService, type CreateProjectDTO, type UpdateProjectDTO } from '@/services'

interface ProjectState {
  // 状态
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  total: number

  // Actions
  fetchProjects: (params?: any) => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (data: CreateProjectDTO) => Promise<Project>
  updateProject: (id: string, data: UpdateProjectDTO) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
  clearError: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // 初始状态
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  total: 0,

  // 获取项目列表
  fetchProjects: async (params?: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await ProjectService.getProjects(params)
      set({
        projects: response.data,
        total: response.total,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取项目列表失败',
        isLoading: false,
      })
      throw error
    }
  },

  // 获取单个项目
  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const project = await ProjectService.getProject(id)
      set({
        currentProject: project,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取项目失败',
        isLoading: false,
      })
      throw error
    }
  },

  // 创建项目
  createProject: async (data: CreateProjectDTO) => {
    set({ isLoading: true, error: null })
    try {
      const project = await ProjectService.createProject(data)
      set((state) => ({
        projects: [project, ...state.projects],
        total: state.total + 1,
        isLoading: false,
      }))
      return project
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '创建项目失败',
        isLoading: false,
      })
      throw error
    }
  },

  // 更新项目
  updateProject: async (id: string, data: UpdateProjectDTO) => {
    set({ isLoading: true, error: null })
    try {
      const updatedProject = await ProjectService.updateProject(id, data)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新项目失败',
        isLoading: false,
      })
      throw error
    }
  },

  // 删除项目
  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await ProjectService.deleteProject(id)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        total: state.total - 1,
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '删除项目失败',
        isLoading: false,
      })
      throw error
    }
  },

  // 设置当前项目
  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project })
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },
}))

export default useProjectStore
