/**
 * 报告生成工具主程序
 * 协调各模块完成报告生成流程
 */
(function() {
    'use strict';

    // 全局状态
    let currentIndustry = null;
    let currentStep = 'industry';
    let formGenerator = null;
    let dataManager = null;
    let templateParser = null;
    let reportGenerator = null;

    // DOM元素
    const elements = {
        // 步骤容器
        stepIndustry: document.getElementById('step-industry'),
        stepForm: document.getElementById('step-form'),
        stepPreview: document.getElementById('step-preview'),
        
        // 表单相关
        reportForm: document.getElementById('report-form'),
        industryTitle: document.getElementById('industry-title'),
        formProgress: document.getElementById('form-progress'),
        progressText: document.getElementById('progress-text'),
        
        // 预览相关
        previewContent: document.getElementById('preview-content'),
        filledCount: document.getElementById('filled-count'),
        requiredProgress: document.getElementById('required-progress'),
        
        // 按钮
        btnBack: document.getElementById('btn-back'),
        btnSaveDraft: document.getElementById('btn-save-draft'),
        btnNext: document.getElementById('btn-next'),
        btnBackForm: document.getElementById('btn-back-form'),
        btnGenerate: document.getElementById('btn-generate'),
        
        // 其他
        loadingOverlay: document.getElementById('loading-overlay'),
        toast: document.getElementById('toast')
    };

    /**
     * 初始化
     */
    function init() {
        // 初始化各模块
        dataManager = new DataManager();
        templateParser = new TemplateParser();
        formGenerator = new FormGenerator('report-form');
        reportGenerator = new ReportGenerator();

        // 绑定事件
        bindEvents();

        // 检查是否有草稿
        checkDraft();

        // 显示行业选择步骤
        showStep('industry');
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
        // 行业卡片点击
        const industryCards = document.querySelectorAll('.industry-card');
        industryCards.forEach(card => {
            card.addEventListener('click', () => {
                const industry = card.dataset.industry;
                selectIndustry(industry);
            });
        });

        // 按钮事件
        elements.btnBack.addEventListener('click', () => showStep('industry'));
        elements.btnSaveDraft.addEventListener('click', saveDraft);
        elements.btnNext.addEventListener('click', () => showStep('preview'));
        elements.btnBackForm.addEventListener('click', () => showStep('form'));
        elements.btnGenerate.addEventListener('click', generateReport);
    }

    /**
     * 选择行业
     * @param {string} industryId - 行业ID
     */
    function selectIndustry(industryId) {
        currentIndustry = industryId;
        
        // 获取行业信息
        const industryInfo = templateParser.getIndustryInfo(industryId);
        if (industryInfo) {
            elements.industryTitle.textContent = `${industryInfo.name} - 填写报告信息`;
        }

        // 生成表单
        generateForm(industryId);

        // 显示表单步骤
        showStep('form');
    }

    /**
     * 生成表单
     * @param {string} industryId - 行业ID
     */
    function generateForm(industryId) {
        // 获取行业变量定义
        const variableGroups = getIndustryVariables(industryId);

        // 检查是否有已保存的数据
        const savedData = dataManager.getData();
        const existingValues = (savedData && savedData.industry === industryId) 
            ? savedData.values 
            : {};

        // 生成表单
        formGenerator.generate(variableGroups, existingValues);

        // 更新进度
        updateProgress();
    }

    /**
     * 获取行业变量定义
     * @param {string} industryId - 行业ID
     * @returns {Array} 变量分组
     */
    function getIndustryVariables(industryId) {
        // 发电行业完整变量定义
        const powerVariables = [
            // 企业基本信息
            { name: '企业全称', label: '企业全称', type: 'text', required: true },
            { name: '信用代码', label: '统一社会信用代码', type: 'text', required: true },
            { name: '法人', label: '法定代表人', type: 'text', required: true },
            { name: '注册地址', label: '注册地址', type: 'text', required: true },
            { name: '生产地址', label: '生产地址', type: 'text', required: false },
            { name: '联系人', label: '联系人', type: 'text', required: true },
            { name: '电话', label: '联系电话', type: 'text', required: true },
            { name: '邮箱', label: '电子邮箱', type: 'text', required: false },
            
            // 核算边界
            { name: '核算年度', label: '核算年度', type: 'text', required: true },
            { name: '细分品类', label: '细分品类', type: 'select', required: true, 
              options: ['火力发电', '水力发电', '光伏发电', '风力发电'] },
            { name: '核算边界说明', label: '核算边界说明', type: 'textarea', required: false },
            { name: '编制单位', label: '编制单位', type: 'text', required: false },
            { name: '编制日期', label: '编制日期', type: 'date', required: false },
            
            // 生产信息
            { name: '装机容量', label: '装机容量(MW)', type: 'number', required: false, unit: 'MW' },
            { name: '机组数量', label: '机组数量(台)', type: 'number', required: false, unit: '台' },
            { name: '发电量', label: '发电量(亿kWh)', type: 'number', required: false, unit: '亿kWh' },
            { name: '蒸汽量', label: '蒸汽量(GJ)', type: 'number', required: false, unit: 'GJ' },
            
            // 燃料消耗
            { name: '煤炭消耗量', label: '煤炭消耗量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '低位发热量', label: '煤炭低位发热量(GJ/吨)', type: 'number', required: false, unit: 'GJ/吨' },
            { name: '天然气消耗量', label: '天然气消耗量(万Nm³)', type: 'number', required: false, unit: '万Nm³' },
            { name: '柴油消耗量', label: '柴油消耗量(吨)', type: 'number', required: false, unit: '吨' },
            
            // 脱硫过程
            { name: '石灰石用量', label: '石灰石用量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '白云石用量', label: '白云石用量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '碳酸盐含量', label: '碳酸盐含量(%)', type: 'number', required: false, unit: '%' },
            
            // 外购能源
            { name: '外购电力用量', label: '外购电力用量(万kWh)', type: 'number', required: false, unit: '万kWh' },
            { name: '外购热力用量', label: '外购热力用量(GJ)', type: 'number', required: false, unit: 'GJ' },
            
            // 排放因子
            { name: '燃煤排放因子', label: '燃煤排放因子(tCO₂/TJ)', type: 'number', required: false, unit: 'tCO₂/TJ' },
            { name: '石灰石排放因子', label: '石灰石排放因子', type: 'number', required: false },
            { name: '电网排放因子', label: '电网排放因子(tCO₂/万kWh)', type: 'number', required: false, unit: 'tCO₂/万kWh' },
            
            // 排放结果
            { name: '范围1总量', label: '范围1排放总量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '范围1占比', label: '范围1占比(%)', type: 'number', required: false, unit: '%' },
            { name: '范围2总量', label: '范围2排放总量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '范围2占比', label: '范围2占比(%)', type: 'number', required: false, unit: '%' },
            { name: '燃烧排放量', label: '燃料燃烧排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '脱硫排放量', label: '脱硫过程排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '电力排放量', label: '外购电力排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '热力排放量', label: '外购热力排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '总排放量', label: '总排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            
            // 设施信息
            { name: '机组编号', label: '机组编号', type: 'text', required: false },
            { name: '机组名称', label: '机组名称', type: 'text', required: false },
            { name: '型号', label: '设备型号', type: 'text', required: false },
            { name: '运行小时数', label: '运行小时数', type: 'number', required: false, unit: '小时' }
        ];

        // 钢铁行业变量定义
        const steelVariables = [
            // 企业基本信息
            { name: '企业全称', label: '企业全称', type: 'text', required: true },
            { name: '信用代码', label: '统一社会信用代码', type: 'text', required: true },
            { name: '法人', label: '法定代表人', type: 'text', required: true },
            { name: '注册地址', label: '注册地址', type: 'text', required: true },
            { name: '生产地址', label: '生产地址', type: 'text', required: false },
            { name: '联系人', label: '联系人', type: 'text', required: true },
            { name: '电话', label: '联系电话', type: 'text', required: true },
            { name: '邮箱', label: '电子邮箱', type: 'text', required: false },
            
            // 核算边界
            { name: '核算年度', label: '核算年度', type: 'text', required: true },
            { name: '细分品类', label: '细分品类', type: 'select', required: true,
              options: ['炼铁', '炼钢', '轧钢', '完整钢铁生产'] },
            { name: '核算边界说明', label: '核算边界说明', type: 'textarea', required: false },
            
            // 生产信息
            { name: '产能', label: '粗钢年产能(万吨)', type: 'number', required: false, unit: '万吨' },
            { name: '生铁产量', label: '生铁产量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '粗钢产量', label: '粗钢产量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '钢材产量', label: '钢材产量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '高炉数量', label: '高炉数量(座)', type: 'number', required: false, unit: '座' },
            { name: '转炉数量', label: '转炉数量(座)', type: 'number', required: false, unit: '座' },
            
            // 燃料消耗
            { name: '煤炭消耗量', label: '煤炭消耗量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '焦炭消耗量', label: '焦炭消耗量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '天然气消耗量', label: '天然气消耗量(万Nm³)', type: 'number', required: false, unit: '万Nm³' },
            
            // 排放结果
            { name: '范围1总量', label: '范围1排放总量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '范围2总量', label: '范围2排放总量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '燃烧排放量', label: '燃料燃烧排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '过程排放量', label: '工业过程排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '固碳排放量', label: '固碳产品扣除量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '总排放量', label: '总排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' }
        ];

        // 水泥行业变量定义
        const cementVariables = [
            // 企业基本信息
            { name: '企业全称', label: '企业全称', type: 'text', required: true },
            { name: '信用代码', label: '统一社会信用代码', type: 'text', required: true },
            { name: '法人', label: '法定代表人', type: 'text', required: true },
            { name: '注册地址', label: '注册地址', type: 'text', required: true },
            { name: '生产地址', label: '生产地址', type: 'text', required: false },
            { name: '联系人', label: '联系人', type: 'text', required: true },
            { name: '电话', label: '联系电话', type: 'text', required: true },
            { name: '邮箱', label: '电子邮箱', type: 'text', required: false },
            
            // 核算边界
            { name: '核算年度', label: '核算年度', type: 'text', required: true },
            { name: '细分品类', label: '细分品类', type: 'select', required: true,
              options: ['熟料生产', '水泥生产', '完整水泥生产'] },
            { name: '核算边界说明', label: '核算边界说明', type: 'textarea', required: false },
            
            // 生产信息
            { name: '熟料产能', label: '熟料年产能(万吨)', type: 'number', required: false, unit: '万吨' },
            { name: '水泥产能', label: '水泥年产能(万吨)', type: 'number', required: false, unit: '万吨' },
            { name: '熟料产量', label: '熟料产量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '水泥产量', label: '水泥产量(吨)', type: 'number', required: false, unit: '吨' },
            { name: '回转窑数量', label: '回转窑数量(座)', type: 'number', required: false, unit: '座' },
            { name: '水泥磨数量', label: '水泥磨数量(台)', type: 'number', required: false, unit: '台' },
            
            // 原料成分
            { name: 'CaO含量', label: '熟料CaO含量(%)', type: 'number', required: false, unit: '%' },
            { name: 'MgO含量', label: '熟料MgO含量(%)', type: 'number', required: false, unit: '%' },
            { name: 'CaCO3含量', label: '石灰石CaCO₃含量(%)', type: 'number', required: false, unit: '%' },
            
            // 排放结果
            { name: '范围1总量', label: '范围1排放总量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '范围2总量', label: '范围2排放总量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '燃烧排放量', label: '燃料燃烧排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '过程排放量', label: '熟料过程排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '总排放量', label: '总排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' }
        ];

        // 化工行业变量定义
        const chemicalVariables = [
            // 企业基本信息
            { name: '企业全称', label: '企业全称', type: 'text', required: true },
            { name: '信用代码', label: '统一社会信用代码', type: 'text', required: true },
            { name: '法人', label: '法定代表人', type: 'text', required: true },
            { name: '注册地址', label: '注册地址', type: 'text', required: true },
            { name: '生产地址', label: '生产地址', type: 'text', required: false },
            { name: '联系人', label: '联系人', type: 'text', required: true },
            { name: '电话', label: '联系电话', type: 'text', required: true },
            { name: '邮箱', label: '电子邮箱', type: 'text', required: false },
            
            // 核算边界
            { name: '核算年度', label: '核算年度', type: 'text', required: true },
            { name: '细分品类', label: '细分品类', type: 'select', required: true,
              options: ['石油化工', '煤化工', '精细化工', '无机化工'] },
            { name: '核算边界说明', label: '核算边界说明', type: 'textarea', required: false },
            
            // 排放结果
            { name: '范围1总量', label: '范围1排放总量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '范围2总量', label: '范围2排放总量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' },
            { name: '总排放量', label: '总排放量(tCO₂e)', type: 'number', required: false, unit: 'tCO₂e' }
        ];

        // 根据行业返回变量定义
        const industryVariables = {
            power: powerVariables,
            steel: steelVariables,
            cement: cementVariables,
            chemical: chemicalVariables
        };

        const variables = industryVariables[industryId] || powerVariables;

        // 分组
        return groupVariables(variables);
    }

    /**
     * 变量分组
     * @param {Array} variables - 变量列表
     * @returns {Array} 分组后的变量
     */
    function groupVariables(variables) {
        const groups = {
            basic: {
                id: 'basic',
                name: '企业基本信息',
                icon: 'fa-building',
                variables: []
            },
            boundary: {
                id: 'boundary',
                name: '核算边界',
                icon: 'fa-map-marker-alt',
                variables: []
            },
            production: {
                id: 'production',
                name: '生产信息',
                icon: 'fa-industry',
                variables: []
            },
            activity: {
                id: 'activity',
                name: '活动数据',
                icon: 'fa-chart-bar',
                variables: []
            },
            factor: {
                id: 'factor',
                name: '排放因子',
                icon: 'fa-calculator',
                variables: []
            },
            result: {
                id: 'result',
                name: '排放结果',
                icon: 'fa-leaf',
                variables: []
            },
            facility: {
                id: 'facility',
                name: '设施信息',
                icon: 'fa-cogs',
                variables: []
            }
        };

        const groupRules = {
            basic: ['企业', '信用代码', '法人', '地址', '联系', '电话', '邮箱'],
            boundary: ['核算年度', '核算边界', '细分品类', '编制'],
            production: ['产能', '产量', '数量', '高炉', '转炉', '回转窑', '水泥磨'],
            activity: ['消耗量', '用量', '低位发热量', '含量', 'CaO', 'MgO', 'CaCO'],
            factor: ['因子'],
            result: ['排放量', '总量', '占比', '总排放'],
            facility: ['机组', '型号', '运行小时']
        };

        variables.forEach(varDef => {
            let assigned = false;
            const varName = varDef.name;

            for (const [groupId, keywords] of Object.entries(groupRules)) {
                if (keywords.some(keyword => varName.includes(keyword))) {
                    groups[groupId].variables.push(varDef);
                    assigned = true;
                    break;
                }
            }

            if (!assigned) {
                groups.basic.variables.push(varDef);
            }
        });

        // 返回非空分组
        return Object.values(groups).filter(group => group.variables.length > 0);
    }

    /**
     * 显示步骤
     * @param {string} step - 步骤名称
     */
    function showStep(step) {
        currentStep = step;

        // 隐藏所有步骤
        elements.stepIndustry.classList.remove('active');
        elements.stepForm.classList.remove('active');
        elements.stepPreview.classList.remove('active');

        // 显示当前步骤
        switch (step) {
            case 'industry':
                elements.stepIndustry.classList.add('active');
                break;
            case 'form':
                elements.stepForm.classList.add('active');
                updateProgress();
                break;
            case 'preview':
                elements.stepPreview.classList.add('active');
                updatePreview();
                break;
        }
    }

    /**
     * 更新进度
     */
    function updateProgress() {
        const formData = formGenerator.getFormData();
        const variableGroups = getIndustryVariables(currentIndustry);
        const progress = dataManager.getProgress(formData, variableGroups);

        elements.formProgress.style.width = `${progress.percentage}%`;
        elements.progressText.textContent = `${progress.percentage}%`;
    }

    /**
     * 更新预览
     */
    function updatePreview() {
        const formData = formGenerator.getFormData();
        const variableGroups = getIndustryVariables(currentIndustry);
        const progress = dataManager.getProgress(formData, variableGroups);

        // 更新统计信息
        elements.filledCount.textContent = `${progress.filled}/${progress.total}`;
        elements.requiredProgress.textContent = `${progress.requiredPercentage}%`;

        // 生成预览内容
        const industryInfo = templateParser.getIndustryInfo(currentIndustry);
        let previewHtml = `
            <div class="preview-header">
                <h3>${formData['核算年度'] || ''}年度温室气体排放核算报告</h3>
                <p class="preview-subtitle">${industryInfo ? industryInfo.name : ''}</p>
            </div>
            <div class="preview-section">
                <h4>企业基本信息</h4>
                <div class="preview-grid">
                    <div class="preview-item">
                        <span class="label">企业名称：</span>
                        <span class="value">${formData['企业全称'] || formData['企业名称'] || '-'}</span>
                    </div>
                    <div class="preview-item">
                        <span class="label">统一社会信用代码：</span>
                        <span class="value">${formData['信用代码'] || '-'}</span>
                    </div>
                    <div class="preview-item">
                        <span class="label">法定代表人：</span>
                        <span class="value">${formData['法人'] || '-'}</span>
                    </div>
                    <div class="preview-item">
                        <span class="label">注册地址：</span>
                        <span class="value">${formData['注册地址'] || '-'}</span>
                    </div>
                </div>
            </div>
            <div class="preview-section">
                <h4>核算信息</h4>
                <div class="preview-grid">
                    <div class="preview-item">
                        <span class="label">核算年度：</span>
                        <span class="value">${formData['核算年度'] || '-'}</span>
                    </div>
                    <div class="preview-item">
                        <span class="label">细分品类：</span>
                        <span class="value">${formData['细分品类'] || '-'}</span>
                    </div>
                </div>
            </div>
        `;

        // 如果有排放数据，显示汇总
        if (formData['总排放量']) {
            previewHtml += `
                <div class="preview-section">
                    <h4>排放量汇总</h4>
                    <div class="preview-grid">
                        <div class="preview-item">
                            <span class="label">范围1排放：</span>
                            <span class="value">${formData['范围1总量'] || '-'} tCO₂e</span>
                        </div>
                        <div class="preview-item">
                            <span class="label">范围2排放：</span>
                            <span class="value">${formData['范围2总量'] || '-'} tCO₂e</span>
                        </div>
                        <div class="preview-item highlight">
                            <span class="label">总排放量：</span>
                            <span class="value">${formData['总排放量'] || '-'} tCO₂e</span>
                        </div>
                    </div>
                </div>
            `;
        }

        elements.previewContent.innerHTML = previewHtml;
    }

    /**
     * 保存草稿
     */
    function saveDraft() {
        const formData = formGenerator.getFormData();
        const success = dataManager.saveDraft(currentIndustry, formData);
        
        if (success) {
            showToast('草稿保存成功', 'success');
        } else {
            showToast('草稿保存失败', 'error');
        }
    }

    /**
     * 检查草稿
     */
    function checkDraft() {
        const draft = dataManager.loadDraft();
        if (draft) {
            // 可以提示用户是否加载草稿
            console.log('发现草稿:', draft);
        }
    }

    /**
     * 生成报告
     */
    async function generateReport() {
        // 不再进行表单验证，允许用户填写任意内容或留空
        // 显示加载状态
        elements.loadingOverlay.style.display = 'flex';

        try {
            // 检查依赖库
            console.log('检查依赖库...');
            if (typeof docx === 'undefined') {
                throw new Error('docx库未加载，请刷新页面重试');
            }
            if (typeof saveAs === 'undefined') {
                throw new Error('FileSaver库未加载，请刷新页面重试');
            }
            console.log('依赖库检查通过');
            
            const formData = formGenerator.getFormData();
            console.log('表单数据已获取:', formData);
            
            // 生成报告
            console.log('开始生成报告...');
            const blob = await reportGenerator.generate(currentIndustry, formData);
            console.log('报告已生成:', blob);
            
            // 下载报告
            const industryInfo = templateParser.getIndustryInfo(currentIndustry);
            const year = formData['核算年度'] || new Date().getFullYear();
            const filename = `${year}年度${industryInfo ? industryInfo.name : ''}温室气体排放核算报告.docx`;
            console.log('文件名:', filename);
            
            reportGenerator.downloadReport(blob, filename);
            
            showToast('报告生成成功！', 'success');
            
            // 清除草稿
            dataManager.clearDraft();
            
        } catch (error) {
            console.error('生成报告失败:', error);
            const errorMsg = error && error.message ? error.message : String(error);
            showToast(`报告生成失败: ${errorMsg}`, 'error');
        } finally {
            elements.loadingOverlay.style.display = 'none';
        }
    }

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, warning)
     */
    function showToast(message, type = 'info') {
        elements.toast.textContent = message;
        elements.toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', init);

})();