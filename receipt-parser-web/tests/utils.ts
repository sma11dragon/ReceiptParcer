
import { testDb } from './setup';

export const setupTestUtils = () => {
    // Helper to simulate sending a receipt
    // In integration tests, this might call an API endpoint
    // For now, we mock the database insertion which the API would do
    const sendReceipt = async (userId: number, sessionData: any = {}) => {
        const sessionId = sessionData.sessionId || crypto.randomUUID();
        const contentHash = sessionData.contentHash || 'hash_' + Math.random().toString(36).substring(7);

        // Simulate getting queue position
        const { rows } = await testDb.query('SELECT get_next_receipt_number() as next_pos');
        const queuePosition = rows[0].next_pos;

        // Insert into expenses
        const query = `
      INSERT INTO expenses (
        user_id, 
        receipt_session_id, 
        queue_position, 
        row_version, 
        content_hash,
        expense_date,
        created_at
      ) VALUES ($1, $2, $3, 1, $4, NOW(), NOW())
      RETURNING *
    `;
        const values = [userId, sessionId, queuePosition, contentHash];
        const result = await testDb.query(query, values);
        return result.rows[0];
    };

    // Helper to simulate clicking a button (callback)
    const clickButton = async (sessionId: string, action: string) => {
        // This would normally call the bot webhook with callback_query
        // For database level testing, we verify what the action would do
        // E.g. find expense by session ID
        const query = `SELECT * FROM expenses WHERE receipt_session_id = $1`;
        const result = await testDb.query(query, [sessionId]);
        return result.rows[0];
    };

    return {
        sendReceipt,
        clickButton
    };
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
