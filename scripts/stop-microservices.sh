#!/bin/bash

# SKER微服务停止脚本

set -e

echo "🛑 停止SKER微服务架构..."

# 停止所有服务
echo "📡 停止应用服务..."
docker-compose -f docker-compose.microservices.yml stop gateway broker nginx

echo "🏪 停止Store微服务..."
docker-compose -f docker-compose.microservices.yml stop store

echo "🗄️ 停止基础服务..."
docker-compose -f docker-compose.microservices.yml stop postgres redis rabbitmq

echo "📊 停止监控服务..."
docker-compose -f docker-compose.microservices.yml stop prometheus grafana

echo "🧹 清理容器..."
if [ "$1" = "--remove" ]; then
    echo "🗑️ 移除所有容器..."
    docker-compose -f docker-compose.microservices.yml down

    if [ "$2" = "--volumes" ]; then
        echo "🗑️ 移除所有数据卷..."
        docker-compose -f docker-compose.microservices.yml down -v
    fi
else
    docker-compose -f docker-compose.microservices.yml stop
fi

echo "✅ SKER微服务架构已停止"

if [ "$1" = "--remove" ]; then
    echo ""
    echo "📝 注意：所有容器已被移除"
    if [ "$2" = "--volumes" ]; then
        echo "⚠️  所有数据卷已被移除，数据已丢失！"
    else
        echo "💾 数据卷已保留，下次启动时数据将恢复"
    fi
fi

echo ""
echo "🔧 其他有用命令："
echo "   重新启动: ./scripts/start-microservices.sh"
echo "   查看状态: docker-compose -f docker-compose.microservices.yml ps"
echo "   查看日志: docker-compose -f docker-compose.microservices.yml logs"