/**
 * 碳资产管理系统 - 数据存储层
 * 使用 localStorage 模拟数据库存储
 * 
 * 数据模型设计：
 * 1. 配额数据 (quotas): 存储企业碳配额信息
 * 2. 减排数据 (reductions): 存储企业减排成果
 * 3. 排放数据 (emissions): 存储当前排放量信息
 */

const DataStore = {
    // 存储键名常量
    KEYS: {
        QUOTAS: 'carbon_quotas',
        REDUCTIONS: 'carbon_reductions',
        EMISSIONS: 'carbon_emissions',
        SETTINGS: 'carbon_settings',
        EMISSION_RECORDS: 'carbon_emission_records' // 新增：排放记录
    },

    // ==================== 初始化方法 ====================
    
    /**
     * 初始化数据存储
     * 如果是首次使用，创建初始数据结构
     */
    init() {
        if (!localStorage.getItem(this.KEYS.QUOTAS)) {
            localStorage.setItem(this.KEYS.QUOTAS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.REDUCTIONS)) {
            localStorage.setItem(this.KEYS.REDUCTIONS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.EMISSIONS)) {
            // 初始化默认排放数据
            const defaultEmissions = {
                currentYear: new Date().getFullYear(),
                totalEmission: 0,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(this.KEYS.EMISSIONS, JSON.stringify(defaultEmissions));
        }
        if (!localStorage.getItem(this.KEYS.EMISSION_RECORDS)) {
            localStorage.setItem(this.KEYS.EMISSION_RECORDS, JSON.stringify([]));
        }
        console.log('数据存储初始化完成');
    },

    // ==================== 配额管理 ====================
    
    /**
     * 获取所有配额记录
     * @returns {Array} 配额记录数组
     */
    getQuotas() {
        const data = localStorage.getItem(this.KEYS.QUOTAS);
        return data ? JSON.parse(data) : [];
    },

    /**
     * 添加配额记录
     * @param {Object} quota - 配额信息
     * @returns {Object} 添加的配额记录（含ID）
     */
    addQuota(quota) {
        const quotas = this.getQuotas();
        const newQuota = {
            id: this._generateId(),
            ...quota,
            used: 0, // 已使用量
            remaining: quota.amount, // 剩余量
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        quotas.push(newQuota);
        localStorage.setItem(this.KEYS.QUOTAS, JSON.stringify(quotas));
        return newQuota;
    },

    /**
     * 更新配额记录
     * @param {string} id - 配额ID
     * @param {Object} updates - 更新内容
     * @returns {Object|null} 更新后的配额记录
     */
    updateQuota(id, updates) {
        const quotas = this.getQuotas();
        const index = quotas.findIndex(q => q.id === id);
        if (index === -1) return null;
        
        quotas[index] = {
            ...quotas[index],
            ...updates,
            remaining: (updates.amount || quotas[index].amount) - (updates.used || quotas[index].used),
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.QUOTAS, JSON.stringify(quotas));
        return quotas[index];
    },

    /**
     * 删除配额记录
     * @param {string} id - 配额ID
     * @returns {boolean} 是否删除成功
     */
    deleteQuota(id) {
        const quotas = this.getQuotas();
        const filtered = quotas.filter(q => q.id !== id);
        if (filtered.length === quotas.length) return false;
        localStorage.setItem(this.KEYS.QUOTAS, JSON.stringify(filtered));
        return true;
    },

    /**
     * 获取配额统计信息
     * @returns {Object} 配额统计数据
     */
    getQuotaStats() {
        const quotas = this.getQuotas();
        const currentYear = new Date().getFullYear();
        
        // 筛选当年有效配额
        const currentQuotas = quotas.filter(q => q.year === currentYear);
        
        const totalQuota = currentQuotas.reduce((sum, q) => sum + q.amount, 0);
        const totalUsed = currentQuotas.reduce((sum, q) => sum + q.used, 0);
        const totalRemaining = currentQuotas.reduce((sum, q) => sum + q.remaining, 0);
        
        return {
            totalQuota,
            totalUsed,
            totalRemaining,
            quotaCount: currentQuotas.length,
            currentYear
        };
    },

    // ==================== 减排成果管理 ====================
    
    /**
     * 获取所有减排记录
     * @returns {Array} 减排记录数组
     */
    getReductions() {
        const data = localStorage.getItem(this.KEYS.REDUCTIONS);
        return data ? JSON.parse(data) : [];
    },

    /**
     * 添加减排记录
     * @param {Object} reduction - 减排信息
     * @returns {Object} 添加的减排记录（含ID）
     */
    addReduction(reduction) {
        const reductions = this.getReductions();
        const newReduction = {
            id: this._generateId(),
            ...reduction,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        reductions.push(newReduction);
        localStorage.setItem(this.KEYS.REDUCTIONS, JSON.stringify(reductions));
        return newReduction;
    },

    /**
     * 更新减排记录
     * @param {string} id - 减排记录ID
     * @param {Object} updates - 更新内容
     * @returns {Object|null} 更新后的减排记录
     */
    updateReduction(id, updates) {
        const reductions = this.getReductions();
        const index = reductions.findIndex(r => r.id === id);
        if (index === -1) return null;
        
        reductions[index] = {
            ...reductions[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.REDUCTIONS, JSON.stringify(reductions));
        return reductions[index];
    },

    /**
     * 删除减排记录
     * @param {string} id - 减排记录ID
     * @returns {boolean} 是否删除成功
     */
    deleteReduction(id) {
        const reductions = this.getReductions();
        const filtered = reductions.filter(r => r.id !== id);
        if (filtered.length === reductions.length) return false;
        localStorage.setItem(this.KEYS.REDUCTIONS, JSON.stringify(filtered));
        return true;
    },

    /**
     * 获取减排统计信息
     * @returns {Object} 减排统计数据
     */
    getReductionStats() {
        const reductions = this.getReductions();
        const currentYear = new Date().getFullYear();
        
        // 按年度分组统计
        const byYear = {};
        reductions.forEach(r => {
            if (!byYear[r.year]) {
                byYear[r.year] = { total: 0, count: 0 };
            }
            byYear[r.year].total += r.amount;
            byYear[r.year].count++;
        });
        
        // 计算总减排量
        const totalReduction = reductions.reduce((sum, r) => sum + r.amount, 0);
        
        // 当年减排量
        const currentYearReduction = byYear[currentYear]?.total || 0;
        
        return {
            totalReduction,
            currentYearReduction,
            byYear,
            recordCount: reductions.length,
            currentYear
        };
    },

    // ==================== 排放数据管理 ====================
    
    /**
     * 获取排放数据
     * @returns {Object} 排放数据
     */
    getEmissions() {
        const data = localStorage.getItem(this.KEYS.EMISSIONS);
        return data ? JSON.parse(data) : { currentYear: new Date().getFullYear(), totalEmission: 0 };
    },

    /**
     * 更新排放数据
     * @param {Object} emissionData - 排放数据
     * @returns {Object} 更新后的排放数据
     */
    updateEmissions(emissionData) {
        const current = this.getEmissions();
        const updated = {
            ...current,
            ...emissionData,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.EMISSIONS, JSON.stringify(updated));
        return updated;
    },

    /**
     * 设置当前排放量
     * @param {number} amount - 排放量（吨CO₂）
     */
    setCurrentEmission(amount) {
        this.updateEmissions({
            currentYear: new Date().getFullYear(),
            totalEmission: amount
        });
    },

    // ==================== 综合计算 ====================
    
    /**
     * 计算配额缺口/盈余
     * 逻辑：配额缺口 = 当前排放量 - 可用配额
     * 正值表示缺口，负值表示盈余
     * @returns {Object} 缺口/盈余计算结果
     */
    calculateGap() {
        const quotaStats = this.getQuotaStats();
        const emissions = this.getEmissions();
        const reductionStats = this.getReductionStats();
        
        // 可用配额 = 配额余额 + 累计减排量
        const availableQuota = quotaStats.totalRemaining + reductionStats.totalReduction;
        
        // 当前排放量
        const currentEmission = emissions.totalEmission;
        
        // 配额缺口 = 当前排放量 - 可用配额
        // 正值：缺口（排放量大于可用配额）
        // 负值：盈余（可用配额大于排放量）
        const gap = currentEmission - availableQuota;
        
        return {
            currentEmission,
            availableQuota,
            quotaRemaining: quotaStats.totalRemaining,
            totalReduction: reductionStats.totalReduction,
            gap,
            isDeficit: gap > 0, // 是否存在缺口
            gapPercent: availableQuota > 0 ? (gap / currentEmission * 100).toFixed(2) : 0
        };
    },

    /**
     * 检查是否需要预警
     * @returns {Object} 预警信息
     */
    checkWarning() {
        const gapInfo = this.calculateGap();
        
        // 预警条件：存在配额缺口
        if (gapInfo.isDeficit) {
            return {
                needWarning: true,
                level: gapInfo.gapPercent > 20 ? 'high' : 'medium',
                message: `您的碳配额存在 ${gapInfo.gap.toFixed(2)} 吨CO₂缺口，占排放量的 ${gapInfo.gapPercent}%，请及时采取履约措施！`,
                gap: gapInfo.gap
            };
        }
        
        return {
            needWarning: false,
            level: 'none',
            message: `您的碳配额盈余 ${Math.abs(gapInfo.gap).toFixed(2)} 吨CO₂，履约状态良好。`,
            gap: gapInfo.gap
        };
    },

    // ==================== 排放记录管理（从碳核算器导入） ====================
    
    /**
     * 获取所有排放记录
     * @returns {Array} 排放记录数组
     */
    getEmissionRecords() {
        const data = localStorage.getItem(this.KEYS.EMISSION_RECORDS);
        return data ? JSON.parse(data) : [];
    },

    /**
     * 添加排放记录（从碳核算器导入）
     * @param {Object} record - 排放记录
     * @returns {Object} 添加的记录
     */
    addEmissionRecord(record) {
        const records = this.getEmissionRecords();
        const newRecord = {
            id: record.id || this._generateId(),
            ...record,
            importedAt: new Date().toISOString()
        };
        records.push(newRecord);
        localStorage.setItem(this.KEYS.EMISSION_RECORDS, JSON.stringify(records));
        
        // 更新总排放量
        this.addToTotalEmission(record.co2Equivalent || 0);
        
        return newRecord;
    },

    /**
     * 删除排放记录
     * @param {string} id - 记录ID
     * @returns {boolean} 是否删除成功
     */
    deleteEmissionRecord(id) {
        const records = this.getEmissionRecords();
        const record = records.find(r => r.id === id);
        if (record) {
            // 从总排放量中减去
            this.addToTotalEmission(-(record.co2Equivalent || 0));
        }
        const filtered = records.filter(r => r.id !== id);
        localStorage.setItem(this.KEYS.EMISSION_RECORDS, JSON.stringify(filtered));
        return true;
    },

    /**
     * 获取排放记录统计
     * @returns {Object} 统计数据
     */
    getEmissionRecordStats() {
        const records = this.getEmissionRecords();
        const currentYear = new Date().getFullYear();
        const currentYearRecords = records.filter(r => new Date(r.timestamp).getFullYear() === currentYear);
        
        return {
            totalRecords: records.length,
            currentYearRecords: currentYearRecords.length,
            totalEmissionFromRecords: records.reduce((sum, r) => sum + (r.co2Equivalent || 0), 0),
            currentYearEmission: currentYearRecords.reduce((sum, r) => sum + (r.co2Equivalent || 0), 0)
        };
    },

    /**
     * 增加总排放量
     * @param {number} amount - 增加量
     */
    addToTotalEmission(amount) {
        const emissions = this.getEmissions();
        emissions.totalEmission = (emissions.totalEmission || 0) + amount;
        emissions.lastUpdated = new Date().toISOString();
        localStorage.setItem(this.KEYS.EMISSIONS, JSON.stringify(emissions));
    },

    // ==================== 配额扣减功能 ====================
    
    /**
     * 扣减配额
     * @param {number} amount - 扣减量
     * @param {string} reason - 扣减原因
     * @returns {Object} 扣减结果
     */
    deductQuota(amount, reason = '履约消耗') {
        const quotas = this.getQuotas();
        const currentYear = new Date().getFullYear();
        
        // 筛选当年有效配额，按日期排序（先进先出）
        const validQuotas = quotas
            .filter(q => q.year === currentYear && q.remaining > 0)
            .sort((a, b) => new Date(a.issueDate || a.date) - new Date(b.issueDate || b.date));
        
        if (validQuotas.length === 0) {
            return { success: false, message: '没有可用配额' };
        }
        
        const totalAvailable = validQuotas.reduce((sum, q) => sum + q.remaining, 0);
        if (totalAvailable < amount) {
            return { success: false, message: `可用配额不足，当前可用 ${totalAvailable.toFixed(2)} 吨` };
        }
        
        // 按先进先出原则扣减
        let remainingToDeduct = amount;
        const deductions = [];
        
        for (const quota of validQuotas) {
            if (remainingToDeduct <= 0) break;
            
            const deductAmount = Math.min(quota.remaining, remainingToDeduct);
            quota.used += deductAmount;
            quota.remaining -= deductAmount;
            remainingToDeduct -= deductAmount;
            
            deductions.push({
                quotaId: quota.id,
                quotaType: quota.type,
                deductedAmount: deductAmount
            });
        }
        
        // 更新存储
        localStorage.setItem(this.KEYS.QUOTAS, JSON.stringify(quotas));
        
        // 记录扣减日志
        this.logDeduction(amount, reason, deductions);
        
        return {
            success: true,
            deductedAmount: amount,
            deductions,
            message: `成功扣减 ${amount.toFixed(2)} 吨配额`
        };
    },

    /**
     * 记录扣减日志
     */
    logDeduction(amount, reason, details) {
        const logs = JSON.parse(localStorage.getItem('carbon_deduction_logs') || '[]');
        logs.push({
            id: this._generateId(),
            amount,
            reason,
            details,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('carbon_deduction_logs', JSON.stringify(logs));
    },

    /**
     * 获取扣减日志
     */
    getDeductionLogs() {
        return JSON.parse(localStorage.getItem('carbon_deduction_logs') || '[]');
    },

    // ==================== 工具方法 ====================
    
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    _generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 清空所有数据（用于测试）
     */
    clearAll() {
        localStorage.removeItem(this.KEYS.QUOTAS);
        localStorage.removeItem(this.KEYS.REDUCTIONS);
        localStorage.removeItem(this.KEYS.EMISSIONS);
        localStorage.removeItem(this.KEYS.SETTINGS);
        this.init();
    },

    /**
     * 导出所有数据
     * @returns {Object} 所有数据
     */
    exportAll() {
        return {
            quotas: this.getQuotas(),
            reductions: this.getReductions(),
            emissions: this.getEmissions(),
            exportTime: new Date().toISOString()
        };
    },

    /**
     * 导入数据
     * @param {Object} data - 导入的数据
     */
    importAll(data) {
        if (data.quotas) {
            localStorage.setItem(this.KEYS.QUOTAS, JSON.stringify(data.quotas));
        }
        if (data.reductions) {
            localStorage.setItem(this.KEYS.REDUCTIONS, JSON.stringify(data.reductions));
        }
        if (data.emissions) {
            localStorage.setItem(this.KEYS.EMISSIONS, JSON.stringify(data.emissions));
        }
    }
};

// 页面加载时初始化数据存储
document.addEventListener('DOMContentLoaded', () => {
    DataStore.init();
});