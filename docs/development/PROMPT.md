 # 说明文档：README.md
# 设计文档：docs/architecture/mvp_plan.md
# 后端架构文档：docs/architecture/ARCHITECTURE.md


项目：@sker/studio
网关： @sker/gateway

检查一直定时put 更新数据的原因 这里不应该一直put才对
curl 'http://localhost:3000/api/v1/nodes/3fb399de-7b1b-47ae-b289-4d4fb998f9ed' \
  -X 'PUT' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzM2I0NDBjLWM1ZjAtNDZiZi1hMmViLTc5MmEyZDlkMmVlZSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHNrZXIuZGV2IiwiaWF0IjoxNzU5NDY0OTQ4LCJleHAiOjE3NjAwNjk3NDgsImF1ZCI6IkBza2VyL3N0dWRpbyIsImlzcyI6IkBza2VyL2dhdGV3YXkifQ.E1Nr7IwLV0mHWbvgWpozhDd8pIbi2fAr0GTTgSLYK0s' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -H 'Referer: http://localhost:3000/canvas?projectId=7274355a-76cd-4c4d-bc4d-50cba50e17e5' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0' \
  -H 'X-Request-ID: req-1759466975610-xncuymj5m' \
  -H 'sec-ch-ua: "Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  --data-raw '{"content":"","importance":3,"tags":[],"metadata":{"semantic":[],"editCount":1,"lastModified":"2025-10-03T04:49:35.601Z","autoSaved":true,"processingHistory":[]}}'

## BUG修复分析流程：

错误定位->检查相关日志->分析原因->制定最佳解决方案->处理错误->检查语法->构建重启
pnpm run --filter=@sker/xxx typecheck

从新构建重启
docker compose build xxx
docker compose up -d xxx 错误修复后，启动

我在 WSL2 的 Docker 环境中, 容器的端口映射可能无法直接从宿主机访问。让我从 Docker 网络内部 测试接口：
如果时接口，你自己验证，如果时界面，等用户验证反馈
curl gateway xxx 检查有无修复
