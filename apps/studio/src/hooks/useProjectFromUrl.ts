import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCanvasStore } from '@/stores'

/**
 * 从 URL searchParams 中读取 projectId 并加载项目
 */
export const useProjectFromUrl = () => {
  const [searchParams] = useSearchParams()
  const currentProject = useCanvasStore((state) => state.currentProject)
  const loadProject = useCanvasStore((state) => state.loadProject)

  const projectIdFromUrl = searchParams.get('projectId')

  useEffect(() => {
    // 如果 URL 中有 projectId 且与当前项目不同，则加载该项目
    if (projectIdFromUrl && currentProject?.id !== projectIdFromUrl) {
      console.log('从 URL 加载项目:', projectIdFromUrl)
      loadProject(projectIdFromUrl).catch((error) => {
        console.error('从 URL 加载项目失败:', error)
      })
    }
  }, [projectIdFromUrl, currentProject?.id, loadProject])

  return {
    projectIdFromUrl,
    hasProjectInUrl: !!projectIdFromUrl,
  }
}
