#!/usr/bin/env node
/**
 * Docker 内部 WebSocket 心跳测试
 * 模拟客户端心跳行为
 */

const io = require('socket.io-client');

const WS_URL = process.env.WS_URL || 'http://gateway:8000';
const HEARTBEAT_INTERVAL = 30000; // 30秒
const TEST_DURATION = 120000; // 2分钟

console.log('=== WebSocket 心跳测试 ===');
console.log(`连接地址: ${WS_URL}`);
console.log(`心跳间隔: ${HEARTBEAT_INTERVAL / 1000}秒`);
console.log(`测试时长: ${TEST_DURATION / 1000}秒`);
console.log('---\n');

const socket = io(WS_URL, {
  autoConnect: false,
  timeout: 30000,
  forceNew: true
});

let heartbeatTimer = null;
let heartbeatCount = 0;
let pongCount = 0;
let startTime = Date.now();

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);

  console.log(`💓 启动心跳 (间隔: ${HEARTBEAT_INTERVAL}ms)`);

  heartbeatTimer = setInterval(() => {
    if (socket.connected) {
      heartbeatCount++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${elapsed}s] 💓 发送心跳 #${heartbeatCount}`);
      socket.emit('ping');
    }
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    console.log('💔 心跳已停止');
  }
}

socket.on('connect', () => {
  console.log(`✅ 连接成功 (Socket ID: ${socket.id})`);

  // 发送认证
  socket.emit('authenticate', {
    userId: 'heartbeat-test',
    token: null
  });
});

socket.on('authenticated', (data) => {
  console.log('🔐 认证成功:', data);
  console.log('');
  startHeartbeat();
});

socket.on('pong', () => {
  pongCount++;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[${elapsed}s] 🏓 收到 pong #${pongCount}`);
});

socket.on('disconnect', (reason) => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[${elapsed}s] ❌ 连接断开: ${reason}`);
  stopHeartbeat();
});

socket.on('connect_error', (error) => {
  console.error('🔴 连接错误:', error.message);
});

socket.on('error', (error) => {
  console.error('🔴 Socket错误:', error);
});

// 开始连接
console.log('🔌 开始连接...\n');
socket.connect();

// 测试结束
setTimeout(() => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n=== 测试结果 ===');
  console.log(`总运行时间: ${elapsed}秒`);
  console.log(`发送心跳: ${heartbeatCount} 次`);
  console.log(`接收pong: ${pongCount} 次`);
  console.log(`连接状态: ${socket.connected ? '✅ 已连接' : '❌ 已断开'}`);
  console.log('');

  if (socket.connected) {
    console.log('✅ 心跳机制工作正常，连接保持稳定');
  } else {
    console.log('❌ 连接已断开，心跳机制可能有问题');
  }

  stopHeartbeat();
  socket.disconnect();
  process.exit(socket.connected ? 0 : 1);
}, TEST_DURATION);

process.on('SIGINT', () => {
  console.log('\n⚠️  收到中断信号');
  stopHeartbeat();
  socket.disconnect();
  process.exit(0);
});
