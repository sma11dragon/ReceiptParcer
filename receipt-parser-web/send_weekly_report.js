const { Resend } = require('resend');
const { runAnalysis } = require('./analyze_query_logs.js');
const path = require('path');
const fs = require('fs');

async function getEmailConfig() {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const apiKeyMatch = envContent.match(/RESEND_API_KEY=(.+)/);
        const emailFromMatch = envContent.match(/EMAIL_FROM=(.+)/);
        return {
            apiKey: apiKeyMatch ? apiKeyMatch[1].trim().replace(/^["'](.+)["']$/, '$1') : null,
            emailFrom: emailFromMatch ? emailFromMatch[1].trim().replace(/^["'](.+)["']$/, '$1') : 'onboarding@resend.dev'
        };
    }
    return {
        apiKey: process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM || 'onboarding@resend.dev'
    };
}

function formatNumber(num) {
    const n = Number(num);
    if (isNaN(n)) return '0';
    return n.toLocaleString('en-US');
}

function formatPercentage(num) {
    const n = Number(num);
    if (isNaN(n)) return '0.0%';
    return n.toFixed(1) + '%';
}

function generateErrorSummary(data) {
    const { overallStats, emptyQueries, filterPatterns, potentialMisspellings, recommendations } = data;
    
    // Find counts per outcome type
    const success = overallStats.find(row => row.outcome_type === 'success') || { query_count: 0, percentage: 0 };
    const empty = overallStats.find(row => row.outcome_type === 'empty') || { query_count: 0, percentage: 0 };
    const invalid = overallStats.find(row => row.outcome_type === 'invalid') || { query_count: 0, percentage: 0 };
    const ambiguous = overallStats.find(row => row.outcome_type === 'ambiguous') || { query_count: 0, percentage: 0 };
    
    const total = overallStats.reduce((sum, row) => sum + row.query_count, 0);
    
    let summary = `This week, there were ${formatNumber(total)} total queries. `;
    summary += `Success rate: ${formatPercentage(success.percentage)} (${formatNumber(success.query_count)} successful queries). `;
    
    // Error analysis
    const errorTypes = [];
    if (empty.query_count > 0) errorTypes.push(`empty results (${formatNumber(empty.query_count)} queries, ${formatPercentage(empty.percentage)})`);
    if (invalid.query_count > 0) errorTypes.push(`invalid queries (${formatNumber(invalid.query_count)} queries, ${formatPercentage(invalid.percentage)})`);
    if (ambiguous.query_count > 0) errorTypes.push(`ambiguous queries (${formatNumber(ambiguous.query_count)} queries, ${formatPercentage(ambiguous.percentage)})`);
    
    if (errorTypes.length > 0) {
        summary += `The main error types were: ${errorTypes.join(', ')}. `;
    }
    
    // Most common empty result filters
    if (filterPatterns.length > 0) {
        const topFilter = filterPatterns[0];
        const filterDesc = [];
        if (topFilter.location) filterDesc.push(`location "${topFilter.location}"`);
        if (topFilter.category) filterDesc.push(`category "${topFilter.category}"`);
        if (topFilter.vendor) filterDesc.push(`vendor "${topFilter.vendor}"`);
        if (filterDesc.length > 0) {
            summary += `The most frequent filter combination leading to empty results was ${filterDesc.join(', ')} (${topFilter.empty_count} occurrences). `;
        }
    }
    
    // Misspellings
    if (potentialMisspellings.length > 0) {
        const uniqueMisspellings = [...new Set(potentialMisspellings.map(m => m.original))];
        summary += `Detected ${potentialMisspellings.length} potential misspellings including "${uniqueMisspellings.slice(0, 3).join('", "')}". `;
    }
    
    // Recommendations summary
    if (recommendations.length > 0) {
        const recTypes = recommendations.map(rec => rec.type);
        summary += `Key recommendations: ${recTypes.map(t => t.replace('_', ' ')).join(', ')}.`;
    }
    
    return summary;
}

function generateHTMLReport(data) {
    const { overallStats, emptyQueries, potentialMisspellings, filterPatterns, hourlyStats, totalQueries, recommendations } = data;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate success rate
    const successStats = overallStats.find(row => row.outcome_type === 'success') || { query_count: 0, percentage: 0 };
    const emptyStats = overallStats.find(row => row.outcome_type === 'empty') || { query_count: 0, percentage: 0 };
    const invalidStats = overallStats.find(row => row.outcome_type === 'invalid') || { query_count: 0, percentage: 0 };
    const ambiguousStats = overallStats.find(row => row.outcome_type === 'ambiguous') || { query_count: 0, percentage: 0 };
    
    // AI-generated error summary
    const errorSummary = generateErrorSummary(data);
    
    // Generate overall stats table rows
    const overallStatsRows = overallStats.map(row => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: ${row.outcome_type === 'success' ? '#059669' : row.outcome_type === 'empty' ? '#dc2626' : '#6b7280'}">${row.outcome_type.toUpperCase()}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(row.query_count)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.outcome_type === 'success' ? row.avg_results || '0' : '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatPercentage(row.percentage)}</td>
        </tr>
    `).join('');
    
    // Generate empty queries table rows with message_text and outcome_type
    const emptyQueriesRows = emptyQueries.slice(0, 10).map(row => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; max-width: 200px; word-break: break-word;">${(row.message_text || '').substring(0, 100)}${(row.message_text || '').length > 100 ? '...' : ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: ${row.outcome_type === 'empty' ? '#dc2626' : row.outcome_type === 'invalid' ? '#6b7280' : '#f59e0b'}">${row.outcome_type?.toUpperCase() || 'EMPTY'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${JSON.stringify(row.filters_applied || {})}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.result_count}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(row.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
    `).join('');
    
    // Generate misspellings table rows
    const misspellingRows = potentialMisspellings.slice(0, 5).map(item => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.original}</td>
            <td style="border: 1px solid #ddd; padding: 8px; color: #059669;">${item.suggested}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.distance}</td>
            <td style="border: 1px solid #ddd; padding: 8px; max-width: 200px; word-break: break-word;">${item.full_query}</td>
        </tr>
    `).join('');
    
    // Generate filter patterns rows
    const filterPatternRows = filterPatterns.slice(0, 5).map(row => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${row.location || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${row.category || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${row.vendor || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.empty_count}</td>
        </tr>
    `).join('');
    
    // Generate hourly stats rows (show last 12 hours only for weekly)
    const hourlyStatsRows = hourlyStats.slice(0, 12).map(row => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${new Date(row.hour).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.total_queries}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #059669;">${row.successful}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #dc2626;">${row.empty}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: ${row.success_rate >= 70 ? '#059669' : row.success_rate >= 40 ? '#f59e0b' : '#dc2626'}">${row.success_rate}%</td>
        </tr>
    `).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Query Logs Report - ${dateStr}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #8b5cf6; }
        .header h1 { color: #8b5cf6; margin: 0; font-size: 28px; }
        .header p { color: #64748b; margin-top: 5px; font-size: 14px; }
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
        .card.success { border-top: 4px solid #059669; }
        .card.empty { border-top: 4px solid #dc2626; }
        .card.invalid { border-top: 4px solid #6b7280; }
        .card.ambiguous { border-top: 4px solid #f59e0b; }
        .card h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
        .card .value { font-size: 36px; font-weight: bold; margin: 10px 0; }
        .card.success .value { color: #059669; }
        .card.empty .value { color: #dc2626; }
        .card.invalid .value { color: #6b7280; }
        .card.ambiguous .value { color: #f59e0b; }
        .card .percentage { font-size: 14px; color: #94a3b8; }
        .section { background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .section h2 { color: #334155; margin-top: 0; margin-bottom: 20px; font-size: 20px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f8fafc; border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-weight: 600; color: #334155; font-size: 14px; }
        td { border: 1px solid #ddd; padding: 8px; }
        .recommendation { background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 15px; border-radius: 0 8px 8px 0; }
        .recommendation h3 { margin-top: 0; color: #8b5cf6; font-size: 16px; }
        .recommendation ul { margin: 10px 0; padding-left: 20px; }
        .recommendation li { margin-bottom: 5px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
        .no-data { color: #94a3b8; font-style: italic; text-align: center; padding: 20px; }
        .timestamp { text-align: right; font-size: 12px; color: #94a3b8; margin-bottom: 10px; }
        .ai-summary { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0; }
        .ai-summary h3 { margin-top: 0; color: #0ea5e9; font-size: 16px; }
        .ai-summary p { margin: 10px 0; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Weekly Query Logs Analysis</h1>
        <p>Report for the week ending ${dateStr}</p>
        <div class="timestamp">Generated at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })}</div>
    </div>
    
    <div class="ai-summary">
        <h3>🤖 AI-Generated Error Analysis Summary</h3>
        <p>${errorSummary}</p>
    </div>
    
    <div class="summary-cards">
        <div class="card success">
            <h3>Successful Queries</h3>
            <div class="value">${formatNumber(successStats.query_count)}</div>
            <div class="percentage">${formatPercentage(successStats.percentage)} of total</div>
        </div>
        <div class="card empty">
            <h3>Empty Results</h3>
            <div class="value">${formatNumber(emptyStats.query_count)}</div>
            <div class="percentage">${formatPercentage(emptyStats.percentage)} of total</div>
        </div>
        <div class="card invalid">
            <h3>Invalid Queries</h3>
            <div class="value">${formatNumber(invalidStats.query_count)}</div>
            <div class="percentage">${formatPercentage(invalidStats.percentage)} of total</div>
        </div>
        <div class="card ambiguous">
            <h3>Ambiguous Queries</h3>
            <div class="value">${formatNumber(ambiguousStats.query_count)}</div>
            <div class="percentage">${formatPercentage(ambiguousStats.percentage)} of total</div>
        </div>
    </div>
    
    <div class="section">
        <h2>📈 Overall Statistics (Last 7 Days)</h2>
        <table>
            <thead>
                <tr>
                    <th>Outcome Type</th>
                    <th>Query Count</th>
                    <th>Avg Results (Success Only)</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${overallStatsRows}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <h2>⏰ Recent Hourly Success Rate (Last 12 Hours)</h2>
        <table>
            <thead>
                <tr>
                    <th>Hour</th>
                    <th>Total Queries</th>
                    <th>Successful</th>
                    <th>Empty</th>
                    <th>Success Rate</th>
                </tr>
            </thead>
            <tbody>
                ${hourlyStatsRows}
            </tbody>
        </table>
    </div>
    
    ${emptyQueries.length > 0 ? `
    <div class="section">
        <h2>🔍 Recent Empty/Invalid Queries (with Outcome Type)</h2>
        <table>
            <thead>
                <tr>
                    <th>Message Text</th>
                    <th>Outcome Type</th>
                    <th>Filters Applied</th>
                    <th>Results</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody>
                ${emptyQueriesRows}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    ${filterPatterns.length > 0 ? `
    <div class="section">
        <h2>🎯 Common Filters in Empty Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Empty Count</th>
                </tr>
            </thead>
            <tbody>
                ${filterPatternRows}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    ${potentialMisspellings.length > 0 ? `
    <div class="section">
        <h2>✏️ Potential Misspellings Detected</h2>
        <table>
            <thead>
                <tr>
                    <th>Original</th>
                    <th>Suggested Correction</th>
                    <th>Edit Distance</th>
                    <th>Sample Query</th>
                </tr>
            </thead>
            <tbody>
                ${misspellingRows}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    ${recommendations.length > 0 ? `
    <div class="section">
        <h2>✅ Recommendations for Improvement</h2>
        ${recommendations.map(rec => {
            if (rec.type === 'empty_queries') {
                return `
                <div class="recommendation">
                    <h3>Empty Result Queries (${rec.count} queries, ${rec.percentage}% of total)</h3>
                    <p>Consider adding these filters to the classification logic:</p>
                    <ul>
                        ${rec.filters.filter(f => f.location || f.category || f.vendor).map(f => `
                        <li><strong>${f.empty_count} queries with:</strong>
                            ${f.location ? `Location: "${f.location}"` : ''}
                            ${f.category ? `Category: "${f.category}"` : ''}
                            ${f.vendor ? `Vendor: "${f.vendor}"` : ''}
                        </li>
                        `).join('')}
                    </ul>
                </div>
                `;
            } else if (rec.type === 'misspellings') {
                return `
                <div class="recommendation">
                    <h3>Potential Misspellings (${rec.count} detected)</h3>
                    <p>Add to correction dictionary to improve query understanding:</p>
                    <ul>
                        ${rec.corrections.map(c => `<li><code>"${c.original}"</code> → <code>"${c.suggested}"</code></li>`).join('')}
                    </ul>
                </div>
                `;
            } else if (rec.type === 'invalid_queries') {
                return `
                <div class="recommendation">
                    <h3>Invalid Queries (${rec.count} queries, ${rec.percentage}% of total)</h3>
                    <p>Review invalid query patterns to improve intent classification:</p>
                    <p>Consider adding more training examples for the classification model or expanding the list of valid expense-related keywords.</p>
                </div>
                `;
            }
            return '';
        }).join('')}
    </div>
    ` : ''}
    
    <div class="footer">
        <p>This report was automatically generated by the ReceiptAI Query Logs Analysis System.</p>
        <p>To adjust report settings or unsubscribe, please contact the system administrator.</p>
        <p>&copy; ${now.getFullYear()} ReceiptAI Inc. All rights reserved.</p>
    </div>
</body>
</html>
    `;
}

async function sendWeeklyReport() {
    try {
        console.log('📧 Starting weekly query logs report generation...');
        
        // Run analysis for the last 7 days
        console.log('📊 Analyzing query logs from the last 7 days...');
        const analysisData = await runAnalysis({ silent: true, timeInterval: '7 days' });
        
        // Get email configuration
        const config = await getEmailConfig();
        if (!config.apiKey) {
            throw new Error('RESEND_API_KEY not found in .env.local or environment variables');
        }
        
        const resend = new Resend(config.apiKey);
        
        // Generate HTML report
        console.log('📝 Generating HTML report...');
        const htmlContent = generateHTMLReport(analysisData);
        
        // Send email
        console.log(`📤 Sending weekly report to sma11dragon@gmail.com...`);
        const { error } = await resend.emails.send({
            from: `ReceiptAI Weekly Report <${config.emailFrom}>`,
            to: 'sma11dragon@gmail.com',
            subject: `Weekly Query Logs Report - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            html: htmlContent,
        });
        
        if (error) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
        
        console.log('✅ Weekly report sent successfully!');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Failed to send weekly report:', error.message);
        console.error(error);
        return { success: false, error: error.message };
    }
}

// Run if called directly
if (require.main === module) {
    sendWeeklyReport().then(result => {
        if (result.success) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    });
}

module.exports = { sendWeeklyReport };