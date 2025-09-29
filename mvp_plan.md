# 🚀 扩展式AI协作画布 - MVP开发计划

## 项目概述

**世界之初，一切虚无**

用户面对空白的无限画布，双击任意位置，输入一句话，AI生成内容，一个组件诞生。连线、运行、扩展，从虚无到万物，构建属于你的AI协作宇宙。

这是一个基于"文字生成文字"的极简AI协作平台，让思维在无限画布上自由流淌。

## 核心交互：从无到有的创造

### 宇宙创世循环

```
∅ 虚无画布 (道)
    ↓ 双击任意位置
🌱 第一个组件诞生 (道生一)
    ↓ 拖拽连线扩展
🌿 第二个组件诞生 (一生二)
    ↓ 右键创建空组件
⭕ 空组件等待融合 (二生三的准备)
    ↓ 连接到组件1和组件2
🔗 建立多输入关系
    ↓ 点击空组件的生成按钮
💭 [输入提示词] "融合以上两个分析，制定综合方案"
    ↓ AI处理多输入上下文
✨ 融合组件诞生 (二生三)
    ↓ 继续创建空组件
🌐 连接所有有用节点 (三生万物的准备)
    ↓ 全局上下文聚合
🔮 [输入提示词] "基于所有分析，制定完整解决方案"
    ↓ AI处理全局上下文
🌌 万物组件诞生 (三生万物)
    ↓ 无限递归创造
♾️ 宇宙生态完成
```

### 极简创建体验

**步骤1: 双击创世**
```
用户看到: ∅ 空白无限画布
用户行为: 双击画布任意位置
系统响应: 弹出输入框 "在此输入你的想法..."
```

**步骤2: 输入种子**
```
用户输入: "我想做一个电商网站"
用户按下: Enter键
系统响应: AI生成第一个组件内容
```

**步骤3: 连线扩展 (一生二)**
```
用户操作: 选中第一个组件，拖拽出连线到空白处
系统响应: 连线末端悬空，出现输入框
用户输入: "分析这个需求的技术架构"
用户确认: 按回车或点击确认
系统响应: AI基于 [前组件内容] + [用户提示词] 生成新组件
         新组件自动出现在连线末端，连线完成
```

**步骤4: 融合创造 (二生三)**
```
用户操作: 右键画布空白处，选择"创建空组件"
系统响应: 创建一个空白组件，等待内容生成
用户操作: 从组件1拖拽连线到空组件，从组件2也拖拽连线到空组件
系统响应: 空组件显示多个输入连接
用户操作: 点击空组件的▶️生成按钮
系统响应: 弹出输入框："如何处理这些输入内容？"
用户输入: "综合以上分析，制定产品MVP方案"
系统响应: AI基于 [组件1内容] + [组件2内容] + [用户提示词] 生成融合内容
         空组件填充内容，成为真正的融合组件
```

**步骤5: 万物生成 (三生万物)**
```
用户操作: 右键画布空白处，再次创建空组件（万物节点）
系统响应: 创建新的空白组件，准备接收全局输入
用户操作: 从画布上所有有价值的组件拖拽连线到万物节点
         - 连接原始需求组件
         - 连接技术方案组件  
         - 连接MVP方案组件
         - 连接用户分析组件
         - 连接资源评估组件...
系统响应: 万物节点显示："输入: 5个" 或更多连接数
用户操作: 点击万物节点的▶️生成按钮
系统响应: 弹出输入框："基于所有输入，你希望生成什么？"
用户输入: "基于所有分析，制定完整的产品开发执行计划"
系统响应: AI基于 [全部组件内容聚合] + [用户提示词] 生成最终方案
         万物节点成为包含完整解决方案的终极组件
         
结果展示: 一个包含完整产品规划的超级组件，整合了所有前期分析
```

**步骤6: 内容优化升级 (万物重生)**
```
用户操作: 双击任意已生成内容的组件
系统响应: 弹出输入框："如何优化这个内容？"
         同时显示当前组件的内容预览
用户输入: "增加更详细的技术实现细节" 或 "调整为面向C端用户的方案"
系统响应: AI基于 [当前组件内容] + [优化提示词] 重新生成内容
         组件内容更新，版本号+1
         保留历史版本供回滚
         
优化特性:
- 支持任意组件的内容优化
- 保持原有连线关系不变
- 版本管理和历史回滚
- 优化后可继续作为输入传递给下游组件
```

### 画布组件设计

**组件类型设计**：

**内容组件 (已生成)**：
- 📝 **内容区域**：显示AI生成或用户输入的内容
- 🔗 **输出连接点**：可以拖拽连线到其他组件
- ✏️ **编辑模式**：支持人工修改内容
- 🔄 **双击优化**：双击组件可重新生成内容
- 📋 **版本标识**：显示当前版本号 (v1, v2, v3...)

**空组件 (待生成)**：
- ⭕ **空白区域**：等待AI生成内容
- 🔗 **输入连接点**：可以接收多个输入连线
- ▶️ **生成按钮**：点击后输入提示词，AI融合生成内容
- 📊 **状态指示器**：显示输入连接数量和生成状态

**优化组件 (重生中)**：
- 🔄 **处理状态**：显示"正在优化..."动画
- 📝 **预览内容**：显示当前内容和优化提示词
- ↩️ **回滚按钮**：可以回到上一个版本
- 📈 **版本历史**：显示所有历史版本

### 创世画布演进

**阶段1: 虚无**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        ∅ 无限虚空                               │
│                                                                 │
│                    (双击任意位置开始创造)                        │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**阶段2: 第一个组件诞生**  
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   ┌─────────────┐                               │
│                   │ 🌱种子思想   │                               │
│                   │             │                               │
│                   │"我想做一个电 │                               │
│                   │商网站，主要  │                               │
│                   │面向小企业..."│                               │
│                   │ 📝[编辑]     │                               │
│                   └─────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**阶段2.5: 拖拽连线中**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   ┌─────────────┐                               │
│                   │ 🌱种子思想   │                               │
│                   │             │────────┐                     │
│                   │"我想做一个电 │        │                     │
│                   │商网站..."    │        │                     │
│                   │             │        ↓                     │
│                   │ 📝[编辑]     │    💭[分析需求]              │
│                   └─────────────┘    输入框激活                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**阶段3: 二生三的融合创造**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐                           │
│  │ 🎯需求分析   │────┐│ 🔧技术选型   │                           │
│  │             │    ││             │                           │
│  │• 用户注册登录 │    │• 前端: React │                           │
│  │• 商品展示   │    │• 后端: Node.js│                           │
│  │• 购物车     │    │• 数据库: PostgreSQL                      │
│  │• 订单管理   │    │• 支付: Stripe │                           │
│  │             │    ││             │                           │
│  └─────────────┘    │└─────────────┘                           │
│                     │        │                                │
│                     └────────┼──────┐                         │
│                              │      ↓                         │
│                              │  ⭕ 空组件                      │
│                              │  等待融合                      │
│                              │  输入: 2个                     │
│                              │  ▶️[生成]                      │
│                              │                                │
│  右键菜单:                   ↓                                │
│  ┌─────────────┐         用户点击生成                         │
│  │ 创建空组件   │         输入: "制定MVP方案"                  │
│  │ 复制       │                                              │
│  │ 粘贴       │             ↓ AI融合生成                     │
│  └─────────────┘         ✨ 融合组件诞生                      │
│                           包含综合MVP方案                     │
└─────────────────────────────────────────────────────────────────┘
```

**阶段4: 三生万物的终极整合**
```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│ │ 🎯需求分析   │  │ 🔧技术选型   │  │ 📋MVP方案   │               │
│ │• 用户画像   │  │• 前端架构   │  │• 核心功能   │               │
│ │• 核心需求   │  │• 后端设计   │  │• 开发计划   │               │
│ └─────────────┘  └─────────────┘  └─────────────┘               │
│        │                │               │                     │
│        └────────────────┼───────────────┼──────┐              │
│                         │               │      │              │
│ ┌─────────────┐        │               │      │              │
│ │ 💰资源评估   │────────│               │      │              │
│ │• 人力成本   │        │               │      │              │
│ │• 时间预算   │        │               │      │              │
│ └─────────────┘        │               │      │              │
│        │               │               │      │              │
│        └───────────────┼───────────────┼──────┼──────┐       │
│                        │               │      │      │       │
│ ┌─────────────┐       │               │      │      │       │
│ │ 📊市场分析   │───────│               │      │      │       │
│ │• 竞品分析   │       │               │      │      │       │
│ │• 用户反馈   │       │               │      │      │       │
│ └─────────────┘       │               │      │      │       │
│                       │               │      │      │       │
│                       └───────────────┼──────┼──────┼───────┐│
│                                       │      │      │       ││
│                                       ▼      ▼      ▼       ▼│
│                                   🌌 万物节点                │
│                                   终极整合者                │
│                                   输入: 5个                 │
│                                   ▶️[开始生成]              │
│                                                             │
│   用户输入: "制定完整的产品执行方案"                         │
│   AI输出: 包含完整开发路线图、团队配置、里程碑计划的终极方案   │
└─────────────────────────────────────────────────────────────────┘
```

### 组件状态管理

**状态类型**：
- ⏸️ **待运行**：组件内容已准备，等待点击运行
- 🔄 **运行中**：AI正在处理，显示加载动画
- 🟢 **已完成**：AI处理完成，内容已更新
- 🔴 **运行错误**：处理失败，显示错误信息
- ✏️ **编辑中**：用户正在手动编辑内容
- 🔄 **优化中**：AI正在根据优化提示词重新生成内容
- 📋 **已优化**：内容优化完成，版本号已更新

**状态流转**：
```
待运行 ──点击运行──→ 运行中 ──AI完成──→ 已完成
  ↑                              ↓
  └────── 用户编辑 ←──────────── 编辑中
                                 ↓ 双击优化
                              优化中 ──AI完成──→ 已优化
                                 ↓              ↓
                              运行错误 ←─────── 历史回滚
```

**版本管理**：
```
v1 (初始版本) → v2 (首次优化) → v3 (二次优化) → ...
     ↑              ↑              ↑
   [回滚]         [回滚]         [回滚]
```

## 技术架构设计

### 核心技术栈
```yaml
前端框架: React 18 + TypeScript
画布引擎: Konva.js + React-Konva
状态管理: Zustand (轻量级)
动画库: Framer Motion
实时通信: Socket.io
构建工具: Vite

后端框架: Node.js + Express + TypeScript  
数据库: PostgreSQL + Redis
AI集成: OpenAI GPT-4 API
消息队列: RabbitMQ + amqplib
部署: Docker + Docker Compose
```

### 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端画布应用   │◄──►│   后端API服务    │◄──►│   统一LLM服务    │
│  React + Konva  │    │ Express + WS    │    │ GPT-4 + 提示词  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
    ┌─────────┐         ┌─────────┐  ┌─────────┐  ┌─────────┐
    │  浏览器  │         │PostgreSQL│  │ RabbitMQ│  │  Redis  │
    │ 本地存储 │         │ 项目数据 │  │ 2个队列 │  │   缓存  │
    └─────────┘         └─────────┘  └─────────┘  └─────────┘
```

## RabbitMQ消息架构设计

### Agent消息处理机制

**简化的RabbitMQ架构**：
```yaml
消息队列拓扑:
  Exchange: llm.direct (Direct类型)
  
  队列设计:
    - llm.process.queue          # 统一LLM处理队列
    - result.notify.queue        # 结果通知队列

  消息格式:
    LLM处理消息:
      component_id: string      # 组件唯一ID
      context: string           # 收集的完整上下文内容
      user_prompt: string       # 用户的处理指令
```

### 消息流转设计

**连线创建组件的消息流 (一生二)**：
```
1. 用户拖拽连线到空白处
   → 前端显示悬空连线和输入框
   → 用户输入提示词并确认
   → 前端收集上下文:
     - 源组件的完整内容
     - 用户输入的提示词
   → 发送WebSocket消息到后端

2. 后端处理连线创建请求
   → 构造完整上下文: [源组件内容] + [用户提示词]
   → 发布到 llm.process.queue  
   → LLM Service基于上下文生成新组件内容
   → 发布结果到 result.notify.queue
   → 前端创建新组件，显示AI生成的内容，完成连线

3. 后续交互
   → 用户可以编辑新组件的内容
   → 可以从新组件继续拖拽连线扩展
   → 无限递归创造
```

**多输入融合组件的消息流 (二生三)**：
```
1. 用户右键画布空白处创建空组件
   → 前端创建空白组件，状态为"等待连接"
   → 显示空组件占位符和连接点

2. 用户连接多个输入组件
   → 从组件1拖拽连线到空组件
   → 从组件2拖拽连线到空组件  
   → 空组件显示输入连接数: "输入: 2个"

3. 用户点击空组件的生成按钮
   → 弹出输入框："如何处理这些输入内容？"
   → 用户输入融合提示词

4. 后端处理多输入融合请求
   → 收集所有输入组件的内容 (按order_index排序)
   → 构造融合上下文: 
     [组件1内容] + "\n\n---\n\n" + [组件2内容] + "\n\n---\n\n" + [用户提示词]
   → 发布到 llm.process.queue
   → LLM Service基于多输入上下文生成融合内容
   → 发布结果到 result.notify.queue
   → 空组件填充生成内容，状态变为"已生成"

5. 融合组件完成
   → 空组件变为真正的内容组件
   → 可以继续作为输入连接到其他组件
   → 支持继续编辑和扩展
```

**全局整合组件的消息流 (三生万物)**：
```
1. 用户创建万物节点
   → 右键画布空白处，创建空组件（万物节点）
   → 前端标识该组件为"全局整合节点"

2. 用户连接所有有价值的组件
   → 从需求分析组件拖拽连线到万物节点
   → 从技术方案组件拖拽连线到万物节点
   → 从MVP方案组件拖拽连线到万物节点
   → 从资源评估组件拖拽连线到万物节点
   → 从市场分析组件拖拽连线到万物节点...
   → 万物节点显示: "输入: 5个" 或更多

3. 用户点击万物节点的开始生成
   → 弹出输入框："基于所有输入，你希望生成什么？"
   → 用户输入全局整合提示词: "制定完整的产品执行方案"

4. 后端处理全局整合请求
   → 收集画布上所有连接的组件内容 (无数量限制)
   → 构造全局上下文: 
     [组件1] + "\n\n---\n\n" + [组件2] + "\n\n---\n\n" + ... + [组件N] + "\n\n===最终指令===\n\n" + [用户提示词]
   → 发布到 llm.process.queue (可能需要更长处理时间)
   → LLM Service基于完整全局上下文生成终极方案
   → 发布结果到 result.notify.queue
   → 万物节点填充完整解决方案

5. 终极组件诞生
   → 万物节点成为包含完整方案的超级组件
   → 整合了前期所有分析和思考
   → 提供可执行的完整解决方案
   → 用户的思维旅程从虚无到万物完成闭环
```

**内容优化重生的消息流 (万物重生)**：
```
1. 用户双击已完成的组件
   → 前端检测到双击事件
   → 弹出优化输入框："如何优化这个内容？"
   → 同时显示当前组件内容预览

2. 用户输入优化指令
   → 输入优化提示词："增加更详细的技术实现细节"
   → 前端发送优化请求到后端

3. 后端处理内容优化请求
   → 收集当前组件的完整内容
   → 构造优化上下文: 
     "当前内容:\n" + [组件当前内容] + "\n\n优化要求:\n" + [用户优化提示词]
   → 发布到 llm.process.queue (标记为优化类型)
   → LLM Service基于当前内容和优化要求生成新版本
   → 发布结果到 result.notify.queue

4. 组件内容更新
   → 保存当前版本到历史记录
   → 更新组件内容为AI优化后的版本
   → 版本号递增 (v1 → v2)
   → 保持所有连线关系不变
   → 如果该组件连接到其他组件，优化后的内容会自动传递

5. 持续优化能力
   → 用户可以继续双击进行多轮优化
   → 支持版本回滚到任意历史版本
   → 优化不影响画布布局和连线关系
   → 下游组件可以基于优化后的内容继续工作
```

### 统一LLM服务架构

**极简的LLM处理服务**：
```typescript

// 统一LLM处理服务
class LLMProcessingService {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  
  async initialize(): Promise<void> {
    this.connection = await amqp.connect(RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    
    await this.channel.assertExchange('llm.direct', 'direct');
    await this.channel.assertQueue('llm.process.queue');
    await this.channel.assertQueue('result.notify.queue');
    
    this.channel.consume('llm.process.queue', this.handleLLMMessage.bind(this));
  }
  
  private async handleLLMMessage(msg: amqp.ConsumeMessage): Promise<void> {
    try {
      const data = JSON.parse(msg.content.toString()) as {
        component_id: string;
        context: string;
        user_prompt: string;
      };
      
      const result = await this.processWithLLM(data);
      
      // 发布处理结果
      await this.channel.sendToQueue(
        'result.notify.queue',
        Buffer.from(JSON.stringify({
          component_id: data.component_id,
          result: result,
          timestamp: Date.now()
        }))
      );
      
      this.channel.ack(msg);
    } catch (error) {
      console.error('LLM处理错误:', error);
      // 发送错误状态
      await this.channel.sendToQueue(
        'result.notify.queue',
        Buffer.from(JSON.stringify({
          component_id: data.component_id,
          error: error.message,
          timestamp: Date.now()
        }))
      );
      this.channel.nack(msg, false, false);
    }
  }
  
  private async processWithLLM(data: any): Promise<any> {
    // 直接使用收集的上下文 + 用户提示词
    const prompt = `${data.context}\n\n---\n\n${data.user_prompt}`;
    
    // 调用OpenAI API进行处理
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  }
  
  // 多输入上下文收集逻辑
  private async collectMultiInputContext(componentId: string): Promise<string> {
    // 获取所有输入组件 (按连线顺序排序)
    const inputComponents = await this.getInputComponents(componentId);
    
    // 按order_index排序，用分隔符连接内容
    const contextParts = inputComponents
      .sort((a, b) => a.order_index - b.order_index)
      .map(comp => comp.content)
      .filter(content => content?.trim())  // 过滤空内容
      .join('\n\n---\n\n');
      
    return contextParts;
  }
  
  // 全局上下文收集逻辑 (三生万物)
  private async collectGlobalContext(componentId: string): Promise<string> {
    // 获取所有输入组件 (无数量限制)
    const inputComponents = await this.getInputComponents(componentId);
    
    // 如果输入超过一定数量，可能需要智能摘要或分组处理
    if (inputComponents.length > 10) {
      console.warn(`万物节点输入数量较多: ${inputComponents.length}个，可能影响处理时间`);
    }
    
    // 按order_index排序，构造全局上下文
    const contextParts = inputComponents
      .sort((a, b) => a.order_index - b.order_index)
      .map((comp, index) => {
        // 为每个组件添加标识，便于AI理解结构
        return `=== 组件${index + 1}: ${comp.title || '未命名'} ===\n${comp.content}`;
      })
      .filter(content => content?.trim())
      .join('\n\n');
      
    return contextParts;
  }
  
  // 内容优化处理逻辑 (万物重生)
  private async processOptimization(data: any): Promise<any> {
    // 构造优化上下文：当前内容 + 优化要求
    const optimizationPrompt = `当前内容:
${data.current_content}

优化要求:
${data.user_prompt}

请基于以上当前内容和优化要求，生成优化后的版本。保持核心逻辑不变，按照优化要求进行改进。`;
    
    // 调用OpenAI API进行优化处理
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: optimizationPrompt }
      ],
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  }
}
```

### 消息持久化和重试机制

**可靠性保证**：
```yaml
消息持久化:
  - 队列持久化: durable=true
  - 消息持久化: persistent=true
  - 确认机制: 手动ack

重试策略:
  - 死信队列: DLX for failed messages
  - 重试次数: max 3 times
  - 指数退避: 1s, 2s, 4s delays
  
监控指标:
  - 队列长度监控
  - 消息处理延迟
  - Agent健康状态
  - 错误率统计
```

## 简化数据模型设计

### MVP数据表设计 (无用户系统)

**项目表 (projects)**：
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
  canvas_data JSONB NOT NULL DEFAULT '{}',  -- 画布状态数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**组件表 (components)**：
```sql
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,                 -- 组件内容 (用户输入或AI生成)
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  status VARCHAR(20) DEFAULT 'pending',  -- pending/running/completed/error/optimizing
  version INTEGER DEFAULT 1,   -- 版本号，每次优化递增
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**连线关系表 (connections)**：
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  target_component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,  -- 连线顺序，用于多输入时的排序
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 确保同一项目内不能有重复连线
  UNIQUE(project_id, source_component_id, target_component_id)
);

-- 连线查询优化索引
CREATE INDEX idx_connections_target ON connections(target_component_id, order_index);
CREATE INDEX idx_connections_source ON connections(source_component_id);
CREATE INDEX idx_connections_project ON connections(project_id);
```

**AI处理记录表 (ai_logs)**：
```sql  
CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  input_context TEXT NOT NULL,    -- 输入的完整上下文
  output_result TEXT,             -- AI输出结果
  processing_type VARCHAR(20) DEFAULT 'generate',  -- generate/optimize/fusion/global
  status VARCHAR(20) DEFAULT 'processing',  -- processing/completed/failed
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**组件版本历史表 (component_versions)**：
```sql
CREATE TABLE component_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,          -- 该版本的内容
  optimization_prompt TEXT,       -- 优化时使用的提示词
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 确保同一组件的版本号唯一
  UNIQUE(component_id, version_number)
);

-- 版本查询优化索引
CREATE INDEX idx_component_versions_component ON component_versions(component_id, version_number DESC);
```

### 连线关系查询

**获取组件的所有输入**：
```sql
-- 查询某个组件的所有输入组件 (按连线顺序排序)
SELECT c.*, conn.order_index
FROM components c
JOIN connections conn ON c.id = conn.source_component_id
WHERE conn.target_component_id = $target_component_id
ORDER BY conn.order_index;
```

**获取组件的所有输出**：
```sql
-- 查询某个组件的所有输出组件
SELECT c.*
FROM components c
JOIN connections conn ON c.id = conn.target_component_id
WHERE conn.source_component_id = $source_component_id;
```

**上下文收集逻辑**：
```typescript
// 前端收集上下文的逻辑
async function collectContext(componentId: string): Promise<string> {
  // 获取所有输入组件
  const inputComponents = await getInputComponents(componentId);
  
  // 按order_index排序，直接拼接内容
  const contextParts = inputComponents
    .sort((a, b) => a.order_index - b.order_index)
    .map(comp => comp.content)
    .filter(content => content?.trim())  // 过滤空内容
    .join('\n\n---\n\n');
    
  return contextParts;
}

// 版本管理逻辑
async function saveComponentVersion(componentId: string, newContent: string, optimizationPrompt?: string): Promise<void> {
  // 获取当前组件信息
  const component = await getComponent(componentId);
  
  // 保存历史版本
  await createComponentVersion({
    component_id: componentId,
    version_number: component.version,
    content: component.content,
    optimization_prompt: optimizationPrompt
  });
  
  // 更新组件内容和版本号
  await updateComponent(componentId, {
    content: newContent,
    version: component.version + 1,
    updated_at: new Date()
  });
}

// 版本回滚逻辑
async function rollbackToVersion(componentId: string, targetVersion: number): Promise<void> {
  // 获取目标版本的内容
  const versionData = await getComponentVersion(componentId, targetVersion);
  
  if (!versionData) {
    throw new Error(`版本 ${targetVersion} 不存在`);
  }
  
  // 回滚到目标版本
  await updateComponent(componentId, {
    content: versionData.content,
    version: targetVersion,
    updated_at: new Date()
  });
}
```

**支持的连线模式**：
- ✅ **一对一**：一个输入 → 一个输出
- ✅ **一对多**：一个输入 → 多个输出 (分支处理)
- ✅ **多对一**：多个输入 → 一个输出 (融合处理)
- ✅ **多对多**：复杂的网状关系

### 连线关系示例

**复杂工作流示例**：
```
[原始需求] ──┐
             ├─→ [需求分析] ──┐
[用户反馈] ──┘               ├─→ [技术方案] ──┐
                             │               ├─→ [开发任务]
[技术限制] ──────────────────┘               │
                                             │
[资源限制] ──────────────────────────────────┘
```

**数据示例**：
```sql
-- components表数据 (纯内容驱动)
INSERT INTO components (id, title, content) VALUES
('uuid1', '原始需求', '需要实现用户登录功能，支持邮箱和手机号登录'),
('uuid2', '需求分析', '1. 功能分解：邮箱登录、手机登录、记住密码\n2. 业务规则：登录失败3次锁定\n3. 安全要求：密码加密存储'),
('uuid3', '技术方案', '1. 后端：Node.js + JWT\n2. 数据库：PostgreSQL用户表\n3. 前端：React登录组件'),
('uuid4', '开发任务', '1. 数据库设计 (2天)\n2. 后端API开发 (3天)\n3. 前端组件开发 (2天)\n4. 集成测试 (1天)');

-- connections表数据
INSERT INTO connections (source_component_id, target_component_id, order_index) VALUES
('uuid1', 'uuid2', 0),  -- 原始需求 → 需求分析
('uuid2', 'uuid3', 0),  -- 需求分析 → 技术方案  
('uuid3', 'uuid4', 0);  -- 技术方案 → 开发任务
```

这样设计的优势：
- 🔄 **灵活连线**：支持任意复杂的连线关系
- 📊 **有序输入**：order_index确保多输入时的处理顺序
- 🎯 **精确查询**：可以精确查询任何组件的输入输出关系
- 🚀 **性能优化**：通过索引优化连线查询性能

## 用户故事：从虚无到宇宙

### 创世第一天

**李明是一个创业者，他有一个想法但不知道如何开始实现...**

- 💻 李明打开浏览器，进入AI协作画布
- 👀 他看到一片纯粹的虚无——空白的无限画布
- 🖱️ 他双击画布中央，出现输入框："在此输入你的想法..."
- ⌨️ 他输入："我想做一个帮助小企业管理客户的SaaS产品"
- ⏎ 按下回车，AI开始工作...
- ✨ 第一个组件诞生，包含了对这个想法的初步分析

### 创世第二天

**李明开始扩展他的宇宙...**

- 🖱️ 他选中第一个组件，拖拽出一条连线到空白处
- 💭 连线悬空，输入框出现："在此输入你的指令..."
- ⌨️ 他输入："分析这个产品的目标用户和市场需求"
- ⏎ 按下回车，AI立即基于 [第一个组件内容 + 用户指令] 开始工作
- ✨ 新组件在连线末端诞生，包含详细的用户画像和市场分析
- 🔗 他继续从新组件拖拽连线："设计产品的核心功能模块"
- 🎨 又一个组件诞生，包含详细的功能规划

### 创世第三天

**宇宙开始形成复杂的结构...**

- 🌊 李明从多个组件拉出连线，汇聚到一个新组件
- 💬 他输入："基于以上分析，制定MVP开发计划"
- 🚀 AI综合所有上下文，生成了一个完整的MVP规划
- 🎯 他继续细化，创建技术架构、团队配置、资金预算等组件
- 🌌 渐渐地，一个完整的创业宇宙在画布上形成

### 第N天...

**李明的AI协作宇宙已经包含数百个组件，每个想法都能找到它的位置，每个决策都有清晰的推理链条。从最初的虚无，到现在的复杂生态，这就是思维的力量。**

## AI-人类循环协作流程

### 核心循环
```
1. 用户输入 → 2. AI扩展 → 3. 人类反馈 → 4. AI修复 → (回到2)
```

### 具体实现

**阶段1：需求扩展**
- 用户："用户登录功能"
- AI扩展：生成详细需求清单
- 人类反馈：标注遗漏或错误
- AI修复：补充完善需求

**阶段2：方案扩展**  
- AI：基于确认需求生成技术方案
- 人类反馈：技术选型建议
- AI修复：调整架构方案

**阶段3：任务扩展**
- AI：分解具体开发任务
- 人类反馈：工期和优先级调整
- AI修复：重新排期和分配

### 关键交互元素

**扩展按钮**：
- 每个卡片右下角有"扩展"按钮
- 点击后AI开始分析和生成
- 有加载动画显示AI思考过程

**反馈标签**：
- 用户可在任意内容旁边添加便签
- 便签颜色表示反馈类型：
  - 🟡 问题/疑虑
  - 🟢 确认/同意  
  - 🔵 建议/补充

**版本历史**：
- 每次AI修复都保留历史版本
- 用户可以回滚到之前的版本
- 显示修改diff对比

## 画布扩展动效设计

### 扩展动画
```
初始状态: [需求卡片] 120px高度
点击扩展: 
  1. 卡片底部出现加载条 (0.3s)
  2. AI思考动画 - 打字机效果 (1-3s)  
  3. 内容区域向下展开 (0.5s)
  4. 最终高度根据内容自适应
```

### 反馈动画
```
添加反馈:
  1. 便签从无到有渐显 (0.2s)
  2. 相关内容高亮闪烁 (0.5s)
  3. AI响应时整个卡片轻微脉动 (0.3s)
```

### 修复动画
```
AI修复:
  1. 原内容淡出 (0.3s)
  2. 新内容淡入 (0.3s) 
  3. 变更部分用不同颜色高亮 (1s后恢复)
```

## 📅 4周开发里程碑

### Week 1: 基础框架搭建 (基础画布 + 卡片系统)

**Day 1-2: 项目初始化**
- [ ] 前后端项目脚手架搭建
- [ ] 开发环境配置 (Docker + 热重载)
- [ ] RabbitMQ容器搭建和基础配置
- [ ] 基础CI/CD流水线设置
- [ ] 简化数据模型设计 (只需项目和卡片表)
- [ ] Agent消息队列拓扑设计

**Day 3-4: 画布核心引擎**
- [ ] Konva.js画布基础设置
- [ ] 拖拽、缩放、平移交互
- [ ] 画布坐标系统和边界处理
- [ ] 响应式画布适配

**Day 5-7: 创世体验设计**
- [ ] 双击画布创建第一个组件交互
- [ ] 第一个组件的AI生成逻辑
- [ ] 拖拽连线到空白处的交互
- [ ] 悬空连线状态和输入框显示
- [ ] 连线创建新组件的AI处理逻辑
- [ ] 上下文 [源组件内容 + 用户提示词] 传递机制

**Week 1 验收标准**:
- ✅ 双击空白画布能创建第一个组件
- ✅ 输入提示词后AI能生成初始内容
- ✅ 拖拽连线到空白处能显示输入框
- ✅ 输入提示词后能在连线末端生成新组件
- ✅ 画布交互流畅 (60fps)

### Week 2: AI扩展机制 (核心价值功能)

**Day 8-9: 简化LLM服务集成**
- [ ] RabbitMQ消息队列简化配置 (2个队列)
- [ ] OpenAI API集成和配置
- [ ] 角色化LLM处理服务实现
- [ ] 角色提示词设计 (需求分析师/技术架构师/项目经理等)
- [ ] 上下文直传机制实现

**Day 10-11: 运行交互逻辑**
- [ ] 点击运行按钮触发AI处理
- [ ] 上下文收集和传递机制
- [ ] AI生成内容的组件更新
- [ ] 运行状态动画和错误处理

**Day 12-14: 二生三融合机制**
- [ ] 右键创建空组件功能
- [ ] 多输入连线关系建立
- [ ] 多输入上下文收集和聚合逻辑
- [ ] 融合组件的AI处理流程
- [ ] 空组件到内容组件的状态转换

**Week 2 验收标准**:
- ✅ 拖拽连线能正确创建新组件 (一生二)
- ✅ 组件状态正确流转 (待运行→运行中→完成)
- ✅ 上下文能正确传递给AI
- ✅ AI生成内容能正确更新组件
- ✅ 右键能创建空组件，支持多输入连接 (二生三)
- ✅ 多输入融合能正确聚合上下文并生成内容

### Week 3: 协作体验优化 (用户体验完善)

**Day 15-16: 高级交互功能**
- [ ] 多轮对话历史显示
- [ ] 智能布局算法 (避免重叠)
- [ ] 画布元素关系可视化
- [ ] 快捷键和手势支持

**Day 17-18: 数据持久化**
- [ ] 画布状态保存和加载 (本地存储)
- [ ] 卡片内容自动保存
- [ ] 项目导出功能 (JSON格式)
- [ ] 离线编辑支持

**Day 19-21: UI/UX 抛光**
- [ ] 视觉设计优化
- [ ] 微交互动效完善
- [ ] 响应式布局适配
- [ ] 无障碍访问支持

**Week 3 验收标准**:
- ✅ 用户体验流畅自然
- ✅ 数据可靠保存和同步
- ✅ 界面美观专业

### Week 4: 测试部署上线 (产品化准备)

**Day 22-23: 系统测试**
- [ ] 单元测试覆盖 (>80%)
- [ ] 集成测试完整场景
- [ ] 性能测试和优化
- [ ] 兼容性测试

**Day 24-25: 部署准备**
- [ ] 生产环境配置
- [ ] 监控告警设置
- [ ] 备份恢复方案
- [ ] 安全加固配置

**Day 26-28: 发布上线**
- [ ] Beta版本发布
- [ ] 用户反馈收集
- [ ] 问题修复迭代
- [ ] 正式版本发布

**Week 4 验收标准**:
- ✅ 系统稳定可用
- ✅ 性能指标达标
- ✅ 用户反馈积极

## 💰 资源投入估算

### 人力资源配置
```yaml
团队规模: 3-4人
项目周期: 4周 (160工时)

角色分配:
  前端开发 (1人): 
    - 画布引擎开发
    - 交互动效实现
    - UI/UX优化
    工时占比: 40% (64工时)

  后端开发 (1人):
    - API服务开发  
    - AI Agent集成
    - 数据库设计
    工时占比: 35% (56工时)

  全栈开发 (1人):
    - 前后端联调
    - 部署运维
    - 测试优化
    工时占比: 25% (40工时)

  产品/设计 (0.5人):
    - 交互设计
    - 用户测试
    - 产品优化
    工时占比: 选择性投入
```

### 技术成本
```yaml
开发工具: 免费开源
云服务 (测试阶段):
  - 服务器: $30/月 (1核2G，无需用户系统)
  - RabbitMQ: $15/月 (CloudAMQP基础版)
  - Redis缓存: $10/月 (画布状态缓存)
  - CDN: $10/月
  
AI API费用:
  - OpenAI GPT-4: $0.03/1K tokens
  - 预估月用量: $100-200
  
总月度成本: ~$165-265
```

### 风险评估
```yaml
技术风险 (中等):
  - 画布性能优化挑战
  - AI响应质量不稳定
  - 实时协作同步复杂度

时间风险 (低):
  - 功能范围明确
  - 技术栈成熟稳定
  - 可降级实现方案

资源风险 (低):
  - 团队规模适中
  - 技能栈匹配度高
```

## ✅ MVP验收标准

### 核心功能验收
```yaml
画布基础能力:
  - ✅ 支持无限滚动和缩放 (最小10%,最大500%)
  - ✅ 流畅拖拽交互 (延迟<16ms, 60fps)
  - ✅ 响应式适配 (支持1200px-4K分辨率)

扩展协作机制:
  - ✅ 需求卡片成功扩展为技术方案 (成功率>90%)
  - ✅ 人类反馈触发AI修正 (响应时间<5秒)  
  - ✅ 支持多轮对话细化 (至少3轮)

数据质量:
  - ✅ AI生成内容专业性 (专家评分>4/5)
  - ✅ 扩展内容完整性 (覆盖80%预期要点)
  - ✅ 反馈修正准确性 (符合预期>85%)
```

### 性能指标
```yaml
响应性能:
  - 画布交互延迟: <16ms
  - AI扩展响应: <5秒
  - 页面加载时间: <3秒

稳定性能:
  - 系统可用性: >99%
  - 错误率: <1%
  - 数据丢失率: 0%

用户体验:
  - 学习成本: <10分钟上手
  - 任务完成率: >80%
  - 用户满意度: >4/5分
```

### 业务价值验证
```yaml
效率提升:
  - 需求分析时间: 减少60%
  - 方案设计时间: 减少40%  
  - 任务分解时间: 减少70%

质量保证:
  - 需求遗漏率: <10%
  - 方案一致性: >90%
  - 任务颗粒度合理性: >85%

用户反馈:
  - 愿意推荐给同事: >70%
  - 认为有价值: >80%
  - 愿意付费使用: >50%
```

## 🎯 开发优先级

### P0 (必须实现)
1. 基础画布和卡片系统
2. AI扩展核心逻辑
3. 人类反馈机制
4. 数据持久化

### P1 (重要优化)
1. 动画效果和交互优化
2. 智能布局算法
3. 性能优化
4. 错误处理

### P2 (如果有时间)
1. 预设模板系统
2. 高级导出功能 (PDF/Word)
3. 快捷键和热键
4. 高级自定义主题

## MVP核心价值验证

### 验证指标
1. **循环完成率**：用户是否会进行多轮AI-人类反馈
2. **细化深度**：从需求到最终任务经过几轮扩展
3. **修正准确性**：AI根据人类反馈的修正是否符合预期

### 差异化优势
- 🔄 **动态协作**：不是静态生成，而是持续优化
- 🌱 **有机增长**：内容像植物一样自然扩展  
- 🎯 **精准迭代**：基于具体反馈的针对性改进

这个开发计划既保证了MVP的核心价值实现，又为后续迭代留下了扩展空间。4周时间可以产出一个真正可用的产品原型，验证扩展式AI-人类协作的产品理念。