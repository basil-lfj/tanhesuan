@echo off
echo ============================================================
echo        碳市场价格爬虫监控系统启动器
echo ============================================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.6+
    pause
    exit /b 1
)

REM 检查依赖是否安装
echo [1/3] 检查Python依赖...
python -c "import flask, flask_cors, requests, bs4" >nul 2>&1
if errorlevel 1 (
    echo 正在安装依赖包...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo 依赖安装失败
        pause
        exit /b 1
    )
)

echo [2/3] 启动监控服务器...
echo.
echo 服务地址: http://localhost:5000
echo 监控面板: http://localhost:5000/dashboard/index.html
echo.
echo 可用功能:
echo   - 实时查看碳价格数据
echo   - 查看爬虫运行日志
echo   - 手动触发爬虫运行
echo   - 数据变化检测
echo   - 历史数据对比
echo.
echo 按 Ctrl+C 停止服务器
echo ============================================================
echo.

REM 启动Flask服务器
python server.py

pause