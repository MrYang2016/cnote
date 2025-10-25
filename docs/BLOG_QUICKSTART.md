# 博客功能快速开始

## 快速开始

### 1. 数据库迁移

首先需要在Supabase数据库中执行迁移脚本：

```bash
# 方式1: 使用Supabase CLI
supabase db push

# 方式2: 直接在Supabase Dashboard执行
# 打开 Supabase Dashboard > SQL Editor
# 复制并执行 supabase-blog-migration.sql 中的内容
```

迁移脚本会：
- 在 `notes` 表中添加 `in_blog` 字段
- 创建索引以优化博客查询
- 添加RLS策略以允许公开访问博客文章

### 2. 使用博客功能

#### 发布博客文章

1. 打开"笔记"页面
2. 点击创建新笔记或编辑现有笔记
3. 勾选"Publish as blog post"选项
4. 保存笔记

#### 访问博客

方式1: 点击Header右上角的"Blog"按钮

方式2: 直接访问 URL: `/{your-username}/blog`

#### 查看单篇文章

在博客列表页面点击任意文章，URL格式为：
`/{username}/blog/{note-id}`

### 3. 功能特点

✅ **公开访问**: 任何人无需登录即可访问博客  
✅ **隐私控制**: 只有你选择的笔记会发布为博客  
✅ **友好URL**: 使用username作为路径  
✅ **响应式设计**: 适配移动端和桌面端  

### 4. 注意事项

- 博客文章一旦发布，任何人都可以访问（包括未登录用户）
- 取消勾选"Publish as blog post"可以将文章从博客中移除
- 删除笔记会同时从博客中移除
- 博客列表按更新时间倒序排列

## 数据库变更详情

### 新增字段

```sql
ALTER TABLE public.notes 
ADD COLUMN in_blog boolean DEFAULT false NOT NULL;
```

### 新增索引

```sql
CREATE INDEX notes_in_blog_idx 
ON public.notes(in_blog) 
WHERE in_blog = true;
```

### 新增RLS策略

```sql
CREATE POLICY "Anyone can view blog posts"
  ON public.notes FOR SELECT
  USING (in_blog = true);
```

## 文件变更

### 新增文件

- `lib/db/blog.ts` - 博客数据库操作
- `app/[username]/blog/page.tsx` - 博客列表页面
- `app/[username]/blog/[id]/page.tsx` - 单篇博客页面
- `supabase-blog-migration.sql` - 数据库迁移脚本
- `docs/BLOG_FEATURE.md` - 详细功能说明
- `docs/BLOG_QUICKSTART.md` - 快速开始指南

### 修改文件

- `lib/utils/types.ts` - 添加 `in_blog` 字段到Note类型
- `lib/db/notes.ts` - 更新createNote和updateNote函数
- `components/layout/Header.tsx` - 添加博客入口按钮
- `components/notes/NoteEditor.tsx` - 添加"加入博客"复选框
- `app/api/notes/route.ts` - 更新API以支持in_blog字段
- `app/api/notes/[id]/route.ts` - 更新API以支持in_blog字段

## 常见问题

**Q: 如何让博客私有？**  
A: 取消勾选"Publish as blog post"选项即可。

**Q: 博客可以被搜索引擎索引吗？**  
A: 是的，博客是公开的，可以被搜索引擎索引。

**Q: 可以修改已发布的博客吗？**  
A: 可以，编辑笔记会自动更新博客内容。

**Q: 博客是否有评论功能？**  
A: 当前版本不包含评论功能，未来可能会添加。

