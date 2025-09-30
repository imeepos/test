const { io } = require('socket.io-client');

console.log('开始测试Socket.IO连接...');

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Socket.IO连接成功');
  console.log('Socket ID:', socket.id);
  
  // 发送认证请求
  console.log('发送认证请求...');
  socket.emit('authenticate', {
    userId: 'test-user',
    token: null
  });
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket.IO断开连接:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket.IO连接错误:', error.message);
});

socket.on('authenticated', (data) => {
  console.log('✅ 认证成功:', data);
  
  // 测试AI请求
  console.log('测试AI生成请求...');
  socket.emit('AI_GENERATE_REQUEST', {
    requestId: 'test-' + Date.now(),
    type: 'generate',
    inputs: ['测试输入'],
    instruction: '这是一个测试请求'
  });
});

socket.on('error', (error) => {
  console.log('❌ Socket错误:', error);
});

socket.on('AI_GENERATE_PROGRESS', (data) => {
  console.log('📊 AI处理进度:', data);
});

socket.on('AI_GENERATE_RESPONSE', (data) => {
  console.log('✅ AI处理响应:', data);
  socket.disconnect();
  process.exit(0);
});

socket.on('AI_GENERATE_ERROR', (data) => {
  console.log('❌ AI处理错误:', data);
  socket.disconnect();
  process.exit(1);
});

// 监听所有事件
socket.onAny((eventName, data) => {
  console.log('📨 接收事件:', eventName, data);
});

// 超时处理
setTimeout(() => {
  console.log('⏰ 测试超时，断开连接');
  socket.disconnect();
  process.exit(1);
}, 30000);

console.log('等待连接...');