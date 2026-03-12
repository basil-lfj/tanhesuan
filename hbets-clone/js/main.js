/**
 * 主程序模块 - 重定向文件
 * 实际文件位置: carbon-calculator/js/main.js
 */

// 重定向到正确的位置
if (window.location.pathname === '/js/main.js' || window.location.pathname.endsWith('/js/main.js')) {
    const script = document.createElement('script');
    script.src = '/carbon-calculator/js/main.js';
    document.head.appendChild(script);
}