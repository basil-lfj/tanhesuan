/**
 * 碳资产管理系统 - 配额管理模块
 * 
 * 功能说明：
 * 1. 配额录入：支持企业录入各类碳配额
 * 2. 配额查询：查看配额明细和使用情况
 * 3. 配额计算：自动计算配额余额、缺口/盈余
 * 4. 配额预警：当存在缺口时触发预警
 */

const QuotaManager = {
    // 配额类型映射
    QUOTA_TYPES: {
        'national': '全国碳市场配额',
        'pilot': '试点碳市场配额',
        'voluntary': '自愿减排配额',
        'other': '其他配额'
    },

    // 状态类型
    STATUS_TYPES: {
        'available': { text: '可用', color: 'text-primary' },
        'locked': { text: '锁定中', color: 'text-primary' },
        'frozen': { text: '冻结', color: 'text-slate-custom/40' }
    },

    /**
     * 初始化配额管理模块
     */
    init() {
        this.bindEvents();
        this.loadQuotaData();
        console.log('配额管理模块初始化完成');
    },

    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 新增配额按钮
        const addBtn = document.getElementById('addQuotaBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showQuotaForm());
        }

        // 取消按钮
        const cancelBtn = document.getElementById('cancelQuotaBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideQuotaForm());
        }

        // 表单提交
        const form = document.getElementById('quotaInputForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleQuotaSubmit(e));
        }
    },

    /**
     * 显示配额录入表单
     */
    showQuotaForm() {
        const formPanel = document.getElementById('quotaForm');
        if (formPanel) {
            formPanel.classList.add('show');
            formPanel.style.padding = '1.5rem';
            formPanel.style.maxHeight = '500px';
            // 设置默认值
            document.getElementById('quotaYear').value = new Date().getFullYear();
            document.getElementById('quotaDate').value = new Date().toISOString().split('T')[0];
        }
    },

    /**
     * 隐藏配额录入表单
     */
    hideQuotaForm() {
        const formPanel = document.getElementById('quotaForm');
        const form = document.getElementById('quotaInputForm');
        if (formPanel) {
            formPanel.classList.remove('show');
            formPanel.style.padding = '0';
            formPanel.style.maxHeight = '0';
        }
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
    },

    /**
     * 处理配额表单提交
     * @param {Event} e - 提交事件
     */
    handleQuotaSubmit(e) {
        e.preventDefault();
        
        // 收集表单数据
        const quotaData = {
            year: parseInt(document.getElementById('quotaYear').value),
            type: document.getElementById('quotaType').value,
            typeName: this.QUOTA_TYPES[document.getElementById('quotaType').value],
            amount: parseFloat(document.getElementById('quotaAmount').value),
            issueDate: document.getElementById('quotaDate').value,
            remark: document.getElementById('quotaRemark').value || ''
        };

        // 数据验证
        if (!this.validateQuotaData(quotaData)) {
            return;
        }

        // 检查是否为编辑模式
        const form = e.target;
        const editId = form.dataset.editId;

        try {
            if (editId) {
                // 编辑模式
                const updated = DataStore.updateQuota(editId, quotaData);
                if (updated) {
                    console.log('配额更新成功:', updated);
                    this.showToast('配额更新成功！', 'success');
                }
            } else {
                // 新增模式
                const savedQuota = DataStore.addQuota(quotaData);
                console.log('配额保存成功:', savedQuota);
                this.showToast('配额录入成功！', 'success');
            }
            
            // 刷新显示
            this.loadQuotaData();
            this.hideQuotaForm();
            
            // 更新整体指标
            if (typeof App !== 'undefined') {
                App.updateMetrics();
                App.checkWarning();
            }
        } catch (error) {
            console.error('配额保存失败:', error);
            this.showToast('保存失败，请重试！', 'error');
        }
    },

    /**
     * 验证配额数据
     * @param {Object} data - 配额数据
     * @returns {boolean} 是否有效
     */
    validateQuotaData(data) {
        if (!data.year || data.year < 2020 || data.year > 2030) {
            this.showToast('请选择有效的年度（2020-2030）', 'error');
            return false;
        }
        if (!data.type) {
            this.showToast('请选择配额类型', 'error');
            return false;
        }
        if (!data.amount || data.amount <= 0) {
            this.showToast('请输入有效的配额数量', 'error');
            return false;
        }
        if (!data.issueDate) {
            this.showToast('请选择发放日期', 'error');
            return false;
        }
        return true;
    },

    /**
     * 加载配额数据并渲染列表
     */
    loadQuotaData() {
        const quotas = DataStore.getQuotas();
        const listContainer = document.getElementById('quotaList');
        
        if (!listContainer) return;

        if (quotas.length === 0) {
            listContainer.innerHTML = `
                <div class="bg-white/30 backdrop-blur-sm rounded-xl p-12 text-center border border-white/50 animate-fade-in-up">
                    <span class="material-symbols-outlined text-5xl text-slate-custom/20 mb-4">folder_open</span>
                    <p class="text-slate-custom/40 text-sm">暂无配额数据</p>
                    <p class="text-slate-custom/30 text-xs mt-1">点击"新增配额"按钮添加</p>
                </div>
            `;
            return;
        }

        // 按年度降序排序
        const sortedQuotas = [...quotas].sort((a, b) => b.year - a.year);

        listContainer.innerHTML = sortedQuotas.map((quota, index) => `
            <div class="flex items-center justify-between py-6 px-4 border-b border-slate-custom/5 group transition-all bg-white/20 hover:bg-white/40 rounded-xl mb-3 hover-lift animate-fade-in-up table-row-animate" style="animation-delay: ${index * 0.05}s" data-id="${quota.id}">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 flex items-center justify-center border border-slate-custom/10 text-slate-custom/60 rounded-lg group-hover:border-primary/30 transition-colors">
                        <span class="text-xs font-bold">${quota.year.toString().slice(-2)}${quota.type.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <p class="text-sm font-bold">${quota.typeName || this.QUOTA_TYPES[quota.type]}</p>
                        <p class="text-xs text-slate-custom/40">有效期至 ${quota.year + 1}.12.31</p>
                    </div>
                </div>
                <div class="flex items-center gap-8">
                    <div class="text-right">
                        <p class="text-sm font-bold">${this.formatNumber(quota.remaining)} t</p>
                        <p class="text-xs ${this.getStatusColor(quota)} font-medium">${this.getStatusText(quota)}</p>
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="QuotaManager.editQuota('${quota.id}')" class="p-2 hover:bg-primary/10 rounded-lg transition-colors" title="编辑">
                            <span class="material-symbols-outlined text-lg text-slate-custom/60 hover:text-primary">edit</span>
                        </button>
                        <button onclick="QuotaManager.deleteQuota('${quota.id}')" class="p-2 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                            <span class="material-symbols-outlined text-lg text-slate-custom/60 hover:text-red-500">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * 获取状态文本
     */
    getStatusText(quota) {
        if (quota.remaining <= 0) return '已用完';
        if (quota.used > 0) return '使用中';
        return '可用';
    },

    /**
     * 获取状态颜色
     */
    getStatusColor(quota) {
        if (quota.remaining <= 0) return 'text-slate-custom/40';
        if (quota.used > 0) return 'text-primary';
        return 'text-primary';
    },

    /**
     * 编辑配额
     * @param {string} id - 配额ID
     */
    editQuota(id) {
        const quotas = DataStore.getQuotas();
        const quota = quotas.find(q => q.id === id);
        
        if (!quota) {
            this.showToast('未找到配额记录', 'error');
            return;
        }

        // 填充表单
        document.getElementById('quotaYear').value = quota.year;
        document.getElementById('quotaType').value = quota.type;
        document.getElementById('quotaAmount').value = quota.amount;
        document.getElementById('quotaDate').value = quota.issueDate;
        document.getElementById('quotaRemark').value = quota.remark || '';

        // 显示表单
        this.showQuotaForm();

        // 修改表单为编辑模式
        const form = document.getElementById('quotaInputForm');
        form.dataset.editId = id;
    },

    /**
     * 删除配额
     * @param {string} id - 配额ID
     */
    deleteQuota(id) {
        if (!confirm('确定要删除该配额记录吗？此操作不可恢复。')) {
            return;
        }

        try {
            const result = DataStore.deleteQuota(id);
            if (result) {
                this.loadQuotaData();
                
                // 更新整体指标
                if (typeof App !== 'undefined') {
                    App.updateMetrics();
                    App.checkWarning();
                }
                
                this.showToast('配额删除成功！', 'success');
            } else {
                this.showToast('删除失败，未找到该记录', 'error');
            }
        } catch (error) {
            console.error('删除配额失败:', error);
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
     * 获取配额汇总信息
     * @returns {Object} 汇总信息
     */
    getSummary() {
        const stats = DataStore.getQuotaStats();
        return {
            totalQuota: stats.totalQuota,
            totalUsed: stats.totalUsed,
            totalRemaining: stats.totalRemaining,
            quotaCount: stats.quotaCount,
            quotas: DataStore.getQuotas()
        };
    }
};