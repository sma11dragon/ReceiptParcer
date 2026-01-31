import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const botId = searchParams.get('botId');
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Helper to build dynamic WHERE clause
        const buildFilter = (baseIdx: number) => {
            let clause = ' WHERE user_id = $' + baseIdx;
            const params = [userId];
            let idx = baseIdx + 1;

            if (startDate) {
                clause += ` AND expense_date >= $${idx++}`;
                params.push(startDate);
            }
            if (endDate) {
                clause += ` AND expense_date <= $${idx++}`;
                params.push(endDate);
            }
            if (botId) {
                clause += ` AND bot_id = $${idx++}`;
                params.push(botId);
            }
            if (category) {
                clause += ` AND category = $${idx++}`;
                params.push(category);
            }
            if (search) {
                clause += ` AND (vendor ILIKE $${idx} OR comment ILIKE $${idx} OR location ILIKE $${idx})`;
                params.push(`%${search}%`);
                idx++;
            }
            return { clause, params };
        };

        const { clause: filterClause, params: filterParams } = buildFilter(1);

        // 0. All available categories for this user (for the filter dropdown)
        const allCategoriesResult = await pool.query(
            `SELECT DISTINCT category FROM expenses WHERE user_id = $1 AND category IS NOT NULL ORDER BY category ASC`,
            [userId]
        );

        // 1. Total Spending
        const totalResult = await pool.query(
            `SELECT SUM(amount_sgd) as total FROM expenses ${filterClause}`,
            filterParams
        );

        // 2. Spending by Category
        const categoryResult = await pool.query(
            `SELECT category, SUM(amount_sgd) as total FROM expenses ${filterClause} GROUP BY category ORDER BY total DESC`,
            filterParams
        );

        // 3. Automated Trend (Grouping)
        const groupby = searchParams.get('groupby') || 'month'; // 'month', 'year', 'category', 'bot'
        let trendQuery = '';
        if (groupby === 'year') {
            trendQuery = `SELECT TO_CHAR(expense_date, 'YYYY') as label, SUM(amount_sgd) as total, MIN(expense_date) as sort_date FROM expenses ${filterClause} GROUP BY label ORDER BY sort_date ASC`;
        } else if (groupby === 'category') {
            trendQuery = `SELECT category as label, SUM(amount_sgd) as total FROM expenses ${filterClause} GROUP BY label ORDER BY total DESC LIMIT 10`;
        } else if (groupby === 'bot') {
            trendQuery = `SELECT COALESCE(b.bot_username, 'Direct') as label, SUM(e.amount_sgd) as total FROM expenses e LEFT JOIN user_telegram_bots b ON e.bot_id = b.id ${filterClause.replace(/(\s)(user_id|expense_date|bot_id|category|vendor|comment|location)/g, '$1e.$2')} GROUP BY label ORDER BY total DESC`;
        } else {
            trendQuery = `SELECT TO_CHAR(expense_date, 'Mon YYYY') as label, SUM(amount_sgd) as total, MIN(expense_date) as sort_date FROM expenses ${filterClause} GROUP BY label ORDER BY sort_date ASC`;
        }

        const trendResult = await pool.query(trendQuery, filterParams);

        // 4. Bot Metrics
        const botMetricsResult = await pool.query(
            `SELECT COALESCE(b.bot_username, 'Direct/Other') as bot_username, SUM(e.amount_sgd) as total, COUNT(e.id) as count ` +
            `FROM expenses e ` +
            `LEFT JOIN user_telegram_bots b ON e.bot_id = b.id ` +
            `${filterClause.replace(/(\s)(user_id|expense_date|bot_id|category|vendor|comment|location)/g, '$1e.$2')} ` +
            `GROUP BY bot_username ORDER BY total DESC`,
            filterParams
        );

        // 5. Smart Zen Insights
        const insights = [];
        const topCategory = categoryResult.rows[0];
        if (topCategory) {
            const pct = (parseFloat(topCategory.total) / parseFloat(totalResult.rows[0]?.total || '1') * 100).toFixed(0);
            insights.push(`**${topCategory.category}** account for **${pct}%** of your total spending.`);
        }

        // Compare this month with last month
        const monthlyComparison = await pool.query(
            `SELECT 
                SUM(CASE WHEN expense_date >= DATE_TRUNC('month', CURRENT_DATE) THEN amount_sgd ELSE 0 END) as current_month,
                SUM(CASE WHEN expense_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND expense_date < DATE_TRUNC('month', CURRENT_DATE) THEN amount_sgd ELSE 0 END) as last_month
             FROM expenses WHERE user_id = $1`,
            [userId]
        );

        const curr = parseFloat(monthlyComparison.rows[0]?.current_month || '0');
        const prev = parseFloat(monthlyComparison.rows[0]?.last_month || '0');

        if (prev > 0) {
            const diff = ((curr - prev) / prev * 100).toFixed(0);
            const status = curr > prev ? 'increased' : 'decreased';
            insights.push(`Your spending has **${status} by ${Math.abs(Number(diff))}%** compared to last month.`);
        } else if (curr > 0) {
            insights.push(`You've spent **SGD ${curr.toFixed(2)}** so far this month.`);
        }

        const topBot = botMetricsResult.rows[0];
        if (topBot && botMetricsResult.rows.length > 1) {
            insights.push(`**${topBot.bot_username}** is your primary spending channel (**${((topBot.total / totalResult.rows[0]?.total) * 100).toFixed(0)}%**).`);
        }

        return NextResponse.json({
            success: true,
            metrics: {
                totalSpending: parseFloat(totalResult.rows[0]?.total || '0'),
                allCategories: allCategoriesResult.rows.map(r => r.category),
                categoryBreakdown: categoryResult.rows.map(r => ({ ...r, total: parseFloat(r.total || '0') })),
                trend: trendResult.rows.map(r => ({ ...r, total: parseFloat(r.total || '0') })),
                botMetrics: botMetricsResult.rows.map(r => ({ ...r, total: parseFloat(r.total || '0'), count: parseInt(r.count || '0') })),
                insights: insights
            }
        });
    } catch (error) {
        console.error('Get Metrics Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
