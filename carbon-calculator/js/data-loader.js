/**
 * 数据加载模块
 * 负责加载和管理碳排放因子库数据
 */

class DataLoader {
    constructor() {
        this.data = null;
        this.metadata = null;
        this.categories = [];
    }

    /**
     * 加载因子库数据
     * @returns {Promise<boolean>} 加载是否成功
     */
    async loadData() {
        try {
            const response = await fetch('data/emission-factors.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            this.data = jsonData;
            this.metadata = jsonData.metadata;
            this.categories = jsonData.categories;
            return true;
        } catch (error) {
            console.error('加载因子库数据失败:', error);
            return false;
        }
    }

    /**
     * 获取所有燃料类别
     * @returns {Array<string>} 燃料类别列表
     */
    getFuelCategories() {
        const categories = new Set();
        this.categories.forEach(cat => {
            categories.add(cat.fuelCategory);
        });
        return Array.from(categories);
    }

    /**
     * 获取指定燃料类别下的气体类型
     * @param {string} fuelCategory 燃料类别
     * @returns {Array<string>} 气体类型列表
     */
    getGasTypes(fuelCategory) {
        const gasTypes = new Set();
        this.categories.forEach(cat => {
            if (cat.fuelCategory === fuelCategory) {
                gasTypes.add(cat.gasType);
            }
        });
        return Array.from(gasTypes);
    }

    /**
     * 获取指定条件下的排放场景列表
     * @param {string} fuelCategory 燃料类别
     * @param {string} gasType 气体类型
     * @returns {Array<Object>} 排放场景列表
     */
    getEmissionScenarios(fuelCategory, gasType) {
        return this.categories.filter(cat => 
            cat.fuelCategory === fuelCategory && cat.gasType === gasType
        ).map(cat => ({
            id: cat.id,
            name: cat.name,
            sector: cat.sector || null,
            sourceType: cat.sourceType || null
        }));
    }

    /**
     * 获取指定排放场景下的燃料类型列表
     * @param {string} scenarioId 排放场景ID
     * @returns {Array<Object>} 燃料类型列表
     */
    getFuelTypes(scenarioId) {
        const category = this.categories.find(cat => cat.id === scenarioId);
        if (!category) return [];
        return category.factors.map(factor => ({
            fuelType: factor.fuelType,
            factor: factor.factor,
            unit: factor.unit,
            lowerHeatingValue: factor.lowerHeatingValue || null,
            heatingValueUnit: factor.heatingValueUnit || null
        }));
    }

    /**
     * 获取指定排放场景和燃料类型的排放因子
     * @param {string} scenarioId 排放场景ID
     * @param {string} fuelType 燃料类型
     * @returns {Object|null} 排放因子信息
     */
    getEmissionFactor(scenarioId, fuelType) {
        const category = this.categories.find(cat => cat.id === scenarioId);
        if (!category) return null;
        
        const factor = category.factors.find(f => f.fuelType === fuelType);
        if (!factor) return null;
        
        return {
            gasType: category.gasType,
            fuelCategory: category.fuelCategory,
            sector: category.sector || null,
            sourceType: category.sourceType || null,
            ...factor
        };
    }

    /**
     * 获取排放场景详情
     * @param {string} scenarioId 排放场景ID
     * @returns {Object|null} 排放场景详情
     */
    getScenarioDetails(scenarioId) {
        const category = this.categories.find(cat => cat.id === scenarioId);
        if (!category) return null;
        
        return {
            id: category.id,
            name: category.name,
            gasType: category.gasType,
            fuelCategory: category.fuelCategory,
            sector: category.sector || null,
            sourceType: category.sourceType || null,
            description: category.description || null
        };
    }

    /**
     * 获取GWP值
     * @param {string} gasType 气体类型
     * @returns {number} GWP值
     */
    getGWP(gasType) {
        if (!this.metadata || !this.metadata.GWP) {
            // 默认GWP值
            const defaultGWP = { CO2: 1, CH4: 28, N2O: 265 };
            return defaultGWP[gasType] || 1;
        }
        return this.metadata.GWP[gasType] || 1;
    }

    /**
     * 获取元数据
     * @returns {Object} 元数据
     */
    getMetadata() {
        return this.metadata;
    }
}

// 导出数据加载器实例
const dataLoader = new DataLoader();