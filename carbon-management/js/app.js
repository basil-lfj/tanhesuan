/**
 * 碳资产管理系统 - 主应用程序入口
 * 
 * 功能说明：
 * 1. 初始化所有子模块
 * 2. 管理选项卡切换
 * 3. 更新核心指标显示
 * 4. 执行预警检查
 */

const App = {
    /**
     * 应用初始化
     */
    init() {
        console.log('碳资产管理系统初始化中...');
        
        // 初始化数据存储
        DataStore.init();
        
        // 初始化各功能模块
        QuotaManager.init();
        ReductionManager.init();
        ReportExport.init();
        
        // 绑定全局事件
        this.bindEvents();
        
        // 更新指标显示（带动画）
        setTimeout(() => {
            this.updateMetrics(true);
        }, 500);
        
        // 检查预警
        setTimeout(() => {
            this.checkWarning();
        }, 800);
        
        // 设置当前排放量输入（首次访问时提示）
        this.setupEmissionInput();
        
        console.log('碳资产管理系统初始化完成');
    },

    /**
     * 绑定全局事件
     */
    bindEvents() {
        // 选项卡切换（已在HTML中处理）

        // 监听数据变化，自动更新指标
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('carbon_')) {
                this.updateMetrics();
                this.checkWarning();
            }
        });
    },

    /**
     * 更新核心指标显示
     * 
     * 计算逻辑说明：
     * - 配额余额：当前年度所有配额的剩余总量
     * - 配额缺口/盈余 = 当前排放量 - 可用配额（配额余额 + 累计减排量）
     * - 累计减排量：所有减排记录的总量
     * - 当前排放量：需要用户输入或从外部系统获取
     * 
     * @param {boolean} animate - 是否启用动画
     */
    updateMetrics(animate = false) {
        // 获取配额统计
        const quotaStats = DataStore.getQuotaStats();
        
        // 获取减排统计
        const reductionStats = DataStore.getReductionStats();
        
        // 获取排放数据
        const emissions = DataStore.getEmissions();
        
        // 计算缺口/盈余
        const gapInfo = DataStore.calculateGap();

        // 更新配额余额显示
        const quotaBalanceEl = document.getElementById('quotaBalance');
        if (quotaBalanceEl) {
            if (animate && window.animateNumber) {
                this.animateNumber(quotaBalanceEl, quotaStats.totalRemaining);
            } else {
                quotaBalanceEl.textContent = this.formatNumber(quotaStats.totalRemaining);
            }
        }

        // 更新配额缺口/盈余显示
        const quotaGapEl = document.getElementById('quotaGap');
        const gapStatusEl = document.getElementById('gapStatus');
        if (quotaGapEl) {
            const gapValue = gapInfo.gap;
            const displayValue = (gapValue >= 0 ? '' : '+') + this.formatNumber(Math.abs(gapValue));
            
            if (animate && window.animateNumber) {
                quotaGapEl.textContent = displayValue;
            } else {
                quotaGapEl.textContent = displayValue;
            }
            
            // 更新样式
            if (gapValue > 0) {
                quotaGapEl.classList.add('text-red-500');
                quotaGapEl.classList.remove('text-primary');
            } else {
                quotaGapEl.classList.remove('text-red-500');
                quotaGapEl.classList.add('text-primary');
            }
        }
        
        // 更新缺口状态标签
        if (gapStatusEl) {
            if (gapInfo.isDeficit) {
                gapStatusEl.textContent = '缺口状态';
            } else {
                gapStatusEl.textContent = '盈余状态';
            }
        }

        // 更新累计减排量显示
        const totalReductionEl = document.getElementById('totalReduction');
        if (totalReductionEl) {
            if (animate && window.animateNumber) {
                this.animateNumber(totalReductionEl, reductionStats.totalReduction);
            } else {
                totalReductionEl.textContent = this.formatNumber(reductionStats.totalReduction);
            }
        }

        // 更新当前排放量显示
        const currentEmissionEl = document.getElementById('currentEmission');
        if (currentEmissionEl) {
            if (animate && window.animateNumber) {
                this.animateNumber(currentEmissionEl, emissions.totalEmission || 0);
            } else {
                currentEmissionEl.textContent = this.formatNumber(emissions.totalEmission || 0);
            }
        }
    },

    /**
     * 数字动画效果
     */
    animateNumber(element, targetValue, duration = 1000) {
        const startValue = 0;
        const startTime = performance.now();
        const startText = element.textContent;
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用 easeOutExpo 缓动函数
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    },

    /**
     * 检查预警状态
     * 
     * 预警逻辑：
     * - 当配额缺口 > 0 时触发预警
     * - 缺口占比 > 20% 为高风险预警
     * - 缺口占比 <= 20% 为中风险预警
     */
    checkWarning() {
        const warningInfo = DataStore.checkWarning();
        const alertSection = document.getElementById('alertSection');
        const warningMessage = document.getElementById('warningMessage');

        if (!alertSection || !warningMessage) return;

        if (warningInfo.needWarning) {
            // 显示预警
            alertSection.style.display = 'block';
            warningMessage.textContent = warningInfo.message;
            
            // 更新预警图标和样式
            alertSection.querySelector('.alert-section-inner')?.remove();
            alertSection.innerHTML = `
                <div class="bg-orange-50/80 backdrop-blur-sm border-l-4 border-orange-400 rounded-r-xl p-5 flex items-center gap-4 animate-pulse-soft alert-section-inner">
                    <span class="material-symbols-outlined text-orange-500 text-3xl">warning</span>
                    <div>
                        <h4 class="font-bold text-orange-700">配额缺口预警</h4>
                        <p class="text-sm text-orange-600">${warningInfo.message}</p>
                    </div>
                </div>
            `;
        } else {
            // 显示正常状态
            alertSection.style.display = 'block';
            alertSection.innerHTML = `
                <div class="bg-green-50/80 backdrop-blur-sm border-l-4 border-primary rounded-r-xl p-5 flex items-center gap-4 animate-fade-in-up alert-section-inner">
                    <span class="material-symbols-outlined text-primary text-3xl">check_circle</span>
                    <div>
                        <h4 class="font-bold text-green-700">履约状态良好</h4>
                        <p class="text-sm text-green-600">${warningInfo.message}</p>
                    </div>
                </div>
            `;
        }
    },

    /**
     * 设置排放量输入功能
     */
    setupEmissionInput() {
        const emissions = DataStore.getEmissions();
        
        // 如果没有排放数据，创建输入面板
        if (!emissions.totalEmission || emissions.totalEmission === 0) {
            this.showEmissionInputPrompt();
        }
    },

    /**
     * 显示排放量输入提示
     */
    showEmissionInputPrompt() {
        // 在当前排放量卡片添加点击事件
        const metricsGrid = document.getElementById('metricsGrid');
        if (metricsGrid) {
            const lastCard = metricsGrid.querySelector('div:last-child');
            if (lastCard) {
                lastCard.style.cursor = 'pointer';
                lastCard.addEventListener('click', () => this.showEmissionInputModal());
                
                // 添加提示文字
                const prompt = document.createElement('p');
                prompt.className = 'text-xs text-primary mt-2 opacity-0 hover:opacity-100 transition-opacity';
                prompt.textContent = '点击设置';
                lastCard.querySelector('div:last-child').appendChild(prompt);
            }
        }
    },

    /**
     * 显示排放量输入模态框
     */
    showEmissionInputModal() {
        const currentEmission = DataStore.getEmissions().totalEmission || 0;
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <h3 class="text-xl font-bold mb-6 flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary">factory</span>
                    设置当前排放量
                </h3>
                <p class="text-sm text-slate-custom/60 mb-4">请输入本年度碳排放量（吨CO₂）</p>
                <input type="number" id="emissionInput" value="${currentEmission}" 
                    class="w-full bg-sage/30 border border-slate-custom/10 rounded-xl px-4 py-3 text-lg font-bold focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all duration-300" 
                    placeholder="请输入排放量">
                <div class="flex gap-4 mt-6">
                    <button id="saveEmission" class="flex-1 btn-animate bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300">
                        保存
                    </button>
                    <button id="cancelEmission" class="flex-1 py-3 rounded-xl font-medium text-slate-custom/60 hover:bg-slate-custom/5 transition-all duration-300">
                        取消
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelector('#saveEmission').addEventListener('click', () => {
            const input = modal.querySelector('#emissionInput');
            const value = parseFloat(input.value);
            
            if (!isNaN(value) && value >= 0) {
                DataStore.setCurrentEmission(value);
                this.updateMetrics();
                this.checkWarning();
                this.showToast('排放量设置成功！', 'success');
                modal.remove();
            } else {
                this.showToast('请输入有效的数值', 'error');
            }
        });
        
        modal.querySelector('#cancelEmission').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    /**
     * 格式化数字显示
     */
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '--';
        return num.toLocaleString('zh-CN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
    },

    /**
     * 显示提示消息
     */
    showToast(message, type = 'success') {
        // 移除已存在的toast
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-message fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-sm font-medium z-50 animate-fade-in-up ${
            type === 'success' ? 'bg-primary text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-orange-500 text-white'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 3秒后自动消失
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * 重置所有数据（用于测试）
     */
    resetData() {
        if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
            DataStore.clearAll();
            QuotaManager.loadQuotaData();
            ReductionManager.loadReductionData();
            this.updateMetrics();
            this.checkWarning();
            this.showToast('数据已重置', 'success');
        }
    },

    /**
     * 导出所有数据
     */
    exportData() {
        const data = DataStore.exportAll();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `碳资产数据_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('数据导出成功！', 'success');
    },

    /**
     * 导入数据
     */
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                DataStore.importAll(data);
                QuotaManager.loadQuotaData();
                ReductionManager.loadReductionData();
                this.updateMetrics();
                this.checkWarning();
                this.showToast('数据导入成功！', 'success');
            } catch (error) {
                console.error('数据导入失败:', error);
                this.showToast('数据导入失败，请检查文件格式', 'error');
            }
        };
        reader.readAsText(file);
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 全局错误处理
window.onerror = function(message, source, lineno, colno, error) {
    console.error('全局错误:', message, source, lineno, colno, error);
    return false;
};