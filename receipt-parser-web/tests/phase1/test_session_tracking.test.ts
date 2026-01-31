
import { setupTestUtils } from '../utils';
import { testDb } from '../setup';
import { testUsers } from '../setup';

describe('Phase 1: Session Tracking', () => {
    const { sendReceipt } = setupTestUtils();
    let userId: number;

    beforeAll(async () => {
        // Create a test user
        const result = await testDb.query(
            'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id',
            [testUsers.validUser.email, testUsers.validUser.password, testUsers.validUser.username]
        );
        userId = result.rows[0].id;
    });

    test('Single receipt upload generates UUID session_id and queue_position', async () => {
        const receipt = await sendReceipt(userId, { contentHash: 'hash_test_1' });

        expect(receipt.receipt_session_id).toBeDefined();
        expect(receipt.receipt_session_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        expect(receipt.queue_position).toBeGreaterThan(0);
        expect(receipt.row_version).toBe(1);
    });
});
