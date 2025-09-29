#!/bin/bash

# SKER微服务测试脚本

set -e

echo "🧪 测试SKER微服务架构..."

# 检查服务是否运行
echo "🔍 检查服务状态..."

# 检查Store服务
echo "  - 检查Store服务 (http://localhost:3001)..."
if curl -f http://localhost:3001/health &> /dev/null; then
    echo "    ✅ Store服务正常运行"
    STORE_RUNNING=true
else
    echo "    ❌ Store服务未运行"
    STORE_RUNNING=false
fi

# 检查Gateway服务
echo "  - 检查Gateway服务 (http://localhost:3000)..."
if curl -f http://localhost:3000/health &> /dev/null; then
    echo "    ✅ Gateway服务正常运行"
    GATEWAY_RUNNING=true
else
    echo "    ❌ Gateway服务未运行"
    GATEWAY_RUNNING=false
fi

# 检查Nginx代理
echo "  - 检查Nginx代理 (http://localhost)..."
if curl -f http://localhost/health &> /dev/null; then
    echo "    ✅ Nginx代理正常运行"
    NGINX_RUNNING=true
else
    echo "    ❌ Nginx代理未运行"
    NGINX_RUNNING=false
fi

echo ""

# API功能测试
if [ "$STORE_RUNNING" = true ]; then
    echo "🔬 测试Store API..."

    # 测试健康检查
    echo "  - 测试健康检查..."
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
    if echo "$HEALTH_RESPONSE" | grep -q '"success":true'; then
        echo "    ✅ 健康检查正常"
    else
        echo "    ❌ 健康检查失败"
    fi

    # 测试系统信息
    echo "  - 测试系统信息..."
    VERSION_RESPONSE=$(curl -s http://localhost:3001/api/system/version)
    if echo "$VERSION_RESPONSE" | grep -q '"success":true'; then
        echo "    ✅ 系统信息正常"
    else
        echo "    ❌ 系统信息失败"
    fi

    # 测试用户API (无认证)
    echo "  - 测试用户API..."
    USERS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3001/api/v1/users)
    if echo "$USERS_RESPONSE" | grep -q "401"; then
        echo "    ✅ 用户API正确要求认证"
    elif echo "$USERS_RESPONSE" | grep -q "200"; then
        echo "    ✅ 用户API响应正常"
    else
        echo "    ❌ 用户API响应异常"
    fi
fi

if [ "$GATEWAY_RUNNING" = true ]; then
    echo ""
    echo "🔬 测试Gateway API..."

    # 测试健康检查
    echo "  - 测试健康检查..."
    GATEWAY_HEALTH=$(curl -s http://localhost:3000/health)
    if echo "$GATEWAY_HEALTH" | grep -q '"status":"healthy"'; then
        echo "    ✅ Gateway健康检查正常"
    else
        echo "    ❌ Gateway健康检查失败"
    fi
fi

if [ "$NGINX_RUNNING" = true ]; then
    echo ""
    echo "🔬 测试Nginx代理..."

    # 测试通过代理访问API
    echo "  - 测试代理到Gateway..."
    PROXY_HEALTH=$(curl -s http://localhost/health)
    if echo "$PROXY_HEALTH" | grep -q "healthy"; then
        echo "    ✅ Nginx代理正常工作"
    else
        echo "    ❌ Nginx代理失败"
    fi
fi

echo ""

# 性能测试
if [ "$STORE_RUNNING" = true ]; then
    echo "⚡ 简单性能测试..."
    echo "  - 测试Store API响应时间..."

    # 使用curl测量响应时间
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3001/health)
    echo "    Store API响应时间: ${RESPONSE_TIME}s"

    if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
        echo "    ✅ 响应时间良好"
    else
        echo "    ⚠️  响应时间较慢"
    fi
fi

echo ""

# 连接测试
echo "🔗 连接测试..."

# 测试数据库连接
if [ "$STORE_RUNNING" = true ]; then
    echo "  - 测试数据库连接..."
    DB_STATUS=$(curl -s http://localhost:3001/api/system/dependencies)
    if echo "$DB_STATUS" | grep -q '"status":"healthy"'; then
        echo "    ✅ 数据库连接正常"
    else
        echo "    ❌ 数据库连接异常"
    fi
fi

echo ""

# 总结
echo "📊 测试总结:"
if [ "$STORE_RUNNING" = true ]; then
    echo "  ✅ Store微服务: 正常"
else
    echo "  ❌ Store微服务: 异常"
fi

if [ "$GATEWAY_RUNNING" = true ]; then
    echo "  ✅ Gateway微服务: 正常"
else
    echo "  ❌ Gateway微服务: 异常"
fi

if [ "$NGINX_RUNNING" = true ]; then
    echo "  ✅ Nginx代理: 正常"
else
    echo "  ❌ Nginx代理: 异常"
fi

echo ""

if [ "$STORE_RUNNING" = true ] && [ "$GATEWAY_RUNNING" = true ]; then
    echo "🎉 微服务架构测试通过！"
    echo ""
    echo "🔗 可用的服务端点:"
    echo "  - Gateway API: http://localhost:3000"
    echo "  - Store API: http://localhost:3001"
    echo "  - Nginx代理: http://localhost"
    exit 0
else
    echo "❌ 微服务架构测试失败"
    echo ""
    echo "💡 请检查服务是否正确启动:"
    echo "  ./scripts/start-microservices.sh"
    exit 1
fi