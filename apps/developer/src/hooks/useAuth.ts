/**
 * 认证 Hook
 * 封装用户认证相关的业务逻辑
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import type { LoginDTO, RegisterDTO } from '@/services'
import { message } from 'antd'

export function useAuth() {
  const { user, isAuthenticated, isLoading, error, login, register, logout, refreshUser, clearError } = useAuthStore()
  const navigate = useNavigate()

  // 自动刷新用户信息
  useEffect(() => {
    if (isAuthenticated && !user) {
      refreshUser()
    }
  }, [isAuthenticated, user, refreshUser])

  const handleLogin = async (data: LoginDTO) => {
    try {
      await login(data)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      // 错误已在 store 中处理
    }
  }

  const handleRegister = async (data: RegisterDTO) => {
    try {
      await register(data)
      message.success('注册成功')
      navigate('/')
    } catch (error) {
      // 错误已在 store 中处理
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      message.success('退出登录成功')
      navigate('/login')
    } catch (error) {
      message.error('退出登录失败')
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
    clearError,
  }
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, isLoading, navigate])

  return { isAuthenticated, isLoading }
}
