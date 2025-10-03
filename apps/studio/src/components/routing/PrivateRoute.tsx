import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { LoadingPage } from '@/components/common/LoadingPage'

interface PrivateRouteProps {
  children: React.ReactNode
}

/**
 * 路由保护组件
 * 只允许已认证用户访问
 */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const authStatus = useAuthStore((state) => state.status)

  // 认证状态加载中
  if (authStatus === 'loading') {
    return <LoadingPage message="正在验证身份..." />
  }

  // 未认证，重定向到登录页
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  // 已认证，渲染子组件
  return <>{children}</>
}
