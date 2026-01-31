import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const { id: expenseId } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            vendor,
            category,
            amount_sgd,
            expense_date,
            location,
            comment
        } = body;

        // Validate required fields
        if (!vendor || !category || !amount_sgd || !expense_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // First check if expense exists and belongs to user, and get current data
        const checkQuery = 'SELECT id, amount_sgd, exchange_rate FROM expenses WHERE id = $1 AND user_id = $2';
        const checkResult = await pool.query(checkQuery, [expenseId, userId]);

        if (checkResult.rows.length === 0) {
            return NextResponse.json({ error: 'Expense not found or access denied' }, { status: 404 });
        }

        const currentExpense = checkResult.rows[0];
        const newAmountSgd = parseFloat(amount_sgd);
        const exchangeRate = currentExpense.exchange_rate || 1; // Default to 1 if no exchange rate

        // Calculate amount_original: if amount_sgd changed, update amount_original accordingly
        const amountOriginal = currentExpense.amount_sgd !== newAmountSgd
            ? newAmountSgd / exchangeRate
            : currentExpense.amount_sgd / exchangeRate; // Keep existing if amount_sgd didn't change

        // Update only the allowed fields
        const updateQuery = `
            UPDATE expenses
            SET vendor = $1, category = $2, amount_sgd = $3, amount_original = $4, expense_date = $5,
                location = $6, comment = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 AND user_id = $9
        `;

        await pool.query(updateQuery, [
            vendor,
            category,
            newAmountSgd,
            amountOriginal,
            new Date(expense_date),
            location || null,
            comment || null,
            expenseId,
            userId
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Expense Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const { id: expenseId } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Delete the expense (cascade will handle related records)
        const deleteQuery = 'DELETE FROM expenses WHERE id = $1 AND user_id = $2';
        const result = await pool.query(deleteQuery, [expenseId, userId]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Expense not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Expense Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}