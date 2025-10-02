 # 说明文档：README.md
# 设计文档：docs/architecture/mvp_plan.md
# 后端架构文档：docs/architecture/ARCHITECTURE.md


项目：@sker/studio
- 网关： @sker/gateway


分析各个自包及系统的依赖关系 关键节点添加 单元测试和集成测试 保证类型安全/数据安全/流程完整


## 请检查相关日志，确定问题原因，制定解决方案，修复错误




根据docs/architecture/mvp_plan.md设计文档
我觉的协议应该进行下面几点的修改

1. 不应该有：AITaskType 所有类型都是平等的结构，任务不应该有类型，不应该区别对待，不应该内置任何提示词，统一context+prompt生成文字，其中context是上下文信息，prompt是用户输入
2. 协议层应该是平台无关的职责单一的,前端/后端/微服务等公用的 规范制定/协议制定
3. 协议应该是类型安全的

```
type EventKey<T> = string & { __type?： T}；
const DemoEventKey： EventKey<DemoEvent>;
const EventOn = (key: EventKey<T>, event: T)=>{}
```


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
