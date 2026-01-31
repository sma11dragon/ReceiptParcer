const fs = require('fs');
const path = require('path');

class TestReportGenerator {
  constructor() {
    this.results = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        coverage: {
          lines: 0,
          functions: 0,
          branches: 0,
          statements: 0
        },
        executionTime: 0,
        timestamp: new Date().toISOString()
      },
      categories: {
        api: { total: 0, passed: 0, failed: 0, issues: [] },
        ocr: { total: 0, passed: 0, failed: 0, issues: [] },
        bot: { total: 0, passed: 0, failed: 0, issues: [] },
        frontend: { total: 0, passed: 0, failed: 0, issues: [] },
        e2e: { total: 0, passed: 0, failed: 0, issues: [] }
      },
      testCases: [],
      performanceMetrics: {},
      issues: [],
      recommendations: []
    };
  }

  async generateReport() {
    console.log('🚀 Generating comprehensive test report...');
    
    // Collect Jest test results
    await this.collectJestResults();
    
    // Collect Playwright E2E results
    await this.collectPlaywrightResults();
    
    // Collect coverage data
    await this.collectCoverageData();
    
    // Analyze performance metrics
    await this.analyzePerformanceMetrics();
    
    // Generate insights and recommendations
    await this.generateInsights();
    
    // Generate HTML report
    await this.generateHTMLReport();
    
    // Generate CSV report
    await this.generateCSVReport();
    
    // Generate JSON report
    await this.generateJSONReport();
    
    console.log('✅ Test report generated successfully!');
    console.log('📊 HTML Report: tests/reports/report.html');
    console.log('📈 Summary: See details below\n');
    
    this.printSummary();
  }

  async collectJestResults() {
    try {
      const jestResultsPath = path.join(__dirname, '../coverage/coverage-summary.json');
      if (fs.existsSync(jestResultsPath)) {
        const coverageData = JSON.parse(fs.readFileSync(jestResultsPath, 'utf8'));
        this.results.coverage = {
          lines: coverageData.total.lines.pct,
          functions: coverageData.total.functions.pct,
          branches: coverageData.total.branches.pct,
          statements: coverageData.total.statements.pct
        };
      }

      // Run Jest to get test results
      const { execSync } = require('child_process');
      try {
        const jestOutput = execSync('npm test -- --json --outputFile=test-results.json', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        if (fs.existsSync('test-results.json')) {
          const jestResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
          this.processJestResults(jestResults);
        }
      } catch (error) {
        console.warn('Warning: Could not collect Jest results:', error.message);
      }
    } catch (error) {
      console.warn('Warning: Could not collect Jest results:', error.message);
    }
  }

  async collectPlaywrightResults() {
    try {
      const playwrightResultsPath = path.join(__dirname, '../e2e-results/results.json');
      if (fs.existsSync(playwrightResultsPath)) {
        const playwrightData = JSON.parse(fs.readFileSync(playwrightResultsPath, 'utf8'));
        this.processPlaywrightResults(playwrightData);
      }
    } catch (error) {
      console.warn('Warning: Could not collect Playwright results:', error.message);
    }
  }

  async collectCoverageData() {
    // Collect detailed coverage breakdown by category
    const coveragePath = path.join(__dirname, '../coverage/coverage-final.json');
    if (fs.existsSync(coveragePath)) {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      this.analyzeCoverageByCategory(coverageData);
    }
  }

  async analyzePerformanceMetrics() {
    try {
      // Analyze test execution times
      this.performanceMetrics = {
        averageTestTime: this.calculateAverageTestTime(),
        slowestTests: this.getSlowestTests(),
        testFlakiness: this.analyzeTestFlakiness(),
        resourceUsage: this.estimateResourceUsage()
      };
    } catch (error) {
      console.warn('Warning: Could not analyze performance metrics:', error.message);
    }
  }

  processJestResults(jestResults) {
    const testSuites = jestResults.testResults || [];
    
    testSuites.forEach(suite => {
      const category = this.categorizeTestSuite(suite.name);
      
      suite.assertionResults.forEach(test => {
        const testCase = {
          name: test.title,
          suite: suite.name,
          category: category,
          status: test.status,
          duration: test.duration || 0,
          failure: test.failureMessages ? test.failureMessages[0] : null,
          path: suite.name,
          type: 'unit'
        };
        
        this.results.testCases.push(testCase);
        this.updateCategoryStats(category, test.status);
        this.updateOverallStats(test.status);
      });
    });
  }

  processPlaywrightResults(playwrightData) {
    const specs = playwrightData.suites || [];
    
    specs.forEach(spec => {
      spec.specs.forEach(test => {
        const testCase = {
          name: test.title,
          suite: spec.file,
          category: 'e2e',
          status: test.results[0]?.status === 'passed' ? 'passed' : 'failed',
          duration: test.results[0]?.duration || 0,
          failure: test.results[0]?.error?.message || null,
          path: spec.file,
          type: 'e2e'
        };
        
        this.results.testCases.push(testCase);
        this.updateCategoryStats('e2e', testCase.status);
        this.updateOverallStats(testCase.status);
      });
    });
  }

  categorizeTestSuite(suiteName) {
    if (suiteName.includes('auth')) return 'api';
    if (suiteName.includes('expenses')) return 'api';
    if (suiteName.includes('bots')) return 'api';
    if (suiteName.includes('metrics')) return 'api';
    if (suiteName.includes('ocr')) return 'ocr';
    if (suiteName.includes('telegram')) return 'bot';
    if (suiteName.includes('frontend')) return 'frontend';
    return 'unit';
  }

  updateCategoryStats(category, status) {
    if (this.results.categories[category]) {
      this.results.categories[category].total++;
      if (status === 'passed') {
        this.results.categories[category].passed++;
      } else if (status === 'failed') {
        this.results.categories[category].failed++;
      }
    }
  }

  updateOverallStats(status) {
    this.results.summary.totalTests++;
    if (status === 'passed') {
      this.results.summary.passedTests++;
    } else if (status === 'failed') {
      this.results.summary.failedTests++;
    } else if (status === 'pending') {
      this.results.summary.skippedTests++;
    }
  }

  analyzeCoverageByCategory(coverageData) {
    const categoryCoverage = {
      api: { files: [], coverage: 0 },
      ocr: { files: [], coverage: 0 },
      bot: { files: [], coverage: 0 },
      frontend: { files: [], coverage: 0 },
      lib: { files: [], coverage: 0 }
    };

    Object.keys(coverageData).forEach(filePath => {
      const fileData = coverageData[filePath];
      const coverage = this.calculateFileCoverage(fileData);
      
      if (filePath.includes('/api/')) {
        categoryCoverage.api.files.push({ path: filePath, coverage });
      } else if (filePath.includes('/ocr/') || filePath.includes('ocr')) {
        categoryCoverage.ocr.files.push({ path: filePath, coverage });
      } else if (filePath.includes('/bot/') || filePath.includes('telegram')) {
        categoryCoverage.bot.files.push({ path: filePath, coverage });
      } else if (filePath.includes('/app/') || filePath.includes('/components/')) {
        categoryCoverage.frontend.files.push({ path: filePath, coverage });
      } else if (filePath.includes('/lib/')) {
        categoryCoverage.lib.files.push({ path: filePath, coverage });
      }
    });

    // Calculate average coverage per category
    Object.keys(categoryCoverage).forEach(category => {
      const files = categoryCoverage[category].files;
      if (files.length > 0) {
        categoryCoverage[category].coverage = files.reduce((sum, file) => sum + file.coverage, 0) / files.length;
      }
    });

    this.results.categoryCoverage = categoryCoverage;
  }

  calculateFileCoverage(fileData) {
    const statements = fileData.s;
    const coveredStatements = Object.values(statements).filter(s => s > 0).length;
    return (coveredStatements / Object.keys(statements).length) * 100;
  }

  generateInsights() {
    // Generate insights based on test results and coverage
    const insights = [];
    
    // Coverage insights
    if (this.results.coverage.lines < 80) {
      insights.push({
        type: 'coverage',
        severity: 'high',
        title: 'Low Test Coverage',
        description: `Overall coverage is ${this.results.coverage.lines.toFixed(1)}%. Target: 80%+`,
        recommendation: 'Add more unit tests for uncovered code paths'
      });
    }

    // Failure rate insights
    const failureRate = (this.results.summary.failedTests / this.results.summary.totalTests) * 100;
    if (failureRate > 10) {
      insights.push({
        type: 'quality',
        severity: 'high',
        title: 'High Test Failure Rate',
        description: `${failureRate.toFixed(1)}% of tests are failing`,
        recommendation: 'Review and fix failing tests before proceeding with deployment'
      });
    }

    // Performance insights
    if (this.performanceMetrics.averageTestTime && this.performanceMetrics.averageTestTime > 2000) {
      insights.push({
        type: 'performance',
        severity: 'medium',
        title: 'Slow Test Execution',
        description: `Average test time is ${(this.performanceMetrics.averageTestTime / 1000).toFixed(1)}s`,
        recommendation: 'Consider optimizing test setup and mocking expensive operations'
      });
    }

    // Category-specific insights
    Object.keys(this.results.categories).forEach(category => {
      const catStats = this.results.categories[category];
      if (catStats.failed > 0) {
        insights.push({
          type: 'category',
          severity: 'medium',
          title: `Issues in ${category.toUpperCase()} tests`,
          description: `${catStats.failed} out of ${catStats.total} tests failing`,
          recommendation: `Review ${category} implementation and test cases`
        });
      }
    });

    this.results.insights = insights;
  }

  calculateAverageTestTime() {
    if (this.results.testCases.length === 0) return 0;
    const totalTime = this.results.testCases.reduce((sum, test) => sum + test.duration, 0);
    return totalTime / this.results.testCases.length;
  }

  getSlowestTests() {
    return this.results.testCases
      .filter(test => test.duration > 0)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(test => ({
        name: test.name,
        category: test.category,
        duration: test.duration
      }));
  }

  analyzeTestFlakiness() {
    // Simplified flakiness analysis - in real implementation, would track historical data
    return {
      flakyTests: this.results.testCases.filter(test => test.status === 'failed').length,
      flakinessRate: (this.results.summary.failedTests / this.results.summary.totalTests) * 100
    };
  }

  estimateResourceUsage() {
    return {
      memoryUsage: 'Unknown',
      cpuUsage: 'Unknown',
      diskSpace: fs.statSync('.').size
    };
  }

  async generateHTMLReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReceiptAI Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric { text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .metric-label { color: #666; font-size: 0.9em; }
        .chart-container { margin: 30px 0; }
        .test-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .test-details th, .test-details td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .test-details th { background: #f8f9fa; font-weight: 600; }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .status-skipped { color: #ffc107; font-weight: bold; }
        .insights { margin: 30px 0; }
        .insight { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .insight-high { border-left: 4px solid #dc3545; background: #f8d7da; }
        .insight-medium { border-left: 4px solid #ffc107; background: #fff3cd; }
        .insight-low { border-left: 4px solid #28a745; background: #d4edda; }
        .progress-bar { background: #e9ecef; border-radius: 10px; overflow: hidden; height: 20px; margin: 10px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 ReceiptAI Test Report</h1>
            <p>Generated on ${this.results.summary.timestamp}</p>
        </div>

        <div class="summary-grid">
            <div class="card metric">
                <div class="metric-value">${this.results.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="card metric">
                <div class="metric-value status-passed">${this.results.summary.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="card metric">
                <div class="metric-value status-failed">${this.results.summary.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="card metric">
                <div class="metric-value">${this.results.coverage.lines.toFixed(1)}%</div>
                <div class="metric-label">Code Coverage</div>
            </div>
        </div>

        <div class="card">
            <h2>📊 Test Results by Category</h2>
            <div class="chart-container">
                <canvas id="categoryChart"></canvas>
            </div>
        </div>

        <div class="card">
            <h2>📈 Coverage Breakdown</h2>
            <div class="chart-container">
                <canvas id="coverageChart"></canvas>
            </div>
        </div>

        <div class="card insights">
            <h2>💡 Insights & Recommendations</h2>
            ${this.results.insights ? this.results.insights.map(insight => `
                <div class="insight insight-${insight.severity}">
                    <h3>${insight.title}</h3>
                    <p>${insight.description}</p>
                    <p><strong>Recommendation:</strong> ${insight.recommendation}</p>
                </div>
            `).join('') : '<p>No insights available.</p>'}
        </div>

        <div class="card">
            <h2>📋 Test Details</h2>
            <table class="test-details">
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Duration (ms)</th>
                        <th>Failure Reason</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.results.testCases.map(test => `
                        <tr>
                            <td>${test.name}</td>
                            <td>${test.category}</td>
                            <td class="status-${test.status}">${test.status.toUpperCase()}</td>
                            <td>${test.duration}</td>
                            <td>${test.failure || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${this.performanceMetrics.averageTestTime ? `
        <div class="card">
            <h2>⚡ Performance Metrics</h2>
            <div class="summary-grid">
                <div class="card metric">
                    <div class="metric-value">${(this.performanceMetrics.averageTestTime / 1000).toFixed(2)}s</div>
                    <div class="metric-label">Avg Test Time</div>
                </div>
                <div class="card metric">
                    <div class="metric-value">${this.performanceMetrics.testFlakiness.flakinessRate.toFixed(1)}%</div>
                    <div class="metric-label">Flakiness Rate</div>
                </div>
            </div>
        </div>
        ` : ''}
    </div>

    <script>
        // Category Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(this.results.categories))},
                datasets: [{
                    label: 'Passed',
                    data: ${JSON.stringify(Object.values(this.results.categories).map(c => c.passed))},
                    backgroundColor: '#28a745'
                }, {
                    label: 'Failed',
                    data: ${JSON.stringify(Object.values(this.results.categories).map(c => c.failed))},
                    backgroundColor: '#dc3545'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });

        // Coverage Chart
        const coverageCtx = document.getElementById('coverageChart').getContext('2d');
        new Chart(coverageCtx, {
            type: 'radar',
            data: {
                labels: ['Lines', 'Functions', 'Branches', 'Statements'],
                datasets: [{
                    label: 'Coverage %',
                    data: ${JSON.stringify([
                        this.results.coverage.lines,
                        this.results.coverage.functions,
                        this.results.coverage.branches,
                        this.results.coverage.statements
                    ])},
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(reportsDir, 'report.html'), htmlTemplate);
  }

  async generateCSVReport() {
    const csvHeader = 'Test Name,Category,Status,Duration,Failure Reason\n';
    const csvData = this.results.testCases.map(test => 
      `"${test.name}","${test.category}","${test.status}",${test.duration},"${test.failure || ''}"`
    ).join('\n');
    
    const reportsDir = path.join(__dirname, '../reports');
    fs.writeFileSync(path.join(reportsDir, 'test-results.csv'), csvHeader + csvData);
  }

  async generateJSONReport() {
    const reportsDir = path.join(__dirname, '../reports');
    fs.writeFileSync(
      path.join(reportsDir, 'test-results.json'),
      JSON.stringify(this.results, null, 2)
    );
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n📋 Overall Results:`);
    console.log(`   Total Tests: ${this.results.summary.totalTests}`);
    console.log(`   ✅ Passed: ${this.results.summary.passedTests}`);
    console.log(`   ❌ Failed: ${this.results.summary.failedTests}`);
    console.log(`   ⏭️  Skipped: ${this.results.summary.skippedTests}`);
    
    const passRate = this.results.summary.totalTests > 0 
      ? ((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1)
      : 0;
    console.log(`   📈 Pass Rate: ${passRate}%`);
    
    console.log(`\n📂 Results by Category:`);
    Object.keys(this.results.categories).forEach(category => {
      const stats = this.results.categories[category];
      const catPassRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
      console.log(`   ${category.toUpperCase()}: ${stats.passed}/${stats.total} (${catPassRate}%)`);
    });
    
    console.log(`\n📊 Code Coverage:`);
    console.log(`   Lines: ${this.results.coverage.lines.toFixed(1)}%`);
    console.log(`   Functions: ${this.results.coverage.functions.toFixed(1)}%`);
    console.log(`   Branches: ${this.results.coverage.branches.toFixed(1)}%`);
    console.log(`   Statements: ${this.results.coverage.statements.toFixed(1)}%`);
    
    if (this.performanceMetrics.averageTestTime) {
      console.log(`\n⚡ Performance:`);
      console.log(`   Avg Test Time: ${(this.performanceMetrics.averageTestTime / 1000).toFixed(2)}s`);
      console.log(`   Flakiness Rate: ${this.performanceMetrics.testFlakiness.flakinessRate.toFixed(1)}%`);
    }
    
    if (this.results.insights && this.results.insights.length > 0) {
      console.log(`\n💡 Key Insights:`);
      this.results.insights.forEach((insight, index) => {
        const icon = insight.severity === 'high' ? '🔴' : insight.severity === 'medium' ? '🟡' : '🟢';
        console.log(`   ${icon} ${index + 1}. ${insight.title}`);
        console.log(`      ${insight.description}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Generate report if run directly
if (require.main === module) {
  const generator = new TestReportGenerator();
  generator.generateReport().catch(console.error);
}

module.exports = TestReportGenerator;