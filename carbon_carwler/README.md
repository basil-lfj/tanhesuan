# 碳市场价格爬虫（最终版）

这是一个用于爬取 https://www.ccn.ac.cn/cets 网站碳市场综合行情数据的Python爬虫程序。专门解析全国碳市场综合价格行情(CEA)数据。

## 功能特点

1. **自动获取碳价格数据**：从全国碳市场综合价格行情(CEA)页面提取今日碳资产价格
2. **智能数据解析**：能正确解析页面中的数字序列格式（如83.2083.2080.5081.851.43）
3. **完善的错误处理**：网络请求异常、解析错误、数据验证
4. **调试功能**：自动保存HTML页面、日志记录
5. **数据导出**：支持JSON格式导出

## 文件结构

```
carbon_crawler/
├── final_carbon_crawler.py     # 最终版爬虫程序（主程序）
├── manual_debug.py             # 手动调试工具
├── diagnose_no_data.py         # 问题诊断工具
├── README.md                   # 使用说明
├── requirements.txt            # 依赖包列表
├── run_crawler.bat             # Windows一键运行脚本
├── debug_final/                # 调试文件目录
│   └── page_*.html            # 保存的HTML页面
├── carbon_prices_final_*.json  # 导出的JSON数据
└── carbon_crawler_final.log    # 日志文件
```

## 安装依赖

```bash
pip install requests beautifulsoup4 lxml
```

或者使用requirements.txt：
```bash
pip install -r requirements.txt
```

## 使用方法

### 基本使用

运行最终版爬虫：
```bash
python final_carbon_crawler.py
```

或者使用Windows批处理脚本：
```bash
run_crawler.bat
```

### 输出示例

成功运行时将输出：
```
最终版碳市场价格爬虫
============================================================
正在获取页面: https://www.ccn.ac.cn/cets
成功获取页面，状态码: 200
已保存页面到: debug_final/page_20260305_195035.html

============================================================
成功提取碳价格数据:
============================================================
  date: 2026年3月5日
  market: 全国碳市场
  product: CEA (碳排放配额)
  closing_price: 83.2
  highest_price: 83.2
  lowest_price: 80.5
  previous_close: 81.85
  change_percent: 1.43
  unit: 元/吨
  source: 全国碳市场综合价格行情
  data_source: 上海环境能源交易所/全国碳市场

数据已保存到: carbon_prices_final_20260305_195035.json

============================================================
全国碳市场价格数据
============================================================
日期: 2026年3月5日
市场: 全国碳市场
产品: CEA (碳排放配额)
收盘价: 83.2 元/吨
最高价: 83.2 元/吨
最低价: 80.5 元/吨
涨跌幅: 1.43%
数据来源: 上海环境能源交易所/全国碳市场

详细数据已保存到: carbon_prices_final_20260305_195035.json
日志文件: carbon_crawler_final.log
```

## 调试指南

### 1. 常见问题排查

#### 问题：HTTP状态码200但找不到数据
**可能原因**：
1. 使用了旧版爬虫（基础版）
2. 页面中的数字序列格式需要特殊解析
3. 提取规则需要更新

**解决方案**：
1. 使用最终版爬虫：`python final_carbon_crawler.py`
2. 运行诊断工具：`python diagnose_no_data.py`
3. 检查日志文件：`carbon_crawler_final.log`

#### 问题：网络连接失败
**解决方案**：
1. 检查网络连接
2. 增加超时时间（修改代码中的timeout参数）
3. 使用代理（如果需要）

### 2. 手动调试步骤

1. **运行手动调试工具**：
   ```bash
   python manual_debug.py
   ```

2. **诊断数据提取问题**：
   ```bash
   python diagnose_no_data.py
   ```

3. **查看调试文件**：
   - 打开`debug_final/`目录下的HTML文件
   - 查看`carbon_crawler_final.log`日志文件

### 3. 关于HTTP状态码200的说明

**HTTP状态码200表示"成功"**，不是错误。这表示：
- 网络请求成功
- 服务器正常响应
- 页面可访问

如果看到"状态码: 200"，这**不是问题**，而是爬虫正常工作的标志。

真正的问题可能是数据提取失败，而不是网络请求失败。

## 代码结构说明

### 主要类和方法

#### `FinalCarbonPriceCrawler` 类（final_carbon_crawler.py）
- `__init__()`: 初始化爬虫，设置请求头和日志
- `fetch_page()`: 获取网页内容
- `extract_carbon_prices()`: 主提取方法，专门针对碳价格数据格式
- `_extract_from_cea_div()`: 从包含CEA价格信息的div中提取数据
- `_parse_cea_div_text()`: 解析CEA div文本，处理数字序列格式
- `_parse_price_sequence()`: 解析价格数字序列（如83.2083.2080.5081.851.43）
- `get_carbon_prices()`: 获取价格的入口方法，包含完整的数据处理和输出

#### 关键算法：数字序列解析

页面中的价格数据格式：
```
83.2083.2080.5081.851.43
```

解析算法：
1. 查找连续的数字序列
2. 按XX.XX格式分割（每个价格2位小数）
3. 转换为浮点数：83.20, 83.20, 80.50, 81.85, 1.43
4. 对应到：收盘价、最高价、最低价、前收盘价、涨跌幅%

## 扩展功能

### 1. 定时任务
可以结合crontab或Windows任务计划程序实现定时爬取：

```bash
# Linux crontab示例（每天上午9点运行）
0 9 * * * cd /path/to/carbon_crawler && python final_carbon_crawler.py
```

### 2. 数据存储
可以扩展代码将数据保存到数据库：

```python
# 示例：保存到SQLite
import sqlite3
def save_to_database(price_data):
    conn = sqlite3.connect('carbon_prices.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prices (
            date TEXT,
            closing_price REAL,
            highest_price REAL,
            lowest_price REAL,
            change_percent REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # 插入数据...
    conn.commit()
    conn.close()
```

## 注意事项

1. **遵守robots.txt**：检查目标网站的robots.txt文件
2. **请求频率**：避免过于频繁的请求，建议间隔至少30秒
3. **数据使用**：爬取的数据仅用于个人学习和研究
4. **网站变更**：网站结构可能随时变更，需要定期维护爬虫

## 故障排除

### HTTP状态码200但找不到数据
**问题**：运行爬虫显示状态码200成功，但找不到价格数据。

**原因**：使用了基础版爬虫，无法解析页面中的数字序列格式。

**解决方案**：
1. 使用最终版爬虫：`python final_carbon_crawler.py`
2. 运行诊断工具：`python diagnose_no_data.py`
3. 查看`HTTP_200_说明.md`了解详细解释

### 编码问题
如果遇到编码错误，可以尝试：
```python
response.encoding = 'utf-8'  # 或 'gbk', 'gb2312'
```

## 更新日志

### 最终版
- 专门针对碳价格数据格式优化
- 智能解析数字序列（83.2083.2080.5081.851.43）
- 完整的结构化数据输出
- 完善的调试和诊断工具

## 技术支持

如有问题，请：
1. 查看日志文件：`carbon_crawler_final.log`
2. 运行诊断工具：`python diagnose_no_data.py`
3. 查看`debug_final/`目录下的HTML文件
4. 阅读`HTTP_200_说明.md`了解HTTP状态码200的含义

## 免责声明

本工具仅用于技术学习和研究目的。使用本工具爬取数据时，请遵守相关法律法规和网站的使用条款。开发者不对因使用本工具而产生的任何后果负责。