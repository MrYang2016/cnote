# AI Note System - Phase 1

一个智能笔记系统，支持用户认证、笔记管理和自动向量化，为 AI 驱动的语义搜索做准备。

## 功能特性

### Phase 1 (已完成) ✅
- ✅ 用户注册/登录系统（基于用户名和密码）
- ✅ 笔记 CRUD 功能（创建、读取、更新、删除）
- ✅ 自动文本切割和向量化
- ✅ 向量数据存储到 Supabase
- ✅ 响应式 UI（Tailwind CSS + shadcn/ui）

### Phase 2 (已完成) ✅
- ✅ AI 聊天机器人（基于 DeepSeek）
- ✅ 基于向量搜索的笔记检索
- ✅ 聊天历史保存和管理
- ✅ 上下文感知的智能对话
- ✅ 自动引用相关笔记

### Phase 3 (已完成) ✅
- ✅ 好友系统（添加好友、管理好友请求）
- ✅ 笔记共享功能（选择性共享给好友）
- ✅ MCP 集成（Private & Shared MCP Server）
- ✅ AI 聊天增强（支持访问共享笔记）

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: Supabase (PostgreSQL + pgvector)
- **认证**: Supabase Auth
- **向量化**: Doubao Embedding API
- **LLM**: DeepSeek (Phase 2)
- **UI**: Tailwind CSS + shadcn/ui + Lucide Icons
- **语言**: TypeScript

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

环境变量已配置在 `.env.local`

### 3. 设置 Supabase 数据库

**Phase 1 数据库：**
1. 登录 [Supabase](https://supabase.com) 控制台
2. 打开 SQL Editor
3. 执行 `supabase-schema.sql` 中的 SQL 语句

**Phase 2 数据库（AI Chat）：**
1. 继续在 SQL Editor 中
2. 执行 `supabase-schema-phase2.sql` 中的 SQL 语句

**Phase 3 数据库（好友 & 共享）：**
1. 继续在 SQL Editor 中
2. 执行 `supabase-schema-phase3.sql` 中的 SQL 语句

这将创建：
- `profiles` 表（用户资料）
- `notes` 表（笔记）
- `note_embeddings` 表（向量化数据）
- `chat_messages` 表（聊天历史）
- `friends` 表（好友关系）
- `friend_requests` 表（好友请求）
- `note_shares` 表（笔记共享）
- `search_notes` RPC 函数（向量搜索，支持共享笔记）
- 辅助函数（接受/拒绝好友请求等）
- Row Level Security (RLS) 策略
- 向量搜索索引

### 4. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
cnote/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面
│   │   └── login/
│   ├── (dashboard)/              # 受保护的仪表板页面
│   │   ├── notes/                # 笔记页面
│   │   └── chat/                 # 聊天页面 (Phase 2)
│   ├── api/                      # API 路由
│   │   ├── auth/callback/        # 认证回调
│   │   └── notes/                # 笔记 API
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React 组件
│   ├── ui/                       # shadcn/ui 组件
│   ├── auth/                     # 认证组件
│   ├── notes/                    # 笔记组件
│   └── layout/                   # 布局组件
├── lib/                          # 工具库
│   ├── supabase/                 # Supabase 客户端
│   ├── db/                       # 数据库操作
│   ├── embeddings/               # 向量化工具
│   └── utils/                    # 工具函数
├── middleware.ts                 # Next.js 中间件（认证）
└── supabase-schema.sql          # 数据库 Schema
```

## 使用说明

### 注册/登录

1. 访问首页，自动跳转到登录页
2. 输入用户名
3. 系统自动检测：
   - 如果用户不存在 → 自动注册
   - 如果用户存在 → 登录
4. 成功后跳转到笔记列表页

### 管理笔记

- **查看笔记**: 在笔记列表页查看所有笔记
- **创建笔记**: 点击 "New Note" 按钮
- **编辑笔记**: 点击笔记卡片进入编辑页面
- **删除笔记**: 在编辑页面点击 "Delete" 按钮
- **共享笔记**: 在编辑页面点击 "Share" 按钮，选择好友和权限

### 自动向量化

每次创建或更新笔记时，系统会自动：
1. 将笔记内容分割成小块（chunk）
2. 为每个块生成向量嵌入（embedding）
3. 存储到 `note_embeddings` 表
4. 用于 AI 聊天的语义搜索

### AI 聊天助手 🤖 (Phase 2)

**访问聊天**: 点击侧边栏的 "Chat" 或访问 `/chat`

**功能：**
- 基于笔记内容回答问题
- 自动搜索和引用相关笔记
- 记住对话上下文（最近 6 条消息）
- 自动保存聊天历史

**使用技巧：**
- 提出具体问题："我关于 [主题] 写了什么？"
- 询问共享笔记："@alice 关于这个话题写了什么？"
- 要求总结："总结我和好友们的笔记内容"
- 深入讨论：AI 会记住之前的对话

### 好友系统 👥 (Phase 3)

**访问好友管理**: 点击侧边栏的 "Friends" 或访问 `/friends`

**功能：**
- 搜索并添加好友
- 接受/拒绝好友请求
- 管理好友列表
- 删除好友

**使用流程：**
1. 点击 "Add Friend" 按钮
2. 搜索用户名
3. 发送好友请求
4. 等待对方接受

### 笔记共享 🔗 (Phase 3)

**共享笔记给好友：**
1. 打开要共享的笔记
2. 点击 "Share" 按钮
3. 选择一个或多个好友
4. 设置权限（Read/Write）
5. 确认共享

**查看共享笔记：**
- 访问 `/shared` 页面
- 查看好友分享给你的笔记
- 根据权限查看或编辑

**权限说明：**
- **Read**: 只能查看笔记
- **Write**: 可以编辑笔记（但不能删除）

### MCP 服务器 🔌 (Phase 3)

**Private MCP** (`/api/mcp/private`)
- 访问个人笔记
- 搜索、列表、详情等工具
- 支持标准 MCP 协议

**Shared MCP** (`/api/mcp/shared`)
- 访问共享笔记
- 按好友筛选
- 权限保护

## API 路由

### 笔记 API

- `GET /api/notes` - 获取所有笔记
- `POST /api/notes` - 创建新笔记
- `GET /api/notes/[id]` - 获取单个笔记
- `PATCH /api/notes/[id]` - 更新笔记
- `DELETE /api/notes/[id]` - 删除笔记

### 聊天 API (Phase 2)

- `GET /api/chat` - 获取聊天历史
- `POST /api/chat` - 发送消息并获取 AI 回复（支持共享笔记搜索）
- `DELETE /api/chat` - 清空聊天历史

### 好友 API (Phase 3)

- `GET /api/friends?type=friends` - 获取好友列表
- `GET /api/friends?type=received` - 获取收到的好友请求
- `GET /api/friends?type=sent` - 获取发送的好友请求
- `GET /api/friends?type=search&query=...` - 搜索用户
- `POST /api/friends` - 发送好友请求
- `PATCH /api/friends` - 接受/拒绝/取消好友请求
- `DELETE /api/friends?friendId=...` - 删除好友

### 共享 API (Phase 3)

- `GET /api/shares?type=note&noteId=...` - 获取笔记的共享列表
- `GET /api/shares?type=shared-with-me` - 获取共享给我的笔记
- `GET /api/shares?type=access&noteId=...` - 检查笔记访问权限
- `POST /api/shares` - 共享笔记给好友
- `PATCH /api/shares` - 更新共享权限
- `DELETE /api/shares?shareId=...` - 取消共享

### MCP API (Phase 3)

- `GET /api/mcp/private` - Private MCP 服务器信息
- `POST /api/mcp/private` - Private MCP 调用
- `GET /api/mcp/shared` - Shared MCP 服务器信息
- `POST /api/mcp/shared` - Shared MCP 调用

### 认证 API

- `GET /api/auth/callback` - Supabase 认证回调

## 数据库 Schema

### profiles 表

```sql
id            uuid (PK, FK to auth.users)
username      text (unique)
display_name  text
created_at    timestamp
updated_at    timestamp
```

### notes 表

```sql
id          uuid (PK)
user_id     uuid (FK to profiles)
title       text
content     text
is_shared   boolean
created_at  timestamp
updated_at  timestamp
```

### note_embeddings 表

```sql
id          uuid (PK)
note_id     uuid (FK to notes)
user_id     uuid (FK to profiles)
chunk_text  text
embedding   vector(1024)
chunk_index integer
created_at  timestamp
```

### friends 表 (Phase 3)

```sql
id          uuid (PK)
user_id     uuid (FK to profiles)
friend_id   uuid (FK to profiles)
created_at  timestamp
```

### friend_requests 表 (Phase 3)

```sql
id            uuid (PK)
from_user_id  uuid (FK to profiles)
to_user_id    uuid (FK to profiles)
status        text (pending/accepted/rejected)
created_at    timestamp
updated_at    timestamp
```

### note_shares 表 (Phase 3)

```sql
id                   uuid (PK)
note_id              uuid (FK to notes)
owner_id             uuid (FK to profiles)
shared_with_user_id  uuid (FK to profiles)
permission           text (read/write)
created_at           timestamp
```

## 开发

### 添加新的 shadcn/ui 组件

```bash
npx shadcn@latest add [component-name]
```

### 运行 Linter

```bash
npm run lint
```

### 构建生产版本

```bash
npm run build
npm start
```

## 路线图

- [x] Phase 1: 认证 & 笔记管理 ✅
- [x] Phase 2: AI 聊天助手 ✅
- [x] Phase 3: 好友系统 & MCP ✅

**🎉 所有计划功能已完成！**

## 许可证

MIT

## 技术支持

如有问题，请参考：
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
