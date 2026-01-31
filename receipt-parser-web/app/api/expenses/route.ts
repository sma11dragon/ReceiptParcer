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
        const sortBy = searchParams.get('sortBy') || 'expense_date';
        const sortOrder = searchParams.get('sortOrder') || 'DESC';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        let query = `
            SELECT e.*, b.bot_username 
            FROM expenses e
            LEFT JOIN user_telegram_bots b ON e.bot_id = b.id
            WHERE e.user_id = $1
        `;
        const params: any[] = [userId];
        let paramIdx = 2;

        if (startDate) {
            query += ` AND e.expense_date >= $${paramIdx++}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND e.expense_date <= $${paramIdx++}`;
            params.push(endDate);
        }
        if (botId) {
            query += ` AND e.bot_id = $${paramIdx++}`;
            params.push(botId);
        }
        if (category) {
            query += ` AND e.category = $${paramIdx++}`;
            params.push(category);
        }
        if (search) {
            query += ` AND (e.vendor ILIKE $${paramIdx} OR e.comment ILIKE $${paramIdx} OR e.location ILIKE $${paramIdx})`;
            params.push(`%${search}%`);
            paramIdx++;
        }

        // Validate sortBy to prevent SQL injection
        const allowedSortCols = ['expense_date', 'amount_sgd', 'vendor', 'category', 'created_at'];
        const finalSortBy = (sortBy && allowedSortCols.includes(sortBy)) ? sortBy : 'expense_date';
        const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY e.${finalSortBy} ${finalSortOrder} LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return NextResponse.json({
            success: true,
            expenses: result.rows
        });
    } catch (error) {
        console.error('Get Expenses Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
