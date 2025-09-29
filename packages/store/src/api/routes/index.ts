import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { ProjectController } from '../controllers/ProjectController'
import { NodeController } from '../controllers/NodeController'
import { ConnectionController } from '../controllers/ConnectionController'
import { AITaskController } from '../controllers/AITaskController'
import { SystemController } from '../controllers/SystemController'

/**
 * API路由器 - 统一管理所有API端点
 */
export function createApiRouter(): Router {
  const router = Router()

  // 控制器实例
  const userController = new UserController()
  const projectController = new ProjectController()
  const nodeController = new NodeController()
  const connectionController = new ConnectionController()
  const aiTaskController = new AITaskController()

  // ===== 用户管理路由 =====
  router.get('/users', userController.getUsers)
  router.get('/users/:id', userController.getUserById)
  router.get('/users/by-email/:email', userController.getUserByEmail)
  router.get('/users/by-username/:username', userController.getUserByUsername)
  router.post('/users', userController.createUser)
  router.put('/users/:id', userController.updateUser)
  router.delete('/users/:id', userController.deleteUser)

  // 用户认证相关
  router.post('/users/authenticate', userController.authenticate)
  router.post('/users/:id/verify-password', userController.verifyPassword)
  router.put('/users/:id/password', userController.updatePassword)
  router.put('/users/:id/last-login', userController.updateLastLogin)

  // 用户统计和查询
  router.get('/users/:id/stats', userController.getUserStats)
  router.get('/users/active', userController.getActiveUsers)

  // ===== 项目管理路由 =====
  router.get('/projects', projectController.getProjects)
  router.get('/projects/:id', projectController.getProjectById)
  router.post('/projects', projectController.createProject)
  router.put('/projects/:id', projectController.updateProject)
  router.delete('/projects/:id', projectController.deleteProject)

  // 项目查询
  router.get('/projects/by-user/:userId', projectController.getProjectsByUser)
  router.get('/projects/by-status/:status', projectController.getProjectsByStatus)
  router.get('/projects/active', projectController.getActiveProjects)
  router.get('/projects/archived', projectController.getArchivedProjects)

  // 项目操作
  router.put('/projects/:id/last-accessed', projectController.updateLastAccessed)
  router.put('/projects/:id/archive', projectController.archiveProject)
  router.put('/projects/:id/unarchive', projectController.unarchiveProject)

  // 项目统计和分析
  router.get('/projects/:id/stats', projectController.getProjectStats)
  router.get('/projects/users/:userId/stats', projectController.getUserProjectStats)
  router.get('/projects/recent/:userId', projectController.getRecentProjects)
  router.get('/projects/popular/:userId', projectController.getPopularProjects)

  // 项目权限和协作
  router.get('/projects/:id/access/:userId', projectController.checkAccess)
  router.get('/projects/:id/collaborators/count', projectController.getCollaboratorCount)

  // 项目维护
  router.get('/projects/:id/export', projectController.exportProject)
  router.delete('/projects/users/:userId/cleanup-archived', projectController.cleanupOldArchived)

  // ===== 节点管理路由 =====
  router.get('/nodes', nodeController.getNodes)
  router.get('/nodes/:id', nodeController.getNodeById)
  router.post('/nodes', nodeController.createNode)
  router.put('/nodes/:id', nodeController.updateNode)
  router.delete('/nodes/:id', nodeController.deleteNode)

  // 节点查询
  router.get('/nodes/by-project/:projectId', nodeController.getNodesByProject)
  router.get('/nodes/by-user/:userId', nodeController.getNodesByUser)
  router.get('/nodes/by-tags', nodeController.getNodesByTags)
  router.get('/nodes/by-status/:status', nodeController.getNodesByStatus)

  // 节点关系
  router.get('/nodes/:id/children', nodeController.getNodeChildren)
  router.get('/nodes/roots/:projectId', nodeController.getRootNodes)
  router.get('/nodes/:id/neighbors', nodeController.getNodeNeighbors)
  router.get('/nodes/:id/path', nodeController.getNodePath)
  router.get('/nodes/:id/subtree', nodeController.getNodeSubtree)

  // 节点操作
  router.put('/nodes/batch/status', nodeController.updateNodeStatusBatch)
  router.post('/nodes/:id/copy', nodeController.copyNodeToProject)
  router.put('/nodes/:id/soft-delete', nodeController.softDeleteNode)
  router.put('/nodes/:id/restore', nodeController.restoreNode)

  // 节点统计和查询
  router.get('/nodes/stats', nodeController.getNodeStats)
  router.get('/nodes/recent-active/:projectId', nodeController.getRecentlyActiveNodes)
  router.get('/nodes/high-priority/:projectId', nodeController.getHighPriorityNodes)

  // ===== 连接管理路由 =====
  router.get('/connections', connectionController.getConnections)
  router.get('/connections/:id', connectionController.getConnectionById)
  router.post('/connections', connectionController.createConnection)
  router.put('/connections/:id', connectionController.updateConnection)
  router.delete('/connections/:id', connectionController.deleteConnection)

  // 连接查询
  router.get('/connections/by-project/:projectId', connectionController.getConnectionsByProject)
  router.get('/connections/by-source/:sourceNodeId', connectionController.getConnectionsBySourceNode)
  router.get('/connections/by-target/:targetNodeId', connectionController.getConnectionsByTargetNode)
  router.get('/connections/between/:sourceNodeId/:targetNodeId', connectionController.getConnectionsBetweenNodes)

  // 连接分析
  router.get('/connections/stats/:projectId', connectionController.getConnectionStats)
  router.get('/connections/network-analysis/:projectId', connectionController.getNetworkAnalysis)

  // ===== AI任务管理路由 =====
  router.get('/ai-tasks', aiTaskController.getAITasks)
  router.get('/ai-tasks/:id', aiTaskController.getAITaskById)
  router.post('/ai-tasks', aiTaskController.createAITask)
  router.put('/ai-tasks/:id', aiTaskController.updateAITask)
  router.delete('/ai-tasks/:id', aiTaskController.deleteAITask)

  // AI任务查询
  router.get('/ai-tasks/by-project/:projectId', aiTaskController.getAITasksByProject)
  router.get('/ai-tasks/by-user/:userId', aiTaskController.getAITasksByUser)
  router.get('/ai-tasks/by-status/:status', aiTaskController.getAITasksByStatus)
  router.get('/ai-tasks/by-type/:type', aiTaskController.getAITasksByType)

  // AI任务状态管理
  router.put('/ai-tasks/:id/start', aiTaskController.startAITask)
  router.put('/ai-tasks/:id/complete', aiTaskController.completeAITask)
  router.put('/ai-tasks/:id/fail', aiTaskController.failAITask)
  router.put('/ai-tasks/:id/cancel', aiTaskController.cancelAITask)
  router.put('/ai-tasks/:id/retry', aiTaskController.retryAITask)

  // AI任务队列管理
  router.get('/ai-tasks/queued', aiTaskController.getQueuedAITasks)
  router.get('/ai-tasks/processing', aiTaskController.getProcessingAITasks)
  router.get('/ai-tasks/timed-out', aiTaskController.getTimedOutAITasks)
  router.post('/ai-tasks/cleanup-timed-out', aiTaskController.cleanupTimedOutAITasks)

  // AI任务统计和分析
  router.get('/ai-tasks/stats', aiTaskController.getAITaskStats)
  router.get('/ai-tasks/performance-analysis', aiTaskController.getPerformanceAnalysis)
  router.post('/ai-tasks/cleanup-old', aiTaskController.cleanupOldAITasks)

  return router
}

/**
 * 系统状态路由
 */
export function createSystemRouter(): Router {
  const router = Router()

  // 系统控制器实例
  const systemController = new SystemController()

  // 系统统计和监控
  router.get('/stats', systemController.getSystemStats)
  router.get('/metrics', systemController.getMetrics)
  router.get('/dependencies', systemController.checkDependencies)
  router.get('/version', systemController.getVersion)

  // 缓存管理
  router.post('/cache', systemController.setCache)
  router.get('/cache/:key', systemController.getCache)
  router.delete('/cache', systemController.deleteCache)

  // 数据库管理
  router.post('/query', systemController.executeQuery)
  router.get('/connection-status', systemController.getConnectionStatus)

  // 数据完整性
  router.post('/validate-integrity', systemController.validateDataIntegrity)
  router.post('/repair-integrity', systemController.repairDataIntegrity)

  // 系统维护
  router.post('/cleanup', systemController.cleanup)
  router.post('/migrate', systemController.migrate)
  router.get('/migration-status', systemController.getMigrationStatus)
  router.post('/backup', systemController.createBackup)

  return router
}