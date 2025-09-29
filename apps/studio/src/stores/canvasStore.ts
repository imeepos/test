import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Viewport, ViewMode, CanvasStats, CanvasControls } from '@/types'

export interface CanvasState {
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
  
  // 画布操作
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fitView: () => void
}

export const useCanvasStore = create<CanvasState>()(
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
      }),
      {
        name: 'canvas-storage',
        partialize: (state) => ({
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