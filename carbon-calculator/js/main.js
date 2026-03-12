/**
 * 主程序入口
 * 负责页面交互和事件处理
 */

// 当前活动模块
let currentModule = 'fuel';

// DOM元素引用 - 化石燃料模块
const fuelElements = {
    fuelCategory: null,
    fuelCategoryGroup: null,
    gasType: null,
    gasTypeGroup: null,
    emissionScenario: null,
    emissionScenarioGroup: null,
    fuelType: null,
    fuelTypeGroup: null,
    fuelConsumption: null,
    fuelConsumptionGroup: null,
    fuelConsumptionUnit: null,
    heatingValueGroup: null,
    lowerHeatingValue: null,
    calculateFuelBtn: null,
    calculateFuelSection: null
};

// DOM元素引用 - 电力模块
const electricityElements = {
    gridType: null,
    electricityConsumption: null,
    calculateElectricityBtn: null
};

// DOM元素引用 - 结果区域
const resultElements = {
    resultSection: null,
    treeEquivalent: null,
    visualizationBar: null,
    co2Result: null,
    ch4Result: null,
    n2oResult: null,
    co2Emission: null,
    ch4Emission: null,
    n2oEmission: null,
    factorUsed: null,
    factorUnit: null,
    heatingValueUsed: null,
    consumptionUsed: null,
    gwpInfo: null,
    exportToReportBtn: null
};

// 燃料选择状态
const fuelSelectionState = {
    fuelCategory: null,
    gasType: null,
    scenarioId: null,
    fuelType: null
};

// 电力选择状态
const electricitySelectionState = {
    gridType: null
};

// 当前计算结果（用于导出）
let currentCalculationResult = null;

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
    
    // 初始化模块
    initModuleTabs();
    initFuelModule();
    initElectricityModule();
    
    // 绑定事件
    bindEvents();
    
    console.log('碳核算计算工具初始化完成');
}

/**
 * 获取DOM元素引用
 */
function initElements() {
    // 化石燃料模块元素
    fuelElements.fuelCategory = document.getElementById('fuelCategory');
    fuelElements.gasType = document.getElementById('gasType');
    fuelElements.gasTypeGroup = document.getElementById('gasTypeGroup');
    fuelElements.emissionScenario = document.getElementById('emissionScenario');
    fuelElements.emissionScenarioGroup = document.getElementById('emissionScenarioGroup');
    fuelElements.fuelType = document.getElementById('fuelType');
    fuelElements.fuelTypeGroup = document.getElementById('fuelTypeGroup');
    fuelElements.fuelConsumption = document.getElementById('fuelConsumption');
    fuelElements.fuelConsumptionGroup = document.getElementById('fuelConsumptionGroup');
    fuelElements.fuelConsumptionUnit = document.getElementById('fuelConsumptionUnit');
    fuelElements.heatingValueGroup = document.getElementById('heatingValueGroup');
    fuelElements.lowerHeatingValue = document.getElementById('lowerHeatingValue');
    fuelElements.calculateFuelBtn = document.getElementById('calculateFuelBtn');
    fuelElements.calculateFuelSection = document.getElementById('fuelCalculateSection');
    
    // 电力模块元素
    electricityElements.gridType = document.getElementById('gridType');
    electricityElements.electricityConsumption = document.getElementById('electricityConsumption');
    electricityElements.calculateElectricityBtn = document.getElementById('calculateElectricityBtn');
    
    // 结果区域元素
    resultElements.resultSection = document.getElementById('resultSection');
    resultElements.treeEquivalent = document.getElementById('treeEquivalent');
    resultElements.visualizationBar = document.getElementById('visualizationBar');
    resultElements.co2Result = document.getElementById('co2Result');
    resultElements.ch4Result = document.getElementById('ch4Result');
    resultElements.n2oResult = document.getElementById('n2oResult');
    resultElements.co2Emission = document.getElementById('co2Emission');
    resultElements.ch4Emission = document.getElementById('ch4Emission');
    resultElements.n2oEmission = document.getElementById('n2oEmission');
    resultElements.factorUsed = document.getElementById('factorUsed');
    resultElements.factorUnit = document.getElementById('factorUnit');
    resultElements.heatingValueUsed = document.getElementById('heatingValueUsed');
    resultElements.consumptionUsed = document.getElementById('consumptionUsed');
    resultElements.gwpInfo = document.getElementById('gwpInfo');
    resultElements.exportToReportBtn = document.getElementById('exportToReportBtn');
}

/**
 * 初始化模块标签
 */
function initModuleTabs() {
    const tabs = document.querySelectorAll('.module-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 更新标签状态 - 使用新的样式类
            tabs.forEach(t => {
                t.classList.remove('tab-active');
                t.classList.add('tab-inactive');
            });
            tab.classList.remove('tab-inactive');
            tab.classList.add('tab-active');
            
            // 切换模块
            const module = tab.dataset.module;
            switchModule(module);
        });
    });
}

/**
 * 切换模块
 */
function switchModule(module) {
    currentModule = module;
    
    const fuelModule = document.getElementById('fuelModule');
    const electricityModule = document.getElementById('electricityModule');
    
    if (module === 'fuel') {
        fuelModule.classList.add('active');
        electricityModule.classList.remove('active');
    } else {
        fuelModule.classList.remove('active');
        electricityModule.classList.add('active');
    }
    
    hideResult();
}

/**
 * 初始化化石燃料模块
 */
function initFuelModule() {
    // 填充燃料类别
    const fuelCategories = dataLoader.getFuelCategories();
    populateSelect(fuelElements.fuelCategory, fuelCategories, '请选择燃料类别');
}

/**
 * 初始化电力模块
 */
function initElectricityModule() {
    // 填充电网类型
    const gridTypes = dataLoader.getElectricityGridTypes();
    populateSelect(electricityElements.gridType, gridTypes, '请选择电网类型');
}

/**
 * 绑定事件处理
 */
function bindEvents() {
    // 燃料类别变化
    fuelElements.fuelCategory.addEventListener('change', handleFuelCategoryChange);
    
    // 气体类型变化
    fuelElements.gasType.addEventListener('change', handleGasTypeChange);
    
    // 排放场景变化
    fuelElements.emissionScenario.addEventListener('change', handleScenarioChange);
    
    // 燃料类型变化
    fuelElements.fuelType.addEventListener('change', handleFuelTypeChange);
    
    // 燃料计算按钮
    fuelElements.calculateFuelBtn.addEventListener('click', handleFuelCalculate);
    
    // 电网类型变化
    electricityElements.gridType.addEventListener('change', handleGridTypeChange);
    
    // 电力计算按钮
    electricityElements.calculateElectricityBtn.addEventListener('click', handleElectricityCalculate);
    
    // 输入框回车
    fuelElements.fuelConsumption.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFuelCalculate();
    });
    
    electricityElements.electricityConsumption.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleElectricityCalculate();
    });
    
    // 导出到报告按钮
    if (resultElements.exportToReportBtn) {
        resultElements.exportToReportBtn.addEventListener('click', handleExportToReport);
    }
}

/**
 * 处理燃料类别变化
 */
function handleFuelCategoryChange() {
    const value = fuelElements.fuelCategory.value;
    fuelSelectionState.fuelCategory = value;
    
    // 重置下级选项
    resetSelect(fuelElements.gasType, '请选择气体类型');
    resetSelect(fuelElements.emissionScenario, '请选择排放场景');
    resetSelect(fuelElements.fuelType, '请选择燃料类型');
    
    fuelSelectionState.gasType = null;
    fuelSelectionState.scenarioId = null;
    fuelSelectionState.fuelType = null;
    
    // 隐藏后续表单项
    fuelElements.gasTypeGroup.style.display = 'none';
    fuelElements.emissionScenarioGroup.style.display = 'none';
    fuelElements.fuelTypeGroup.style.display = 'none';
    fuelElements.fuelConsumptionGroup.style.display = 'none';
    fuelElements.heatingValueGroup.style.display = 'none';
    fuelElements.calculateFuelSection.style.display = 'none';
    
    if (value) {
        // 显示气体类型选项
        fuelElements.gasTypeGroup.style.display = 'block';
        const gasTypes = dataLoader.getGasTypes(value);
        populateSelect(fuelElements.gasType, gasTypes, '请选择气体类型');
    }
    
    hideResult();
}

/**
 * 处理气体类型变化
 */
function handleGasTypeChange() {
    const value = fuelElements.gasType.value;
    fuelSelectionState.gasType = value;
    
    // 重置下级选项
    resetSelect(fuelElements.emissionScenario, '请选择排放场景');
    resetSelect(fuelElements.fuelType, '请选择燃料类型');
    
    fuelSelectionState.scenarioId = null;
    fuelSelectionState.fuelType = null;
    
    fuelElements.emissionScenarioGroup.style.display = 'none';
    fuelElements.fuelTypeGroup.style.display = 'none';
    fuelElements.fuelConsumptionGroup.style.display = 'none';
    fuelElements.heatingValueGroup.style.display = 'none';
    fuelElements.calculateFuelSection.style.display = 'none';
    
    if (value && fuelSelectionState.fuelCategory) {
        // 显示排放场景选项
        fuelElements.emissionScenarioGroup.style.display = 'block';
        const scenarios = dataLoader.getEmissionScenarios(fuelSelectionState.fuelCategory, value);
        populateScenarioSelect(fuelElements.emissionScenario, scenarios);
    }
    
    hideResult();
}

/**
 * 处理排放场景变化
 */
function handleScenarioChange() {
    const value = fuelElements.emissionScenario.value;
    fuelSelectionState.scenarioId = value;
    
    // 重置下级选项
    resetSelect(fuelElements.fuelType, '请选择燃料类型');
    fuelSelectionState.fuelType = null;
    
    fuelElements.fuelTypeGroup.style.display = 'none';
    fuelElements.fuelConsumptionGroup.style.display = 'none';
    fuelElements.heatingValueGroup.style.display = 'none';
    fuelElements.calculateFuelSection.style.display = 'none';
    
    if (value) {
        // 显示燃料类型选项
        fuelElements.fuelTypeGroup.style.display = 'block';
        const fuelTypes = dataLoader.getFuelTypes(value);
        populateFuelTypeSelect(fuelElements.fuelType, fuelTypes);
    }
    
    hideResult();
}

/**
 * 处理燃料类型变化
 */
function handleFuelTypeChange() {
    const value = fuelElements.fuelType.value;
    fuelSelectionState.fuelType = value;
    
    fuelElements.fuelConsumptionGroup.style.display = 'none';
    fuelElements.heatingValueGroup.style.display = 'none';
    fuelElements.calculateFuelSection.style.display = 'none';
    
    if (value) {
        // 显示消耗量输入
        fuelElements.fuelConsumptionGroup.style.display = 'block';
        fuelElements.heatingValueGroup.style.display = 'block';
        fuelElements.calculateFuelSection.style.display = 'block';
        
        // 更新低位发热量提示
        const factorInfo = dataLoader.getEmissionFactor(fuelSelectionState.scenarioId, value);
        if (factorInfo && factorInfo.lowerHeatingValue) {
            fuelElements.lowerHeatingValue.placeholder = `默认值: ${factorInfo.lowerHeatingValue} ${factorInfo.heatingValueUnit || ''}`;
        } else {
            fuelElements.lowerHeatingValue.placeholder = '默认使用标准值';
        }
    }
    
    hideResult();
}

/**
 * 处理电网类型变化
 */
function handleGridTypeChange() {
    const value = electricityElements.gridType.value;
    electricitySelectionState.gridType = value;
    hideResult();
}

/**
 * 处理燃料计算
 */
function handleFuelCalculate() {
    // 验证输入
    if (!validateFuelInput()) {
        return;
    }
    
    // 获取输入值
    const consumption = parseFloat(fuelElements.fuelConsumption.value);
    const customHeatingValue = fuelElements.lowerHeatingValue.value 
        ? parseFloat(fuelElements.lowerHeatingValue.value) 
        : null;
    
    // 执行计算
    try {
        fuelElements.calculateFuelBtn.disabled = true;
        fuelElements.calculateFuelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 计算中...';
        
        const result = carbonCalculator.calculate({
            scenarioId: fuelSelectionState.scenarioId,
            fuelType: fuelSelectionState.fuelType,
            consumption: consumption,
            customHeatingValue: customHeatingValue,
            fuelCategory: fuelSelectionState.fuelCategory
        });
        
        // 显示结果
        displayResult(result.data, 'fuel');
        
    } catch (error) {
        showError(error.message || '计算失败，请检查输入');
    } finally {
        fuelElements.calculateFuelBtn.disabled = false;
        fuelElements.calculateFuelBtn.innerHTML = '<i class="fas fa-calculator"></i> 计算碳排放';
    }
}

/**
 * 处理电力计算
 */
function handleElectricityCalculate() {
    // 验证输入
    if (!validateElectricityInput()) {
        return;
    }
    
    // 获取输入值
    const consumption = parseFloat(electricityElements.electricityConsumption.value);
    
    // 执行计算
    try {
        electricityElements.calculateElectricityBtn.disabled = true;
        electricityElements.calculateElectricityBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 计算中...';
        
        const result = carbonCalculator.calculateElectricity({
            gridType: electricitySelectionState.gridType,
            consumption: consumption
        });
        
        // 显示结果
        displayResult(result.data, 'electricity');
        
    } catch (error) {
        showError(error.message || '计算失败，请检查输入');
    } finally {
        electricityElements.calculateElectricityBtn.disabled = false;
        electricityElements.calculateElectricityBtn.innerHTML = '<i class="fas fa-calculator"></i> 计算碳排放';
    }
}

/**
 * 验证燃料输入
 */
function validateFuelInput() {
    if (!fuelSelectionState.fuelCategory) {
        showError('请选择燃料类别');
        fuelElements.fuelCategory.focus();
        return false;
    }
    
    if (!fuelSelectionState.gasType) {
        showError('请选择气体类型');
        fuelElements.gasType.focus();
        return false;
    }
    
    if (!fuelSelectionState.scenarioId) {
        showError('请选择排放场景');
        fuelElements.emissionScenario.focus();
        return false;
    }
    
    if (!fuelSelectionState.fuelType) {
        showError('请选择燃料类型');
        fuelElements.fuelType.focus();
        return false;
    }
    
    const consumption = fuelElements.fuelConsumption.value.trim();
    if (!consumption) {
        showError('请输入燃料消耗量');
        fuelElements.fuelConsumption.focus();
        return false;
    }
    
    if (parseFloat(consumption) <= 0) {
        showError('燃料消耗量必须大于0');
        fuelElements.fuelConsumption.focus();
        return false;
    }
    
    const heatingValue = fuelElements.lowerHeatingValue.value.trim();
    if (heatingValue && parseFloat(heatingValue) <= 0) {
        showError('低位发热量必须大于0');
        fuelElements.lowerHeatingValue.focus();
        return false;
    }
    
    clearError();
    return true;
}

/**
 * 验证电力输入
 */
function validateElectricityInput() {
    if (!electricitySelectionState.gridType) {
        showError('请选择电网类型');
        electricityElements.gridType.focus();
        return false;
    }
    
    const consumption = electricityElements.electricityConsumption.value.trim();
    if (!consumption) {
        showError('请输入用电量');
        electricityElements.electricityConsumption.focus();
        return false;
    }
    
    if (parseFloat(consumption) <= 0) {
        showError('用电量必须大于0');
        electricityElements.electricityConsumption.focus();
        return false;
    }
    
    clearError();
    return true;
}

/**
 * 显示计算结果
 */
function displayResult(data, module) {
    // 保存当前计算结果用于导出
    currentCalculationResult = {
        ...data,
        module: module,
        timestamp: new Date().toISOString(),
        selectionState: module === 'fuel' ? { ...fuelSelectionState } : { ...electricitySelectionState }
    };
    
    // 显示结果区域
    resultElements.resultSection.classList.add('active');
    
    // 显示CO2当量
    resultElements.treeEquivalent.textContent = formatNumber(data.co2Equivalent);
    
    // 根据模块类型显示结果
    hideAllEmissionResults();
    
    if (module === 'electricity') {
        // 电力只显示CO2
        resultElements.co2Result.style.display = 'block';
        resultElements.co2Emission.textContent = `${data.emission}`;
        resultElements.gwpInfo.style.display = 'none';
    } else {
        // 燃料根据气体类型显示
        if (data.gasType === 'CO2') {
            resultElements.co2Result.style.display = 'block';
            resultElements.co2Emission.textContent = `${data.emission}`;
        } else if (data.gasType === 'CH4') {
            resultElements.ch4Result.style.display = 'block';
            resultElements.ch4Emission.textContent = `${data.emission}`;
        } else if (data.gasType === 'N2O') {
            resultElements.n2oResult.style.display = 'block';
            resultElements.n2oEmission.textContent = `${data.emission}`;
        }
        resultElements.gwpInfo.style.display = 'block';
    }
    
    // 显示计算参数
    resultElements.factorUsed.textContent = data.factor;
    resultElements.factorUnit.textContent = data.factorUnit;
    resultElements.heatingValueUsed.textContent = typeof data.heatingValue === 'number' 
        ? formatNumber(data.heatingValue) 
        : (data.heatingValue || '-');
    resultElements.consumptionUsed.textContent = `${formatNumber(data.consumption)} ${data.consumptionUnit || (module === 'electricity' ? 'kWh' : 'kg')}`;
    
    // 更新可视化
    updateVisualization(data.co2Equivalent);
    
    // 滚动到结果区域
    resultElements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 更新可视化
 */
function updateVisualization(co2Equivalent) {
    // 计算树的数量
    const trees = Math.ceil(co2Equivalent * 1000 / 22); // 转换为kg，每棵树22kg/年
    
    // 限制显示数量（最多显示50棵树图标）
    const displayTrees = Math.min(trees, 50);
    
    // 清空现有内容
    resultElements.visualizationBar.innerHTML = '';
    
    // 生成树图标
    for (let i = 0; i < displayTrees; i++) {
        const treeIcon = document.createElement('span');
        treeIcon.className = 'tree-icon text-primary text-lg';
        treeIcon.innerHTML = '<span class="material-symbols-outlined" style="font-size: 24px;">park</span>';
        resultElements.visualizationBar.appendChild(treeIcon);
    }
    
    // 如果树的数量超过50，显示省略提示
    if (trees > 50) {
        const moreText = document.createElement('span');
        moreText.className = 'text-sage text-sm font-medium ml-2';
        moreText.textContent = `+${trees - 50} 棵`;
        resultElements.visualizationBar.appendChild(moreText);
    }
}

/**
 * 隐藏所有排放结果
 */
function hideAllEmissionResults() {
    resultElements.co2Result.style.display = 'none';
    resultElements.ch4Result.style.display = 'none';
    resultElements.n2oResult.style.display = 'none';
}

/**
 * 隐藏结果区域
 */
function hideResult() {
    resultElements.resultSection.classList.remove('active');
}

/**
 * 填充下拉选择框
 */
function populateSelect(selectElement, options, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value || option.id || option;
        optionElement.textContent = option.name || option.label || option;
        selectElement.appendChild(optionElement);
    });
}

/**
 * 填充场景选择框
 */
function populateScenarioSelect(selectElement, scenarios) {
    selectElement.innerHTML = '<option value="">请选择排放场景</option>';
    scenarios.forEach(scenario => {
        const optionElement = document.createElement('option');
        optionElement.value = scenario.id;
        optionElement.textContent = scenario.name;
        if (scenario.sector) {
            optionElement.textContent += ` - ${scenario.sector}`;
        }
        selectElement.appendChild(optionElement);
    });
}

/**
 * 填充燃料类型选择框
 */
function populateFuelTypeSelect(selectElement, fuelTypes) {
    selectElement.innerHTML = '<option value="">请选择燃料类型</option>';
    fuelTypes.forEach(fuel => {
        const optionElement = document.createElement('option');
        optionElement.value = fuel.fuelType;
        optionElement.textContent = fuel.fuelType;
        if (fuel.lowerHeatingValue) {
            optionElement.textContent += ` (默认低位发热量: ${fuel.lowerHeatingValue})`;
        }
        selectElement.appendChild(optionElement);
    });
}

/**
 * 重置下拉选择框
 */
function resetSelect(selectElement, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
}

/**
 * 格式化数字
 */
function formatNumber(num) {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    });
}

/**
 * 显示加载状态
 */
function showLoading(show) {
    // 可以添加加载动画
}

/**
 * 显示错误信息
 */
function showError(message) {
    // 移除现有错误提示
    clearError();
    
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorDiv.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(220, 53, 69, 0.95);
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-size: 14px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(clearError, 3000);
}

/**
 * 清除错误信息
 */
function clearError() {
    const errorDiv = document.querySelector('.error-toast');
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * 导出到报告
 */
function handleExportToReport() {
    if (!currentCalculationResult) {
        showError('没有可导出的计算结果');
        return;
    }
    
    // 保存到localStorage
    const exportData = {
        ...currentCalculationResult,
        exportTime: new Date().toISOString()
    };
    
    localStorage.setItem('carbonCalculationResult', JSON.stringify(exportData));
    
    // 跳转到报告页面
    window.location.href = 'report.html';
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);