/**
 * 碳排放计算引擎
 * 负责执行碳排放量计算
 */

class CarbonCalculator {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
    }

    /**
     * 计算碳排放量
     * @param {Object} params 计算参数
     * @param {string} params.scenarioId 排放场景ID
     * @param {string} params.fuelType 燃料类型
     * @param {number} params.consumption 燃料消耗量 (kg)
     * @param {number} params.customHeatingValue 自定义低位发热量 (可选)
     * @returns {Object} 计算结果
     */
    calculate(params) {
        const { scenarioId, fuelType, consumption, customHeatingValue } = params;

        // 获取排放因子信息
        const factorInfo = this.dataLoader.getEmissionFactor(scenarioId, fuelType);
        if (!factorInfo) {
            throw new Error('未找到对应的排放因子');
        }

        // 获取场景详情
        const scenarioDetails = this.dataLoader.getScenarioDetails(scenarioId);
        if (!scenarioDetails) {
            throw new Error('未找到对应的排放场景');
        }

        // 计算能量值 (TJ)
        const energy = this.calculateEnergy(consumption, factorInfo, customHeatingValue);

        // 计算排放量
        const emission = this.calculateEmission(energy, factorInfo);

        // 计算CO2当量
        const co2Equivalent = this.calculateCO2Equivalent(factorInfo.gasType, emission);

        // 格式化排放量显示
        const formattedEmission = this.formatEmission(emission, factorInfo.gasType);

        return {
            success: true,
            data: {
                gasType: factorInfo.gasType,
                emission: formattedEmission.value,
                emissionUnit: formattedEmission.unit,
                co2Equivalent: co2Equivalent,
                co2EquivalentUnit: 'tCO₂e',
                factor: factorInfo.factor,
                factorUnit: factorInfo.unit,
                energy: energy,
                energyUnit: 'TJ',
                heatingValue: customHeatingValue || factorInfo.lowerHeatingValue || '默认',
                heatingValueUnit: factorInfo.heatingValueUnit || '-',
                consumption: consumption,
                consumptionUnit: 'kg',
                scenarioName: scenarioDetails.name,
                fuelType: fuelType
            }
        };
    }

    /**
     * 计算能量值
     * @param {number} consumption 燃料消耗量 (kg)
     * @param {Object} factorInfo 排放因子信息
     * @param {number} customHeatingValue 自定义低位发热量
     * @returns {number} 能量值 (TJ)
     */
    calculateEnergy(consumption, factorInfo, customHeatingValue) {
        // 使用自定义低位发热量或默认值
        let heatingValue = customHeatingValue || factorInfo.lowerHeatingValue;
        
        if (!heatingValue) {
            // 如果没有低位发热量数据，假设消耗量就是能量值（简化处理）
            // 实际应用中应该要求用户输入能量值或提供低位发热量
            // 这里我们假设消耗量的单位是t，并使用一个默认的低位发热量
            heatingValue = 20; // 默认20 TJ/10⁴t
        }

        // 单位转换：
        // 低位发热量单位：TJ/10⁴t = TJ/10000t
        // 消耗量单位：kg = 0.001 t
        // 能量 = 消耗量(kg) / 1000(kg/t) * 低位发热量(TJ/10000t) / 10000
        // 简化：能量(TJ) = 消耗量(kg) * 低位发热量 / (1000 * 10000)
        //              = 消耗量(kg) * 低位发热量 / 10000000
        
        // 实际上：低位发热量 = TJ/10⁴t 意味着每万吨燃料产生多少太焦能量
        // 所以能量(TJ) = 消耗量(t) * 低位发热量(TJ/10⁴t) / 10000
        //            = 消耗量(kg) / 1000 * 低位发热量 / 10000
        //            = 消耗量(kg) * 低位发热量 / 10000000
        
        const energy = consumption * heatingValue / 10000000;
        
        return energy;
    }

    /**
     * 计算排放量
     * @param {number} energy 能量值 (TJ)
     * @param {Object} factorInfo 排放因子信息
     * @returns {number} 排放量
     */
    calculateEmission(energy, factorInfo) {
        const factor = factorInfo.factor;
        const unit = factorInfo.unit;

        // 根据单位确定计算方式
        if (unit.includes('tCO2/TJ')) {
            // CO2: tCO2/TJ, 结果为吨
            return energy * factor;
        } else if (unit.includes('kgCH4/TJ')) {
            // CH4: kgCH4/TJ, 结果为千克
            return energy * factor;
        } else if (unit.includes('kgN2O/TJ')) {
            // N2O: kgN2O/TJ, 结果为千克
            return energy * factor;
        }

        // 默认处理
        return energy * factor;
    }

    /**
     * 计算CO2当量
     * @param {string} gasType 气体类型
     * @param {number} emission 排放量
     * @returns {number} CO2当量 (tCO2e)
     */
    calculateCO2Equivalent(gasType, emission) {
        const gwp = this.dataLoader.getGWP(gasType);
        
        // 根据气体类型确定单位转换
        if (gasType === 'CO2') {
            // 排放量已经是吨
            return emission * gwp;
        } else if (gasType === 'CH4' || gasType === 'N2O') {
            // 排放量是千克，需要转换为吨
            return (emission / 1000) * gwp;
        }
        
        return emission;
    }

    /**
     * 格式化排放量显示
     * @param {number} emission 排放量
     * @param {string} gasType 气体类型
     * @returns {Object} 格式化后的值和单位
     */
    formatEmission(emission, gasType) {
        // 根据数值大小选择合适的单位
        if (gasType === 'CO2') {
            // CO2已经是吨为单位
            if (emission >= 1000) {
                return { value: this.formatNumber(emission), unit: 'tCO₂' };
            } else if (emission >= 1) {
                return { value: this.formatNumber(emission), unit: 'tCO₂' };
            } else {
                return { value: this.formatNumber(emission * 1000), unit: 'kgCO₂' };
            }
        } else if (gasType === 'CH4') {
            // CH4是千克为单位
            if (emission >= 1000) {
                return { value: this.formatNumber(emission / 1000), unit: 'tCH₄' };
            } else {
                return { value: this.formatNumber(emission), unit: 'kgCH₄' };
            }
        } else if (gasType === 'N2O') {
            // N2O是千克为单位
            if (emission >= 1000) {
                return { value: this.formatNumber(emission / 1000), unit: 'tN₂O' };
            } else {
                return { value: this.formatNumber(emission), unit: 'kgN₂O' };
            }
        }

        return { value: this.formatNumber(emission), unit: '' };
    }

    /**
     * 格式化数字
     * @param {number} num 数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (Number.isInteger(num)) {
            return num.toLocaleString('zh-CN');
        }
        return num.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        });
    }
}

// 导出计算器实例
const carbonCalculator = new CarbonCalculator(dataLoader);