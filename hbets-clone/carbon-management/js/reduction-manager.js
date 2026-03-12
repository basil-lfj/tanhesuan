/**
 * 碳资产管理系统 - 减排成果管理模块
 * 
 * 功能说明：
 * 1. 减排录入：支持企业录入各类减排措施和成果
 * 2. 减排查询：查看减排明细和成效
 * 3. 减排统计：自动统计累计减排量
 * 4. 减排分析：分析减排措施效果
 */

const ReductionManager = {
    // 减排类型映射
    REDUCTION_TYPES: {
        'energy': '节能改造',
        'process': '工艺改进',
        'renewable': '可再生能源',
        'ccus': '碳捕集利用与封存',
        'other': '其他措施'
    },

    // 年度减排目标（吨CO2e）
    ANNUAL_TARGET: 50000,

    /**
     * 初始化减排管理模块
     */
    init() {
        this.bindEvents();
        this.loadReductionData();
        this.updateProgress();
        console.log('减排管理模块初始化完成');
    },

    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 新增减排按钮
        const addBtn = document.getElementById('addReductionBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showReductionForm());
        }

        // 取消按钮
        const cancelBtn = document.getElementById('cancelReductionBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideReductionForm());
        }

        // 表单提交
        const form = document.getElementById('reductionInputForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleReductionSubmit(e));
        }
    },

    /**
     * 显示减排录入表单
     */
    showReductionForm() {
        const formPanel = document.getElementById('reductionForm');
        if (formPanel) {
            formPanel.classList.add('show');
            formPanel.style.padding = '1.5rem';
            formPanel.style.maxHeight = '500px';
            formPanel.style.opacity = '1';
            // 设置默认值
            document.getElementById('reductionYear').value = new Date().getFullYear();
            document.getElementById('reductionDate').value = new Date().toISOString().split('T')[0];
        }
    },

    /**
     * 隐藏减排录入表单
     */
    hideReductionForm() {
        const formPanel = document.getElementById('reductionForm');
        const form = document.getElementById('reductionInputForm');
        if (formPanel) {
            formPanel.classList.remove('show');
            formPanel.style.padding = '0';
            formPanel.style.maxHeight = '0';
            formPanel.style.opacity = '0';
        }
        if (form) {
            form.reset();
            // 重置编辑模式
            delete form.dataset.editId;
        }
    },

    /**
     * 处理减排表单提交
     * @param {Event} e - 提交事件
     */
    handleReductionSubmit(e) {
        e.preventDefault();
        
        // 收集表单数据
        const reductionData = {
            year: parseInt(document.getElementById('reductionYear').value),
            type: document.getElementById('reductionType').value,
            typeName: this.REDUCTION_TYPES[document.getElementById('reductionType').value],
            amount: parseFloat(document.getElementById('reductionAmount').value),
            implementDate: document.getElementById('reductionDate').value,
            description: document.getElementById('reductionDesc').value || ''
        };

        // 数据验证
        if (!this.validateReductionData(reductionData)) {
            return;
        }

        // 检查是否为编辑模式
        const form = e.target;
        const editId = form.dataset.editId;

        try {
            if (editId) {
                // 编辑模式
                const updated = DataStore.updateReduction(editId, reductionData);
                if (updated) {
                    console.log('减排记录更新成功:', updated);
                    this.showToast('减排记录更新成功！', 'success');
                } else {
                    this.showToast('更新失败，未找到该记录', 'error');
                    return;
                }
            } else {
                // 新增模式
                const savedReduction = DataStore.addReduction(reductionData);
                console.log('减排记录保存成功:', savedReduction);
                this.showToast('减排成果录入成功！', 'success');
            }
            
            // 刷新显示
            this.loadReductionData();
            this.updateProgress();
            this.hideReductionForm();
            
            // 更新整体指标
            if (typeof App !== 'undefined') {
                App.updateMetrics();
                App.checkWarning();
            }
        } catch (error) {
            console.error('减排记录保存失败:', error);
            this.showToast('保存失败，请重试！', 'error');
        }
    },

    /**
     * 验证减排数据
     * @param {Object} data - 减排数据
     * @returns {boolean} 是否有效
     */
    validateReductionData(data) {
        if (!data.year || data.year < 2020 || data.year > 2030) {
            this.showToast('请选择有效的年度（2020-2030）', 'error');
            return false;
        }
        if (!data.type) {
            this.showToast('请选择减排类型', 'error');
            return false;
        }
        if (!data.amount || data.amount <= 0) {
            this.showToast('请输入有效的减排量', 'error');
            return false;
        }
        if (!data.implementDate) {
            this.showToast('请选择实施日期', 'error');
            return false;
        }
        return true;
    },

    /**
     * 加载减排数据并渲染列表
     */
    loadReductionData() {
        const reductions = DataStore.getReductions();
        const listContainer = document.getElementById('reductionList');
        
        if (!listContainer) return;

        if (reductions.length === 0) {
            listContainer.innerHTML = `
                <div class="bg-white/30 backdrop-blur-sm rounded-xl p-12 text-center border border-white/50 animate-fade-in-up">
                    <span class="material-symbols-outlined text-5xl text-slate-custom/20 mb-4">eco</span>
                    <p class="text-slate-custom/40 text-sm">暂无减排数据</p>
                    <p class="text-slate-custom/30 text-xs mt-1">点击"新增减排"按钮添加</p>
                </div>
            `;
            return;
        }

        // 按实施日期降序排序
        const sortedReductions = [...reductions].sort((a, b) => new Date(b.implementDate) - new Date(a.implementDate));

        listContainer.innerHTML = sortedReductions.map((reduction, index) => `
            <div class="flex items-center justify-between py-5 px-4 border-b border-slate-custom/5 group transition-all bg-white/20 hover:bg-white/40 rounded-xl mb-3 hover-lift animate-fade-in-up table-row-animate flex-wrap gap-4" style="animation-delay: ${index * 0.05}s" data-id="${reduction.id}">
                <div class="flex items-center gap-4 min-w-0">
                    <div class="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg flex-shrink-0">
                        <span class="material-symbols-outlined text-primary text-xl">${this.getTypeIcon(reduction.type)}</span>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-bold truncate">${reduction.typeName || this.REDUCTION_TYPES[reduction.type]}</p>
                        <p class="text-xs text-slate-custom/40">${reduction.implementDate}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 md:gap-6 flex-wrap">
                    <div class="text-right min-w-[100px]">
                        <p class="text-sm font-bold text-primary">- ${this.formatNumber(reduction.amount)} tCO₂e</p>
                        <p class="text-xs text-slate-custom/40">${reduction.year}年度</p>
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="ReductionManager.editReduction('${reduction.id}')" class="p-2 hover:bg-primary/10 rounded-lg transition-colors" title="编辑">
                            <span class="material-symbols-outlined text-lg text-slate-custom/60 hover:text-primary">edit</span>
                        </button>
                        <button onclick="ReductionManager.deleteReduction('${reduction.id}')" class="p-2 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                            <span class="material-symbols-outlined text-lg text-slate-custom/60 hover:text-red-500">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * 获取类型图标
     */
    getTypeIcon(type) {
        const icons = {
            'energy': 'bolt',
            'process': 'precision_manufacturing',
            'renewable': 'solar_power',
            'ccus': 'co2',
            'other': 'more_horiz'
        };
        return icons[type] || 'eco';
    },

    /**
     * 更新进度显示
     */
    updateProgress() {
        const stats = DataStore.getReductionStats();
        const totalReduction = stats.totalReduction || 0;
        const progressPercent = Math.min((totalReduction / this.ANNUAL_TARGET) * 100, 100);
        
        // 更新进度条
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.width = `${progressPercent}%`;
            }, 300);
        }
        
        // 更新百分比文字
        const progressPercentEl = document.getElementById('progressPercent');
        if (progressPercentEl) {
            progressPercentEl.textContent = `${Math.round(progressPercent)}%`;
        }
        
        // 更新进度描述
        const reductionProgress = document.getElementById('reductionProgress');
        if (reductionProgress) {
            reductionProgress.textContent = `已实现 ${this.formatNumber(totalReduction)} tCO₂e`;
        }
    },

    /**
     * 编辑减排记录
     * @param {string} id - 减排记录ID
     */
    editReduction(id) {
        const reductions = DataStore.getReductions();
        const reduction = reductions.find(r => r.id === id);
        
        if (!reduction) {
            this.showToast('未找到减排记录', 'error');
            return;
        }

        // 填充表单
        document.getElementById('reductionYear').value = reduction.year;
        document.getElementById('reductionType').value = reduction.type;
        document.getElementById('reductionAmount').value = reduction.amount;
        document.getElementById('reductionDate').value = reduction.implementDate;
        document.getElementById('reductionDesc').value = reduction.description || '';

        // 显示表单
        this.showReductionForm();

        // 修改表单为编辑模式
        const form = document.getElementById('reductionInputForm');
        form.dataset.editId = id;
    },

    /**
     * 删除减排记录
     * @param {string} id - 减排记录ID
     */
    deleteReduction(id) {
        if (!confirm('确定要删除该减排记录吗？此操作不可恢复。')) {
            return;
        }

        try {
            const result = DataStore.deleteReduction(id);
            if (result) {
                this.loadReductionData();
                this.updateProgress();
                
                // 更新整体指标
                if (typeof App !== 'undefined') {
                    App.updateMetrics();
                    App.checkWarning();
                }
                
                this.showToast('减排记录删除成功！', 'success');
            } else {
                this.showToast('删除失败，未找到该记录', 'error');
            }
        } catch (error) {
            console.error('删除减排记录失败:', error);
            this.showToast('删除失败，请重试', 'error');
        }
    },

    /**
     * 格式化数字显示
     * @param {number} num - 数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num === null || num === undefined) return '--';
        return num.toLocaleString('zh-CN', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
    },

    /**
     * 截断文本
     * @param {string} text - 原文本
     * @param {number} maxLength - 最大长度
     * @returns {string} 截断后的文本
     */
    truncateText(text, maxLength) {
        if (!text) return '-';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success/error/warning)
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
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * 获取减排汇总信息
     * @returns {Object} 汇总信息
     */
    getSummary() {
        const stats = DataStore.getReductionStats();
        return {
            totalReduction: stats.totalReduction,
            reductionCount: stats.reductionCount,
            byType: stats.byType,
            reductions: DataStore.getReductions()
        };
    },
    
    /**
     * 按减排类型统计
     * @returns {Object} 按类型统计的数据
     */
    getStatsByType() {
        const reductions = DataStore.getReductions();
        const typeStats = {};
        
        reductions.forEach(r => {
            if (!typeStats[r.type]) {
                typeStats[r.type] = {
                    typeName: r.typeName || this.REDUCTION_TYPES[r.type] || r.type,
                    total: 0,
                    count: 0
                };
            }
            typeStats[r.type].total += r.amount;
            typeStats[r.type].count++;
        });
        
        return typeStats;
    }
};