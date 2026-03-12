// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化轮播图
    initBanner();

    // 初始化标签页
    initTabs();

    // 初始化导航栏效果
    initNavEffects();

    // 初始化返回顶部按钮
    initBackToTop();

    // 初始化滚动动画
    initScrollAnimations();

    // 初始化业务模块倾斜效果
    initBusinessCardTilt();

    // 初始化碳市场
    initCarbonMarket();

    // 初始化在线客服按钮
    const serviceBtn = document.getElementById('btn-service');
    if (serviceBtn) {
        serviceBtn.addEventListener('click', function() {
            alert('在线客服功能正在建设中，敬请期待！');
        });
    }

    // 平滑滚动（锚点链接）
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// 页面加载动画
window.addEventListener('load', function() {
    document.body.style.opacity = '1';
});

// 控制台欢迎信息
console.log('%c欢迎使用碳足迹管理系统！', 'color: #0066cc; font-size: 16px; font-weight: bold;');

// 轮播图功能 - 全屏大屏风格
function initBanner() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    const progress = document.getElementById('bannerProgress');
    let currentSlide = 0;
    let autoPlayInterval;
    let isTransitioning = false;
    const slideDuration = 10000; // 10秒切换

    // 切换到指定幻灯片
    function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;

        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');

        // 延迟解锁，防止快速切换
        setTimeout(() => {
            isTransitioning = false;
        }, 1000);
    }

    // 下一张幻灯片
    function nextSlide() {
        if (isTransitioning) return;
        goToSlide(currentSlide + 1);
    }

    // 上一张幻灯片
    function prevSlide() {
        if (isTransitioning) return;
        goToSlide(currentSlide - 1);
    }

    // 进度条效果
    let progressWidth = 0;
    let progressInterval;
    function resetProgress() {
        progressWidth = 0;
        if (progress) {
            progress.style.width = '0%';
        }
    }

    function updateProgress() {
        if (!progress || isTransitioning) return;

        const increment = 100 / (slideDuration / 50);
        progressWidth += increment;

        if (progressWidth >= 100) {
            progressWidth = 100;
            if (progress) {
                progress.style.width = '100%';
            }
            // 延迟切换，确保动画完成
            setTimeout(() => {
                nextSlide();
                resetProgress();
            }, 500);
        } else {
            if (progress) {
                progress.style.width = progressWidth + '%';
            }
        }
    }

    // 自动播放
    function startAutoPlay() {
        stopAutoPlay();
        resetProgress();
        autoPlayInterval = setInterval(nextSlide, slideDuration);
        // 进度条更新（如果存在）
        if (progress) {
            progressInterval = setInterval(updateProgress, 50);
        }
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    // 底部导航点事件
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            stopAutoPlay();
            startAutoPlay();
        });
    });

    // 鼠标悬停暂停自动播放
    const bannerContainer = document.querySelector('.banner-container');
    bannerContainer.addEventListener('mouseenter', stopAutoPlay);
    bannerContainer.addEventListener('mouseleave', startAutoPlay);

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        }
    });

    // 触摸滑动支持
    let touchStartX = 0;
    let touchEndX = 0;

    bannerContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }, { passive: true });

    bannerContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoPlay();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            nextSlide();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            prevSlide();
        }
    }

    // 开始自动播放
    startAutoPlay();
}

// 标签页功能
function initTabs() {
    const tabs = document.querySelectorAll('.info-tab');
    const contents = document.querySelectorAll('.info-list');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');

            // 移除所有激活状态
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // 激活当前标签和内容
            tab.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');

                // 重新触发动画
                const items = targetContent.querySelectorAll('.info-item');
                items.forEach((item, index) => {
                    item.style.animation = 'none';
                    item.offsetHeight; // 触发重排
                    item.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
                });
            }
        });
    });
}

// 导航栏效果 - 新版Tailwind风格
function initNavEffects() {
    const navLinks = document.querySelectorAll('.nav-link-item[data-section]');
    
    // 点击导航项
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有active状态
            navLinks.forEach(nav => {
                nav.classList.remove('text-sage-900', 'border-b-2', 'border-primary', 'pb-1', 'text-sm', 'font-semibold');
                nav.classList.add('text-sage-500', 'text-sm', 'font-medium');
            });
            
            // 添加active状态
            this.classList.remove('text-sage-500', 'font-medium');
            this.classList.add('text-sage-900', 'border-b-2', 'border-primary', 'pb-1', 'font-semibold');
            
            // 平滑滚动到对应区块
            const sectionClass = this.getAttribute('data-section');
            const targetSection = document.querySelector('.' + sectionClass);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 返回顶部按钮
function initBackToTop() {
    const backToTopBtn = document.getElementById('btn-back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 滚动动画
function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.market-card, .info-row, .business-item, .about-item, .party-image, .party-text, .chart-card');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 性能优化：使用节流处理滚动事件
window.addEventListener('scroll', throttle(function() {
    // 这里可以添加其他滚动相关的逻辑
}, 100));

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时可以暂停某些动画或操作
        console.log('页面已隐藏');
    } else {
        // 页面重新显示时恢复操作
        console.log('页面已显示');
    }
});

// 错误处理
window.onerror = function(message, source, lineno, colno, error) {
    console.error('发生错误:', message);
    // 这里可以添加错误上报逻辑
};

// 业务模块倾斜效果初始化
function initBusinessCardTilt() {
    const businessItems = document.querySelectorAll('.business-item');

    businessItems.forEach(item => {
        // 添加鼠标进入事件
        item.addEventListener('mouseenter', function(e) {
            this.classList.add('tilt');
        });

        // 添加鼠标移动事件
        item.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 计算倾斜角度
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10; // X轴旋转
            const rotateY = (centerX - x) / 10; // Y轴旋转

            // 限制旋转角度范围
            const maxRotate = 8;
            const clampedRotateX = Math.max(-maxRotate, Math.min(maxRotate, rotateX));
            const clampedRotateY = Math.max(-maxRotate, Math.min(maxRotate, rotateY));

            // 应用3D变换
            this.style.transform = `
                perspective(1000px)
                scale(1.08)
                translateY(-5px)
                rotateX(${-clampedRotateX}deg)
                rotateY(${clampedRotateY}deg)
            `;
        });

        // 添加鼠标离开事件
        item.addEventListener('mouseleave', function(e) {
            this.classList.remove('tilt');
            this.style.transform = '';
        });

        // 添加触摸移动事件（移动端）
        item.addEventListener('touchmove', function(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 12;
            const rotateY = (centerX - x) / 12;

            const maxRotate = 6;
            const clampedRotateX = Math.max(-maxRotate, Math.min(maxRotate, rotateX));
            const clampedRotateY = Math.max(-maxRotate, Math.min(maxRotate, rotateY));

            this.style.transform = `
                perspective(1000px)
                scale(1.06)
                translateY(-3px)
                rotateX(${-clampedRotateX}deg)
                rotateY(${clampedRotateY}deg)
            `;
        }, { passive: false });

        // 触摸结束重置
        item.addEventListener('touchend', function(e) {
            this.style.transform = '';
        });
    });
}

// ================== 碳市场数据模块 ==================

// 全局变量
let carbonMarketData = null;
let carbonChart = null;
let currentTimeRange = '1m';
let currentChartType = 'compare';
let cachedCeaData = null;
let cachedCcerData = null;

// API配置
const API = {
    latest: '/api/data/latest',
    ceaTrend: '/api/trend/cea',
    ccerTrend: '/api/trend/ccer',
    compareTrend: '/api/trend/compare'
};

// 初始化碳市场
async function initCarbonMarket() {
    console.log('初始化碳市场...');
    
    // 初始化时间范围按钮
    initTimeRangeButtons();
    
    // 初始化图表类型按钮
    initChartTypeButtons();

    // 初始化ECharts图表
    initCarbonChart();

    // 加载碳市场数据
    await loadCarbonData();

    // 响应窗口大小变化
    window.addEventListener('resize', () => {
        if (carbonChart) {
            carbonChart.resize();
        }
    });
    
    // 设置自动刷新机制 - 每30秒刷新数据
    setInterval(async () => {
        console.log('自动刷新碳市场数据...');
        await loadCarbonData();
    }, 30000);
    
    // 每5分钟刷新趋势数据
    setInterval(async () => {
        console.log('刷新趋势数据...');
        await loadTrendData();
    }, 300000);
    
    console.log('碳市场初始化完成 - 已启用自动刷新');
}

// 初始化时间范围按钮
function initTimeRangeButtons() {
    // Set default to 'all' and don't initialize buttons for monthly ranges
    currentTimeRange = 'all';
    updateChart();
}

// 初始化图表类型按钮
function initChartTypeButtons() {
    const chartTypeBtns = document.querySelectorAll('.chart-type-btn');

    chartTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chartTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChartType = btn.getAttribute('data-type');
            updateChart();
        });
    });
}

// 从JSON文件或API加载碳市场数据
async function loadCarbonData() {
    console.log('开始加载碳市场数据...');
    try {
        // 首先尝试从API获取数据
        try {
            const response = await fetch(API.latest);
            if (response.ok) {
                const result = await response.json();
                // 处理两种数据格式：{success: true, data: {...}} 或直接返回数据对象
                if (result.success && result.data) {
                    carbonMarketData = result.data;
                } else if (result.cea || result.ccer) {
                    carbonMarketData = result;
                }
                
                if (carbonMarketData) {
                    console.log('从API加载碳市场数据成功:', carbonMarketData);
                    updateMarketDisplay(carbonMarketData);
                    
                    // 获取趋势数据
                    await loadTrendData();
                    
                    // 确保图表更新
                    setTimeout(() => updateChart(), 100);
                    return;
                }
            }
        } catch (apiError) {
            console.log('API不可用，尝试加载本地数据', apiError);
        }

        // 尝试从本地JSON文件加载
        const jsonFiles = [
            'data/carbon-prices.json',
            '../carbon_carwler/carbon_prices_complete_20260309_180726.json',
            '../carbon_carwler/carbon_prices_complete_20260309_180725.json',
            'carbon_prices_complete_20260309_180726.json'
        ];

        for (const jsonFile of jsonFiles) {
            try {
                const response = await fetch(jsonFile);
                if (response.ok) {
                    carbonMarketData = await response.json();
                    console.log('碳市场数据加载成功:', carbonMarketData);
                    updateMarketDisplay(carbonMarketData);
                    
                    // 确保图表更新
                    setTimeout(() => updateChart(), 100);
                    return;
                }
            } catch (e) {
                console.log(`无法加载 ${jsonFile}，尝试下一个`);
            }
        }

        // 如果所有数据源都无法加载，使用模拟数据
        console.warn('无法加载数据文件，使用模拟数据');
        loadFallbackData();

    } catch (error) {
        console.error('加载碳市场数据失败:', error);
        loadFallbackData();
    }
}

// 加载趋势数据
async function loadTrendData() {
    try {
        const [ceaRes, ccerRes] = await Promise.all([
            fetch(API.ceaTrend),
            fetch(API.ccerTrend)
        ]);
        
        const ceaResult = await ceaRes.json();
        const ccerResult = await ccerRes.json();
        
        if (ceaResult.success) {
            cachedCeaData = ceaResult.data;
        }
        
        if (ccerResult.success) {
            cachedCcerData = ccerResult.data;
        }
        
        // 更新图表
        updateChart();
        
        // 更新时间
        const updateTimeEl = document.getElementById('chartUpdateTime');
        if (updateTimeEl) {
            updateTimeEl.textContent = `数据更新: ${new Date().toLocaleString()}`;
        }
    } catch (error) {
        console.log('趋势数据API不可用，使用本地数据');
    }
}

// 使用模拟数据
function loadFallbackData() {
    console.log('使用模拟数据...');
    carbonMarketData = {
        crawl_time: new Date().toLocaleString('zh-CN'),
        data_date: "2026年3月9日",
        cea: {
            date: "2026年3月9日",
            close_price: 83.20,
            high_price: 83.50,
            low_price: 80.50,
            previous_close: 81.85,
            change_percent: 1.65,
            change_amount: 1.35,
            open_price: 81.90,
            market: "全国碳市场",
            product: "CEA (碳排放配额)",
            unit: "元/吨",
            source: "上海环境能源交易所"
        },
        ccer: {
            date: "2026年3月9日",
            volume: 201.0,
            amount: 17687.0,
            avg_price: 88.0,
            change_percent: 0.57,
            market: "全国温室气体自愿减排交易市场",
            product: "CCER (核证自愿减排量)",
            unit: "元/吨",
            source: "北京绿色交易所"
        },
        history: generateHistoricalData()
    };
    console.log('模拟数据生成完成:', carbonMarketData);
    updateMarketDisplay(carbonMarketData);
    // 确保图表更新
    setTimeout(() => {
        if (carbonChart) {
            updateChart();
        }
    }, 100);
}

// 生成历史数据
function generateHistoricalData() {
    const ceaHistory = [];
    const ccerHistory = [];
    const now = new Date();
    
    // 生成过去一年的数据
    for (let i = 365; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // CEA价格波动
        const ceaBase = 75 + Math.sin(i / 30) * 10 + Math.random() * 5;
        ceaHistory.push({
            date: dateStr,
            price: Math.round(ceaBase * 100) / 100,
            volume: Math.round(100000 + Math.random() * 50000)
        });
        
        // CCER价格波动
        const ccerBase = 80 + Math.sin(i / 25) * 8 + Math.random() * 4;
        ccerHistory.push({
            date: dateStr,
            price: Math.round(ccerBase * 100) / 100,
            volume: Math.round(50000 + Math.random() * 30000)
        });
    }
    
    return { cea: ceaHistory, ccer: ccerHistory };
}

// 更新页面显示
function updateMarketDisplay(data) {
    // 更新CEA数据
    const cea = data.cea;
    if (cea) {
        renderCeaData(cea);
        // 更新当前价格显示
        updateCurrentPriceDisplay(cea);
    }
    
    // 更新CCER数据
    const ccer = data.ccer;
    if (ccer) {
        renderCcerData(ccer);
    }
    
    // 更新统计摘要
    if (data.history) {
        updateStatsSummary(data.history);
    }
    
    // 更新时间显示
    updateChartUpdateTime(data);
}

// 更新当前价格显示
function updateCurrentPriceDisplay(cea) {
    const priceDisplay = document.getElementById('currentPriceDisplay');
    if (!priceDisplay) return;
    
    const closePrice = cea.close_price || cea.closing_price || 0;
    const priceNum = priceDisplay.querySelector('.price-num');
    
    if (priceNum) {
        // 添加数字动画效果
        priceNum.style.transition = 'all 0.5s ease';
        priceNum.textContent = formatNumber(closePrice);
    }
}

// 更新图表更新时间
function updateChartUpdateTime(data) {
    const updateTimeEl = document.getElementById('chartUpdateTime');
    if (!updateTimeEl) return;
    
    const timeSpan = updateTimeEl.querySelector('span');
    if (timeSpan) {
        const now = new Date();
        const timeStr = now.toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        timeSpan.textContent = `数据更新: ${timeStr}`;
    }
}

// 渲染CEA数据（简化版本 - 只更新统计摘要）
function renderCeaData(cea) {
    // 这个函数现在仅用于数据处理，实际显示在统计摘要中
    console.log('CEA数据已加载:', cea);
}

// 渲染CCER数据（简化版本 - 只更新统计摘要）
function renderCcerData(ccer) {
    // 这个函数现在仅用于数据处理，实际显示在统计摘要中
    console.log('CCER数据已加载:', ccer);
}

// 格式化数字
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '--';
    return typeof num === 'number' ? num.toFixed(decimals) : num;
}

// 初始化ECharts图表
function initCarbonChart() {
    const chartDom = document.getElementById('carbonChart');
    if (!chartDom) return;

    carbonChart = echarts.init(chartDom);
    updateChart();
}

// 更新图表
function updateChart() {
    if (!carbonChart) return;
    
    // 获取历史数据
    let history = carbonMarketData?.history;
    if (!history) {
        history = generateHistoricalData();
    }
    
    // 根据图表类型渲染
    if (currentChartType === 'compare') {
        renderCompareChart(history);
    } else if (currentChartType === 'cea') {
        renderSingleChart(history.cea || [], 'cea');
    } else if (currentChartType === 'ccer') {
        renderSingleChart(history.ccer || [], 'ccer');
    }
}

// 根据时间范围过滤数据
function filterByTimeRange(data, range) {
    // Only show all data, no time range filtering
    return data;
}

// 渲染对比图表
function renderCompareChart(history) {
    const filteredCea = filterByTimeRange(history.cea || [], currentTimeRange);
    const filteredCcer = filterByTimeRange(history.ccer || [], currentTimeRange);

    // 创建日期映射
    const ceaMap = {};
    filteredCea.forEach(d => { ceaMap[d.date] = d; });
    
    const ccerMap = {};
    filteredCcer.forEach(d => { ccerMap[d.date] = d; });

    // 获取所有日期
    const allDates = [...new Set([...Object.keys(ceaMap), ...Object.keys(ccerMap)])].sort();

    const dates = [];
    const ceaPrices = [];
    const ccerPrices = [];

    allDates.forEach(date => {
        dates.push(date);
        const ceaPrice = ceaMap[date]?.price;
        const ccerPrice = ccerMap[date]?.price;
        
        ceaPrices.push(ceaPrice || null);
        ccerPrices.push(ccerPrice || null);
    });

    // 严格复刻 carbon_carwler 的图表配置
    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: '#10b981',
            borderWidth: 2,
            padding: [12, 16],
            textStyle: {
                color: '#1e293b',
                fontSize: 13
            },
            formatter: function(params) {
                let html = `<div style="font-weight: 600; margin-bottom: 10px; font-size: 14px; color: #059669;">${params[0].axisValue}</div>`;
                params.forEach(param => {
                    if (param.value !== null && param.value !== undefined) {
                        const color = param.seriesName.includes('CEA') ? '#10b981' : '#3b82f6';
                        html += `<div style="display: flex; align-items: center; gap: 10px; margin: 6px 0; font-size: 13px;">
                            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${color};"></span>
                            <span style="color: #475569;">${param.seriesName}:</span>
                            <span style="font-weight: 600; color: #1e293b;">${param.value.toFixed(2)}</span>
                            <span style="color: #94a3b8;">元/吨</span>
                        </div>`;
                    }
                });
                return html;
            }
        },
        legend: {
            data: ['CEA收盘价', 'CCER平均价'],
            top: 15,
            right: 20,
            textStyle: {
                color: '#475569',
                fontSize: 13
            },
            itemWidth: 25,
            itemHeight: 14,
            itemGap: 20
        },
        grid: {
            left: 50,
            right: 50,
            bottom: 60,
            top: 70,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            boundaryGap: false,
            axisLine: {
                lineStyle: { color: '#e2e8f0', width: 2 }
            },
            axisTick: { show: false },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                rotate: 45,
                margin: 15
            }
        },
        yAxis: {
            type: 'value',
            name: '价格 (元/吨)',
            min: 30,
            max: 110,
            nameTextStyle: {
                color: '#64748b',
                fontSize: 12,
                padding: [0, 0, 10, 0]
            },
            axisLine: {
                show: true,
                lineStyle: { color: '#e2e8f0', width: 2 }
            },
            axisTick: { show: false },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                formatter: '{value}'
            },
            splitLine: {
                lineStyle: {
                    color: '#f1f5f9',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: 'CEA收盘价',
                type: 'line',
                data: ceaPrices,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                showSymbol: false,
                lineStyle: {
                    width: 3,
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                            { offset: 0, color: '#059669' },
                            { offset: 1, color: '#10b981' }
                        ]
                    }
                },
                itemStyle: {
                    color: '#10b981',
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
                            { offset: 0.5, color: 'rgba(16, 185, 129, 0.1)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
                        ]
                    }
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: 'rgba(16, 185, 129, 0.5)'
                    }
                }
            },
            {
                name: 'CCER平均价',
                type: 'line',
                data: ccerPrices,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                showSymbol: false,
                lineStyle: {
                    width: 3,
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                            { offset: 0, color: '#1d4ed8' },
                            { offset: 1, color: '#3b82f6' }
                        ]
                    }
                },
                itemStyle: {
                    color: '#3b82f6',
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
                            { offset: 0.5, color: 'rgba(59, 130, 246, 0.1)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
                        ]
                    }
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: 'rgba(59, 130, 246, 0.5)'
                    }
                }
            }
        ]
    };

    carbonChart.setOption(option, true);
    
    // 更新统计摘要
    updateStatsSummary(history);
}

// 渲染单一市场图表 - 严格复刻 carbon_carwler 效果
function renderSingleChart(data, market) {
    const filtered = filterByTimeRange(data, currentTimeRange);
    
    const dates = filtered.map(d => d.date);
    const prices = filtered.map(d => d.price);
    const volumes = filtered.map(d => d.volume);

    const isCea = market === 'cea';
    const lineColor = isCea ? '#10b981' : '#3b82f6';
    const name = isCea ? 'CEA收盘价' : 'CCER平均价';
    
    // 严格复刻 carbon_carwler 的单一市场图表配置
    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: lineColor,
            borderWidth: 2,
            padding: [12, 16],
            textStyle: {
                color: '#1e293b',
                fontSize: 13
            }
        },
        legend: {
            data: [name, '成交量'],
            top: 15,
            right: 20,
            textStyle: {
                color: '#475569',
                fontSize: 13
            },
            itemWidth: 25,
            itemHeight: 14,
            itemGap: 20
        },
        grid: {
            left: 50,
            right: 50,
            bottom: 60,
            top: 70,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            boundaryGap: false,
            axisLine: {
                lineStyle: { color: '#e2e8f0', width: 2 }
            },
            axisTick: { show: false },
            axisLabel: {
                color: '#64748b',
                fontSize: 11,
                rotate: 45,
                margin: 15
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '价格 (元/吨)',
                min: 30,
                max: 110,
                nameTextStyle: {
                    color: '#64748b',
                    fontSize: 12,
                    padding: [0, 0, 10, 0]
                },
                axisLine: {
                    show: true,
                    lineStyle: { color: '#e2e8f0', width: 2 }
                },
                axisTick: { show: false },
                axisLabel: {
                    color: '#64748b',
                    fontSize: 11
                },
                splitLine: {
                    lineStyle: {
                        color: '#f1f5f9',
                        type: 'dashed'
                    }
                }
            },
            {
                type: 'value',
                name: '成交量',
                nameTextStyle: {
                    color: '#64748b',
                    fontSize: 12,
                    padding: [0, 0, 10, 0]
                },
                axisLine: {
                    show: true,
                    lineStyle: { color: '#e2e8f0', width: 2 }
                },
                axisTick: { show: false },
                axisLabel: {
                    color: '#64748b',
                    fontSize: 11
                },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: name,
                type: 'line',
                data: prices,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                showSymbol: false,
                lineStyle: {
                    width: 3,
                    color: lineColor
                },
                itemStyle: {
                    color: lineColor,
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: isCea ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)' },
                            { offset: 0.5, color: isCea ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)' },
                            { offset: 1, color: isCea ? 'rgba(16, 185, 129, 0.02)' : 'rgba(59, 130, 246, 0.02)' }
                        ]
                    }
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: isCea ? 'rgba(16, 185, 129, 0.5)' : 'rgba(59, 130, 246, 0.5)'
                    }
                }
            },
            {
                name: '成交量',
                type: 'bar',
                yAxisIndex: 1,
                data: volumes,
                itemStyle: {
                    color: 'rgba(148, 163, 184, 0.4)',
                    borderRadius: [4, 4, 0, 0]
                },
                barWidth: '30%'
            }
        ]
    };

    carbonChart.setOption(option, true);
    
    // 更新统计摘要
    updateSingleStats(filtered, isCea ? 'CEA' : 'CCER');
}

// 更新统计摘要 - 小字显示在图表上方（严格复刻carbon_carwler效果）
function updateStatsSummary(history) {
    const container = document.getElementById('statsSummary');
    if (!container || !history) return;
    
    // 根据当前时间范围过滤数据
    const filteredCea = filterByTimeRange(history.cea || [], currentTimeRange);
    const filteredCcer = filterByTimeRange(history.ccer || [], currentTimeRange);
    
    const ceaPrices = filteredCea.map(d => d.price).filter(p => p);
    const ccerPrices = filteredCcer.map(d => d.price).filter(p => p);
    
    const ceaMax = ceaPrices.length ? Math.max(...ceaPrices).toFixed(2) : '--';
    const ceaMin = ceaPrices.length ? Math.min(...ceaPrices).toFixed(2) : '--';
    const ceaAvg = ceaPrices.length ? (ceaPrices.reduce((a, b) => a + b, 0) / ceaPrices.length).toFixed(2) : '--';
    
    const ccerMax = ccerPrices.length ? Math.max(...ccerPrices).toFixed(2) : '--';
    const ccerMin = ccerPrices.length ? Math.min(...ccerPrices).toFixed(2) : '--';
    const ccerAvg = ccerPrices.length ? (ccerPrices.reduce((a, b) => a + b, 0) / ccerPrices.length).toFixed(2) : '--';

    // 小字格式显示 - 带图标，严格复刻carbon_carwler
    container.innerHTML = `
        <div class="stat-item-top cea">
            <span class="stat-icon">📈</span>
            <span class="stat-label">CEA最高:</span>
            <span class="stat-value">${ceaMax}</span>
            <span class="stat-unit">元/吨</span>
        </div>
        <div class="stat-item-top cea">
            <span class="stat-icon">📉</span>
            <span class="stat-label">CEA最低:</span>
            <span class="stat-value">${ceaMin}</span>
            <span class="stat-unit">元/吨</span>
        </div>
        <div class="stat-item-top cea">
            <span class="stat-icon">📊</span>
            <span class="stat-label">CEA均价:</span>
            <span class="stat-value">${ceaAvg}</span>
            <span class="stat-unit">元/吨</span>
        </div>
        <div class="stat-divider-long"></div>
        <div class="stat-item-top ccer">
            <span class="stat-icon">📈</span>
            <span class="stat-label">CCER最高:</span>
            <span class="stat-value">${ccerMax}</span>
            <span class="stat-unit">元/吨</span>
        </div>
        <div class="stat-item-top ccer">
            <span class="stat-icon">📉</span>
            <span class="stat-label">CCER最低:</span>
            <span class="stat-value">${ccerMin}</span>
            <span class="stat-unit">元/吨</span>
        </div>
        <div class="stat-item-top ccer">
            <span class="stat-icon">📊</span>
            <span class="stat-label">CCER均价:</span>
            <span class="stat-value">${ccerAvg}</span>
            <span class="stat-unit">元/吨</span>
        </div>
    `;
}

// 更新单一市场统计摘要 - 小字显示（严格复刻carbon_carwler效果）
function updateSingleStats(data, market) {
    const container = document.getElementById('statsSummary');
    if (!container) return;
    
    const prices = data.map(d => d.price).filter(p => p);
    const volumes = data.map(d => d.volume).filter(v => v);
    
    const max = prices.length ? Math.max(...prices).toFixed(2) : '--';
    const min = prices.length ? Math.min(...prices).toFixed(2) : '--';
    const avg = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : '--';
    const totalVol = volumes.length ? volumes.reduce((a, b) => a + b, 0).toLocaleString() : '--';

    const itemClass = market === 'CEA' ? 'cea' : 'ccer';

    // 小字格式显示 - 带图标
    container.innerHTML = `
        <div class="stat-item-top ${itemClass}">
            <span class="stat-icon">📈</span>
            <span class="stat-label">${market}最高:</span>
            <span class="stat-value">${max}</span>
            <span class="stat-unit">元/吨</span>
        </div>
        <div class="stat-item-top ${itemClass}">
            <span class="stat-icon">📉</span>
            <span class="stat-label">${market}最低:</span>
            <span class="stat-value">${min}</span>
            <span class="stat-unit">元/吨</span>
        </div>
        <div class="stat-item-top ${itemClass}">
            <span class="stat-icon">📊</span>
            <span class="stat-label">${market}均价:</span>
            <span class="stat-value">${avg}</span>
            <span class="stat-unit">元/吨</span>
        </div>
        <div class="stat-divider-long"></div>
        <div class="stat-item-top">
            <span class="stat-icon">📦</span>
            <span class="stat-label">总成交量:</span>
            <span class="stat-value">${totalVol}</span>
            <span class="stat-unit">吨</span>
        </div>
    `;
}