/**
 * 表单验证工具函数
 */

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证用户名 (字母数字下划线,3-20位)
 */
export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  errors: string[]
} {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  if (password.length < 8) {
    errors.push('密码至少需要8个字符')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('密码需要包含小写字母')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码需要包含大写字母')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码需要包含数字')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码需要包含特殊字符')
  }

  const isValid = errors.length === 0

  // 计算密码强度
  if (isValid) {
    if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength = 'strong'
    } else if (password.length >= 10) {
      strength = 'medium'
    }
  }

  return { isValid, strength, errors }
}

/**
 * 验证项目名称
 */
export function validateProjectName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: '项目名称不能为空' }
  }
  if (name.length < 3) {
    return { isValid: false, error: '项目名称至少需要3个字符' }
  }
  if (name.length > 50) {
    return { isValid: false, error: '项目名称不能超过50个字符' }
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return { isValid: false, error: '项目名称只能包含字母、数字、空格、连字符和下划线' }
  }
  return { isValid: true }
}

/**
 * 验证 URL
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证手机号 (中国)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证代码 (检查是否包含可能的恶意代码)
 */
export function validateCode(code: string): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // 检查可疑的系统调用
  if (/process\.exit|process\.kill/i.test(code)) {
    warnings.push('代码包含可能退出进程的调用')
  }
  if (/require\(['"]fs['"]\)|import.*from ['"]fs['"]/i.test(code)) {
    warnings.push('代码包含文件系统操作')
  }
  if (/require\(['"]child_process['"]\)|exec|spawn/i.test(code)) {
    warnings.push('代码包含子进程操作')
  }
  if (/eval\(|new Function\(/i.test(code)) {
    warnings.push('代码包含动态代码执行')
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  }
}
