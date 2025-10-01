/**
 * 登录页面
 */

import React, { useState } from 'react'
import { useAuthStore } from '@/stores'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface LoginPageProps {
  onSwitchToRegister?: () => void
  onForgotPassword?: () => void
}

export function LoginPage({ onSwitchToRegister, onForgotPassword }: LoginPageProps) {
  const { login, status, error, clearError } = useAuthStore()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isLoading = status === 'loading'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!email || !password) {
      return
    }

    try {
      await login({ email, password })
      // 登录成功提示
      toast.success('登录成功', '欢迎回来！')
      // App.tsx会自动切换到画布页面
    } catch (error) {
      console.error('登录失败:', error)
      // 登录失败提示
      const errorMessage = error instanceof Error ? error.message : '登录失败，请重试'
      toast.error('登录失败', errorMessage)
    }
  }

  const handleGoToRegister = () => {
    onSwitchToRegister?.()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sidebar-text mb-2">SKER Studio</h1>
          <p className="text-sidebar-text-muted">扩展式AI协作画布</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-sidebar-bg border border-sidebar-border rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-sidebar-text mb-6">登录</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-sidebar-text mb-2">
                邮箱
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-sidebar-text mb-2">
                密码
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-text-muted hover:text-sidebar-text"
                  disabled={isLoading}
                >
                  {showPassword ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            {/* 忘记密码链接 */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary-500 hover:text-primary-600"
                disabled={isLoading}
              >
                忘记密码？
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-500">{error.message}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full"
              variant="primary"
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>

          {/* 分隔线 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sidebar-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-sidebar-bg text-sidebar-text-muted">或</span>
            </div>
          </div>

          {/* 注册链接 */}
          <div className="text-center">
            <p className="text-sm text-sidebar-text-muted">
              还没有账号？{' '}
              <button
                type="button"
                onClick={handleGoToRegister}
                className="text-primary-500 hover:text-primary-600 font-medium"
                disabled={isLoading}
              >
                立即注册
              </button>
            </p>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-8 text-center text-sm text-sidebar-text-muted">
          <p>© 2025 SKER Studio. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
