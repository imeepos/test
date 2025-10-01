/**
 * 忘记密码页面
 */

import React, { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { apiClient } from '@/services/apiClient'

interface ForgotPasswordPageProps {
  onBack?: () => void
  onResetSuccess?: () => void
}

export function ForgotPasswordPage({ onBack, onResetSuccess }: ForgotPasswordPageProps) {
  const toast = useToast()

  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')

  // 请求重置码
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!email) {
      setValidationError('请输入邮箱地址')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setValidationError('邮箱格式不正确')
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.post<{ message: string; reset_code?: string }>(
        '/api/users/auth/request-reset',
        { email }
      )

      toast.success('重置码已发送', response.message)

      // 开发环境显示重置码
      if (response.reset_code) {
        toast.info('开发环境', `重置码: ${response.reset_code}`, { duration: 10000 })
      }

      setStep('reset')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '请求失败，请重试'
      toast.error('请求失败', errorMessage)
      setValidationError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!resetCode || !newPassword || !confirmPassword) {
      setValidationError('请填写所有字段')
      return
    }

    if (newPassword.length < 6) {
      setValidationError('密码至少需要6个字符')
      return
    }

    if (newPassword !== confirmPassword) {
      setValidationError('两次输入的密码不一致')
      return
    }

    setIsLoading(true)

    try {
      await apiClient.post('/api/users/auth/reset-password', {
        email,
        reset_code: resetCode,
        new_password: newPassword,
      })

      toast.success('密码重置成功', '请使用新密码登录')

      // 延迟后跳转到登录页
      setTimeout(() => {
        onResetSuccess?.()
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重置失败，请重试'
      toast.error('重置失败', errorMessage)
      setValidationError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sidebar-text mb-2">SKER Studio</h1>
          <p className="text-sidebar-text-muted">重置密码</p>
        </div>

        {/* 表单容器 */}
        <div className="bg-sidebar-bg border border-sidebar-border rounded-xl p-8 shadow-lg">
          {step === 'request' ? (
            <>
              <h2 className="text-2xl font-semibold text-sidebar-text mb-2">忘记密码</h2>
              <p className="text-sm text-sidebar-text-muted mb-6">
                输入您的邮箱地址，我们将发送重置码给您
              </p>

              <form onSubmit={handleRequestReset} className="space-y-4">
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

                {validationError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-500">{validationError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full"
                  variant="primary"
                >
                  {isLoading ? '发送中...' : '发送重置码'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-sidebar-text mb-2">重置密码</h2>
              <p className="text-sm text-sidebar-text-muted mb-6">
                重置码已发送到 <span className="font-medium text-sidebar-text">{email}</span>
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="resetCode"
                    className="block text-sm font-medium text-sidebar-text mb-2"
                  >
                    重置码 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="resetCode"
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="输入6位数字重置码"
                    required
                    disabled={isLoading}
                    className="w-full"
                    maxLength={6}
                  />
                  <p className="text-xs text-sidebar-text-muted mt-1">重置码有效期30分钟</p>
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-sidebar-text mb-2"
                  >
                    新密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-sidebar-text mb-2"
                  >
                    确认新密码 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    required
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                {validationError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-500">{validationError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !resetCode || !newPassword || !confirmPassword}
                  className="w-full"
                  variant="primary"
                >
                  {isLoading ? '重置中...' : '重置密码'}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="w-full text-sm text-sidebar-text-muted hover:text-sidebar-text"
                  disabled={isLoading}
                >
                  没有收到？重新发送
                </button>
              </form>
            </>
          )}

          {/* 返回登录 */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              disabled={isLoading}
            >
              返回登录
            </button>
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
