#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
碳市场价格爬虫模块
爬取全国碳市场综合价格行情（CEA）和全国温室气体自愿减排交易行情（CCER）
数据来源：https://www.ccn.ac.cn/cets
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
from datetime import datetime, timedelta
import sys
import os
import logging

class CarbonPriceCrawler:
    """碳市场价格爬虫 - 同时提取CEA和CCER数据"""
    
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
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger('carbon_crawler')
    
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
    
    def extract_all_prices(self, html_content):
        """提取所有价格数据 - CEA和CCER"""
        if not html_content:
            return None
            
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 提取CEA数据
        cea_data = self._extract_cea_data(soup)
        
        # 提取CCER数据
        ccer_data = self._extract_ccer_data(soup)
        
        # 合并结果
        result = {
            'crawl_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_date': None,
            'cea': cea_data,
            'ccer': ccer_data
        }
        
        # 从CEA或CCER中获取数据日期
        if cea_data and 'date' in cea_data:
            result['data_date'] = cea_data['date']
        elif ccer_data and 'date' in ccer_data:
            result['data_date'] = ccer_data['date']
        
        return result
    
    def _extract_cea_data(self, soup):
        """提取全国碳市场综合价格行情（CEA）数据"""
        try:
            result = {}
            
            # 查找CEA标题h3
            cea_h3 = None
            for h3 in soup.find_all('h3'):
                h3_text = h3.get_text(strip=True)
                if '全国碳市场综合价格行情' in h3_text and 'CEA' in h3_text:
                    cea_h3 = h3
                    break
            
            if not cea_h3:
                self.logger.warning("未找到CEA标题")
                return None
            
            self.logger.info("找到CEA标题区域")
            
            # 提取日期 - 从h3的sub标签中
            sub = cea_h3.find('sub')
            if sub:
                date_match = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', sub.get_text())
                if date_match:
                    result['date'] = date_match.group(1)
            
            # 找到CEA数据容器
            cea_div = cea_h3.find_next_sibling('div')
            if not cea_div:
                parent = cea_h3.find_parent('div')
                cea_div = parent
            
            # 在CEA区域内查找所有p标签
            cea_values = []
            change_value = None
            
            if cea_div:
                for p in cea_div.find_all('p', class_='has-text-align-center'):
                    text = p.get_text(strip=True)
                    if re.match(r'^-?[\d\.]+$', text) or text == '——':
                        cea_values.append(text)
                    
                    marquee = p.find('marquee')
                    if marquee:
                        marquee_p = marquee.find('p')
                        if marquee_p:
                            marquee_text = marquee_p.get_text(strip=True)
                            if re.match(r'^-?[\d\.]+$', marquee_text):
                                change_value = float(marquee_text)
            
            self.logger.info(f"CEA提取到的数值: {cea_values}, 涨跌幅: {change_value}")
            
            # CEA数据顺序：开盘、最高、最低、收盘、涨跌幅
            if len(cea_values) >= 4:
                result['open_price'] = self._parse_value(cea_values[0])
                result['high_price'] = self._parse_value(cea_values[1])
                result['low_price'] = self._parse_value(cea_values[2])
                result['close_price'] = self._parse_value(cea_values[3])
            elif len(cea_values) >= 1:
                result['open_price'] = self._parse_value(cea_values[0])
                result['close_price'] = self._parse_value(cea_values[0])
            
            if change_value is not None:
                result['change_percent'] = change_value
            
            if result:
                result['market'] = '全国碳市场'
                result['product'] = 'CEA (碳排放配额)'
                result['unit'] = '元/吨'
                result['source'] = '上海环境能源交易所'
                result['data_type'] = 'CEA'
            
            return result if result else None
            
        except Exception as e:
            self.logger.error(f"提取CEA数据失败: {e}")
            return None
    
    def _extract_ccer_data(self, soup):
        """提取全国温室气体自愿减排交易行情（CCER）数据"""
        try:
            result = {}
            
            # 查找CCER标题h3
            ccer_h3 = None
            for h3 in soup.find_all('h3'):
                h3_text = h3.get_text(strip=True)
                if '全国温室气体自愿减排交易行情' in h3_text:
                    ccer_h3 = h3
                    break
            
            if not ccer_h3:
                self.logger.warning("未找到CCER标题")
                return None
            
            self.logger.info("找到CCER标题区域")
            
            # 提取日期
            sub = ccer_h3.find('sub')
            if sub:
                date_match = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', sub.get_text())
                if date_match:
                    result['date'] = date_match.group(1)
            
            # 找到CCER数据容器
            ccer_div = ccer_h3.find_next_sibling('div')
            if not ccer_div:
                parent = ccer_h3.find_parent('div')
                ccer_div = parent
            
            # 在CCER区域内查找所有p标签
            ccer_values = []
            change_value = None
            
            if ccer_div:
                for p in ccer_div.find_all('p', class_='has-text-align-center'):
                    text = p.get_text(strip=True)
                    if re.match(r'^-?[\d\.]+$', text) or text == '——':
                        ccer_values.append(text)
                    
                    marquee = p.find('marquee')
                    if marquee:
                        marquee_p = marquee.find('p')
                        if marquee_p:
                            marquee_text = marquee_p.get_text(strip=True)
                            if re.match(r'^-?[\d\.]+$', marquee_text):
                                change_value = float(marquee_text)
            
            self.logger.info(f"CCER提取到的数值: {ccer_values}, 涨跌幅: {change_value}")
            
            # CCER数据顺序：成交量、成交额、均价、涨跌幅
            if len(ccer_values) >= 3:
                result['volume'] = self._parse_value(ccer_values[0])
                result['amount'] = self._parse_value(ccer_values[1])
                result['avg_price'] = self._parse_value(ccer_values[2])
            elif len(ccer_values) >= 1:
                result['volume'] = self._parse_value(ccer_values[0])
            
            if change_value is not None:
                result['change_percent'] = change_value
            
            if result:
                result['market'] = '全国温室气体自愿减排交易市场'
                result['product'] = 'CCER (核证自愿减排量)'
                result['unit'] = '元/吨'
                result['source'] = '北京绿色交易所'
                result['data_type'] = 'CCER'
            
            return result if result else None
            
        except Exception as e:
            self.logger.error(f"提取CCER数据失败: {e}")
            return None
    
    def _parse_value(self, value_str):
        """解析数值，处理——等特殊情况"""
        if value_str == '——' or value_str == '-':
            return None
        try:
            return float(value_str)
        except ValueError:
            return None
    
    def get_carbon_prices(self):
        """获取碳价格数据的主函数"""
        self.logger.info("=" * 60)
        self.logger.info("碳市场价格爬虫开始运行")
        self.logger.info("=" * 60)
        
        html_content = self.fetch_page()
        if not html_content:
            self.logger.error("无法获取网页内容")
            return None
        
        # 提取价格数据
        price_data = self.extract_all_prices(html_content)
        
        if price_data:
            self.logger.info("成功提取碳价格数据")
            
            if price_data.get('cea'):
                self.logger.info(f"CEA数据: {price_data['cea']}")
            
            if price_data.get('ccer'):
                self.logger.info(f"CCER数据: {price_data['ccer']}")
        else:
            self.logger.warning("未找到价格数据")
        
        return price_data


def main():
    """主函数"""
    crawler = CarbonPriceCrawler()
    
    try:
        print("碳市场价格爬虫")
        print("=" * 60)
        
        price_data = crawler.get_carbon_prices()
        
        if price_data:
            print("\n爬虫执行成功!")
            print(json.dumps(price_data, ensure_ascii=False, indent=2))
            return 0
        else:
            print("\n爬虫执行完成，但未找到完整的价格数据")
            return 1
            
    except KeyboardInterrupt:
        print("\n用户中断")
        return 1
    except Exception as e:
        print(f"\n执行出错: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())