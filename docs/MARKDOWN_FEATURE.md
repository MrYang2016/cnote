# Markdown 富文本编辑器功能说明

## 概述

CNote 现在支持完整的 Markdown 富文本编辑功能，包括格式化文本、代码块、图片、链接等。用户可以创建美观、结构化的笔记内容。

## 主要功能

### 1. Markdown 语法支持

支持标准的 Markdown 语法：

- **标题**: `# H1`, `## H2`, `### H3` 等
- **加粗**: `**粗体**` 或 `__粗体__`
- **斜体**: `*斜体*` 或 `_斜体_`
- **删除线**: `~~删除文本~~`
- **代码**: `` `行内代码` ``
- **代码块**: ` ```语言` 包裹的多行代码
- **链接**: `[文本](URL)`
- **图片**: `![alt文本](图片URL)`
- **列表**: `- 项目` 或 `1. 项目`
- **引用**: `> 引用文本`
- **表格**: GitHub Flavored Markdown 表格语法
- **任务列表**: `- [ ] 未完成` 或 `- [x] 已完成`

### 2. 编辑器界面

#### 编辑模式
- 提供工具栏按钮快速插入常用格式
- 实时语法高亮
- 快捷键支持
- 支持拖拽调整编辑器高度

#### 预览模式
- 实时渲染 Markdown 内容
- 代码块语法高亮（使用 GitHub Dark 主题）
- 响应式布局
- 支持深色模式

### 3. 代码高亮

使用 `highlight.js` 支持多种编程语言的语法高亮：

```javascript
// JavaScript 示例
function greet(name) {
  return `Hello, ${name}!`;
}
```

```python
# Python 示例
def greet(name):
    return f"Hello, {name}!"
```

支持的语言包括：JavaScript, Python, Java, C++, TypeScript, Go, Rust, HTML, CSS, SQL 等。

### 4. 编辑/预览切换

用户可以随时在编辑模式和预览模式之间切换：

- **编辑模式**: 显示 Markdown 源码，提供工具栏和语法高亮
- **预览模式**: 渲染为 HTML，显示最终效果

## 使用方法

### 创建新笔记

1. 导航到 `/notes/new`
2. 输入标题
3. 在内容区域编写 Markdown 内容
4. 使用工具栏按钮或手动输入 Markdown 语法
5. 点击 "Preview" 按钮查看渲染效果
6. 保存笔记

### 编辑现有笔记

1. 打开笔记 `/notes/[id]`
2. 点击 "Edit" 按钮进入编辑模式
3. 修改内容
4. 使用 "Preview" 查看效果
5. 保存更改

### 查看只读笔记

当用户只有查看权限时：
- 默认显示预览模式
- 可以查看格式化的内容
- 无法进行编辑

## 示例内容

以下是一个完整的 Markdown 笔记示例：

```markdown
# 我的技术笔记

## JavaScript 基础知识

JavaScript 是一种**动态类型**的编程语言。

### 变量声明

支持三种方式：
- `var` - 函数作用域
- `let` - 块作用域
- `const` - 常量声明

### 代码示例

```javascript
const name = "World";
console.log(`Hello, ${name}!`);
```

### 参考链接

- [MDN Web Docs](https://developer.mozilla.org)
- [JavaScript.info](https://javascript.info)

### 待办事项

- [x] 学习基础语法
- [ ] 完成项目练习
- [ ] 阅读高级特性
```

## 实现细节

### 技术栈

- **编辑器**: `@uiw/react-md-editor` - 专业的 Markdown 编辑器
- **渲染**: `react-markdown` - React Markdown 渲染器
- **插件**:
  - `remark-gfm` - GitHub Flavored Markdown 支持
  - `rehype-highlight` - 代码高亮
- **样式**: `@tailwindcss/typography` - Typography 插件

### 组件结构

```
components/notes/
├── MarkdownEditor.tsx    # Markdown 编辑器组件
├── NoteEditor.tsx         # 笔记编辑器（集成 Markdown）
└── NoteCard.tsx           # 笔记卡片（显示纯文本预览）
```

### 样式定制

编辑器样式可在 `app/globals.css` 中自定义：

- 编辑器边框和圆角
- 代码高亮颜色
- 滚动条样式
- 响应式布局

## 注意事项

1. **图片上传**: 目前需要在 Markdown 中手动指定图片 URL。未来可以考虑集成图片上传功能。

2. **代码块**: 建议在代码块中指定语言以启用语法高亮。

3. **预览模式**: 只读用户将始终看到预览模式，无法切换。

4. **博客发布**: 博客文章同样支持 Markdown 渲染。

5. **性能**: 大型 Markdown 文档可能需要更多渲染时间。

## 后续改进

可能的增强功能：

- [ ] 图片拖拽上传
- [ ] 表情符号支持
- [ ] 数学公式（LaTeX）
- [ ] Mermaid 图表支持
- [ ] 目录自动生成
- [ ] 导出为 PDF
- [ ] 批量格式转换

## 相关文件

- `components/notes/MarkdownEditor.tsx` - Markdown 编辑器组件
- `components/notes/NoteEditor.tsx` - 笔记编辑器
- `app/globals.css` - 编辑器样式
- `lib/utils.ts` - Markdown 工具函数

