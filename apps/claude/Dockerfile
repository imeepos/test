# 使用 Ubuntu 作为基础镜像
FROM ubuntu:22.04

# 设置环境变量以避免软件包安装过程中的交互式提示
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

# 更新软件包列表并安装必要软件包
RUN apt-get update && apt-get install -y \
    openssh-server \
    sudo \
    curl \
    wget \
    vim \
    net-tools \
    iputils-ping \
    htop \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js (v20 LTS) 和 npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 安装 Docker
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 安装 Docker Compose
RUN curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 配置npm国内镜像源
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set cache /tmp/.npm

# 全局安装 pnpm 并配置国内镜像源
RUN npm install -g pnpm @anthropic-ai/claude-code --registry=https://registry.npmmirror.com

RUN pnpm config set node-linker hoisted

# 为所有用户全局安装 Context7 MCP 服务器
RUN claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ctx7sk-8da1dd3e-9f93-4fbf-8ade-d8ec823899b4"
# 设置 Anthropic 环境变量（运行时将被 docker-compose 覆盖）
ENV ANTHROPIC_AUTH_TOKEN=""
ENV ANTHROPIC_BASE_URL="https://api.anthropic.com"
ENV CONTEXT7_API_KEY=""
ENV PATH="/usr/local/bin:${PATH}"

# 设置默认密码环境变量（可以被覆盖）
ENV UBUNTU_PASSWORD="ubuntu123"
ENV ROOT_PASSWORD="root123"

# 首先创建具有 sudo 权限的用户
RUN useradd -m -s /bin/bash ubuntu && \
    echo "ubuntu:${UBUNTU_PASSWORD}" | chpasswd && \
    usermod -aG sudo ubuntu && \
    usermod -aG docker ubuntu

# 设置 pnpm store 目录和用户配置
RUN mkdir -p /root/.pnpm-store /home/ubuntu/.pnpm-store && \
    pnpm config set store-dir /root/.pnpm-store && \
    chown -R ubuntu:ubuntu /home/ubuntu/.pnpm-store && \
    su - ubuntu -c "pnpm config set registry https://registry.npmmirror.com" && \
    su - ubuntu -c "pnpm config set store-dir /home/ubuntu/.pnpm-store"

# 创建 SSH 目录并配置 SSH
RUN mkdir /var/run/sshd

# 为 root 和 ubuntu 用户创建 SSH 目录
RUN mkdir -p /root/.ssh /home/ubuntu/.ssh && \
    chmod 700 /root/.ssh /home/ubuntu/.ssh

# SSH known_hosts 将在运行时由 entrypoint.sh 设置
RUN chown -R ubuntu:ubuntu /home/ubuntu/.ssh

RUN mkdir /workspace
# 设置工作目录
WORKDIR /workspace

# 复制 .claude 文件夹和 CLAUDE.md 到工作区

# 为两个用户创建用户级别的 Claude 配置目录
RUN mkdir -p /root/.claude /home/ubuntu/.claude

# 设置工作区和用户配置的权限
RUN chown -R ubuntu:ubuntu /workspace && \
    chown -R ubuntu:ubuntu /home/ubuntu/.claude && \
    chmod 755 /root/.claude /home/ubuntu/.claude && \
    (chmod 644 /root/.claude/*.json 2>/dev/null || true) && \
    (chmod 644 /home/ubuntu/.claude/*.json 2>/dev/null || true)

# 允许 root 登录和密码验证（根据安全需要进行修改）
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    echo "root:${ROOT_PASSWORD}" | chpasswd

# 复制并配置入口脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 暴露 SSH 端口和应用端口
EXPOSE 22

# 使用入口脚本处理 SSH 密钥设置并启动 SSH 服务
ENTRYPOINT ["/entrypoint.sh"]