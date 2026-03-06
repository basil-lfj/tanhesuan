#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
碳市场价格爬虫监控后端服务器
提供REST API接口供前端调用
"""

import os
import sys
import json
import glob
import logging
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from threading import Thread
import time

# 导入爬虫模块
from final_carbon_crawler import FinalCarbonPriceCrawler

app = Flask(__name__, 
            static_folder='dashboard',
            static_url_path='')
CORS(app)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('crawler_server')

# 全局状态
crawler_state = {
    'is_running': False,
    'last_run': None,
    'status': 'idle',
    'message': ''
}

# 爬虫实例
crawler = None


def get_crawler():
    """获取爬虫实例"""
    global crawler
    if crawler is None:
        crawler = FinalCarbonPriceCrawler()
    return crawler


# 获取脚本所在目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def get_data_files():
    """获取所有数据文件列表"""
    pattern = os.path.join(BASE_DIR, 'carbon_prices_final_*.json')
    files = glob.glob(pattern)
    files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    return files


def parse_log_file():
    """解析日志文件"""
    log_file = os.path.join(BASE_DIR, 'carbon_crawler_final.log')
    logs = []
    
    if os.path.exists(log_file):
        with open(log_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for line in lines[-100:]:  # 只取最近100行
            line = line.strip()
            if line:
                logs.append(line)
    
    return logs


# ================== API路由 ==================

@app.route('/')
def index():
    """返回前端页面"""
    return send_from_directory('dashboard', 'index.html')


@app.route('/api/status')
def get_status():
    """获取爬虫状态"""
    return jsonify({
        'status': crawler_state['status'],
        'is_running': crawler_state['is_running'],
        'last_run': crawler_state['last_run'],
        'message': crawler_state['message'],
        'server_time': datetime.now().isoformat()
    })


@app.route('/api/data/latest')
def get_latest_data():
    """获取最新数据"""
    try:
        files = get_data_files()
        
        if not files:
            return jsonify({
                'success': False,
                'message': '暂无数据文件'
            }), 404
        
        # 读取最新的数据文件
        latest_file = files[0]
        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 提取时间戳
        filename = os.path.basename(latest_file)
        timestamp = extract_timestamp(filename)
        
        return jsonify({
            'success': True,
            'data': data,
            'file': filename,
            'timestamp': timestamp
        })
        
    except Exception as e:
        logger.error(f'获取最新数据失败: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/data/history')
def get_history_data():
    """获取历史数据列表"""
    try:
        files = get_data_files()
        history = []
        
        for file in files:
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                filename = os.path.basename(file)
                timestamp = extract_timestamp(filename)
                
                history.append({
                    'file': filename,
                    'timestamp': timestamp,
                    'date': data.get('date', '--'),
                    'closing_price': data.get('closing_price', '--'),
                    'data': data
                })
            except Exception as e:
                logger.warning(f'读取文件 {file} 失败: {e}')
                continue
        
        return jsonify({
            'success': True,
            'count': len(history),
            'history': history
        })
        
    except Exception as e:
        logger.error(f'获取历史数据失败: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/data/file/<filename>')
def get_data_by_file(filename):
    """获取指定文件的数据"""
    try:
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'message': '文件不存在'
            }), 404
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        timestamp = extract_timestamp(filename)
        
        return jsonify({
            'success': True,
            'data': data,
            'file': filename,
            'timestamp': timestamp
        })
        
    except Exception as e:
        logger.error(f'获取数据失败: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/logs')
def get_logs():
    """获取爬虫日志"""
    try:
        logs = parse_log_file()
        
        return jsonify({
            'success': True,
            'count': len(logs),
            'logs': logs
        })
        
    except Exception as e:
        logger.error(f'获取日志失败: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/crawler/run', methods=['POST'])
def run_crawler():
    """运行爬虫"""
    global crawler_state
    
    if crawler_state['is_running']:
        return jsonify({
            'success': False,
            'message': '爬虫正在运行中，请稍候'
        })
    
    # 在后台线程中运行爬虫
    def run_in_background():
        global crawler_state
        
        try:
            crawler_state['is_running'] = True
            crawler_state['status'] = 'running'
            crawler_state['message'] = '爬虫正在运行...'
            
            crawler = get_crawler()
            result = crawler.get_carbon_prices()
            
            if result:
                crawler_state['status'] = 'success'
                crawler_state['message'] = '数据获取成功'
            else:
                crawler_state['status'] = 'warning'
                crawler_state['message'] = '未获取到数据'
                
        except Exception as e:
            crawler_state['status'] = 'error'
            crawler_state['message'] = str(e)
            logger.error(f'爬虫运行失败: {e}')
            
        finally:
            crawler_state['is_running'] = False
            crawler_state['last_run'] = datetime.now().isoformat()
    
    thread = Thread(target=run_in_background)
    thread.start()
    
    return jsonify({
        'success': True,
        'message': '爬虫已启动'
    })


@app.route('/api/compare', methods=['POST'])
def compare_data():
    """比较两组数据"""
    try:
        data = request.get_json()
        old_data = data.get('old', {})
        new_data = data.get('new', {})
        
        changes = []
        keys_to_compare = ['closing_price', 'highest_price', 'lowest_price', 
                          'previous_close', 'change_percent', 'date']
        
        for key in keys_to_compare:
            old_val = old_data.get(key)
            new_val = new_data.get(key)
            
            if old_val != new_val:
                changes.append({
                    'field': get_field_label(key),
                    'key': key,
                    'old_value': old_val,
                    'new_value': new_val
                })
        
        return jsonify({
            'success': True,
            'has_changes': len(changes) > 0,
            'changes': changes
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


def extract_timestamp(filename):
    """从文件名提取时间戳"""
    import re
    match = re.search(r'(\d{8})_(\d{6})', filename)
    if match:
        return int(match.group(1) + match.group(2))
    return 0


def get_field_label(key):
    """获取字段中文标签"""
    labels = {
        'closing_price': '收盘价',
        'highest_price': '最高价',
        'lowest_price': '最低价',
        'previous_close': '前收盘价',
        'change_percent': '涨跌幅',
        'date': '日期',
        'market': '市场',
        'product': '产品'
    }
    return labels.get(key, key)


# ================== 静态文件路由 ==================

@app.route('/carbon_prices_final_<path:filename>')
def serve_data_file(filename):
    """提供数据文件访问"""
    return send_from_directory(os.path.dirname(__file__), 
                              f'carbon_prices_final_{filename}')


@app.route('/carbon_crawler_final.log')
def serve_log_file():
    """提供日志文件访问"""
    return send_from_directory(os.path.dirname(__file__), 
                              'carbon_crawler_final.log')


# ================== 启动服务器 ==================

def main():
    """主函数"""
    print("=" * 60)
    print("碳市场价格爬虫监控服务器")
    print("=" * 60)
    print()
    print("服务地址: http://localhost:5000")
    print("API文档: http://localhost:5000/api/status")
    print()
    print("可用API接口:")
    print("  GET  /api/status        - 获取爬虫状态")
    print("  GET  /api/data/latest   - 获取最新数据")
    print("  GET  /api/data/history  - 获取历史数据")
    print("  GET  /api/logs          - 获取爬虫日志")
    print("  POST /api/crawler/run   - 运行爬虫")
    print("  POST /api/compare       - 比较数据变化")
    print()
    print("按 Ctrl+C 停止服务器")
    print("=" * 60)
    
    # 启动Flask服务器
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)


if __name__ == '__main__':
    main()