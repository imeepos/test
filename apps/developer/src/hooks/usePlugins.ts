/**
 * 插件管理 Hook
 * 封装插件相关的业务逻辑
 */
import { useQuery, useMutation, useQueryClient } from '@tantml:tanstack/react-query'
import { usePluginStore } from '@/stores'
import { PluginService, type SearchPluginParams } from '@/services'
import { message } from 'antd'

export function usePlugins(params?: any) {
  const { plugins, isLoading, error, fetchPlugins } = usePluginStore()

  const query = useQuery({
    queryKey: ['plugins', params],
    queryFn: () => fetchPlugins(params),
    staleTime: 5 * 60 * 1000,
  })

  return {
    plugins,
    isLoading: query.isLoading || isLoading,
    error: query.error || error,
    refetch: query.refetch,
  }
}

export function useSearchPlugins() {
  const { plugins, isLoading, error, searchPlugins } = usePluginStore()

  const mutation = useMutation({
    mutationFn: (params: SearchPluginParams) => searchPlugins(params),
  })

  return {
    plugins,
    isLoading: mutation.isPending || isLoading,
    error: mutation.error || error,
    search: mutation.mutate,
    searchAsync: mutation.mutateAsync,
  }
}

export function usePlugin(id: string) {
  const { currentPlugin, isLoading, error, fetchPlugin } = usePluginStore()

  const query = useQuery({
    queryKey: ['plugin', id],
    queryFn: () => fetchPlugin(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  return {
    plugin: currentPlugin,
    isLoading: query.isLoading || isLoading,
    error: query.error || error,
    refetch: query.refetch,
  }
}

export function useInstallPlugin() {
  const queryClient = useQueryClient()
  const { installPlugin } = usePluginStore()

  return useMutation({
    mutationFn: (id: string) => installPlugin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] })
      message.success('插件安装成功')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '安装插件失败')
    },
  })
}

export function useUninstallPlugin() {
  const queryClient = useQueryClient()
  const { uninstallPlugin } = usePluginStore()

  return useMutation({
    mutationFn: (id: string) => uninstallPlugin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] })
      message.success('插件卸载成功')
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '卸载插件失败')
    },
  })
}

export function useInstalledPlugins() {
  const { installedPlugins } = usePluginStore()

  return {
    installedPlugins,
    isInstalled: (id: string) => installedPlugins.includes(id),
  }
}
