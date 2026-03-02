/**
 * 主程序入口
 * 负责页面交互和事件处理
 */

// DOM元素引用
const elements = {
    fuelCategory: null,
    gasType: null,
    emissionScenario: null,
    fuelType: null,
    consumption: null,
    lowerHeatingValue: null,
    calculateBtn: null,
    resultSection: null,
    co2Equivalent: null,
    co2Result: null,
    ch4Result: null,
    n2oResult: null,
    co2Emission: null,
    ch4Emission: null,
    n2oEmission: null,
    factorUsed: null,
    factorUnit: null,
    heatingValueUsed: null,
    consumptionUsed: null
};

// 当前选择状态
const selectionState = {
    fuelCategory: null,
    gasType: null,
    scenarioId: null,
    fuelType: null
};

/**
 * 初始化应用
 */
async function initApp() {
    // 获取DOM元素
    initElements();
    
    // 加载数据
    showLoading(true);
    const loaded = await dataLoader.loadData();
    showLoading(false);
    
    if (!loaded) {
        showError('加载因子库数据失败，请刷新页面重试');
        return;
    }
    
    // 初始化下拉框
    initDropdowns();
    
    // 绑定事件
    bindEvents();
    
    console.log('碳核算计算工具初始化完成');
}

/**
 * 初始化DOM元素引用
 */
function initElements() {
    elements.fuelCategory = document.getElementById('fuelCategory');
    elements.gasType = document.getElementById('gasType');
    elements.emissionScenario = document.getElementById('emissionScenario');
    elements.fuelType = document.getElementById('fuelType');
    elements.consumption = document.getElementById('consumption');
    elements.lowerHeatingValue = document.getElementById('lowerHeatingValue');
    elements.calculateBtn = document.getElementById('calculateBtn');
    elements.resultSection = document.getElementById('resultSection');
    elements.co2Equivalent = document.getElementById('co2Equivalent');
    elements.co2Result = document.getElementById('co2Result');
    elements.ch4Result = document.getElementById('ch4Result');
    elements.n2oResult = document.getElementById('n2oResult');
    elements.co2Emission = document.getElementById('co2Emission');
    elements.ch4Emission = document.getElementById('ch4Emission');
    elements.n2oEmission = document.getElementById('n2oEmission');
    elements.factorUsed = document.getElementById('factorUsed');
    elements.factorUnit = document.getElementById('factorUnit');
    elements.heatingValueUsed = document.getElementById('heatingValueUsed');
    elements.consumptionUsed = document.getElementById('consumptionUsed');
}

/**
 * 初始化下拉框
 */
function initDropdowns() {
    // 填充燃料类别
    const fuelCategories = dataLoader.getFuelCategories();
    populateSelect(elements.fuelCategory, fuelCategories, '请选择燃料类别');
}

/**
 * 绑定事件处理
 */
function bindEvents() {
    // 燃料类别变化
    elements.fuelCategory.addEventListener('change', handleFuelCategoryChange);
    
    // 气体类型变化
    elements.gasType.addEventListener('change', handleGasTypeChange);
    
    // 排放场景变化
    elements.emissionScenario.addEventListener('change', handleScenarioChange);
    
    // 燃料类型变化
    elements.fuelType.addEventListener('change', handleFuelTypeChange);
    
    // 计算按钮点击
    elements.calculateBtn.addEventListener('click', handleCalculate);
    
    // 输入框回车
    elements.consumption.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCalculate();
        }
    });
}

/**
 * 处理燃料类别变化
 */
function handleFuelCategoryChange() {
    const value = elements.fuelCategory.value;
    selectionState.fuelCategory = value;
    
    // 重置下级选项
    resetSelect(elements.gasType, '请选择气体类型');
    resetSelect(elements.emissionScenario, '请选择排放场景');
    resetSelect(elements.fuelType, '请选择燃料类型');
    
    if (value) {
        const gasTypes = dataLoader.getGasTypes(value);
        populateSelect(elements.gasType, gasTypes, '请选择气体类型');
    }
    
    hideResult();
}

/**
 * 处理气体类型变化
 */
function handleGasTypeChange() {
    const value = elements.gasType.value;
    selectionState.gasType = value;
    
    // 重置下级选项
    resetSelect(elements.emissionScenario, '请选择排放场景');
    resetSelect(elements.fuelType, '请选择燃料类型');
    
    if (value && selectionState.fuelCategory) {
        const scenarios = dataLoader.getEmissionScenarios(selectionState.fuelCategory, value);
        populateScenarioSelect(elements.emissionScenario, scenarios);
    }
    
    hideResult();
}

/**
 * 处理排放场景变化
 */
function handleScenarioChange() {
    const value = elements.emissionScenario.value;
    selectionState.scenarioId = value;
    
    // 重置下级选项
    resetSelect(elements.fuelType, '请选择燃料类型');
    
    if (value) {
        const fuelTypes = dataLoader.getFuelTypes(value);
        populateFuelTypeSelect(elements.fuelType, fuelTypes);
    }
    
    hideResult();
}

/**
 * 处理燃料类型变化
 */
function handleFuelTypeChange() {
    const value = elements.fuelType.value;
    selectionState.fuelType = value;
    
    // 更新低位发热量提示
    if (value && selectionState.scenarioId) {
        const factorInfo = dataLoader.getEmissionFactor(selectionState.scenarioId, value);
        if (factorInfo && factorInfo.lowerHeatingValue) {
            elements.lowerHeatingValue.placeholder = `默认值: ${factorInfo.lowerHeatingValue} ${factorInfo.heatingValueUnit || ''}`;
        } else {
            elements.lowerHeatingValue.placeholder = '默认使用标准值';
        }
    }
    
    hideResult();
}

/**
 * 处理计算按钮点击
 */
function handleCalculate() {
    // 验证输入
    if (!validateInput()) {
        return;
    }
    
    // 获取输入值
    const consumption = parseFloat(elements.consumption.value);
    const customHeatingValue = elements.lowerHeatingValue.value 
        ? parseFloat(elements.lowerHeatingValue.value) 
        : null;
    
    // 执行计算
    try {
        elements.calculateBtn.disabled = true;
        elements.calculateBtn.textContent = '计算中...';
        
        const result = carbonCalculator.calculate({
            scenarioId: selectionState.scenarioId,
            fuelType: selectionState.fuelType,
            consumption: consumption,
            customHeatingValue: customHeatingValue
        });
        
        // 显示结果
        displayResult(result.data);
        
    } catch (error) {
        showError(error.message || '计算失败，请检查输入');
    } finally {
        elements.calculateBtn.disabled = false;
        elements.calculateBtn.innerHTML = '<span class="btn-icon">⚡</span>计算碳排放';
    }
}

/**
 * 验证输入
 */
function validateInput() {
    // 检查是否选择了所有必选项
    if (!selectionState.fuelCategory) {
        showError('请选择燃料类别');
        elements.fuelCategory.focus();
        return false;
    }
    
    if (!selectionState.gasType) {
        showError('请选择气体类型');
        elements.gasType.focus();
        return false;
    }
    
    if (!selectionState.scenarioId) {
        showError('请选择排放场景');
        elements.emissionScenario.focus();
        return false;
    }
    
    if (!selectionState.fuelType) {
        showError('请选择燃料类型');
        elements.fuelType.focus();
        return false;
    }
    
    // 检查消耗量
    const consumption = elements.consumption.value.trim();
    if (!consumption) {
        showError('请输入燃料消耗量');
        elements.consumption.focus();
        return false;
    }
    
    if (parseFloat(consumption) <= 0) {
        showError('燃料消耗量必须大于0');
        elements.consumption.focus();
        return false;
    }
    
    // 检查自定义低位发热量
    const heatingValue = elements.lowerHeatingValue.value.trim();
    if (heatingValue && parseFloat(heatingValue) <= 0) {
        showError('低位发热量必须大于0');
        elements.lowerHeatingValue.focus();
        return false;
    }
    
    clearError();
    return true;
}

/**
 * 显示计算结果
 */
function displayResult(data) {
    // 显示结果区域
    elements.resultSection.style.display = 'block';
    
    // 显示CO2当量
    elements.co2Equivalent.textContent = formatNumber(data.co2Equivalent);
    
    // 根据气体类型显示对应的排放量
    hideAllEmissionResults();
    
    if (data.gasType === 'CO2') {
        elements.co2Result.style.display = 'flex';
        elements.co2Emission.textContent = `${data.emission}`;
    } else if (data.gasType === 'CH4') {
        elements.ch4Result.style.display = 'flex';
        elements.ch4Emission.textContent = `${data.emission}`;
    } else if (data.gasType === 'N2O') {
        elements.n2oResult.style.display = 'flex';
        elements.n2oEmission.textContent = `${data.emission}`;
    }
    
    // 显示计算参数
    elements.factorUsed.textContent = data.factor;
    elements.factorUnit.textContent = data.factorUnit;
    elements.heatingValueUsed.textContent = typeof data.heatingValue === 'number' 
        ? formatNumber(data.heatingValue) 
        : data.heatingValue;
    elements.consumptionUsed.textContent = `${formatNumber(data.consumption)} kg`;
    
    // 滚动到结果区域
    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 隐藏所有排放结果显示
 */
function hideAllEmissionResults() {
    elements.co2Result.style.display = 'none';
    elements.ch4Result.style.display = 'none';
    elements.n2oResult.style.display = 'none';
}

/**
 * 隐藏结果区域
 */
function hideResult() {
    elements.resultSection.style.display = 'none';
}

/**
 * 填充下拉框
 */
function populateSelect(selectElement, options, defaultText) {
    selectElement.innerHTML = `<option value="">-- ${defaultText} --</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
}

/**
 * 填充排放场景下拉框
 */
function populateScenarioSelect(selectElement, scenarios) {
    selectElement.innerHTML = '<option value="">-- 请选择排放场景 --</option>';
    
    // 按是否有行业分组
    const withSector = scenarios.filter(s => s.sector);
    const withoutSector = scenarios.filter(s => !s.sector);
    
    if (withoutSector.length > 0) {
        withoutSector.forEach(scenario => {
            const option = document.createElement('option');
            option.value = scenario.id;
            option.textContent = scenario.name;
            selectElement.appendChild(option);
        });
    }
    
    if (withSector.length > 0) {
        // 按来源类型分组
        const bySourceType = {};
        withSector.forEach(scenario => {
            const sourceType = scenario.sourceType || '其他';
            if (!bySourceType[sourceType]) {
                bySourceType[sourceType] = [];
            }
            bySourceType[sourceType].push(scenario);
        });
        
        Object.entries(bySourceType).forEach(([sourceType, items]) => {
            const group = document.createElement('optgroup');
            group.label = sourceType;
            
            items.forEach(scenario => {
                const option = document.createElement('option');
                option.value = scenario.id;
                option.textContent = `${scenario.sector}`;
                group.appendChild(option);
            });
            
            selectElement.appendChild(group);
        });
    }
}

/**
 * 填充燃料类型下拉框
 */
function populateFuelTypeSelect(selectElement, fuelTypes) {
    selectElement.innerHTML = '<option value="">-- 请选择燃料类型 --</option>';
    fuelTypes.forEach(item => {
        const option = document.createElement('option');
        option.value = item.fuelType;
        option.textContent = `${item.fuelType} (因子: ${item.factor} ${item.unit})`;
        selectElement.appendChild(option);
    });
}

/**
 * 重置下拉框
 */
function resetSelect(selectElement, defaultText) {
    selectElement.innerHTML = `<option value="">-- ${defaultText} --</option>`;
}

/**
 * 显示错误信息
 */
function showError(message) {
    // 移除已有的错误提示
    clearError();
    
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.id = 'errorMessage';
    errorDiv.textContent = message;
    
    // 插入到计算按钮前面
    elements.calculateBtn.parentNode.insertBefore(errorDiv, elements.calculateBtn);
    
    // 3秒后自动消失
    setTimeout(clearError, 3000);
}

/**
 * 清除错误信息
 */
function clearError() {
    const existingError = document.getElementById('errorMessage');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * 显示/隐藏加载状态
 */
function showLoading(show) {
    if (show) {
        elements.calculateBtn.disabled = true;
        elements.calculateBtn.textContent = '加载中...';
    } else {
        elements.calculateBtn.disabled = false;
        elements.calculateBtn.innerHTML = '<span class="btn-icon">⚡</span>计算碳排放';
    }
}

/**
 * 格式化数字
 */
function formatNumber(num) {
    if (typeof num !== 'number') return num;
    
    if (Number.isInteger(num)) {
        return num.toLocaleString('zh-CN');
    }
    
    return num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);