/**
 * 注册页面
 */

import React, { useState } from 'react'
import { useAuthStore } from '@/stores'
import { Button, Input } from '@/components/ui'

interface RegisterPageProps {
  onSwitchToLogin?: () => void
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register, status, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')

  const isLoading = status === 'loading'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError('')

    // 前端验证
    if (!email || !password || !name) {
      setValidationError('请填写所有必填字段')
      return
    }

    if (password.length < 6) {
      setValidationError('密码至少需要6个字符')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('两次输入的密码不一致')
      return
    }

    if (name.trim().length < 2) {
      setValidationError('用户名至少需要2个字符')
      return
    }

    try {
      await register({ email, password, name: name.trim() })
      // 注册成功后，App.tsx会自动切换到画布页面
    } catch (error) {
      console.error('注册失败:', error)
    }
  }

  const handleGoToLogin = () => {
    onSwitchToLogin?.()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sidebar-text mb-2">SKER Studio</h1>
          <p className="text-sidebar-text-muted">扩展式AI协作画布</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-sidebar-bg border border-sidebar-border rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-sidebar-text mb-6">注册账号</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名输入 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-sidebar-text mb-2">
                用户名 <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="张三"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-sidebar-text mb-2">
                邮箱 <span className="text-red-500">*</span>
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
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6个字符"
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

            {/* 确认密码输入 */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-sidebar-text mb-2"
              >
                确认密码 <span className="text-red-500">*</span>
              </label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* 错误提示 */}
            {(error || validationError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-500">{error?.message || validationError}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={isLoading || !email || !password || !confirmPassword || !name}
              className="w-full"
              variant="primary"
            >
              {isLoading ? '注册中...' : '注册'}
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

          {/* 登录链接 */}
          <div className="text-center">
            <p className="text-sm text-sidebar-text-muted">
              已有账号？{' '}
              <button
                type="button"
                onClick={handleGoToLogin}
                className="text-primary-500 hover:text-primary-600 font-medium"
                disabled={isLoading}
              >
                立即登录
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
