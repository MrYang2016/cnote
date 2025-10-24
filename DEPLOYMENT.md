# 部署指南

## Phase 1 完成状态 ✅

所有代码已实现并成功构建。现在需要完成最后两个步骤：

### 待完成步骤

1. **设置 Supabase 数据库** ⚠️ 必须
2. **端到端测试**

---

## 第一步：设置 Supabase 数据库

### 1. 登录 Supabase

访问 [Supabase Dashboard](https://supabase.com/dashboard)

### 2. 打开 SQL Editor

在你的项目中，找到左侧菜单的 **SQL Editor**

### 3. 执行数据库脚本

复制并执行项目根目录中的 `supabase-schema.sql` 文件内容。

这个脚本会：
- ✅ 启用 `pgvector` 扩展
- ✅ 创建 `profiles` 表（用户资料）
- ✅ 创建 `notes` 表（笔记）
- ✅ 创建 `note_embeddings` 表（向量数据）
- ✅ 设置 Row Level Security (RLS) 策略
- ✅ 创建必要的索引和触发器
- ✅ 创建向量相似度搜索索引

### 4. 验证表创建

执行完成后，在左侧菜单点击 **Table Editor**，确认以下表已创建：
- `profiles`
- `notes`
- `note_embeddings`

---

## 第二步：运行开发服务器

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动

---

## 第三步：端到端测试

### 1. 测试注册/登录

1. 访问 http://localhost:3000
2. 自动跳转到登录页
3. 输入任意用户名（例如：`testuser`）
4. 点击 "Continue"
5. 系统自动创建账户并登录
6. 跳转到笔记列表页

### 2. 测试笔记创建

1. 点击 "New Note" 按钮
2. 输入标题和内容
3. 可选：勾选 "Share this note with friends"
4. 点击 "Create Note"
5. 成功后跳转到笔记详情页

### 3. 验证向量化

在 Supabase Dashboard 中：

1. 打开 **SQL Editor**
2. 执行以下查询查看笔记：

```sql
SELECT id, title, content, is_shared, created_at 
FROM notes 
ORDER BY created_at DESC;
```

3. 执行以下查询验证向量嵌入已生成：

```sql
SELECT 
  ne.id,
  ne.chunk_text,
  ne.chunk_index,
  n.title as note_title
FROM note_embeddings ne
JOIN notes n ON ne.note_id = n.id
ORDER BY n.created_at DESC, ne.chunk_index ASC;
```

如果看到记录，说明向量化成功！

### 4. 测试笔记编辑

1. 在笔记列表页点击任意笔记
2. 修改标题或内容
3. 点击 "Update Note"
4. 系统会自动重新生成向量嵌入

### 5. 测试笔记删除

1. 在笔记详情页点击 "Delete" 按钮
2. 确认删除
3. 笔记及其向量嵌入会一起删除

---

## 功能检查清单

- [x] 用户注册/登录（基于用户名）
- [x] 自动创建用户资料
- [x] 创建笔记
- [x] 编辑笔记
- [x] 删除笔记
- [x] 自动文本分块
- [x] 自动生成向量嵌入
- [x] 向量数据存储到 Supabase
- [x] 响应式 UI
- [x] 笔记共享标记（为 Phase 3 准备）

---

## 常见问题

### Q: 构建失败怎么办？

A: 确保所有依赖已安装：
```bash
npm install
```

### Q: 登录后看不到笔记列表？

A: 检查：
1. `.env.local` 文件配置正确
2. Supabase 数据库表已创建
3. 浏览器控制台是否有错误

### Q: 创建笔记后没有生成向量嵌入？

A: 检查：
1. `DOUBAO_API_KEY` 和 `DOUBAO_BASE_URL` 配置正确
2. 查看终端日志是否有错误
3. 确认 Doubao API 配额足够

### Q: 如何查看详细日志？

A: 开发模式下，所有日志会输出到终端。查看：
- API 调用日志
- 向量化过程日志
- 数据库操作日志

---

## 生产部署

### 推荐平台：Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 设置环境变量（与 `.env.local` 相同）
4. 部署

### 环境变量设置

在 Vercel 项目设置中添加：

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
DEEPSEEK_API_KEY=your-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DOUBAO_API_KEY=your-key
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3/
```

---

## Phase 2 准备

Phase 1 已为 Phase 2 (AI Chat) 做好准备：

- ✅ 向量嵌入已存储
- ✅ pgvector 索引已创建
- ✅ UI 中已预留聊天入口（当前禁用）

要启用 Phase 2，需要：
1. 实现 DeepSeek LLM 集成
2. 实现向量搜索 API
3. 创建聊天界面
4. 实现对话历史存储

---

## 技术支持

遇到问题？检查：
1. [Next.js 文档](https://nextjs.org/docs)
2. [Supabase 文档](https://supabase.com/docs)
3. [shadcn/ui 文档](https://ui.shadcn.com)
4. 项目 README.md

