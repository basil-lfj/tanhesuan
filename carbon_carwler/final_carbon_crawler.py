#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最终版碳市场价格爬虫
专门解析 https://www.ccn.ac.cn/cets 网站的碳市场综合行情数据
从页面div中提取完整的结构化价格数据
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
from datetime import datetime
import sys
import os
import logging

class FinalCarbonPriceCrawler:
    def __init__(self, url='https://www.ccn.ac.cn/cets'):
        self.url = url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
        
        # 设置日志
        self.setup_logging()
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler('carbon_crawler_final.log', encoding='utf-8')
            ]
        )
        self.logger = logging.getLogger('carbon_crawler_final')
    
    def fetch_page(self):
        """获取网页内容"""
        try:
            self.logger.info(f"正在获取页面: {self.url}")
            response = self.session.get(self.url, timeout=15)
            response.raise_for_status()
            response.encoding = 'utf-8'
            self.logger.info(f"成功获取页面，状态码: {response.status_code}")
            return response.text
        except requests.exceptions.RequestException as e:
            self.logger.error(f"获取页面失败: {e}")
            return None
    
    def extract_carbon_prices(self, html_content):
        """提取碳价格数据 - 专门针对该网站格式"""
        if not html_content:
            return None
            
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 方法1: 查找包含完整价格信息的div
        price_data = self._extract_from_cea_div(soup)
        if price_data:
            self.logger.info("从CEA div中提取到完整价格数据")
            return price_data
        
        # 方法2: 查找所有包含价格信息的div
        price_data = self._extract_from_all_divs(soup)
        if price_data:
            self.logger.info("从div中提取到价格数据")
            return price_data
        
        # 方法3: 从meta描述中提取基本信息
        price_data = self._extract_basic_info_from_meta(soup)
        if price_data:
            self.logger.info("从meta描述中提取到基本信息")
            return price_data
        
        return None
    
    def _extract_from_cea_div(self, soup):
        """从包含CEA价格信息的div中提取数据"""
        # 查找包含"全国碳市场综合价格行情"的div
        for div in soup.find_all('div'):
            div_text = div.get_text(strip=True)
            if '全国碳市场综合价格行情' in div_text and 'CEA' in div_text:
                self.logger.info(f"找到CEA价格div: {div_text[:200]}...")
                return self._parse_cea_div_text(div_text)
        
        return None
    
    def _parse_cea_div_text(self, text):
        """解析CEA div文本"""
        # 示例: "全国碳市场综合价格行情（CEA）（2026年3月5日）收盘（元/吨）最高（元/吨）最低（元/吨）收盘（元/吨）涨跌幅（%）83.2083.2080.5081.851.43"
        
        # 提取日期
        date_match = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', text)
        date_str = date_match.group(1) if date_match else datetime.now().strftime('%Y年%m月%d日')
        
        # 提取所有数字（包括小数）
        # 注意：数字可能连在一起，需要正确分割
        numbers = re.findall(r'\d+\.?\d*', text)
        
        # 查找数字序列 - 通常价格是83.20, 83.20, 80.50, 81.85, 1.43这样的格式
        # 但在文本中可能连在一起：83.2083.2080.5081.851.43
        # 我们需要解析这个序列
        
        # 方法：查找文本中的数字序列部分
        number_sequence_match = re.search(r'(\d+\.\d+){5,}', text.replace(' ', ''))
        if number_sequence_match:
            sequence = number_sequence_match.group(0)
            self.logger.info(f"找到数字序列: {sequence}")
            
            # 尝试解析序列 - 假设格式为XX.XXYY.YYZZ.ZZAA.AABB.BB
            # 其中每个价格是2位小数
            prices = self._parse_price_sequence(sequence)
            
            if len(prices) >= 5:
                return {
                    'date': date_str,
                    'market': '全国碳市场',
                    'product': 'CEA (碳排放配额)',
                    'closing_price': prices[0],      # 收盘价
                    'highest_price': prices[1],      # 最高价
                    'lowest_price': prices[2],       # 最低价
                    'previous_close': prices[3],     # 前收盘价
                    'change_percent': prices[4],     # 涨跌幅%
                    'unit': '元/吨',
                    'source': '全国碳市场综合价格行情',
                    'data_source': '上海环境能源交易所/全国碳市场',
                    'extraction_method': 'CEA div解析',
                    'raw_sequence': sequence
                }
        
        # 如果无法解析序列，返回找到的所有数字
        if numbers:
            float_numbers = [float(num) for num in numbers if self._is_valid_price(num)]
            if float_numbers:
                return {
                    'date': date_str,
                    'market': '全国碳市场',
                    'product': 'CEA (碳排放配额)',
                    'prices_found': float_numbers,
                    'unit': '元/吨',
                    'source': '全国碳市场综合价格行情',
                    'extraction_method': '数字提取',
                    'raw_text': text[:300]
                }
        
        return None
    
    def _parse_price_sequence(self, sequence):
        """解析价格数字序列"""
        # 尝试不同的解析方法
        
        # 方法1: 假设每个价格是2位小数
        # 序列如: 83.2083.2080.5081.851.43
        # 应该分割为: 83.20, 83.20, 80.50, 81.85, 1.43
        
        prices = []
        i = 0
        while i < len(sequence):
            # 查找小数点
            dot_pos = sequence.find('.', i)
            if dot_pos == -1 or dot_pos + 3 > len(sequence):
                break
            
            # 提取XX.XX格式的数字
            price_str = sequence[i:dot_pos + 3]  # 取小数点后2位
            try:
                price = float(price_str)
                prices.append(price)
                i = dot_pos + 3  # 移动到下一个数字
            except ValueError:
                # 如果解析失败，尝试其他方法
                break
        
        # 如果成功解析出5个价格，返回
        if len(prices) >= 5:
            return prices[:5]
        
        # 方法2: 使用正则表达式查找所有XX.XX格式的数字
        price_matches = re.findall(r'\d{2,3}\.\d{2}', sequence)
        if len(price_matches) >= 5:
            return [float(p) for p in price_matches[:5]]
        
        return []
    
    def _is_valid_price(self, num_str):
        """检查是否为有效的价格数字"""
        try:
            num = float(num_str)
            # 碳价格通常在50-150元/吨之间，涨跌幅在-10%到10%之间
            if 0 < num < 200 or -20 < num < 20:
                return True
        except ValueError:
            pass
        return False
    
    def _extract_from_all_divs(self, soup):
        """从所有div中提取价格信息"""
        price_divs = []
        
        for div in soup.find_all('div'):
            text = div.get_text(strip=True)
            # 查找包含价格关键词和数字的div
            price_keywords = ['收盘', '最高', '最低', '涨跌幅', '元/吨', 'CEA', '碳市场']
            if any(keyword in text for keyword in price_keywords) and re.search(r'\d+\.?\d*', text):
                if len(text) < 500:  # 避免过长的文本
                    price_divs.append(text)
        
        if price_divs:
            self.logger.info(f"找到 {len(price_divs)} 个价格相关div")
            # 返回第一个最相关的div
            return self._parse_general_div(price_divs[0])
        
        return None
    
    def _parse_general_div(self, text):
        """解析一般div文本"""
        # 提取日期
        date_match = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', text)
        date_str = date_match.group(1) if date_match else datetime.now().strftime('%Y年%m月%d日')
        
        # 提取所有有效价格数字
        all_numbers = re.findall(r'\d+\.?\d*', text)
        valid_prices = [float(num) for num in all_numbers if self._is_valid_price(num)]
        
        if valid_prices:
            return {
                'date': date_str,
                'market': '全国碳市场',
                'prices': valid_prices,
                'unit': '元/吨',
                'source': '页面div提取',
                'raw_text_preview': text[:200]
            }
        
        return None
    
    def _extract_basic_info_from_meta(self, soup):
        """从meta描述中提取基本信息"""
        meta_desc = soup.find('meta', property='og:description')
        if not meta_desc:
            meta_desc = soup.find('meta', attrs={'name': 'description'})
        
        if meta_desc:
            desc = meta_desc.get('content', '')
            self.logger.info(f"找到meta描述: {desc[:150]}...")
            
            # 提取日期
            date_match = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', desc)
            date_str = date_match.group(1) if date_match else datetime.now().strftime('%Y年%m月%d日')
            
            return {
                'date': date_str,
                'market': '全国碳市场',
                'product': 'CEA (碳排放配额)',
                'description': desc,
                'unit': '元/吨',
                'source': 'meta描述',
                'note': '价格数据在页面内容中，需要进一步解析'
            }
        
        return None
    
    def get_carbon_prices(self):
        """获取碳价格数据的主函数"""
        self.logger.info("=" * 60)
        self.logger.info("最终版碳市场价格爬虫开始运行")
        self.logger.info("=" * 60)
        
        html_content = self.fetch_page()
        if not html_content:
            self.logger.error("无法获取网页内容")
            return None
        
        # 保存HTML用于调试
        debug_dir = 'debug_final'
        if not os.path.exists(debug_dir):
            os.makedirs(debug_dir)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        debug_file = os.path.join(debug_dir, f'page_{timestamp}.html')
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        self.logger.info(f"已保存页面到: {debug_file}")
        
        # 提取价格数据
        price_data = self.extract_carbon_prices(html_content)
        
        if price_data:
            self.logger.info("\n" + "=" * 60)
            self.logger.info("成功提取碳价格数据:")
            self.logger.info("=" * 60)
            
            # 打印数据
            for key, value in price_data.items():
                self.logger.info(f"  {key}: {value}")
            
            # 保存数据到JSON文件
            output_file = f'carbon_prices_final_{timestamp}.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(price_data, f, ensure_ascii=False, indent=2)
            self.logger.info(f"\n数据已保存到: {output_file}")
            
            # 打印用户友好的摘要
            print("\n" + "=" * 60)
            print("全国碳市场价格数据")
            print("=" * 60)
            
            if 'closing_price' in price_data:
                print(f"日期: {price_data.get('date', '未知')}")
                print(f"市场: {price_data.get('market', '未知')}")
                print(f"产品: {price_data.get('product', '未知')}")
                print(f"收盘价: {price_data.get('closing_price', '未知')} {price_data.get('unit', '')}")
                print(f"最高价: {price_data.get('highest_price', '未知')} {price_data.get('unit', '')}")
                print(f"最低价: {price_data.get('lowest_price', '未知')} {price_data.get('unit', '')}")
                print(f"涨跌幅: {price_data.get('change_percent', '未知')}%")
                print(f"数据来源: {price_data.get('data_source', price_data.get('source', '未知'))}")
            elif 'prices' in price_data:
                print(f"日期: {price_data.get('date', '未知')}")
                print(f"市场: {price_data.get('market', '未知')}")
                print(f"找到的价格数据: {price_data.get('prices', [])}")
                print(f"单位: {price_data.get('unit', '')}")
            else:
                print(f"日期: {price_data.get('date', '未知')}")
                print(f"市场: {price_data.get('market', '未知')}")
                print(f"产品: {price_data.get('product', '未知')}")
                print(f"说明: {price_data.get('note', '价格数据已提取')}")
            
            print(f"\n详细数据已保存到: {output_file}")
            print("日志文件: carbon_crawler_final.log")
            
        else:
            self.logger.warning("\n" + "=" * 60)
            self.logger.warning("警告: 未找到价格数据")
            self.logger.warning("=" * 60)
            
            print("\n" + "=" * 60)
            print("未找到结构化的价格数据")
            print("=" * 60)
            print("可能的原因:")
            print("1. 页面结构已更改")
            print("2. 价格数据以不同格式呈现")
            print("3. 需要JavaScript渲染")
            print(f"\n已保存页面到 {debug_dir} 目录供进一步分析")
            print("建议运行 manual_debug.py 进行详细分析")
        
        return price_data

def main():
    """主函数"""
    crawler = FinalCarbonPriceCrawler()
    
    try:
        print("最终版碳市场价格爬虫")
        print("=" * 60)
        
        price_data = crawler.get_carbon_prices()
        
        if price_data:
            print("\n" + "=" * 60)
            print("爬虫执行成功!")
            print("=" * 60)
            return 0
        else:
            print("\n" + "=" * 60)
            print("爬虫执行完成，但未找到完整的价格数据")
            print("=" * 60)
            print("请查看日志文件 carbon_crawler_final.log 获取详细信息")
            return 1
            
    except KeyboardInterrupt:
        print("\n用户中断程序")
        return 130
    except Exception as e:
        print(f"\n程序执行出错: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())