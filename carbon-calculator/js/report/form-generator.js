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
            html += `
                <fieldset class="form-section" data-section="${group.id}">
                    <legend class="section-header">
                        <i class="fas ${group.icon || 'fa-folder'}"></i>
                        <span>${group.name}</span>
                        <span class="toggle-icon"><i class="fas fa-chevron-down"></i></span>
                    </legend>
                    <div class="section-content">
                        <div class="form-grid">
                            ${this.buildFieldsHtml(group.variables)}
                        </div>
                    </div>
                </fieldset>
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
     * 创建单个字段HTML
     * @param {Object} fieldDef - 字段定义
     * @returns {string} HTML字符串
     */
    createFieldHtml(fieldDef) {
        const requiredMark = fieldDef.required ? '<span class="required">*</span>' : '';
        const unitHtml = fieldDef.unit ? `<span class="input-unit">${fieldDef.unit}</span>` : '';

        let inputHtml = '';

        switch (fieldDef.type) {
            case 'textarea':
                inputHtml = `
                    <textarea id="${fieldDef.name}" name="${fieldDef.name}"
                        class="form-textarea" 
                        placeholder="请输入${fieldDef.label}"
                        ${fieldDef.required ? 'required' : ''}></textarea>
                `;
                break;

            case 'select':
                inputHtml = `
                    <select id="${fieldDef.name}" name="${fieldDef.name}"
                        class="form-select"
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
                    <div class="input-wrapper">
                        <input type="number" id="${fieldDef.name}" name="${fieldDef.name}"
                            class="form-input" 
                            placeholder="请输入${fieldDef.label}"
                            step="any"
                            ${fieldDef.required ? 'required' : ''}>
                        ${unitHtml}
                    </div>
                `;
                break;

            case 'date':
                inputHtml = `
                    <input type="date" id="${fieldDef.name}" name="${fieldDef.name}"
                        class="form-input"
                        ${fieldDef.required ? 'required' : ''}>
                `;
                break;

            default:
                inputHtml = `
                    <input type="text" id="${fieldDef.name}" name="${fieldDef.name}"
                        class="form-input" 
                        placeholder="请输入${fieldDef.label}"
                        ${fieldDef.required ? 'required' : ''}>
                `;
        }

        return `
            <div class="form-group" data-field="${fieldDef.name}">
                <label for="${fieldDef.name}" class="form-label">
                    ${fieldDef.label}${requiredMark}
                </label>
                ${inputHtml}
            </div>
        `;
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
                const section = header.closest('.form-section');
                section.classList.toggle('collapsed');
            });
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