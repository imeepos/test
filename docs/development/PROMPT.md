 # 说明文档：README.md
# 设计文档：docs/architecture/mvp_plan.md
# 后端架构文档：docs/architecture/ARCHITECTURE.md


项目：@sker/studio
- 网关： @sker/gateway


分析各个自包及系统的依赖关系 关键节点添加 单元测试和集成测试 保证类型安全/数据安全/流程完整


## 请检查相关日志，确定问题原因，制定解决方案，修复错误

画布添加 一键删除失败的节点的功能

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
