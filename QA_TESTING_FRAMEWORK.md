# ReceiptAI QA Testing Framework

## Overview

This comprehensive testing framework provides automated test coverage for the ReceiptAI application, covering all major components and user interactions. The framework is designed to run automatically, provide detailed reporting, and ensure reliable quality assurance.

## 🚀 Quick Start

### Install Dependencies
```bash
cd receipt-parser-web
npm install
```

### Run All Tests
```bash
npm run test              # Run all unit tests
npm run test:api           # Run API tests only
npm run test:ocr           # Run OCR tests only
npm run test:bot           # Run Telegram bot tests only
npm run test:e2e           # Run E2E tests only
npm run test:report        # Generate comprehensive test report
```

### Generate Test Report
```bash
npm run test:report        # Generate HTML/CSV/JSON reports
```

## 📋 Test Categories

### 1. API Tests (`tests/api/`)
- **Authentication Tests**: Login, registration, password reset
- **Expense Management**: CRUD operations, validation, filtering
- **Bot Management**: Create, list, delete Telegram bots
- **Metrics & Analytics**: Data aggregation, insights generation

### 2. OCR Processing Tests (`tests/ocr/`)
- **Happy Path**: Perfect receipt extraction
- **Fix Path**: Partial data extraction, blurry images
- **Edge Path**: No receipt detected, corrupted images, timeouts

### 3. Telegram Bot Tests (`tests/bot/`)
- **Command Processing**: /start, /help, /expenses, /summary
- **Receipt Upload**: Image processing, validation, error handling
- **Natural Language Queries**: Expense questions and responses
- **Interactive Buttons**: Confirmation, editing, deletion

### 4. Frontend E2E Tests (`tests/e2e/`)
- **User Workflows**: Registration, login, dashboard navigation
- **Component Interaction**: Forms, filters, charts, exports
- **Responsive Design**: Mobile, tablet, desktop layouts
- **Accessibility**: Keyboard navigation, screen readers, ARIA

## 🛠 Test Configuration

### Jest Configuration
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "collectCoverageFrom": ["app/**/*.{ts,tsx}", "lib/**/*.{ts}"],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Playwright Configuration
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
  ]
});
```

## 📊 Test Reporting

The framework generates comprehensive reports with:

### HTML Report
- Interactive charts and visualizations
- Test details with failure reasons
- Coverage breakdown by category
- Performance metrics
- Insights and recommendations

### CSV Report
- Machine-readable test results
- Suitable for data analysis
- Integrates with reporting tools

### JSON Report
- Structured data for programmatic access
- CI/CD integration
- Custom report generation

## 🎯 Test Coverage Matrix

| Category | Happy Path | Fix Path | Edge Path | Performance | Security |
|----------|-------------|-----------|-----------|--------------|----------|
| API      | ✅          | ✅        | ✅         | ✅           | ✅       |
| OCR      | ✅          | ✅        | ✅         | ✅           | ✅       |
| Bot      | ✅          | ✅        | ✅         | ✅           | ✅       |
| Frontend | ✅          | ✅        | ✅         | ✅           | ✅       |

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: ReceiptAI CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
```

### Pipeline Stages
1. **Lint & Type Check**: Code quality validation
2. **Unit Tests**: Core functionality verification
3. **API Tests**: Backend endpoint validation
4. **OCR Tests**: Receipt processing verification
5. **Bot Tests**: Telegram interaction verification
6. **E2E Tests**: Full workflow validation
7. **Security Scan**: Vulnerability assessment
8. **Report Generation**: Comprehensive test analysis

## 🚨 Test Scenarios

### API Test Examples

#### Happy Path - Successful Login
```typescript
test('Happy Path - Valid credentials should login successfully', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.user.email).toBe('test@example.com');
});
```

#### Edge Path - SQL Injection Attempt
```typescript
test('Edge Path - SQL injection attempt should be handled safely', async () => {
  const response = await request(app)
    .get('/api/expenses')
    .query({
      userId: '1; DROP TABLE expenses; --'
    });

  expect(response.status).toBe(200);
  // Should handle injection attempt safely
});
```

### OCR Test Examples

#### Happy Path - Perfect Receipt
```typescript
test('Happy Path - Perfect receipt OCR - All fields extracted correctly', async () => {
  const receiptData = {
    vendor: 'Starbucks Coffee',
    amount: 5.40,
    currency: 'SGD',
    date: '2024-01-15'
  };

  const result = await processReceiptImage(testImage, mockBot);
  
  expect(result.success).toBe(true);
  expect(result.expense.needs_review).toBe(false);
});
```

#### Fix Path - Blurry Receipt
```typescript
test('Fix Path - Blurry receipt - Some fields missing', async () => {
  const result = await processReceiptImage(blurryImage, mockBot);
  
  expect(result.success).toBe(true);
  expect(result.expense.needs_review).toBe(true);
  expect(result.warnings).toContain('Low image quality detected');
});
```

### Bot Test Examples

#### Natural Language Query
```typescript
test('Happy Path - Natural language query: "How much did I spend on Starbucks?"', async () => {
  const message = {
    text: 'How much did I spend on Starbucks?',
    from: { id: testUserId },
    chat: { id: testChatId }
  };

  const response = await processTelegramMessage(message, botToken);
  
  expect(response.success).toBe(true);
  expect(mockBot.sendMessage).toHaveBeenCalledWith(
    testChatId,
    expect.stringContaining('You spent $5.40 on Starbucks')
  );
});
```

### E2E Test Examples

#### Complete User Journey
```typescript
test('Happy Path - Complete user registration and first expense', async ({ page }) => {
  await page.goto('/register');
  
  // Fill registration form
  await page.fill('[name="email"]', 'newuser@example.com');
  await page.fill('[name="password"]', 'password123');
  // ... complete form
  
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard
  await expect(page).toHaveURL(/dashboard/);
  
  // Add first expense
  await page.click('[data-testid="add-expense-btn"]');
  // ... complete expense form
});
```

## 📈 Performance Testing

### Load Testing Scenarios
- **Concurrent Users**: 10, 50, 100, 500 users
- **API Response Times**: <200ms for simple queries, <1s for complex analytics
- **Database Performance**: Query optimization, connection pooling
- **Frontend Performance**: Core Web Vitals, bundle size, render times

### Performance Metrics
```typescript
{
  averageTestTime: 1250,        // ms
  slowestTests: [
    { name: 'Complex analytics query', duration: 3200 },
    { name: 'OCR processing large image', duration: 2800 }
  ],
  flakinessRate: 2.1,           // percentage
  memoryUsage: 128,              // MB
  cpuUsage: 45                   // percentage
}
```

## 🔒 Security Testing

### Security Test Scenarios
- **SQL Injection**: Parameterized query validation
- **XSS Protection**: Input sanitization verification
- **Authentication**: Session management, token validation
- **Authorization**: User data isolation, permission checks
- **Data Validation**: Type checking, input constraints
- **Rate Limiting**: DDoS protection, abuse prevention

### Security Test Example
```typescript
test('SQL injection prevention', async () => {
  const maliciousInput = "'; DROP TABLE users; --";
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: maliciousInput, password: 'test' });

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('Invalid input');
  
  // Verify users table still exists
  const usersTable = await db.query("SELECT * FROM users LIMIT 1");
  expect(usersTable.rows).toBeDefined();
});
```

## 🐛 Bug Detection & Reporting

### Automatic Bug Detection
- **Test Failures**: Immediate notification and detailed error reporting
- **Performance Regression**: Automated comparison with baseline metrics
- **Coverage Drops**: Alert when test coverage decreases
- **Security Vulnerabilities**: Integration with security scanning tools

### Bug Report Format
```json
{
  "issueId": "BUG-001",
  "severity": "high",
  "category": "api",
  "testName": "POST /api/auth/login - SQL injection attempt",
  "description": "API endpoint vulnerable to SQL injection",
  "stepsToReproduce": [
    "Send POST request to /api/auth/login",
    "Include malicious SQL in email field",
    "Observe unexpected behavior"
  ],
  "recommendation": "Implement proper input validation and parameterized queries"
}
```

## 📋 Test Data Management

### Test Fixtures
- **User Data**: Valid/invalid users, various roles
- **Expense Data**: Complete/partial expenses, edge cases
- **Receipt Images**: Various qualities, formats, languages
- **Bot Tokens**: Valid/invalid tokens, expired tokens

### Database Isolation
- **Separate Test Database**: Isolated from production data
- **Automatic Cleanup**: Clean state between tests
- **Data Seeding**: Consistent test data setup
- **Transaction Rollback**: Atomic test operations

## 🔧 Custom Test Utilities

### Helper Functions
```typescript
// Database helpers
export async function createTestUser(userData: Partial<User>): Promise<User>
export async function createTestBot(userId: number): Promise<Bot>
export async function createTestExpense(expenseData: Partial<Expense>): Promise<Expense>

// API helpers
export async function authenticateUser(credentials: LoginCredentials): Promise<string>
export async function sendTelegramMessage(message: TelegramMessage): Promise<Response>

// Mock helpers
export function mockOCRService(overrides?: Partial<OCRResponse>): void
export function mockTelegramBot(overrides?: Partial<BotResponse>): void
```

### Custom Matchers
```typescript
expect.extend({
  toBeValidJWT(received) {
    const isValid = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(received);
    return {
      message: () => `expected ${received} to be a valid JWT`,
      pass: isValid
    };
  },
  
  toBeValidExpense(received) {
    const hasRequiredFields = received.vendor && received.amount && received.date;
    return {
      message: () => `expected ${received} to be a valid expense`,
      pass: hasRequiredFields
    };
  }
});
```

## 📊 Reporting Dashboard

### Key Metrics
- **Test Execution Time**: Total and average duration
- **Pass/Fail Rates**: By category and overall
- **Code Coverage**: Lines, branches, functions, statements
- **Performance Trends**: Response times, resource usage
- **Quality Metrics**: Bug density, flakiness rate

### Alerting Rules
- **Critical**: >20% test failure rate
- **Warning**: Coverage drops below 70%
- **Info**: New test flakiness detected

## 🚀 Continuous Improvement

### Test Enhancement
- **Regular Review**: Monthly test effectiveness assessment
- **Coverage Analysis**: Identify untested critical paths
- **Performance Monitoring**: Track test execution trends
- **Tool Updates**: Keep testing tools and libraries current

### Best Practices
- **Test Independence**: No dependencies between tests
- **Deterministic Results**: Consistent outcomes
- **Clear Assertions**: Descriptive error messages
- **Proper Cleanup**: Resource management
- **Documentation**: Test purpose and scope

## 🔍 Troubleshooting

### Common Issues
1. **Database Connection**: Check test database configuration
2. **Mock Failures**: Verify mock setup and teardown
3. **Time Sensitivity**: Use proper date/time mocking
4. **Async Issues**: Proper await/await usage
5. **Environment**: Verify test environment variables

### Debug Tools
- **Jest Debugger**: Node.js debugging for unit tests
- **Playwright Inspector**: Visual debugging for E2E tests
- **Database Logs**: SQL query inspection
- **Network Tracing**: API request/response analysis

---

## 📞 Support

For testing framework questions or issues:
1. Check the troubleshooting guide above
2. Review test logs and error messages
3. Consult the test documentation
4. Contact the QA team for complex issues

**Happy Testing! 🧪**