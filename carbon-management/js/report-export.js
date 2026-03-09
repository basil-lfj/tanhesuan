/**
 * 碳资产管理系统 - 报表导出模块
 * 
 * 功能说明：
 * 1. 配额管理报表：配额余额、使用情况、缺口分析
 * 2. 减排成果报表：减排措施、减排量统计、成效分析
 * 3. 综合分析报表：配额与减排综合分析、履约建议
 */

const ReportExport = {
    /**
     * 初始化报表导出模块
     */
    init() {
        this.bindEvents();
        console.log('报表导出模块初始化完成');
    },

    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 导出配额报表
        const quotaReportBtn = document.getElementById('exportQuotaReport');
        if (quotaReportBtn) {
            quotaReportBtn.addEventListener('click', () => this.exportQuotaReport());
        }

        // 导出减排报表
        const reductionReportBtn = document.getElementById('exportReductionReport');
        if (reductionReportBtn) {
            reductionReportBtn.addEventListener('click', () => this.exportReductionReport());
        }

        // 导出综合报表
        const summaryReportBtn = document.getElementById('exportSummaryReport');
        if (summaryReportBtn) {
            summaryReportBtn.addEventListener('click', () => this.exportSummaryReport());
        }

        // 关闭预览
        const closePreviewBtn = document.getElementById('closePreview');
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', () => this.hidePreview());
        }

        // 下载报表
        const downloadBtn = document.getElementById('downloadReport');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadCurrentReport());
        }
    },

    // 当前报表类型
    currentReportType: null,
    currentReportContent: null,

    /**
     * 导出配额管理报表
     */
    exportQuotaReport() {
        const quotas = DataStore.getQuotas();
        const quotaStats = DataStore.getQuotaStats();
        const gapInfo = DataStore.calculateGap();

        const reportContent = this.generateQuotaReportHTML(quotas, quotaStats, gapInfo);
        this.showPreview(reportContent, '配额管理报表');
        this.currentReportType = 'quota';
        this.currentReportContent = reportContent;
    },

    /**
     * 生成配额报表HTML
     */
    generateQuotaReportHTML(quotas, stats, gapInfo) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN');
        const timeStr = now.toLocaleTimeString('zh-CN');

        return `
            <div class="report-container">
                <div class="report-header">
                    <h2>碳配额管理报表</h2>
                    <p class="report-time">生成时间：${dateStr} ${timeStr}</p>
                </div>
                
                <div class="report-section">
                    <h3>一、配额概况</h3>
                    <table class="report-table">
                        <tr>
                            <th>指标</th>
                            <th>数值</th>
                            <th>单位</th>
                        </tr>
                        <tr>
                            <td>统计年度</td>
                            <td>${stats.currentYear}</td>
                            <td>年</td>
                        </tr>
                        <tr>
                            <td>配额总数</td>
                            <td>${this.formatNumber(stats.totalQuota)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>已使用配额</td>
                            <td>${this.formatNumber(stats.totalUsed)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>配额余额</td>
                            <td>${this.formatNumber(stats.totalRemaining)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>配额记录数</td>
                            <td>${stats.quotaCount}</td>
                            <td>条</td>
                        </tr>
                    </table>
                </div>

                <div class="report-section">
                    <h3>二、缺口/盈余分析</h3>
                    <table class="report-table">
                        <tr>
                            <th>指标</th>
                            <th>数值</th>
                            <th>单位</th>
                        </tr>
                        <tr>
                            <td>当前排放量</td>
                            <td>${this.formatNumber(gapInfo.currentEmission)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>可用配额</td>
                            <td>${this.formatNumber(gapInfo.availableQuota)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>配额${gapInfo.isDeficit ? '缺口' : '盈余'}</td>
                            <td class="${gapInfo.isDeficit ? 'text-danger' : 'text-success'}">
                                ${gapInfo.isDeficit ? '' : '+'}${this.formatNumber(gapInfo.gap)}
                            </td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>状态</td>
                            <td colspan="2" class="${gapInfo.isDeficit ? 'text-danger' : 'text-success'}">
                                ${gapInfo.isDeficit ? '⚠️ 存在配额缺口，需及时履约' : '✓ 配额充足，履约状态良好'}
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="report-section">
                    <h3>三、配额明细</h3>
                    ${quotas.length > 0 ? `
                        <table class="report-table">
                            <tr>
                                <th>年度</th>
                                <th>配额类型</th>
                                <th>配额数量</th>
                                <th>已使用</th>
                                <th>剩余</th>
                                <th>发放日期</th>
                            </tr>
                            ${quotas.map(q => `
                                <tr>
                                    <td>${q.year}</td>
                                    <td>${q.typeName || QuotaManager.QUOTA_TYPES[q.type]}</td>
                                    <td>${this.formatNumber(q.amount)}</td>
                                    <td>${this.formatNumber(q.used)}</td>
                                    <td>${this.formatNumber(q.remaining)}</td>
                                    <td>${q.issueDate}</td>
                                </tr>
                            `).join('')}
                        </table>
                    ` : '<p class="no-data">暂无配额明细数据</p>'}
                </div>

                <div class="report-footer">
                    <p>本报表由碳资产管理系统自动生成</p>
                </div>
            </div>
        `;
    },

    /**
     * 导出减排成果报表
     */
    exportReductionReport() {
        const reductions = DataStore.getReductions();
        const reductionStats = DataStore.getReductionStats();
        const typeStats = ReductionManager.getStatsByType();

        const reportContent = this.generateReductionReportHTML(reductions, reductionStats, typeStats);
        this.showPreview(reportContent, '减排成果报表');
        this.currentReportType = 'reduction';
        this.currentReportContent = reportContent;
    },

    /**
     * 生成减排报表HTML
     */
    generateReductionReportHTML(reductions, stats, typeStats) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN');
        const timeStr = now.toLocaleTimeString('zh-CN');

        return `
            <div class="report-container">
                <div class="report-header">
                    <h2>减排成果报表</h2>
                    <p class="report-time">生成时间：${dateStr} ${timeStr}</p>
                </div>
                
                <div class="report-section">
                    <h3>一、减排概况</h3>
                    <table class="report-table">
                        <tr>
                            <th>指标</th>
                            <th>数值</th>
                            <th>单位</th>
                        </tr>
                        <tr>
                            <td>累计减排量</td>
                            <td>${this.formatNumber(stats.totalReduction)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>${stats.currentYear}年减排量</td>
                            <td>${this.formatNumber(stats.currentYearReduction)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>减排记录数</td>
                            <td>${stats.recordCount}</td>
                            <td>条</td>
                        </tr>
                    </table>
                </div>

                <div class="report-section">
                    <h3>二、减排类型分析</h3>
                    ${Object.keys(typeStats).length > 0 ? `
                        <table class="report-table">
                            <tr>
                                <th>减排类型</th>
                                <th>减排量</th>
                                <th>记录数</th>
                                <th>占比</th>
                            </tr>
                            ${Object.entries(typeStats).map(([type, data]) => `
                                <tr>
                                    <td>${data.typeName}</td>
                                    <td>${this.formatNumber(data.total)}</td>
                                    <td>${data.count}</td>
                                    <td>${(data.total / stats.totalReduction * 100).toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </table>
                    ` : '<p class="no-data">暂无减排类型数据</p>'}
                </div>

                <div class="report-section">
                    <h3>三、年度减排统计</h3>
                    ${Object.keys(stats.byYear).length > 0 ? `
                        <table class="report-table">
                            <tr>
                                <th>年度</th>
                                <th>减排量</th>
                                <th>记录数</th>
                            </tr>
                            ${Object.entries(stats.byYear).sort((a, b) => b[0] - a[0]).map(([year, data]) => `
                                <tr>
                                    <td>${year}</td>
                                    <td>${this.formatNumber(data.total)}</td>
                                    <td>${data.count}</td>
                                </tr>
                            `).join('')}
                        </table>
                    ` : '<p class="no-data">暂无年度统计数据</p>'}
                </div>

                <div class="report-section">
                    <h3>四、减排明细</h3>
                    ${reductions.length > 0 ? `
                        <table class="report-table">
                            <tr>
                                <th>年度</th>
                                <th>减排类型</th>
                                <th>减排量</th>
                                <th>实施日期</th>
                                <th>措施描述</th>
                            </tr>
                            ${reductions.map(r => `
                                <tr>
                                    <td>${r.year}</td>
                                    <td>${r.typeName || ReductionManager.REDUCTION_TYPES[r.type]}</td>
                                    <td>${this.formatNumber(r.amount)}</td>
                                    <td>${r.implementDate}</td>
                                    <td>${r.description || '-'}</td>
                                </tr>
                            `).join('')}
                        </table>
                    ` : '<p class="no-data">暂无减排明细数据</p>'}
                </div>

                <div class="report-footer">
                    <p>本报表由碳资产管理系统自动生成</p>
                </div>
            </div>
        `;
    },

    /**
     * 导出综合分析报表
     */
    exportSummaryReport() {
        const quotas = DataStore.getQuotas();
        const reductions = DataStore.getReductions();
        const quotaStats = DataStore.getQuotaStats();
        const reductionStats = DataStore.getReductionStats();
        const gapInfo = DataStore.calculateGap();
        const warningInfo = DataStore.checkWarning();

        const reportContent = this.generateSummaryReportHTML(quotas, reductions, quotaStats, reductionStats, gapInfo, warningInfo);
        this.showPreview(reportContent, '综合分析报表');
        this.currentReportType = 'summary';
        this.currentReportContent = reportContent;
    },

    /**
     * 生成综合报表HTML
     */
    generateSummaryReportHTML(quotas, reductions, quotaStats, reductionStats, gapInfo, warningInfo) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN');
        const timeStr = now.toLocaleTimeString('zh-CN');

        // 生成履约建议
        const suggestions = this.generateSuggestions(gapInfo, quotaStats, reductionStats);

        return `
            <div class="report-container">
                <div class="report-header">
                    <h2>碳资产综合分析报表</h2>
                    <p class="report-time">生成时间：${dateStr} ${timeStr}</p>
                </div>
                
                <div class="report-section">
                    <h3>一、碳资产概况</h3>
                    <table class="report-table">
                        <tr>
                            <th>指标</th>
                            <th>数值</th>
                            <th>单位</th>
                        </tr>
                        <tr>
                            <td>统计年度</td>
                            <td>${quotaStats.currentYear}</td>
                            <td>年</td>
                        </tr>
                        <tr>
                            <td>当前排放量</td>
                            <td>${this.formatNumber(gapInfo.currentEmission)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>配额余额</td>
                            <td>${this.formatNumber(gapInfo.quotaRemaining)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>累计减排量</td>
                            <td>${this.formatNumber(gapInfo.totalReduction)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr>
                            <td>可用配额</td>
                            <td>${this.formatNumber(gapInfo.availableQuota)}</td>
                            <td>吨CO₂</td>
                        </tr>
                        <tr class="${gapInfo.isDeficit ? 'warning-row' : 'success-row'}">
                            <td>配额${gapInfo.isDeficit ? '缺口' : '盈余'}</td>
                            <td>${gapInfo.isDeficit ? '' : '+'}${this.formatNumber(gapInfo.gap)}</td>
                            <td>吨CO₂</td>
                        </tr>
                    </table>
                </div>

                <div class="report-section">
                    <h3>二、履约状态评估</h3>
                    <div class="status-box ${gapInfo.isDeficit ? 'status-warning' : 'status-success'}">
                        <p class="status-icon">${gapInfo.isDeficit ? '⚠️' : '✓'}</p>
                        <p class="status-text">${warningInfo.message}</p>
                    </div>
                </div>

                <div class="report-section">
                    <h3>三、配额与减排对比</h3>
                    <table class="report-table">
                        <tr>
                            <th>类别</th>
                            <th>数量</th>
                            <th>占比</th>
                        </tr>
                        <tr>
                            <td>配额余额</td>
                            <td>${this.formatNumber(gapInfo.quotaRemaining)}</td>
                            <td>${gapInfo.availableQuota > 0 ? (gapInfo.quotaRemaining / gapInfo.availableQuota * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td>减排成果</td>
                            <td>${this.formatNumber(gapInfo.totalReduction)}</td>
                            <td>${gapInfo.availableQuota > 0 ? (gapInfo.totalReduction / gapInfo.availableQuota * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>可用配额合计</strong></td>
                            <td><strong>${this.formatNumber(gapInfo.availableQuota)}</strong></td>
                            <td><strong>100%</strong></td>
                        </tr>
                    </table>
                </div>

                <div class="report-section">
                    <h3>四、履约建议</h3>
                    <div class="suggestions-box">
                        ${suggestions.map((s, i) => `
                            <div class="suggestion-item">
                                <span class="suggestion-num">${i + 1}</span>
                                <p class="suggestion-text">${s}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="report-section">
                    <h3>五、数据汇总</h3>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <h4>配额管理</h4>
                            <p>配额记录：<strong>${quotaStats.quotaCount}</strong> 条</p>
                            <p>配额总量：<strong>${this.formatNumber(quotaStats.totalQuota)}</strong> 吨CO₂</p>
                        </div>
                        <div class="summary-card">
                            <h4>减排成果</h4>
                            <p>减排记录：<strong>${reductionStats.recordCount}</strong> 条</p>
                            <p>累计减排：<strong>${this.formatNumber(reductionStats.totalReduction)}</strong> 吨CO₂</p>
                        </div>
                    </div>
                </div>

                <div class="report-footer">
                    <p>本报表由碳资产管理系统自动生成</p>
                    <p>报告日期：${dateStr}</p>
                </div>
            </div>
        `;
    },

    /**
     * 生成履约建议
     */
    generateSuggestions(gapInfo, quotaStats, reductionStats) {
        const suggestions = [];

        if (gapInfo.isDeficit) {
            // 存在缺口时的建议
            suggestions.push(`当前存在 ${this.formatNumber(gapInfo.gap)} 吨CO₂配额缺口，建议优先采取以下措施：`);
            
            if (gapInfo.gapPercent > 20) {
                suggestions.push('缺口较大（超过20%），建议立即启动碳交易购买配额或开展减排项目。');
            } else {
                suggestions.push('缺口适中，可通过内部减排措施或少量购买配额解决。');
            }

            if (reductionStats.recordCount === 0) {
                suggestions.push('暂无减排记录，建议尽快开展节能改造、工艺优化等减排项目。');
            } else {
                suggestions.push(`已累计减排 ${this.formatNumber(reductionStats.totalReduction)} 吨CO₂，建议继续推进减排项目。`);
            }

            suggestions.push('可考虑购买碳配额或CCER（国家核证自愿减排量）进行履约。');
            suggestions.push('建议制定年度减排计划，明确减排目标和措施。');
        } else {
            // 盈余时的建议
            suggestions.push(`当前配额盈余 ${this.formatNumber(Math.abs(gapInfo.gap))} 吨CO₂，履约状态良好。`);
            suggestions.push('可考虑将盈余配额在碳市场出售，获取经济收益。');
            suggestions.push('建议继续保持减排力度，为未来碳约束趋严做好准备。');
            
            if (reductionStats.totalReduction > 0) {
                suggestions.push(`减排成效显著，累计减排 ${this.formatNumber(reductionStats.totalReduction)} 吨CO₂。`);
            }
        }

        // 通用建议
        suggestions.push('建议定期监测碳排放数据，及时调整碳资产管理策略。');
        suggestions.push('关注碳市场政策变化，把握碳交易机会。');

        return suggestions;
    },

    /**
     * 显示报表预览
     */
    showPreview(content, title) {
        const previewSection = document.getElementById('reportPreview');
        const previewContent = document.getElementById('previewContent');
        
        if (previewSection && previewContent) {
            previewContent.innerHTML = content;
            previewSection.style.display = 'block';
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * 隐藏报表预览
     */
    hidePreview() {
        const previewSection = document.getElementById('reportPreview');
        if (previewSection) {
            previewSection.style.display = 'none';
        }
    },

    /**
     * 下载当前报表
     */
    downloadCurrentReport() {
        if (!this.currentReportContent) {
            alert('请先生成报表');
            return;
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const reportNames = {
            'quota': '配额管理报表',
            'reduction': '减排成果报表',
            'summary': '综合分析报表'
        };

        const filename = `${reportNames[this.currentReportType] || '报表'}_${dateStr}.html`;
        
        // 生成完整的HTML文档
        const fullHTML = this.generateFullHTML(this.currentReportContent);
        
        // 创建下载
        const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('报表下载成功！', 'success');
    },

    /**
     * 生成完整HTML文档
     */
    generateFullHTML(content) {
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>碳资产报表</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Microsoft YaHei', sans-serif; 
            padding: 40px; 
            background: #fff;
            color: #333;
        }
        .report-container { max-width: 900px; margin: 0 auto; }
        .report-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2e7d32; }
        .report-header h2 { color: #1b5e20; font-size: 1.8rem; margin-bottom: 10px; }
        .report-time { color: #666; font-size: 0.9rem; }
        .report-section { margin-bottom: 30px; }
        .report-section h3 { color: #2e7d32; font-size: 1.2rem; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; }
        .report-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .report-table th, .report-table td { padding: 12px; border: 1px solid #e0e0e0; text-align: left; }
        .report-table th { background: #e8f5e9; color: #1b5e20; font-weight: 500; }
        .report-table tr:nth-child(even) { background: #fafafa; }
        .text-danger { color: #c62828; font-weight: 600; }
        .text-success { color: #2e7d32; font-weight: 600; }
        .warning-row { background: #fff3e0 !important; }
        .success-row { background: #e8f5e9 !important; }
        .total-row { background: #f5f5f5 !important; }
        .no-data { text-align: center; color: #999; padding: 20px; }
        .status-box { padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; }
        .status-warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .status-success { background: #e8f5e9; border-left: 4px solid #4caf50; }
        .status-icon { font-size: 2rem; }
        .status-text { font-size: 1rem; color: #333; }
        .suggestions-box { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .suggestion-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .suggestion-num { 
            background: #2e7d32; 
            color: white; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 0.8rem;
            flex-shrink: 0;
        }
        .suggestion-text { color: #333; line-height: 1.6; }
        .summary-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .summary-card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary-card h4 { color: #2e7d32; margin-bottom: 10px; }
        .summary-card p { margin-bottom: 8px; color: #666; }
        .report-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 0.85rem; }
        @media print {
            body { padding: 20px; }
            .report-section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    },

    /**
     * 格式化数字
     */
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0.00';
        return num.toLocaleString('zh-CN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    },

    /**
     * 显示提示消息
     */
    showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};