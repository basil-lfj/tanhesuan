/**
 * 模板解析器
 * 从报告模板中提取变量定义，支持多行业模板
 */
class TemplateParser {
    constructor() {
        // 变量提取正则表达式
        this.VARIABLE_REGEX = /\{([^}]+)\}/g;
        
        // 行业模板配置
        this.industryTemplates = {
            power: {
                id: 'power',
                name: '发电行业',
                icon: 'fa-bolt',
                description: '火力发电 / 水力发电 / 光伏发电'
            },
            steel: {
                id: 'steel',
                name: '钢铁行业',
                icon: 'fa-fire',
                description: '炼铁 / 炼钢 / 轧钢'
            },
            cement: {
                id: 'cement',
                name: '水泥行业',
                icon: 'fa-building',
                description: '熟料生产 / 水泥生产'
            },
            chemical: {
                id: 'chemical',
                name: '化工行业',
                icon: 'fa-flask',
                description: '石油化工 / 煤化工 / 精细化工'
            }
        };
    }

    /**
     * 获取行业信息
     * @param {string} industryId - 行业ID
     * @returns {Object} 行业信息
     */
    getIndustryInfo(industryId) {
        return this.industryTemplates[industryId] || null;
    }

    /**
     * 从模板内容中提取所有变量
     * @param {string} templateContent - 模板内容
     * @returns {Array<string>} 变量名列表
     */
    extractVariables(templateContent) {
        const variables = new Set();
        let match;
        
        while ((match = this.VARIABLE_REGEX.exec(templateContent)) !== null) {
            variables.add(match[1].trim());
        }
        
        return Array.from(variables);
    }

    /**
     * 获取变量的字段类型
     * @param {string} varName - 变量名
     * @returns {string} 字段类型
     */
    detectFieldType(varName) {
        const name = varName.toLowerCase();
        
        // 日期类型
        if (name.includes('日期') || name.includes('年度') || name.includes('年份')) {
            return 'date';
        }
        
        // 数字类型
        if (name.includes('量') || name.includes('因子') || name.includes('容量') ||
            name.includes('排放') || name.includes('含量') || name.includes('比例') ||
            name.includes('占比') || name.includes('小时数') || name.includes('产能') ||
            name.includes('产量') || name.includes('用量') || name.includes('消耗') ||
            name.includes('发热量') || name.includes('处理能力') || name.includes('容积') ||
            name.includes('机组数量') || name.includes('装机容量')) {
            return 'number';
        }
        
        // 文本域类型
        if (name.includes('说明') || name.includes('简述') || name.includes('备注') ||
            name.includes('描述')) {
            return 'textarea';
        }
        
        // 选择类型
        if (name.includes('细分品类')) {
            return 'select';
        }
        
        return 'text';
    }

    /**
     * 格式化变量名为显示标签
     * @param {string} varName - 变量名
     * @returns {string} 格式化后的标签
     */
    formatLabel(varName) {
        return varName;
    }

    /**
     * 获取变量的单位
     * @param {string} varName - 变量名
     * @returns {string|null} 单位
     */
    detectUnit(varName) {
        const units = {
            '消耗量': '吨',
            '用量': '吨',
            '消耗量': '吨',
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
     * 判断变量是否必填
     * @param {string} varName - 变量名
     * @returns {boolean} 是否必填
     */
    isRequired(varName) {
        const requiredFields = [
            '企业名称', '企业全称', '信用代码', '法人', '核算年度',
            '注册地址', '联系人', '电话', '细分品类'
        ];
        
        return requiredFields.some(field => varName.includes(field));
    }

    /**
     * 获取选择类型的选项
     * @param {string} varName - 变量名
     * @param {string} industryId - 行业ID
     * @returns {Array<string>} 选项列表
     */
    getSelectOptions(varName, industryId) {
        const options = {
            '细分品类': {
                power: ['火力发电', '水力发电', '光伏发电', '风力发电', '核能发电', '生物质发电'],
                steel: ['炼铁', '炼钢', '轧钢', '完整钢铁生产'],
                cement: ['熟料生产', '水泥生产', '完整水泥生产'],
                chemical: ['石油化工', '煤化工', '精细化工', '无机化工']
            }
        };
        
        if (varName.includes('细分品类')) {
            return options['细分品类'][industryId] || [];
        }
        
        return [];
    }

    /**
     * 解析变量并生成变量定义
     * @param {string} varName - 变量名
     * @param {string} industryId - 行业ID
     * @returns {Object} 变量定义对象
     */
    parseVariable(varName, industryId) {
        const type = this.detectFieldType(varName);
        const definition = {
            name: varName,
            label: this.formatLabel(varName),
            type: type,
            required: this.isRequired(varName),
            unit: this.detectUnit(varName),
            description: ''
        };
        
        // 添加选项（选择类型）
        if (type === 'select') {
            definition.options = this.getSelectOptions(varName, industryId);
        }
        
        return definition;
    }

    /**
     * 对变量进行分组
     * @param {Array<string>} variables - 变量列表
     * @returns {Object} 分组后的变量
     */
    groupVariables(variables) {
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
                icon: 'fa-industry',
                variables: []
            }
        };
        
        // 分组规则
        const groupRules = {
            basic: ['企业', '名称', '信用代码', '法人', '地址', '联系', '电话', '邮箱', '编制单位', '编制日期'],
            boundary: ['核算年度', '核算边界', '细分品类', '行业类型', '报告名称'],
            activity: ['消耗量', '用量', '产量', '发电量', '蒸汽量', '外购', '购入', '输出', '低位发热量'],
            factor: ['因子', '含量'],
            result: ['排放量', '总量', '占比', '强度'],
            facility: ['机组', '锅炉', '型号', '容量', '处理能力', '运行小时', '设施', '装机', '脱硫']
        };
        
        variables.forEach(varName => {
            let assigned = false;
            
            for (const [groupId, keywords] of Object.entries(groupRules)) {
                if (keywords.some(keyword => varName.includes(keyword))) {
                    groups[groupId].variables.push(varName);
                    assigned = true;
                    break;
                }
            }
            
            // 未匹配的变量放入基本信息组
            if (!assigned) {
                groups.basic.variables.push(varName);
            }
        });
        
        // 移除空分组
        return Object.values(groups).filter(group => group.variables.length > 0);
    }
}

// 导出（支持模块化和全局使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateParser;
} else {
    window.TemplateParser = TemplateParser;
}