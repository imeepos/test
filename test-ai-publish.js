// 在Gateway容器中运行的AI任务发布测试
// 使用Gateway的QueueManager来发布任务

const testTask = {
  taskId: `test-task-${Date.now()}`,
  type: 'generate',
  priority: 'normal',
  userId: 'test-user',
  projectId: 'test-project-123',
  request: {
    prompt: '请帮我设计一个电商平台的微服务架构',
    context: ['需要支持高并发', '包含用户、商品、订单、支付等核心模块'],
    options: {
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 2000
    }
  },
  metadata: {
    source: 'manual-test',
    timestamp: Date.now(),
    nodeType: 'architecture'
  }
};

console.log('📤 测试任务:');
console.log(JSON.stringify(testTask, null, 2));
