/**
 * 数据加载模块 - 重定向文件
 * 实际文件位置: carbon-calculator/js/data-loader.js
 */

// 重定向到正确的位置
if (window.location.pathname === '/js/data-loader.js' || window.location.pathname.endsWith('/js/data-loader.js')) {
    const script = document.createElement('script');
    script.src = '/carbon-calculator/js/data-loader.js';
    document.head.appendChild(script);
}