/**
 * 节点工具函数
 *
 * 提供节点相关的业务逻辑和计算函数
 */

import type { Node } from '../contracts/node.contract.js'

// ============================================================================
// 节点置信度计算
// ============================================================================

/**
 * 计算节点的综合置信度
 *
 * 综合考虑 AI 置信度和重要性等级，计算最终置信度
 *
 * @param aiConfidence - AI 生成的置信度 (0-1)
 * @param importance - 重要性等级 (1-5)
 * @returns 综合置信度 (0-1)
 *
 * @example
 * const confidence = calculateNodeConfidence(0.85, 4)
 * console.log(confidence) // 0.82 (0.7 * 0.85 + 0.3 * 0.75)
 */
export function calculateNodeConfidence(
  aiConfidence: number,
  importance: number
): number {
  // 综合考虑AI置信度和重要性，计算最终置信度
  const importanceWeight = 0.3
  const aiWeight = 0.7

  const normalizedImportance = (importance - 1) / 4 // 归一化到 0-1
  return aiWeight * aiConfidence + importanceWeight * normalizedImportance
}

// ============================================================================
// 节点自动保存判断
// ============================================================================

/**
 * 判断节点是否应该自动保存
 *
 * 基于内容长度或置信度判断是否需要自动保存
 *
 * @param node - 节点数据（可能不完整）
 * @returns 是否应该自动保存
 *
 * @example
 * const node = { content: 'Some content here', confidence: 0.6 }
 * const shouldSave = shouldAutoSaveNode(node)
 * console.log(shouldSave) // true (内容长度 > 10)
 */
export function shouldAutoSaveNode(node: Partial<Node>): boolean {
  // 自动保存逻辑：内容长度 > 10 或 置信度 > 0.7
  return (
    (node.content?.length ?? 0) > 10 ||
    (node.confidence ?? 0) > 0.7
  )
}

// ============================================================================
// 节点内容合并
// ============================================================================

/**
 * 合并多个节点的上下文内容
 *
 * 用于多输入融合场景，将多个节点的内容拼接成完整上下文
 *
 * @param nodes - 节点列表
 * @returns 合并后的上下文字符串
 *
 * @example
 * const nodes = [
 *   { title: '需求分析', content: '用户需要...', importance: 5 },
 *   { title: '技术方案', content: '采用技术...', importance: 4 }
 * ]
 * const context = mergeNodeContexts(nodes)
 * // 输出:
 * // === 需求分析 (重要性: 5/5) ===
 * // 用户需要...
 * //
 * // ---
 * //
 * // === 技术方案 (重要性: 4/5) ===
 * // 采用技术...
 */
export function mergeNodeContexts(nodes: Array<Partial<Node>>): string {
  return nodes
    .filter(node => node.content?.trim())
    .map(node => {
      const title = node.title || '未命名节点'
      const importance = node.importance || 3
      const content = node.content || ''

      return `=== ${title} (重要性: ${importance}/5) ===\n${content}`
    })
    .join('\n\n---\n\n')
}

// ============================================================================
// 节点位置计算
// ============================================================================

/**
 * 计算新节点的默认位置
 *
 * 基于父节点位置自动计算子节点的合适位置
 *
 * @param parentPosition - 父节点位置
 * @param childIndex - 子节点索引（用于多个子节点）
 * @returns 新节点位置
 *
 * @example
 * const parentPos = { x: 100, y: 100 }
 * const newPos = calculateChildNodePosition(parentPos, 0)
 * console.log(newPos) // { x: 300, y: 100 }
 */
export function calculateChildNodePosition(
  parentPosition: { x: number; y: number },
  childIndex: number = 0
): { x: number; y: number } {
  const offsetX = 200 // 横向偏移量
  const offsetY = 150 // 纵向偏移量

  return {
    x: parentPosition.x + offsetX,
    y: parentPosition.y + (childIndex * offsetY)
  }
}
