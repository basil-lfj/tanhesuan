#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
手动调试脚本
用于手动分析和调试碳价格数据提取
"""

import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime

def manual_debug_analysis():
    """手动调试分析"""
    print("碳价格数据手动调试工具")
    print("=" * 60)
    
    url = 'https://www.ccn.ac.cn/cets'
    
    try:
        # 1. 获取页面
        print("1. 获取页面内容...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.encoding = 'utf-8'
        
        print(f"   状态码: {response.status_code}")
        print(f"   页面大小: {len(response.text)} 字符")
        
        # 2. 保存原始HTML
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        html_file = f'manual_debug_{timestamp}.html'
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(response.text)
        print(f"   已保存HTML到: {html_file}")
        
        # 3. 解析HTML
        print("\n2. 解析HTML结构...")
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 3.1 查找meta描述
        print("\n3. 查找meta描述:")
        meta_desc = soup.find('meta', property='og:description')
        if meta_desc:
            desc = meta_desc.get('content', '')
            print(f"   og:description: {desc[:200]}...")
            
            # 从描述中提取信息
            date_match = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', desc)
            if date_match:
                print(f"   找到日期: {date_match.group(1)}")
            
            # 查找价格数字
            prices = re.findall(r'\d+\.\d+', desc)
            if prices:
                print(f"   找到价格数字: {prices}")
            else:
                print("   描述中没有找到价格数字")
        else:
            print("   未找到og:description")
        
        # 3.2 查找页面标题
        print("\n4. 页面标题:")
        title = soup.title.string if soup.title else "无标题"
        print(f"   {title}")
        
        # 3.3 查找所有包含价格的元素
        print("\n5. 搜索页面中的价格信息:")
        
        # 方法1: 查找所有包含数字的文本
        print("\n   方法1: 查找所有小数数字")
        all_text = soup.get_text()
        all_numbers = re.findall(r'\d+\.\d+', all_text)
        print(f"   找到 {len(all_numbers)} 个小数数字")
        print(f"   前10个数字: {all_numbers[:10]}")
        
        # 方法2: 查找特定模式
        print("\n   方法2: 查找价格模式")
        patterns = [
            (r'收盘.*?(\d+\.\d+)', '收盘价'),
            (r'最高.*?(\d+\.\d+)', '最高价'),
            (r'最低.*?(\d+\.\d+)', '最低价'),
            (r'涨跌幅.*?(\d+\.\d+)', '涨跌幅'),
            (r'(\d+\.\d+)\s*元/吨', '元/吨价格')
        ]
        
        for pattern, name in patterns:
            matches = re.findall(pattern, all_text)
            if matches:
                print(f"   {name}: 找到 {len(matches)} 个匹配")
                for i, match in enumerate(matches[:3]):
                    print(f"     匹配{i+1}: {match}")
        
        # 方法3: 查找包含关键词的div
        print("\n   方法3: 查找包含价格关键词的div")
        price_keywords = ['CEA', '碳市场', '价格', '收盘', '开盘', '最高', '最低']
        found_divs = []
        
        for div in soup.find_all('div'):
            text = div.get_text(strip=True)
            if any(keyword in text for keyword in price_keywords) and re.search(r'\d+', text):
                if len(text) < 300:  # 避免过长的文本
                    found_divs.append(text)
        
        print(f"   找到 {len(found_divs)} 个相关div")
        for i, text in enumerate(found_divs[:5]):
            print(f"   Div {i+1}: {text[:150]}...")
        
        # 3.4 查找表格
        print("\n6. 查找表格:")
        tables = soup.find_all('table')
        print(f"   找到 {len(tables)} 个表格")
        
        for i, table in enumerate(tables[:3]):  # 只检查前3个表格
            rows = table.find_all('tr')
            print(f"   表格 {i+1}: {len(rows)} 行")
            
            # 检查表格内容
            for j, row in enumerate(rows[:3]):  # 只检查前3行
                cells = [cell.get_text(strip=True) for cell in row.find_all(['td', 'th'])]
                if cells and any(re.search(r'\d+', cell) for cell in cells):
                    print(f"     行 {j+1}: {cells}")
        
        # 4. 生成调试报告
        print("\n7. 生成调试报告...")
        debug_report = {
            'timestamp': timestamp,
            'url': url,
            'status_code': response.status_code,
            'page_size': len(response.text),
            'title': title,
            'meta_description': desc if 'desc' in locals() else None,
            'found_numbers': all_numbers[:20],
            'price_patterns': {},
            'relevant_divs': found_divs[:10],
            'table_count': len(tables)
        }
        
        # 保存报告
        report_file = f'debug_report_{timestamp}.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(debug_report, f, ensure_ascii=False, indent=2)
        
        print(f"   调试报告已保存到: {report_file}")
        
        # 5. 总结
        print("\n" + "=" * 60)
        print("调试总结:")
        print("=" * 60)
        print(f"1. 页面获取: {'成功' if response.status_code == 200 else '失败'}")
        print(f"2. 找到数字: {len(all_numbers)} 个")
        print(f"3. 相关div: {len(found_divs)} 个")
        print(f"4. 表格数量: {len(tables)} 个")
        
        if all_numbers:
            print(f"\n建议的价格数据提取策略:")
            print("1. 从meta描述中提取日期和价格关键词")
            print("2. 使用正则表达式匹配价格模式")
            print("3. 查找包含'CEA'和数字的div元素")
            print("4. 如果以上方法失败，考虑页面可能需要JavaScript渲染")
        
        print("\n" + "=" * 60)
        print("调试完成!")
        print("=" * 60)
        
    except Exception as e:
        print(f"调试过程中出错: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    manual_debug_analysis()