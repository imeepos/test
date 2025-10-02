/**
 * Result 类型 - 类似 Rust 的 Result<T, E>
 *
 * 用于函数式错误处理，避免异常抛出
 * 提供类型安全的成功/失败处理
 */

/**
 * 成功结果
 */
export interface Ok<T> {
  readonly success: true
  readonly value: T
}

/**
 * 失败结果
 */
export interface Err<E> {
  readonly success: false
  readonly error: E
}

/**
 * Result 联合类型
 */
export type Result<T, E = Error> = Ok<T> | Err<E>

// ============================================================================
// 构造函数
// ============================================================================

/**
 * 创建成功结果
 */
export function ok<T>(value: T): Ok<T> {
  return { success: true, value }
}

/**
 * 创建失败结果
 */
export function err<E>(error: E): Err<E> {
  return { success: false, error }
}

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 判断是否为成功结果
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success === true
}

/**
 * 判断是否为失败结果
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.success === false
}

// ============================================================================
// Result 操作函数
// ============================================================================

/**
 * 映射成功值
 *
 * @example
 * const result = ok(5)
 * const doubled = map(result, x => x * 2) // Ok(10)
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value))
  }
  return result
}

/**
 * 映射错误值
 *
 * @example
 * const result = err(new Error('fail'))
 * const mapped = mapErr(result, e => e.message) // Err('fail')
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error))
  }
  return result
}

/**
 * 链式映射（flatMap）
 *
 * @example
 * const result = ok(5)
 * const chained = flatMap(result, x => ok(x * 2)) // Ok(10)
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value)
  }
  return result
}

/**
 * 解包成功值，失败时抛出异常
 *
 * @example
 * const result = ok(5)
 * const value = unwrap(result) // 5
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value
  }
  throw result.error
}

/**
 * 解包成功值，失败时返回默认值
 *
 * @example
 * const result = err(new Error('fail'))
 * const value = unwrapOr(result, 0) // 0
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value
  }
  return defaultValue
}

/**
 * 解包成功值，失败时执行函数返回默认值
 *
 * @example
 * const result = err(new Error('fail'))
 * const value = unwrapOrElse(result, () => 0) // 0
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T {
  if (isOk(result)) {
    return result.value
  }
  return fn(result.error)
}

/**
 * 组合多个 Result，全部成功才返回成功
 *
 * @example
 * const r1 = ok(1)
 * const r2 = ok(2)
 * const r3 = ok(3)
 * const combined = combine([r1, r2, r3]) // Ok([1, 2, 3])
 */
export function combine<T, E>(
  results: Array<Result<T, E>>
): Result<T[], E> {
  const values: T[] = []

  for (const result of results) {
    if (isErr(result)) {
      return result
    }
    values.push(result.value)
  }

  return ok(values)
}

/**
 * 执行函数并捕获异常，返回 Result
 *
 * @example
 * const result = tryCatch(() => JSON.parse('invalid')) // Err(SyntaxError)
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn())
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * 执行异步函数并捕获异常，返回 Result
 *
 * @example
 * const result = await tryCatchAsync(() => fetch('/api')) // Ok(response) or Err(error)
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    return ok(await fn())
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * 从 Promise 创建 Result
 *
 * @example
 * const result = await fromPromise(fetch('/api'))
 */
export async function fromPromise<T>(
  promise: Promise<T>
): Promise<Result<T, Error>> {
  return tryCatchAsync(() => promise)
}

/**
 * 将 Result 转换为 Promise（成功时 resolve，失败时 reject）
 *
 * @example
 * const promise = toPromise(ok(5)) // Promise.resolve(5)
 */
export function toPromise<T, E>(result: Result<T, E>): Promise<T> {
  if (isOk(result)) {
    return Promise.resolve(result.value)
  }
  return Promise.reject(result.error)
}

// ============================================================================
// 类型工具
// ============================================================================

/**
 * 提取 Result 的成功类型
 */
export type ExtractOk<R> = R extends Result<infer T, any> ? T : never

/**
 * 提取 Result 的错误类型
 */
export type ExtractErr<R> = R extends Result<any, infer E> ? E : never
