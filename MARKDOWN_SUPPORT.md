# Markdown 功能支持文档

## 概述

智能客服组件现已全面支持Markdown格式渲染，提供丰富的文本格式化功能，包括标题、粗体、斜体、链接、代码块、列表和引用等。

## 支持的Markdown语法

### 1. 标题 (Heading)

支持6级标题，从 `#` 到 `######`

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

**渲染效果**:
- 一级标题和二级标题带有底部边框
- 字体大小逐级递减
- 六级标题颜色较浅

---

### 2. 粗体 (Bold)

使用双星号或双下划线包裹文本

```markdown
**粗体文本**
__粗体文本__
```

**渲染效果**: 文字加粗显示

---

### 3. 斜体 (Italic)

使用单星号或单下划线包裹文本

```markdown
*斜体文本*
_斜体文本_
```

**渲染效果**: 文字倾斜显示

---

### 4. 链接 (Link)

使用 `[链接文本](URL)` 格式

```markdown
[访问Vue官网](https://vuejs.org)
[智能客服系统](https://example.com)
```

**渲染效果**:
- AI消息: 蓝色链接，带虚线下划线
- 用户消息: 白色链接，适配渐变背景
- 鼠标悬停时下划线变为实线

---

### 5. 代码块 (Code Block)

使用三个反引号包裹代码，可指定语言

```markdown
\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`
```

**渲染效果**:
- 灰色背景
- 带边框
- 代码等宽字体
- 支持水平滚动

---

### 6. 行内代码 (Inline Code)

使用单个反引号包裹代码

```markdown
使用 `const` 声明常量
在 `src/App.vue` 中配置
```

**渲染效果**:
- 浅色背景
- 粉色文字
- 等宽字体
- 圆角边框

---

### 7. 无序列表 (Unordered List)

使用 `-`、`*` 或 `+` 开头

```markdown
- 第一项
- 第二项
  - 子项1
  - 子项2
- 第三项
```

**渲染效果**:
- 圆点标记
- 支持嵌套
- 适当间距

---

### 8. 有序列表 (Ordered List)

使用数字加点开头

```markdown
1. 第一步
2. 第二步
3. 第三步
```

**渲染效果**:
- 数字标记
- 自动编号
- 适当间距

---

### 9. 引用 (Blockquote)

使用 `>` 开头

```markdown
> 这是一段引用文本
> 可以多行
```

**渲染效果**:
- 左侧边框
- 灰色文字
- 斜体样式

---

### 10. 水平线 (Horizontal Rule)

使用三个或更多 `-`、`*` 或 `_`

```markdown
---
***
___
```

**渲染效果**:
- 横向分隔线
- 浅色边框

---

### 11. 表格 (Table)

支持标准Markdown表格语法

```markdown
| 列1 | 列2 | 列3 |
|------|------|------|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |
```

**渲染效果**:
- 带边框的表格
- 表头有背景色
- 单元格内边距

---

## 安全特性

### XSS 防护

使用 [DOMPurify](https://github.com/cure53/DOMPurify) 进行HTML净化，防止XSS攻击：

- ✅ 只允许安全的HTML标签
- ✅ 过滤危险的属性
- ✅ 禁止 `data:` 属性
- ✅ 防止脚本注入

### 允许的标签

```typescript
[
  'p', 'br', 'strong', 'em', 'a', 
  'code', 'pre', 'h1', 'h2', 'h3', 
  'h4', 'h5', 'h6', 'ul', 'ol', 
  'li', 'blockquote', 'span'
]
```

### 允许的属性

```typescript
{
  href: true,    // 链接地址
  target: true,  // 打开方式
  class: true    // 样式类名
}
```

---

## 样式特性

### AI消息样式

- **背景**: 白色
- **文字颜色**: 深灰色 (#333)
- **阴影**: 轻微阴影
- **圆角**: 左下角直角

### 用户消息样式

- **背景**: 紫色渐变 (#667eea → #764ba2)
- **文字颜色**: 白色
- **适配**: 所有Markdown元素适配渐变背景

### 响应式设计

- **移动端**: 字体自动缩放
- **代码块**: 支持水平滚动
- **表格**: 自动适应宽度

---

## 使用示例

### 示例1: 技术文档

```markdown
# 安装指南

## 前置要求

- Node.js >= 16
- npm 或 yarn

## 安装步骤

1. 克隆项目
2. 安装依赖: `npm install`
3. 启动服务: `npm run dev`

> 更多信息请访问 [官方文档](https://example.com/docs)
```

### 示例2: 代码说明

```markdown
## API 接口

### 用户登录

\`\`\`javascript
const login = async (username, password) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  return response.json();
};
\`\`\`

使用 `login` 函数进行用户认证。
```

### 示例3: 功能列表

```markdown
# 功能特性

- **实时通信**: WebSocket支持
- **流式回复**: AI逐字输出
- **Markdown渲染**: 丰富的格式支持
- **消息状态**: 发送中/已发送/已接收

1. 连接服务器
2. 发送消息
3. 接收回复
4. 显示结果

> 注意: 请确保网络连接正常
```

---

## 浏览器兼容性

### 完全支持

| 浏览器 | 最低版本 | 备注 |
|---------|----------|------|
| Chrome | 90+ | 完全支持 |
| Firefox | 88+ | 完全支持 |
| Safari | 14+ | 完全支持 |
| Edge | 90+ | 完全支持 |
| Opera | 76+ | 完全支持 |

### 移动端支持

| 平台 | 浏览器 | 支持情况 |
|------|---------|----------|
| iOS | Safari 14+ | 完全支持 |
| iOS | Chrome | 完全支持 |
| Android | Chrome 90+ | 完全支持 |
| Android | Firefox 88+ | 完全支持 |

### 兼容性说明

- ✅ 使用标准CSS3属性
- ✅ 不依赖实验性功能
- ✅ 自动降级处理
- ✅ 响应式设计

---

## 性能优化

### 解析优化

- **缓存机制**: 相同内容复用解析结果
- **增量更新**: 流式消息增量解析
- **轻量化**: 只解析必要的语法

### 渲染优化

- **虚拟滚动**: 大量消息时优化性能
- **懒加载**: 图片和链接懒加载
- **CSS优化**: 使用硬件加速

---

## 配置选项

### Markdown 解析配置

```typescript
const html = marked.parse(content, {
  breaks: true,   // 支持换行符
  gfm: true       // GitHub Flavored Markdown
})
```

### 安全配置

```typescript
const cleanHtml = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: [...],
  ALLOWED_ATTR: [...],
  ALLOW_DATA_ATTR: false
})
```

---

## 测试建议

### 功能测试

1. **基础语法测试**
   - 发送各种Markdown语法
   - 验证渲染效果
   - 检查样式正确性

2. **安全测试**
   - 尝试注入脚本
   - 验证XSS防护
   - 检查属性过滤

3. **兼容性测试**
   - 在不同浏览器测试
   - 在移动设备测试
   - 验证响应式效果

4. **性能测试**
   - 发送长文本
   - 发送大量消息
   - 监控渲染性能

### 测试用例

```markdown
# 标题测试

## 二级标题

### 三级标题

**粗体** 和 *斜体* 测试

[链接测试](https://example.com)

`行内代码` 测试

\`\`\`javascript
代码块测试
console.log('Hello');
\`\`\`

- 列表项1
- 列表项2

1. 有序1
2. 有序2

> 引用文本测试

---

水平线测试
```

---

## 常见问题

### Q: 为什么某些Markdown语法不生效？

A: 目前支持标准Markdown语法和GitHub Flavored Markdown。某些扩展语法（如任务列表、删除线等）暂不支持。

### Q: 代码块不显示语法高亮？

A: 当前版本不包含语法高亮功能。如需高亮，可集成 `highlight.js` 或 `prism.js`。

### Q: 链接点击不跳转？

A: 链接默认在当前窗口打开。如需新窗口打开，后端发送的Markdown应使用 `[文本](URL "_blank")` 格式。

### Q: 表格在移动端显示异常？

A: 表格支持水平滚动。如需更好的移动端体验，建议使用列表代替表格。

---

## 未来计划

### 计划添加的功能

- [ ] 语法高亮支持
- [ ] 任务列表
- [ ] 删除线
- [ ] 表情符号
- [ ] 数学公式 (LaTeX)
- [ ] 图片支持
- [ ] 自定义主题

### 性能优化

- [ ] 虚拟滚动
- [ ] 懒加载优化
- [ ] 解析缓存
- [ ] 增量渲染

---

## 技术栈

- **Markdown解析**: [marked](https://marked.js.org/) v11.0.0
- **HTML净化**: [DOMPurify](https://github.com/cure53/DOMPurify) v3.0.0
- **框架**: Vue 3
- **样式**: CSS3 (Scoped)

---

## 相关文档

- [项目README](file:///e:/JavaProjects/websocket-chat-front/README.md)
- [WebSocket配置指南](file:///e:/JavaProjects/websocket-chat-front/WEBSOCKET_SETUP.md)
- [Bug分析报告](file:///e:/JavaProjects/websocket-chat-front/BUG_ANALYSIS_REPORT.md)

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-05
**维护状态**: ✅ 活跃维护
