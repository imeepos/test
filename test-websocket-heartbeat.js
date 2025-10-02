/**
 * WebSocket 心跳测试脚本
 * 用于验证客户端心跳功能是否正常工作
 */

const io = require('socket.io-client');

// 配置
const WS_URL = 'http://localhost:8000';
const HEARTBEAT_INTERVAL = 30000; // 30秒
const TEST_DURATION = 180000; // 3分钟测试时长

console.log('🚀 开始 WebSocket 心跳测试...');
console.log(`📡 连接地址: ${WS_URL}`);
console.log(`💓 心跳间隔: ${HEARTBEAT_INTERVAL}ms (${HEARTBEAT_INTERVAL / 1000}秒)`);
console.log(`⏱️  测试时长: ${TEST_DURATION}ms (${TEST_DURATION / 1000}秒)`);
console.log('---');

// 创建连接
const socket = io(WS_URL, {
  autoConnect: false,
  timeout: 30000,
  forceNew: true
});

let heartbeatTimer = null;
let heartbeatCount = 0;
let pongCount = 0;
let isConnected = false;

// 启动心跳
function startHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }

  console.log(`💓 启动心跳定时器，间隔: ${HEARTBEAT_INTERVAL}ms`);

  heartbeatTimer = setInterval(() => {
    if (socket.connected) {
      heartbeatCount++;
      console.log(`💓 [${new Date().toLocaleTimeString()}] 发送心跳 #${heartbeatCount}`);
      socket.emit('ping');
    } else {
      console.warn('⚠️  Socket未连接，停止心跳');
      stopHeartbeat();
    }
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    console.log('💔 心跳定时器已停止');
  }
}

// 监听连接事件
socket.on('connect', () => {
  isConnected = true;
  console.log(`✅ [${new Date().toLocaleTimeString()}] WebSocket已连接`);
  console.log(`   Socket ID: ${socket.id}`);

  // 发送认证（使用guest模式）
  socket.emit('authenticate', {
    userId: 'test-heartbeat-user',
    token: null
  });
});

socket.on('authenticated', (data) => {
  console.log(`🔐 [${new Date().toLocaleTimeString()}] 认证成功:`, data);

  // 认证成功后启动心跳
  startHeartbeat();
});

socket.on('disconnect', (reason) => {
  isConnected = false;
  console.log(`❌ [${new Date().toLocaleTimeString()}] WebSocket已断开`);
  console.log(`   断开原因: ${reason}`);
  stopHeartbeat();
});

socket.on('pong', () => {
  pongCount++;
  console.log(`🏓 [${new Date().toLocaleTimeString()}] 收到pong响应 #${pongCount}`);
});

socket.on('connect_error', (error) => {
  console.error(`🔴 [${new Date().toLocaleTimeString()}] 连接错误:`, error.message);
});

socket.on('error', (error) => {
  console.error(`🔴 [${new Date().toLocaleTimeString()}] Socket错误:`, error);
});

// 开始连接
console.log('🔌 开始连接...');
socket.connect();

// 测试结束后断开
setTimeout(() => {
  console.log('---');
  console.log('📊 测试结果统计:');
  console.log(`   发送心跳次数: ${heartbeatCount}`);
  console.log(`   接收pong次数: ${pongCount}`);
  console.log(`   连接状态: ${isConnected ? '已连接' : '已断开'}`);

  if (heartbeatCount > 0 && pongCount > 0) {
    console.log('✅ 心跳功能正常工作');
  } else {
    console.log('❌ 心跳功能异常');
  }

  console.log('\n🏁 测试完成，断开连接...');
  stopHeartbeat();
  socket.disconnect();

  process.exit(0);
}, TEST_DURATION);

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n⚠️  收到中断信号，清理资源...');
  stopHeartbeat();
  socket.disconnect();
  process.exit(0);
});
