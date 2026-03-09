@echo off
chcp 65001 >nul
echo ════════════════════════════════════════════════════════════════
echo                碳市场前端展示服务器启动脚本
echo                参考：https://www.hbets.cn/ 信息公开模块
echo ════════════════════════════════════════════════════════════════
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python 3.7+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [信息] Python环境检测通过
echo.

:: 检查依赖是否安装
echo [信息] 检查依赖包...
pip show requests >nul 2>&1
if errorlevel 1 (
    echo [警告] requests包未安装，正在安装...
    pip install requests beautifulsoup4 lxml -q
)

echo [信息] 依赖包检测完成
echo.

:: 启动服务器
echo [信息] 正在启动服务器...
echo.
python server.py

pause