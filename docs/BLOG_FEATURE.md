# 博客功能说明

## 功能概述

新增了博客功能，允许用户将笔记发布为公开的博客文章。任何人都可以访问这些博客，无需登录。

## 主要功能

### 1. 将笔记加入博客

- 在笔记编辑页面，勾选"Publish as blog post"复选框
- 保存笔记后，该笔记就会成为公开的博客文章

### 2. 访问博客

- 在主页右上角点击"Blog"按钮
- 或者直接访问 URL: `/{username}/blog`
- 任何人都可以访问，无需登录

### 3. 博客页面展示

- 博客列表页面：显示该用户的所有博客文章
- 单篇文章页面：显示博客文章的详细内容

## 数据库变更

需要在Supabase中执行以下SQL：

```sql
-- 添加 in_blog 字段
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS in_blog boolean DEFAULT false NOT NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS notes_in_blog_idx ON public.notes(in_blog) WHERE in_blog = true;

-- 允许公开访问博客文章
CREATE POLICY "Anyone can view blog posts"
  ON public.notes FOR SELECT
  USING (in_blog = true);
```

执行脚本：`supabase-blog-migration.sql`

## 路由说明

### 博客列表页面
- **路径**: `/{username}/blog`
- **访问**: 公开，任何人都可以访问
- **展示**: 该用户的所有博客文章列表

### 单篇博客文章
- **路径**: `/{username}/blog/{id}`
- **访问**: 公开，任何人都可以访问
- **展示**: 博客文章的详细内容

## 特性

1. **隐私控制**: 用户可以选择哪些笔记发布为博客
2. **公开访问**: 博客无需登录即可访问
3. **友好的URL**: 使用username作为博客路径
4. **响应式设计**: 博客页面适配各种设备

## 使用示例

1. 创建或编辑一篇笔记
2. 勾选"Publish as blog post"选项
3. 保存笔记
4. 点击Header中的"Blog"按钮查看博客
5. 分享博客链接给他人访问

## 安全考虑

- 只有笔记的作者可以将笔记加入/移出博客
- 博客文章通过RLS策略进行保护
- 公开可见的只是标记为博客的笔记

