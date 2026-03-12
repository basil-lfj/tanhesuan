# 碳核算计算工具

基于国家碳排放因子库的简单碳核算计算工具。

## 功能特点

- 支持煤炭、石油两大燃料类别
- 支持CO₂、CH₄、N₂O三种温室气体计算
- 支持多种行业场景选择
- 自动计算CO₂当量
- 纯前端实现，无需后端服务

## 使用方法

### 方式一：直接打开（需要本地服务器）

由于浏览器安全限制，直接打开HTML文件可能无法加载JSON数据。建议使用以下方式之一启动本地服务器：

**使用Python：**
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

**使用Node.js：**
```bash
npx serve .
```

然后访问 `http://localhost:8080`

### 方式二：使用VS Code Live Server

1. 安装VS Code的Live Server扩展
2. 右键点击`index.html`
3. 选择"Open with Live Server"

## 计算说明

### 计算公式

```
碳排放量 = 燃料消耗量(kg) × 低位发热量(TJ/kg) × 排放因子
```

### GWP值

采用IPCC第五次评估报告100年尺度：
- CO₂: 1
- CH₄: 28
- N₂O: 265

## 项目结构

```
carbon-calculator/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── main.js         # 主程序入口
│   ├── calculator.js   # 计算逻辑
│   └── data-loader.js  # 数据加载
├── data/
│   └── emission-factors.json  # 因子库数据
└── README.md           # 使用说明
```

## 数据来源

国家碳排放因子库：https://data.ncsc.org.cn/factories/index

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- 无框架依赖

## License

MIT



python -m http.server 8000