/**
 * 项目管理 Hook
 * 封装项目相关的业务逻辑
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProjectStore } from '@/stores'
import { type CreateProjectDTO, type UpdateProjectDTO } from '@/services'
import { message } from 'antd'

export function useProjects(params?: any) {
  const { projects, isLoading, error, fetchProjects } = useProjectStore()

  // 使用 React Query 缓存
  const query = useQuery({
    queryKey: ['projects', params],
    queryFn: () => fetchProjects(params),
    staleTime: 5 * 60 * 1000, // 5 分钟
  })

  return {
    projects,
    isLoading: query.isLoading || isLoading,
    error: query.error || error,
    refetch: query.refetch,
  }
}

export function useProject(id: string) {
  const { currentProject, isLoading, error, fetchProject } = useProjectStore()

  const query = useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  return {
    project: currentProject,
    isLoading: query.isLoading || isLoading,
    error: query.error || error,
    refetch: query.refetch,
  }
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { createProject } = useProjectStore()

  return useMutation({
    mutationFn: (data: CreateProjectDTO) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      message.success('项目创建成功')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建项目失败')
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const { updateProject } = useProjectStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDTO }) => updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] })
      message.success('项目更新成功')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新项目失败')
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const { deleteProject } = useProjectStore()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      message.success('项目删除成功')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除项目失败')
    },
  })
}
