# 快速设置指南

## 🚀 5 分钟快速启动

### 前置要求

- Node.js 18+ 已安装
- Supabase 账户（免费）
- Doubao API 密钥

---

## 步骤 1: 克隆并安装依赖 ✅

```bash
cd /Users/yangxigui/Documents/project/cnote
npm install
```

**状态**: ✅ 已完成

---

## 步骤 2: 配置环境变量 ✅

`.env.local` 文件已创建，包含：

```env
NEXT_PUBLIC_SUPABASE_URL=https://uhzcrwwxtmlhzhtegvpt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DEEPSEEK_API_KEY=sk-1ea6ab0e54204760a6410b2fa1e1af0b
DEEPSEEK_BASE_URL=https://api.deepseek.com
DOUBAO_API_KEY=c048e447-097b-408b-b772-d7d6e5b63d33
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3/
```

**状态**: ✅ 已完成

---

## 步骤 3: 设置 Supabase 数据库 ⚠️

这是**唯一需要手动完成**的步骤！

### 操作步骤：

1. **登录 Supabase**
   - 访问：https://supabase.com/dashboard/project/uhzcrwwxtmlhzhtegvpt

2. **打开 SQL Editor**
   - 左侧菜单 → SQL Editor
   - 点击 "New query"

3. **复制并执行 SQL**
   - 打开项目中的 `supabase-schema.sql` 文件
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 按钮

4. **验证创建成功**
   - 左侧菜单 → Table Editor
   - 确认看到以下表：
     - ✅ `profiles`
     - ✅ `notes`
     - ✅ `note_embeddings`

**预计时间**: 2 分钟

---

## 步骤 4: 启动开发服务器 🚀

```bash
npm run dev
```

访问：http://localhost:3000

---

## 步骤 5: 测试系统 🧪

### 5.1 注册/登录

1. 打开 http://localhost:3000
2. 输入用户名（任意，例如：`alice`）
3. 点击 "Continue"
4. ✅ 自动注册并登录

### 5.2 创建第一个笔记

1. 点击 "New Note"
2. 输入：
   - 标题：`我的第一个笔记`
   - 内容：`这是一个测试笔记，用于验证向量化功能。`
3. 点击 "Create Note"
4. ✅ 笔记创建成功

### 5.3 验证向量化（可选）

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 查看笔记
SELECT * FROM notes ORDER BY created_at DESC LIMIT 5;

-- 查看向量嵌入
SELECT 
  ne.chunk_text, 
  ne.chunk_index,
  n.title
FROM note_embeddings ne
JOIN notes n ON ne.note_id = n.id
ORDER BY n.created_at DESC, ne.chunk_index;
```

如果看到结果，说明**向量化成功**！🎉

---

## 🎯 完成检查清单

- [x] ✅ 安装依赖
- [x] ✅ 配置环境变量
- [ ] ⚠️ **设置 Supabase 数据库** ← 当前步骤
- [ ] 🧪 测试注册登录
- [ ] 🧪 测试创建笔记
- [ ] 🧪 验证向量化

---

## 🐛 遇到问题？

### 问题：无法连接到 Supabase

**解决方案**:
- 检查 `.env.local` 中的 URL 和 KEY 是否正确
- 确保 Supabase 项目处于活跃状态

### 问题：笔记创建失败

**解决方案**:
- 确保已执行 `supabase-schema.sql`
- 检查浏览器控制台错误信息
- 查看终端日志

### 问题：向量嵌入未生成

**解决方案**:
- 检查 Doubao API 密钥是否正确
- 查看终端是否有 API 调用错误
- 确认 Doubao API 配额充足

---

## 📚 下一步

完成 Phase 1 测试后，可以：

1. 浏览完整文档：`README.md`
2. 查看部署指南：`DEPLOYMENT.md`
3. 准备 Phase 2（AI Chat）开发

---

## 🆘 获取帮助

- 查看日志：开发模式下所有日志会输出到终端
- 检查数据库：使用 Supabase Table Editor
- 查看代码：所有代码都有详细注释

**祝您使用愉快！** 🎉

