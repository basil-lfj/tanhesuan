# 业务体系模块使用说明

## 当前样式

业务体系模块已更新为以下样式：
- **竖直排列**：4个功能模块竖直贴合排列
- **白色分割线**：模块间使用简约的白色线条分割
- **背景留白**：整个模块背景为白色，待放入背景图

## 添加背景图

### 方法一：使用CSS背景图片

在 `style.css` 文件中，找到 `.business-section` 样式，添加背景图片：

```css
.business-section {
    background-color: white;
    position: relative;
    background-image: url('images/business-bg.jpg'); /* 添加背景图路径 */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed; /* 可选：固定背景 */
}
```

### 方法二：添加背景色渐变

如果不想使用图片，可以使用渐变背景：

```css
.business-section {
    background-color: white;
    position: relative;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
```

### 方法三：添加伪元素背景层

更好的方式是使用伪元素添加背景，这样可以更好地控制内容：

```css
.business-section {
    background-color: white;
    position: relative;
}

.business-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('images/business-bg.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.1; /* 调整透明度 */
    z-index: 0;
}

.business-section > .container {
    position: relative;
    z-index: 1;
}
```

## 建议的背景图尺寸

- **宽度**：建议 1920px 或更大
- **高度**：建议 1080px 或更大
- **格式**：建议使用 WebP 或 JPG 格式
- **文件大小**：建议控制在 500KB 以内

## 响应式背景图

考虑不同设备的屏幕尺寸，可以使用媒体查询：

```css
@media (max-width: 768px) {
    .business-section {
        background-image: url('images/business-bg-mobile.jpg'); /* 移动端专用背景 */
    }
}
```

## 当前效果预览

打开 `index.html` 文件，业务体系模块将显示为：
- 整体白色背景
- 4个竖直排列的卡片
- 卡片间有细微的白色分割线
- 鼠标悬停时卡片向右滑动
- 简约的SVG图标
- 流畅的滚动动画

## 自定义调整

### 调整卡片间距
```css
.business-card {
    padding: 28px 35px; /* 可调整内边距 */
}
```

### 调整卡片圆角
```css
.business-cards {
    border-radius: 8px; /* 可调整圆角大小 */
}
```

### 调整悬停效果
```css
.business-card:hover {
    transform: translateX(8px); /* 可调整滑动距离 */
}
```

### 调整图标大小
```css
.card-icon svg {
    width: 80px; /* 可调整图标宽度 */
    height: 80px; /* 可调整图标高度 */
}
```

## 注意事项

1. 添加背景图后，确保文字内容仍然清晰可读
2. 背景图不宜过于花哨，以免影响内容展示
3. 建议使用浅色或低饱和度的背景图
4. 如有需要，可以在卡片上添加半透明遮罩

## 联系方式

如有问题，请查看项目根目录的 README.md 文件或联系开发人员。
