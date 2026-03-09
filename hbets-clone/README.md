# 碳市场前端展示系统

基于 https://www.hbets.cn/ 信息公开模块设计开发的碳市场数据可视化大屏。

## 功能特点

### 碳市场行情模块
- **实时行情展示**：同时展示全国碳市场CEA和自愿减排交易CCER行情数据
- **价格走势分析**：支持多种时间范围（1月、3月、6月、1年、全部）的走势图
- **对比视图**：CEA与CCER价格对比分析
- **自动刷新**：每30秒自动刷新实时数据，每5分钟刷新趋势数据

### 数据来源
- **CEA数据**：全国碳市场综合价格行情，来源上海环境能源交易所
- **CCER数据**：全国温室气体自愿减排交易行情，来源北京绿色交易所
- **爬虫模块**：集成 `carbon_crawler.py` 自动抓取最新行情数据

## 项目结构

```
hbets-clone/
├── index.html              # 主页面
├── style.css               # 样式文件
├── script.js               # 前端交互脚本
├── server.py               # 后端服务器（含API路由）
├── carbon_crawler.py       # 碳市场数据爬虫模块
├── start.bat               # Windows启动脚本
├── requirements.txt        # Python依赖
├── data/
│   └── carbon-prices.json  # 本地数据备份
└── images/
    └── logo.svg            # 网站Logo
```

## 快速启动

### 方式一：使用启动脚本（推荐）
双击 `start.bat` 文件，脚本会自动：
1. 检测Python环境
2. 安装必要依赖
3. 启动服务器

### 方式二：命令行启动
```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务器
python server.py
```

服务启动后访问：http://localhost:1000

## API接口

| 接口 | 说明 |
|------|------|
| `/api/data/latest` | 获取最新行情数据 |
| `/api/trend/cea` | 获取CEA历史趋势 |
| `/api/trend/ccer` | 获取CCER历史趋势 |
| `/api/trend/compare` | 获取对比趋势数据 |
| `/api/status` | 获取服务器状态 |
| `/api/refresh` | 刷新缓存数据 |
| `/api/crawler/run` | 手动触发爬虫 |

## 技术栈

- **前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **图表**：ECharts 5.4.3
- **后端**：Python 3.x (内置 http.server)
- **爬虫**：Requests + BeautifulSoup4

## 数据流程

```
1. 企业端填报数据 → 数据存储
2. 爬虫定时抓取 → 数据处理 → JSON存储
3. 后端API读取 → 缓存优化
4. 前端请求 → ECharts渲染
```

## 参考网站

- [湖北碳排放权交易中心](https://www.hbets.cn/)
- [全国碳市场](https://www.ccn.ac.cn/cets)

## 注意事项

1. 爬虫默认每5分钟自动运行一次更新数据
2. 前端每30秒自动刷新实时行情
3. 所有数据仅供学习研究使用
4. 请遵守相关网站的robots.txt和使用条款