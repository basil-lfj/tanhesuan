@echo off
echo 碳市场价格爬虫启动
echo ========================================

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.6+
    pause
    exit /b 1
)

REM 检查依赖是否安装
echo 检查Python依赖...
python -c "import requests, bs4" >nul 2>&1
if errorlevel 1 (
    echo 安装依赖包...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo 依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo 运行碳价格爬虫...
echo ========================================
python improved_carbon_crawler.py

echo.
echo 爬虫执行完成
echo 查看日志文件: carbon_crawler.log
echo 查看数据文件: carbon_prices_*.json
echo 查看调试文件: debug\ 目录
echo ========================================
pause