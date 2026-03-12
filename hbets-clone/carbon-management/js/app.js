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
        
        // 初始化排放记录管理
        this.initEmissionManager();
        
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
        
        // 扣减配额按钮
        const deductBtn = document.getElementById('deductQuotaBtn');
        if (deductBtn) {
            deductBtn.addEventListener('click', () => this.showDeductForm());
        }
        
        // 取消扣减按钮
        const cancelDeductBtn = document.getElementById('cancelDeductBtn');
        if (cancelDeductBtn) {
            cancelDeductBtn.addEventListener('click', () => this.hideDeductForm());
        }
        
        // 扣减表单提交
        const deductForm = document.getElementById('deductQuotaInputForm');
        if (deductForm) {
            deductForm.addEventListener('submit', (e) => this.handleDeductSubmit(e));
        }
    },
    
    /**
     * 显示扣减配额表单
     */
    showDeductForm() {
        const formPanel = document.getElementById('deductQuotaForm');
        if (formPanel) {
            formPanel.style.display = 'block';
            formPanel.classList.add('show');
        }
    },
    
    /**
     * 隐藏扣减配额表单
     */
    hideDeductForm() {
        const formPanel = document.getElementById('deductQuotaForm');
        const form = document.getElementById('deductQuotaInputForm');
        if (formPanel) {
            formPanel.style.display = 'none';
            formPanel.classList.remove('show');
        }
        if (form) {
            form.reset();
        }
    },
    
    /**
     * 处理扣减配额表单提交
     */
    handleDeductSubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('deductAmount').value);
        const reason = document.getElementById('deductReason').value;
        
        if (!amount || amount <= 0) {
            this.showToast('请输入有效的扣减数量', 'error');
            return;
        }
        
        if (!reason) {
            this.showToast('请选择扣减原因', 'error');
            return;
        }
        
        // 获取当前配额余额
        const stats = DataStore.getQuotaStats();
        if (amount > stats.totalRemaining) {
            this.showToast('扣减数量不能超过配额余额', 'error');
            return;
        }
        
        // 执行扣减
        try {
            const result = DataStore.deductQuota(amount, reason);
            if (result) {
                this.showToast(`成功扣减 ${amount.toLocaleString()} 吨配额`, 'success');
                this.hideDeductForm();
                QuotaManager.loadQuotaData();
                this.updateMetrics();
                this.checkWarning();
            }
        } catch (error) {
            console.error('扣减失败:', error);
            this.showToast('扣减失败，请重试', 'error');
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
    },

    // ==================== 排放记录管理 ====================

    /**
     * 初始化排放记录模块
     */
    initEmissionManager() {
        // 绑定Tab切换事件
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = btn.dataset.tab;
                
                // 更新按钮样式
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('border-primary');
                    b.classList.add('border-transparent', 'text-slate-custom/60');
                });
                btn.classList.remove('border-transparent', 'text-slate-custom/60');
                btn.classList.add('border-primary');
                
                // 切换面板
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabId}-tab`)?.classList.add('active');
                
                // 如果切换到排放记录面板，加载数据
                if (tabId === 'emission') {
                    this.loadEmissionData();
                }
            });
        });
        
        // 绑定配额扣减按钮
        const deductBtn = document.getElementById('deductQuotaBtn');
        if (deductBtn) {
            deductBtn.removeEventListener('click', this._deductBtnHandler);
            this._deductBtnHandler = () => this.toggleDeductForm();
            deductBtn.addEventListener('click', this._deductBtnHandler);
            console.log('扣减配额按钮绑定成功');
        } else {
            console.warn('未找到扣减配额按钮');
        }
        
        // 绑定扣减表单
        const deductForm = document.getElementById('deductQuotaInputForm');
        if (deductForm) {
            deductForm.removeEventListener('submit', this._deductFormHandler);
            this._deductFormHandler = (e) => this.handleDeductQuota(e);
            deductForm.addEventListener('submit', this._deductFormHandler);
            console.log('扣减表单绑定成功');
        }
        
        // 绑定取消扣减按钮
        const cancelDeductBtn = document.getElementById('cancelDeductBtn');
        if (cancelDeductBtn) {
            cancelDeductBtn.removeEventListener('click', this._cancelDeductHandler);
            this._cancelDeductHandler = () => this.hideDeductForm();
            cancelDeductBtn.addEventListener('click', this._cancelDeductHandler);
            console.log('取消扣减按钮绑定成功');
        }
        
        // 检查是否有待导入的排放数据
        this.checkPendingEmission();
    },

    /**
     * 检查待导入的排放数据
     */
    checkPendingEmission() {
        const pendingData = localStorage.getItem('pendingEmissionToManagement');
        if (pendingData) {
            const data = JSON.parse(pendingData);
            this.showPendingEmissionPanel(data);
        }
    },

    /**
     * 显示待导入排放数据面板
     */
    showPendingEmissionPanel(data) {
        const panel = document.getElementById('pendingEmissionPanel');
        const info = document.getElementById('pendingEmissionInfo');
        
        if (panel && info) {
            info.textContent = `${data.description || '来自碳核算器的排放记录'} - ${data.co2Equivalent?.toFixed(2) || 0} tCO₂e`;
            panel.style.display = 'block';
            
            // 绑定确认导入按钮
            const confirmBtn = document.getElementById('confirmImportBtn');
            if (confirmBtn) {
                confirmBtn.onclick = () => this.importPendingEmission(data);
            }
            
            // 绑定取消按钮
            const cancelBtn = document.getElementById('cancelImportBtn');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    localStorage.removeItem('pendingEmissionToManagement');
                    panel.style.display = 'none';
                };
            }
        }
    },

    /**
     * 导入待处理的排放数据
     */
    importPendingEmission(data) {
        try {
            DataStore.addEmissionRecord(data);
            localStorage.removeItem('pendingEmissionToManagement');
            
            // 更新UI
            const panel = document.getElementById('pendingEmissionPanel');
            if (panel) panel.style.display = 'none';
            
            // 刷新指标和列表
            this.updateMetrics();
            this.checkWarning();
            this.loadEmissionData();
            
            this.showToast(`成功导入排放记录：${data.co2Equivalent?.toFixed(2)} tCO₂e`, 'success');
        } catch (error) {
            console.error('导入排放数据失败:', error);
            this.showToast('导入失败，请重试', 'error');
        }
    },

    /**
     * 加载排放记录数据
     */
    loadEmissionData() {
        const records = DataStore.getEmissionRecords();
        const listEl = document.getElementById('emissionList');
        const stats = DataStore.getEmissionRecordStats();
        
        // 更新统计
        document.getElementById('totalRecords').textContent = stats.totalRecords;
        document.getElementById('yearEmission').textContent = `${stats.currentYearEmission.toFixed(2)} tCO₂e`;
        document.getElementById('totalEmission').textContent = `${stats.totalEmissionFromRecords.toFixed(2)} tCO₂e`;
        
        // 渲染列表
        if (listEl) {
            if (records.length === 0) {
                listEl.innerHTML = `
                    <div class="bg-sage/30 rounded-xl p-8 text-center">
                        <span class="material-symbols-outlined text-slate-custom/30 text-5xl mb-4">factory</span>
                        <p class="text-slate-custom/40 text-sm">暂无排放记录</p>
                        <p class="text-slate-custom/30 text-xs mt-2">请在碳核算器中计算排放后导入</p>
                    </div>
                `;
            } else {
                listEl.innerHTML = records.map((record, index) => `
                    <div class="emission-item bg-white/40 backdrop-blur-sm rounded-xl p-5 border border-white/50 hover-lift" style="animation-delay: ${index * 0.05}s">
                        <div class="flex items-center justify-between flex-wrap gap-4">
                            <div class="flex items-center gap-4 min-w-0">
                                <div class="size-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <span class="material-symbols-outlined text-orange-600 text-2xl">factory</span>
                                </div>
                                <div class="min-w-0">
                                    <h4 class="font-bold text-slate-custom truncate">${record.description || '排放记录'}</h4>
                                    <p class="text-xs text-slate-custom/50 mt-1">${new Date(record.timestamp).toLocaleString('zh-CN')}</p>
                                </div>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <p class="text-xl font-bold text-orange-600">${record.co2Equivalent?.toFixed(2) || 0}</p>
                                <p class="text-xs text-slate-custom/50">tCO₂e</p>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-slate-custom/10 flex justify-between items-center flex-wrap gap-2">
                            <div class="text-xs text-slate-custom/40 truncate">
                                消耗量: ${record.consumption?.toFixed(2) || 0} ${record.consumptionUnit || '单位'} | 因子: ${record.factor || '-'}
                            </div>
                            <button class="text-xs text-red-500 hover:text-red-600 font-medium whitespace-nowrap" onclick="App.deleteEmissionRecord('${record.id}')">
                                删除
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    },

    /**
     * 删除排放记录
     */
    deleteEmissionRecord(id) {
        if (confirm('确定要删除这条排放记录吗？')) {
            DataStore.deleteEmissionRecord(id);
            this.loadEmissionData();
            this.updateMetrics();
            this.checkWarning();
            this.showToast('排放记录已删除', 'success');
        }
    },

    // ==================== 配额扣减功能 ====================

    /**
     * 切换扣减表单显示
     */
    toggleDeductForm() {
        const form = document.getElementById('deductQuotaForm');
        if (form) {
            const computedStyle = window.getComputedStyle(form);
            const isVisible = computedStyle.display !== 'none';
            
            if (isVisible) {
                form.style.display = 'none';
            } else {
                form.style.display = 'block';
                const formEl = form.querySelector('form');
                if (formEl) formEl.reset();
            }
        }
    },

    /**
     * 隐藏扣减表单
     */
    hideDeductForm() {
        const form = document.getElementById('deductQuotaForm');
        if (form) {
            form.style.display = 'none';
        }
    },

    /**
     * 处理配额扣减
     */
    handleDeductQuota(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('deductAmount').value);
        const reason = document.getElementById('deductReason').value;
        
        if (!amount || amount <= 0) {
            this.showToast('请输入有效的扣减数量', 'error');
            return;
        }
        
        if (!reason) {
            this.showToast('请选择扣减原因', 'error');
            return;
        }
        
        // 执行扣减
        const result = DataStore.deductQuota(amount, reason);
        
        if (result.success) {
            this.showToast(result.message, 'success');
            this.hideDeductForm();
            QuotaManager.loadQuotaData();
            this.updateMetrics();
            this.checkWarning();
        } else {
            this.showToast(result.message, 'error');
        }
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