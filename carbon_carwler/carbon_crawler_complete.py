#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
碳市场价格爬虫 - 完整版
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
                logging.StreamHandler(sys.stdout),
                logging.FileHandler('carbon_crawler_complete.log', encoding='utf-8')
            ]
        )
        self.logger = logging.getLogger('carbon_crawler_complete')
    
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
            
            # 找到CEA数据容器 - h3后面的div.wp-block-group
            cea_div = cea_h3.find_next_sibling('div')
            if not cea_div:
                # 尝试找父级
                parent = cea_h3.find_parent('div')
                cea_div = parent
            
            # 在CEA区域内查找所有p标签
            cea_values = []
            change_value = None
            
            if cea_div:
                # 查找所有带has-text-align-center类的p标签
                for p in cea_div.find_all('p', class_='has-text-align-center'):
                    text = p.get_text(strip=True)
                    # 检查是否是数值或——
                    if re.match(r'^-?[\d\.]+$', text) or text == '——':
                        cea_values.append(text)
                    
                    # 检查marquee标签内的数值（涨跌幅）
                    marquee = p.find('marquee')
                    if marquee:
                        # 获取marquee内的p标签文本
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
            
            # 添加涨跌幅
            if change_value is not None:
                result['change_percent'] = change_value
            
            # 添加元数据
            if result:
                result['market'] = '全国碳市场'
                result['product'] = 'CEA (碳排放配额)'
                result['unit'] = '元/吨'
                result['source'] = '上海环境能源交易所'
                result['data_type'] = 'CEA'
            
            return result if result else None
            
        except Exception as e:
            self.logger.error(f"提取CEA数据失败: {e}")
            import traceback
            traceback.print_exc()
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
            
            # 提取日期 - 从h3的sub标签中
            sub = ccer_h3.find('sub')
            if sub:
                date_match = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', sub.get_text())
                if date_match:
                    result['date'] = date_match.group(1)
            
            # 找到CCER数据容器 - h3后面的div.wp-block-group
            ccer_div = ccer_h3.find_next_sibling('div')
            if not ccer_div:
                # 尝试找父级
                parent = ccer_h3.find_parent('div')
                ccer_div = parent
            
            # 在CCER区域内查找所有p标签
            ccer_values = []
            change_value = None
            
            if ccer_div:
                # 查找所有带has-text-align-center类的p标签
                for p in ccer_div.find_all('p', class_='has-text-align-center'):
                    text = p.get_text(strip=True)
                    # 检查是否是数值或——
                    if re.match(r'^-?[\d\.]+$', text) or text == '——':
                        ccer_values.append(text)
                    
                    # 检查marquee标签内的数值（涨跌幅）
                    marquee = p.find('marquee')
                    if marquee:
                        # 获取marquee内的p标签文本
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
            
            # 添加涨跌幅
            if change_value is not None:
                result['change_percent'] = change_value
            
            # 添加元数据
            if result:
                result['market'] = '全国温室气体自愿减排交易市场'
                result['product'] = 'CCER (核证自愿减排量)'
                result['unit'] = '元/吨'
                result['source'] = '北京绿色交易所'
                result['data_type'] = 'CCER'
            
            return result if result else None
            
        except Exception as e:
            self.logger.error(f"提取CCER数据失败: {e}")
            import traceback
            traceback.print_exc()
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
        
        # 保存HTML用于调试
        debug_dir = 'debug_complete'
        if not os.path.exists(debug_dir):
            os.makedirs(debug_dir)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        debug_file = os.path.join(debug_dir, f'page_{timestamp}.html')
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        self.logger.info(f"已保存页面到: {debug_file}")
        
        # 提取价格数据
        price_data = self.extract_all_prices(html_content)
        
        if price_data:
            self.logger.info("\n" + "=" * 60)
            self.logger.info("成功提取碳价格数据:")
            self.logger.info("=" * 60)
            
            # 打印CEA数据
            if price_data.get('cea'):
                self.logger.info("\n【全国碳市场综合价格行情（CEA）】")
                cea = price_data['cea']
                for key, value in cea.items():
                    self.logger.info(f"  {key}: {value}")
            
            # 打印CCER数据
            if price_data.get('ccer'):
                self.logger.info("\n【全国温室气体自愿减排交易行情（CCER）】")
                ccer = price_data['ccer']
                for key, value in ccer.items():
                    self.logger.info(f"  {key}: {value}")
            
            # 保存数据到JSON文件
            output_file = f'carbon_prices_complete_{timestamp}.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(price_data, f, ensure_ascii=False, indent=2)
            self.logger.info(f"\n数据已保存到: {output_file}")
            
            # 打印用户友好的摘要
            self._print_summary(price_data)
            
        else:
            self.logger.warning("\n" + "=" * 60)
            self.logger.warning("警告: 未找到价格数据")
            self.logger.warning("=" * 60)
        
        return price_data
    
    def _print_summary(self, price_data):
        """打印数据摘要"""
        print("\n" + "=" * 70)
        print("                    全国碳市场行情数据摘要")
        print("=" * 70)
        
        # CEA数据摘要
        if price_data.get('cea'):
            cea = price_data['cea']
            print(f"\n【全国碳市场综合价格行情（CEA）】")
            print(f"  数据日期: {cea.get('date', '未知')}")
            open_price = cea.get('open_price')
            print(f"  开盘价: {open_price} 元/吨" if open_price else "  开盘价: -- 元/吨")
            high_price = cea.get('high_price')
            print(f"  最高价: {high_price} 元/吨" if high_price else "  最高价: -- 元/吨")
            low_price = cea.get('low_price')
            print(f"  最低价: {low_price} 元/吨" if low_price else "  最低价: -- 元/吨")
            close_price = cea.get('close_price')
            print(f"  收盘价: {close_price} 元/吨" if close_price else "  收盘价: -- 元/吨")
            change = cea.get('change_percent')
            if change is not None:
                change_str = f"+{change}" if change > 0 else str(change)
                print(f"  涨跌幅: {change_str}%")
            else:
                print(f"  涨跌幅: --")
            print(f"  数据来源: {cea.get('source', '未知')}")
        
        # CCER数据摘要
        if price_data.get('ccer'):
            ccer = price_data['ccer']
            print(f"\n【全国温室气体自愿减排交易行情（CCER）】")
            print(f"  数据日期: {ccer.get('date', '未知')}")
            volume = ccer.get('volume')
            print(f"  成交量: {volume:,.0f} 吨" if volume else "  成交量: -- 吨")
            amount = ccer.get('amount')
            print(f"  成交额: {amount:,.2f} 元" if amount else "  成交额: -- 元")
            avg_price = ccer.get('avg_price')
            print(f"  平均价: {avg_price} 元/吨" if avg_price else "  平均价: -- 元/吨")
            change = ccer.get('change_percent')
            if change is not None:
                change_str = f"+{change}" if change > 0 else str(change)
                print(f"  涨跌幅: {change_str}%")
            else:
                print(f"  涨跌幅: --")
            print(f"  数据来源: {ccer.get('source', '未知')}")
        
        print("\n" + "-" * 70)
        print(f"  爬取时间: {price_data.get('crawl_time', '未知')}")
        print("=" * 70)


def main():
    """主函数"""
    crawler = CarbonPriceCrawler()
    
    try:
        print("碳市场价格爬虫 - 完整版")
        print("=" * 60)
        
        price_data = crawler.get_carbon_prices()
        
        if price_data:
            print("\n爬虫执行成功!")
            return 0
        else:
            print("\n爬虫执行完成，但未找到完整的价格数据")
            print("请查看日志文件 carbon_crawler_complete.log 获取详细信息")
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