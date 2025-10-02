 # 说明文档：README.md
# 设计文档：docs/architecture/mvp_plan.md
# 后端架构文档：docs/architecture/ARCHITECTURE.md


项目：@sker/studio
- 网关： @sker/gateway


## 请检查相关日志，确定问题原因，制定解决方案，修复错误


现在的问题比较多，需要重新梳理架构问题，数据流向问题，职责单一问题，错误处理问题，状态同步问题，前后端数据一致性问题等


## 分析流程：

经过初步分析 broker/engine并没有收到相应消息

错误定位，分析原因，处理错误，检查语法
pnpm run --filter=@sker/xxx typecheck

从新构建重启
docker compose build xxx
docker compose up -d xxx 错误修复后，启动

我在 WSL2 的 Docker 环境中, 容器的端口映射可能无法直接从宿主机访问。让我从 Docker 网络内部 测试接口：
如果时接口，你自己验证，如果时界面，等用户验证反馈
curl gateway xxx 检查有无修复
