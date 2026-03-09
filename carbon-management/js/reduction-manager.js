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

    /**
     * 初始化减排管理模块
     */
    init() {
        this.bindEvents();
        this.loadReductionData();
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
            formPanel.style.display = 'block';
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
            formPanel.style.display = 'none';
        }
        if (form) {
            form.reset();
            // 重置编辑模式
            delete form.dataset.editId;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = '保存';
            }
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
     * 加载减排数据并渲染表格
     */
    loadReductionData() {
        const reductions = DataStore.getReductions();
        const tbody = document.getElementById('reductionTableBody');
        
        if (!tbody) return;

        if (reductions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">
                        暂无减排数据，请点击"新增减排"按钮添加
                    </td>
                </tr>
            `;
            return;
        }

        // 按年度降序排序
        const sortedReductions = [...reductions].sort((a, b) => b.year - a.year);

        tbody.innerHTML = sortedReductions.map(reduction => `
            <tr data-id="${reduction.id}">
                <td>${reduction.year}</td>
                <td>${reduction.typeName || this.REDUCTION_TYPES[reduction.type]}</td>
                <td>${this.formatNumber(reduction.amount)}</td>
                <td>${reduction.implementDate}</td>
                <td title="${reduction.description || ''}">${this.truncateText(reduction.description || '-', 20)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-small btn-secondary" onclick="ReductionManager.editReduction('${reduction.id}')">编辑</button>
                        <button class="btn btn-small btn-danger" onclick="ReductionManager.deleteReduction('${reduction.id}')">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
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
        
        // 更新按钮文字
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = '更新';
        }
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
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    },

    /**
     * 截断文本
     * @param {string} text - 原文本
     * @param {number} maxLength - 最大长度
     * @returns {string} 截断后的文本
     */
    truncateText(text, maxLength) {
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
     * 获取减排汇总信息
     * @returns {Object} 汇总信息
     */
    getSummary() {
        const stats = DataStore.getReductionStats();
        return {
            totalReduction: stats.totalReduction,
            currentYearReduction: stats.currentYearReduction,
            recordCount: stats.recordCount,
            byYear: stats.byYear
        };
    },

    /**
     * 获取减排类型统计
     * @returns {Object} 按类型统计的减排量
     */
    getStatsByType() {
        const reductions = DataStore.getReductions();
        const stats = {};
        
        reductions.forEach(r => {
            if (!stats[r.type]) {
                stats[r.type] = {
                    typeName: r.typeName || this.REDUCTION_TYPES[r.type],
                    total: 0,
                    count: 0
                };
            }
            stats[r.type].total += r.amount;
            stats[r.type].count++;
        });
        
        return stats;
    }
};