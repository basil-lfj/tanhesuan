/**
 * 表单生成器
 * 根据变量定义动态生成填写表单
 */
class FormGenerator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.formValues = {};
    }

    /**
     * 生成表单
     * @param {Array} variableGroups - 变量分组列表
     * @param {Object} existingValues - 已有值（用于回填）
     */
    generate(variableGroups, existingValues = {}) {
        this.formValues = {...existingValues};
        const html = this.buildFormHtml(variableGroups);
        this.container.innerHTML = html;
        this.bindEvents();
        this.fillExistingValues();
    }

    /**
     * 构建表单HTML
     * @param {Array} variableGroups - 变量分组
     * @returns {string} HTML字符串
     */
    buildFormHtml(variableGroups) {
        let html = '';

        variableGroups.forEach((group, index) => {
            // 图标映射
            const iconMap = {
                '基本信息': 'corporate_fare',
                '企业基本信息': 'corporate_fare',
                '主体信息': 'corporate_fare',
                '核算信息': 'calendar_today',
                '核算边界': 'calendar_today',
                '排放源信息': 'bolt',
                '排放数据': 'analytics',
                '能耗数据': 'electric_bolt',
                '设备信息': 'precision_manufacturing',
                '设施信息': 'domain',
                '生产数据': 'factory',
                '生产信息': 'factory',
                '原料成分': 'science',
                '燃料消耗': 'local_fire_department',
                '排放结果': 'analytics',
                '排放因子': 'functions',
                '外购能源': 'electric_bolt',
                '默认': 'folder'
            };
            
            const iconName = iconMap[group.name] || iconMap['默认'];
            const delayClass = `animate-delay-${Math.min(index + 1, 4)}`;

            html += `
                <div class="form-section-exact mb-10 animate-slide-up ${delayClass}" data-section="${group.id}">
                    <div class="flex items-center gap-2 mb-6 border-b border-sage-100 pb-4 cursor-pointer section-header group">
                        <span class="material-symbols-outlined text-primary text-xl">${iconName}</span>
                        <h3 class="text-lg font-bold text-sage-900">${group.name}</h3>
                        <span class="ml-auto text-xs text-sage-400 bg-sage-50 px-2 py-1 rounded-full">${group.variables.length} 项</span>
                        <span class="material-symbols-outlined text-sage-300 group-hover:text-primary transition-all duration-300 toggle-icon ml-2">expand_more</span>
                    </div>
                    <div class="section-content overflow-hidden transition-all duration-500 ease-out">
                        <div class="space-y-4">
                            ${this.buildFieldsHtml(group.variables)}
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    /**
     * 构建字段HTML
     * @param {Array} variables - 变量列表
     * @returns {string} HTML字符串
     */
    buildFieldsHtml(variables) {
        let html = '';

        variables.forEach(varDef => {
            // 根据变量名判断字段类型
            const fieldDef = this.getFieldDefinition(varDef);
            html += this.createFieldHtml(fieldDef);
        });

        return html;
    }

    /**
     * 获取字段定义
     * @param {Object|string} varDef - 变量定义或变量名
     * @returns {Object} 字段定义对象
     */
    getFieldDefinition(varDef) {
        // 如果是字符串，转换为对象
        if (typeof varDef === 'string') {
            return {
                name: varDef,
                label: varDef,
                type: this.detectFieldType(varDef),
                required: this.isRequired(varDef),
                unit: this.detectUnit(varDef),
                options: this.getSelectOptions(varDef)
            };
        }
        return varDef;
    }

    /**
     * 获取字段图标
     */
    getFieldIcon(varName) {
        const iconMap = {
            '企业': 'apartment',
            '信用代码': 'badge',
            '法人': 'person',
            '注册地址': 'location_on',
            '生产地址': 'factory',
            '联系人': 'contact_mail',
            '电话': 'phone',
            '邮箱': 'mail',
            '核算': 'calendar_today',
            '细分': 'category',
            '产能': 'speed',
            '产量': 'inventory_2',
            '消耗': 'local_fire_department',
            '用量': 'science',
            '排放': 'cloud',
            '因子': 'functions',
            '装机': 'bolt',
            '运行': 'schedule',
            '机组': 'precision_manufacturing',
            '高炉': 'local_fire_department',
            '转炉': 'whatshot',
            '回转窑': 'fireplace',
            '煤炭': 'terrain',
            '焦炭': 'landscape',
            '天然气': 'propane_tank',
            '电力': 'electric_bolt',
            '热力': 'thermostat',
            '蒸汽': 'water_drop',
            '熟料': 'foundation',
            '水泥': 'layers',
            '生铁': 'hardware',
            '粗钢': 'build',
            '钢材': 'construction',
            '燃油': 'oil_barrel',
            '柴油': 'local_gas_station',
            '汽油': 'local_gas_station',
            '默认': 'edit_note'
        };
        
        for (const [key, icon] of Object.entries(iconMap)) {
            if (varName.includes(key)) {
                return icon;
            }
        }
        return iconMap['默认'];
    }

    /**
     * 创建单个字段HTML
     * @param {Object} fieldDef - 字段定义
     * @returns {string} HTML字符串
     */
    createFieldHtml(fieldDef) {
        const requiredMark = fieldDef.required ? '<span class="text-red-500 ml-1">*</span>' : '';
        const icon = this.getFieldIcon(fieldDef.name);
        const hasUnit = fieldDef.unit && fieldDef.type === 'number';
        
        // 获取字段描述
        const description = this.getFieldDescription(fieldDef.name);

        let inputHtml = '';

        switch (fieldDef.type) {
            case 'textarea':
                inputHtml = `
                    <textarea id="${fieldDef.name}" name="${fieldDef.name}"
                        class="w-full h-20 bg-white border border-sage-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sage-900 placeholder:text-sage-300 resize-none text-sm" 
                        placeholder="请输入..."
                        ${fieldDef.required ? 'required' : ''}></textarea>
                `;
                break;

            case 'select':
                inputHtml = `
                    <select id="${fieldDef.name}" name="${fieldDef.name}"
                        class="custom-select w-full h-12 bg-white border border-sage-200 rounded-lg px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sage-900 text-sm"
                        ${fieldDef.required ? 'required' : ''}>
                        <option value="">请选择</option>
                        ${(fieldDef.options || []).map(opt => 
                            `<option value="${opt}">${opt}</option>`
                        ).join('')}
                    </select>
                `;
                break;

            case 'number':
                inputHtml = `
                    <div class="flex items-center gap-3">
                        <input type="number" id="${fieldDef.name}" name="${fieldDef.name}"
                            class="w-28 h-12 bg-white border border-sage-200 rounded-lg px-4 text-right focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sage-900 text-sm" 
                            placeholder="0.00"
                            step="any"
                            ${fieldDef.required ? 'required' : ''}>
                        ${hasUnit ? `<span class="text-sage-500 font-medium text-sm">${fieldDef.unit}</span>` : ''}
                    </div>
                `;
                break;

            case 'date':
                inputHtml = `
                    <input type="date" id="${fieldDef.name}" name="${fieldDef.name}"
                        class="w-full h-12 bg-white border border-sage-200 rounded-lg px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sage-900 text-sm"
                        ${fieldDef.required ? 'required' : ''}>
                `;
                break;

            default:
                inputHtml = `
                    <input type="text" id="${fieldDef.name}" name="${fieldDef.name}"
                        class="w-full h-12 bg-white border border-sage-200 rounded-lg px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sage-900 placeholder:text-sage-300 text-sm" 
                        placeholder="请输入..."
                        ${fieldDef.required ? 'required' : ''}>
                `;
        }

        // 横向卡片布局 - 参考 report_exact.html 核心能耗数据样式
        return `
            <div class="data-input-card p-5 bg-glacier-50 rounded-xl border border-glacier-100 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-300 hover:bg-glacier-50/80" data-field="${fieldDef.name}">
                <div class="flex gap-4 items-center">
                    <div class="size-11 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span class="material-symbols-outlined text-primary text-xl">${icon}</span>
                    </div>
                    <div>
                        <p class="font-semibold text-sage-900">${fieldDef.label}${requiredMark}</p>
                        ${description ? `<p class="text-xs text-sage-500 mt-0.5">${description}</p>` : ''}
                    </div>
                </div>
                <div class="md:flex-shrink-0">
                    ${inputHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * 获取字段描述
     * @param {string} fieldName - 字段名称
     * @returns {string} 描述文本
     */
    getFieldDescription(fieldName) {
        const descriptions = {
            '企业': '填写营业执照上的完整企业名称',
            '信用代码': '统一社会信用代码（18位）',
            '法人': '企业法定代表人姓名',
            '注册地址': '企业注册登记地址',
            '生产地址': '实际生产经营场所地址',
            '联系人': '负责填报的人员姓名',
            '电话': '联系人电话号码',
            '邮箱': '接收报告的电子邮箱',
            '核算年度': '碳排放核算的统计年度',
            '细分品类': '选择具体的生产工艺类型',
            '产能': '设计生产能力',
            '产量': '实际生产数量',
            '消耗': '能源或原料使用量',
            '用量': '能源或原料使用量',
            '排放': '温室气体排放量',
            '因子': '排放系数',
            '装机容量': '发电设备额定容量',
            '运行小时数': '设备年运行时间',
            '发电量': '年度总发电量',
            '熟料产量': '水泥熟料生产量',
            '水泥产量': '水泥成品生产量',
            '外购电力': '从电网购入的电量',
            '外购热力': '从外部购入的热力量',
            '天然气': '天然气使用量',
            '煤炭': '煤炭消耗量',
            '燃油': '燃油消耗量',
            '柴油': '柴油消耗量',
            '汽油': '汽油消耗量'
        };
        
        for (const [key, desc] of Object.entries(descriptions)) {
            if (fieldName.includes(key)) {
                return desc;
            }
        }
        return '';
    }

    /**
     * 检测字段类型
     */
    detectFieldType(varName) {
        const name = varName.toLowerCase();

        if (name.includes('日期') || name.includes('年度') || name.includes('年份')) {
            return 'date';
        }

        if (name.includes('量') || name.includes('因子') || name.includes('容量') ||
            name.includes('排放') || name.includes('含量') || name.includes('比例') ||
            name.includes('占比') || name.includes('小时数') || name.includes('产能') ||
            name.includes('产量') || name.includes('用量') || name.includes('消耗')) {
            return 'number';
        }

        if (name.includes('说明') || name.includes('简述') || name.includes('备注')) {
            return 'textarea';
        }

        if (name.includes('细分品类')) {
            return 'select';
        }

        return 'text';
    }

    /**
     * 判断是否必填
     */
    isRequired(varName) {
        const requiredFields = [
            '企业名称', '企业全称', '信用代码', '法人', '核算年度',
            '注册地址', '联系人', '电话', '细分品类'
        ];
        return requiredFields.some(field => varName.includes(field));
    }

    /**
     * 检测单位
     */
    detectUnit(varName) {
        const units = {
            '消耗量': '吨',
            '用量': '吨',
            '排放量': 'tCO₂e',
            '排放因子': 'tCO₂/TJ',
            '低位发热量': 'GJ/单位',
            '装机容量': 'MW',
            '处理能力': 't/h',
            '运行小时数': '小时',
            '发电量': '亿kWh',
            '蒸汽量': 'GJ',
            '外购电力用量': '万kWh',
            '外购热力用量': 'GJ',
            '熟料产量': '吨',
            '水泥产量': '吨',
            '产能': '万吨'
        };

        for (const [key, unit] of Object.entries(units)) {
            if (varName.includes(key)) {
                return unit;
            }
        }

        return null;
    }

    /**
     * 获取选择选项
     */
    getSelectOptions(varName) {
        if (varName.includes('细分品类')) {
            return ['火力发电', '水力发电', '光伏发电', '风力发电'];
        }
        return [];
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 折叠/展开分组
        const sectionHeaders = this.container.querySelectorAll('.section-header');
        sectionHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const section = header.closest('.form-section-exact');
                const content = section.querySelector('.section-content');
                const toggleIcon = header.querySelector('.toggle-icon');
                
                if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                    content.style.maxHeight = '0px';
                    content.style.opacity = '0';
                    toggleIcon.style.transform = 'rotate(0deg)';
                } else {
                    content.style.maxHeight = content.scrollHeight + 500 + 'px';
                    content.style.opacity = '1';
                    toggleIcon.style.transform = 'rotate(180deg)';
                }
            });
            
            // 初始化展开状态
            const section = header.closest('.form-section-exact');
            const content = section.querySelector('.section-content');
            const toggleIcon = header.querySelector('.toggle-icon');
            content.style.maxHeight = content.scrollHeight + 500 + 'px';
            content.style.opacity = '1';
            toggleIcon.style.transform = 'rotate(180deg)';
        });

        // 输入变化事件
        const inputs = this.container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.formValues[e.target.name] = e.target.value;
            });

            input.addEventListener('input', (e) => {
                this.formValues[e.target.name] = e.target.value;
            });
        });
    }

    /**
     * 填充已有值
     */
    fillExistingValues() {
        Object.keys(this.formValues).forEach(name => {
            const element = this.container.querySelector(`[name="${name}"]`);
            if (element && this.formValues[name]) {
                element.value = this.formValues[name];
            }
        });
    }

    /**
     * 获取表单数据
     * @returns {Object} 表单数据
     */
    getFormData() {
        const formData = {};
        const inputs = this.container.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value;
            }
        });

        return formData;
    }

    /**
     * 验证表单 - 仅基础类型和最大长度检查
     * 不再强制必填项验证，允许空白和非正确格式
     * @returns {Object} 验证结果
     */
    validate() {
        const errors = [];
        const MAX_LENGTH = 500; // 最大长度限制
        const MAX_TEXTAREA_LENGTH = 5000; // 文本域最大长度

        const inputs = this.container.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            // 清除之前的错误状态
            input.classList.remove('error');
            
            // 只检查最大长度限制
            if (input.tagName === 'TEXTAREA' && input.value.length > MAX_TEXTAREA_LENGTH) {
                const label = this.container.querySelector(`label[for="${input.name}"]`);
                errors.push({
                    field: input.name,
                    label: label ? label.textContent.replace('*', '').trim() : input.name,
                    error: `内容超过最大长度${MAX_TEXTAREA_LENGTH}字符`
                });
                input.classList.add('error');
            } else if (input.tagName === 'INPUT' && input.value.length > MAX_LENGTH) {
                const label = this.container.querySelector(`label[for="${input.name}"]`);
                errors.push({
                    field: input.name,
                    label: label ? label.textContent.replace('*', '').trim() : input.name,
                    error: `内容超过最大长度${MAX_LENGTH}字符`
                });
                input.classList.add('error');
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 高亮错误字段
     * @param {Array} errors - 错误列表
     */
    highlightErrors(errors) {
        // 清除之前的错误高亮
        this.container.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });

        // 添加新的错误高亮
        errors.forEach(error => {
            const field = this.container.querySelector(`[name="${error.field}"]`);
            if (field) {
                field.classList.add('error');
            }
        });

        // 滚动到第一个错误
        if (errors.length > 0) {
            const firstError = this.container.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    /**
     * 清空表单
     */
    reset() {
        const form = this.container.querySelector('form');
        if (form) {
            form.reset();
        }
        this.formValues = {};
    }

    /**
     * 设置指定字段的值
     * @param {string} fieldName - 字段名称
     * @param {*} value - 字段值
     */
    setFieldValue(fieldName, value) {
        // 更新内部存储
        this.formValues[fieldName] = value;
        
        // 更新DOM元素
        const element = this.container.querySelector(`[name="${fieldName}"]`);
        if (element) {
            element.value = value;
            // 触发change事件
            const event = new Event('change', { bubbles: true });
            element.dispatchEvent(event);
        }
    }

    /**
     * 批量设置字段值
     * @param {Object} values - 字段名和值的键值对
     */
    setFieldValues(values) {
        Object.keys(values).forEach(fieldName => {
            this.setFieldValue(fieldName, values[fieldName]);
        });
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormGenerator;
} else {
    window.FormGenerator = FormGenerator;
}