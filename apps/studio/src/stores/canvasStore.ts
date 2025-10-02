import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Viewport, ViewMode, CanvasStats, CanvasControls } from '@/types'
import { projectService } from '@/services/projectService'
import type { Project, CanvasState as ProjectCanvasState } from '@/services/projectService'

export interface CanvasStoreState {
  // 视图状态
  viewport: Viewport
  viewMode: ViewMode
  isFullscreen: boolean

  // 搜索和筛选
  searchQuery: string
  filteredNodeIds: string[]

  // 画布统计
  stats: CanvasStats

  // 选择状态
  selectedNodeIds: string[]

  // 项目管理
  currentProject: Project | null
  projects: Project[]
  isLoadingProject: boolean
  projectError: string | null

  // Actions
  setViewport: (viewport: Viewport) => void
  setViewMode: (mode: ViewMode) => void
  setFullscreen: (fullscreen: boolean) => void
  updateSearch: (query: string) => void
  setFilteredNodeIds: (ids: string[]) => void
  updateStats: (stats: Partial<CanvasStats>) => void
  setSelectedNodes: (ids: string[]) => void
  addSelectedNode: (id: string) => void
  removeSelectedNode: (id: string) => void
  clearSelection: () => void
  selectAll: (getAllNodeIds: () => string[]) => void

  // 画布操作
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fitView: () => void

  // 项目管理Actions
  loadProjects: (userId?: string) => Promise<void>
  loadProject: (projectId: string) => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project>
  saveCurrentProject: () => Promise<void>
  saveCanvasState: () => Promise<void>
  closeProject: () => void
}

export const useCanvasStore = create<CanvasStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        viewport: { x: 0, y: 0, zoom: 1 },
        viewMode: 'preview',
        isFullscreen: false,
        searchQuery: '',
        filteredNodeIds: [],
        stats: {
          nodeCount: 0,
          averageImportance: 0,
          averageConfidence: 0,
        },
        selectedNodeIds: [],
        currentProject: null,
        projects: [],
        isLoadingProject: false,
        projectError: null,
        
        // Actions
        setViewport: (viewport) =>
          set({ viewport }, false, 'canvas/setViewport'),
        
        setViewMode: (viewMode) =>
          set({ viewMode }, false, 'canvas/setViewMode'),
        
        setFullscreen: (isFullscreen) =>
          set({ isFullscreen }, false, 'canvas/setFullscreen'),
        
        updateSearch: (searchQuery) =>
          set({ searchQuery }, false, 'canvas/updateSearch'),
        
        setFilteredNodeIds: (filteredNodeIds) =>
          set({ filteredNodeIds }, false, 'canvas/setFilteredNodeIds'),
        
        updateStats: (newStats) =>
          set(
            (state) => ({
              stats: { ...state.stats, ...newStats }
            }),
            false,
            'canvas/updateStats'
          ),
        
        setSelectedNodes: (selectedNodeIds) =>
          set({ selectedNodeIds }, false, 'canvas/setSelectedNodes'),
        
        addSelectedNode: (id) =>
          set(
            (state) => ({
              selectedNodeIds: state.selectedNodeIds.includes(id)
                ? state.selectedNodeIds
                : [...state.selectedNodeIds, id]
            }),
            false,
            'canvas/addSelectedNode'
          ),
        
        removeSelectedNode: (id) =>
          set(
            (state) => ({
              selectedNodeIds: state.selectedNodeIds.filter(nodeId => nodeId !== id)
            }),
            false,
            'canvas/removeSelectedNode'
          ),
        
        clearSelection: () =>
          set({ selectedNodeIds: [] }, false, 'canvas/clearSelection'),

        selectAll: (getAllNodeIds) => {
          const allNodeIds = getAllNodeIds()
          set({ selectedNodeIds: allNodeIds }, false, 'canvas/selectAll')
        },
        
        // 画布操作
        zoomIn: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                zoom: Math.min(state.viewport.zoom * 1.2, 2)
              }
            }),
            false,
            'canvas/zoomIn'
          ),
        
        zoomOut: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                zoom: Math.max(state.viewport.zoom / 1.2, 0.1)
              }
            }),
            false,
            'canvas/zoomOut'
          ),
        
        resetZoom: () =>
          set(
            (state) => ({
              viewport: { ...state.viewport, zoom: 1 }
            }),
            false,
            'canvas/resetZoom'
          ),
        
        fitView: () =>
          set(
            { viewport: { x: 0, y: 0, zoom: 1 } },
            false,
            'canvas/fitView'
          ),

        // 项目管理Actions实现
        loadProjects: async (userId) => {
          // 防止重复加载：如果正在加载中，直接返回
          if (get().isLoadingProject) {
            return
          }

          set({ isLoadingProject: true, projectError: null })

          try {
            const projects = await projectService.getProjects({ userId })
            // 确保 projects 是数组，防止 map 报错
            const projectList = Array.isArray(projects) ? projects : []
            set({ projects: projectList, isLoadingProject: false })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '加载项目失败'
            set({ projectError: errorMessage, isLoadingProject: false, projects: [] })
            console.error('❌ 加载项目失败:', error)
            throw error
          }
        },

        loadProject: async (projectId) => {
          set({ isLoadingProject: true, projectError: null })

          try {
            // 加载项目详情
            const project = await projectService.getProject(projectId)

            // 更新画布状态
            const canvasData = project.canvas_data
            set({
              currentProject: project,
              viewport: canvasData.viewport,
              viewMode: canvasData.displayMode,
              isLoadingProject: false,
            })

            // 更新最后访问时间
            await projectService.updateLastAccessed(projectId)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '加载项目失败'
            set({ projectError: errorMessage, isLoadingProject: false })
            console.error('❌ 加载项目失败:', error)
            throw error
          }
        },

        createProject: async (name, description) => {
          set({ isLoadingProject: true, projectError: null })

          try {
            const project = await projectService.createProject({
              name,
              description,
              canvas_data: {
                viewport: get().viewport,
                displayMode: get().viewMode,
                filters: {},
              },
            })

            set((state) => ({
              currentProject: project,
              projects: [...state.projects, project],
              isLoadingProject: false,
            }))

            return project
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '创建项目失败'
            set({ projectError: errorMessage, isLoadingProject: false })
            console.error('❌ 创建项目失败:', error)
            throw error
          }
        },

        saveCurrentProject: async () => {
          const project = get().currentProject
          if (!project) {
            return
          }

          try {
            await projectService.updateProject(project.id, {
              canvas_data: {
                viewport: get().viewport,
                displayMode: get().viewMode,
                filters: {},
              },
            })
          } catch (error) {
            console.error('❌ 项目保存失败:', error)
            throw error
          }
        },

        saveCanvasState: async () => {
          const project = get().currentProject
          if (!project) {
            return
          }

          try {
            const canvasState: ProjectCanvasState = {
              viewport: get().viewport,
              displayMode: get().viewMode,
              filters: {},
              selectedNodeIds: get().selectedNodeIds,
              timestamp: new Date(),
            }

            await projectService.saveCanvasState(project.id, canvasState)
          } catch (error) {
            console.error('❌ 画布状态保存失败:', error)
          }
        },

        closeProject: () => {
          set({
            currentProject: null,
            viewport: { x: 0, y: 0, zoom: 1 },
            viewMode: 'preview',
            selectedNodeIds: [],
          })
        },
      }),
      {
        name: 'canvas-storage',
        partialize: (state) => ({
          viewport: state.viewport,
          viewMode: state.viewMode,
          searchQuery: state.searchQuery,
        }),
      }
    ),
    {
      name: 'canvas-store',
    }
  )
)