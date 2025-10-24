# AI Note System

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
- **向量化**: Doubao Embedding API (`doubao-embedding-text-240715`)
- **LLM**: DeepSeek (`deepseek-chat`)
- **UI**: Tailwind CSS + shadcn/ui + Lucide Icons
- **语言**: TypeScript

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

1. 复制环境变量示例文件：
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local` 文件，填入你的实际配置：
   ```env
   # Supabase 配置
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # AI 服务配置
   DOUBAO_API_KEY=your_doubao_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

3. 获取 Supabase 配置：
   - 登录 [Supabase](https://supabase.com) 控制台
   - 选择你的项目
   - 进入 Settings → API
   - 复制 Project URL 和 anon public key
   - 复制 service_role secret key

4. 获取 AI 服务 API Key：
   - **Doubao**: 访问 [豆包大模型](https://www.volcengine.com/product/doubao) 获取 API Key
     - 使用模型：`doubao-embedding-text-240715` (文本向量化)
   - **DeepSeek**: 访问 [DeepSeek](https://platform.deepseek.com) 获取 API Key
     - 使用模型：`deepseek-chat` (AI 聊天对话)

### 3. 设置 Supabase 数据库

**一键设置完整数据库：**
1. 登录 [Supabase](https://supabase.com) 控制台
2. 打开 SQL Editor
3. 执行 `supabase-schema-complete.sql` 中的完整 SQL 语句

> **说明**: `supabase-schema-complete.sql` 是完整的数据库架构文件，包含了所有功能模块和优化。

**这将创建完整的数据库结构：**

**基础表：**
- `profiles` 表（用户资料）
- `notes` 表（笔记）
- `note_embeddings` 表（向量化数据）

**聊天功能表：**
- `chat_messages` 表（聊天历史）

**好友系统表：**
- `friends` 表（好友关系）
- `friend_requests` 表（好友请求）

**笔记共享表：**
- `note_shares` 表（笔记共享）

**功能函数：**
- `search_notes()` - 向量搜索（支持共享笔记）
- `accept_friend_request()` - 接受好友请求
- `reject_friend_request()` - 拒绝好友请求
- `are_friends()` - 检查好友关系
- `get_friends_with_profiles()` - 获取好友列表
- `get_shared_notes()` - 获取共享笔记

**安全策略：**
- 完整的 Row Level Security (RLS) 策略
- 修复了 profiles 表的搜索权限
- 修复了重复好友问题

**性能优化：**
- 向量搜索索引 (HNSW)
- 基础查询索引
- 自动更新时间戳触发器

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
│   ├── llm/                      # LLM 集成 (DeepSeek)
│   ├── mcp/                      # MCP 服务器
│   └── utils/                    # 工具函数
├── middleware.ts                 # Next.js 中间件（认证）
├── .env.example                 # 环境变量示例文件
└── supabase-schema-complete.sql  # 完整数据库架构
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

## 数据库架构

### 架构文件

**数据库架构**: `supabase-schema-complete.sql` - 包含所有功能的完整数据库架构

### 核心表结构

#### profiles 表（用户资料）
```sql
id            uuid (PK, FK to auth.users)
username      text (unique)
display_name  text
created_at    timestamp
updated_at    timestamp
```

#### notes 表（笔记）
```sql
id          uuid (PK)
user_id     uuid (FK to profiles)
title       text
content     text
is_shared   boolean
created_at  timestamp
updated_at  timestamp
```

#### note_embeddings 表（向量嵌入）
```sql
id          uuid (PK)
note_id     uuid (FK to notes)
user_id     uuid (FK to profiles)
chunk_text  text
embedding   vector(1024)  -- Doubao embedding
chunk_index integer
created_at  timestamp
```

#### chat_messages 表（聊天消息）
```sql
id          uuid (PK)
user_id     uuid (FK to profiles)
role        text (user/assistant/system)
content     text
created_at  timestamp
```

#### friends 表（好友关系）
```sql
id          uuid (PK)
user_id     uuid (FK to profiles)
friend_id   uuid (FK to profiles)
created_at  timestamp
UNIQUE(user_id, friend_id)
CHECK (user_id != friend_id)
```

#### friend_requests 表（好友请求）
```sql
id            uuid (PK)
from_user_id  uuid (FK to profiles)
to_user_id    uuid (FK to profiles)
status        text (pending/accepted/rejected)
created_at    timestamp
updated_at    timestamp
UNIQUE(from_user_id, to_user_id)
CHECK (from_user_id != to_user_id)
```

#### note_shares 表（笔记共享）
```sql
id                   uuid (PK)
note_id              uuid (FK to notes)
owner_id             uuid (FK to profiles)
shared_with_user_id  uuid (FK to profiles)
permission           text (read/write)
created_at           timestamp
UNIQUE(note_id, shared_with_user_id)
CHECK (owner_id != shared_with_user_id)
```

### 关键函数

- `search_notes(query_embedding, match_threshold, match_count)` - 向量搜索（支持共享笔记）
- `accept_friend_request(request_id)` - 接受好友请求
- `reject_friend_request(request_id)` - 拒绝好友请求
- `are_friends(user1_id, user2_id)` - 检查好友关系
- `get_friends_with_profiles(user_id)` - 获取好友列表（修复重复问题）
- `get_shared_notes(user_id)` - 获取共享笔记

### 安全特性

- **Row Level Security (RLS)**: 所有表都启用了 RLS
- **权限控制**: 用户只能访问自己的数据和被授权的共享数据
- **好友验证**: 只有好友之间才能共享笔记
- **自动权限**: 通过函数确保数据操作的安全性

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

## 部署说明

### 数据库部署

**新项目部署:**
```sql
-- 在 Supabase SQL Editor 中执行
-- 使用 supabase-schema-complete.sql
```

### 环境变量配置

**必需的环境变量：**

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase 控制台 → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase 控制台 → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | Supabase 控制台 → Settings → API |
| `DOUBAO_API_KEY` | 豆包大模型 API Key | [豆包大模型平台](https://www.volcengine.com/product/doubao) |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | [DeepSeek 平台](https://platform.deepseek.com) |

**使用的模型：**
- **Doubao**: `doubao-embedding-text-240715` - 用于文本向量化，生成 1024 维向量
- **DeepSeek**: `deepseek-chat` - 用于 AI 聊天对话，支持中文和英文

**配置步骤：**
1. 复制 `.env.example` 到 `.env.local`
2. 填入上述环境变量的实际值
3. 重启开发服务器

> **注意**: `.env.local` 文件不会被提交到版本控制，请妥善保管你的 API Key。

## 路线图

- [x] Phase 1: 认证 & 笔记管理 ✅
- [x] Phase 2: AI 聊天助手 ✅
- [x] Phase 3: 好友系统 & MCP ✅
- [x] 数据库架构整合 ✅

**🎉 所有计划功能已完成！**

### 未来可能的扩展

- [ ] 笔记标签和分类
- [ ] 笔记模板
- [ ] 导出功能（PDF、Markdown）
- [ ] 移动端适配
- [ ] 实时协作编辑
- [ ] 接入第三方 MCP

## 许可证

MIT

## 技术支持

如有问题，请参考：
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
