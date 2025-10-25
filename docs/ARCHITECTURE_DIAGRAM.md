# AI Note System - 架构设计图

## 系统整体架构

```mermaid
graph TB
    subgraph "前端层 (Frontend)"
        A[Next.js 16 App Router]
        B[React Components]
        C[Tailwind CSS + shadcn/ui]
        D[AuthProvider]
    end

    subgraph "中间件层 (Middleware)"
        E[Next.js Middleware]
        F[Supabase Auth Session]
    end

    subgraph "API层 (API Routes)"
        G[Notes API]
        H[Chat API]
        I[Friends API]
        J[Shares API]
        K[MCP API]
    end

    subgraph "业务逻辑层 (Business Logic)"
        L[Notes Management]
        M[Vectorization Engine]
        N[AI Chat Engine]
        O[Friends System]
        P[Sharing System]
        Q[MCP Servers]
    end

    subgraph "数据层 (Data Layer)"
        R[Supabase PostgreSQL]
        S[Vector Database]
        T[Auth Users]
    end

    subgraph "外部服务 (External Services)"
        U[Doubao Embedding API]
        V[DeepSeek Chat API]
    end

    A --> E
    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    F --> K
    
    G --> L
    H --> N
    I --> O
    J --> P
    K --> Q
    
    L --> M
    M --> U
    N --> V
    N --> Q
    
    L --> R
    O --> R
    P --> R
    Q --> R
    M --> S
    F --> T
```

## 用户操作流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant M as 中间件
    participant A as API
    participant B as 业务逻辑
    participant D as 数据库
    participant E as 外部API

    Note over U,E: 用户注册/登录流程
    U->>F: 输入用户名
    F->>M: 发送认证请求
    M->>D: 检查用户存在性
    D-->>M: 返回用户信息
    M->>D: 创建/更新用户会话
    D-->>M: 返回会话信息
    M-->>F: 重定向到仪表板
    F-->>U: 显示笔记列表

    Note over U,E: 创建笔记流程
    U->>F: 创建新笔记
    F->>A: POST /api/notes
    A->>B: 创建笔记
    B->>D: 保存笔记数据
    D-->>B: 返回笔记ID
    B->>B: 异步生成向量
    B->>E: 调用Doubao API
    E-->>B: 返回向量数据
    B->>D: 保存向量嵌入
    A-->>F: 返回创建成功
    F-->>U: 显示新笔记

    Note over U,E: AI聊天流程
    U->>F: 发送聊天消息
    F->>A: POST /api/chat
    A->>B: 处理聊天请求
    B->>D: 获取聊天历史
    B->>B: 准备MCP工具
    B->>E: 调用DeepSeek API
    E-->>B: 返回AI响应
    B->>D: 保存聊天记录
    A-->>F: 返回AI回复
    F-->>U: 显示AI回复
```

## 数据库架构

```mermaid
erDiagram
    profiles {
        uuid id PK
        text username UK
        text display_name
        timestamp created_at
        timestamp updated_at
    }

    notes {
        uuid id PK
        uuid user_id FK
        text title
        text content
        boolean is_shared
        timestamp created_at
        timestamp updated_at
    }

    note_embeddings {
        uuid id PK
        uuid note_id FK
        uuid user_id FK
        text chunk_text
        vector embedding
        integer chunk_index
        timestamp created_at
    }

    chat_messages {
        uuid id PK
        uuid user_id FK
        text role
        text content
        timestamp created_at
    }

    friends {
        uuid id PK
        uuid user_id FK
        uuid friend_id FK
        timestamp created_at
    }

    friend_requests {
        uuid id PK
        uuid from_user_id FK
        uuid to_user_id FK
        text status
        timestamp created_at
        timestamp updated_at
    }

    note_shares {
        uuid id PK
        uuid note_id FK
        uuid owner_id FK
        uuid shared_with_user_id FK
        text permission
        timestamp created_at
    }

    profiles ||--o{ notes : owns
    profiles ||--o{ note_embeddings : creates
    profiles ||--o{ chat_messages : sends
    profiles ||--o{ friends : has
    profiles ||--o{ friend_requests : sends
    profiles ||--o{ note_shares : shares
    notes ||--o{ note_embeddings : contains
    notes ||--o{ note_shares : shared_as
```

## MCP服务器架构

```mermaid
graph LR
    subgraph "MCP服务器层"
        A[Private MCP Server]
        B[Shared MCP Server]
    end

    subgraph "工具集"
        C[search_notes]
        D[get_note]
        E[list_recent_notes]
        F[search_shared_notes]
        G[get_shared_note]
        H[list_shared_notes]
    end

    subgraph "资源管理"
        I[个人笔记资源]
        J[共享笔记资源]
    end

    subgraph "提示词模板"
        K[summarize_notes]
        L[find_related]
        M[analyze_shared_content]
    end

    A --> C
    A --> D
    A --> E
    A --> I
    A --> K
    A --> L

    B --> F
    B --> G
    B --> H
    B --> J
    B --> M
```

## 向量化处理流程

```mermaid
flowchart TD
    A[用户创建/更新笔记] --> B[文本预处理]
    B --> C[文本分块处理]
    C --> D[调用Doubao Embedding API]
    D --> E[生成1024维向量]
    E --> F[删除旧向量数据]
    F --> G[存储新向量到数据库]
    G --> H[建立HNSW索引]
    H --> I[向量搜索就绪]

    subgraph "文本分块策略"
        J[按段落分割]
        K[按句子分割]
        L[按字符数分割]
    end

    C --> J
    C --> K
    C --> L
```

## 好友系统操作流程

```mermaid
stateDiagram-v2
    [*] --> 搜索用户
    搜索用户 --> 发送好友请求
    发送好友请求 --> 等待接受
    等待接受 --> 接受请求: 对方接受
    等待接受 --> 拒绝请求: 对方拒绝
    接受请求 --> 成为好友
    拒绝请求 --> [*]
    成为好友 --> 管理好友
    管理好友 --> 删除好友: 删除
    管理好友 --> 共享笔记: 共享
    删除好友 --> [*]
    共享笔记 --> 设置权限
    设置权限 --> 笔记共享完成
```

## 系统技术栈

```mermaid
mindmap
  root((AI Note System))
    前端技术
      Next.js 16
      React 19
      TypeScript
      Tailwind CSS
      shadcn/ui
      Lucide Icons
    后端技术
      Next.js API Routes
      Supabase Auth
      PostgreSQL
      pgvector
    AI服务
      Doubao Embedding
      DeepSeek Chat
      MCP Protocol
    数据库
      profiles表
      notes表
      note_embeddings表
      chat_messages表
      friends表
      friend_requests表
      note_shares表
    安全特性
      RLS策略
      权限控制
      会话管理
      数据隔离
```

## 部署架构

```mermaid
graph TB
    subgraph "生产环境"
        A[Vercel/Netlify]
        B[Supabase Cloud]
        C[CDN]
    end

    subgraph "开发环境"
        D[Local Development]
        E[Supabase Local]
        F[Hot Reload]
    end

    subgraph "CI/CD"
        G[GitHub Actions]
        H[自动部署]
        I[环境变量管理]
    end

    A --> B
    D --> E
    G --> H
    H --> A
    I --> A
    I --> D
```

## 性能优化策略

```mermaid
graph LR
    A[前端优化] --> B[代码分割]
    A --> C[懒加载]
    A --> D[缓存策略]
    
    E[后端优化] --> F[数据库索引]
    E --> G[向量索引HNSW]
    E --> H[连接池]
    
    I[AI优化] --> J[异步向量化]
    I --> K[批量处理]
    I --> L[缓存嵌入]
    
    M[安全优化] --> N[RLS策略]
    M --> O[权限验证]
    M --> P[数据隔离]
```

## 监控和日志

```mermaid
graph TD
    A[用户操作] --> B[前端日志]
    A --> C[API调用]
    C --> D[服务器日志]
    C --> E[数据库日志]
    D --> F[错误监控]
    E --> F
    F --> G[告警系统]
    G --> H[开发团队]
```

---

## 总结

这个AI笔记系统采用了现代化的全栈架构，具有以下特点：

1. **分层架构**: 清晰的前端、API、业务逻辑和数据层分离
2. **微服务化**: MCP服务器提供标准化的工具接口
3. **AI集成**: 深度集成向量搜索和AI聊天功能
4. **社交功能**: 完整的好友系统和笔记共享机制
5. **安全性**: 全面的权限控制和数据隔离
6. **可扩展性**: 模块化设计，易于扩展新功能
7. **性能优化**: 向量索引、异步处理、缓存策略

整个系统为用户提供了智能化的笔记管理体验，支持语义搜索、AI对话和社交协作功能。



