import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { CanvasPage } from '@/pages/CanvasPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ProjectSelector } from '@/components/project/ProjectSelector'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrivateRoute } from '@/components/routing/PrivateRoute'
import { PublicRoute } from '@/components/routing/PublicRoute'
import { LoadingPage } from '@/components/common/LoadingPage'
import { useAppInitialization } from '@/hooks/useAppInitialization'
import { useTheme } from '@/hooks/useTheme'
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler'
import { useProjectInit } from '@/hooks/useProjectInit'
import { useCanvasStore, useAuthStore } from '@/stores'

// 页面包装器组件 - 使用 React Router 导航
const LoginPageWrapper: React.FC = () => {
  const navigate = useNavigate()
  return (
    <LoginPage
      onSwitchToRegister={() => navigate('/register')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  )
}

const RegisterPageWrapper: React.FC = () => {
  const navigate = useNavigate()
  return <RegisterPage onSwitchToLogin={() => navigate('/login')} />
}

const ForgotPasswordPageWrapper: React.FC = () => {
  const navigate = useNavigate()
  return (
    <ForgotPasswordPage
      onBack={() => navigate('/login')}
      onResetSuccess={() => navigate('/login')}
    />
  )
}

function App() {
  // 初始化主题
  useTheme()

  // 全局错误处理
  useGlobalErrorHandler()

  // 应用服务初始化
  useAppInitialization()

  // 项目系统初始化
  const { isReady, isLoading, error: projectError } = useProjectInit()

  const authStatus = useAuthStore((state) => state.status)
  const currentProject = useCanvasStore((state) => state.currentProject)

  // 认证状态加载中
  if (authStatus === 'loading') {
    return <LoadingPage message="正在验证身份..." />
  }

  // 项目初始化错误
  if (projectError) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas-bg">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">项目初始化失败</div>
          <div className="text-sidebar-text-muted">{projectError}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPageWrapper />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPageWrapper />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPageWrapper />
            </PublicRoute>
          }
        />

        {/* 受保护的路由 */}
        <Route element={<AppLayout />}>
          <Route
            path="/projects"
            element={
              <PrivateRoute>
                {isLoading || !isReady ? (
                  <LoadingPage message="正在初始化项目系统..." />
                ) : (
                  <ProjectSelector />
                )}
              </PrivateRoute>
            }
          />
          <Route
            path="/canvas"
            element={
              <PrivateRoute>
                {isLoading || !isReady ? (
                  <LoadingPage message="正在初始化项目系统..." />
                ) : (
                  <CanvasPage />
                )}
              </PrivateRoute>
            }
          />
        </Route>

        {/* 默认路由 */}
        <Route
          path="/"
          element={
            authStatus === 'authenticated' ? (
              <Navigate to="/canvas" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 路由 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
