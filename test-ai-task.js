#!/usr/bin/env node

/**
 * 模拟AI任务发布测试脚本
 * 直接发布消息到RabbitMQ,测试Engine是否能接收并处理
 */

import amqp from 'amqplib';

async function testAITask() {
  let connection;
  let channel;

  try {
    console.log('🔗 连接到RabbitMQ...');
    connection = await amqp.connect('amqp://sker_user:sker_password@localhost:5672');
    channel = await connection.createChannel();

    console.log('✅ RabbitMQ连接成功');

    // 确保交换机存在
    await channel.assertExchange('llm.direct', 'direct', { durable: true });
    console.log('✅ Exchange "llm.direct" 已确认');

    // 确保队列存在
    await channel.assertQueue('llm.process.queue', { durable: true });
    console.log('✅ Queue "llm.process.queue" 已确认');

    // 绑定队列到交换机
    await channel.bindQueue('llm.process.queue', 'llm.direct', 'ai.process.generate.normal');
    console.log('✅ Queue已绑定到Exchange');

    // 创建测试任务
    const testTask = {
      taskId: `test-${Date.now()}`,
      type: 'generate',
      priority: 'normal',
      userId: 'test-user',
      projectId: 'test-project',
      request: {
        prompt: '请帮我设计一个电商平台的技术架构',
        context: ['这是一个测试任务', '用于验证AI服务是否正常工作'],
        options: {
          model: 'deepseek-chat',
          temperature: 0.7,
          maxTokens: 2000
        }
      },
      metadata: {
        source: 'test-script',
        timestamp: Date.now()
      }
    };

    console.log('\n📤 发布测试任务...');
    console.log('任务ID:', testTask.taskId);
    console.log('任务类型:', testTask.type);
    console.log('提示词:', testTask.request.prompt);

    // 发布消息
    const routingKey = 'ai.process.generate.normal';
    const published = channel.publish(
      'llm.direct',
      routingKey,
      Buffer.from(JSON.stringify(testTask)),
      {
        persistent: true,
        priority: 1,
        contentType: 'application/json',
        timestamp: Date.now()
      }
    );

    if (published) {
      console.log('✅ 任务已发布到队列');
      console.log(`   Exchange: llm.direct`);
      console.log(`   RoutingKey: ${routingKey}`);
      console.log(`   Queue: llm.process.queue`);
    } else {
      console.log('❌ 任务发布失败');
    }

    // 等待一段时间,让Engine处理
    console.log('\n⏳ 等待Engine处理任务...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 检查队列状态
    const queueInfo = await channel.checkQueue('llm.process.queue');
    console.log('\n📊 队列状态:');
    console.log(`   消息数: ${queueInfo.messageCount}`);
    console.log(`   消费者数: ${queueInfo.consumerCount}`);

    if (queueInfo.messageCount === 0 && queueInfo.consumerCount > 0) {
      console.log('\n✅ 测试成功! 任务已被Engine消费');
    } else if (queueInfo.messageCount > 0) {
      console.log('\n⚠️  任务仍在队列中,可能Engine未处理或处理较慢');
    } else {
      console.log('\n❌ 队列中没有消费者,Engine可能未启动');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // 清理连接
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('\n🔚 测试完成,连接已关闭');
  }
}

// 运行测试
testAITask().catch(console.error);
