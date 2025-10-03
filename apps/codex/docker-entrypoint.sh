#!/bin/bash

# 设置错误处理
set -e

echo "启动容器配置..."

# 如果提供了 Git 配置，设置全局配置
if [ ! -z "$GIT_USER_NAME" ]; then
    git config --global user.name "$GIT_USER_NAME"
    echo "已设置 Git 用户名: $GIT_USER_NAME"
fi

if [ ! -z "$GIT_USER_EMAIL" ]; then
    git config --global user.email "$GIT_USER_EMAIL"
    echo "已设置 Git 邮箱: $GIT_USER_EMAIL"
fi

# 为 ubuntu 用户也设置 Git 配置
if [ ! -z "$GIT_USER_NAME" ] && [ ! -z "$GIT_USER_EMAIL" ]; then
    sudo -u ubuntu git config --global user.name "$GIT_USER_NAME"
    sudo -u ubuntu git config --global user.email "$GIT_USER_EMAIL"
    echo "已为 ubuntu 用户配置 Git 信息"
fi

# 显示 Git 配置信息
echo "当前 Git 配置:"
git config --global --list | grep -E "(user.name|user.email)" || echo "未配置 Git 用户信息"

# 更新用户密码（如果环境变量中提供了新密码）
if [ ! -z "$UBUNTU_PASSWORD" ]; then
    echo "ubuntu:$UBUNTU_PASSWORD" | chpasswd
    echo "已更新 ubuntu 用户密码"
fi

if [ ! -z "$ROOT_PASSWORD" ]; then
    echo "root:$ROOT_PASSWORD" | chpasswd
    echo "已更新 root 用户密码"
fi

chown ubuntu:ubuntu -R /workspace
chmod 755 /var/run/docker.sock
chmod -R 755 /workspace
# 只对特定文件设置权限，避免对 node_modules 递归
[ -f /workspace/CLAUDE.md ] && chmod 644 /workspace/CLAUDE.md
[ -f /workspace/package.json ] && chown ubuntu:ubuntu /workspace/package.json
[ -f /workspace/pnpm-lock.yaml ] && chown ubuntu:ubuntu /workspace/pnpm-lock.yaml

# 配置 Claude CLI 环境变量（添加到用户的 .bashrc）
echo "配置 Claude CLI 环境变量..."
if [ ! -z "$ANTHROPIC_AUTH_TOKEN" ]; then
    # 为 root 用户添加到 .bashrc
    echo "export ANTHROPIC_AUTH_TOKEN=\"$ANTHROPIC_AUTH_TOKEN\"" >> /root/.bashrc
    if [ ! -z "$ANTHROPIC_BASE_URL" ]; then
        echo "export ANTHROPIC_BASE_URL=\"$ANTHROPIC_BASE_URL\"" >> /root/.bashrc
        echo "已为 root 用户设置自定义 API 地址: $ANTHROPIC_BASE_URL"
    fi

    # 为 ubuntu 用户添加到 .bashrc
    echo "export ANTHROPIC_AUTH_TOKEN=\"$ANTHROPIC_AUTH_TOKEN\"" >> /home/ubuntu/.bashrc
    if [ ! -z "$ANTHROPIC_BASE_URL" ]; then
        echo "export ANTHROPIC_BASE_URL=\"$ANTHROPIC_BASE_URL\"" >> /home/ubuntu/.bashrc
        echo "已为 ubuntu 用户设置自定义 API 地址: $ANTHROPIC_BASE_URL"
    fi

    chown ubuntu:ubuntu /home/ubuntu/.bashrc
    echo "Claude CLI 环境变量配置完成"
else
    echo "警告: 未设置 ANTHROPIC_API_KEY 环境变量"
fi

# 添加常见的 Git 主机到 known_hosts（在运行时执行以确保网络可用）
echo "配置 SSH known_hosts..."
ssh-keyscan -t rsa github.com >> /root/.ssh/known_hosts 2>/dev/null || echo "警告: 无法添加 github.com 到 known_hosts"
ssh-keyscan -t rsa gitlab.com >> /root/.ssh/known_hosts 2>/dev/null || echo "警告: 无法添加 gitlab.com 到 known_hosts"
ssh-keyscan -t rsa bitbucket.org >> /root/.ssh/known_hosts 2>/dev/null || echo "警告: 无法添加 bitbucket.org 到 known_hosts"

# 复制到 ubuntu 用户的 SSH 目录
if [ -f /root/.ssh/known_hosts ]; then
    cp /root/.ssh/known_hosts /home/ubuntu/.ssh/known_hosts 2>/dev/null || true
    chown ubuntu:ubuntu /home/ubuntu/.ssh/known_hosts 2>/dev/null || true
fi

echo "容器配置完成，启动 SSH 服务..."

# 启动 SSH 服务
exec /usr/sbin/sshd -D