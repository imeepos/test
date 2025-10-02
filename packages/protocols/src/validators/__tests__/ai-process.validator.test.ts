/**
 * AI 处理验证器测试 V2
 */

import { describe, it, expect } from 'vitest'
import {
  validateAIProcessRequest,
  validateAIProcessResponse,
  validateTaskProgressUpdate,
  isValidAIProcessRequest,
  isValidAIProcessResponse
} from '../ai-process.validator.js'
import type {
  AIProcessRequest,
  AIProcessResponse,
  TaskProgressUpdate
} from '../../contracts/ai-process.contract.js'

describe('AI Process Validator V2', () => {
  describe('validateAIProcessRequest', () => {
    it('should validate a minimal AI process request (一生万物场景)', () => {
      const request: AIProcessRequest = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        context: '', // 无上下文
        prompt: '我想做一个电商网站',
        timestamp: new Date()
      }

      const result = validateAIProcessRequest(request)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.context).toBe('')
        expect(result.value.prompt).toBe('我想做一个电商网站')
      }
    })

    it('should validate request with context (一生二场景)', () => {
      const request: AIProcessRequest = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        context: '电商网站需求：用户注册、商品展示、购物车、支付',
        prompt: '分析这个需求的技术架构',
        timestamp: new Date()
      }

      const result = validateAIProcessRequest(request)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.context).toContain('电商网站需求')
      }
    })

    it('should validate request with multiple contexts (二生三场景)', () => {
      const request: AIProcessRequest = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        context: '需求分析\n电商系统需要...\n\n---\n\n技术架构\n采用微服务架构...',
        prompt: '综合以上分析，制定产品MVP方案',
        timestamp: new Date(),
        metadata: {
          sourceNodeIds: [
            '550e8400-e29b-41d4-a716-446655440010',
            '550e8400-e29b-41d4-a716-446655440011'
          ]
        }
      }

      const result = validateAIProcessRequest(request)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.metadata?.sourceNodeIds).toHaveLength(2)
      }
    })

    it('should reject request with empty prompt', () => {
      const request = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        context: 'test context',
        prompt: '', // 空提示词
        timestamp: new Date()
      }

      const result = validateAIProcessRequest(request)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('prompt'))).toBe(true)
      }
    })

    it('should reject request with invalid UUID', () => {
      const request = {
        taskId: 'invalid-uuid',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        context: '',
        prompt: 'test',
        timestamp: new Date()
      }

      const result = validateAIProcessRequest(request)

      expect(result.success).toBe(false)
    })

    it('should reject request with missing required fields', () => {
      const request = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        context: '',
        prompt: 'test'
        // missing nodeId, projectId, userId, timestamp
      }

      const result = validateAIProcessRequest(request)

      expect(result.success).toBe(false)
    })
  })

  describe('validateAIProcessResponse', () => {
    it('should validate a successful response', () => {
      const response: AIProcessResponse = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'completed',
        success: true,
        result: {
          content: '生成的内容',
          title: '生成的标题',
          confidence: 0.95
        },
        stats: {
          modelUsed: 'gpt-4', // 系统自动选择的模型
          processingTime: 1500
        },
        timestamp: new Date()
      }

      const result = validateAIProcessResponse(response)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.result?.content).toBe('生成的内容')
        expect(result.value.result?.confidence).toBe(0.95)
        expect(result.value.stats?.modelUsed).toBe('gpt-4')
      }
    })

    it('should validate response with semantic type and importance', () => {
      const response: AIProcessResponse = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'completed',
        success: true,
        result: {
          content: '需求分析',
          title: '电商系统需求',
          semanticType: 'requirement',
          importanceLevel: 4,
          confidence: 0.9,
          tags: ['电商', '系统设计']
        },
        stats: {
          modelUsed: 'claude-3-opus', // 系统根据内容复杂度自动选择
          tokenCount: 500,
          processingTime: 2000,
          requestId: 'req-123'
        },
        timestamp: new Date()
      }

      const result = validateAIProcessResponse(response)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.result?.semanticType).toBe('requirement')
        expect(result.value.result?.importanceLevel).toBe(4)
        expect(result.value.stats?.modelUsed).toBe('claude-3-opus')
      }
    })

    it('should validate a failed response', () => {
      const response: AIProcessResponse = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'failed',
        success: false,
        error: {
          code: 'AI_PROCESSING_ERROR',
          message: 'Model request failed',
          retryable: true
        },
        stats: {
          modelUsed: 'gpt-4', // 失败时也记录使用的模型
          processingTime: 500
        },
        timestamp: new Date()
      }

      const result = validateAIProcessResponse(response)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.success).toBe(false)
        expect(result.value.error?.code).toBe('AI_PROCESSING_ERROR')
        expect(result.value.error?.retryable).toBe(true)
      }
    })

    it('should reject response with success=true but no result', () => {
      const response = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'completed',
        success: true,
        // missing result
        timestamp: new Date()
      }

      const result = validateAIProcessResponse(response)

      expect(result.success).toBe(false)
    })

    it('should reject response with success=false but no error', () => {
      const response = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'failed',
        success: false,
        // missing error
        timestamp: new Date()
      }

      const result = validateAIProcessResponse(response)

      expect(result.success).toBe(false)
    })
  })

  describe('validateTaskProgressUpdate', () => {
    it('should validate a progress update', () => {
      const update: TaskProgressUpdate = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'processing',
        progress: 50,
        message: 'Processing input...',
        timestamp: new Date()
      }

      const result = validateTaskProgressUpdate(update)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.progress).toBe(50)
        expect(result.value.status).toBe('processing')
      }
    })

    it('should reject progress > 100', () => {
      const update = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'processing',
        progress: 150,
        timestamp: new Date()
      }

      const result = validateTaskProgressUpdate(update)

      expect(result.success).toBe(false)
    })

    it('should reject progress < 0', () => {
      const update = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'processing',
        progress: -10,
        timestamp: new Date()
      }

      const result = validateTaskProgressUpdate(update)

      expect(result.success).toBe(false)
    })
  })

  describe('Type guards', () => {
    it('should return true for valid AI process request', () => {
      const request: AIProcessRequest = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        context: '',
        prompt: 'test',
        timestamp: new Date()
      }

      expect(isValidAIProcessRequest(request)).toBe(true)
    })

    it('should return false for invalid AI process request', () => {
      const request = {
        taskId: 'invalid',
        prompt: 'test'
      }

      expect(isValidAIProcessRequest(request)).toBe(false)
    })

    it('should return true for valid AI process response', () => {
      const response: AIProcessResponse = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        nodeId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'completed',
        success: true,
        result: {
          content: 'test',
          title: 'test',
          confidence: 0.9
        },
        stats: {
          modelUsed: 'gpt-4',
          processingTime: 1000
        },
        timestamp: new Date()
      }

      expect(isValidAIProcessResponse(response)).toBe(true)
    })
  })
})
