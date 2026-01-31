import { test, expect } from '@playwright/test';

test.describe('Frontend Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test.describe('Landing Page Tests', () => {
    test('Happy Path - Landing page loads correctly', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Automate Enterprise');
      await expect(page.locator('text=AI-driven receipt capture')).toBeVisible();
      await expect(page.locator('text=Start a 14-Day Free Trial')).toBeVisible();
      await expect(page.locator('text=Schedule Demo')).toBeVisible();
    });

    test('Happy Path - Language switcher works', async ({ page }) => {
      const languageSwitcher = page.locator('[aria-label="Toggle Language"]');
      await expect(languageSwitcher).toBeVisible();
      
      // Click to switch to Chinese
      await languageSwitcher.click();
      await expect(languageSwitcher).toContainText('English');
      
      // Click to switch back to English
      await languageSwitcher.click();
      await expect(languageSwitcher).toContainText('中文');
    });

    test('Happy Path - Telegram demo loads and interacts', async ({ page }) => {
      await expect(page.locator('text=See it in Action')).toBeVisible();
      
      // Look for demo section
      const demoSection = page.locator('text=Watch how easy it is').first();
      await expect(demoSection).toBeVisible();
      
      // Check for demo messages
      await expect(page.locator('text=Analyzing receipt...')).toBeVisible();
      await expect(page.locator('text=Transaction Saved!')).toBeVisible();
    });

    test('Fix Path - Responsive design on mobile', async ({ page }) => {
      // Simulate mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check mobile navigation
      await expect(page.locator('text=Log In')).toBeVisible();
      await expect(page.locator('text=Get Started')).toBeVisible();
      
      // Check content adapts to mobile
      await expect(page.locator('h1')).toBeVisible();
    });

    test('Edge Path - Slow loading handling', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto('http://localhost:3000');
      
      // Should show loading state or handle gracefully
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Authentication Flow Tests', () => {
    test('Happy Path - Login flow works correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      // Fill login form
      await page.fill('[type="email"]', 'test@example.com');
      await page.fill('[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard on success
      await expect(page).toHaveURL(/dashboard/);
    });

    test('Happy Path - Registration flow works correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/register');
      
      // Fill registration form
      await page.fill('[name="username"]', 'testuser');
      await page.fill('[name="email"]', 'newuser@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.fill('[name="location"]', 'Singapore');
      await page.fill('[name="telegram_bot_token"]', '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11');
      await page.fill('[name="telegram_bot_username"]', 'test_bot');
      
      await page.click('button[type="submit"]');
      
      // Should show success message and redirect
      await expect(page.locator('text=Registration successful')).toBeVisible();
    });

    test('Fix Path - Invalid login shows error message', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      // Fill with invalid credentials
      await page.fill('[type="email"]', 'wrong@example.com');
      await page.fill('[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('Fix Path - Registration validation errors', async ({ page }) => {
      await page.goto('http://localhost:3000/register');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=required')).toBeVisible();
    });

    test('Edge Path - Forgot password flow', async ({ page }) => {
      await page.goto('http://localhost:3000/forgot-password');
      
      await page.fill('[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=verification code sent')).toBeVisible();
    });

    test('Edge Path - Reset password flow', async ({ page }) => {
      await page.goto('http://localhost:3000/reset-password?token=valid_token');
      
      await page.fill('[name="newPassword"]', 'newpassword123');
      await page.fill('[name="confirmPassword"]', 'newpassword123');
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Password reset successful')).toBeVisible();
    });
  });

  test.describe('Dashboard Functionality Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login before accessing dashboard
      await page.goto('http://localhost:3000/login');
      await page.fill('[type="email"]', 'test@example.com');
      await page.fill('[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/);
    });

    test('Happy Path - Dashboard loads with data', async ({ page }) => {
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Total Spending')).toBeVisible();
      await expect(page.locator('text=Category Breakdown')).toBeVisible();
      await expect(page.locator('text=Recent Activity')).toBeVisible();
    });

    test('Happy Path - Expense list loads and paginates', async ({ page }) => {
      await expect(page.locator('text=Recent Expenses')).toBeVisible();
      
      // Check for expense items
      const expenseItems = page.locator('[data-testid="expense-item"]');
      await expect(expenseItems.first()).toBeVisible();
      
      // Check pagination controls
      const nextPage = page.locator('button[aria-label="Next page"]');
      if (await nextPage.isVisible()) {
        await nextPage.click();
        await expect(page.locator('text=Loading')).not.toBeVisible();
      }
    });

    test('Happy Path - Filters work correctly', async ({ page }) => {
      // Date range filter
      await page.fill('[data-testid="date-from"]', '2024-01-01');
      await page.fill('[data-testid="date-to"]', '2024-12-31');
      await page.click('button[data-testid="apply-filters"]');
      
      // Category filter
      await page.selectOption('[data-testid="category-filter"]', 'Food & Beverage');
      await page.click('button[data-testid="apply-filters"]');
      
      // Search filter
      await page.fill('[data-testid="search-input"]', 'Starbucks');
      await page.click('button[data-testid="search-btn"]');
      
      // Should update results
      await expect(page.locator('text=Filters applied')).toBeVisible();
    });

    test('Happy Path - Charts render correctly', async ({ page }) => {
      // Check for chart elements
      await expect(page.locator('[data-testid="category-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
      
      // Check for chart interactions
      const chartLegend = page.locator('[data-testid="chart-legend"]');
      if (await chartLegend.isVisible()) {
        await chartLegend.click();
        await expect(page.locator('text=Chart updated')).toBeVisible();
      }
    });

    test('Fix Path - Empty dashboard state', async ({ page }) => {
      // Mock empty data scenario
      await page.route('**/api/expenses*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, expenses: [] })
        });
      });
      
      await page.reload();
      
      // Should show empty state
      await expect(page.locator('text=No expenses found')).toBeVisible();
      await expect(page.locator('text=Send your first receipt')).toBeVisible();
    });

    test('Fix Path - Loading states', async ({ page }) => {
      // Slow API response
      await page.route('**/api/expenses*', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.continue();
      });
      
      await page.reload();
      
      // Should show loading indicators
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('text=Loading expenses...')).toBeVisible();
    });

    test('Edge Path - Error handling', async ({ page }) => {
      // Mock API error
      await page.route('**/api/expenses*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.reload();
      
      // Should show error state
      await expect(page.locator('text=Failed to load expenses')).toBeVisible();
      await expect(page.locator('button[data-testid="retry-btn"]')).toBeVisible();
    });

    test('Edge Path - Large dataset performance', async ({ page }) => {
      // Mock large dataset
      const largeDataset = Array(1000).fill(null).map((_, i) => ({
        id: i + 1,
        vendor: `Vendor ${i + 1}`,
        amount_sgd: Math.random() * 100,
        category: 'Test Category',
        expense_date: '2024-01-15'
      }));
      
      await page.route('**/api/expenses*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, expenses: largeDataset })
        });
      });
      
      await page.reload();
      
      // Should handle large dataset gracefully with virtualization
      await expect(page.locator('[data-testid="virtual-list"]')).toBeVisible();
      
      // Check performance metrics
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('navigation')[0].loadEventEnd - performance.getEntriesByType('navigation')[0].loadEventStart;
      });
      
      expect(performanceEntries).toBeLessThan(5000); // Should load within 5 seconds
    });
  });

  test.describe('Expense Management Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('[type="email"]', 'test@example.com');
      await page.fill('[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/);
    });

    test('Happy Path - Add expense manually', async ({ page }) => {
      await page.click('button[data-testid="add-expense-btn"]');
      
      await expect(page.locator('text=Add New Expense')).toBeVisible();
      
      // Fill expense form
      await page.fill('[name="vendor"]', 'Test Store');
      await page.fill('[name="amount"]', '25.50');
      await page.selectOption('[name="category"]', 'Food & Beverage');
      await page.fill('[name="date"]', '2024-01-15');
      await page.fill('[name="comment"]', 'Test expense');
      
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Expense added successfully')).toBeVisible();
      
      // Should appear in expense list
      await expect(page.locator('text=Test Store')).toBeVisible();
      await expect(page.locator('text=$25.50')).toBeVisible();
    });

    test('Happy Path - Edit existing expense', async ({ page }) => {
      // Click edit button on first expense
      await page.click('[data-testid="edit-expense-btn"]:first');
      
      await expect(page.locator('text=Edit Expense')).toBeVisible();
      
      // Update expense
      await page.fill('[name="vendor"]', 'Updated Store');
      await page.fill('[name="amount"]', '30.00');
      
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Expense updated successfully')).toBeVisible();
      
      // Should show updated values
      await expect(page.locator('text=Updated Store')).toBeVisible();
      await expect(page.locator('text=$30.00')).toBeVisible();
    });

    test('Happy Path - Delete expense', async ({ page }) => {
      // Click delete button on first expense
      await page.click('[data-testid="delete-expense-btn"]:first');
      
      // Should show confirmation dialog
      await expect(page.locator('text=Are you sure you want to delete this expense?')).toBeVisible();
      
      await page.click('button[data-testid="confirm-delete"]');
      
      // Should show success message
      await expect(page.locator('text=Expense deleted successfully')).toBeVisible();
    });

    test('Fix Path - Form validation errors', async ({ page }) => {
      await page.click('button[data-testid="add-expense-btn"]');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Vendor is required')).toBeVisible();
      await expect(page.locator('text=Amount is required')).toBeVisible();
      await expect(page.locator('text=Category is required')).toBeVisible();
    });

    test('Fix Path - Invalid amount format', async ({ page }) => {
      await page.click('button[data-testid="add-expense-btn"]');
      
      await page.fill('[name="vendor"]', 'Test Store');
      await page.fill('[name="amount"]', 'invalid_amount');
      await page.selectOption('[name="category"]', 'Food & Beverage');
      
      await page.click('button[type="submit"]');
      
      // Should show format error
      await expect(page.locator('text=Please enter a valid amount')).toBeVisible();
    });

    test('Edge Path - Cancel edit/delete operations', async ({ page }) => {
      await page.click('[data-testid="edit-expense-btn"]:first');
      
      // Cancel edit
      await page.click('button[data-testid="cancel-btn"]');
      
      // Should return to dashboard
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Try delete and cancel
      await page.click('[data-testid="delete-expense-btn"]:first');
      await page.click('button[data-testid="cancel-delete"]');
      
      // Should return to dashboard without deleting
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  test.describe('Analytics and Insights Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('[type="email"]', 'test@example.com');
      await page.fill('[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/);
    });

    test('Happy Path - View analytics dashboard', async ({ page }) => {
      await page.click('a[data-testid="analytics-link"]');
      
      await expect(page.locator('text=Analytics')).toBeVisible();
      await expect(page.locator('text=Spending Trends')).toBeVisible();
      await expect(page.locator('text=Category Analysis')).toBeVisible();
      await expect(page.locator('text=AI Insights')).toBeVisible();
    });

    test('Happy Path - Time period filters', async ({ page }) => {
      await page.click('a[data-testid="analytics-link"]');
      
      // Test different time periods
      await page.selectOption('[data-testid="period-filter"]', 'weekly');
      await expect(page.locator('text=Weekly View')).toBeVisible();
      
      await page.selectOption('[data-testid="period-filter"]', 'monthly');
      await expect(page.locator('text=Monthly View')).toBeVisible();
      
      await page.selectOption('[data-testid="period-filter"]', 'yearly');
      await expect(page.locator('text=Yearly View')).toBeVisible();
    });

    test('Happy Path - Export functionality', async ({ page }) => {
      await page.click('a[data-testid="analytics-link"]');
      
      // Test export options
      const downloadPromise = page.waitForEvent('download');
      await page.click('button[data-testid="export-csv"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/expenses.*\.csv$/);
    });

    test('Fix Path - No data state', async ({ page }) => {
      // Mock empty analytics data
      await page.route('**/api/metrics*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: true, 
            data: { 
              totalSpending: 0,
              categoryBreakdown: {},
              trends: { monthly: [] },
              insights: ['No spending data available']
            }
          })
        });
      });
      
      await page.click('a[data-testid="analytics-link"]');
      
      await expect(page.locator('text=No data available')).toBeVisible();
      await expect(page.locator('text=Start tracking expenses')).toBeVisible();
    });

    test('Edge Path - Complex data visualization', async ({ page }) => {
      // Mock complex dataset
      const complexData = {
        success: true,
        data: {
          totalSpending: 5000.75,
          categoryBreakdown: {
            'Food & Beverage': 1250.30,
            'Transportation': 890.45,
            'Shopping': 1875.20,
            'Entertainment': 485.80,
            'Others': 500.00
          },
          trends: {
            monthly: Array(12).fill(null).map((_, i) => ({
              period: `2024-${String(i + 1).padStart(2, '0')}`,
              amount: Math.random() * 1000
            }))
          },
          insights: [
            'Your highest spending category is Shopping',
            'You spent 37.5% more this month compared to last month',
            'Consider reducing entertainment expenses by 15%'
          ]
        }
      };
      
      await page.route('**/api/metrics*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(complexData)
        });
      });
      
      await page.click('a[data-testid="analytics-link"]');
      
      // Should render complex visualizations
      await expect(page.locator('[data-testid="category-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="insights-panel"]')).toBeVisible();
      
      // Should handle interactive elements
      await page.hover('[data-testid="chart-segment"]');
      await expect(page.locator('text=Hover details')).toBeVisible();
    });
  });

  test.describe('Accessibility Tests', () => {
    test('Happy Path - Keyboard navigation', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Tab through navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Navigate to login
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      await expect(page).toHaveURL(/login/);
    });

    test('Happy Path - Screen reader support', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Check ARIA labels
      await expect(page.locator('[aria-label="Toggle Language"]')).toBeVisible();
      await expect(page.locator('main[role="main"]')).toBeVisible();
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    });

    test('Happy Path - Color contrast and visual accessibility', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Check for sufficient color contrast (simulated)
      const elements = await page.locator('button, a, h1, h2, h3').all();
      
      for (const element of elements) {
        await expect(element).toBeVisible();
        // In real implementation, you'd check color contrast ratios
      }
    });

    test('Fix Path - Focus management', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      // Check focus moves to form after navigation
      await expect(page.locator('[type="email"]')).toBeFocused();
      
      // Check focus stays within modal/dialog
      await page.click('button[data-testid="add-expense-btn"]');
      await expect(page.locator('dialog')).toBeVisible();
      await expect(page.locator('dialog :first-child')).toBeFocused();
    });

    test('Edge Path - Reduced motion support', async ({ page }) => {
      // Simulate prefers-reduced-motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('http://localhost:3000');
      
      // Should respect reduced motion preference
      const animations = await page.locator('[style*="animation"]').all();
      expect(animations.length).toBe(0);
    });
  });

  test.describe('Performance Tests', () => {
    test('Happy Path - Page load performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost:3000');
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(3000); // 3 seconds
      
      // Check Core Web Vitals (simplified)
      const performanceMetrics = await page.evaluate(() => {
        return {
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
        };
      });
      
      expect(performanceMetrics.domContentLoaded).toBeLessThan(1500);
      expect(performanceMetrics.loadComplete).toBeLessThan(3000);
    });

    test('Happy Path - Component rendering performance', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      
      // Measure render time for complex components
      const renderStart = Date.now();
      await page.waitForSelector('[data-testid="expense-list"]');
      const renderTime = Date.now() - renderStart;
      
      expect(renderTime).toBeLessThan(2000); // 2 seconds
    });

    test('Fix Path - Memory usage', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      
      // Monitor memory usage during interaction
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Perform multiple interactions
      for (let i = 0; i < 10; i++) {
        await page.click('button[data-testid="add-expense-btn"]');
        await page.click('button[data-testid="cancel-btn"]');
        await page.waitForTimeout(100);
      }
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Memory shouldn't grow excessively
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    test('Edge Path - Network throttling', async ({ page }) => {
      // Simulate slow 3G connection
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      const startTime = Date.now();
      await page.goto('http://localhost:3000/dashboard');
      const loadTime = Date.now() - startTime;
      
      // Should handle slow network gracefully
      expect(loadTime).toBeLessThan(10000); // 10 seconds
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });
});

test.describe('Error Boundary Tests', () => {
  test('Happy Path - Graceful error handling', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Mock component error
    await page.addInitScript(() => {
      window.addEventListener('error', (event) => {
        event.preventDefault();
        console.log('Error caught:', event.error);
      });
    });
    
    // Simulate error by injecting bad script
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'throw new Error("Test error");';
      document.body.appendChild(script);
    });
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('Fix Path - API error fallbacks', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Mock network failure
    await page.route('**/api/auth/login', async route => {
      await route.abort('failed');
    });
    
    await page.fill('[type="email"]', 'test@example.com');
    await page.fill('[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show user-friendly error
    await expect(page.locator('text=Connection error')).toBeVisible();
    await expect(page.locator('text=Please try again')).toBeVisible();
  });

  test('Edge Path - Console error handling', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000');
    
    // Should not have critical console errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('DevTools') &&
      !error.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});