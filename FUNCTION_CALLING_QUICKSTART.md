# Function Calling 快速入门

## 🎯 改造完成

聊天系统已成功从 RAG 模式升级为 **Function Calling 模式**，集成了 Private MCP 和 Shared MCP 工具。

## ✅ 已完成的工作

### 1. 核心功能实现

- ✅ `lib/llm/deepseek.ts` - 添加 function calling 支持
- ✅ `app/api/chat/route.ts` - 重构为 function calling 架构
- ✅ `app/api/mcp/shared/route.ts` - 修复导入路径

### 2. 集成的 MCP 工具

**Private MCP (个人笔记) - 3 个工具:**
```
private_search_notes         - 搜索个人笔记
private_get_note             - 获取特定笔记
private_list_recent_notes    - 列出最近笔记
```

**Shared MCP (共享笔记) - 4 个工具:**
```
shared_search_shared_notes   - 搜索共享笔记
shared_get_shared_note       - 获取特定共享笔记
shared_list_shared_notes     - 列出所有共享笔记
shared_list_by_friend        - 按朋友筛选共享笔记
```

### 3. 智能特性

- ✅ LLM 自主决定是否调用工具
- ✅ 支持多工具并行调用
- ✅ 支持多轮对话和深度推理
- ✅ 智能错误处理和容错
- ✅ 防止无限循环（最多 5 轮）

## 🔄 工作流程

```
用户提问
    ↓
LLM 分析问题
    ↓
需要查询笔记？
    ├─ 否 → 直接回答
    └─ 是 → 选择合适的工具
            ↓
         调用 MCP 工具
            ↓
         获取笔记数据
            ↓
       需要更多信息？
         ├─ 是 → 继续调用工具（最多5轮）
         └─ 否 → 整合信息并回答
```

## 📝 使用示例

### 示例 1: 智能对话（不调用工具）

**用户:** 你好，今天天气不错

**AI 响应:**
- 不调用任何工具
- 直接友好回复

**API 返回:**
```json
{
  "message": "你好！确实是个好天气。我可以帮你管理笔记，有什么需要帮助的吗？"
}
```

---

### 示例 2: 搜索个人笔记

**用户:** 我有关于 Python 的笔记吗？

**AI 行为:**
1. 调用 `private_search_notes` 工具，参数 `{"query": "Python"}`
2. 获取搜索结果
3. 基于结果生成回答

**API 返回:**
```json
{
  "message": "是的，我找到了 2 篇关于 Python 的笔记：\n\n1. Python 基础教程 - 更新于 2 天前\n2. Python 数据分析 - 更新于 1 周前\n\n需要查看具体内容吗？",
  "toolCalls": [
    {
      "tool": "private_search_notes",
      "result": {
        "results": [
          {
            "id": "note-123",
            "title": "Python 基础教程",
            "excerpt": "Python 是一种...",
            "updated_at": "2025-10-22"
          }
        ]
      }
    }
  ]
}
```

---

### 示例 3: 搜索共享笔记

**用户:** Alice 分享给我的关于 React 的笔记

**AI 行为:**
1. 调用 `shared_list_by_friend` 工具，参数 `{"friendUsername": "alice"}`
2. 从结果中筛选包含 "React" 的笔记
3. 或者调用 `shared_search_shared_notes` 并根据 owner 筛选

**API 返回:**
```json
{
  "message": "找到了 Alice (@alice) 分享给你的 1 篇关于 React 的笔记：\n\n「React Hooks 最佳实践」\n这篇笔记介绍了...",
  "toolCalls": [
    {
      "tool": "shared_list_by_friend",
      "result": {...}
    }
  ]
}
```

---

### 示例 4: 多工具调用

**用户:** 总结我所有关于机器学习的笔记，包括朋友分享的

**AI 行为:**
1. **同时调用两个工具:**
   - `private_search_notes` → 查找个人笔记
   - `shared_search_shared_notes` → 查找共享笔记
2. 整合两个来源的结果
3. 生成综合总结

**API 返回:**
```json
{
  "message": "关于机器学习，我找到了以下内容：\n\n**你的笔记 (3篇):**\n1. 机器学习入门\n2. ...\n\n**共享笔记 (2篇):**\n1. 深度学习基础 (by @bob)\n2. ...\n\n总结：...",
  "toolCalls": [
    {
      "tool": "private_search_notes",
      "result": {...}
    },
    {
      "tool": "shared_search_shared_notes",
      "result": {...}
    }
  ]
}
```

---

### 示例 5: 多轮推理

**用户:** 显示我最新的笔记详情

**AI 行为:**
1. **第 1 轮:** 调用 `private_list_recent_notes` 获取最近笔记列表
2. **第 2 轮:** 从结果中获取最新笔记的 ID
3. **第 3 轮:** 调用 `private_get_note` 获取完整内容
4. 展示详细信息

**API 返回:**
```json
{
  "message": "你最新的笔记是「Next.js 13 新特性」：\n\n[完整内容显示]\n\n这篇笔记创建于 10月20日，最后更新于 10月23日。",
  "toolCalls": [
    {
      "tool": "private_list_recent_notes",
      "result": {...}
    },
    {
      "tool": "private_get_note",
      "result": {...}
    }
  ]
}
```

## 🚀 API 接口

### POST /api/chat

**请求:**
```json
{
  "message": "用户的问题或消息"
}
```

**响应:**
```json
{
  "message": "AI 的回复内容",
  "toolCalls": [  // 可选，仅在使用了工具时返回
    {
      "tool": "工具名称",
      "result": { /* 工具返回的结果 */ }
    }
  ]
}
```

**响应字段说明:**
- `message` (string, 必需) - AI 生成的回复内容
- `toolCalls` (array, 可选) - 使用的工具及其返回结果，用于调试和透明度

## 🔧 配置检查

确保以下环境变量已正确配置：

```env
# DeepSeek API
DEEPSEEK_API_KEY=sk-xxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Supabase (用于数据访问)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🎨 前端兼容性

✅ **完全向后兼容** - 前端无需修改

现有的 `ChatInterface` 组件会继续正常工作，因为：
- API 仍然返回 `message` 字段
- 新增的 `toolCalls` 字段是可选的
- 前端只使用 `data.message`，忽略其他字段

如果想在前端显示工具调用信息（增强透明度），可以选择性地使用 `toolCalls` 数据。

## 📊 性能考虑

### Token 使用

Function Calling 模式可能会消耗更多 tokens：

**传统 RAG 模式:**
```
System Prompt (with context) + User Message + History
≈ 1000-2000 tokens per request
```

**Function Calling 模式:**
```
System Prompt + Tool Definitions + User Message + History
+ Tool Results (if called) + Follow-up LLM calls
≈ 1500-4000 tokens per request (when tools are used)
```

### 延迟

- **简单对话:** 延迟与之前相同（1 次 LLM 调用）
- **需要工具:** 增加延迟（2-6 次 LLM 调用 + 工具执行时间）
- **典型场景:** 2-3 秒（包含 1-2 个工具调用）

### 优势

- ✅ 只在需要时查询数据（节省不必要的查询）
- ✅ 更精确的信息检索（LLM 选择最佳工具）
- ✅ 更准确的回答（基于实际需要的数据）

## 🐛 调试

### 查看工具调用历史

在开发环境中，检查 API 响应的 `toolCalls` 字段：

```javascript
const response = await fetch('/api/chat', { ... });
const data = await response.json();

console.log('AI Response:', data.message);
console.log('Tools Used:', data.toolCalls);
```

### 服务器日志

后端会记录工具调用错误：

```
Tool execution error: [错误详情]
```

### 常见问题

**Q: AI 总是不调用工具？**
- 检查系统提示词是否正确
- 确保工具列表正确传递给 LLM
- 尝试更明确的问题（如 "搜索我的笔记..." 而不是 "告诉我..."）

**Q: 工具调用失败？**
- 检查用户是否已登录
- 确保 MCP 服务器正常运行
- 检查数据库连接

**Q: 响应太慢？**
- 可能触发了多轮工具调用
- 检查 `toolCalls` 数组长度
- 考虑优化系统提示词，减少不必要的工具调用

## 🎯 测试建议

### 基础测试

```bash
# 1. 测试简单对话（不应调用工具）
POST /api/chat
{ "message": "你好" }

# 2. 测试搜索个人笔记
POST /api/chat
{ "message": "搜索我的笔记中关于 TypeScript 的内容" }

# 3. 测试搜索共享笔记
POST /api/chat
{ "message": "查看朋友分享给我的笔记" }

# 4. 测试多工具调用
POST /api/chat
{ "message": "总结所有关于 React 的笔记，包括我自己的和朋友分享的" }
```

### 高级测试

```bash
# 5. 测试多轮推理
POST /api/chat
{ "message": "找到我最近的笔记，然后显示详细内容" }

# 6. 测试错误处理
POST /api/chat
{ "message": "显示笔记 invalid-id-12345" }
```

## 📚 相关文档

- [详细实现文档](./FUNCTION_CALLING_IMPLEMENTATION.md) - 技术细节和架构设计
- [MCP 规范](https://modelcontextprotocol.io/) - Model Context Protocol 标准

## 🎉 总结

你的聊天系统现在具备了：

✅ **智能决策** - LLM 自主判断何时需要查询笔记  
✅ **灵活查询** - 7 种不同的工具覆盖各种查询场景  
✅ **深度推理** - 支持多步查询和复杂问题  
✅ **双向访问** - 同时支持个人笔记和共享笔记  
✅ **错误容错** - 优雅处理工具调用失败  
✅ **完全兼容** - 前端无需任何修改  

开始体验智能笔记助手吧！🚀

