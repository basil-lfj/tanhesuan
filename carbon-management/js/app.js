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
        
        // 更新指标显示
        this.updateMetrics();
        
        // 检查预警
        this.checkWarning();
        
        // 设置当前排放量输入（首次访问时提示）
        this.setupEmissionInput();
        
        console.log('碳资产管理系统初始化完成');
    },

    /**
     * 绑定全局事件
     */
    bindEvents() {
        // 选项卡切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // 监听数据变化，自动更新指标
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('carbon_')) {
                this.updateMetrics();
                this.checkWarning();
            }
        });
    },

    /**
     * 处理选项卡切换
     */
    handleTabSwitch(e) {
        const targetTab = e.target.dataset.tab;
        if (!targetTab) return;

        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`${targetTab}-tab`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    },

    /**
     * 更新核心指标显示
     * 
     * 计算逻辑说明：
     * - 配额余额：当前年度所有配额的剩余总量
     * - 配额缺口/盈余 = 当前排放量 - 可用配额（配额余额 + 累计减排量）
     * - 累计减排量：所有减排记录的总量
     * - 当前排放量：需要用户输入或从外部系统获取
     */
    updateMetrics() {
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
            quotaBalanceEl.textContent = this.formatNumber(quotaStats.totalRemaining);
        }

        // 更新配额缺口/盈余显示
        const quotaGapEl = document.getElementById('quotaGap');
        const gapStatusEl = document.getElementById('gapStatus');
        if (quotaGapEl) {
            const gapValue = gapInfo.gap;
            quotaGapEl.textContent = (gapValue >= 0 ? '' : '+') + this.formatNumber(Math.abs(gapValue));
            
            // 更新样式
            if (gapValue > 0) {
                quotaGapEl.style.color = '#c62828'; // 缺口显示红色
            } else {
                quotaGapEl.style.color = '#2e7d32'; // 盈余显示绿色
            }
        }
        
        // 更新缺口状态标签
        if (gapStatusEl) {
            if (gapInfo.isDeficit) {
                gapStatusEl.className = 'metric-status deficit';
                gapStatusEl.textContent = '缺口';
            } else {
                gapStatusEl.className = 'metric-status surplus';
                gapStatusEl.textContent = '盈余';
            }
        }

        // 更新累计减排量显示
        const totalReductionEl = document.getElementById('totalReduction');
        if (totalReductionEl) {
            totalReductionEl.textContent = this.formatNumber(reductionStats.totalReduction);
        }

        // 更新当前排放量显示
        const currentEmissionEl = document.getElementById('currentEmission');
        if (currentEmissionEl) {
            currentEmissionEl.textContent = this.formatNumber(emissions.totalEmission || 0);
        }
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
        const warningAlert = document.getElementById('warningAlert');
        const warningMessage = document.getElementById('warningMessage');

        if (!alertSection || !warningAlert || !warningMessage) return;

        if (warningInfo.needWarning) {
            // 显示预警
            alertSection.style.display = 'block';
            warningMessage.textContent = warningInfo.message;
            
            // 设置预警级别样式
            if (warningInfo.level === 'high') {
                warningAlert.className = 'alert warning';
                warningAlert.style.background = 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)';
                warningAlert.style.borderLeftColor = '#c62828';
            } else {
                warningAlert.className = 'alert warning';
                warningAlert.style.background = 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)';
                warningAlert.style.borderLeftColor = '#ff9800';
            }
        } else {
            // 显示正常状态
            alertSection.style.display = 'block';
            warningAlert.className = 'alert success';
            warningAlert.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
            warningAlert.style.borderLeftColor = '#4caf50';
            warningAlert.querySelector('.alert-icon').textContent = '✓';
            warningAlert.querySelector('h4').textContent = '履约状态良好';
            warningMessage.textContent = warningInfo.message;
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
        // 在指标卡片区域添加输入提示
        const emissionCard = document.querySelector('.metric-card:last-child');
        if (emissionCard) {
            const promptDiv = document.createElement('div');
            promptDiv.className = 'emission-prompt';
            promptDiv.innerHTML = `
                <button class="btn btn-small btn-primary" onclick="App.showEmissionInputModal()">
                    设置排放量
                </button>
            `;
            emissionCard.appendChild(promptDiv);
        }
    },

    /**
     * 显示排放量输入模态框
     */
    showEmissionInputModal() {
        const currentEmission = DataStore.getEmissions().totalEmission || 0;
        const input = prompt('请输入当前年度碳排放量（吨CO₂）：', currentEmission);
        
        if (input !== null) {
            const value = parseFloat(input);
            if (!isNaN(value) && value >= 0) {
                DataStore.setCurrentEmission(value);
                this.updateMetrics();
                this.checkWarning();
                this.showToast('排放量设置成功！', 'success');
                
                // 移除输入提示
                const promptDiv = document.querySelector('.emission-prompt');
                if (promptDiv) {
                    promptDiv.remove();
                }
            } else {
                this.showToast('请输入有效的数值', 'error');
            }
        }
    },

    /**
     * 格式化数字显示
     */
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '--';
        return num.toLocaleString('zh-CN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    },

    /**
     * 显示提示消息
     */
    showToast(message, type = 'success') {
        // 移除已存在的toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 3秒后自动消失
        setTimeout(() => {
            toast.remove();
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