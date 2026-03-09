# 碳市场模块集成说明

## 功能概述

已成功将新闻中心模块替换为碳市场模块，并整合了carbon_carwler爬虫数据。

## 主要修改

### 1. HTML结构调整
- **删除**：新闻中心模块
- **新增**：碳市场模块
- **导航栏**：将"新闻中心"链接改为"碳市场"

### 2. 碳市场模块功能

#### CEA配额
展示全国碳排放配额交易数据：
- 开盘价
- 最高价
- 最低价
- 收盘价
- 数据日期
- 市场信息
- 数据来源

#### CCER (核证自愿减排量)
展示自愿减排交易市场数据：
- 交易量（万吨）
- 交易额（万元）
- 平均价（元/吨）
- 数据日期
- 市场信息
- 数据来源

#### 行情趋势
展示价格走势图表：
- CEA价格曲线
- CCER价格曲线
- 使用Canvas绘制的简洁图表
- 图例说明

### 3. 样式设计

参考原网站信息公开模块的样式：
- 标签页切换界面
- 卡片式数据展示
- 信息列表展示
- 灰色背景区块
- 白色卡片
- 圆角设计

### 4. 数据来源

当前使用模拟数据（基于carbon_carwler目录中的JSON文件）：

```json
{
  "crawl_time": "2026-03-08 17:48:45",
  "data_date": "2026年3月6日",
  "cea": {
    "date": "2026年3月6日",
    "open_price": 81.85,
    "high_price": null,
    "low_price": null,
    "close_price": 81.85,
    "market": "全国碳市场",
    "product": "CEA (碳排放配额)",
    "unit": "元/吨",
    "source": "上海环境能源交易所"
  },
  "ccer": {
    "date": "2026年3月6日",
    "volume": 201.0,
    "amount": 17687.0,
    "avg_price": 88.0,
    "market": "全国温室气体自愿减排交易市场",
    "product": "CCER (核证自愿减排量)",
    "unit": "元/吨",
    "source": "北京绿色交易所"
  }
}
```

### 5. JavaScript功能

- **数据加载**：自动加载碳市场数据
- **标签页切换**：CEA、CCER、行情趋势三个标签页
- **图表绘制**：使用Canvas API绘制趋势图表
- **滚动动画**：元素进入视口时的渐入动画

## 如何使用实时数据

### 方法一：使用本地JSON文件

1. 将carbon_carwler目录复制到项目根目录
2. 在script.js中修改数据加载逻辑：

```javascript
async function loadCarbonData() {
    try {
        const response = await fetch('../carbon_carwler/carbon_prices_complete_20260308_174845.json');
        const data = await response.json();
        
        // 更新CEA数据
        document.getElementById('cea-open').textContent = data.cea.open_price;
        document.getElementById('cea-high').textContent = data.cea.high_price || '--';
        document.getElementById('cea-low').textContent = data.cea.low_price || '--';
        document.getElementById('cea-close').textContent = data.cea.close_price;
        document.getElementById('cea-date').textContent = data.cea.date;
        
        // 更新CCER数据
        document.getElementById('ccer-volume').textContent = data.ccer.volume;
        document.getElementById('ccer-amount').textContent = data.ccer.amount;
        document.getElementById('ccer-avg').textContent = data.ccer.avg_price;
        document.getElementById('ccer-date').textContent = data.ccer.date;
        
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}
```

### 方法二：使用API接口

如果有后端API，可以通过API获取最新数据：

```javascript
async function loadCarbonDataFromAPI() {
    try {
        const response = await fetch('/api/carbon-market/latest');
        const data = await response.json();
        // 更新页面数据
    } catch (error) {
        console.error('获取API数据失败:', error);
    }
}
```

### 方法三：WebSocket实时推送

对于实时性要求高的场景，可以使用WebSocket：

```javascript
function initWebSocket() {
    const ws = new WebSocket('ws://your-server/carbon-market');
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        updateMarketData(data);
    };
    
    ws.onclose = function() {
        console.log('WebSocket连接已关闭');
    };
}
```

## 响应式适配

- **桌面端**（>1024px）：4列布局
- **平板端**（768px-1024px）：2列布局
- **手机端**（<768px）：2列布局，标签页支持换行

## 数据自动更新

建议添加定时刷新功能：

```javascript
function autoRefresh() {
    // 每5分钟刷新一次数据
    setInterval(loadCarbonData, 5 * 60 * 1000);
}
```

## 扩展功能建议

1. **添加更多数据源**
   - 其他地方碳市场数据
   - 国际碳市场价格
   - 碳配额政策信息

2. **增强图表功能**
   - 使用ECharts或Chart.js替换Canvas
   - 添加K线图
   - 添加成交量柱状图
   - 添加更多时间维度

3. **数据导出功能**
   - 导出为Excel
   - 导出为PDF
   - 导出为CSV

4. **预警系统**
   - 价格波动预警
   - 交易量异常预警
   - 配额超限预警

5. **数据对比功能**
   - 不同市场对比
   - 历史数据对比
   - 同比/环比分析

## 文件清单

修改的文件：
- `index.html` - 删除新闻中心，添加碳市场模块
- `style.css` - 删除新闻中心样式，添加碳市场样式
- `script.js` - 添加碳市场数据加载和图表绘制

数据文件：
- `carbon_carwler/` - 碳市场爬虫数据目录

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事项

1. 当前使用模拟数据，需要根据实际情况替换为真实数据
2. 图表使用Canvas绘制，如需更复杂的图表建议使用ECharts
3. 数据更新时可以添加动画过渡效果
4. 确保数据格式与爬虫输出格式一致

## 联系方式

如有问题，请查看项目README文档或联系开发人员。

---

**更新日期**：2026-03-08
**版本**：v2.0
**功能**：碳市场数据展示模块
