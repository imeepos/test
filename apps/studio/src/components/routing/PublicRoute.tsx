import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'

interface PublicRouteProps {
  children: React.ReactNode
}

/**
 * 公开路由组件
 * 已登录用户自动重定向到主应用
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const authStatus = useAuthStore((state) => state.status)

  // 已认证用户重定向到主页
  if (authStatus === 'authenticated') {
    return <Navigate to="/canvas" replace />
  }

  // 未认证或加载中，渲染子组件
  return <>{children}</>
}
