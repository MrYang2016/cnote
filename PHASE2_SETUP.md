# 🤖 Phase 2 设置指南 - AI Chat Assistant

## ✅ Phase 2 功能概览

**已实现的功能：**

1. ✅ **AI 聊天助手** - 基于 DeepSeek 的对话功能
2. ✅ **向量搜索** - 基于笔记内容的语义检索
3. ✅ **对话历史** - 自动保存和加载聊天记录
4. ✅ **上下文感知** - AI 可以引用您的笔记回答问题
5. ✅ **现代化 UI** - 美观的聊天界面

---

## 📋 设置步骤

### 步骤 1: 执行 Phase 2 数据库 Schema ⚠️

**重要**：在 Supabase SQL Editor 中执行 `supabase-schema-phase2.sql`

这将创建：
- `chat_messages` 表（聊天历史）
- `search_notes` RPC 函数（向量搜索）
- 必要的索引和 RLS 策略

**操作步骤：**

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard/project/uhzcrwwxtmlhzhtegvpt)
2. 点击左侧菜单的 **SQL Editor**
3. 点击 "New query"
4. 复制 `supabase-schema-phase2.sql` 的全部内容
5. 粘贴并点击 "Run"

### 步骤 2: 验证数据库

在 SQL Editor 中执行：

```sql
-- 验证 chat_messages 表
SELECT * FROM chat_messages LIMIT 1;

-- 验证 search_notes 函数
SELECT proname FROM pg_proc WHERE proname = 'search_notes';
```

如果没有错误，说明设置成功！

### 步骤 3: 测试 Chat 功能

1. **启动开发服务器**（如果还没运行）：
   ```bash
   npm run dev
   ```

2. **访问聊天页面**：
   - 登录后，点击侧边栏的 "Chat"
   - 或直接访问 http://localhost:3000/chat

3. **测试对话**：
   - 先创建几个笔记（如果还没有）
   - 然后在聊天中提问，例如：
     - "总结我的笔记内容"
     - "我在笔记中写了什么？"
     - "帮我找到关于 [主题] 的信息"

---

## 🎯 功能说明

### AI 助手能力

**✅ 可以做的：**
- 基于您的笔记回答问题
- 搜索和引用相关笔记内容
- 提供总结和见解
- 记住对话上下文（最近 6 条消息）
- 引用具体笔记来源

**❌ 不能做的：**
- 访问您没有的笔记
- 创建或修改笔记（仅查询）
- 访问互联网或外部信息

### 向量搜索工作原理

1. 用户提问
2. 系统将问题转换为向量嵌入
3. 在 `note_embeddings` 表中搜索相似内容
4. 找到最相关的 3 个笔记片段
5. 将这些片段作为上下文提供给 AI
6. AI 基于上下文生成回答

### 聊天历史管理

- ✅ 自动保存所有对话
- ✅ 页面刷新后保留历史
- ✅ 可以清空历史记录
- ✅ 每个用户独立的聊天记录

---

## 📊 数据库表结构

### chat_messages 表

```sql
id          uuid        -- 主键
user_id     uuid        -- 用户 ID（FK）
role        text        -- 'user' | 'assistant' | 'system'
content     text        -- 消息内容
created_at  timestamp   -- 创建时间
```

### search_notes RPC 函数

**输入参数：**
- `query_embedding` - 查询向量
- `match_threshold` - 相似度阈值（0.5）
- `match_count` - 返回结果数量（3）
- `user_id` - 用户 ID

**返回：**
- `note_id` - 笔记 ID
- `chunk_text` - 匹配的文本片段
- `similarity` - 相似度分数
- `note_title` - 笔记标题
- `note_content` - 完整笔记内容

---

## 🔧 API 端点

### POST /api/chat
发送消息并获取 AI 回复

**请求：**
```json
{
  "message": "你的问题"
}
```

**响应：**
```json
{
  "message": "AI 的回答",
  "context": [
    {
      "noteId": "uuid",
      "title": "笔记标题",
      "similarity": 0.85
    }
  ]
}
```

### GET /api/chat
获取聊天历史

**响应：**
```json
{
  "messages": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "role": "user",
      "content": "消息内容",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### DELETE /api/chat
清空聊天历史

**响应：**
```json
{
  "success": true
}
```

---

## 🎨 UI 组件

### ChatInterface
主聊天界面，包含：
- 消息历史滚动区域
- 输入框
- 发送按钮
- 清空历史按钮
- 加载状态

### MessageBubble
单条消息展示，包含：
- 用户/AI 头像
- 消息内容
- 时间戳
- 不同样式区分角色

---

## 💡 使用技巧

### 提高搜索准确性

1. **创建结构化笔记**
   - 使用清晰的标题
   - 分段落组织内容
   - 包含关键词

2. **提出具体问题**
   - ❌ "告诉我一些东西"
   - ✅ "我在笔记中关于项目管理写了什么？"

3. **利用上下文**
   - AI 会记住最近 6 条消息
   - 可以追问和深入讨论

### 清空历史的时机

- 开始新话题
- 历史记录过多
- 想要重新开始

---

## 🔍 故障排除

### 问题 1: AI 没有找到相关笔记

**原因：**
- 笔记还没有生成向量嵌入
- 相似度阈值过高
- 问题表述不够明确

**解决方案：**
- 确保笔记已保存（会自动生成嵌入）
- 尝试换个方式提问
- 确认 Doubao API 配额充足

### 问题 2: 聊天响应缓慢

**原因：**
- DeepSeek API 响应时间
- 向量搜索计算

**正常行为：**
- 通常 2-5 秒内响应
- 显示 "Thinking..." 加载状态

### 问题 3: 聊天历史加载失败

**检查：**
- 数据库 Schema 是否正确执行
- RLS 策略是否生效
- 浏览器控制台错误

---

## 📈 性能优化

### 已实现的优化

1. **向量搜索优化**
   - HNSW 索引（快速相似度搜索）
   - 限制返回结果（Top 3）
   - 相似度阈值过滤

2. **上下文管理**
   - 仅使用最近 6 条消息
   - 避免过长的上下文

3. **UI 优化**
   - 乐观更新（立即显示用户消息）
   - 自动滚动到最新消息
   - 加载状态指示

---

## 🚀 下一步

Phase 2 完成后，可以期待 **Phase 3**：

- 🤝 好友系统
- 🔗 笔记共享
- 🔌 MCP 服务器集成
- 👥 多人协作

---

## 📞 测试清单

- [ ] 执行 Phase 2 数据库 Schema
- [ ] 访问聊天页面
- [ ] 发送第一条消息
- [ ] 验证 AI 回复
- [ ] 测试笔记搜索功能
- [ ] 刷新页面验证历史保留
- [ ] 测试清空历史功能

---

**🎉 恭喜！Phase 2 实现完成！**

现在您拥有一个功能完整的 AI 笔记助手！

