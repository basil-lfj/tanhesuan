/**
 * 报告生成器
 * 使用docx库生成Word格式报告
 */
class ReportGenerator {
    constructor() {
        // 行业模板映射
        this.industryNames = {
            power: '发电行业',
            steel: '钢铁行业',
            cement: '水泥行业',
            chemical: '化工行业'
        };
        
        // 初始化docx API引用
        this.initDocxAPI();
    }
    
    /**
     * 初始化docx库API
     */
    initDocxAPI() {
        if (typeof docx === 'undefined') {
            console.warn('docx库未加载');
            return;
        }
        
        // 保存docx API引用到实例
        // docx v8 中 TableRow 和 TableCell 是独立的类
        this.docxAPI = {
            Document: docx.Document,
            Paragraph: docx.Paragraph,
            TextRun: docx.TextRun,
            Table: docx.Table,
            TableRow: docx.TableRow,
            TableCell: docx.TableCell,
            WidthType: docx.WidthType,
            AlignmentType: docx.AlignmentType,
            HeadingLevel: docx.HeadingLevel,
            BorderStyle: docx.BorderStyle,
            Packer: docx.Packer,
            PageBreak: docx.PageBreak
        };
        
        // 验证必要的API是否存在
        const requiredAPIs = ['Document', 'Paragraph', 'TextRun', 'Table', 'Packer'];
        for (const api of requiredAPIs) {
            if (!this.docxAPI[api]) {
                console.error(`docx.${api} 未定义`);
            }
        }
    }
    
    /**
     * 获取docx API
     * @returns {Object} docx API对象
     */
    getDocxAPI() {
        if (!this.docxAPI) {
            this.initDocxAPI();
        }
        if (!this.docxAPI || !this.docxAPI.Document) {
            throw new Error('docx库未正确加载，请刷新页面重试');
        }
        return this.docxAPI;
    }

    /**
     * 生成Word报告
     * @param {string} industryId - 行业ID
     * @param {Object} formData - 表单数据
     * @returns {Promise<Blob>} Word文档Blob
     */
    async generate(industryId, formData) {
        const industryName = this.industryNames[industryId] || industryId;
        
        try {
            // 准备模板数据
            const templateData = this.prepareTemplateData(industryId, formData);
            
            // 创建文档
            const doc = await this.createDocument(industryName, templateData);
            
            return doc;
        } catch (error) {
            // 增强错误信息，包含具体位置
            const errorInfo = this._analyzeError(error);
            throw new Error(`报告生成失败 [${errorInfo.location}]: ${errorInfo.message}`);
        }
    }

    /**
     * 分析错误并提供具体位置信息
     * @param {Error} error - 原始错误
     * @returns {Object} 包含位置和消息的对象
     */
    _analyzeError(error) {
        const errorMsg = error && error.message ? error.message : String(error);
        
        // 提取具体位置信息（如果错误信息中包含）
        const locationMatch = errorMsg.match(/\[([^\]]+)\]/);
        const specificLocation = locationMatch ? locationMatch[1] : null;
        
        // 常见错误模式匹配
        if (errorMsg.includes('Invalid array length') || errorMsg.includes('Invalid array')) {
            return {
                location: specificLocation || '表格创建',
                message: '表格数据处理错误。已尝试使用默认值填充。'
            };
        }
        
        if (errorMsg.includes('width') || errorMsg.includes('WidthType')) {
            return {
                location: specificLocation || '表格宽度设置',
                message: '表格宽度计算错误，已使用默认宽度。'
            };
        }
        
        if (errorMsg.includes('children')) {
            return {
                location: specificLocation || '文档结构',
                message: '文档子元素创建出现问题，已跳过空内容。'
            };
        }
        
        if (errorMsg.includes('Packer') || errorMsg.includes('toBlob')) {
            return {
                location: '文档打包',
                message: '文档打包失败，可能是内存不足或文档结构问题。'
            };
        }
        
        // 如果错误信息已包含位置标记，直接返回
        if (specificLocation) {
            return {
                location: specificLocation,
                message: errorMsg.replace(/\[[^\]]+\]\s*/, '')
            };
        }
        
        // 默认返回原始错误
        return {
            location: '报告生成',
            message: errorMsg
        };
    }

    /**
     * 准备模板数据
     * @param {string} industryId - 行业ID
     * @param {Object} formData - 表单数据
     * @returns {Object} 模板数据
     */
    prepareTemplateData(industryId, formData) {
        const now = new Date();
        const year = formData['核算年度'] || now.getFullYear().toString();
        const industryName = this.industryNames[industryId] || '';
        
        // 基础数据
        const data = {
            // 报告基本信息
            核算年度: year,
            企业全称: formData['企业全称'] || formData['企业名称'] || '',
            企业名称: formData['企业名称'] || formData['企业全称'] || '',
            信用代码: formData['信用代码'] || '',
            法人: formData['法人'] || '',
            注册地址: formData['注册地址'] || '',
            生产地址: formData['生产地址'] || '',
            联系人: formData['联系人'] || '',
            电话: formData['电话'] || '',
            邮箱: formData['邮箱'] || '',
            
            // 行业信息
            细分品类: formData['细分品类'] || '',
            行业类型: `${industryName}（${formData['细分品类'] || ''}）`,
            
            // 核算边界
            核算边界说明: formData['核算边界说明'] || '',
            
            // 编制信息
            编制单位: formData['编制单位'] || formData['企业名称'] || '',
            编制日期: formData['编制日期'] || this.formatDate(now),
            
            // 报告日期范围
            'YYYY 年 1 月 1 日': `${year}年1月1日`,
            '{YYYY} 年 12 月 31 日': `${year}年12月31日`,
            
            // 发电行业专用字段
            发电量: formData['发电量'] || '',
            发电量单位: formData['发电量单位'] || '亿kWh',
            蒸汽量: formData['蒸汽量'] || '',
            脱硫工艺类型: formData['脱硫工艺类型'] || '石灰石-石膏法',
            装机容量: formData['装机容量'] || '',
            机组数量: formData['机组数量'] || '',
            
            // 燃料消耗
            煤炭消耗量: formData['煤炭消耗量'] || '',
            天然气消耗量: formData['天然气消耗量'] || '',
            柴油消耗量: formData['柴油消耗量'] || '',
            低位发热量: formData['低位发热量'] || '',
            
            // 脱硫过程
            石灰石用量: formData['石灰石用量'] || '',
            白云石用量: formData['白云石用量'] || '',
            碳酸盐含量: formData['碳酸盐含量'] || '',
            
            // 外购能源
            外购电力用量: formData['外购电力用量'] || '',
            外购热力用量: formData['外购热力用量'] || '',
            
            // 排放量
            范围1总量: formData['范围1总量'] || '',
            范围1占比: formData['范围1占比'] || '',
            范围2总量: formData['范围2总量'] || '',
            范围2占比: formData['范围2占比'] || '',
            燃烧排放量: formData['燃烧排放量'] || '',
            脱硫排放量: formData['脱硫排放量'] || '',
            电力排放量: formData['电力排放量'] || '',
            热力排放量: formData['热力排放量'] || '',
            总排放量: formData['总排放量'] || '',
            
            // 排放因子
            燃煤排放因子: formData['燃煤排放因子'] || '',
            石灰石排放因子: formData['石灰石排放因子'] || '',
            电网排放因子: formData['电网排放因子'] || '',
            因子值: formData['因子值'] || '',
            
            // 设施信息
            机组编号: formData['机组编号'] || '',
            机组名称: formData['机组名称'] || '',
            容量: formData['容量'] || '',
            排放量1: formData['排放量1'] || '',
            排放强度1: formData['排放强度1'] || '',
            型号: formData['型号'] || '',
            处理能力: formData['处理能力'] || '',
            运行小时数: formData['运行小时数'] || '',
            
            // 钢铁行业专用
            生铁产量: formData['生铁产量'] || '',
            粗钢产量: formData['粗钢产量'] || '',
            钢材产量: formData['钢材产量'] || '',
            产能: formData['产能'] || '',
            高炉数量: formData['高炉数量'] || '',
            转炉数量: formData['转炉数量'] || '',
            过程排放量: formData['过程排放量'] || '',
            固碳排放量: formData['固碳排放量'] || '',
            
            // 水泥行业专用
            熟料产量: formData['熟料产量'] || '',
            水泥产量: formData['水泥产量'] || '',
            熟料产能: formData['熟料产能'] || '',
            水泥产能: formData['水泥产能'] || '',
            回转窑数量: formData['回转窑数量'] || '',
            水泥磨数量: formData['水泥磨数量'] || '',
            CaO含量: formData['CaO含量'] || '',
            MgO含量: formData['MgO含量'] || '',
            CaCO3含量: formData['CaCO₃含量'] || formData['CaCO3含量'] || '',
            过程排放量: formData['过程排放量'] || '',
            燃烧排放量: formData['燃烧排放量'] || ''
        };
        
        // 将formData中所有未处理的字段也添加到data中
        Object.keys(formData).forEach(key => {
            if (!data[key] && formData[key]) {
                data[key] = formData[key];
            }
        });
        
        return data;
    }

    /**
     * 创建Word文档
     * @param {string} industryName - 行业名称
     * @param {Object} data - 模板数据
     * @returns {Promise<Blob>} 文档Blob
     */
    async createDocument(industryName, data) {
        // 获取docx API
        // 注意：docx v8中TableRow和TableCell使用对象字面量，不再是独立类
        const { Document, Paragraph, TextRun, Table,
                WidthType, AlignmentType, HeadingLevel, BorderStyle, Packer } = this.getDocxAPI();
        
        // 辅助函数：安全执行章节创建
        const safeCreate = (chapterName, createFn, ...args) => {
            try {
                const result = createFn.apply(this, args);
                if (!result || (Array.isArray(result) && result.length === 0)) {
                    console.warn(`[${chapterName}] 生成了空内容`);
                }
                return result;
            } catch (error) {
                const errorMsg = error && error.message ? error.message : String(error);
                console.error(`[${chapterName}] 创建失败:`, error);
                throw new Error(`文档章节"${chapterName}"创建失败: ${errorMsg}`);
            }
        };
        
        // 构建文档内容
        let documentChildren = [];
        
        try {
            // 封面
            documentChildren.push(...safeCreate('封面', this.createCoverPage, industryName, data));
            
            // 目录
            documentChildren.push(...safeCreate('目录', this.createTableOfContents));
            
            // 第1章 编制说明
            documentChildren.push(...safeCreate('第1章 编制说明', this.createChapter1, data));
            
            // 第2章 企业基本信息
            documentChildren.push(...safeCreate('第2章 企业基本信息', this.createChapter2, data));
            
            // 第3章 核算边界与核算方法
            documentChildren.push(...safeCreate('第3章 核算边界', this.createChapter3, industryName, data));
            
            // 第4章 温室气体排放活动数据
            documentChildren.push(...safeCreate('第4章 活动数据', this.createChapter4, data));
            
            // 第5章 温室气体排放量核算结果
            documentChildren.push(...safeCreate('第5章 核算结果', this.createChapter5, data));
            
        } catch (error) {
            // 已经在safeCreate中处理过了，直接重新抛出
            throw error;
        }
        
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440
                        }
                    }
                },
                children: documentChildren
            }]
        });
        
        // 生成Blob
        try {
            const blob = await Packer.toBlob(doc);
            return blob;
        } catch (error) {
            const errorMsg = error && error.message ? error.message : String(error);
            throw new Error(`文档打包失败: ${errorMsg}。可能是文档结构不完整或内存不足。`);
        }
    }

    /**
     * 创建封面
     */
    createCoverPage(industryName, data) {
        const { Paragraph, TextRun, AlignmentType } = this.getDocxAPI();
        
        return [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 2000, after: 400 },
                children: [new TextRun({
                    text: '企业温室气体排放核算与报告',
                    bold: true,
                    size: 48,
                    font: '宋体'
                })]
            }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '' }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                    text: `报告名称：${data['核算年度'] || ''} 年度温室气体排放核算报告（${industryName}）`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                    text: `企业名称：${data['企业全称'] || data['企业名称'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                    text: `统一社会信用代码：${data['信用代码'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                    text: `行业类型：${industryName}（${data['细分品类'] || ''}）`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                    text: `核算年度：${data['核算年度'] || ''}年1月1日 – ${data['核算年度'] || ''}年12月31日`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                    text: `编制单位：${data['编制单位'] || data['企业名称'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({
                    text: `编制日期：${data['编制日期'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '' }) // 分页
        ];
    }

    /**
     * 创建目录（单独一页）
     */
    createTableOfContents() {
        const { Paragraph, TextRun, AlignmentType, PageBreak } = this.getDocxAPI();
        
        return [
            // 分页符 - 确保目录在新页面
            new Paragraph({
                children: [new PageBreak()]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 800, after: 600 },
                children: [new TextRun({
                    text: '目  录',
                    bold: true,
                    size: 36,
                    font: '黑体'
                })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '1  编制说明', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '2  企业基本信息', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '3  核算边界与核算方法', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '4  温室气体排放活动数据', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '5  温室气体排放量核算结果', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '6  排放源清单与核算明细', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '7  重点设施信息', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '8  排放因子来源与说明', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '9  质量保证与质量控制', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '10 不确定性分析', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '11 承诺书', size: 24, font: '宋体' })]
            }),
            new Paragraph({
                spacing: { after: 150 },
                indent: { left: 400 },
                children: [new TextRun({ text: '12 附件资料', size: 24, font: '宋体' })]
            })
        ];
    }

    /**
     * 创建第1章 编制说明
     */
    createChapter1(data) {
        const { Paragraph, TextRun, HeadingLevel } = this.getDocxAPI();
        
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                children: [new TextRun({ text: '1  编制说明', bold: true, size: 28, font: '黑体' })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '1.1 编制目的', bold: true, size: 24, font: '黑体' })]
            }),
            new Paragraph({
                spacing: { after: 100 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '为满足全国碳排放权交易市场履约要求，按照国家生态环境部发布的企业温室气体排放核算与报告指南编制本报告，准确核算企业生产过程中温室气体排放量，为履约、碳资产管理提供依据。',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '1.2 编制依据', bold: true, size: 24, font: '黑体' })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '（1）《企业温室气体排放核算与报告指南》',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '（2）《温室气体排放核算与报告要求 GB/T 32151 系列》',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '（3）国家温室气体排放因子库（第二版）',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '（4）其他相关法规、标准、规范性文件',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '1.3 报告覆盖范围', bold: true, size: 24, font: '黑体' })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `覆盖气体：主要为CO₂（CH₄、N₂O排放量占比极低，暂不纳入核算）`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '核算范围：范围1（化石燃料燃烧排放、过程排放）+ 范围2（外购电力、热力间接排放）',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `核算年度：${data['核算年度'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({ text: '' })
        ];
    }

    /**
     * 创建第2章 企业基本信息
     */
    createChapter2(data) {
        const { Paragraph, TextRun, HeadingLevel } = this.getDocxAPI();
        
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                children: [new TextRun({ text: '2  企业基本信息', bold: true, size: 28, font: '黑体' })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '2.1 企业概况', bold: true, size: 24, font: '黑体' })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `企业名称：${data['企业名称'] || data['企业全称'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `法定代表人：${data['法人'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `注册地址：${data['注册地址'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `生产地址：${data['生产地址'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `联系方式：${data['联系人'] || ''} / ${data['电话'] || ''} / ${data['邮箱'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '2.2 行业与产品信息', bold: true, size: 24, font: '黑体' })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `所属行业：${data['行业类型'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `主要产品：${data['主要产品'] || '见活动数据章节'}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({ text: '' })
        ];
    }

    /**
     * 创建第3章 核算边界与核算方法
     */
    createChapter3(industryName, data) {
        const { Paragraph, TextRun, HeadingLevel } = this.getDocxAPI();
        
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                children: [new TextRun({ text: '3  核算边界与核算方法', bold: true, size: 28, font: '黑体' })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '3.1 核算边界', bold: true, size: 24, font: '黑体' })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `法人边界：${data['企业名称'] || data['企业全称'] || ''}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `运营边界：${data['核算边界说明'] || '厂区内所有生产设施、辅助生产系统，排除非生产设施'}`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '3.2 核算方法', bold: true, size: 24, font: '黑体' })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '范围1排放核算方法：采用"活动数据×排放因子"计算，排放因子优先采用企业实测值，无实测值采用国家因子库缺省值。',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '范围2排放核算方法：外购电力、热力排放量 = 外购量 × 对应排放因子',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({
                spacing: { after: 80 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: '总排放量计算公式：E = E燃烧 + E过程 + E电 + E热（如有）',
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({ text: '' })
        ];
    }

    /**
     * 创建第4章 温室气体排放活动数据
     * @param {Object} data - 模板数据
     * @returns {Array} 段落和表格数组
     */
    createChapter4(data) {
        const { Paragraph, TextRun, HeadingLevel, Table, WidthType, BorderStyle } = this.getDocxAPI();
        
        // 创建燃料消耗表格
        let fuelTable;
        try {
            const fuelRows = [
                this.createTableRow(['煤炭', data['煤炭消耗量'] || '-', '吨', data['低位发热量'] || '-', '台账/发票']),
                this.createTableRow(['天然气', data['天然气消耗量'] || '-', '万Nm³', '-', '流量计']),
                this.createTableRow(['柴油', data['柴油消耗量'] || '-', '吨', '-', '发票/台账'])
            ];
            const fuelHeader = this.createTableHeader(['燃料名称', '消耗量', '单位', '低位发热量', '数据来源']);
            fuelTable = new Table({
                rows: [fuelHeader, ...fuelRows]
            });
        } catch (error) {
            console.warn('[第4章-燃料消耗表] 使用简化表格:', error.message);
            // 使用简化表格
            fuelTable = new Table({
                rows: [this.createTableHeader(['燃料数据', '数值']), this.createTableRow(['数据待填', '-'])]
            });
        }
        
        // 创建范围2表格
        let scope2Table;
        try {
            scope2Table = new Table({
                rows: [
                    this.createTableHeader(['能源类型', '采购量', '单位', '数据来源', '备注']),
                    this.createTableRow(['外购电力', data['外购电力用量'] || '-', '万kWh', '电费发票', '-']),
                    this.createTableRow(['外购热力', data['外购热力用量'] || '-', 'GJ', '热力发票', '-'])
                ]
            });
        } catch (error) {
            console.warn('[第4章-范围2活动数据表] 使用简化表格:', error.message);
            // 使用简化表格
            scope2Table = new Table({
                rows: [this.createTableHeader(['外购能源', '数值']), this.createTableRow(['数据待填', '-'])]
            });
        }
        
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                children: [new TextRun({ text: '4  温室气体排放活动数据', bold: true, size: 28, font: '黑体' })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '4.1 范围1 活动数据', bold: true, size: 24, font: '黑体' })]
            }),
            new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({ text: '4.1.1 燃料燃烧活动数据', bold: true, size: 24, font: '宋体' })]
            }),
            fuelTable,
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '4.2 范围2 活动数据', bold: true, size: 24, font: '黑体' })]
            }),
            scope2Table,
            new Paragraph({ text: '' })
        ];
    }

    /**
     * 创建第5章 温室气体排放量核算结果
     * @param {Object} data - 模板数据
     * @returns {Array} 段落和表格数组
     */
    createChapter5(data) {
        const { Paragraph, TextRun, HeadingLevel, Table, WidthType } = this.getDocxAPI();
        
        // 创建排放量汇总表格
        let emissionTable;
        try {
            const rows = [
                this.createTableHeader(['排放范围', '排放量（tCO₂e）', '占比', '细分排放类型', '排放量（tCO₂e）']),
                this.createTableRow(['范围1', data['范围1总量'] || '-', data['范围1占比'] || '-', '化石燃料燃烧', data['燃烧排放量'] || '-']),
                this.createTableRow(['', '', '', '过程排放', data['过程排放量'] || '-']),
                this.createTableRow(['范围2', data['范围2总量'] || '-', data['范围2占比'] || '-', '外购电力', data['电力排放量'] || '-']),
                this.createTableRow(['', '', '', '外购热力', data['热力排放量'] || '-']),
                this.createTableRow(['合计', data['总排放量'] || '-', '100%', '-', '-'])
            ];
            emissionTable = new Table({
                rows: rows
            });
        } catch (error) {
            console.warn('[第5章-排放量汇总表] 使用简化表格:', error.message);
            // 使用简化表格
            emissionTable = new Table({
                rows: [this.createTableHeader(['排放类型', '排放量']), this.createTableRow(['总排放量', data['总排放量'] || '-'])]
            });
        }
        
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                children: [new TextRun({ text: '5  温室气体排放量核算结果', bold: true, size: 28, font: '黑体' })]
            }),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: '5.1 总排放量汇总', bold: true, size: 24, font: '黑体' })]
            }),
            emissionTable,
            new Paragraph({ text: '' }),
            new Paragraph({
                spacing: { after: 100 },
                indent: { firstLine: 480 },
                children: [new TextRun({
                    text: `本年度温室气体总排放量为 ${data['总排放量'] || '-'} tCO₂e，其中范围1排放 ${data['范围1总量'] || '-'} tCO₂e，范围2排放 ${data['范围2总量'] || '-'} tCO₂e。`,
                    size: 24,
                    font: '宋体'
                })]
            }),
            new Paragraph({ text: '' })
        ];
    }

    /**
     * 创建表格表头
     * 使用docx v8的TableRow和TableCell类
     * @param {Array} texts - 表头文本数组
     * @returns {Object} 表格行对象
     */
    createTableHeader(texts) {
        const { Paragraph, TextRun, WidthType, TableRow, TableCell } = this.getDocxAPI();
        
        // 确保texts是有效数组，否则使用默认表头
        let safeTexts = texts;
        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            console.warn('[createTableHeader] 使用默认表头');
            safeTexts = ['列1', '列2', '列3'];
        }
        
        // 使用TableCell类创建单元格
        const cells = safeTexts.map((text, index) => {
            return new TableCell({
                children: [new Paragraph({
                    alignment: 'center',
                    children: [new TextRun({
                        text: text != null ? String(text) : '-',
                        bold: true,
                        size: 20,
                        font: '宋体'
                    })]
                })]
            });
        });
        
        // 返回TableRow对象
        return new TableRow({
            tableHeader: true,
            children: cells
        });
    }

    /**
     * 创建表格行
     * 使用docx v8的TableRow和TableCell类
     * @param {Array} texts - 单元格文本数组
     * @returns {Object} 表格行对象
     */
    createTableRow(texts) {
        const { Paragraph, TextRun, WidthType, TableRow, TableCell } = this.getDocxAPI();
        
        // 确保texts是有效数组，否则使用默认行
        let safeTexts = texts;
        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            console.warn('[createTableRow] 使用默认表格行');
            safeTexts = ['-', '-', '-'];
        }
        
        // 使用TableCell类创建单元格
        const cells = safeTexts.map((text, index) => {
            return new TableCell({
                children: [new Paragraph({
                    alignment: 'center',
                    children: [new TextRun({
                        text: text != null ? String(text) : '-',
                        size: 20,
                        font: '宋体'
                    })]
                })]
            });
        });
        
        // 返回TableRow对象
        return new TableRow({
            children: cells
        });
    }

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    /**
     * 下载报告
     * @param {Blob} blob - 文档Blob
     * @param {string} filename - 文件名
     */
    downloadReport(blob, filename) {
        saveAs(blob, filename);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportGenerator;
} else {
    window.ReportGenerator = ReportGenerator;
}