/**
 * 碳核算计算器模块 - 重定向文件
 * 实际文件位置: carbon-calculator/js/calculator.js
 */

// 重定向到正确的位置
if (window.location.pathname === '/js/calculator.js' || window.location.pathname.endsWith('/js/calculator.js')) {
    // 动态加载正确的脚本
    const script = document.createElement('script');
    script.src = '/carbon-calculator/js/calculator.js';
    document.head.appendChild(script);
}