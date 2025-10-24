# Function Calling 改造变更日志

## 📅 日期
2025-10-24

## 🎯 改造目标
将聊天功能从传统的 RAG（检索增强生成）模式改造为 **Function Calling** 模式，集成 Private MCP 和 Shared MCP，让 LLM 自主决定是否需要请求 MCP 工具。

## ✅ 修改的文件

### 1. `lib/llm/deepseek.ts`
**改动类型:** 功能增强

**新增内容:**
- 新增类型定义：`ToolCall`, `ChatCompletionResult`
- 新增函数：`generateChatCompletionWithTools()` - 支持 function calling
- 导入 OpenAI 类型：`ChatCompletionMessageParam`, `ChatCompletionTool`

**功能:**
- 支持将工具列表传递给 LLM
- 让 LLM 自主决定是否调用工具（`tool_choice: 'auto'`）
- 返回工具调用信息和响应内容

---

### 2. `app/api/chat/route.ts`
**改动类型:** 重大重构

**移除内容:**
- ❌ 向量嵌入生成（`generateEmbedding`）
- ❌ 向量相似度搜索（`searchSimilarNotes`）
- ❌ 固定的上下文拼接逻辑

**新增内容:**
- ✅ MCP 工具集成（private + shared）
- ✅ 工具格式转换函数：`convertMCPToolsToOpenAI()`
- ✅ 工具执行函数：`executeMCPTool()`
- ✅ 多轮对话循环（最多 5 轮）
- ✅ 并行工具调用支持

**工作流变化:**

**之前（RAG 模式）:**
```
用户提问 → 生成 embedding → 向量搜索 → 拼接上下文 → LLM 回答
```

**之后（Function Calling 模式）:**
```
用户提问 → LLM 决策 → [调用工具] → [获取结果] → LLM 整合回答
          ↓
    不需要查询时直接回答
```

**响应格式变化:**

之前:
```json
{
  "message": "...",
  "context": [...]
}
```

之后:
```json
{
  "message": "...",
  "toolCalls": [...]  // 可选
}
```

---

### 3. `app/api/mcp/shared/route.ts`
**改动类型:** Bug 修复

**修复内容:**
- 修正导入路径：`@/lib//shared-server` → `@/lib/mcp/shared-server`

---

## 🛠️ 集成的工具

### Private MCP 工具（个人笔记）
| 工具名 | 前缀后名称 | 功能 |
|--------|-----------|------|
| `search_notes` | `private_search_notes` | 搜索个人笔记 |
| `get_note` | `private_get_note` | 获取特定笔记详情 |
| `list_recent_notes` | `private_list_recent_notes` | 列出最近更新的笔记 |

### Shared MCP 工具（共享笔记）
| 工具名 | 前缀后名称 | 功能 |
|--------|-----------|------|
| `search_shared_notes` | `shared_search_shared_notes` | 搜索共享笔记 |
| `get_shared_note` | `shared_get_shared_note` | 获取特定共享笔记 |
| `list_shared_notes` | `shared_list_shared_notes` | 列出所有共享笔记 |
| `list_by_friend` | `shared_list_by_friend` | 按朋友筛选笔记 |

**总计: 7 个工具**

---

## 🎨 前端影响

**✅ 完全向后兼容 - 前端无需修改**

- API 返回的 `message` 字段保持不变
- 新增的 `toolCalls` 字段是可选的
- 现有的 `ChatInterface.tsx` 无需任何改动

---

## 📊 性能影响

### Token 消耗
- **简单对话:** 与之前相同
- **需要查询:** 增加 50%-100%（工具定义 + 工具结果）

### 响应延迟
- **简单对话:** 无影响（1 次 LLM 调用）
- **单次工具调用:** +1-2 秒（2 次 LLM 调用）
- **多轮推理:** +2-4 秒（3-5 次 LLM 调用）

### 准确性提升
- ✅ 只在需要时查询（减少噪音）
- ✅ LLM 自主选择最合适的工具
- ✅ 支持多步推理和深度查询

---

## 🔐 安全性

**保持不变:**
- ✅ 用户身份验证（Supabase Auth）
- ✅ RLS 权限控制（数据库层面）
- ✅ 个人笔记和共享笔记的访问隔离

**新增:**
- ✅ 工具调用错误隔离（单个工具失败不影响整体）
- ✅ 最大迭代限制（防止无限循环）

---

## 🐛 已知限制

1. **最大迭代次数:** 5 轮
   - 防止无限循环
   - 极少数复杂场景可能需要调整

2. **暂无流式响应:**
   - 当前实现不支持 streaming
   - 用户需要等待完整响应

3. **成本增加:**
   - 工具调用会增加 token 消耗
   - 建议监控 API 使用量

---

## 🧪 测试建议

### 必测场景
- ✅ 简单对话（不应触发工具调用）
- ✅ 搜索个人笔记
- ✅ 搜索共享笔记
- ✅ 同时搜索个人和共享笔记
- ✅ 获取特定笔记详情
- ✅ 列出最近笔记

### 建议测试
- 多轮对话上下文
- 工具调用失败处理
- 边界情况（无笔记、无权限等）

---

## 📚 新增文档

1. **FUNCTION_CALLING_IMPLEMENTATION.md** - 详细技术文档
   - 架构设计
   - 实现细节
   - 消息流格式
   - 优势对比

2. **FUNCTION_CALLING_QUICKSTART.md** - 快速入门指南
   - 使用示例
   - API 接口说明
   - 调试技巧
   - 常见问题

3. **CHANGELOG_FUNCTION_CALLING.md** - 本文件
   - 变更总结
   - 文件清单

---

## 🚀 下一步建议

### 短期优化
1. **流式响应** - 改善用户体验
2. **前端工具展示** - 显示 AI 查询了哪些笔记
3. **成本监控** - 添加 token 使用统计

### 长期优化
1. **工具结果缓存** - 减少重复查询
2. **并行执行优化** - 独立工具并行调用
3. **自定义工具** - 允许用户创建自定义查询工具

---

## 📝 回滚说明

如果需要回滚到 RAG 模式，需要恢复以下内容：

1. 恢复 `lib/llm/deepseek.ts` 到之前版本（移除 function calling 支持）
2. 恢复 `app/api/chat/route.ts` 到之前版本（重新启用向量搜索）
3. 修复 `app/api/mcp/shared/route.ts` 中的导入路径（保留修复）

建议在回滚前创建当前版本的分支备份。

---

## ✅ 验收检查清单

- [x] LLM 支持 function calling
- [x] 集成 Private MCP 工具
- [x] 集成 Shared MCP 工具
- [x] 工具格式转换正确
- [x] 多轮对话循环实现
- [x] 错误处理完善
- [x] 前端兼容性保持
- [x] 无 linting 错误
- [x] 导入路径修复
- [x] 文档完善

---

## 🎉 总结

本次改造成功将聊天系统从被动的上下文检索升级为主动的工具调用模式，显著提升了：

- **智能性:** LLM 自主决定查询策略
- **灵活性:** 7 种工具覆盖各种场景
- **准确性:** 基于实际需要的数据回答
- **可扩展性:** 易于添加新工具

同时保持了：

- **兼容性:** 前端无需修改
- **安全性:** 权限控制不变
- **稳定性:** 完善的错误处理

改造完成！🚀

