/**
 * 数据管理模块
 * 负责表单数据的存储、读取、验证和缓存
 */
class DataManager {
    constructor() {
        this.storageKey = 'carbon_report_data';
        this.draftKey = 'carbon_report_draft';
    }

    /**
     * 保存表单数据到LocalStorage
     * @param {string} industryId - 行业ID
     * @param {Object} formData - 表单数据
     */
    saveData(industryId, formData) {
        const data = {
            industry: industryId,
            values: formData,
            updatedAt: new Date().toISOString(),
            createdAt: this.getData()?.createdAt || new Date().toISOString()
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    }

    /**
     * 从LocalStorage读取数据
     * @returns {Object|null} 存储的数据
     */
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('读取数据失败:', e);
            return null;
        }
    }

    /**
     * 保存草稿
     * @param {string} industryId - 行业ID
     * @param {Object} formData - 表单数据
     */
    saveDraft(industryId, formData) {
        const draft = {
            industry: industryId,
            values: formData,
            savedAt: new Date().toISOString()
        };
        
        try {
            localStorage.setItem(this.draftKey, JSON.stringify(draft));
            return true;
        } catch (e) {
            console.error('保存草稿失败:', e);
            return false;
        }
    }

    /**
     * 加载草稿
     * @returns {Object|null} 草稿数据
     */
    loadDraft() {
        try {
            const draft = localStorage.getItem(this.draftKey);
            return draft ? JSON.parse(draft) : null;
        } catch (e) {
            console.error('加载草稿失败:', e);
            return null;
        }
    }

    /**
     * 清除草稿
     */
    clearDraft() {
        localStorage.removeItem(this.draftKey);
    }

    /**
     * 清除所有数据
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.draftKey);
    }

    /**
     * 验证表单数据
     * @param {Object} formData - 表单数据
     * @param {Array} variableGroups - 变量分组（包含required信息）
     * @returns {Object} 验证结果 {valid: boolean, errors: Array}
     */
    validate(formData, variableGroups) {
        const errors = [];
        
        variableGroups.forEach(group => {
            group.variables.forEach(varDef => {
                const value = formData[varDef.name];
                
                // 必填验证
                if (varDef.required && this.isEmpty(value)) {
                    errors.push({
                        field: varDef.name,
                        message: `${varDef.label} 为必填项`
                    });
                }
                
                // 类型验证
                if (!this.isEmpty(value)) {
                    const typeError = this.validateType(value, varDef);
                    if (typeError) {
                        errors.push({
                            field: varDef.name,
                            message: typeError
                        });
                    }
                }
            });
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 检查值是否为空
     * @param {*} value - 值
     * @returns {boolean} 是否为空
     */
    isEmpty(value) {
        return value === undefined || value === null || value === '';
    }

    /**
     * 类型验证
     * @param {*} value - 值
     * @param {Object} varDef - 变量定义
     * @returns {string|null} 错误信息，null表示验证通过
     */
    validateType(value, varDef) {
        switch (varDef.type) {
            case 'number':
                if (isNaN(parseFloat(value))) {
                    return `${varDef.label} 必须为数字`;
                }
                break;
            case 'date':
                if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(value)) {
                    return `${varDef.label} 格式不正确，应为YYYY或YYYY-MM-DD`;
                }
                break;
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return `${varDef.label} 邮箱格式不正确`;
                }
                break;
        }
        return null;
    }

    /**
     * 获取表单填充进度
     * @param {Object} formData - 表单数据
     * @param {Array} variableGroups - 变量分组
     * @returns {Object} 进度信息
     */
    getProgress(formData, variableGroups) {
        let total = 0;
        let filled = 0;
        let requiredTotal = 0;
        let requiredFilled = 0;
        
        variableGroups.forEach(group => {
            group.variables.forEach(varDef => {
                total++;
                if (varDef.required) {
                    requiredTotal++;
                }
                
                if (!this.isEmpty(formData[varDef.name])) {
                    filled++;
                    if (varDef.required) {
                        requiredFilled++;
                    }
                }
            });
        });
        
        return {
            total: total,
            filled: filled,
            requiredTotal: requiredTotal,
            requiredFilled: requiredFilled,
            percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
            requiredPercentage: requiredTotal > 0 ? Math.round((requiredFilled / requiredTotal) * 100) : 0
        };
    }

    /**
     * 导出数据为JSON
     * @param {string} industryId - 行业ID
     * @param {Object} formData - 表单数据
     * @returns {string} JSON字符串
     */
    exportToJson(industryId, formData) {
        const data = {
            exportVersion: '1.0',
            exportedAt: new Date().toISOString(),
            industry: industryId,
            values: formData
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * 从JSON导入数据
     * @param {string} jsonString - JSON字符串
     * @returns {Object|null} 导入的数据
     */
    importFromJson(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.industry && data.values) {
                return data;
            }
            return null;
        } catch (e) {
            console.error('导入数据失败:', e);
            return null;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.DataManager = DataManager;
}