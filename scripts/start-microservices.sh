#!/bin/bash

# SKER微服务启动脚本
# 用于启动完整的微服务架构

set -e

echo "🚀 启动SKER微服务架构..."

# 检查Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 设置环境变量
if [ -f .env ]; then
    echo "📋 使用现有的 .env 文件"
else
    echo "📋 复制默认环境变量配置..."
    cp .env.microservices .env
fi

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose -f docker-compose.microservices.yml build

# 启动基础服务
echo "🗄️ 启动基础服务 (PostgreSQL, Redis, RabbitMQ)..."
docker-compose -f docker-compose.microservices.yml up -d postgres redis rabbitmq

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 检查数据库连接
echo "🔍 检查数据库连接..."
until docker-compose -f docker-compose.microservices.yml exec postgres pg_isready -U postgres; do
    echo "等待PostgreSQL启动..."
    sleep 2
done

until docker-compose -f docker-compose.microservices.yml exec redis redis-cli ping; do
    echo "等待Redis启动..."
    sleep 2
done

echo "✅ 基础服务已启动"

# 启动Store微服务
echo "🏪 启动Store微服务..."
docker-compose -f docker-compose.microservices.yml up -d store

# 等待Store启动
echo "⏳ 等待Store微服务启动..."
sleep 15

# 检查Store健康状态
echo "🔍 检查Store微服务健康状态..."
until curl -f http://localhost:3001/health &> /dev/null; do
    echo "等待Store微服务启动..."
    sleep 3
done

echo "✅ Store微服务已启动"

# 启动Broker微服务
echo "📡 启动Broker微服务..."
docker-compose -f docker-compose.microservices.yml up -d broker

# 启动Gateway微服务
echo "🌐 启动Gateway微服务..."
docker-compose -f docker-compose.microservices.yml up -d gateway

# 等待Gateway启动
echo "⏳ 等待Gateway微服务启动..."
sleep 15

# 检查Gateway健康状态
echo "🔍 检查Gateway微服务健康状态..."
until curl -f http://localhost:3000/health &> /dev/null; do
    echo "等待Gateway微服务启动..."
    sleep 3
done

echo "✅ Gateway微服务已启动"

# 启动Nginx反向代理
echo "🔄 启动Nginx反向代理..."
docker-compose -f docker-compose.microservices.yml up -d nginx

# 可选：启动监控服务
if [ "$1" = "--with-monitoring" ]; then
    echo "📊 启动监控服务..."
    docker-compose -f docker-compose.microservices.yml up -d prometheus grafana
fi

echo ""
echo "🎉 SKER微服务架构启动完成！"
echo ""
echo "📌 服务访问地址："
echo "   🌐 Gateway API: http://localhost"
echo "   🏪 Store API: http://localhost:3001"
echo "   📡 RabbitMQ管理界面: http://localhost:15672 (admin/admin)"
if [ "$1" = "--with-monitoring" ]; then
    echo "   📊 Grafana监控: http://localhost:3001 (admin/admin)"
    echo "   📈 Prometheus: http://localhost:9090"
fi
echo ""
echo "🔍 检查服务状态："
echo "   docker-compose -f docker-compose.microservices.yml ps"
echo ""
echo "📜 查看日志："
echo "   docker-compose -f docker-compose.microservices.yml logs -f [service-name]"
echo ""
echo "🛑 停止服务："
echo "   docker-compose -f docker-compose.microservices.yml down"
echo ""

# 显示服务状态
docker-compose -f docker-compose.microservices.yml ps