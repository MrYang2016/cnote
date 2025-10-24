# Function Calling 实现文档

## 概述

将聊天功能从传统的 RAG（检索增强生成）模式改造为 **Function Calling** 模式，集成 Private MCP 和 Shared MCP 工具，让 LLM 自主决定是否需要调用工具来获取笔记信息。

## 改动内容

### 1. DeepSeek LLM 客户端增强 (`lib/llm/deepseek.ts`)

#### 新增类型定义

```typescript
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionResult {
  content: string | null;
  toolCalls?: ToolCall[];
  finishReason: string;
}
```

#### 新增函数

```typescript
export async function generateChatCompletionWithTools(
  messages: ChatCompletionMessageParam[],
  tools: ChatCompletionTool[],
  systemPrompt?: string
): Promise<ChatCompletionResult>
```

**功能特点：**
- 支持 OpenAI Function Calling 格式
- `tool_choice: 'auto'` - 让模型自主决定是否使用工具
- 返回工具调用信息和 LLM 响应内容

### 2. 聊天路由改造 (`app/api/chat/route.ts`)

#### 架构变化

**之前（RAG 模式）：**
```
用户提问 → 生成 embedding → 向量搜索笔记 → 拼接上下文 → LLM 回答
```

**现在（Function Calling 模式）：**
```
用户提问 → LLM 决策 → 调用工具（如果需要）→ 获取工具结果 → LLM 整合回答
```

#### 核心功能

1. **工具注册**
   - 集成 Private MCP 的 3 个工具
   - 集成 Shared MCP 的 4 个工具
   - 自动转换 MCP 格式为 OpenAI Function Calling 格式

2. **工具列表**

**Private Tools (个人笔记):**
- `private_search_notes` - 搜索个人笔记
- `private_get_note` - 获取特定笔记详情
- `private_list_recent_notes` - 列出最近更新的笔记

**Shared Tools (共享笔记):**
- `shared_search_shared_notes` - 搜索共享笔记
- `shared_get_shared_note` - 获取特定共享笔记
- `shared_list_shared_notes` - 列出所有共享笔记
- `shared_list_by_friend` - 列出特定朋友分享的笔记

3. **智能工具调用流程**

```typescript
// 1. 初始 LLM 调用，提供所有可用工具
response = await generateChatCompletionWithTools(messages, tools, systemPrompt);

// 2. 循环处理工具调用（最多 5 轮）
while (response.toolCalls && iterations < maxIterations) {
  // 2.1 执行所有工具调用
  toolResults = await Promise.all(
    response.toolCalls.map(toolCall => executeMCPTool(...))
  );
  
  // 2.2 将工具结果添加到对话历史
  messages.push(...toolResults);
  
  // 2.3 再次调用 LLM，让它基于工具结果回答
  response = await generateChatCompletionWithTools(messages, tools);
}
```

4. **错误处理**
   - 每个工具调用都有独立的错误处理
   - 工具执行失败时，错误信息会传递给 LLM
   - 限制最大迭代次数防止无限循环

#### 系统提示词

新的系统提示词明确告知 LLM：
- 可以访问哪些工具
- 何时应该使用工具
- 如何处理工具返回的信息
- 如何引用信息来源

### 3. 修复导入路径 (`app/api/mcp/shared/route.ts`)

修复了 shared MCP 路由中的导入路径错误：
```typescript
// 之前：from '@/lib//shared-server'
// 之后：from '@/lib/mcp/shared-server'
```

## 优势对比

### 传统 RAG 模式的问题

1. **总是执行搜索** - 即使用户问题不需要查询笔记
2. **固定搜索策略** - 只能向量搜索，无法灵活选择
3. **上下文限制** - 需要在初始就塞入所有可能相关的内容
4. **缺乏交互性** - 无法根据初步结果进一步查询

### Function Calling 的优势

1. **按需查询** - LLM 自主判断是否需要查询笔记
   ```
   用户："你好" → LLM 直接回复，不调用工具
   用户："我的笔记里有什么关于 Python 的内容？" → LLM 调用工具搜索
   ```

2. **智能工具选择** - LLM 根据问题选择最合适的工具
   ```
   "最近的笔记" → 调用 list_recent_notes
   "朋友分享的关于 AI 的笔记" → 调用 search_shared_notes
   "显示笔记 123" → 调用 get_note
   ```

3. **多步推理** - 可以基于第一次查询结果进行深入查询
   ```
   第1轮：搜索找到相关笔记 ID
   第2轮：获取具体笔记详情
   第3轮：基于详情内容回答用户
   ```

4. **精确性** - 只获取真正需要的信息，减少噪音

5. **透明性** - 返回工具调用历史，用户可以知道 AI 查询了什么

## 使用示例

### 场景 1: 简单问候（不需要工具）

**用户输入：**
```
你好
```

**LLM 行为：**
- 不调用任何工具
- 直接友好回复

**响应：**
```json
{
  "message": "你好！我是你的笔记助手。有什么可以帮你的吗？",
  "toolCalls": undefined
}
```

### 场景 2: 搜索个人笔记

**用户输入：**
```
我有关于机器学习的笔记吗？
```

**LLM 行为：**
1. 调用 `private_search_notes` 搜索 "机器学习"
2. 基于搜索结果回答

**响应：**
```json
{
  "message": "是的，我找到了 3 篇关于机器学习的笔记：\n1. 机器学习基础...\n2. ...",
  "toolCalls": [
    {
      "tool": "private_search_notes",
      "result": { "results": [...] }
    }
  ]
}
```

### 场景 3: 搜索个人和共享笔记

**用户输入：**
```
关于 React 的所有笔记，包括朋友分享的
```

**LLM 行为：**
1. 同时调用 `private_search_notes` 和 `shared_search_shared_notes`
2. 整合两个来源的结果
3. 清晰标注来源

**响应：**
```json
{
  "message": "我找到了关于 React 的笔记：\n\n个人笔记：\n1. React Hooks 教程\n\n共享笔记：\n1. React 性能优化（由 @alice 分享）",
  "toolCalls": [
    { "tool": "private_search_notes", "result": {...} },
    { "tool": "shared_search_shared_notes", "result": {...} }
  ]
}
```

### 场景 4: 多步查询

**用户输入：**
```
显示我最近的笔记，然后告诉我第一篇的详细内容
```

**LLM 行为：**
1. 第1轮：调用 `private_list_recent_notes`
2. 第2轮：从结果中获取第一篇笔记的 ID
3. 第3轮：调用 `private_get_note` 获取详细内容
4. 整合回答

## 技术细节

### 工具格式转换

MCP Tool Schema → OpenAI Function Calling Schema

```typescript
// MCP Format
{
  name: 'search_notes',
  description: 'Search personal notes',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query']
  }
}

// 转换后的 OpenAI Format
{
  type: 'function',
  function: {
    name: 'private_search_notes',
    description: 'Search personal notes',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  }
}
```

### 消息流格式

```typescript
// 第1轮：用户提问
messages = [
  { role: 'user', content: '搜索机器学习笔记' }
]

// 第2轮：LLM 决定调用工具
messages = [
  { role: 'user', content: '搜索机器学习笔记' },
  { 
    role: 'assistant', 
    content: null,
    tool_calls: [{ id: 'call_1', function: { name: 'private_search_notes', arguments: '{"query":"机器学习"}' } }]
  }
]

// 第3轮：添加工具执行结果
messages = [
  ...,
  { 
    role: 'tool',
    tool_call_id: 'call_1',
    content: '{"results":[...]}'
  }
]

// 第4轮：LLM 基于工具结果生成最终回答
```

## 配置要求

确保环境变量配置正确：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

## 注意事项

1. **最大迭代限制** - 设置为 5 轮，防止无限循环
2. **错误容错** - 单个工具失败不会中断整个流程
3. **性能考虑** - 多轮调用会增加延迟，但提供了更准确的结果
4. **成本** - Function calling 可能增加 API 调用次数和 token 消耗

## 后续优化建议

1. **流式响应** - 实现 streaming 支持，改善用户体验
2. **工具缓存** - 对频繁调用的工具结果进行缓存
3. **并行调用优化** - 当 LLM 决定调用多个独立工具时，可以并行执行
4. **用户反馈** - 在前端显示工具调用过程，增加透明度
5. **成本监控** - 添加 token 使用统计和成本追踪

## 测试建议

1. **基础对话测试** - 确保不需要工具的对话正常工作
2. **单工具调用** - 测试每个工具的独立调用
3. **多工具调用** - 测试同时调用多个工具
4. **多轮对话** - 测试需要多步推理的场景
5. **错误处理** - 测试工具调用失败的情况
6. **边界情况** - 测试超过最大迭代次数的情况

## 总结

这次改造将聊天系统从被动的上下文拼接升级为主动的工具调用模式，赋予了 LLM 更大的自主性和灵活性。用户可以用更自然的方式查询笔记，而 AI 会智能地决定如何最好地满足用户需求。

