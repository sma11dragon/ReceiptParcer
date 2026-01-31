import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE /api/bots/[id]?userId=...
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const { id: botId } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Ensure the bot belongs to the user before deleting
        const deleteResult = await pool.query(
            'DELETE FROM user_telegram_bots WHERE id = $1 AND user_id = $2 RETURNING id',
            [botId, userId]
        );

        if (deleteResult.rowCount === 0) {
            return NextResponse.json({ error: 'Bot not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Bot deleted successfully'
        });
    } catch (error) {
        console.error('Delete Bot Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
